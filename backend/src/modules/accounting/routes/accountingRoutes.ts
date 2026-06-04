import { Router } from 'express';
import { AccountingController } from '../controllers/accountingController';
import { authenticateToken } from '../../../middleware/authMiddleware';

const router = Router();

router.get('/state', authenticateToken as any, AccountingController.getState);
router.post('/entries', authenticateToken as any, AccountingController.addJournalEntry);
router.post('/expenses', authenticateToken as any, AccountingController.addExpense);

export default router;
