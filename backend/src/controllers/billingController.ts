import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { BillingWorkflowController } from './billingWorkflowController';

export const BillingController = {
  /**
   * Run automated monthly billing cycle:
   * 1. Detect active subscriptions with no invoice for the current period.
   * 2. Auto-generate draft invoices with invoice items.
   * 3. Apply 5% late penalties for invoices validated but unpaid for over 15 days.
   * 4. Automatically suspend accounts with outstanding debts over 30 days.
   */
  async runBillingCycle(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const now = new Date();

      // Current billing period bounds
      const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Period label (e.g. "Juin 2026")
      const monthLabel = now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

      // 1. SELECT ACTIVE SUBSCRIPTIONS
      const activeSubscriptions = await prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { customer: true, plan: true }
      });

      let invoicesGeneratedCount = 0;
      let totalBilledVal = 0;

      for (const sub of activeSubscriptions) {
        // Query if an invoice already exists for this subscription in the current month
        const hasInvoice = await prisma.invoice.findFirst({
          where: {
            subscriptionId: sub.id,
            billingPeriodStart: { gte: billingPeriodStart },
            billingPeriodEnd: { lte: billingPeriodEnd }
          }
        });

        if (!hasInvoice) {
          const planAmount = Number(sub.plan.price);

          const draftInvoice = await prisma.invoice.create({
            data: {
              customerId: sub.customerId,
              subscriptionId: sub.id,
              amount: planAmount,
              dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000), // 15 Days grace
              status: 'DRAFT',
              billingPeriodStart,
              billingPeriodEnd
            }
          });

          // Create localized item
          await prisma.invoiceItem.create({
            data: {
              invoiceId: draftInvoice.id,
              description: `Redevance mensuelle d’exploitation d’assainissement (${sub.plan.name}) - Période de ${monthLabel}`,
              quantity: 1,
              unitPrice: planAmount,
              amount: planAmount
            }
          });

          // Log Audit Trail
          await BillingWorkflowController.logAudit(
            prisma,
            null,
            'INVOICE_CREATE',
            `Génération automatique de facture brouillon ${draftInvoice.id} pour l'abonnement ${sub.id} (${sub.customer.name})`,
            '',
            JSON.stringify(draftInvoice)
          );

          invoicesGeneratedCount++;
          totalBilledVal += planAmount;
        }
      }

      // 2. DETECT LATE PAYMENTS & APPLY 5% PENALTY
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 3600 * 1000);
      const unpaidPastGraceInvoices = await prisma.invoice.findMany({
        where: {
          status: { in: ['VALIDATED', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { lt: fifteenDaysAgo }
        },
        include: { customer: true, items: true }
      });

      let penalitiesAppliedCount = 0;
      let totalPenalitiesCharge = 0;

      for (const inv of unpaidPastGraceInvoices) {
        // Find if a penalty item was already generated
        const hasPenalty = inv.items.some(item => item.description.includes('Pénalité'));
        if (!hasPenalty) {
          const penaltyFee = Math.round(Number(inv.amount) * 0.05); // 5% penalty
          const updatedAmount = Number(inv.amount) + penaltyFee;

          // Process DB Updates
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              amount: updatedAmount,
              status: 'OVERDUE' // Transition to explicit overdue
            }
          });

          // Append subitem penalty line
          await prisma.invoiceItem.create({
            data: {
              invoiceId: inv.id,
              description: 'Pénalité de retard réglementaire (5% au-delà de 15 jours)',
              quantity: 1,
              unitPrice: penaltyFee,
              amount: penaltyFee
            }
          });

          // Update Customer balance
          await prisma.customer.update({
            where: { id: inv.customerId },
            data: { balance: { increment: penaltyFee } }
          });

          // Log Audit trail
          await BillingWorkflowController.logAudit(
            prisma,
            null,
            'INVOICE_PENALTY_APPLIED',
            `Application de 5% de pénalité de retard (+${penaltyFee} FCFA) sur la facture impayée ${inv.id} (${inv.customer.name})`,
            JSON.stringify({ id: inv.id, amount: inv.amount }),
            JSON.stringify({ id: inv.id, amount: updatedAmount })
          );

          penalitiesAppliedCount++;
          totalPenalitiesCharge += penaltyFee;
        }
      }

      // 3. AUTO SUSPEND ACCOUNTS BEYOND 30 DAYS OF ARREARS
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      const heavilyArrearInvoices = await prisma.invoice.findMany({
        where: {
          status: { in: ['VALIDATED', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { lt: thirtyDaysAgo }
        },
        include: { customer: true }
      });

      let suspendedAccountsCount = 0;
      const suspendedLogs: string[] = [];

      for (const inv of heavilyArrearInvoices) {
        const subId = inv.subscriptionId;
        if (subId) {
          const subscription = await prisma.subscription.findUnique({
            where: { id: subId }
          });

          if (subscription && subscription.status === 'ACTIVE') {
            // Suspend subscription
            await prisma.subscription.update({
              where: { id: subId },
              data: { status: 'SUSPENDED' }
            });

            // Suspend customer
            await prisma.customer.update({
              where: { id: inv.customerId },
              data: { status: 'SUSPENDED' }
            });

            // Log Audit trail
            await BillingWorkflowController.logAudit(
              prisma,
              null,
              'SUBSCRIBER_SUSPENDED_AUTOMATIC',
              `Suspension de l'accès collecte pour l'abonné ${inv.customer.name} (Facture ${inv.id} en retard de plus de 30 jours)`,
              'ACTIVE',
              'SUSPENDED'
            );

            suspendedAccountsCount++;
            suspendedLogs.push(inv.customer.name);
          }
        }
      }

      res.json({
        success: true,
        message: 'Le cycle automatisé de facturation et de recouvrement AKPBF a été exécuté.',
        statistics: {
          invoicesGenerated: invoicesGeneratedCount,
          totalBilled: totalBilledVal,
          penaltiesApplied: penalitiesAppliedCount,
          penaltiesRecovered: totalPenalitiesCharge,
          suspendedAccountsCount,
          suspendedSubscribers: suspendedLogs,
          cycleDate: now.toISOString()
        }
      });
    } catch (err: any) {
      console.error('Core Billing Cycle Error:', err);
      res.status(500).json({ error: 'Échec de l\'exécution du cycle de facturation d’exploitation.' });
    }
  },

  /**
   * Get dynamic list of debts and automatic calculations
   */
  async getUnpaidDebts(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const now = new Date();

      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: { in: ['VALIDATED', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { lt: now }
        },
        include: { customer: true }
      });

      const debts = overdueInvoices.map(inv => {
        const daysPastDue = Math.max(0, Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 3600 * 24)));
        const originalAmount = Number(inv.amount);
        const penaltyCharge = Math.round(originalAmount * 0.05); // 5% calculated virtual indicator

        return {
          id: `DEB-${inv.id.substring(0, 8).toUpperCase()}`,
          invoiceId: inv.id,
          subscriberId: inv.customer?.subscriberId || inv.customerId,
          subscriberName: inv.customer?.name || 'Abonné Inconnu',
          originalAmount,
          penaltyCharge: daysPastDue > 15 ? penaltyCharge : 0,
          totalDue: daysPastDue > 15 ? originalAmount + penaltyCharge : originalAmount,
          daysPastDue,
          status: daysPastDue > 30 ? 'SUSPENDED_MANDATORY' : 'WARNING_LEVEL_1',
          notificationLogs: [
            `Rappel SMS en attente d’acheminement - Retard supérieur à ${daysPastDue} jours`
          ]
        };
      });

      res.json({ success: true, count: debts.length, debts });
    } catch (err) {
      console.error('Failed to get unpaid debts:', err);
      res.status(500).json({ error: 'Impossible de récupérer la liste des impayés municipaux.' });
    }
  },

  /**
   * Force automatic suspension check
   */
  async triggerAutoSuspensions(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

      const heavilyArrearInvoices = await prisma.invoice.findMany({
        where: {
          status: { in: ['VALIDATED', 'PARTIALLY_PAID', 'OVERDUE'] },
          dueDate: { lt: thirtyDaysAgo }
        },
        include: { customer: true }
      });

      const affectedSubscribers: string[] = [];

      for (const inv of heavilyArrearInvoices) {
        const subId = inv.subscriptionId;
        if (subId) {
          const subscription = await prisma.subscription.findUnique({ where: { id: subId } });
          if (subscription && subscription.status === 'ACTIVE') {
            await prisma.subscription.update({
              where: { id: subId },
              data: { status: 'SUSPENDED' }
            });

            await prisma.customer.update({
              where: { id: inv.customerId },
              data: { status: 'SUSPENDED' }
            });

            affectedSubscribers.push(inv.customer.name);

            await BillingWorkflowController.logAudit(
              prisma,
              null,
              'SUBSCRIBER_SUSPENDED_MANUAL_TRIGGER',
              `Suspension forcée manuellement de la collecte pour ${inv.customer.name} (Retard excessif factures)`,
              'ACTIVE',
              'SUSPENDED'
            );
          }
        }
      }

      res.json({
        success: true,
        affectedSubscribers,
        reason: 'Plus de 30 jours de retard constaté de paiement de la redevance salubrité (Déclenchement Forcé).',
        timestamp: now.toISOString()
      });
    } catch (err: any) {
      console.error('Failed to execute forced suspensions cycle:', err);
      res.status(500).json({ error: 'Échec de suspension automatique forcée.' });
    }
  }
};
