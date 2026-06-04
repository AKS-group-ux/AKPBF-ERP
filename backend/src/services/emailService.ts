import nodemailer from 'nodemailer';
import { ENV } from '../config/environment';
import { getPrismaClient } from '../config/database';

export interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  htmlContent: string;
  attempts: number;
  maxAttempts: number;
  status: 'PENDING' | 'SENT' | 'FAILED';
  lastError?: string;
  templateType: string;
  customerId?: string;
}

// In-memory queue to store emails that are sending / retrying
const EMAIL_DISPATCH_QUEUE: EmailQueueItem[] = [];

// Lazy-initialized Nodemailer transporter
let transporterInstance: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporterInstance) {
    const isMock = !ENV.ZOHO_SMTP_PASS;
    if (isMock) {
      console.warn('[ZOHO SMTP CONFIG] ZOHO_SMTP_PASS isn\'t set. Initializing sandbox mock transport.');
    }
    
    // Configure production SMTP using Zoho Mail specifications
    transporterInstance = nodemailer.createTransport({
      host: ENV.ZOHO_SMTP_HOST,
      port: Number(ENV.ZOHO_SMTP_PORT) || 465,
      secure: ENV.ZOHO_SMTP_SECURE === true || Number(ENV.ZOHO_SMTP_PORT) === 465, // true for port 465, false for 587
      auth: {
        user: ENV.ZOHO_SMTP_USER,
        pass: ENV.ZOHO_SMTP_PASS || 'faked_app_password_for_sandbox',
      },
      tls: {
        rejectUnauthorized: false // bypass certificates if testing internally, safe for server instances
      }
    });
  }
  return transporterInstance;
}

/**
 * Checks for custom SMTP configuration in the Setting database table.
 * If active and credentials exist, instantiates a custom transporter to support sending real emails.
 */
async function getDynamicTransporter(): Promise<{ transporter: nodemailer.Transporter; senderUser: string; senderFromName: string }> {
  try {
    const prisma = getPrismaClient();
    const smtpSetting = await prisma.setting.findUnique({
      where: { key: 'AKPBF_SMTP_CONFIG' }
    });
    if (smtpSetting) {
      const config = JSON.parse(smtpSetting.value);
      if (config && config.enabled && config.pass && config.user) {
        const customTransporter = nodemailer.createTransport({
          host: config.host || 'smtp.zoho.com',
          port: Number(config.port) || 465,
          secure: config.secure === true || config.secure === 'true' || Number(config.port) === 465,
          auth: {
            user: config.user,
            pass: config.pass
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        return {
          transporter: customTransporter,
          senderUser: config.user,
          senderFromName: config.fromName || ENV.ZOHO_FROM_NAME
        };
      }
    }
  } catch (e) {
    console.warn('[SMTP OVERRIDE DB LOOKUP WARNING] Custom SMTP settings failed to load, using environment defaults.', e);
  }

  return {
    transporter: getTransporter(),
    senderUser: ENV.ZOHO_SMTP_USER,
    senderFromName: ENV.ZOHO_FROM_NAME
  };
}

export const EmailService = {
  /**
   * Get active queue listing for the administration panel
   */
  getQueue(): EmailQueueItem[] {
    return EMAIL_DISPATCH_QUEUE;
  },

  /**
   * Clears completed or failed items from history list
   */
  purgeQueueLogs(): void {
    const active = EMAIL_DISPATCH_QUEUE.filter(item => item.status === 'PENDING');
    EMAIL_DISPATCH_QUEUE.length = 0;
    EMAIL_DISPATCH_QUEUE.push(...active);
  },

  /**
   * Writes email logs directly to the PostgreSQL database if available
   */
  async logEmailToDb(
    to: string, 
    subject: string, 
    status: 'SENT' | 'FAILED' | 'PENDING', 
    customerId?: string
  ): Promise<void> {
    try {
      const prisma = getPrismaClient();
      await prisma.notification.create({
        data: {
          title: `[EMAIL] ${subject}`,
          content: `Destinataire: ${to} | Statut d'envoi: ${status}`,
          isEmail: true,
          isSms: false,
          status: status === 'SENT' ? 'SENT' : status === 'FAILED' ? 'FAILED' : 'PENDING',
          // Optionally link to customer if we find their UUID in the system
          ...(customerId ? { customerId } : {})
        }
      });
      console.log(`[POSTGRES NOTIFICATION SQL LOG] Saved email status '${status}' for recipient ${to}`);
    } catch (dbErr) {
      console.warn('[DATABASE LOG WARNING] Could not save email state to database table. Logging to fallback memory:', dbErr);
    }
  },

  /**
   * Enqueues an email into the background dispatch system
   */
  async enqueueEmail(
    to: string, 
    subject: string, 
    htmlContent: string, 
    templateType: string,
    customerId?: string
  ): Promise<string> {
    const id = `EML-${Math.floor(100000 + Math.random() * 900000)}`;
    const newItem: EmailQueueItem = {
      id,
      to,
      subject,
      htmlContent,
      attempts: 0,
      maxAttempts: 3,
      status: 'PENDING',
      templateType,
      customerId
    };

    EMAIL_DISPATCH_QUEUE.unshift(newItem);
    
    // Log immediately as pending in DB
    await this.logEmailToDb(to, subject, 'PENDING', customerId);

    // Run dispatch asynchronously without blocking response
    this.processSingleQueueItem(newItem).catch(err => {
      console.error(`[BACKGROUND WORKER ERROR] Failed on email '${id}':`, err);
    });

    return id;
  },

  /**
   * Process a single queue item with exponential backoff retries
   */
  async processSingleQueueItem(item: EmailQueueItem): Promise<boolean> {
    item.attempts += 1;
    console.log(`[EMAIL DISPATCH] Attempt ${item.attempts}/${item.maxAttempts} for [${item.id}] targeting ${item.to}`);

    try {
      const { transporter, senderUser, senderFromName } = await getDynamicTransporter();
      
      // If we are in dev/preview sandbox and SMTP password is dummy and no custom SMTP, mock send
      const isMockMode = !ENV.ZOHO_SMTP_PASS && senderUser === ENV.ZOHO_SMTP_USER;
      if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 600));
        console.log('--------------------------------------------------');
        console.log(`🚀 [SIMULATION SMTP ZOHO] ENVOI REUSSI POUR : ${item.to}`);
        console.log(`Sujet : ${item.subject}`);
        console.log(`Type de modèle : ${item.templateType}`);
        console.log('--------------------------------------------------');
      } else {
        // Real SMTP Relay delivery
        await transporter.sendMail({
          from: `"${senderFromName}" <${senderUser}>`,
          to: item.to,
          subject: item.subject,
          html: item.htmlContent,
        });
      }

      item.status = 'SENT';
      delete item.lastError;
      
      // Update DB record
      await this.logEmailToDb(item.to, item.subject, 'SENT', item.customerId);
      return true;
    } catch (err: any) {
      const errMsg = err.message || String(err);
      item.lastError = errMsg;
      console.error(`❌ [SMTP FAILURE] Failed sending email [${item.id}] to ${item.to}:`, errMsg);

      if (item.attempts < item.maxAttempts) {
        // Retry with generic backoff multiplier delay
        const retryDelay = Math.pow(2, item.attempts) * 2000; // 4s, 8s, etc.
        console.warn(`[RETRY SCHEDULER] Re-attempting inside ${retryDelay}ms...`);
        item.status = 'PENDING';
        
        setTimeout(() => {
          this.processSingleQueueItem(item).catch(e => console.error(e));
        }, retryDelay);
      } else {
        item.status = 'FAILED';
        await this.logEmailToDb(item.to, item.subject, 'FAILED', item.customerId);
      }
      return false;
    }
  },

  /**
   * Triggers manual bulk retry for all failed items in the queue
   */
  async retryAllFailed(): Promise<{ triggeredCount: number }> {
    const failedItems = EMAIL_DISPATCH_QUEUE.filter(item => item.status === 'FAILED');
    failedItems.forEach(item => {
      item.attempts = 0;
      item.status = 'PENDING';
      this.processSingleQueueItem(item).catch(err => console.error(err));
    });
    return { triggeredCount: failedItems.length };
  },

  // ====================================================
  // HTML EMAIL PROFESSIONAL MASTER TEMPLATES
  // ====================================================

  /**
   * Master layout wrapper providing crisp typography, high-contrast, responsive and enterprise Côte d'Ivoire banner representation
   */
  buildMasterTemplate(title: string, bodyHtml: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            color: #0f172a;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 4px solid #ea580c;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .header p {
            color: #a7f3d0;
            margin: 5px 0 0 0;
            font-size: 13px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .content {
            padding: 35px 30px;
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
          }
          .badge {
            display: inline-block;
            padding: 5px 12px;
            background-color: #059669/10;
            color: #059669;
            font-size: 12px;
            font-weight: bold;
            border-radius: 9999px;
            margin-bottom: 15px;
          }
          .footer {
            background-color: #f8fafc;
            padding: 25px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #f1f5f9;
          }
          .button {
            display: inline-block;
            background-color: #ea580c;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            background-color: #c2410c;
          }
          .info-block {
            background-color: #f8fafc;
            border-left: 4px solid #059669;
            padding: 15px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
          }
          .text-muted {
            font-size: 12px;
            color: #94a3b8;
          }
          .signature {
            margin-top: 30px;
            border-top: 1px dashed #e2e8f0;
            padding-top: 20px;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AKPBF ERP</h1>
            <p>Assainissement & Salubrité de Côte d'Ivoire</p>
          </div>
          <div class="content">
            ${bodyHtml}
          </div>
          <div class="footer">
            <p><strong>AKPBF ERP CI - Bureau Régional</strong></p>
            <p>Boulevard de la République, Plateau, Abidjan, Côte d'Ivoire</p>
            <p className="text-muted">Cet email a été transmis par un automate sécurisé d'AKPBF. Veuillez ne pas répondre directement.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  /**
   * Standardized templates generator
   */

  // 1. Email de bienvenue (Welcome Email)
  async sendWelcomeEmail(to: string, name: string, role: string = 'CLIENT', customerId?: string): Promise<string> {
    const subject = 'Bienvenue chez AKPBF - Votre compte ERP est validé';
    const portalUrl = ENV.DATABASE_URL ? 'https://akpbf.com/portal' : '#';
    const body = `
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 16px; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; font-family: monospace; font-size: 24px; font-weight: 900; text-align: center; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.2);">
          AK
        </div>
      </div>
      <div class="badge">COMPTE ACTIF / BIENVENUE</div>
      <h2>Bonjour ${name},</h2>
      <p>Nous sommes particulièrement ravis de vous souhaiter la bienvenue sur la plateforme ERP AKPBF d'Abidjan. Notre alliance d'action vise à préserver la salubrité et l'écosystème environnemental de notre capitale.</p>
      
      <p>Votre compte sécurisé a été mis en service avec le rôle système suivant : <strong style="color: #059669; background-color: #f0fdf4; padding: 2px 8px; border-radius: 4px;">${role}</strong>.</p>

      <p>Grâce à votre inscription, vous disposez d'un accès complet au <strong>Portail AKPBF</strong> où vous pourrez exécuter toutes vos opérations :</p>
      <ul>
        <li>Règlement sécurisé des cotisations d'assainissement par Mobile Money (Orange, Moov, Wave, Telecel)</li>
        <li>Suivi en temps réel de la géolocalisation des camions collecteurs d'Abidjan</li>
        <li>Téléchargement immédiat de factures, contrats officiels et quittances de paiement en PDF</li>
        <li>Déclaration interactive d'incidents et de non-levées de bacs connectés</li>
      </ul>

      <div class="info-block">
        <strong>Identifiants de Connexion :</strong><br>
        • Nom d'utilisateur : <strong>${to}</strong><br>
        • Rôle : <strong>${role}</strong><br>
        <em>Veuillez vous authentifier en utilisant votre adresse e-mail ainsi que votre mot de passe pour accéder en toute sécurité à vos outils AKPBF.</em>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${portalUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">Accéder au Portail AKPBF</a>
      </div>

      <p>Une question ou besoin d'une assistance technique ? Notre équipe de support citoyen d'Abidjan est disponible 24h/7j pour vous accompagner :</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; line-height: 1.8;">
        📧 Email : <strong>support@akpbf.com</strong><br>
        📞 Téléphone d'Assistance : <strong>+225 05 00 00 00 01</strong>
      </div>

      <p>Merci pour votre implication et votre civisme.</p>
      
      <div class="signature">
        Cordialement,<br>
        <strong>Moustapha Sylla</strong><br>
        Directeur des Services Clients & DSI, AKPBF
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'WELCOME', customerId);
  },

  // Email de récupération (Forgot Password Email)
  async sendForgotPasswordEmail(to: string, name: string, token: string): Promise<string> {
    const subject = '[AKPBF] Demande de réinitialisation de mot de passe';
    const appUrl = ENV.DATABASE_URL ? 'https://ais-dev-5fggc2ufvae435qusd4yba-575036587204.europe-west2.run.app' : 'https://ais-dev-5fggc2ufvae435qusd4yba-575036587204.europe-west2.run.app';
    const resetUrl = `${appUrl}/login?mode=reset&token=${token}&email=${encodeURIComponent(to)}`;
    const body = `
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 16px; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; font-family: monospace; font-size: 24px; font-weight: 900; text-align: center; box-shadow: 0 4px 10px rgba(234, 88, 12, 0.2);">
          AK
        </div>
      </div>
      <div class="badge" style="background-color: #ffedd5; color: #ea580c;">SÉCURITÉ DU PORTAIL</div>
      <h2>Bonjour ${name},</h2>
      <p>Une demande de réinitialisation de votre mot de passe pour votre compte AKPBF a été initiée aujourd'hui.</p>
      
      <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité. Vos accès d'origine restent protégés et immuables.</p>

      <div class="info-block" style="border-left-color: #ea580c;">
        <strong>Votre Jeton de Récupération Secret :</strong><br>
        <code style="font-size: 18px; font-weight: bold; letter-spacing: 2px; color: #ea580c; background-color: #ffedd5; padding: 6px 12px; border-radius: 6px; display: inline-block; margin: 10px 0;">${token}</code><br>
        <em>Ce jeton de réinitialisation à usage unique est strictement confidentiel. Il expirera dans un délai d'une (1) heure.</em>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">Réinitialiser mon mot de passe</a>
      </div>

      <p>Par mesure de sécurité, ne communiquez jamais ce jeton ou cet email de réinitialisation à un tiers. Nos agents ou collaborateurs techniques d'AKPBF ne vous le demanderont jamais.</p>
      
      <p>📧 Support Technique : <strong>support@akpbf.com</strong></p>

      <div class="signature">
        Cordialement,<br>
        <strong>L'Équipe Sécurité AKPBF</strong><br>
        Direction des Systèmes d'Information, AKPBF
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'PASSWORD_RESET');
  },

  // 2. Confirmation d'abonnement (Subscription Confirmation)
  async sendSubscriptionConfirmation(
    to: string, 
    clientName: string, 
    planName: string, 
    price: string,
    customerId?: string
  ): Promise<string> {
    const subject = 'Confirmation de votre contrat d\'abonnement d\'assainissement';
    const body = `
      <div class="badge">CONTRAT ACTIF</div>
      <h2>Bonjour ${clientName},</h2>
      <p>Nous vous informons que votre contrat d'abonnement d'assainissement régulier AKPBF a été validé et mis en service par nos agents financiers.</p>
      
      <div class="info-block">
        <h3>Détails du Service :</h3>
        <p><strong>Formule choisie :</strong> ${planName}</p>
        <p><strong>Tarif d'assainissement :</strong> ${price} FCFA</p>
        <p><strong>Statut du contrat :</strong> <span style="color:#059669; font-weight:bold;">ACTIF</span></p>
      </div>

      <p>Nos camions et agents effectueront la levée de vos bacs connectés conformément au calendrier hebdomadaire défini pour votre secteur d'habitation.</p>

      <div class="signature">
        Service Logistique & Collecte,<br>
        <strong>AKPBF Abidjan</strong>
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'SUBSCRIPTION_CONFIRM', customerId);
  },

  // 3. Facture PDF automatique (Automatic Invoice PDF Confirmation)
  async sendInvoicePdfEmail(
    to: string, 
    clientName: string, 
    invoiceId: string, 
    amount: string, 
    dueDate: string,
    customerId?: string
  ): Promise<string> {
    const subject = `Nouvelle facture AKPBF disponible [Ref: ${invoiceId}]`;
    const body = `
      <div class="badge" style="background-color:#ea580c; color:#ffffff;">FACTURE EMIS</div>
      <h2>Bonjour ${clientName},</h2>
      <p>Votre facture mensuelle pour le service public d'assainissement AKPBF vient d'être générée pour la période en cours.</p>
      
      <div class="info-block" style="border-left-color: #ea580c;">
        <p><strong>Référence :</strong> ${invoiceId}</p>
        <p><strong>Montant à régler :</strong> ${amount} FCFA</p>
        <p><strong>Date d'échéance :</strong> ${dueDate}</p>
        <p><strong>Statut :</strong> <span style="color:#ea580c; font-weight:bold;">EN ATTENTE DE PAIEMENT</span></p>
      </div>

      <p>Pour éviter toute majoration de retard ou suspension de service, veuillez régler cette facture directement en ligne par Mobile Money ou au guichet d'un de nos caissiers d'Abidjan.</p>

      <a href="#" class="button" style="background-color: #ea580c;">Payer par Mobile Money</a>

      <div class="signature">
        La Direction Comptable et Financière,<br>
        <strong>AKPBF Côte d'Ivoire</strong>
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'INVOICE_PDF', customerId);
  },

  // 4. Confirmation de paiement (Payment Confirmation)
  async sendPaymentConfirmation(
    to: string, 
    clientName: string, 
    amount: string, 
    reference: string, 
    date: string,
    customerId?: string
  ): Promise<string> {
    const subject = `Confirmation de paiement reçu - Ref: ${reference}`;
    const body = `
      <div class="badge" style="background-color:#059669; color:#ffffff;">PAIEMENT SECURISE</div>
      <h2>Merci pour votre paiement !</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous informons que le règlement de votre facture d'assainissement public a été traité avec succès par nos serveurs de paiement d'Abidjan.</p>

      <div class="info-block">
        <p><strong>Montant payé :</strong> ${amount} FCFA</p>
        <p><strong>No d'opération :</strong> ${reference}</p>
        <p><strong>Date / Heure :</strong> ${date}</p>
        <p><strong>Méthode :</strong> Mobile Money (Transactions sécurisées)</p>
        <p><strong>Statut :</strong> <span style="color:#059669; font-weight:bold;">COMPLÉTÉ</span></p>
      </div>

      <p>Votre solde d'abonné a été mis à jour dans notre ERP de Plateau Abidjan. Un reçu fiscal acquitté est désormais téléchargeable sur votre Portail Web.</p>

      <div class="signature">
        Trésorerie Centrale AKPBF,<br>
        <strong>Abidjan, Côte d'Ivoire</strong>
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'PAYMENT_CONFIRM', customerId);
  },

  // 5. Relances automatiques (Auto Reminder)
  async sendDunningReminder(
    to: string, 
    clientName: string, 
    amount: string, 
    dueDate: string,
    customerId?: string
  ): Promise<string> {
    const subject = 'RAPPEL CRITIQUE : Régularisation urgente de vos frais d\'assainissement';
    const body = `
      <div class="badge" style="background-color: #ef4444; color: #ffffff;">RAPPEL DE LIMITES</div>
      <h2>Bonjour ${clientName},</h2>
      <p>Nos registres indiquent que votre facture d'assainissement de <strong>${amount} FCFA</strong> a dépassé la date d'échéance légale du <strong>${dueDate}</strong>.</p>
      
      <p>Face à cet arriéré non régularisé, nous vous prions de liquider de toute urgence ce montant afin de préserver l'accès ininterrompu au service de collecte.</p>

      <div class="info-block" style="border-left-color: #ef4444; background-color: #fef2f2;">
        <strong>Majoration légale :</strong> Suite à notre règlement intérieur approuvé à Abidjan, une majoration de retard de 10% pourra être créditée sur votre prochain relevé si le solde débiteur persiste.
      </div>

      <a href="#" class="button" style="background-color: #ef4444;">Régulariser mon compte maintenant</a>

      <div class="signature">
        Service Recouvrement,<br>
        <strong>AKPBF ERP</strong>
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'DUNNING_REMINDER', customerId);
  },

  // 6. Suspension automatique (Auto Suspension)
  async sendSuspensionAlert(to: string, clientName: string, customerId?: string): Promise<string> {
    const subject = 'NOTIFICATION DE SUSPENSION : Cessation du service d\'assainissement public AKPBF';
    const body = `
      <div class="badge" style="background-color: #7f1d1d; color: #ffffff;">SUSPENSION ADM</div>
      <h2>Avis solennel de cessation de service</h2>
      <p>Bonjour ${clientName},</p>
      <p>En raison d'un défaut persistant de règlement de vos cotisations environnementales, votre dossier d'abonné citoyen a été basculé au statut <strong style="color:#ef4444;">SUSPENDU</strong>.</p>
      
      <p><strong>Conséquences Immédiates :</strong></p>
      <ul>
        <li>Arrêt définitif du passage hebdomadaire de nos bennes de collecte à votre adresse d'Abidjan</li>
        <li>Désactivation des capteurs de niveau de votre bac connecté RFID</li>
        <li>Refus automatique de signature de nouveaux devis administratifs de salubrité</li>
      </ul>

      <p>Pour réactiver immédiatement vos droits et replanifier l'enlèvement de vos bacs d'assainissement, vous devez obligatoirement apurer l'intégralité de votre solde débiteur directement depuis la plateforme ou dans nos guichets.</p>

      <div class="signature">
        La Direction administrative de salubrité d'Abidjan,<br>
        <strong>Cabinet de Recouvrement AKPBF</strong>
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'SUSPENSION_ALERT', customerId);
  },

  // 7. Réactivation automatique (Auto Reactivation)
  async sendReactivationAlert(to: string, clientName: string, customerId?: string): Promise<string> {
    const subject = 'RÉACTIVATION EFFECTIVE : Restauration de vos services de collecte AKPBF';
    const body = `
      <div class="badge" style="background-color: #10b981; color: #ffffff;">COMPTE RÉACTIVÉ</div>
      <h2>Bonne nouvelle ! Vos services sont de retour.</h2>
      <p>Bonjour ${clientName},</p>
      <p>Nous vous confirmons la réactivation complète de votre abonnement public d'assainissement d'Abidjan suite à la régularisation financière totale de votre solde débiteur.</p>

      <p>Votre statut a été restauré à <strong style="color:#10b981;">ACTIF</strong>. La puce transpondeuse RFID de vos installations a été rallumée et nos équipes logistiques ont replanifié la tournée régulière de vidage de votre bac à partir d'aujourd'hui.</p>

      <div class="signature">
        Service d'Assainissement Urbain,<br>
        <strong>AKPBF Services</strong>
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'REACTIVATION_ALERT', customerId);
  },

  // 8. Réponses aux réclamations (Complaint Reply)
  async sendComplaintReply(
    to: string, 
    clientName: string, 
    complaintId: string, 
    category: string, 
    replyText: string,
    customerId?: string
  ): Promise<string> {
    const subject = `Réponse officielle AKPBF à votre réclamation [Dossier #${complaintId}]`;
    const body = `
      <div class="badge">RECLAMATION TRAITEE</div>
      <h2>Bonjour ${clientName},</h2>
      <p>Nos services de réclamations d'Abidjan ont examiné avec la plus grande attention votre déclaration d'incident enregistrée sous la référence d'assainissement <strong>#${complaintId}</strong> (Catégorie: ${category}).</p>
      
      <div class="info-block">
        <strong>Décision et actions prises par nos équipes de Plateau :</strong><br>
        <p style="font-style: italic; color: #1e293b;">"${replyText}"</p>
      </div>

      <p>Nos équipes veillent à ce que les instructions correctives soient pleinement appliquées au cœur de votre commune (Cocody, Yopougon, Marcory...). Pour tout besoin d'informations d'urgence, vous pouvez appeler la cellule opérationnelle de régulation au Plateau.</p>

      <div class="signature">
        Cellule de Gestion de Crise & Salubrité AKPBF,<br>
        <strong>District Autonome d'Abidjan</strong>
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'COMPLAINT_REPLY', customerId);
  },

  // 9. Notifications administratives (Admin Email Alerts)
  async sendAdminNotification(subject: string, htmlMessage: string): Promise<string> {
    const adminEmail = 'groupaksservices@zohomail.com';
    const body = `
      <div class="badge" style="background-color: #3b82f6; color: #ffffff;">ALERTE SYSTÈME ADMIN</div>
      <h2>Notification Administrative d'Exploitation</h2>
      <p>Cette alerte technique a été déclenchée automatiquement par l'ERP AKPBF pour notifier les administrateurs généraux d'Abidjan.</p>
      
      <div class="info-block" style="border-left-color: #3b82f6;">
        ${htmlMessage}
      </div>

      <p class="text-muted">Généré par les services Node.js à l'adresse Plateforme Cloud AKPBF.</p>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(adminEmail, `[ADMIN SYSTEM] ${subject}`, html, 'ADMIN_NOTIF');
  },

  // 10. Digest financier d'exploitation périodique (Periodic Financial Statements Digest)
  async sendFinancialDigest(
    toEmail: string,
    period: 'JOURNALIER' | 'HEBDOMADAIRE' | 'MENSUEL' | 'MANUEL' = 'MANUAL' as any
  ): Promise<string> {
    const subject = `[AKPBF ERP] Digest Financier Périodique : États Synthétiques SYSCOHADA (${period})`;
    
    // Dynamic import to bypass circular dependencies
    const { AccountingService } = await import('../modules/accounting/services/accountingService');
    const state = await AccountingService.getInstance().getAccountingState();
    const { statements } = state;
    const { trialBalance, incomeStatement, balanceSheet } = statements;
    
    // Key highlights
    const totalSales = incomeStatement.totalProducts || 0;
    const totalCharges = incomeStatement.totalCharges || 0;
    const netResult = incomeStatement.netResult || 0;
    const totalAssets = balanceSheet.totalAssets || 0;
    const totalLiabilities = balanceSheet.totalEquitiesAndLiabilities || 0;
    
    // Build P&L table rows
    let pnlTableRows = '';
    incomeStatement.products.forEach((p: any) => {
      pnlTableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;"><strong>[${p.code}]</strong> ${p.name}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; color: #047857; font-weight: bold;">+${Number(p.amount).toLocaleString()} FCFA</td>
        </tr>
      `;
    });
    
    incomeStatement.charges.forEach((c: any) => {
      pnlTableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;"><strong>[${c.code}]</strong> ${c.name}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; color: #be123c; font-weight: bold;">-${Number(c.amount).toLocaleString()} FCFA</td>
        </tr>
      `;
    });

    // Build Balance Sheet rows
    let balanceSheetRows = '';
    balanceSheet.assets.forEach((ast: any) => {
      balanceSheetRows += `
        <tr style="background-color: #fafdfb;">
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;"><span style="color: #2563eb; font-weight: bold;">ACTIF:</span> [${ast.code}] ${ast.name}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${Number(ast.amount).toLocaleString()} FCFA</td>
        </tr>
      `;
    });
    balanceSheet.liabilities.forEach((l: any) => {
      balanceSheetRows += `
        <tr style="background-color: #fbfbfb;">
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;"><span style="color: #4b5563; font-weight: bold;">PASSIF:</span> [${l.code}] ${l.name}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${Number(l.amount).toLocaleString()} FCFA</td>
        </tr>
      `;
    });

    // Build top 5 balances in trial balance to prevent gigantic emails
    let trialBalanceRows = '';
    const topAccounts = trialBalance.slice(0, 8);
    topAccounts.forEach((acc: any) => {
      trialBalanceRows += `
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">[${acc.code}] ${acc.name}</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; color: #2563eb;">${Number(acc.debit).toLocaleString()}</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; color: #10b981;">${Number(acc.credit).toLocaleString()}</td>
        </tr>
      `;
    });

    const body = `
      <div class="badge" style="background-color: #0d9488; color: #ffffff; display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-bottom: 20px;">
        RAPPORT FINANCIER SYSCOHADA • ${period}
      </div>
      <h2>Synthèse des États Financiers de l'Exploitation</h2>
      <p>Bonjour,</p>
      <p>L'ERP AKPBF vous présente ci-dessous le relevé synthétique de l'exploitation réseau d'assainissement et salubrité publique d'Abidjan, Côte d'Ivoire. Ce rapport comptable est compilé en direct depuis les écritures imputées en base de données PostgreSQL.</p>
      
      <!-- KPI CARDS GRID -->
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px; border-collapse: collapse; border: 0;">
        <tr>
          <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
            <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Chiffre d'Affaires</span>
            <div style="font-size: 20px; font-weight: 900; color: #047857; margin-top: 5px;">${totalSales.toLocaleString()} <span style="font-size: 11px; font-weight: normal; color: #10b981;">FCFA</span></div>
          </td>
          <td width="4%">&nbsp;</td>
          <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
            <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Charges d'Exercice</span>
            <div style="font-size: 20px; font-weight: 900; color: #be123c; margin-top: 5px;">${totalCharges.toLocaleString()} <span style="font-size: 11px; font-weight: normal; color: #f43f5e;">FCFA</span></div>
          </td>
        </tr>
        <tr><td colspan="3" style="height: 12px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
        <tr>
          <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
            <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Résultat Net</span>
            <div style="font-size: 20px; font-weight: 900; color: ${netResult >= 0 ? '#0d9488' : '#e11d48'}; margin-top: 5px;">
              ${netResult >= 0 ? '+' : ''}${netResult.toLocaleString()} <span style="font-size: 11px; font-weight: normal;">FCFA</span>
            </div>
          </td>
          <td width="4%">&nbsp;</td>
          <td width="48%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
            <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Équilibre Actif/Passif</span>
            <div style="font-size: 14px; font-weight: bold; color: #334155; margin-top: 5px;">
              Actif: <span style="color: #2563eb;">${totalAssets.toLocaleString()}</span><br>Passif: <span style="color: #4b5563;">${totalLiabilities.toLocaleString()}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- P&L SECTION -->
      <h3 style="border-bottom: 2px solid #0d9488; padding-bottom: 5px; color: #0f172a; margin-top: 25px; font-size: 15px;">📊 Compte de Résultat (P&L SYSCOHADA)</h3>
      <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse: collapse; font-size: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th align="left" style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Compte d'Imputation & Libellé</th>
            <th align="right" style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Solde Période (FCFA)</th>
          </tr>
        </thead>
        <tbody style="color: #334155;">
          ${pnlTableRows || '<tr><td colspan="2" align="center" style="padding: 12px; color: #94a3b8; border: 1px solid #e2e8f0;">Aucune écriture d\'échanges enregistrée</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="background-color: #f0fdf4; font-weight: bold; font-size: 13px;">
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Résultat d'Exploitation Général</td>
            <td align="right" style="padding: 8px; border: 1px solid #e2e8f0; color: ${netResult >= 0 ? '#047857' : '#be123c'};">${netResult.toLocaleString()} FCFA</td>
          </tr>
        </tfoot>
      </table>

      <!-- BALANCE SHEET SECTION -->
      <h3 style="border-bottom: 2px solid #0284c7; padding-bottom: 5px; color: #0f172a; margin-top: 25px; font-size: 15px;">🏛️ Bilan Général Synthétique Actif / Passif</h3>
      <table width="100%" cellspacing="0" cellpadding="8" style="border-collapse: collapse; font-size: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th align="left" style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Comptes de Structure & Immeubles</th>
            <th align="right" style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Solde Comptable</th>
          </tr>
        </thead>
        <tbody style="color: #334155;">
          ${balanceSheetRows || '<tr><td colspan="2" align="center" style="padding: 12px; color: #94a3b8; border: 1px solid #e2e8f0;">Aucun mouvement de structure ou capital social</td></tr>'}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; font-size: 13px;">
            <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #eff6ff; color: #1e40af;">MOUVEMENTS DE L'ACTIF PRINCIPAL</td>
            <td align="right" style="padding: 8px; border: 1px solid #e2e8f0; background-color: #eff6ff; color: #1e40af;">${totalAssets.toLocaleString()} FCFA</td>
          </tr>
          <tr style="font-weight: bold; font-size: 13px;">
            <td style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; color: #374151;">MOUVEMENTS DES CAPITAUX PROPRES & DETTES</td>
            <td align="right" style="padding: 8px; border: 1px solid #e2e8f0; background-color: #f8fafc; color: #374151;">${totalLiabilities.toLocaleString()} FCFA</td>
          </tr>
        </tfoot>
      </table>

      <!-- BALANCE REPORT -->
      <h3 style="border-bottom: 2px solid #64748b; padding-bottom: 5px; color: #0f172a; margin-top: 25px; font-size: 15px;">⚖️ Aperçu de la Balance Générale des Comptes</h3>
      <table width="100%" cellspacing="0" cellpadding="6" style="border-collapse: collapse; font-size: 11px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th align="left" style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Compte & Intitulé</th>
            <th align="right" style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Mvt Débit (FCFA)</th>
            <th align="right" style="padding: 6px; border: 1px solid #e2e8f0; font-weight: bold;">Mvt Crédit (FCFA)</th>
          </tr>
        </thead>
        <tbody style="color: #475569;">
          ${trialBalanceRows || '<tr><td colspan="3" align="center" style="padding: 10px; color: #94a3b8; border: 1px solid #e2e8f0;">Aucun compte dans la balance générale</td></tr>'}
        </tbody>
      </table>

      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 8px; font-size: 11px; color: #78350f; margin-bottom: 25px; line-height: 1.5;">
        <strong>Conformité Réglementaire SYSCOHADA :</strong> Ce relevé d'exploitation et de synthèse est édité sous le référentiel comptable SYSCOHADA de l'UEMOA pour l'exploitation d'assainissement d'eau, de vidanges de fosses saines, de logistiques rattachées et de traitement de boues organiques.
      </div>

      <div class="signature">
        Direction Générale des Services de Trésorerie,<br>
        <strong>AKPBF Services Abidjan, District d'Abidjan CI</strong>
      </div>
    `;

    const html = this.buildMasterTemplate(subject, body);
    
    // Support sending to multiple recipients (comma-separated list)
    const emailsList = toEmail.split(',').map((e: string) => e.trim()).filter(Boolean);
    let lastId = '';
    for (const email of emailsList) {
      lastId = await this.enqueueEmail(email, subject, html, `FINANCIAL_DIGEST_${period}`);
    }
    return lastId;
  }
};
