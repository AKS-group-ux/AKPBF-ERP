import { Request, Response } from 'express';
import { EmailService } from '../services/emailService';
import { getPrismaClient } from '../config/database';

export const EmailController = {
  /**
   * Retrieves log histories aggregated from both PostgreSQL notification tables and active in-memory queue.
   */
  async getEmailLogs(req: Request, res: Response): Promise<void> {
    try {
      const queueList = EmailService.getQueue();
      let dbLogs: any[] = [];
      
      try {
        const prisma = getPrismaClient();
        dbLogs = await prisma.notification.findMany({
          where: { isEmail: true },
          orderBy: { createdAt: 'desc' },
          take: 50
        });
      } catch (dbErr) {
        console.warn('[EMAIL CONTROLLER DB WARNING] Failed loading database logs, falling back to empty. Error:', dbErr);
      }

      res.json({
        success: true,
        queue: queueList,
        dbLogs: dbLogs.map(log => ({
          id: log.id,
          to: log.content.split('|')[0]?.replace('Destinataire: ', '')?.trim() || 'Inconnu',
          subject: log.title.replace('[EMAIL] ', ''),
          status: log.status,
          createdAt: log.createdAt,
          content: log.content
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Impossible de récupérer l\'historique d\'envoi email.' });
    }
  },

  /**
   * Triggers background retry of all failed queue entries.
   */
  async retryFailedEmails(req: Request, res: Response): Promise<void> {
    try {
      const result = await EmailService.retryAllFailed();
      res.json({
        success: true,
        message: `${result.triggeredCount} emails en échec relancés avec succès.`,
        triggeredCount: result.triggeredCount
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Échec de la relance des emails.' });
    }
  },

  /**
   * Cleans past queue records.
   */
  async purgeQueue(req: Request, res: Response): Promise<void> {
    try {
      EmailService.purgeQueueLogs();
      res.json({
        success: true,
        message: 'File d\'envoi purgée avec succès.'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Sécurité de la file compromise.' });
    }
  },

  /**
   * Sends any of the 9 professional transaction templates instantly to a target address for verification.
   */
  async sendTemplateTest(req: Request, res: Response): Promise<void> {
    try {
      const { toEmail, templateType, clientName, amount, invoiceId, dueDate, reference, complaintId, category, replyText, customSubject, customBody } = req.body;

      if (!toEmail || !templateType) {
        res.status(400).json({ error: 'L\'adresse de destination (toEmail) et le type de modèle (templateType) sont requis.' });
        return;
      }

      let emailId = '';
      const emailRecipient = toEmail.trim();
      const mockName = clientName || 'Koffi Raphaël';
      const mockAmount = amount || '25000';
      const mockInvoice = invoiceId || 'INV-2026-6182';
      const mockDate = dueDate || '30 Mai 2026';
      const mockRef = reference || 'TXN-OM-8910-CIV';

      switch (templateType.toUpperCase()) {
        case 'WELCOME':
          emailId = await EmailService.sendWelcomeEmail(emailRecipient, mockName);
          break;
        case 'SUBSCRIPTION_CONFIRM':
          emailId = await EmailService.sendSubscriptionConfirmation(emailRecipient, mockName, 'Forfait Classique Riviera', mockAmount);
          break;
        case 'INVOICE_PDF':
          emailId = await EmailService.sendInvoicePdfEmail(emailRecipient, mockName, mockInvoice, mockAmount, mockDate);
          break;
        case 'PAYMENT_CONFIRM':
          emailId = await EmailService.sendPaymentConfirmation(emailRecipient, mockName, mockAmount, mockRef, new Date().toLocaleString('fr-FR'));
          break;
        case 'DUNNING_REMINDER':
          emailId = await EmailService.sendDunningReminder(emailRecipient, mockName, mockAmount, mockDate);
          break;
        case 'SUSPENSION_ALERT':
          emailId = await EmailService.sendSuspensionAlert(emailRecipient, mockName);
          break;
        case 'REACTIVATION_ALERT':
          emailId = await EmailService.sendReactivationAlert(emailRecipient, mockName);
          break;
        case 'COMPLAINT_REPLY':
          emailId = await EmailService.sendComplaintReply(
            emailRecipient, 
            mockName, 
            complaintId || 'REC-6192-CI', 
            category || 'NON_COLLECTE', 
            replyText || 'Nos bennes passeront rattraper la collecte Riviera 3 ce soir.'
          );
          break;
        case 'ADMIN_NOTIF':
          emailId = await EmailService.sendAdminNotification(
            customSubject || 'Alerte technique température serveurs',
            customBody || '<p>Le processeur d\'un container d\'assainissement du Plateau a franchi les 85°C sous forte charge.</p>'
          );
          break;
        default:
          res.status(400).json({ error: `Type de modèle de test inconnu : ${templateType}. Modèles légaux: WELCOME, SUBSCRIPTION_CONFIRM, INVOICE_PDF, PAYMENT_CONFIRM, DUNNING_REMINDER, SUSPENSION_ALERT, REACTIVATION_ALERT, COMPLAINT_REPLY, ADMIN_NOTIF` });
          return;
      }

      res.json({
        success: true,
        message: `Email test de type '${templateType}' mis en file sous la référence ${emailId}.`,
        emailId
      });
    } catch (err: any) {
      console.error('[TEST EMAIL DISPATCH ERROR]:', err);
      res.status(500).json({ error: `Échec d'envoi du test email sécurisé : ${err.message || err}` });
    }
  },

  /**
   * Retrieves current custom SMTP overrides and periodic financial digest schedule settings.
   */
  async getDigestSettings(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      
      const smtpSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_SMTP_CONFIG' } });
      const digestSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_DIGEST_CONFIG' } });

      const smtpConfig = smtpSetting ? JSON.parse(smtpSetting.value) : {
        enabled: false,
        host: 'smtp.zoho.com',
        port: '465',
        secure: true,
        user: '',
        pass: '',
        fromName: 'AKPBF ERP Assainissement'
      };

      const digestConfig = digestSetting ? JSON.parse(digestSetting.value) : {
        enabled: false,
        recipients: 'groupaksservices@gmail.com',
        period: 'HEBDOMADAIRE',
        dayOfWeek: '1', // Monday
        timeOfDay: '08:00'
      };

      // Strip password from response for frontend security but inform if configured
      const hasPassword = !!smtpConfig.pass;
      if (hasPassword) {
        smtpConfig.pass = '********';
      }

      res.json({
        success: true,
        smtpConfig,
        digestConfig,
        hasPassword
      });
    } catch (err: any) {
      console.error('[EMAIL CONTROLLER SETTINGS GET ERROR]:', err);
      res.status(500).json({ error: 'Impossible de récupérer la configuration des digests.' });
    }
  },

  /**
   * Saves custom SMTP client profiles and scheduler settings to the Setting database tables.
   */
  async saveDigestSettings(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const { smtpConfig, digestConfig } = req.body;

      if (smtpConfig) {
        // Resolve existing settings to avoid overwriting password placeholder with ********
        const existingSmtp = await prisma.setting.findUnique({ where: { key: 'AKPBF_SMTP_CONFIG' } });
        let resolvedPassword = smtpConfig.pass;
        if (existingSmtp && smtpConfig.pass === '********') {
          const parsed = JSON.parse(existingSmtp.value);
          resolvedPassword = parsed.pass;
        }

        const cleanSmtp = {
          ...smtpConfig,
          pass: resolvedPassword
        };

        await prisma.setting.upsert({
          where: { key: 'AKPBF_SMTP_CONFIG' },
          update: { value: JSON.stringify(cleanSmtp) },
          create: {
            key: 'AKPBF_SMTP_CONFIG',
            value: JSON.stringify(cleanSmtp),
            desc: 'Configuration personnalisée du serveur SMTP d\'expédition (Zoho, Gmail...)'
          }
        });
      }

      if (digestConfig) {
        await prisma.setting.upsert({
          where: { key: 'AKPBF_DIGEST_CONFIG' },
          update: { value: JSON.stringify(digestConfig) },
          create: {
            key: 'AKPBF_DIGEST_CONFIG',
            value: JSON.stringify(digestConfig),
            desc: 'Abonnement et planification du rapport de digest financier périodique SYSCOHADA'
          }
        });
      }

      res.json({
        success: true,
        message: 'Les préférences d\'expédition de salubrité et SMTP ont été enregistrées sur PostgreSQL.'
      });
    } catch (err: any) {
      console.error('[EMAIL CONTROLLER SETTINGS SAVE ERROR]:', err);
      res.status(500).json({ error: 'Impossible de sauvegarder vos préférences d\'envoi.' });
    }
  },

  /**
   * Instantly compiles and fires a real physical Syscohada statement report email.
   */
  async sendFinancialDigest(req: Request, res: Response): Promise<void> {
    try {
      const { recipients, period } = req.body;

      if (!recipients) {
        res.status(400).json({ error: 'Veuillez renseigner au moins une adresse email de destination.' });
        return;
      }

      const cleanRecipients = recipients.trim();
      const cleanPeriod = period || 'MANUEL';

      const emailId = await EmailService.sendFinancialDigest(cleanRecipients, cleanPeriod);

      res.json({
        success: true,
        message: `Synthèse financière d'assainissement envoyée avec succès à [${cleanRecipients}] sous la référence ${emailId}.`,
        emailId
      });
    } catch (err: any) {
      console.error('[EMAIL DISPATCH DIGEST ERROR]:', err);
      res.status(500).json({ error: `Échec compta de l'édition du digest : ${err.message || err}` });
    }
  }
};
