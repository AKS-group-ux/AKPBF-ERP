import { Request, Response } from 'express';
import { AccountingService } from '../services/accountingService';
import { getPrismaClient } from '../../../config/database';

export const AccountingController = {
  /**
   * Retrieves relational double entries from PostgreSQL
   */
  async getAccountingEntries(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const entries = await prisma.accountingEntry.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, count: entries.length, entries });
    } catch (e: any) {
      console.error('[AccountingController] Failed to fetch relational accounting entries:', e);
      res.status(500).json({ error: 'Erreur d’extraction comptable.' });
    }
  },
  /**
   * Loads the dynamic accounting module state for general ledger, P&L, balance sheets
   */
  async getState(req: any, res: Response): Promise<void> {
    try {
      const service = AccountingService.getInstance();
      const state = await service.getAccountingState();
      res.json({
        success: true,
        ...state
      });
    } catch (e: any) {
      console.error('[AccountingController] Failed to load accounting state:', e);
      res.status(500).json({ error: 'Erreur lors du chargement de l’état comptable ERP.' });
    }
  },

  /**
   * Adds a manual double entry verifying Debit = Credit balance
   */
  async addJournalEntry(req: any, res: Response): Promise<void> {
    try {
      const user = req.tokenUser;
      if (!user) {
        res.status(412).json({ error: 'Utilisateur non authentifié.' });
        return;
      }

      const role = String(user.role).toUpperCase();
      if (role !== 'ADMINISTRATEUR' && role !== 'COMPTABLE') {
        res.status(403).json({ error: 'Accès interdit. Seuls l’Administrateur ou le Comptable peuvent valider des écritures comptables d’exploitation.' });
        return;
      }

      const { date, reference, description, journalCode, lines } = req.body;

      if (!lines || !Array.isArray(lines) || lines.length < 2) {
        res.status(400).json({ error: 'Une écriture comptable doit contenir au moins deux lignes d’imputation (double entrée).' });
        return;
      }

      const service = AccountingService.getInstance();
      const result = await service.createManualEntry({
        date: date || new Date().toISOString().split('T')[0],
        reference: reference || 'OD-MAN',
        description: description || 'Écriture manuelle d’exploitation',
        journalCode: journalCode || 'OD',
        operator: user.name
      }, lines);

      res.status(201).json({
        success: true,
        message: 'Écriture comptable enregistrée et validée avec succès.',
        ...result
      });
    } catch (e: any) {
      console.error('[AccountingController] Failed to add journal entry:', e);
      res.status(400).json({ error: e.message || 'Erreur lors de la validation comptable.' });
    }
  },

  /**
   * Registers a real corporate expenditure on Abidjan resources
   */
  async addExpense(req: any, res: Response): Promise<void> {
    try {
      const user = req.tokenUser;
      if (!user) {
        res.status(412).json({ error: 'Utilisateur non authentifié.' });
        return;
      }

      const role = String(user.role).toUpperCase();
      if (role !== 'ADMINISTRATEUR' && role !== 'COMPTABLE' && role !== 'CAISSIER') {
        res.status(403).json({ error: 'Accès interdit. Seuls l’Administrateur, le Comptable ou le Caissier peuvent imputer des dépenses.' });
        return;
      }

      const { description, amount, date, categoryCode, paymentMethod, supplierName, isPaid } = req.body;

      if (!description || !amount || amount <= 0 || !categoryCode) {
        res.status(400).json({ error: 'La désignation, le montant (>0) et le type de charge sont obligatoires.' });
        return;
      }

      const service = AccountingService.getInstance();
      const expense = await service.registerExpense({
        description,
        amount: Number(amount),
        date: date || new Date().toISOString().split('T')[0],
        categoryCode,
        paymentMethod: paymentMethod || 'Espèces',
        supplierName,
        isPaid: isPaid ?? true
      });

      res.status(201).json({
        success: true,
        message: 'Dépense enregistrée et double écriture générée dans le journal comptable.',
        expense
      });
    } catch (e: any) {
      console.error('[AccountingController] Failed to register expense:', e);
      res.status(400).json({ error: e.message || 'Erreur de saisie de dépense.' });
    }
  },

  /**
   * Retrieves all suppliers
   */
  async getSuppliers(req: Request, res: Response): Promise<void> {
    try {
      const service = AccountingService.getInstance();
      const suppliers = await service.getSuppliers();
      res.json({ success: true, count: suppliers.length, suppliers });
    } catch (e: any) {
      console.error('[AccountingController] Failed to fetch suppliers:', e);
      res.status(500).json({ error: 'Erreur lors de la récupération des fournisseurs.' });
    }
  },

  /**
   * Retrieves all supplier invoices
   */
  async getSupplierInvoices(req: Request, res: Response): Promise<void> {
    try {
      const service = AccountingService.getInstance();
      const invoices = await service.getSupplierInvoices();
      res.json({ success: true, count: invoices.length, supplierInvoices: invoices });
    } catch (e: any) {
      console.error('[AccountingController] Failed to fetch supplier invoices:', e);
      res.status(500).json({ error: 'Erreur lors de la récupération des factures fournisseurs.' });
    }
  },

  /**
   * Registers a new Supplier
   */
  async addSupplier(req: any, res: Response): Promise<void> {
    try {
      const user = req.tokenUser;
      if (!user) {
        res.status(412).json({ error: 'Utilisateur non authentifié.' });
        return;
      }

      const role = String(user.role).toUpperCase();
      if (role !== 'ADMINISTRATEUR' && role !== 'COMPTABLE') {
        res.status(403).json({ error: 'Accès interdit. Seul l’Administrateur ou le Comptable peuvent créer des fournisseurs.' });
        return;
      }

      const { name, contactName, email, phone, address, category } = req.body;

      if (!name || !phone) {
        res.status(400).json({ error: 'Le nom du fournisseur et le numéro de téléphone sont obligatoires.' });
        return;
      }

      const service = AccountingService.getInstance();
      const supplier = await service.createSupplier({ name, contactName, email, phone, address, category });

      res.status(201).json({
        success: true,
        message: 'Fournisseur enregistré avec succès.',
        supplier
      });
    } catch (e: any) {
      console.error('[AccountingController] Failed to register supplier:', e);
      res.status(400).json({ error: e.message || 'Erreur lors de l’enregistrement.' });
    }
  },

  /**
   * Registers a new Supplier Invoice (creates standard liability journaling entry)
   */
  async addSupplierInvoice(req: any, res: Response): Promise<void> {
    try {
      const user = req.tokenUser;
      if (!user) {
        res.status(412).json({ error: 'Utilisateur non authentifié.' });
        return;
      }

      const role = String(user.role).toUpperCase();
      if (role !== 'ADMINISTRATEUR' && role !== 'COMPTABLE' && role !== 'CAISSIER') {
        res.status(403).json({ error: 'Accès interdit. Seul l’Administrateur, le Comptable ou le Caissier peuvent saisir des factures.' });
        return;
      }

      const { supplierId, invoiceNumber, amount, dueDate, category, justificatifUrl } = req.body;

      if (!supplierId || !invoiceNumber || !amount || amount <= 0) {
        res.status(400).json({ error: 'Le fournisseur cible, le numéro de facture et le montant (>0) sont requis.' });
        return;
      }

      const service = AccountingService.getInstance();
      const invoice = await service.createSupplierInvoice({
        supplierId,
        invoiceNumber,
        amount,
        dueDate,
        category,
        justificatifUrl
      });

      res.status(201).json({
        success: true,
        message: 'Facture fournisseur enregistrée et écriture d’engagement passée.',
        supplierInvoice: invoice
      });
    } catch (e: any) {
      console.error('[AccountingController] Failed to register supplier invoice:', e);
      res.status(400).json({ error: e.message || 'Erreur lors de la facturation.' });
    }
  },

  /**
   * Advances the validation sequence of a supplier invoice (Visa Comptable -> Visa Direction -> Paid)
   */
  async advanceSupplierInvoiceValidation(req: any, res: Response): Promise<void> {
    try {
      const user = req.tokenUser;
      if (!user) {
        res.status(412).json({ error: 'Utilisateur non authentifié.' });
        return;
      }

      const role = String(user.role).toUpperCase();
      if (role !== 'ADMINISTRATEUR' && role !== 'COMPTABLE') {
        res.status(403).json({ error: 'Accès interdit. Seuls l’Administrateur ou le Comptable peuvent valider des pièces de dépenses.' });
        return;
      }

      const { id } = req.params;

      const service = AccountingService.getInstance();
      const invoice = await service.advanceSupplierInvoiceValidation(id);

      res.json({
        success: true,
        message: `Statut de la facture mis à jour avec succès : ${
          invoice.status === 'pending_approval' ? 'Saisie validée, en attente du Visa Comptable.' :
          invoice.status === 'approved' ? 'Visa Comptable validé, en attente du Visa de la Direction.' :
          'Visa de la Direction émis. Règlement comptabilisé et payé avec succès.'
        }`,
        supplierInvoice: invoice
      });
    } catch (e: any) {
      console.error('[AccountingController] Failed to advance supplier invoice validation:', e);
      res.status(400).json({ error: e.message || 'Erreur lors de la validation.' });
    }
  }
};
