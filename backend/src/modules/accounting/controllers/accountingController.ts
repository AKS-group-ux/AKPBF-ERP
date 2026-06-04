import { Request, Response } from 'express';
import { AccountingService } from '../services/accountingService';

export const AccountingController = {
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
  }
};
