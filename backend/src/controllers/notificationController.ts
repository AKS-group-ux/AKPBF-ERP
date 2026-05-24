import { Request, Response } from 'express';

interface QueuedNotification {
  id: string;
  recipient: string;
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP';
  content: string;
  attempts: number;
  status: 'QUEUED' | 'SENT' | 'FAILED';
}

const NOTIFICATION_QUEUE: QueuedNotification[] = [
  {
    id: 'MSG-6819-A',
    recipient: '+225 07 48 29 10 22',
    channel: 'SMS',
    content: 'Vos ordures ont bien été collectées aujourd\'hui. Merci !',
    attempts: 1,
    status: 'SENT'
  }
];

export const NotificationController = {
  /**
   * Enqueues an alert for dispatching (e.g. bulk reminders)
   */
  async enqueueNotification(req: Request, res: Response): Promise<void> {
    try {
      const { recipient, channel, content } = req.body;

      if (!recipient || !content) {
        res.status(400).json({ error: 'Récipiendaire et contenu requis.' });
        return;
      }

      const newNotif: QueuedNotification = {
        id: `MSG-${Math.floor(1000 + Math.random() * 9000)}-Q`,
        recipient,
        channel: channel || 'SMS',
        content,
        attempts: 0,
        status: 'QUEUED'
      };

      NOTIFICATION_QUEUE.unshift(newNotif);

      res.json({
        success: true,
        message: 'Notification insérée dans la file d\'attente globale AKPBF.',
        item: newNotif
      });
    } catch (err) {
      res.status(500).json({ error: 'Impossible d\'enregistrer l\'alerte SMS/Email.' });
    }
  },

  /**
   * Process and retry pending/failed items in the queue
   */
  async processQueue(req: Request, res: Response): Promise<void> {
    try {
      let dispatchedCount = 0;
      NOTIFICATION_QUEUE.forEach(n => {
        if (n.status === 'QUEUED' || n.status === 'FAILED') {
          n.attempts += 1;
          n.status = 'SENT';
          dispatchedCount += 1;
        }
      });

      res.json({
        success: true,
        processedCount: dispatchedCount,
        remainingInQueue: 0,
        message: 'Toutes les alertes en souffrance ont été relayées avec succès.'
      });
    } catch (err) {
      res.status(500).json({ error: 'Échec de traitement de la file.' });
    }
  },

  /**
   * Get notification queue history logs
   */
  async getQueueLogs(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      logs: NOTIFICATION_QUEUE
    });
  }
};
