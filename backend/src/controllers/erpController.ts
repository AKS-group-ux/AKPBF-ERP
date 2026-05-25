import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { ErpEngine } from '../core/erpEngine';
import crypto from 'crypto';

export const ErpController = {
  /**
   * Loads the unified state from real PostgreSQL tables.
   * If some records (like custom contract states or cached structures) are needed,
   * we use the Setting table to persist/retrieve them.
   */
  async getState(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();

      // 1. Fetch Plans
      const dbPlans = await prisma.subscriptionPlan.findMany();
      const plans = dbPlans.map(p => ({
        id: p.id,
        name: p.name,
        reference: `PLN-${p.name.substring(0, 3).toUpperCase()}`,
        price: Number(p.price),
        frequency: (p.frequency === 'Mensuel' ? 'Mensuel' : 'Personnalisé') as any,
        durationMonths: 1,
        collectionFrequency: "2 fois par semaine",
        maxCollectionsCount: 8,
        description: p.description || "",
        termsAndConditions: "Clauses d'assainissement de la boucle du fleuve.",
        status: 'active' as const,
        allowedVolume: "240L"
      }));

      // 2. Fetch Customers/Subscribers (filtering out archived items if needed)
      const dbCustomers = await prisma.customer.findMany({
        include: {
          subscriptions: true,
          invoices: true,
          bins: true
        }
      });

      // Get archived IDs index from Settings
      const archivedSetting = await prisma.setting.findUnique({
        where: { key: 'AKPBF_ARCHIVED_RECORDS' }
      });
      const archivedIds: string[] = archivedSetting ? JSON.parse(archivedSetting.value) : [];

      const subscribers = dbCustomers
        .filter(c => !archivedIds.includes(c.id) && !archivedIds.includes(c.subscriberId || ''))
        .map(c => {
          const sub = c.subscriptions[0];
          return {
            id: c.subscriberId || c.id,
            name: c.name,
            email: c.email || "",
            phone: c.phone,
            address: c.address || "",
            neighborhood: c.address ? c.address.split(',')[0] : "Cocody",
            lat: c.latitude || 5.3489,
            lng: c.longitude || -3.9995,
            planId: sub ? sub.planId : (plans[0]?.id || ""),
            status: (c.status.toLowerCase() === 'active' ? 'active' : c.status.toLowerCase()) as any,
            binType: (c.bins[0]?.capacity === 360 ? 'Bac Grand 360L' : c.bins[0]?.capacity === 1100 ? 'Conteneur 1100L' : 'Standard 240L') as any,
            lastCollectionDate: 'Aujourd\'hui',
            currentBinLevel: c.bins[0]?.fillLevel || 0,
            paymentStatus: (c.invoices.some(i => i.status === 'UNPAID') ? 'unpaid' : 'paid') as any,
            startDate: sub?.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            endDate: sub?.endDate?.toISOString().split('T')[0] || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
            collectionsRealized: 4,
            unpaidDays: 0
          };
        });

      // 3. Fetch Invoices
      const dbInvoices = await prisma.invoice.findMany({
        include: { customer: true }
      });
      const invoices = dbInvoices
        .filter(i => !archivedIds.includes(i.id))
        .map(i => ({
          id: i.id,
          subscriberId: i.customer?.subscriberId || i.customerId,
          subscriberName: i.customer?.name || "Inconnu",
          amount: Number(i.amount),
          dueDate: i.dueDate.toISOString().split('T')[0],
          issueDate: i.createdAt.toISOString().split('T')[0],
          status: (i.status.toLowerCase() === 'paid' ? 'paid' : i.status.toLowerCase() === 'overdue' ? 'overdue' : 'pending') as any,
          period: i.billingPeriodStart ? `${i.billingPeriodStart.toLocaleString('fr-FR', { month: 'long' })} ${i.billingPeriodStart.getFullYear()}` : "Services Salubrité"
        }));

      // 4. Fetch Custom JSON structures from settings
      const fetchJsonSetting = async (key: string, defaultValue: any) => {
        const item = await prisma.setting.findUnique({ where: { key } });
        return item ? JSON.parse(item.value) : defaultValue;
      };

      const contracts = await fetchJsonSetting('AKPBF_ERP_CONTRACTS', []);
      const receipts = await fetchJsonSetting('AKPBF_ERP_RECEIPTS', []);
      const emplacements = await fetchJsonSetting('AKPBF_ERP_EMPLACEMENTS', []);
      const notifLogs = await fetchJsonSetting('AKPBF_ERP_NOTIF_LOGS', []);
      const auditLogs = await fetchJsonSetting('AKPBF_ERP_AUDIT_LOGS', []);
      const collectionProofs = await fetchJsonSetting('AKPBF_ERP_COLLECTION_PROOFS', []);

      // Filter out any archived item from the JSON containers
      const filteredContracts = contracts.filter((c: any) => !archivedIds.includes(c.id));
      const filteredReceipts = receipts.filter((r: any) => !archivedIds.includes(r.id));
      const filteredEmplacements = emplacements.filter((e: any) => !archivedIds.includes(e.id));

      res.json({
        success: true,
        plans,
        subscribers,
        invoices,
        contracts: filteredContracts,
        receipts: filteredReceipts,
        emplacements: filteredEmplacements,
        notifLogs,
        auditLogs,
        collectionProofs
      });
    } catch (error) {
      console.error('Failed to get ERP unified state from PostgreSQL:', error);
      res.status(500).json({ error: 'Erreur lors du chargement des données depuis PostgreSQL.' });
    }
  },

  /**
   * Save unified custom lists inside Setting table as serialized ledger stores
   */
  async saveLedger(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { contracts, receipts, emplacements, notifLogs, auditLogs, collectionProofs } = req.body;

      const saveKey = async (key: string, data: any) => {
        if (data !== undefined) {
          await prisma.setting.upsert({
            where: { key },
            update: { value: JSON.stringify(data) },
            create: { key, value: JSON.stringify(data), desc: `ERP custom data store for ${key}` }
          });
        }
      };

      await saveKey('AKPBF_ERP_CONTRACTS', contracts);
      await saveKey('AKPBF_ERP_RECEIPTS', receipts);
      await saveKey('AKPBF_ERP_EMPLACEMENTS', emplacements);
      await saveKey('AKPBF_ERP_NOTIF_LOGS', notifLogs);
      await saveKey('AKPBF_ERP_AUDIT_LOGS', auditLogs);
      await saveKey('AKPBF_ERP_COLLECTION_PROOFS', collectionProofs);

      res.json({ success: true, message: 'Le grand livre ERP a été synchronisé sur PostgreSQL.' });
    } catch (err) {
      console.error('Failed to save ERP ledger fields:', err);
      res.status(500).json({ error: 'Erreur lors de la sauvegarde du grand livre ERP.' });
    }
  },

  /**
   * Adds a subscriber to PostgreSQL. Ensures strict email and phone uniqueness!
   */
  async addSubscriber(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, address, planId, binType } = req.body;

      if (!name || !email || !phone) {
        res.status(400).json({ error: "Le nom, l'email et le numéro de téléphone d'Abidjan sont obligatoires." });
        return;
      }

      const operatorId = (req as any).tokenUser?.id || "00000000-0000-0000-0000-000000000000";
      const operatorName = (req as any).tokenUser?.name || "Portail Client (Auto)";
      const ipAddress = req.ip || "127.0.0.1";

      const result = await ErpEngine.onboardClient({
        name,
        email,
        phone,
        address: address || "",
        planId: planId || "",
        binType: binType || "Standard 240L"
      }, {
        operatorId,
        operatorName,
        ipAddress
      });

      res.status(201).json(result);
    } catch (err: any) {
      console.error('Failed to create new customer in database via ErpEngine:', err);
      res.status(400).json({ error: err.message || 'Erreur serveur lors de la création de l\'abonné.' });
    }
  },

  /**
   * Updates existing customer.
   */
  async updateSubscriber(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params; // subscriberId or Uuid
      const { name, email, phone, address, status } = req.body;

      const operatorId = (req as any).tokenUser?.id || "00000000-0000-0000-0000-000000000000";
      const ipAddress = req.ip || "127.0.0.1";

      const result = await ErpEngine.updateClient(id, {
        name,
        email,
        phone,
        address,
        status
      }, {
        operatorId,
        ipAddress
      });

      res.json(result);
    } catch (err: any) {
      console.error('Failed to update customer via ErpEngine:', err);
      res.status(400).json({ error: err.message || 'Erreur serveur lors de la mise à jour.' });
    }
  },

  /**
   * Logic Soft Delete: adds the target ID to the logical archived records store
   */
  async softDeleteRecord(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: 'Identifiant du dossier requis.' });
        return;
      }

      // Get current list of archived IDs
      const setting = await prisma.setting.findUnique({
        where: { key: 'AKPBF_ARCHIVED_RECORDS' }
      });
      const list: string[] = setting ? JSON.parse(setting.value) : [];

      if (!list.includes(id)) {
        list.push(id);
        // Also soft delete in customer table if it is a customer
        const customer = await prisma.customer.findFirst({
          where: {
            OR: [{ id }, { subscriberId: id }]
          }
        });
        if (customer) {
          await prisma.customer.update({
            where: { id: customer.id },
            data: { status: 'TERMINATED' }
          });
          list.push(customer.id);
          if (customer.subscriberId) list.push(customer.subscriberId);
        }
      }

      await prisma.setting.upsert({
        where: { key: 'AKPBF_ARCHIVED_RECORDS' },
        update: { value: JSON.stringify(list) },
        create: {
          key: 'AKPBF_ARCHIVED_RECORDS',
          value: JSON.stringify(list),
          desc: 'Stockage logique des dossiers archivés pour la conformité comptable.'
        }
      });

      res.json({ success: true, message: 'Le dossier a été archivé numériquement et préservé en base de données.' });
    } catch (err) {
      console.error('Failed to logical delete record:', err);
      res.status(500).json({ error: 'Erreur lors de la suppression logique.' });
    }
  },

  /**
   * Real PostgreSQL Invoice creator
   */
  async addInvoice(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { id, subscriberId, amount, dueDate, period, status } = req.body;

      const customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { id: subscriberId },
            { subscriberId }
          ]
        }
      });

      if (!customer) {
        res.status(404).json({ error: 'Abonné introuvable pour émettre le titre.' });
        return;
      }

      const invoice = await prisma.invoice.create({
        data: {
          customerId: customer.id,
          amount: Number(amount) || 3000,
          dueDate: new Date(dueDate || Date.now() + 15 * 24 * 3600 * 1000),
          status: status === 'paid' ? 'PAID' : 'UNPAID',
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000)
        }
      });

      res.status(201).json({ success: true, id: invoice.id });
    } catch (err) {
      console.error('Failed to create physical invoice:', err);
      res.status(500).json({ error: 'Erreur lors de la facturation PostgreSQL.' });
    }
  },

  /**
   * Real PostgreSQL Encaissement Rapide (Quick Cash/MM Payment Manager)
   * Decoupled sequence numbering, invoice allocations, auto activation, notifications, and auditing ledger
   */
  async quickPayment(req: any, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();

      // Check permissions
      if (!req.tokenUser) {
        res.status(401).json({ error: 'Comptable non authentifié.' });
        return;
      }
      const userRole = req.tokenUser.role.toUpperCase();
      if (userRole !== 'ADMINISTRATEUR' && userRole !== 'COMPTABLE' && userRole !== 'CAISSIER') {
        res.status(403).json({ error: "Privilèges insuffisants. Seuls l'administrateur, le comptable, ou le caissier peuvent effectuer un encaissement." });
        return;
      }

      const {
        subscriberId, // reference or name or phone or qrCode
        amountPaid,
        paymentDate,
        paymentMethod,
        transactionRef
      } = req.body;

      if (!subscriberId || amountPaid === undefined || amountPaid <= 0) {
        res.status(400).json({ error: "L'identifiant de l'abonné et le montant payé (supérieur à 0) sont obligatoires." });
        return;
      }

      // 1. Search subscriber / customer in real PostgreSQL
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { id: subscriberId },
            { subscriberId: subscriberId },
            { phone: subscriberId },
            { email: subscriberId },
            { name: { equals: subscriberId, mode: 'insensitive' } }
          ]
        },
        include: {
          subscriptions: true,
          invoices: true,
          bins: true
        }
      });

      // 2. If not found, try to search bin by qrCode
      if (!customer) {
        const bin = await prisma.bin.findUnique({
          where: { qrCode: subscriberId },
          include: { customer: { include: { subscriptions: true, invoices: true, bins: true } } }
        });
        if (bin && bin.customer) {
          customer = bin.customer;
        }
      }

      if (!customer) {
        res.status(404).json({ error: 'Abonné introuvable en base de données.' });
        return;
      }

      // 3. Find open invoices (UNPAID or OVERDUE)
      const openInvoices = await prisma.invoice.findMany({
        where: {
          customerId: customer.id,
          status: { in: ['UNPAID', 'OVERDUE', 'pending', 'unpaid', 'overdue'] }
        },
        orderBy: { dueDate: 'asc' }
      });

      let remainingPaymentAmount = Number(amountPaid);
      const invoicesToUpdate: string[] = [];
      const paymentsToCreate: any[] = [];

      for (const inv of openInvoices) {
        if (remainingPaymentAmount <= 0) break;
        const invAmount = Number(inv.amount);

        if (remainingPaymentAmount >= invAmount) {
          remainingPaymentAmount -= invAmount;
          invoicesToUpdate.push(inv.id);
          paymentsToCreate.push({ invoiceId: inv.id, amount: invAmount });
        } else {
          // Partial payment (allocates everything left)
          paymentsToCreate.push({ invoiceId: inv.id, amount: remainingPaymentAmount });
          invoicesToUpdate.push(inv.id); // Mark as paid for simple invoice clearance flow
          remainingPaymentAmount = 0;
        }
      }

      // 4. Update invoices and create payments
      for (const invId of invoicesToUpdate) {
        await prisma.invoice.update({
          where: { id: invId },
          data: { status: 'PAID' }
        });
      }

      for (const pay of paymentsToCreate) {
        await prisma.payment.create({
          data: {
            invoiceId: pay.invoiceId,
            amount: pay.amount,
            method: paymentMethod || 'CASH',
            status: 'SUCCESS',
            transactionId: transactionRef || `REF-TXN-${Math.floor(100000 + Math.random() * 900000)}`
          }
        });
      }

      // 5. Update Customer & Subscription
      const updatedCustomerObj = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          status: 'ACTIVE',
          balance: { decrement: Number(amountPaid) }
        }
      });

      await prisma.subscription.updateMany({
        where: { customerId: customer.id },
        data: { status: 'ACTIVE' }
      });

      // 6. Generate unique receipt number (Formated like REC-2026-000001)
      const receiptsSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_RECEIPTS' } });
      const receiptsList: any[] = receiptsSetting ? JSON.parse(receiptsSetting.value) : [];
      
      const nextIndex = receiptsList.length + 1;
      const nextReceiptNo = `REC-2026-${String(nextIndex).padStart(6, '0')}`;

      // 7. Assemble Receipt details
      const todayString = paymentDate || new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      // Calculate new balance
      const newBalanceVal = Math.max(0, Number(updatedCustomerObj.balance));

      const newReceipt = {
        id: nextReceiptNo,
        paymentRef: transactionRef || `REF-CSH-${Math.floor(100000 + Math.random() * 900000)}`,
        subscriberId: customer.subscriberId || customer.id,
        subscriberName: customer.name,
        subscriberPhone: customer.phone,
        subscriberEmail: customer.email || '',
        address: customer.address || '',
        contractNumber: `CNT-2026-${(customer.subscriberId || customer.id).replace('AKPBF-', '').replace('SUB-', '')}`,
        invoiceId: invoicesToUpdate.join(', ') || 'Redevance Initiale',
        paymentDate: todayString,
        amountPaid: Number(amountPaid),
        paymentMethod: paymentMethod || 'Espèces',
        remainingBalance: newBalanceVal,
        electronicSignature: `CERT-STAMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
      };

      // Push into receipts list
      receiptsList.unshift(newReceipt);
      await prisma.setting.upsert({
        where: { key: 'AKPBF_ERP_RECEIPTS' },
        update: { value: JSON.stringify(receiptsList) },
        create: { key: 'AKPBF_ERP_RECEIPTS', value: JSON.stringify(receiptsList), desc: 'Recus d\'encaissement' }
      });

      // 8. Financial Accounting Journal Voucher
      const debitAccount = 
        paymentMethod === 'Espèces' ? '571100 - Caisse Principale' :
        paymentMethod === 'Orange Money' ? '521200 - Trésor Orange Money' :
        paymentMethod === 'Moov Money' ? '521250 - Trésor Moov Money' :
        paymentMethod === 'Carte bancaire' ? '521100 - Banque BOA' :
        paymentMethod === 'Virement' ? '521110 - Banque Virement BOA' :
        paymentMethod === 'Chèque' ? '511000 - Chèques à encaisser' :
        '571100 - Caisse Principale';

      const creditAccount = '411100 - Clients Divers Salubrité';

      const journalEntry = {
        id: `JNL-2026-${String(nextIndex).padStart(6, '0')}`,
        date: todayString,
        time: nowTime,
        reference: nextReceiptNo,
        description: `Encaissement rapide de redevance salubrité - client ${customer.name}`,
        amount: Number(amountPaid),
        debitAccount,
        creditAccount,
        operator: req.tokenUser.name,
        status: 'CONFIRMÉ'
      };

      const journalSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_JOURNAL' } });
      const journals = journalSetting ? JSON.parse(journalSetting.value) : [];
      journals.unshift(journalEntry);
      await prisma.setting.upsert({
        where: { key: 'AKPBF_ERP_JOURNAL' },
        update: { value: JSON.stringify(journals) },
        create: { key: 'AKPBF_ERP_JOURNAL', value: JSON.stringify(journals), desc: 'Journal General d\'Encaissement' }
      });

      // 9. Auditing and logging
      const auditLogEntry = {
        id: `AUD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: req.tokenUser.id,
        userName: req.tokenUser.name,
        action: 'Paiement enregistré',
        details: `Paiement reçu de ${Number(amountPaid).toLocaleString()} FCFA pour l'abonné ${customer.name}. Reçu n° ${nextReceiptNo} généré. Mode: ${paymentMethod}.`,
        timestamp: `${todayString} ${nowTime}`,
        ipAddress: req.ip || '127.0.0.1'
      };

      await prisma.auditLog.create({
        data: {
          userId: req.tokenUser.id,
          action: 'CREATE_PAYMENT',
          ipAddress: req.ip || '127.0.0.1',
          details: JSON.stringify(auditLogEntry)
        }
      });

      const auditSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_AUDIT_LOGS' } });
      const dbAudits = auditSetting ? JSON.parse(auditSetting.value) : [];
      dbAudits.unshift(auditLogEntry);
      await prisma.setting.upsert({
        where: { key: 'AKPBF_ERP_AUDIT_LOGS' },
        update: { value: JSON.stringify(dbAudits) },
        create: { key: 'AKPBF_ERP_AUDIT_LOGS', value: JSON.stringify(dbAudits), desc: 'Audit logs ERP' }
      });

      // 10. Email & SMS notifications
      const notifContent = `Cher(e) ${customer.name},\n\nNous confirmons la réception de votre versement de ${Number(amountPaid).toLocaleString()} FCFA le ${todayString} sous le numéro de reçu ${nextReceiptNo}.\n\nSolde restant : ${newBalanceVal.toLocaleString()} FCFA.\n\nMerci pour votre civisme et votre contribution à la propreté d'Abidjan.\n\nL'équipe AKPBF.`;
      
      const notifEntry = {
        id: `NTF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: customer.name,
        recipientContact: customer.email || customer.phone,
        type: 'email',
        templateName: 'Confirmation de paiement',
        content: notifContent,
        sentAt: `${todayString} ${nowTime}`,
        status: 'sent'
      };

      await prisma.notification.create({
        data: {
          customerId: customer.id,
          title: 'Confirmation de paiement',
          content: notifContent,
          isEmail: true,
          status: 'SENT'
        }
      });

      const notifSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_NOTIF_LOGS' } });
      const dbNotifs = notifSetting ? JSON.parse(notifSetting.value) : [];
      dbNotifs.unshift(notifEntry);
      await prisma.setting.upsert({
        where: { key: 'AKPBF_ERP_NOTIF_LOGS' },
        update: { value: JSON.stringify(dbNotifs) },
        create: { key: 'AKPBF_ERP_NOTIF_LOGS', value: JSON.stringify(dbNotifs), desc: 'Logs de notification' }
      });

      res.status(201).json({
        success: true,
        message: 'Encaissement rapide validé et enregistré en base de données.',
        receiptId: nextReceiptNo,
        receipt: newReceipt,
        journalEntry,
        auditLog: auditLogEntry,
        notification: notifEntry
      });
    } catch (err: any) {
      console.error('quickPayment error:', err);
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'encaissement rapide.' });
    }
  }
};
