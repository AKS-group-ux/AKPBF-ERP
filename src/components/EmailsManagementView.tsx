import { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Inbox, 
  Sparkles, 
  Info,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';

interface EmailQueueItem {
  id: string;
  to: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  templateType: string;
  lastError?: string;
  createdAt?: string;
}

interface DbEmailLog {
  id: string;
  to: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  createdAt: string;
  content: string;
}

export default function EmailsManagementView() {
  const [activeSubTab, setActiveSubTab] = useState<'SANDBOX' | 'MONITORING' | 'CONFIG'>('SANDBOX');
  const [toEmail, setToEmail] = useState('');
  const [templateType, setTemplateType] = useState('WELCOME');
  
  // Custom SMTP configuration states
  const [smtpConfig, setSmtpConfig] = useState({
    enabled: false,
    host: 'smtp.zoho.com',
    port: '465',
    secure: true,
    user: '',
    pass: '',
    fromName: 'AKPBF ERP Assainissement'
  });

  // Periodic digest configuration states
  const [digestConfig, setDigestConfig] = useState({
    enabled: false,
    recipients: 'groupaksservices@gmail.com',
    period: 'HEBDOMADAIRE',
    dayOfWeek: '1',
    timeOfDay: '08:00'
  });

  const [hasPassword, setHasPassword] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [triggeringDigest, setTriggeringDigest] = useState(false);
  
  // Customizable parameters for testing mock data
  const [clientName, setClientName] = useState('Souleymane Ouédraogo');
  const [amount, setAmount] = useState('3500');
  const [invoiceId, setInvoiceId] = useState('FAC-MAY-2026-891');
  const [dueDate, setDueDate] = useState('10 Juin 2026');
  const [reference, setReference] = useState('TXN-WAVE-8921-BFA');
  const [complaintId, setComplaintId] = useState('REC-Karpala-3392');
  const [category, setCategory] = useState('NON_COLLECTE');
  const [replyText, setReplyText] = useState('Nos équipes d\'assainissement passeront vider votre bac Karpala Secteur 15 en urgence ce mardi soir (23h).');

  // Logs states
  const [queue, setQueue] = useState<EmailQueueItem[]>([]);
  const [dbLogs, setDbLogs] = useState<DbEmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const getAuthToken = () => {
    return localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token') || '';
  };

  // Load the logs from the backend safely
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/email/logs', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
        setDbLogs(data.dbLogs || []);
      } else {
        console.warn('[SMTP SYSTEM WARNING] Failed loading server email logs.');
      }
    } catch (err) {
      console.error('[CONNECTION ERROR LOGS]:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load SMTP configurations saved in Database Setting keys
  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/email/digest/settings', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.smtpConfig) setSmtpConfig(data.smtpConfig);
          if (data.digestConfig) setDigestConfig(data.digestConfig);
          setHasPassword(data.hasPassword);
        }
      }
    } catch (e) {
      console.error('[FETCH CONFIG ERROR]:', e);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (activeSubTab === 'CONFIG') {
      fetchConfig();
    }
  }, [activeSubTab]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setActionMessage(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/email/digest/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ smtpConfig, digestConfig })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setHasPassword(smtpConfig.pass !== '');
        fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Impossible de joindre le serveur ERP.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTriggerDigest = async () => {
    setTriggeringDigest(true);
    setActionMessage(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/email/digest/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          recipients: digestConfig.recipients,
          period: digestConfig.period
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        fetchLogs();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Échec de transmission.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Erreur réseau lors de la génération.' });
    } finally {
      setTriggeringDigest(false);
    }
  };

  // Sends email test requesting backend
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) {
      setActionMessage({ type: 'error', text: 'Veuillez saisir une adresse email de destination.' });
      return;
    }

    setSendingTest(true);
    setActionMessage(null);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          toEmail,
          templateType,
          clientName,
          amount,
          invoiceId,
          dueDate,
          reference,
          complaintId,
          category,
          replyText
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Succès : L'email test '${templateType}' a été mis en file avec succès [ID: ${data.emailId}]. Le serveur tente l'expédition SMTP Zoho Mail instantanée.`
        });
        fetchLogs();
      } else {
        setActionMessage({
          type: 'error',
          text: `Échec d'envoi : ${data.error || 'Erreur inconnue lors du relais SMTP.'}`
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Erreur RPC : Impossible de contacter la passerelle d'API d'assainissement.`
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Trigger bulk retry
  const handleRetryFailed = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/email/retry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage({ type: 'success', text: data.message });
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pure the queue logs
  const handlePurgeQueue = async () => {
    if (!confirm('Voulez-vous purger complètement la file d\'attente d\'email temporaire ?')) return;
    try {
      const token = getAuthToken();
      const res = await fetch('/api/email/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'File d\'envoi vidée des éléments passés.' });
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Map descriptions for the 9 templates
  const templateDescriptionMap: Record<string, { title: string, desc: string, icon: string }> = {
    WELCOME: {
      title: 'Email de bienvenue',
      desc: 'Souhaiter la bienvenue au citoyen nouvellement inscrit, lui fournir son ID d\'abonné de Ouagadougou et détailler les fonctionnalités du portail d\'assainissement.',
      icon: 'BIENVENUE'
    },
    SUBSCRIPTION_CONFIRM: {
      title: 'Confirmation d\'abonnement',
      desc: 'Notifier officiellement que le contrat d\'assainissement (ex: Karpala, Somgandé) a été activé en base, avec détails de prix et engagement.',
      icon: 'CONTRAT ACTIF'
    },
    INVOICE_PDF: {
      title: 'Génération de facture d\'assainissement',
      desc: 'Alerter le citoyen de la disponibilité de son nouveau titre mensuel de recette avec montant, instructions de paiement et échéance légale.',
      icon: 'FACTURE ÉMISE'
    },
    PAYMENT_CONFIRM: {
      title: 'Reçu de paiement sécurisé',
      desc: 'Remercier le client et émettre instantanément un acte d\'acquittement suite à son virement Mobile Money (Wave, Orange, MTN).',
      icon: 'PAIEMENT REÇU'
    },
    DUNNING_REMINDER: {
      title: 'Relance de retard de cotisation',
      desc: 'Mise en demeure impérative signalant une facture d\'assainissement impayée au-delà des échéances légales avec risques de majorations.',
      icon: 'RAPPEL CRITIQUE'
    },
    SUSPENSION_ALERT: {
      title: 'Notification de suspension automatique',
      desc: 'Avis officiel d\'interruption du ramassage et de mise hors-service RFID des installations suite à un défaut financier persistant.',
      icon: 'CESSATION ADM'
    },
    REACTIVATION_ALERT: {
      title: 'Réactivation et restauration de service',
      desc: 'Confirmer la réactivation du contrat et la replanification immédiate du camion à domicile suite à l\'apurement complet de l\'arriéré.',
      icon: 'REPRISE EFFECTIVE'
    },
    COMPLAINT_REPLY: {
      title: 'Réponse officielle à une réclamation',
      desc: 'Émettre un avis d\'intervention logistique en réponse à une plainte de citoyen (ex: bac Karpala non collecté).',
      icon: 'RÉCLAMATION TRAITÉE'
    },
    ADMIN_NOTIF: {
      title: 'Alerte administrative et technique',
      desc: 'Transmission d\'un rapport d\'écart technique automatique destiné aux cadres ERP de Koulouba, Ouagadougou.',
      icon: 'ALERTE SYSTÈME'
    }
  };

  return (
    <div id="email-module-container" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Mail className="h-6.5 w-6.5 text-emerald-500 shrink-0" />
            <span>Gestion de la Messagerie Professionnelle</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">
            Relais d'envois transactionnels Zoho Mail SMTP, file d'attente résiliente de retry et archivage SQL des correspondances.
          </p>
        </div>

        {/* Sync panel */}
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-1.5 p-2 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 font-bold rounded-lg cursor-pointer shadow-xs transition"
          >
            <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition font-medium text-xs leading-relaxed ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-55/70 border-emerald-250 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300' 
            : 'bg-red-50/70 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-550 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-550 shrink-0 mt-0.5" />}
          <div className="flex-1 shrink-0">{actionMessage.text}</div>
          <button onClick={() => setActionMessage(null)} className="font-bold hover:text-slate-750 p-0.5 shrink-0 opacity-60">✕</button>
        </div>
      )}

      {/* Internal subtab navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('SANDBOX')}
          className={`px-4 py-2 text-xs font-bold leading-normal transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'SANDBOX' 
              ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          🎮 Bac à Sable SMTP (9 Modèles tests)
        </button>
        <button
          onClick={() => setActiveSubTab('MONITORING')}
          className={`px-4 py-2 text-xs font-bold leading-normal transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'MONITORING' 
              ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold' 
              : 'text-slate-500 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          📊 File d'Attente & Historiques PostgreSQL ({dbLogs.length})
        </button>
        <button
          onClick={() => setActiveSubTab('CONFIG')}
          className={`px-4 py-2 text-xs font-bold leading-normal transition-all shrink-0 cursor-pointer ${
            activeSubTab === 'CONFIG' 
              ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-300 font-extrabold' 
              : 'text-slate-500 dark:text-slate-500 hover:text-slate-700'
          }`}
        >
          ⚙️ Services SMTP Réels & Digests Financiers SYSCOHADA
        </button>
      </div>

      {activeSubTab === 'SANDBOX' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-xs space-y-5">
            <h3 className="text-sm font-black text-slate-850 dark:text-slate-250 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 animate-pulse" />
              <span>Générateur de Tests Transactionnels</span>
            </h3>

            <form onSubmit={handleSendTest} className="space-y-4 text-xs font-medium text-slate-700 dark:text-slate-350">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">Email Destinataire (Pour tester)</label>
                  <input 
                    type="email" 
                    required
                    placeholder="exemple-recept@gmail.com" 
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-550"
                  />
                  <span className="text-[10px] text-slate-400 block">Saisissez l'adresse de réception pour tester.</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">Gabarit d'Email Zoho</label>
                  <select 
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-550 font-bold"
                  >
                    <option value="WELCOME">WELCOME (Bienvenue au citoyen)</option>
                    <option value="SUBSCRIPTION_CONFIRM">SUBSCRIPTION_CONFIRM (Abonnement valide)</option>
                    <option value="INVOICE_PDF">INVOICE_PDF (Disponibilité Facture)</option>
                    <option value="PAYMENT_CONFIRM">PAYMENT_CONFIRM (Validation de Caisse)</option>
                    <option value="DUNNING_REMINDER">DUNNING_REMINDER (Injonction de payer)</option>
                    <option value="SUSPENSION_ALERT">SUSPENSION_ALERT (Avis d'interruption)</option>
                    <option value="REACTIVATION_ALERT">REACTIVATION_ALERT (Restauration service)</option>
                    <option value="COMPLAINT_REPLY">COMPLAINT_REPLY (Résolution réclamation)</option>
                    <option value="ADMIN_NOTIF">ADMIN_NOTIF (Alerte Admin Technique)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Customizable template parameters fields */}
              <div className="bg-slate-50 dark:bg-slate-955 rounded-xl p-4 border border-slate-100 dark:border-slate-800/60 mt-2 space-y-3">
                <span className="text-[10px] font-bold text-amber-500 font-mono tracking-wider block uppercase">🧬 Variables Dynamiques Injectées</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-450">Nom complet citoyen :</label>
                    <input 
                      type="text" 
                      value={clientName} 
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]" 
                    />
                  </div>

                  {['INVOICE_PDF', 'PAYMENT_CONFIRM', 'SUBSCRIPTION_CONFIRM', 'DUNNING_REMINDER'].includes(templateType) && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-450">Frais d'Assainissement (FCFA) :</label>
                      <input 
                        type="text" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]" 
                      />
                    </div>
                  )}

                  {templateType === 'INVOICE_PDF' && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-450">Référence de Facture :</label>
                      <input 
                        type="text" 
                        value={invoiceId} 
                        onChange={(e) => setInvoiceId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]" 
                      />
                    </div>
                  )}

                  {['INVOICE_PDF', 'DUNNING_REMINDER'].includes(templateType) && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-450">Échéance Règlement :</label>
                      <input 
                        type="text" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]" 
                      />
                    </div>
                  )}

                  {templateType === 'PAYMENT_CONFIRM' && (
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-450">Référence Transaction Mobile Money :</label>
                      <input 
                        type="text" 
                        value={reference} 
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]" 
                      />
                    </div>
                  )}

                  {templateType === 'COMPLAINT_REPLY' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-450">No de Réclamation :</label>
                        <input 
                          type="text" 
                          value={complaintId} 
                          onChange={(e) => setComplaintId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-450">Rubrique de la Plainte :</label>
                        <select 
                          value={category} 
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 rounded-md text-[11px] font-bold"
                        >
                          <option value="NON_COLLECTE">NON_COLLECTE (Déchet ménager oublié)</option>
                          <option value="FACTURATION">FACTURATION (Anomalie comptable)</option>
                          <option value="AUTRE">AUTRE (Incident matériel)</option>
                        </select>
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-450">Résolution / Réponse Administrative officielle :</label>
                        <textarea 
                          rows={2} 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-800 rounded-md text-[11px]" 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="flex items-center gap-2 p-2.5 px-5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer disabled:opacity-50 select-none shadow-md hover:scale-[1.01] active:scale-95 transition-all"
                >
                  {sendingTest ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
                  <span>Déclencher l'Email via Zoho SMTP</span>
                </button>
              </div>

            </form>
          </div>

          {/* Right Column Preview card */}
          <div className="lg:col-span-5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-5 shadow-lg space-y-4 min-h-[460px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <div className="bg-emerald-500 text-white font-mono uppercase font-black text-[9px] p-1 rounded-sm">AKPBF CRM</div>
                  <span className="text-xs font-black text-slate-300">Gabarit d'Écran Transactionnel</span>
                </div>
                <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 p-0.5 px-2 rounded-full font-mono">{templateType}</span>
              </div>

              {templateDescriptionMap[templateType] && (
                <div className="text-xs space-y-2 leading-relaxed">
                  <div className="font-extrabold text-white text-md tracking-tight flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{templateDescriptionMap[templateType].title}</span>
                  </div>
                  <p className="text-slate-400 font-medium text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">
                    {templateDescriptionMap[templateType].desc}
                  </p>
                </div>
              )}

              {/* Pseudo email header */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-[11px] font-mono leading-relaxed text-slate-400">
                <div><span className="text-slate-600 font-bold">De :</span> noreply@akpbf.com (AKPBF Assainissement Public)</div>
                <div><span className="text-slate-600 font-bold">À :</span> {toEmail || '[Mail du destinataire civique]'}</div>
                <div><span className="text-slate-600 font-bold">Sujet :</span> {
                  templateType === 'WELCOME' ? 'Bienvenue chez AKPBF - Portail Citoyen d\'Assainissement' :
                  templateType === 'SUBSCRIPTION_CONFIRM' ? 'Confirmation de votre contrat d\'abonnement d\'assainissement' :
                  templateType === 'INVOICE_PDF' ? `Nouvelle facture AKPBF disponible [Ref: ${invoiceId || 'INV-2026-618'}]` :
                  templateType === 'PAYMENT_CONFIRM' ? `Confirmation de paiement reçu - Ref: ${reference || 'TXN-812'}` :
                  templateType === 'DUNNING_REMINDER' ? 'RAPPEL CRITIQUE : Régularisation urgente de vos frais d\'assainissement' :
                  templateType === 'SUSPENSION_ALERT' ? 'NOTIFICATION DE SUSPENSION : Cessation du service d\'assainissement public AKPBF' :
                  templateType === 'REACTIVATION_ALERT' ? 'RÉACTIVATION EFFECTIVE : Restauration de vos services de collecte AKPBF' :
                  templateType === 'COMPLAINT_REPLY' ? `Réponse officielle AKPBF à votre réclamation [Dossier #${complaintId || 'REC-90'}]` :
                  'Alerte administrative d\'exploitation'
                }</div>
              </div>

              {/* Styled Mini Template Preview Representation */}
              <div className="bg-white text-slate-800 rounded-xl overflow-hidden shadow-md text-[10px] space-y-3 font-medium leading-normal border border-slate-100 max-h-[220px] overflow-y-auto p-4 flex flex-col justify-between">
                
                {/* Header widget */}
                <div className="text-center pb-2.5 border-b border-amber-500/80 bg-emerald-600 -m-4 mb-2 p-3 text-white">
                  <span className="font-extrabold tracking-wide uppercase text-[12px] block">AKPBF ERP</span>
                  <span className="text-[7.5px] tracking-widest text-emerald-250 uppercase font-black">Salubrité du Burkina Faso</span>
                </div>

                {/* Email text custom representations */}
                {templateType === 'WELCOME' && (
                  <div className="space-y-1 text-slate-600 pt-1">
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">BIENVENUE</span>
                    <p className="font-bold text-slate-800 text-xs">Bonjour {clientName},</p>
                    <p>Nous sommes ravis de vous compter parmi les citoyens abonnés d'AKPBF de Ouagadougou. Notre engagement principal consiste à garder notre capitale propre.</p>
                    <div className="bg-slate-50 p-2 rounded border-l-2 border-emerald-500 font-extrabold text-slate-800">
                      Identifiant Unique d'Abonné : portail de Ouagadougou actif.
                    </div>
                  </div>
                )}

                {templateType === 'SUBSCRIPTION_CONFIRM' && (
                  <div className="space-y-1 text-slate-600">
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">CONTRAT ACTIF</span>
                    <p className="font-bold text-slate-800 text-xs">Bonjour {clientName},</p>
                    <p>Votre contrat d'abonnement d'assainissement régulier AKPBF a été validé et mis en service par nos agents financiers.</p>
                  </div>
                )}

                {templateType === 'INVOICE_PDF' && (
                  <div className="space-y-1 text-slate-600">
                    <span className="inline-block bg-amber-100 text-amber-800 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">FACTURE ÉMISE</span>
                    <p className="font-bold text-slate-800 text-xs">Bonjour {clientName},</p>
                    <p>Votre facture pour la période d'assainissement est émise.</p>
                    <div className="bg-amber-50 p-2 rounded border-l-2 border-amber-500 font-extrabold text-slate-800 font-mono">
                      Montant : {amount} FCFA | Échéance : {dueDate}
                    </div>
                  </div>
                )}

                {templateType === 'PAYMENT_CONFIRM' && (
                  <div className="space-y-1 text-slate-600">
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">PAIEMENT REÇU</span>
                    <p className="font-bold text-slate-800 text-xs">Merci pour votre paiement !</p>
                    <div className="bg-slate-50 p-2 rounded border-l-2 border-emerald-500 font-extrabold text-slate-800 font-mono">
                      Transaction : {reference} | Montant : {amount} FCFA
                    </div>
                  </div>
                )}

                {templateType === 'DUNNING_REMINDER' && (
                  <div className="space-y-1 text-slate-700">
                    <span className="inline-block bg-red-100 text-red-800 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">RAPPEL CRITIQUE</span>
                    <p className="font-bold text-slate-900 text-xs text-red-650">Bonjour {clientName},</p>
                    <p>La facture d'assainissement de {amount} FCFA a dépassé la date d'échéance légale du {dueDate}.</p>
                  </div>
                )}

                {templateType === 'SUSPENSION_ALERT' && (
                  <div className="space-y-1 text-slate-700">
                    <span className="inline-block bg-zinc-900 text-slate-200 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">SUSPENSION ADM</span>
                    <p className="font-bold text-slate-900 text-xs text-red-650">Avis de cessation de service</p>
                    <p>En raison d'un défaut persistant de règlement de vos cotisations environnementales, votre dossier a été basculé au statut SUSPENDU.</p>
                  </div>
                )}

                {templateType === 'REACTIVATION_ALERT' && (
                  <div className="space-y-1 text-slate-600">
                    <span className="inline-block bg-teal-100 text-teal-850 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">COMPTE RÉACTIVÉ</span>
                    <p className="font-bold text-slate-800 text-xs text-emerald-650">Vos services sont de retour !</p>
                    <p>Votre statut a été restauré à ACTIF. Nous confirmons la reprise de la collecte et l'ouverture RFID de vos installations bacs.</p>
                  </div>
                )}

                {templateType === 'COMPLAINT_REPLY' && (
                  <div className="space-y-1 text-slate-600">
                    <span className="inline-block bg-indigo-100 text-indigo-800 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">RECLAMATION TRAITEE</span>
                    <p className="font-bold text-slate-800 text-xs">Bonjour {clientName},</p>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 font-semibold text-slate-700 italic">
                      Catégorie d'Incident : {category} <br/>
                      "{replyText}"
                    </div>
                  </div>
                )}

                {templateType === 'ADMIN_NOTIF' && (
                  <div className="space-y-1 text-slate-600">
                    <span className="inline-block bg-rose-100 text-rose-800 font-black p-0.5 px-2 rounded-full text-[8px] mb-1">ALERTE SYSTÈME</span>
                    <p className="font-bold text-slate-800 text-xs text-red-500">Alerte administrative d'exploitation de Ouagadougou :</p>
                    <p>Cette alerte technique a été générée par l'automate de l'ERP AKPBF pour notifier le comité directeur.</p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 font-mono text-[8px] text-slate-400 text-center leading-normal">
                  AKPBF ERP BF - Bureau Régional <br /> Koulouba, Ouagadougou, Burkina Faso
                </div>

              </div>

            </div>

            <p className="text-[10px] text-slate-500 text-center italic mt-2.5 leading-normal">
              Note : En mode production, les emails sont transmis de Ouagadougou via Zoho SMTP (Port 465 SSL sécurisé).
            </p>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Monitoring Queue and PostgreSQL histories */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Queue Management list */}
            <div className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-150 dark:border-slate-850">
                <span className="text-xs font-black text-slate-800 dark:text-slate-350 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Clock className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  <span>File d'Attente active ({queue.length})</span>
                </span>
                
                <div className="flex gap-1">
                  <button 
                    onClick={handleRetryFailed}
                    disabled={queue.filter(q => q.status === 'FAILED').length === 0}
                    className="p-1 px-2 pointer-events-auto bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 text-amber-800 dark:text-amber-400 font-bold text-[10px] rounded-md disabled:opacity-50 select-none shadow-xs cursor-pointer transition active:scale-95"
                    title="Retenter d'envoyer tous les courriels en échec"
                  >
                    Réessayer les échecs
                  </button>
                  <button 
                    onClick={handlePurgeQueue}
                    disabled={queue.length === 0}
                    className="p-1 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-700 font-bold text-[10px] rounded-md disabled:opacity-50 select-none shadow-xs cursor-pointer transition active:scale-95"
                    title="Vider la queue de rejets"
                  >
                    Purger
                  </button>
                </div>
              </div>

              {queue.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center text-xs space-y-2 leading-relaxed">
                  <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-700 shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-700 dark:text-slate-400">File de messagerie vide</p>
                    <p className="text-slate-400">Tous les emails se sont transmis directement.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {queue.map(item => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border text-[11px] font-medium leading-relaxed flex flex-col justify-between space-y-2 ${
                        item.status === 'SENT' 
                          ? 'bg-emerald-50/50 border-emerald-150 dark:bg-emerald-950/10 dark:border-emerald-900/65' 
                          : item.status === 'FAILED'
                            ? 'bg-red-50/50 border-red-150 dark:bg-red-950/10 dark:border-red-900/65'
                            : 'bg-indigo-50/50 border-indigo-150 dark:bg-indigo-950/10 dark:border-indigo-900/65'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-800 dark:text-slate-300 font-mono text-[10px]">{item.id}</span>
                        <span className={`p-0.5 px-2 text-[8px] font-black tracking-wider uppercase rounded-full ${
                          item.status === 'SENT' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                            : item.status === 'FAILED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 animate-pulse'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="space-y-0.5 font-sans">
                        <div className="text-slate-750 dark:text-slate-300"><span className="text-slate-400 font-bold">À :</span> {item.to}</div>
                        <div className="text-slate-800 dark:text-slate-350 font-bold truncate"><span className="text-slate-400 font-bold">Sujet :</span> {item.subject}</div>
                        <div className="text-slate-500 text-[10px]"><span className="text-slate-400 font-bold font-mono">Template :</span> {item.templateType} | Essais : {item.attempts}/{item.maxAttempts}</div>
                      </div>

                      {item.lastError && (
                        <div className="bg-red-50 dark:bg-red-955 p-2 rounded-md border border-red-100 dark:border-red-900/40 text-[9.5px] text-red-750 dark:text-red-400 font-mono tracking-tight break-all leading-normal whitespace-pre-wrap">
                          ⚠️ {item.lastError}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PostgreSQL Logger DB View */}
            <div className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-350 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Database className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Registre Général Historique d'Emails (Base PostgreSQL : {dbLogs.length})</span>
                </span>
                <span className="text-[10px] font-bold bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50 text-indigo-750 dark:text-indigo-300 p-0.5 px-3.5 rounded-full font-mono tracking-tight">
                  PRISMA CONTEXT ACTIVE
                </span>
              </div>

              {dbLogs.length === 0 ? (
                <div className="py-24 text-center flex flex-col justify-center items-center text-slate-400 text-xs space-y-2">
                  <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 animate-pulse shrink-0" />
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-slate-400">Aucun log en base de données PostgreSQL</p>
                    <p className="text-slate-400 mt-0.5">Utilisez le Bac à Sable SMTP pour générer vos premières expéditions tests Zoho Mail.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-450 border-collapse">
                    <thead className="bg-slate-50/70 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-500 uppercase text-[9px] tracking-wider select-none">
                      <tr>
                        <th className="p-3">Citoyen Destinataire</th>
                        <th className="p-3">Sujet de l'Email</th>
                        <th className="p-3 font-mono text-center">Statut Acte SQL</th>
                        <th className="p-3 font-mono text-right">Datation UTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-semibold font-sans">
                      {dbLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-55/30 hover:dark:bg-slate-850/40 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-850 dark:text-slate-250 truncate max-w-[190px]">
                              {log.to}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-700 dark:text-slate-350 truncate max-w-[340px]" title={log.subject}>
                              {log.subject}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                              log.status === 'SENT' 
                                ? 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300' 
                                : log.status === 'FAILED'
                                  ? 'bg-red-100 dark:bg-red-955/20 text-red-800 dark:text-red-300'
                                  : 'bg-indigo-100 dark:bg-indigo-955/20 text-indigo-800 dark:text-indigo-300'
                            }`}>
                              {log.status === 'SENT' ? 'Délivré' : log.status === 'FAILED' ? 'En Échec' : 'En Attente'}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-400 font-mono text-[10px]/normal tracking-tight">
                            {new Date(log.createdAt).toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          <div className="bg-amber-500/10 dark:bg-amber-950/10 rounded-xl p-4 border border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-start gap-2.5 font-sans leading-relaxed">
            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold pb-0.5">🔒 Résilience de la Messagerie d'Assainissement AKPBF :</p>
              <p>Chaque fois qu'un processus administratif ou logistique (comme la mise en service d'un abonnement Karpala, l'apurement de compte ou la génération périodique de factures papier PDF) s'exécute, l'ERP insère automatiquement les correspondances d'avis au sein de l'index PostgreSQL avec acte sécurisé "PENDING" ou "SENT". Si des dysfonctionnements du serveur SMTP surviennent, le worker intelligent de Ouagadougou active automatiquement un algorithme d'attente à rétroaction exponentielle (Exponential Backoff, multiplier: 2.0x) pour surmonter les pannes d'Internet temporaires.</p>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === 'CONFIG' && (
        <div className="space-y-6">
          {loadingConfig ? (
            <div className="py-24 text-center text-xs font-bold text-slate-500 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin" />
              <span>Chargement des configurations sécurisées depuis PostgreSQL...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* SMTP Config Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-blue-500" />
                      <span>Passerelle SMTP Personnelle</span>
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={smtpConfig.enabled}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, enabled: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                      <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase">Activer</span>
                    </label>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Configurez vos propres identifiants d'expédition. L'activation de cette option contourne le bac à sable de simulation pour acheminer de <strong>vrais emails certifiés</strong> via votre hébergeur (Zoho Mail, Orange, Gmail, GMX, etc.).
                  </p>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Hôte du Serveur SMTP</label>
                        <input 
                          type="text" 
                          disabled={!smtpConfig.enabled}
                          value={smtpConfig.host}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                          placeholder="smtp.zoho.com" 
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Port</label>
                        <input 
                          type="text" 
                          disabled={!smtpConfig.enabled}
                          value={smtpConfig.port}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                          placeholder="465" 
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input 
                        type="checkbox" 
                        id="secureSsl"
                        disabled={!smtpConfig.enabled}
                        checked={smtpConfig.secure}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                        className="rounded-sm border-slate-350"
                      />
                      <label htmlFor="secureSsl" className="font-bold text-slate-600 dark:text-slate-400 select-none">Considérer une connexion SSL stricte (obligatoire sur le port 465)</label>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">Nom complet de l'expéditeur</label>
                      <input 
                        type="text" 
                        disabled={!smtpConfig.enabled}
                        value={smtpConfig.fromName}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                        placeholder="AKPBF Trésorerie Ouagadougou" 
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">Identifiant / Adresse Email Expéditeur</label>
                      <input 
                        type="email" 
                        disabled={!smtpConfig.enabled}
                        value={smtpConfig.user}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                        placeholder="facturation@akpbf.com" 
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-mono font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        Mot de Passe d'Application (App Password)
                      </label>
                      <input 
                        type="password" 
                        disabled={!smtpConfig.enabled}
                        value={smtpConfig.pass}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                        placeholder={hasPassword ? "********" : "Saisissez votre mot de passe d'application"} 
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-bold"
                      />
                      <p className="text-[10px] text-slate-400 leading-normal pt-0.5">
                        💡 Pour Zoho Mail ou Gmail avec la Double Authentification (2FA) active, vous devez obligatoirement générer un <strong>Mot de Passe d'Application</strong> spécifique dans les réglages de votre compte Zoho, au lieu d'utiliser votre mot de passe habituel.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Periodic Digest Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-teal-500" />
                      <span>Digests Comptables Automatiques</span>
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={digestConfig.enabled}
                        onChange={(e) => setDigestConfig({ ...digestConfig, enabled: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                      <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase">Activer</span>
                    </label>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Déterminez la fréquence et les responsables de direction devant recevoir le <strong>digest périodique consolidé des états financiers</strong> d'assainissement AKPBF sous le référentiel d'UEMOA SYSCOHADA.
                  </p>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        Destinataires (Séparez par des virgules)
                      </label>
                      <input 
                        type="text" 
                        disabled={!digestConfig.enabled}
                        value={digestConfig.recipients}
                        onChange={(e) => setDigestConfig({ ...digestConfig, recipients: e.target.value })}
                        placeholder="groupaksservices@gmail.com, direction@akpbf.com" 
                        className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-bold"
                      />
                      <p className="text-[10px] text-slate-400">
                        Chaque destinataire recevra un email individuel contenant la balance à jour, le bilan actif/passif et le P&L.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Périodicité</label>
                        <select 
                          disabled={!digestConfig.enabled}
                          value={digestConfig.period}
                          onChange={(e) => setDigestConfig({ ...digestConfig, period: e.target.value })}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-bold"
                        >
                          <option value="HOURLY">Toutes les Heures (Tests)</option>
                          <option value="JOURNALIER">Chaque Matin (Daily)</option>
                          <option value="HEBDOMADAIRE">Chaque Semaine (Weekly)</option>
                          <option value="MENSUEL">Chaque Fin de Mois (Monthly)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-300">Heure d'Expédition</label>
                        <input 
                          type="time" 
                          disabled={!digestConfig.enabled}
                          value={digestConfig.timeOfDay}
                          onChange={(e) => setDigestConfig({ ...digestConfig, timeOfDay: e.target.value })}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-bold"
                        />
                      </div>
                    </div>

                    {digestConfig.period === 'HEBDOMADAIRE' && (
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 dark:text-slate-305">Jour de la Semaine</label>
                        <select 
                          disabled={!digestConfig.enabled}
                          value={digestConfig.dayOfWeek}
                          onChange={(e) => setDigestConfig({ ...digestConfig, dayOfWeek: e.target.value })}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg disabled:opacity-50 font-bold"
                        >
                          <option value="1">Lundi (Début d'exercice)</option>
                          <option value="2">Mardi</option>
                          <option value="3">Mercredi</option>
                          <option value="4">Jeudi</option>
                          <option value="5">Vendredi (Bilan hebdomadaire)</option>
                          <option value="6">Samedi</option>
                          <option value="0">Dimanche</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Action and Save Area */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4.5 bg-slate-105/40 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl">
                <div className="text-xs text-slate-550 dark:text-slate-400 leading-normal flex-1 max-w-sm shrink-0">
                  <strong>💡 Actions comptables AKPBF :</strong> Vous pouvez enregistrer la planification dans PostgreSQL ou forcer un envoi test immédiat à vos destinataires pour auditer l'impression du mail SYSCOHADA.
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTriggerDigest}
                    disabled={triggeringDigest || !digestConfig.recipients}
                    className="p-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-705 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className={`h-4 w-4 ${triggeringDigest ? 'animate-pulse' : ''}`} />
                    <span>{triggeringDigest ? 'Génération...' : 'Envoyer un Digest Live Maintenant'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="p-2.5 px-6 bg-gradient-to-r from-emerald-550 to-emerald-650 text-white font-black text-xs rounded-lg shadow-md cursor-pointer hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-55 flex items-center justify-center gap-1.5"
                  >
                    <Database className="h-4 w-4" />
                    <span>{savingConfig ? 'Enregistrement...' : 'Sauvegarder les Paramètres'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
}
