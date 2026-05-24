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
      port: ENV.ZOHO_SMTP_PORT,
      secure: ENV.ZOHO_SMTP_SECURE, // true for port 465, false for 587
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
      const transporter = getTransporter();
      
      // If we are in dev/preview sandbox and SMTP password is dummy, log email to console & simulate delay
      const isMockMode = !ENV.ZOHO_SMTP_PASS;
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
          from: `"${ENV.ZOHO_FROM_NAME}" <${ENV.ZOHO_SMTP_USER}>`,
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
  async sendWelcomeEmail(to: string, name: string, customerId?: string): Promise<string> {
    const subject = 'Bienvenue chez AKPBF - Portail Citoyen d\'Assainissement';
    const body = `
      <div class="badge">BIENVENUE</div>
      <h2>Bonjour ${name},</h2>
      <p>Nous sommes ravis de vous compter parmi les citoyens abonnés d'AKPBF d'Abidjan. Notre engagement principal consiste à garder notre capitale propre et salubre.</p>
      
      <p>Grâce à votre inscription, vous disposez d'un accès sécurisé complet au <strong>Portail Citoyen</strong> où vous pourrez :</p>
      <ul>
        <li>Régler vos cotisations d'assainissement en ligne par Mobile Money (Orange, Moov, Wave, Telecel)</li>
        <li>Télécharger vos factures périodiques d'assainissement au format PDF</li>
        <li>Déclarer des incidents ou soumettre des réclamations vis-à-vis de l'état de levée des ordures</li>
        <li>Visualiser en temps réel le passage géolocalisé des camions de collecte</li>
      </ul>

      <div class="info-block">
        <strong>Identifiant Unique d'Abonné (Subscriber ID) :</strong><br>
        Utilisez votre numéro d'abonné citoyen ou votre adresse e-mail pour vous connecter directement au portail d'Abidjan.
      </div>

      <a href="${ENV.DATABASE_URL ? 'https://akpbf.com/portal' : '#'}" class="button">Se connecter au Portail</a>

      <p>Merci pour votre civisme environnemental pour la Côte d'Ivoire.</p>
      
      <div class="signature">
        Cordialement,<br>
        <strong>Moustapha Sylla</strong><br>
        Directeur des Services Citoyens, AKPBF
      </div>
    `;
    const html = this.buildMasterTemplate(subject, body);
    return this.enqueueEmail(to, subject, html, 'WELCOME', customerId);
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
    const adminEmail = 'admin@akpbf.com';
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
  }
};
