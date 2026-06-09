import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { AccountingService } from '../modules/accounting/services/accountingService';
import crypto from 'crypto';

export const BillingWorkflowController = {
  /**
   * Helper: Log audit trail to both Postgres and the ERP JSON logs setting
   */
  async logAudit(
    prisma: any,
    userId: string | null,
    action: string,
    details: string,
    oldValue?: string,
    newValue?: string,
    ipAddress?: string
  ) {
    try {
      // 1. Write to PostgreSQL relational table
      const rawLog = await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action,
          details,
          oldValue: oldValue || null,
          newValue: newValue || null,
          ipAddress: ipAddress || '127.0.0.1'
        }
      });

      // 2. Fetch and synchronize setting-based ERP JSON audit logs
      const setting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_AUDIT_LOGS' } });
      const logs = setting ? JSON.parse(setting.value) : [];
      logs.unshift({
        id: rawLog.id,
        userId: userId || 'ERP_SYSTEM_WORKER',
        action,
        details,
        oldValue: oldValue || '',
        newValue: newValue || '',
        ipAddress: ipAddress || '127.0.0.1',
        createdAt: new Date().toISOString()
      });
      // Limit logs size to avoid massive database blocks
      if (logs.length > 500) logs.pop();

      await prisma.setting.upsert({
        where: { key: 'AKPBF_ERP_AUDIT_LOGS' },
        update: { value: JSON.stringify(logs) },
        create: {
          key: 'AKPBF_ERP_AUDIT_LOGS',
          value: JSON.stringify(logs),
          desc: 'Audit ERP log trails container'
        }
      });
    } catch (e) {
      console.error('[AUDIT LOGGER FAILURE]:', e);
    }
  },

  /**
   * Helper: Record automatic bookkeeping records in the AccountingEntry relational database
   */
  async recordAccountingEntry(
    prisma: any,
    reference: string,
    description: string,
    debitAccount: string,
    creditAccount: string,
    amount: number,
    invoiceId?: string,
    paymentId?: string,
    operator?: string
  ) {
    try {
      await prisma.accountingEntry.create({
        data: {
          reference,
          description,
          debitAccount,
          creditAccount,
          amount,
          invoiceId: invoiceId || null,
          paymentId: paymentId || null,
          operator: operator || 'Système ERP'
        }
      });
    } catch (e) {
      console.error('[ACCOUNTING_RELATIONAL_ENTRY_FAILURE]:', e);
    }
  },

  /**
   * POST /invoices - Creates a new draft invoice
   */
  async createInvoice(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { customerId, subscriptionId, amount, dueDate, billingPeriodStart, billingPeriodEnd, items } = req.body;

      if (!customerId || !amount) {
        res.status(400).json({ error: 'L’Identifiant de l’abonné et le montant brut sont requis.' });
        return;
      }

      let customer = null;
      if (customerId && customerId.length === 36) {
        customer = await prisma.customer.findUnique({
          where: { id: customerId }
        });
      }
      if (!customer && customerId) {
        customer = await prisma.customer.findUnique({
          where: { subscriberId: customerId }
        });
      }

      if (!customer) {
        res.status(404).json({ error: 'Abonné introuvable en base.' });
        return;
      }

      // Resolve the customer's active subscription if none was supplied
      let resolvedSubId = subscriptionId;
      if (!resolvedSubId) {
        const activeSub = await prisma.subscription.findFirst({
          where: { customerId: customer.id, status: 'ACTIVE' }
        });
        resolvedSubId = activeSub ? activeSub.id : null;
      }

      const invoiceAmount = Number(amount);
      const invoice = await prisma.invoice.create({
        data: {
          customerId: customer.id,
          subscriptionId: resolvedSubId || null,
          amount: invoiceAmount,
          dueDate: new Date(dueDate || Date.now() + 15 * 24 * 3600 * 1000),
          status: 'DRAFT',
          billingPeriodStart: new Date(billingPeriodStart || Date.now()),
          billingPeriodEnd: new Date(billingPeriodEnd || Date.now() + 30 * 24 * 3600 * 1000)
        }
      });

      // Insert billing sub-items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await prisma.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              description: item.description || 'Prestation d’assainissement urbain',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || invoiceAmount,
              amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || invoiceAmount)
            }
          });
        }
      } else {
        // Create 1 default item
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            description: 'Redevance d’exploitation mensuelle d’assainissement',
            quantity: 1,
            unitPrice: invoiceAmount,
            amount: invoiceAmount
          }
        });
      }

      const operatorId = req.tokenUser?.id || null;
      await BillingWorkflowController.logAudit(
        prisma,
        operatorId,
        'INVOICE_CREATE',
        `Création de la facture brouillon ${invoice.id} d'un montant de ${invoiceAmount} FCFA pour ${customer.name}`,
        '',
        JSON.stringify({ id: invoice.id, amount: invoiceAmount, status: 'DRAFT' }),
        req.ip
      );

      res.status(201).json({ success: true, message: 'Facture brouillon générée avec succès.', invoiceId: invoice.id });
    } catch (err: any) {
      console.error('Invoice creation failure:', err);
      res.status(500).json({ error: 'Échec de la création de la facture.' });
    }
  },

  /**
   * GET /invoices - Retrieve filtered invoices list
   */
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { status, customerId } = req.query;

      const filter: any = {};
      if (status) {
        filter.status = status as string;
      }
      if (customerId) {
        filter.customerId = customerId as string;
      }

      const invoices = await prisma.invoice.findMany({
        where: filter,
        include: {
          customer: true,
          items: true,
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, count: invoices.length, invoices });
    } catch (err: any) {
      console.error('Failed to query list of invoices:', err);
      res.status(500).json({ error: 'Échec de la récupération des factures.' });
    }
  },

  /**
   * GET /invoices/:id - Retrieve invoice details with associated records
   */
  async getInvoiceById(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          items: true,
          payments: true,
          accountingEntries: true
        }
      });

      if (!invoice) {
        res.status(404).json({ error: 'Facture introuvable.' });
        return;
      }

      res.json({ success: true, invoice });
    } catch (err: any) {
      console.error('Get Invoice detailed record error:', err);
      res.status(500).json({ error: 'Échec du chargement de la facture.' });
    }
  },

  /**
   * PUT /invoices/:id - Update draft invoice
   */
  async updateInvoice(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;
      const { amount, dueDate, billingPeriodStart, billingPeriodEnd } = req.body;

      const oldInvoice = await prisma.invoice.findUnique({ where: { id } });
      if (!oldInvoice) {
        res.status(404).json({ error: 'Facture introuvable.' });
        return;
      }

      if (oldInvoice.status !== 'DRAFT') {
        res.status(400).json({ error: 'Une facture déjà validée, réglée ou annulée ne peut plus être éditée.' });
        return;
      }

      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          amount: amount !== undefined ? Number(amount) : oldInvoice.amount,
          dueDate: dueDate ? new Date(dueDate) : oldInvoice.dueDate,
          billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : oldInvoice.billingPeriodStart,
          billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : oldInvoice.billingPeriodEnd,
        }
      });

      const operatorId = req.tokenUser?.id || null;
      await BillingWorkflowController.logAudit(
        prisma,
        operatorId,
        'INVOICE_UPDATE',
        `Mise à jour de la facture brouillon ${id}`,
        JSON.stringify(oldInvoice),
        JSON.stringify(updated),
        req.ip
      );

      res.json({ success: true, message: 'Facture brouillon mise à jour avec succès.', invoice: updated });
    } catch (err: any) {
      console.error('Invoice update error:', err);
      res.status(500).json({ error: 'Échec de la mise à jour de la facture.' });
    }
  },

  /**
   * POST /invoices/:id/validate - Validates an invoice and books it
   */
  async validateInvoice(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { customer: true }
      });

      if (!invoice) {
        res.status(404).json({ error: 'Facture introuvable.' });
        return;
      }

      if (invoice.status !== 'DRAFT') {
        res.status(400).json({ error: `La facture est déjà au statut ${invoice.status}. Seuls les brouillons peuvent être validés.` });
        return;
      }

      // Transition state
      const validatedInvoice = await prisma.invoice.update({
        where: { id },
        data: { status: 'VALIDATED' }
      });

      // 1. Automated Bookkeeping Entry: Class 4 Debit Client, Class 7 Credit Revenue Products
      const reference = `FACT-${id.substring(0, 8).toUpperCase()}`;
      const description = `Émission Facture d'Assainissement ${reference} [${invoice.customer.name}]`;
      
      await BillingWorkflowController.recordAccountingEntry(
        prisma,
        reference,
        description,
        '411100', // Debit Compte Client
        '706100', // Credit Compte Produits de Collecte
        Number(invoice.amount),
        invoice.id,
        undefined,
        req.tokenUser?.name || 'Système ERP'
      );

      // Trigger standard bookkeeping engine so its UI-level JSON views stay perfectly in sync
      const accountingService = AccountingService.getInstance();
      await accountingService.createInvoiceEntry({
        id: invoice.id,
        customerName: invoice.customer.name,
        amount: Number(invoice.amount),
        issueDate: new Date().toISOString().split('T')[0],
        period: invoice.billingPeriodStart ? invoice.billingPeriodStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Courante'
      });

      // 2. Adjust Customer account balance recursively with new invoice dues
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          balance: { increment: Number(invoice.amount) }
        }
      });

      // 3. Log Audit
      const operatorId = req.tokenUser?.id || null;
      await BillingWorkflowController.logAudit(
        prisma,
        operatorId,
        'INVOICE_VALIDATE',
        `Validation de la facture d'exploitation ${id} d'un montant de ${invoice.amount} FCFA pour ${invoice.customer.name}`,
        JSON.stringify(invoice),
        JSON.stringify(validatedInvoice),
        req.ip
      );

      res.json({ success: true, message: 'Facture validée avec succès, et imputation de l’écriture comptable d’exploitation enregistrée.', invoice: validatedInvoice });
    } catch (err: any) {
      console.error('Invoice validation failed:', err);
      res.status(500).json({ error: 'Échec de la validation de la facture.' });
    }
  },

  /**
   * POST /invoices/:id/payment - Processes a cash details or MM manual payment receipt
   */
  async recordInvoicePayment(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;
      const { amountPaid, method, transactionId } = req.body;

      if (!amountPaid || Number(amountPaid) <= 0) {
        res.status(400).json({ error: 'Le montant payé doit être strictement supérieur à zéro.' });
        return;
      }

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { customer: true, payments: true }
      });

      if (!invoice) {
        res.status(404).json({ error: 'Facture introuvable.' });
        return;
      }

      if (invoice.status === 'DRAFT') {
        res.status(400).json({ error: 'La facture est à l’état Brouillon. Elle doit être validée avant de pouvoir imputer des paiements.' });
        return;
      }

      if (invoice.status === 'PAID') {
        res.status(400).json({ error: 'La facture a déjà été intégralement réglée.' });
        return;
      }

      if (invoice.status === 'CANCELLED') {
        res.status(400).json({ error: 'La facture a été annulée. Aucun règlement ne peut y être affecté.' });
        return;
      }

      const totalPaidAlready = invoice.payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const netAmountDue = Number(invoice.amount) - totalPaidAlready;
      const paying = Number(amountPaid);

      if (paying > netAmountDue + 0.01) {
        res.status(400).json({ error: `Le règlement excède le reliquat restant dû. Restant à payer: ${netAmountDue} FCFA.` });
        return;
      }

      // Create Payment Event record
      const payment = await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paying,
          method: method || 'CASH',
          status: 'SUCCESS',
          transactionId: transactionId || `MAN-REG-${Date.now()}`
        }
      });

      // Update state transitions dynamically
      let finalInvoiceStatus = 'PARTIALLY_PAID';
      if (Math.abs(paying - netAmountDue) < 0.1) {
        finalInvoiceStatus = 'PAID';
      }

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: { status: finalInvoiceStatus }
      });

      // 1. Bookkeeping entries rules: Debit Cash/Bank/Mobile Money Account, Credit Client Account
      let debitAccount = '571100'; // Standard Caisse
      const methodCheck = String(method).toUpperCase();
      if (methodCheck === 'WAVE') debitAccount = '512200';
      else if (methodCheck === 'MTN') debitAccount = '554000';
      else if (methodCheck === 'MOOV') debitAccount = '555000';
      else if (['BANK', 'CARD', 'VIREMENT', 'CHEQUE'].includes(methodCheck)) debitAccount = '512100';

      const paymentRef = `PAY-${payment.id.substring(0, 8).toUpperCase()}`;
      await BillingWorkflowController.recordAccountingEntry(
        prisma,
        paymentRef,
        `Règlement de la facture ${invoice.id.substring(0, 8).toUpperCase()} par ${methodCheck}`,
        debitAccount, // Debit Bank / Cash
        '411100', // Credit Client
        paying,
        invoice.id,
        payment.id,
        req.tokenUser?.name || 'Système ERP'
      );

      // Trigger standard bookkeeping JSON view updates
      const accountingService = AccountingService.getInstance();
      await accountingService.createPaymentEntry({
        id: payment.id,
        invoiceId: invoice.id,
        customerName: invoice.customer.name,
        amount: paying,
        method: methodCheck,
        paymentDate: new Date().toISOString()
      });

      // 2. Reduce Customer balance account by the payment amount
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          balance: { decrement: paying }
        }
      });

      // 3. Log Audit Trail
      const operatorId = req.tokenUser?.id || null;
      await BillingWorkflowController.logAudit(
        prisma,
        operatorId,
        'INVOICE_PAYMENT',
        `Imputation d'un paiement de ${paying} FCFA (${methodCheck}) affecté à la facture ${id}. Nouveau statut facture: ${finalInvoiceStatus}`,
        JSON.stringify(invoice),
        JSON.stringify(updatedInvoice),
        req.ip
      );

      res.json({ success: true, message: 'Le règlement a été comptabilisé et l’état de la facture mis à jour avec succès.', payment });
    } catch (err: any) {
      console.error('Invoice payment recording error:', err);
      res.status(500).json({ error: 'Échec de l’imputation du paiement.' });
    }
  },

  /**
   * POST /invoices/:id/cancel - Cancels a validated or draft invoice
   */
  async cancelInvoice(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;

      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { customer: true }
      });

      if (!invoice) {
        res.status(404).json({ error: 'Facture introuvable.' });
        return;
      }

      if (invoice.status === 'CANCELLED') {
        res.status(400).json({ error: 'La facture est déjà annulée.' });
        return;
      }

      const originalStatus = invoice.status;

      const cancelledInvoice = await prisma.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      // If the invoice was already validated or partially paid, we must generate an offsetting debit/credit entry
      if (originalStatus !== 'DRAFT') {
        const reference = `ANN-${id.substring(0, 8).toUpperCase()}`;
        const description = `Extourne / Annulation de la Facture d'Assainissement [${invoice.customer.name}]`;

        // Reverse entry: Debit Revenue Account (706100), Credit Client Account (411100)
        await BillingWorkflowController.recordAccountingEntry(
          prisma,
          reference,
          description,
          '706100', // Debit revenue to reduce it
          '411100', // Credit client to clear debt
          Number(invoice.amount),
          invoice.id,
          undefined,
          req.tokenUser?.name || 'Système ERP'
        );

        // Deduct customer balance that was added during validation
        await prisma.customer.update({
          where: { id: invoice.customerId },
          data: {
            balance: { decrement: Number(invoice.amount) }
          }
        });
      }

      const operatorId = req.tokenUser?.id || null;
      await BillingWorkflowController.logAudit(
        prisma,
        operatorId,
        'INVOICE_CANCEL',
        `Annulation de la facture d'exploitation ${id} d'un montant de ${invoice.amount} FCFA (Statut initial: ${originalStatus})`,
        JSON.stringify(invoice),
        JSON.stringify(cancelledInvoice),
        req.ip
      );

      res.json({ success: true, message: 'Facture annulée avec succès et reliquats imputés comptablement.', invoice: cancelledInvoice });
    } catch (err: any) {
      console.error('Invoice cancellation error:', err);
      res.status(500).json({ error: 'Échec de l’annulation de la facture.' });
    }
  },

  /**
   * POST /subscriptions/:id/resiliate - Transition to RESILIATED
   */
  async resiliateSubscription(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;

      let subscription = null;
      if (id && id.length === 36) {
        subscription = await prisma.subscription.findUnique({
          where: { id },
          include: { customer: true }
        });
      }

      if (!subscription && id) {
        let customer = null;
        if (id.length === 36) {
          customer = await prisma.customer.findUnique({
            where: { id }
          });
        }
        if (!customer) {
          customer = await prisma.customer.findUnique({
            where: { subscriberId: id }
          });
        }
        if (customer) {
          subscription = await prisma.subscription.findFirst({
            where: {
              customerId: customer.id,
              status: 'ACTIVE'
            },
            include: { customer: true }
          });
        }
      }

      if (!subscription) {
        res.status(404).json({ error: 'Abonnement actif introuvable pour ce client.' });
        return;
      }

      const oldStatus = subscription.status;
      const resiliated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'RESILIATED',
          endDate: new Date()
        }
      });

      // Update customer status to INACTIVE too
      await prisma.customer.update({
        where: { id: subscription.customerId },
        data: { status: 'INACTIVE' }
      });

      const operatorId = req.tokenUser?.id || null;
      await BillingWorkflowController.logAudit(
        prisma,
        operatorId,
        'SUBSCRIPTION_RESILIATE',
        `Résiliation définitive de l’abonnement municipal de la salubrité pour ${subscription.customer.name}`,
        JSON.stringify(subscription),
        JSON.stringify(resiliated),
        req.ip
      );

      res.json({ success: true, message: 'Résiliation enregistrée, et dossier client clôturé ou passé en inactif.', subscription: resiliated });
    } catch (err: any) {
      console.error('Resiliation error:', err);
      res.status(500).json({ error: 'Échec de la résiliation de l’abonnement.' });
    }
  },

  /**
   * GET /payments - Retrieve all transaction payments
   */
  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const payments = await prisma.payment.findMany({
        include: {
          invoice: {
            include: { customer: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, count: payments.length, payments });
    } catch (err: any) {
      console.error('Querying payments error:', err);
      res.status(500).json({ error: 'Échec de la récupération des règlements.' });
    }
  },

  /**
   * GET /accounting - Retrieve relational double entries
   */
  async getAccountingEntries(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const entries = await prisma.accountingEntry.findMany({
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, count: entries.length, entries });
    } catch (err: any) {
      console.error('Failed to dump accounting double entries:', err);
      res.status(500).json({ error: 'Échec du chargement des journaux de double entrée.' });
    }
  }
};
