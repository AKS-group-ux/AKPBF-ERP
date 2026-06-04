import { Request, Response } from 'express';
import { TwilioService, getTwilioConfig, formatPhoneNumber } from '../services/twilioService';
import { getPrismaClient } from '../config/database';

export const NotificationController = {
  /**
   * Retrieves Twilio configuration and alert templates
   */
  async getNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const config = await getTwilioConfig();
      res.json({
        success: true,
        settings: config
      });
    } catch (err: any) {
      console.error('[SETTINGS GET ERR] Failed reading Twilio/Notification settings:', err);
      res.status(500).json({ error: 'Échec du chargement de la configuration des SMS.' });
    }
  },

  /**
   * Saves Twilio credentials and custom templates to PostgreSQL database
   */
  async saveNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const newSettings = req.body;

      if (newSettings === undefined || typeof newSettings !== 'object') {
        res.status(400).json({ error: 'Données de configuration invalides.' });
        return;
      }

      // Convert daysBeforeDue to integer safely
      if (newSettings.daysBeforeDue !== undefined) {
        newSettings.daysBeforeDue = parseInt(newSettings.daysBeforeDue, 10) || 5;
      }

      await prisma.setting.upsert({
        where: { key: 'AKPBF_TWILIO_CONFIG' },
        update: { value: JSON.stringify(newSettings) },
        create: {
          key: 'AKPBF_TWILIO_CONFIG',
          value: JSON.stringify(newSettings),
          desc: 'Configuration opérationnelle de Twilio SMS et Gabarits AKPBF'
        }
      });

      res.json({
        success: true,
        message: 'Paramètres Twilio et gabarits de messages enregistrés avec succès.',
        settings: newSettings
      });
    } catch (err: any) {
      console.error('[SETTINGS SAVE ERR] Failed updating settings:', err);
      res.status(500).json({ error: 'Échec de la sauvegarde des paramètres.' });
    }
  },

  /**
   * Enqueues an alert for dispatching
   */
  async enqueueNotification(req: Request, res: Response): Promise<void> {
    try {
      const { recipient, content, templateType, customerId } = req.body;

      if (!recipient || !content) {
        res.status(400).json({ error: 'Numéro de téléphone destinataire et contenu requis.' });
        return;
      }

      const enqueued = await TwilioService.enqueueSms(
        recipient,
        content,
        templateType || 'ALERTE_MANUELLE',
        customerId
      );

      res.json({
        success: true,
        message: 'Notification SMS insérée dans la file d\'attente globale.',
        item: enqueued
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Impossible de mettre le SMS en file d\'attente: ' + err.message });
    }
  },

  /**
   * Process and retry pending/failed items in the queue
   */
  async processQueue(req: Request, res: Response): Promise<void> {
    try {
      const result = await TwilioService.processAllQueue();
      res.json({
        success: true,
        message: 'Traitement de la file d\'attente SMS terminé.',
        statistics: result
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Échec de traitement de la file SMS: ' + err.message });
    }
  },

  /**
   * Get notification queue history logs from database (Notification table) and active queue
   */
  async getQueueLogs(req: Request, res: Response): Promise<void> {
    try {
      const prisma = getPrismaClient();
      let dbLogs: any[] = [];

      try {
        dbLogs = await prisma.notification.findMany({
          where: { isSms: true },
          orderBy: { createdAt: 'desc' },
          take: 100 // return last 100 logs
        });
      } catch (dbErr) {
        console.warn('[NOTIF CONTROLLER GET LOGS WARNING] Postgres logs failed to load. Falling back to memory log. error:', dbErr);
      }

      // Format response to fit the frontend registry schema
      const formattedDbLogs = dbLogs.map(log => {
        // extract recipient Phone from body if stored like "Destinataire: +225... | SMS: ...""
        let phone = '+225 00 00 00 00';
        let body = log.content;
        
        if (log.content.includes('|')) {
          const parts = log.content.split('|');
          const destPart = parts[0]?.trim();
          const smsPart = parts[1]?.trim();
          
          if (destPart && destPart.startsWith('Destinataire:')) {
            phone = destPart.replace('Destinataire:', '').trim();
          }
          if (smsPart && smsPart.startsWith('SMS:')) {
            body = smsPart.replace('SMS:', '').trim();
          }
        }

        const templateName = log.title?.replace('[SMS] ', '') || 'Alerte';

        return {
          id: log.id,
          recipientName: phone, // display phone as fallback name or query actual customer if needed
          recipientContact: phone,
          type: 'sms',
          templateName: templateName,
          content: body,
          sentAt: log.createdAt.toISOString(),
          status: log.status === 'SENT' ? 'sent' : 'failed',
          lastError: log.content.includes('Erreur:') ? log.content.split('Erreur:')[1]?.trim() : undefined
        };
      });

      // Include active in-memory queue items if they are still pending
      const queueList = TwilioService.getQueue();
      const formattedQueueLogs = queueList.map(item => ({
        id: item.id,
        recipientName: item.recipientPhone,
        recipientContact: item.recipientPhone,
        type: 'sms',
        templateName: item.templateType,
        content: item.content,
        sentAt: item.createdAt.toISOString(),
        status: item.status === 'SENT' ? 'sent' : 'pending',
        lastError: item.lastError
      }));

      // Merge and return
      res.json({
        success: true,
        logs: [...formattedQueueLogs, ...formattedDbLogs]
      });
    } catch (err: any) {
      console.error('[GET LOGS ERR] Failed pulling SMS logs history:', err);
      res.status(500).json({ error: 'Impossible de récupérer l\'historique d\'envoi SMS.' });
    }
  },

  /**
   * Fires a real-time Test SMS to verify Twilio connectivity. No simulation.
   */
  async sendTestSms(req: Request, res: Response): Promise<void> {
    try {
      const { toPhone, body } = req.body;

      if (!toPhone || !body) {
        res.status(400).json({ error: "Le numéro de téléphone (toPhone) et le texte du message (body) sont obligatoires." });
        return;
      }

      console.log(`[TEST DISPATCH] Firing instant operational SMS test to: ${toPhone}`);
      const sid = await TwilioService.sendSms(toPhone, body, 'REALTIME_TEST');

      res.json({
        success: true,
        message: `Félicitations ! Le SMS de test a été envoyé avec succès via les routes de liaison Twilio.`,
        sid: sid,
        formattedPhone: formatPhoneNumber(toPhone)
      });
    } catch (err: any) {
      console.error('[TEST SMS DISPATCH FAILED] Direct trigger received exception:', err.message);
      res.status(400).json({
        success: false,
        error: err.message || "La liaison Twilio a échoué. Veuillez vérifier vos clés SID/Token et le solde de votre compte Twilio."
      });
    }
  }
};
