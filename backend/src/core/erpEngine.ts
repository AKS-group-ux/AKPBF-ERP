/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPrismaClient } from '../config/database';
import { TwilioService, getTwilioConfig } from '../services/twilioService';
import crypto from 'crypto';

/**
 * Domain types & interfaces mirroring the ERP domain models (inspired by Odoo)
 */
export interface ClientDomainModel {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  planId: string;
  binType: 'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L';
  status?: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface PaymentDomainModel {
  subscriberId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  transactionRef: string;
  operatorName: string;
}

export interface CollectionDomainModel {
  binId: string;
  routeId: string;
  agentId: string;
  weight: number;
  status: 'COLLECTED' | 'SKIPPED' | 'MISSED';
}

/**
 * ERP Core Engine
 * Encapsulates transactional business workflows, rules validations, ledger entries,
 * audit logging, and automated notifications as a single source of truth.
 */
export class ErpEngine {
  
  /**
   * Rules Engine: Validations before database writes (strict email and phone checks)
   */
  private static async validateCustomerRules(email: string, phone: string, excludeCustomerId?: string) {
    const prisma = getPrismaClient();
    const canonEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // 1. Email unique check
    const duplicateEmail = await prisma.customer.findFirst({
      where: {
        email: { equals: canonEmail, mode: 'insensitive' },
        ...(excludeCustomerId ? { id: { not: excludeCustomerId } } : {})
      }
    });

    if (duplicateEmail) {
      throw new Error(`Règle d'intégrité violée : L'adresse email '${email}' est déjà enregistrée.`);
    }

    // 2. Phone unique check
    const duplicatePhone = await prisma.customer.findFirst({
      where: {
        phone: cleanPhone,
        ...(excludeCustomerId ? { id: { not: excludeCustomerId } } : {})
      }
    });

    if (duplicatePhone) {
      throw new Error(`Règle d'intégrité violée : Le numéro de téléphone '${phone}' est déjà utilisé.`);
    }
  }

  /**
   * Workflow A: Client Onboarding
   * Flow: Client -> Validation -> db transaction (Customer -> Subscription -> Bin -> Contract record) -> Audit -> Notification
   */
  public static async onboardClient(client: ClientDomainModel, meta: { operatorId: string; operatorName: string; ipAddress: string }) {
    const prisma = getPrismaClient();

    // Check if customer email or phone already exists in the system to avoid duplicate crashes
    const canonEmail = client.email.trim().toLowerCase();
    const cleanPhone = client.phone.trim();

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: { equals: canonEmail, mode: 'insensitive' } },
          { phone: cleanPhone }
        ]
      },
      include: {
        subscriptions: true
      }
    });

    if (existingCustomer) {
      console.log(`[RESILIENCE] Onboarding subscriber with existing phone/email: ${cleanPhone} / ${canonEmail}. Reusing and updating existing customer: ${existingCustomer.id}`);
      
      const subscriberId = existingCustomer.subscriberId || `ABJ-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Gracefully update search index info
      const updatedCustomer = await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: client.name,
          email: canonEmail,
          phone: cleanPhone,
          address: client.address || existingCustomer.address,
          status: 'ACTIVE'
        }
      });

      // Dispatch welcome email asynchronously and gracefully (non-blocking)
      try {
        const { EmailService } = await import('../services/emailService');
        await EmailService.sendWelcomeEmail(canonEmail, client.name, 'CLIENT', updatedCustomer.id);
        console.log(`[ERP-ONBOARDING] Welcome email queued for existing subscriber.`);
      } catch (welcomeErr) {
        console.error('[ERP-ONBOARDING-EMAIL-ERROR] Non-blocking failure to send onboarding welcome email:', welcomeErr);
      }

      return {
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        subscriberId: subscriberId,
        status: 'ACTIVE'
      };
    }

    // 1. Run validation policies
    await this.validateCustomerRules(client.email, client.phone);

    // 2. Execute strict single transactional workflow to avoid dirty states
    return await prisma.$transaction(async (tx) => {
      
      // Determine final subscriber sequence key
      const subscriberId = `ABJ-${Math.floor(100000 + Math.random() * 900000)}`;

      // A. Create the real physical customer in PostgreSQL
      const customer = await tx.customer.create({
        data: {
          name: client.name,
          email: client.email.trim().toLowerCase(),
          phone: client.phone.trim(),
          address: client.address,
          subscriberId: subscriberId,
          status: client.status || 'ACTIVE',
          balance: 0.0
        }
      });

      // B. Setup active contract reference
      const contractId = `CNT-2026-${subscriberId.replace('ABJ-', '')}`;
      const contractRecord = {
        id: contractId,
        contractNumber: contractId,
        subscriberId: subscriberId,
        subscriberName: client.name,
        subscriberPhone: client.phone,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        amount: client.binType === 'Bac Grand 360L' ? 5000 : client.binType === 'Conteneur 1100L' ? 15000 : 3500,
        planName: client.binType,
        signingPlace: 'Abidjan Plateau',
        status: 'signed',
        signatureHash: `SIG-${crypto.randomBytes(8).toString('hex').toUpperCase()}`
      };

      // Push contract metadata to Settings ledger safely
      const contractsSetting = await tx.setting.findUnique({ where: { key: 'AKPBF_ERP_CONTRACTS' } });
      const contractsList = contractsSetting ? JSON.parse(contractsSetting.value) : [];
      contractsList.unshift(contractRecord);
      await tx.setting.upsert({
        where: { key: 'AKPBF_ERP_CONTRACTS' },
        update: { value: JSON.stringify(contractsList) },
        create: { key: 'AKPBF_ERP_CONTRACTS', value: JSON.stringify(contractsList), desc: 'Liste des contrats de salubrité' }
      });

      // C. Setup real modular Subscription
      const defaultPlan = await tx.subscriptionPlan.findFirst({
        where: { id: client.planId }
      }) || await tx.subscriptionPlan.findFirst();

      const subscription = await tx.subscription.create({
        data: {
          customerId: customer.id,
          planId: client.planId || defaultPlan?.id || "",
          status: 'ACTIVE'
        }
      });

      // D. Provision IoT Bin with RFID sequence
      const binCapacity = client.binType === 'Bac Grand 360L' ? 360.0 : client.binType === 'Conteneur 1100L' ? 1100.0 : 240.0;
      await tx.bin.create({
        data: {
          qrCode: `RFID-${subscriberId}`,
          customerId: customer.id,
          capacity: binCapacity,
          fillLevel: 0,
          status: 'OK'
        }
      });

      // E. Write ERP general audit log entry
      const auditLog = await tx.auditLog.create({
        data: {
          userId: meta.operatorId,
          action: 'CREATE_CLIENT',
          ipAddress: meta.ipAddress,
          details: `Validation du client ${client.name} (ID: ${subscriberId}). Contrat cadre ${contractId} signé numériquement et stocké.`
        }
      });

      // F. Send Onboarding email/SMS notification
      const welcomeContent = `Cher(e) ${client.name},\n\nBienvenue chez AKPBF. Votre contrat n° ${contractId} est maintenant actif pour la zone ${client.address}.\nUn contenant de type ${client.binType} muni d'une puce RFID-GPS a été rattaché à votre compte.\n\nMerci de contribuer à la salubrité d'Abidjan !`;
      await tx.notification.create({
        data: {
          customerId: customer.id,
          title: 'Bienvenue chez AKPBF - Contrat Actif',
          content: welcomeContent,
          isEmail: true,
          status: 'SENT'
        }
      });

      // Retrieve configured Twilio Welcome message and dispatch via TwilioService
      let welcomeSms = "Bienvenue chez AKPBF. Votre compte a été créé avec succès.";
      try {
        const twilioConfig = await getTwilioConfig();
        if (twilioConfig.templateWelcome) {
          welcomeSms = twilioConfig.templateWelcome
            .replace('{name}', client.name)
            .replace('{contractId}', contractId)
            .replace('{address}', client.address || '')
            .replace('{binType}', client.binType || '');
        }
      } catch (confErr) {
        console.warn('Failed parsing Twilio settings for Welcome message, using default:', confErr);
      }

      try {
        await TwilioService.enqueueSms(client.phone, welcomeSms, 'BIENVENUE', customer.id);
        console.log(`[ERP-ONBOARDING] Welcome SMS enqueued for ${client.phone}`);
      } catch (smsErr: any) {
        console.error('[ERP-ONBOARDING] Welcome SMS enqueue failed:', smsErr.message);
      }

      // Dispatch professional HTML email asynchronously (non-blocking)
      try {
        const { EmailService } = await import('../services/emailService');
        await EmailService.sendWelcomeEmail(client.email.trim().toLowerCase(), client.name, 'CLIENT', customer.id);
        console.log(`[ONBOARDING] Welcome email dispatched successfully to new citizen: ${client.email}`);
      } catch (welcomeErr) {
        console.error('[ONBOARDING-EMAIL-ERROR] Non-blocking failure to send onboarding welcome email:', welcomeErr);
      }

      // Push custom logs unifier
      const notifSetting = await tx.setting.findUnique({ where: { key: 'AKPBF_ERP_NOTIF_LOGS' } });
      const currentNotifsList = notifSetting ? JSON.parse(notifSetting.value) : [];
      currentNotifsList.unshift({
        id: `NTF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: client.name,
        recipientContact: client.email || client.phone,
        type: 'email',
        templateName: 'Bienvenue',
        content: welcomeContent,
        sentAt: new Date().toISOString(),
        status: 'sent'
      });
      await tx.setting.upsert({
        where: { key: 'AKPBF_ERP_NOTIF_LOGS' },
        update: { value: JSON.stringify(currentNotifsList) },
        create: { key: 'AKPBF_ERP_NOTIF_LOGS', value: JSON.stringify(currentNotifsList), desc: 'Notification list' }
      });

      return {
        success: true,
        customerId: customer.id,
        subscriberId: subscriberId,
        contractId: contractId,
        subscriptionId: subscription.id
      };
    });
  }

  /**
   * Workflow B: Dynamic Client Update
   */
  public static async updateClient(clientId: string, updatedFields: Partial<ClientDomainModel>, meta: { operatorId: string; ipAddress: string }) {
    const prisma = getPrismaClient();

    // Find first by subscriberId or uuid id
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: clientId },
          { subscriberId: clientId }
        ]
      }
    });

    if (!existing) {
      throw new Error(`Abonné introuvable d'identifiant '${clientId}'`);
    }

    // Run rules engine if critical uniqueness fields are altered
    if (updatedFields.email || updatedFields.phone) {
      await this.validateCustomerRules(
        updatedFields.email || existing.email || "",
        updatedFields.phone || existing.phone,
        existing.id
      );
    }

    return await prisma.$transaction(async (tx) => {
      const updatedModel = await tx.customer.update({
        where: { id: existing.id },
        data: {
          name: updatedFields.name || existing.name,
          email: updatedFields.email ? updatedFields.email.trim().toLowerCase() : existing.email,
          phone: updatedFields.phone ? updatedFields.phone.trim() : existing.phone,
          address: updatedFields.address !== undefined ? updatedFields.address : existing.address,
          status: updatedFields.status || existing.status
        }
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          userId: meta.operatorId,
          action: 'UPDATE_CLIENT',
          ipAddress: meta.ipAddress,
          details: `Mise à jour des coordonnées de l'abonné ${updatedModel.name} (${updatedModel.subscriberId}).`
        }
      });

      return { success: true, customerId: updatedModel.id, subscriberId: updatedModel.subscriberId };
    });
  }

  /**
   * Workflow C: Payment ledger entry with auto in cascade apurement, double bookkeeping, receipt generation, and notifications
   * Enforces rules: valid positive amount and actual client matching in PostgreSQL.
   */
  public static async processPayment(payment: PaymentDomainModel, meta: { operatorId: string; ipAddress: string }) {
    const prisma = getPrismaClient();

    if (!payment.subscriberId || payment.amountPaid <= 0) {
      throw new Error("L'identifiant de l'abonné et le montant payé (strictement positif) sont obligatoires.");
    }

    // 1. Identify customer
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: payment.subscriberId },
          { subscriberId: payment.subscriberId },
          { phone: payment.subscriberId },
          { email: payment.subscriberId },
          { name: { equals: payment.subscriberId, mode: 'insensitive' } }
        ]
      },
      include: {
        subscriptions: true,
        invoices: true,
        bins: true
      }
    });

    // Sub-fallback checking by Bin QR-Code/RFID directly
    if (!customer) {
      const bin = await prisma.bin.findUnique({
        where: { qrCode: payment.subscriberId },
        include: { customer: { include: { subscriptions: true, invoices: true, bins: true } } }
      });
      if (bin && bin.customer) {
        customer = bin.customer;
      }
    }

    if (!customer) {
      throw new Error(`Abonné '${payment.subscriberId}' introuvable dans la base de données.`);
    }

    // 2. Perform Transactional Execution
    return await prisma.$transaction(async (tx) => {
      
      // Get all open/unpaid/overdue invoices chronologically
      const openInvoices = await tx.invoice.findMany({
        where: {
          customerId: customer!.id,
          status: { in: ['UNPAID', 'OVERDUE', 'pending', 'unpaid', 'overdue'] }
        },
        orderBy: { dueDate: 'asc' }
      });

      let unappliedAmount = payment.amountPaid;
      const allocatedInvoices: string[] = [];

      for (const invoice of openInvoices) {
        if (unappliedAmount <= 0) break;
        const currentAmount = Number(invoice.amount);

        if (unappliedAmount >= currentAmount) {
          unappliedAmount -= currentAmount;
          allocatedInvoices.push(invoice.id);
          
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID' }
          });

          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: currentAmount,
              method: payment.paymentMethod.toUpperCase() === 'ESPÈCES' ? 'CASH' : 'MOBILE_MONEY',
              status: 'SUCCESS',
              transactionId: payment.transactionRef || `REF-TXN-${Math.floor(100000 + Math.random() * 900000)}`
            }
          });
        } else {
          // Allocate remaining amount as partial payment
          allocatedInvoices.push(invoice.id);
          
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID' } // Mark as cleared
          });

          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: unappliedAmount,
              method: payment.paymentMethod.toUpperCase() === 'ESPÈCES' ? 'CASH' : 'MOBILE_MONEY',
              status: 'SUCCESS',
              transactionId: payment.transactionRef || `REF-TXN-${Math.floor(100000 + Math.random() * 900000)}`
            }
          });
          unappliedAmount = 0;
        }
      }

      // 3. Auto reactivate client status and apply balance write off
      const updatedCustomer = await tx.customer.update({
        where: { id: customer!.id },
        data: {
          status: 'ACTIVE',
          balance: { decrement: payment.amountPaid }
        }
      });

      await tx.subscription.updateMany({
        where: { customerId: customer!.id },
        data: { status: 'ACTIVE' }
      });

      // 4. Generate next receipt index
      const receiptsSetting = await tx.setting.findUnique({ where: { key: 'AKPBF_ERP_RECEIPTS' } });
      const currentReceiptsList = receiptsSetting ? JSON.parse(receiptsSetting.value) : [];
      const paymentRef = payment.transactionRef || `REF-CSH-${Math.floor(100000 + Math.random() * 900000)}`;
      const nextReceiptNo = `REC-2026-${String(currentReceiptsList.length + 1).padStart(6, '0')}`;

      const newReceipt = {
        id: nextReceiptNo,
        paymentRef: paymentRef,
        subscriberId: customer!.subscriberId || customer!.id,
        subscriberName: customer!.name,
        subscriberPhone: customer!.phone,
        subscriberEmail: customer!.email || '',
        address: customer!.address || '',
        contractNumber: `CNT-2026-${(customer!.subscriberId || customer!.id).replace('AKPBF-', '').replace('SUB-', '')}`,
        invoiceId: allocatedInvoices.join(', ') || 'Acompte de Service',
        paymentDate: payment.paymentDate,
        amountPaid: payment.amountPaid,
        paymentMethod: payment.paymentMethod,
        remainingBalance: Math.max(0, Number(updatedCustomer.balance)),
        electronicSignature: `CERT-STAMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
      };

      currentReceiptsList.unshift(newReceipt);
      await tx.setting.upsert({
        where: { key: 'AKPBF_ERP_RECEIPTS' },
        update: { value: JSON.stringify(currentReceiptsList) },
        create: { key: 'AKPBF_ERP_RECEIPTS', value: JSON.stringify(currentReceiptsList), desc: 'Reçus de paiement d\'Abidjan' }
      });

      // 5. Bookkeeping Ledger entry
      const debitAccount = 
        payment.paymentMethod === 'Espèces' ? '571100 - Caisse Principale' :
        payment.paymentMethod.includes('Money') || payment.paymentMethod === 'Wave' ? '521200 - Trésor Mobile active' :
        '521100 - Banque BOA';

      const journalEntry = {
        id: `JNL-2026-${String(currentReceiptsList.length).padStart(6, '0')}`,
        date: payment.paymentDate,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        reference: nextReceiptNo,
        description: `Validation directe Odoo de la redevance pour ${customer!.name}`,
        amount: payment.amountPaid,
        debitAccount,
        creditAccount: '411100 - Créances de Salubrité',
        operator: payment.operatorName,
        status: 'CONFIRMÉ'
      };

      const journalSetting = await tx.setting.findUnique({ where: { key: 'AKPBF_ERP_JOURNAL' } });
      const currentJournals = journalSetting ? JSON.parse(journalSetting.value) : [];
      currentJournals.unshift(journalEntry);
      await tx.setting.upsert({
        where: { key: 'AKPBF_ERP_JOURNAL' },
        update: { value: JSON.stringify(currentJournals) },
        create: { key: 'AKPBF_ERP_JOURNAL', value: JSON.stringify(currentJournals), desc: "Grand livre d'Abidjan" }
      });

      // 6. Enforce security log & physical audits
      await tx.auditLog.create({
        data: {
          userId: meta.operatorId,
          action: 'CREATE_PAYMENT',
          ipAddress: meta.ipAddress,
          details: `Enregistrement du versement de ${payment.amountPaid.toLocaleString()} FCFA (Reçu ${nextReceiptNo}) par ${payment.operatorName} pour l'abonné ${customer!.name}.`
        }
      });

      // Push custom logs unifier
      const auditSetting = await tx.setting.findUnique({ where: { key: 'AKPBF_ERP_AUDIT_LOGS' } });
      const currentAuditsList = auditSetting ? JSON.parse(auditSetting.value) : [];
      currentAuditsList.unshift({
        id: `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: meta.operatorId,
        userName: payment.operatorName,
        action: 'Paiement enregistré',
        details: `Redevance de ${customer!.name || 'Abonné'} de ${payment.amountPaid.toLocaleString()} FCFA réglée par ${payment.paymentMethod}. Reçu: ${nextReceiptNo}`,
        timestamp: `${payment.paymentDate} ${journalEntry.time}`,
        ipAddress: meta.ipAddress
      });
      await tx.setting.upsert({
        where: { key: 'AKPBF_ERP_AUDIT_LOGS' },
        update: { value: JSON.stringify(currentAuditsList) },
        create: { key: 'AKPBF_ERP_AUDIT_LOGS', value: JSON.stringify(currentAuditsList), desc: 'Audit list' }
      });

      // 7. Push real notification Log
      const notifContent = `Cher(e) ${customer!.name},\n\nNous confirmons votre versement réussi de ${payment.amountPaid.toLocaleString()} FCFA ce ${payment.paymentDate} pour notre forfait d'assainissement.\nReçu de quittance officielle : ${nextReceiptNo}.\n\nMerci de maintenir la boucle de fleuve d'Abidjan propre !`;
      await tx.notification.create({
        data: {
          customerId: customer!.id,
          title: 'Confirmation de paiement reçu',
          content: notifContent,
          isEmail: true,
          status: 'SENT'
        }
      });

      // Retrieve configured Twilio subscription reactivated/payment message pattern and dispatch
      let reactivationSms = `AKPBF : Versement de ${payment.amountPaid.toLocaleString()} FCFA bien reçu (Reçu: ${nextReceiptNo}). Votre abonnement est réactivé.`;
      try {
        const twilioConfig = await getTwilioConfig();
        if (twilioConfig.templateAbonnement) {
          reactivationSms = twilioConfig.templateAbonnement
            .replace('{planName}', 'Salubrité Municipale')
            .replace('{statusEvent}', `RÉACTIVÉ (Paiement de ${payment.amountPaid.toLocaleString()} FCFA reçu, n° ${nextReceiptNo})`);
        }
      } catch (confErr) {
        console.warn('Failed parsing templateAbonnement for reactivation, using default:', confErr);
      }

      try {
        await TwilioService.enqueueSms(customer!.phone, reactivationSms, 'RÉACTIVATION_ABONNEMENT', customer!.id);
        console.log(`[PAYMENT] Reactivation/payment receipt SMS enqueued for ${customer!.phone}`);
      } catch (smsErr: any) {
        console.error('[PAYMENT] Reactivation SMS enqueue failed:', smsErr.message);
      }

      return {
        success: true,
        receiptId: nextReceiptNo,
        receipt: newReceipt,
        journalEntry,
        updatedBalance: Number(updatedCustomer.balance)
      };
    });
  }

  /**
   * Workflow D: Validation of automated Periodic Billing Cycle
   * Triggers real invoice generations against subscriptions with NO invoice yet in active billing period.
   */
  public static async runMonthlyBillingCycle(meta: { operatorId: string; ipAddress: string }) {
    const prisma = getPrismaClient();
    const now = new Date();
    const billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await prisma.$transaction(async (tx) => {
      // Find active subscriptions
      const activeSubs = await tx.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { customer: true, plan: true }
      });

      let invoicesGeneratedCount = 0;
      let totalBilledVal = 0;

      for (const sub of activeSubs) {
        // Double write guard: Check if invoice already issued to this subscriber for the exact month is active
        const existingInvoice = await tx.invoice.findFirst({
          where: {
            customerId: sub.customerId,
            createdAt: {
              gte: billingPeriodStart,
              lte: billingPeriodEnd
            }
          }
        });

        if (!existingInvoice) {
          const invoiceAmount = sub.plan ? Number(sub.plan.price) : 3500;
          
          await tx.invoice.create({
            data: {
              customerId: sub.customerId,
              subscriptionId: sub.id,
              amount: invoiceAmount,
              dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000), // 15 days of grace
              status: 'UNPAID',
              billingPeriodStart,
              billingPeriodEnd
            }
          });

          // Debit client's accounting balance in background
          await tx.customer.update({
            where: { id: sub.customerId },
            data: { balance: { increment: invoiceAmount } }
          });

          invoicesGeneratedCount++;
          totalBilledVal += invoiceAmount;
        }
      }

      await tx.auditLog.create({
        data: {
          userId: meta.operatorId,
          action: 'BILLING_CYCLE',
          ipAddress: meta.ipAddress,
          details: `Exécution du cycle de facturation pour ${invoicesGeneratedCount} abonnés d'Abidjan d'un montant total de ${totalBilledVal.toLocaleString()} FCFA.`
        }
      });

      return {
        success: true,
        invoicesGenerated: invoicesGeneratedCount,
        totalBilled: totalBilledVal,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Workflow E: Safe Account Suspension
   */
  public static async suspendClientAccount(clientId: string, reason: string, meta: { operatorId: string; ipAddress: string }) {
    const prisma = getPrismaClient();

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { id: clientId },
          { subscriberId: clientId }
        ]
      }
    });

    if (!customer) {
      throw new Error(`Abonné introuvable.`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Mark customer suspended
      await tx.customer.update({
        where: { id: customer.id },
        data: { status: 'SUSPENDED' }
      });

      // 2. Suspend subscription
      await tx.subscription.updateMany({
        where: { customerId: customer.id },
        data: { status: 'SUSPENDED' }
      });

      // 3. Mark bin in warning state
      await tx.bin.updateMany({
        where: { customerId: customer.id },
        data: { status: 'MAINTENANCE' }
      });

      // 4. Log audit log
      await tx.auditLog.create({
        data: {
          userId: meta.operatorId,
          action: 'SUSPEND_CLIENT',
          ipAddress: meta.ipAddress,
          details: `Suspension de salubrité de l'abonné ${customer.name} (Raison : ${reason}).`
        }
      });

      // 5. Send Notification alert
      const alertNotif = `Cher(e) ${customer.name},\n\nNous vous informons du gel momentané de notre service de collecte en Riviera/Cocody sur décision du grand livre de perception pour non-paiement prolongé.\n\nVeuillez régulariser votre solde de redevance pour autoriser un dégel immédiat.\n\nL'équipe AKPBF d'Abidjan.`;
      await tx.notification.create({
        data: {
          customerId: customer.id,
          title: 'Avis de suspension de service pour redevance',
          content: alertNotif,
          isEmail: true,
          status: 'SENT'
        }
      });

      // Get the configured Twilio subscription suspended message pattern and dispatch
      let suspensionSms = `AKPBF Salubrité : Votre abonnement est suspendu pour non-paiement de redevance.`;
      try {
        const twilioConfig = await getTwilioConfig();
        if (twilioConfig.templateAbonnement) {
          suspensionSms = twilioConfig.templateAbonnement
            .replace('{planName}', 'Salubrité Municipale')
            .replace('{statusEvent}', 'SUSPENDU (Impayé)');
        }
      } catch (confErr) {
        console.warn('Failed parsing templateAbonnement for suspension, using default:', confErr);
      }

      try {
        await TwilioService.enqueueSms(customer.phone, suspensionSms, 'SUSPENSION_ABONNEMENT', customer.id);
        console.log(`[SUSPEND] Suspension SMS enqueued for ${customer.phone}`);
      } catch (smsErr: any) {
        console.error('[SUSPEND] Suspension SMS enqueue failed:', smsErr.message);
      }

      return { success: true, customerId: customer.id, status: 'SUSPENDED' };
    });
  }

  /**
   * Workflow F: IoT Waste Collection Validation & Reset
   */
  public static async logCollection(col: CollectionDomainModel, meta: { operatorId: string; ipAddress: string }) {
    const prisma = getPrismaClient();

    // Verify bin exists
    const bin = await prisma.bin.findUnique({
      where: { qrCode: col.binId },
      include: { customer: true }
    });

    if (!bin) {
      throw new Error(`Contenant avec code RFID/QR '${col.binId}' introuvable.`);
    }

    return await prisma.$transaction(async (tx) => {
      // Create collection row
      await tx.collection.create({
        data: {
          binId: bin.id,
          routeId: col.routeId,
          agentId: col.agentId,
          weight: col.weight,
          status: col.status
        }
      });

      // Send real-time collection SMS to bin.customer via TwilioService
      if (bin.customer && bin.customer.phone) {
        let collectionSms = `AKPBF : Votre bac ${bin.qrCode} a été collecté (${col.weight || 0}kg). Merci !`;
        try {
          const twilioConfig = await getTwilioConfig();
          if (twilioConfig.templateCollecte) {
            collectionSms = twilioConfig.templateCollecte
              .replace('{binCode}', bin.qrCode)
              .replace('{weight}', String(col.weight || 0))
              .replace('{statusEvent}', col.status === 'COLLECTED' ? 'RELEVÉ ET VIDÉ' : col.status);
          }
        } catch (confErr) {
          console.warn('Failed parsing templateCollecte, using default:', confErr);
        }

        try {
          // Fire as enqueued background task so it runs safely
          await TwilioService.enqueueSms(bin.customer.phone, collectionSms, 'COLLECTE_BAC', bin.customer.id);
          console.log(`[COLLECTION] Collection confirmation SMS enqueued for ${bin.customer.phone}`);
        } catch (smsErr: any) {
          console.error('[COLLECTION] Collection SMS enqueue failed:', smsErr.message);
        }
      }

      // Trigger bin fillLevel reset on successful emptying
      const previousLevel = bin.fillLevel;
      await tx.bin.update({
        where: { id: bin.id },
        data: {
          fillLevel: col.status === 'COLLECTED' ? 0.0 : previousLevel,
          status: 'OK'
        }
      });

      // Audit tracking Log
      await tx.auditLog.create({
        data: {
          userId: meta.operatorId,
          action: 'LOG_COLLECTION',
          ipAddress: meta.ipAddress,
          details: `Collecte enregistrée par puce RFID pour le bac ${bin.qrCode}. Poids levé : ${col.weight || 0}kg. Statut: ${col.status}.`
        }
      });

      // Push custom proof container safely in Setting unifier
      const proofSetting = await tx.setting.findUnique({ where: { key: 'AKPBF_ERP_COLLECTION_PROOFS' } });
      const currentProofs = proofSetting ? JSON.parse(proofSetting.value) : [];
      currentProofs.unshift({
        id: `PRF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        subscriberId: bin.customer?.subscriberId || bin.customerId || 'ADMIN',
        subscriberName: bin.customer?.name || "Abonné Riviera",
        binId: bin.qrCode,
        weight: col.weight || 15.4,
        emptyTimestamp: new Date().toISOString(),
        agentId: col.agentId,
        status: col.status
      });
      await tx.setting.upsert({
        where: { key: 'AKPBF_ERP_COLLECTION_PROOFS' },
        update: { value: JSON.stringify(currentProofs) },
        create: { key: 'AKPBF_ERP_COLLECTION_PROOFS', value: JSON.stringify(currentProofs), desc: 'Preuves de collecte' }
      });

      return { success: true, binId: bin.qrCode, fillLevel: 0.0 };
    });
  }
}
