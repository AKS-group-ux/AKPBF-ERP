import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { PaymentController } from '../controllers/paymentController';
import { GpsController } from '../controllers/gpsController';
import { NotificationController } from '../controllers/notificationController';
import { DocumentController } from '../controllers/documentController';
import { EmailController } from '../controllers/emailController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

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

// ==========================================
// DOCUMENT & CONTRACTS SIGN (PHASE 10)
// ==========================================
router.get('/documents/generate', authenticateToken as any, DocumentController.generatePdf);
router.get('/documents/download/:docId', DocumentController.downloadDocument);

export default router;
