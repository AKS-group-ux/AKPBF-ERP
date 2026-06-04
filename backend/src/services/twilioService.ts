import axios from 'axios';
import { ENV } from '../config/environment';
import { getPrismaClient } from '../config/database';

export interface TwilioConfig {
  enabled: boolean;
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  templateWelcome: string;
  templateNearDue: string;
  templateOverdue: string;
  templateAbonnement: string;
  templateCollecte: string;
  daysBeforeDue: number;
}

export interface SmsQueueItem {
  id: string;
  recipientPhone: string;
  content: string;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'SENT' | 'FAILED';
  lastError?: string;
  templateType: string;
  customerId?: string;
  createdAt: Date;
}

// Global In-Memory SMS dispatch and retry queue
const SMS_DISPATCH_QUEUE: SmsQueueItem[] = [];

// Helper to format international phone numbers, defaulting to Ivory Coast (+225)
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    // If it's a standard Ivorian phone number (typically 10 digits now, or older 8 digits)
    if (cleaned.length === 10 || cleaned.length === 8) {
      cleaned = '+225' + cleaned;
    } else if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    } else {
      cleaned = '+' + cleaned; // assume direct country code insertion
    }
  }
  return cleaned;
}

/**
 * Loads dynamic Twilio settings from the Setting database table.
 * Falls back to process.env variables if the setting record is undefined.
 */
export async function getTwilioConfig(): Promise<TwilioConfig> {
  const prisma = getPrismaClient();
  const defaultConfig: TwilioConfig = {
    enabled: true,
    accountSid: ENV.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID || '',
    authToken: ENV.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: ENV.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE_NUMBER || '',
    templateWelcome: "Bienvenue chez AKPBF. Votre compte a été créé avec succès.",
    templateNearDue: "Votre facture {invoiceRef} d'un montant de {amount} FCFA arrive à échéance le {dueDate}. Merci d'effectuer votre paiement afin d'éviter une interruption de service.",
    templateOverdue: "Votre facture {invoiceRef} de {amount} FCFA est en retard de paiement. Merci de régulariser votre situation.",
    templateAbonnement: "AKPBF Salubrité : Votre abonnement (Plan: {planName}) est désormais {statusEvent}.",
    templateCollecte: "AKPBF Salubrité - Collecte : {statusEvent} (Bac: {binCode}, Poids: {weight}kg).",
    daysBeforeDue: 5
  };

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'AKPBF_TWILIO_CONFIG' }
    });

    if (setting) {
      const dbConfig = JSON.parse(setting.value);
      return {
        ...defaultConfig,
        ...dbConfig
      };
    }
  } catch (e) {
    console.warn('[TWILIO SERVICE DB WARNING] Could not load dynamic settings. Using default environment vars.');
  }

  return defaultConfig;
}

export const TwilioService = {
  getQueue(): SmsQueueItem[] {
    return SMS_DISPATCH_QUEUE;
  },

  /**
   * Log transaction metrics straight into the Customer SQL history
   */
  async logSmsToDb(
    phone: string, 
    content: string, 
    status: 'SENT' | 'FAILED' | 'PENDING', 
    templateType: string,
    customerId?: string,
    errorMessage?: string
  ): Promise<void> {
    const prisma = getPrismaClient();
    try {
      // 1. Create a row in the relational Notification table
      const createdNotification = await prisma.notification.create({
        data: {
          title: `[SMS] ${templateType}`,
          content: `Destinataire: ${phone} | SMS: ${content}${errorMessage ? ` | Erreur: ${errorMessage}` : ''}`,
          isSms: true,
          isEmail: false,
          status: status,
          ...(customerId ? { customerId } : {})
        }
      });

      // 2. Query and push to the serialised JSON ledger table for modern Unified Log viewer
      const notifSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_NOTIF_LOGS' } });
      const currentNotifsList = notifSetting ? JSON.parse(notifSetting.value) : [];
      
      currentNotifsList.unshift({
        id: `NTF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: phone,
        recipientContact: phone,
        type: 'sms',
        templateName: templateType,
        content: content,
        sentAt: new Date().toISOString(),
        status: status.toLowerCase() === 'sent' ? 'sent' : 'failed'
      });

      await prisma.setting.upsert({
        where: { key: 'AKPBF_ERP_NOTIF_LOGS' },
        update: { value: JSON.stringify(currentNotifsList) },
        create: { key: 'AKPBF_ERP_NOTIF_LOGS', value: JSON.stringify(currentNotifsList), desc: 'Notifications logs list' }
      });

      console.log(`[TWILIO SERVICE SQL LOG] Saved SMS status '${status}' for ${phone} in database notification schemas.`);
    } catch (dbErr) {
      console.warn('[DATABASE TWILIO LOG WARNING] Could not write SMS state to Notification database context:', dbErr);
    }
  },

  /**
   * Real and Functional Twilio SMS Sender. No simulation.
   * Directly hits Twilio REST API Endpoint.
   */
  async sendSms(
    toPhone: string, 
    content: string, 
    templateType: string,
    customerId?: string
  ): Promise<string> {
    const config = await getTwilioConfig();

    if (!config.enabled) {
      const errorMsg = "L'envoi de SMS est désactivé au niveau de l'administration.";
      await this.logSmsToDb(toPhone, content, 'FAILED', templateType, customerId, errorMsg);
      throw new Error(errorMsg);
    }

    if (!config.accountSid || !config.authToken || !config.phoneNumber) {
      const errorMsg = "Identifiants Twilio manquants ou configuration incomplète (Veuillez définir SID, Token, Numéro).";
      await this.logSmsToDb(toPhone, content, 'FAILED', templateType, customerId, errorMsg);
      throw new Error(errorMsg);
    }

    const formattedTo = formatPhoneNumber(toPhone);
    const formattedFrom = formatPhoneNumber(config.phoneNumber);

    console.log(`[TWILIO REST SENDER] Attempting real SMS dispatch. To: ${formattedTo}, From: ${formattedFrom}, Message Length: ${content.length}`);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    const credentialsBase64 = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
    
    const urlParams = new URLSearchParams({
      To: formattedTo,
      From: formattedFrom,
      Body: content
    });

    try {
      const twilioResponse = await axios.post(url, urlParams, {
        headers: {
          'Authorization': `Basic ${credentialsBase64}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // 10s network timeout
      });

      console.log(`[TWILIO SUCCESS] Message successfully accepted by Twilio networks. SID: ${twilioResponse.data.sid}, Status: ${twilioResponse.data.status}`);
      await this.logSmsToDb(formattedTo, content, 'SENT', templateType, customerId);
      
      return twilioResponse.data.sid;
    } catch (apiError: any) {
      let friendlyError = "Erreur réseau inconnue lors du relais Twilio.";
      
      if (apiError.response && apiError.response.data) {
        const errData = apiError.response.data;
        const twilioCode = errData.code;
        const twilioMsg = errData.message;

        console.error(`[TWILIO ERROR RESPONDED] Code: ${twilioCode}, Message: ${twilioMsg}`);

        // Custom Error Mapping for professional, precise Twilio Status Handling
        switch (twilioCode) {
          case 21211:
            friendlyError = "Le numéro de téléphone du citoyen est invalide ou mal formaté.";
            break;
          case 21611:
            friendlyError = "CréditTwilio insuffisant ou solde épuisé pour le compte opérateur.";
            break;
          case 21610:
            friendlyError = "Destinataire bloqué : L'abonné a refusé de recevoir les SMS AKPBF (STOP option).";
            break;
          case 21614:
            friendlyError = "Impossible d'acheminer le SMS : Ce numéro ne prend pas en charge la réception de SMS.";
            break;
          default:
            friendlyError = `Erreur Twilio [Code ${twilioCode}] : ${twilioMsg}`;
        }
      } else if (apiError.code === 'ECONNABORTED') {
        friendlyError = "Timeout réseau dépassé lors de la liaison au serveur Twilio (10s dépassés).";
      } else {
        friendlyError = `Erreur de transport réseau HTTP: ${apiError.message}`;
      }

      console.error(`[TWILIO DISPATCH FAILED] SMS transmission failed. Friendly Error: ${friendlyError}`);
      await this.logSmsToDb(formattedTo, content, 'FAILED', templateType, customerId, friendlyError);
      
      throw new Error(friendlyError);
    }
  },

  /**
   * Pushes a new alert into the pending transmission queue
   */
  async enqueueSms(
    toPhone: string, 
    content: string, 
    templateType: string,
    customerId?: string
  ): Promise<SmsQueueItem> {
    const id = `SMS-${Math.floor(100000 + Math.random() * 900000)}`;
    const newItem: SmsQueueItem = {
      id,
      recipientPhone: toPhone,
      content,
      attempts: 0,
      maxAttempts: 3,
      status: 'PENDING',
      templateType,
      customerId,
      createdAt: new Date()
    };

    SMS_DISPATCH_QUEUE.unshift(newItem);
    console.log(`[SMS QUEUE] Enqueued message ${id} to ${toPhone}. Current queue size: ${SMS_DISPATCH_QUEUE.length}`);

    // Trigger immediate background dispatch asynchronously
    this._processQueueItem(newItem).catch(err => {
      console.error(`[SMS ASYNC BG ENGINE] Failed to auto-dispatch message ${id}:`, err.message);
    });

    return newItem;
  },

  /**
   * Process a single queued element with automatic retry policy
   */
  async _processQueueItem(item: SmsQueueItem): Promise<boolean> {
    if (item.status === 'SENT') return true;

    item.attempts += 1;
    console.log(`[SMS BG PROCESSOR] Sending item ${item.id} (Attempt ${item.attempts}/${item.maxAttempts})`);

    try {
      item.status = 'PENDING';
      await this.sendSms(item.recipientPhone, item.content, item.templateType, item.customerId);
      item.status = 'SENT';
      delete item.lastError;
      return true;
    } catch (err: any) {
      item.lastError = err.message;
      if (item.attempts >= item.maxAttempts) {
        item.status = 'FAILED';
        console.error(`[SMS QUEUE FATAL] Item ${item.id} reached max retry attempts. Marking FAILED.`);
      } else {
        item.status = 'PENDING';
        console.warn(`[SMS QUEUE WARNING] Item ${item.id} failed, will retry during next manual or automatic run. Error: ${err.message}`);
      }
      return false;
    }
  },

  /**
   * Process and retry pending/failed items in the queue
   */
  async processAllQueue(): Promise<{ processedCount: number; successCount: number; failedCount: number }> {
    const pendingItems = SMS_DISPATCH_QUEUE.filter(item => item.status === 'PENDING' || item.status === 'FAILED');
    let successCount = 0;
    let failedCount = 0;

    console.log(`[SMS MANUAL RETRY RUN] Processing ${pendingItems.length} items from the queue...`);

    for (const item of pendingItems) {
      const ok = await this._processQueueItem(item);
      if (ok) {
        successCount++;
      } else {
        failedCount++;
      }
      // Brief sleep throttle to prevent spamming Twilio / cellular operators
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    return {
      processedCount: pendingItems.length,
      successCount,
      failedCount
    };
  },

  /**
   * Clears old history logs from in-memory queue
   */
  purgeQueue(): void {
    const active = SMS_DISPATCH_QUEUE.filter(item => item.status === 'PENDING');
    SMS_DISPATCH_QUEUE.length = 0;
    SMS_DISPATCH_QUEUE.push(...active);
  }
};
