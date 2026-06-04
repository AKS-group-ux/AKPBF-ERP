import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { PaymentController } from '../controllers/paymentController';
import { GpsController } from '../controllers/gpsController';
import { NotificationController } from '../controllers/notificationController';
import { DocumentController } from '../controllers/documentController';
import { EmailController } from '../controllers/emailController';
import { ErpController } from '../controllers/erpController';
import { authenticateToken } from '../middleware/authMiddleware';

import { UserController } from '../controllers/userController';
import accountingRoutes from '../modules/accounting/routes/accountingRoutes';

const router = Router();

// ==========================================
// REAL POSTGRESQL ERP STATE & CRUD MODULE
// ==========================================
router.get('/erp/state', authenticateToken as any, ErpController.getState);
router.post('/erp/ledger', authenticateToken as any, ErpController.saveLedger);
router.post('/erp/subscribers', ErpController.addSubscriber); // Guest signup on LandingPage
router.put('/erp/subscribers/:id', authenticateToken as any, ErpController.updateSubscriber);
router.delete('/erp/subscribers/:id', authenticateToken as any, ErpController.softDeleteRecord); // Soft Delete / logical archiving
router.post('/erp/invoices', authenticateToken as any, ErpController.addInvoice);
router.post('/erp/payments/quick', authenticateToken as any, ErpController.quickPayment);

// ==========================================
// USER MANAGEMENT ENDPOINTS
// ==========================================
router.get('/users', authenticateToken as any, UserController.listUsers);
router.post('/users', authenticateToken as any, UserController.createUser);
router.put('/users/:id', authenticateToken as any, UserController.updateUser);
router.delete('/users/:id', authenticateToken as any, UserController.deleteUser);
router.post('/users/:id/reset', authenticateToken as any, UserController.resetPassword);
router.put('/users/:id/status', authenticateToken as any, UserController.toggleStatus);

// ==========================================
// BILLING ENDPOINTS (PHASE 6)
// ==========================================
router.post('/billing/cycle', authenticateToken as any, BillingController.runBillingCycle);
router.get('/billing/debts', authenticateToken as any, BillingController.getUnpaidDebts);
router.post('/billing/auto-suspend', authenticateToken as any, BillingController.triggerAutoSuspensions);

// ==========================================
// MOBILE MONEY PAYMENT ENDPOINTS (PHASE 7)
// ==========================================
router.post('/payments/charge', authenticateToken as any, PaymentController.initiatePayment);
router.post('/payments/webhook', PaymentController.handleWebhook);
router.get('/payments/status/:reference', authenticateToken as any, PaymentController.checkStatus);

// ==========================================
// GPS & POSTGIS ENDPOINTS (PHASE 8)
// ==========================================
router.get('/gps/vehicles', authenticateToken as any, GpsController.getLiveVehicles);
router.post('/gps/optimize', authenticateToken as any, GpsController.getOptimizedRoute);

// ==========================================
// SMS / QUEUED NOTIFICATIONS (PHASE 9)
// ==========================================
router.get('/notifications/settings', authenticateToken as any, NotificationController.getNotificationSettings);
router.post('/notifications/settings', authenticateToken as any, NotificationController.saveNotificationSettings);
router.post('/notifications/send-test-sms', authenticateToken as any, NotificationController.sendTestSms);
router.post('/notifications/enqueue', authenticateToken as any, NotificationController.enqueueNotification);
router.post('/notifications/trigger-retry', authenticateToken as any, NotificationController.processQueue);
router.get('/notifications/logs', authenticateToken as any, NotificationController.getQueueLogs);

// ==========================================
// EMAIL MODULE & ZOHO SMTP TESTING
// ==========================================
router.get('/email/logs', authenticateToken as any, EmailController.getEmailLogs);
router.post('/email/retry', authenticateToken as any, EmailController.retryFailedEmails);
router.post('/email/purge', authenticateToken as any, EmailController.purgeQueue);
router.post('/email/send-test', authenticateToken as any, EmailController.sendTemplateTest);
router.get('/email/digest/settings', authenticateToken as any, EmailController.getDigestSettings);
router.post('/email/digest/settings', authenticateToken as any, EmailController.saveDigestSettings);
router.post('/email/digest/send', authenticateToken as any, EmailController.sendFinancialDigest);

// ==========================================
// DOCUMENT & CONTRACTS SIGN (PHASE 10)
// ==========================================
router.get('/documents/generate', authenticateToken as any, DocumentController.generatePdf);
router.get('/documents/invoice/:id/pdf', DocumentController.getInvoicePdf);
router.get('/documents/contract/:id/pdf', DocumentController.getContractPdf);
router.get('/documents/receipt/:id/pdf', DocumentController.getReceiptPdf);
router.get('/documents/report/:id/pdf', DocumentController.getReportPdf);
router.get('/documents/download/:docId', DocumentController.downloadDocument);

// ==========================================
// ERP COMPTABILITE SYSCOHADA (REST API)
// ==========================================
router.use('/accounting', accountingRoutes);

export default router;
