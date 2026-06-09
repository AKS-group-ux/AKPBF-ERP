import { Router } from 'express';
import { AccountingController } from '../controllers/accountingController';
import { authenticateToken } from '../../../middleware/authMiddleware';

const router = Router();

router.get('/state', authenticateToken as any, AccountingController.getState);
router.post('/entries', authenticateToken as any, AccountingController.addJournalEntry);
router.post('/expenses', authenticateToken as any, AccountingController.addExpense);
router.get('/', authenticateToken as any, AccountingController.getAccountingEntries);

// Supplier Workflows
router.get('/suppliers', authenticateToken as any, AccountingController.getSuppliers);
router.post('/suppliers', authenticateToken as any, AccountingController.addSupplier);
router.get('/supplier-invoices', authenticateToken as any, AccountingController.getSupplierInvoices);
router.post('/supplier-invoices', authenticateToken as any, AccountingController.addSupplierInvoice);
router.post('/supplier-invoices/:id/advance', authenticateToken as any, AccountingController.advanceSupplierInvoiceValidation);

export default router;
