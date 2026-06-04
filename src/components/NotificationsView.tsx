/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Send, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Check,
  RefreshCw,
  Sliders,
  FileText,
  Key,
  Database,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { usePermissions } from '../context/PermissionContext';

// Definition of SMS log matching backend structure
interface SmsLogItem {
  id: string;
  recipientName: string;
  recipientContact: string;
  type: string;
  templateName: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  lastError?: string;
}

interface TwilioSettings {
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

export default function NotificationsView() {
  const { showFeedbackMessage } = usePermissions();

  // Settings states loaded from database API
  const [settings, setSettings] = useState<TwilioSettings>({
    enabled: true,
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    templateWelcome: '',
    templateNearDue: '',
    templateOverdue: '',
    templateAbonnement: '',
    templateCollecte: '',
    daysBeforeDue: 5
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Active Template editing tab
  type TemplateKey = 'templateWelcome' | 'templateNearDue' | 'templateOverdue' | 'templateAbonnement' | 'templateCollecte';
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateKey>('templateWelcome');

  // Interactive Custom Test SMS Send tool states
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testSmsBody, setTestSmsBody] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; errorDetails?: string } | null>(null);

  // Database SMS logs list
  const [logs, setLogs] = useState<SmsLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'pending' | 'failed'>('all');

  // Load JWT Token
  const getAuthHeader = () => {
    const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  /**
   * Refetches backend logs database and active queues
   */
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const resp = await fetch('/api/notifications/logs', {
        headers: getAuthHeader()
      });
      const data = await resp.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('[FRONTEND LOGS LOOKUP FAIL] Could not load SMS history registries:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  /**
   * Loads Twilio Credentials and Custom Template settings on Component mount
   */
  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const resp = await fetch('/api/notifications/settings', {
        headers: getAuthHeader()
      });
      const data = await resp.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        // Default the custom test SMS body to active tab preview
        const activeText = data.settings[activeTemplateTab] || '';
        setTestSmsBody(activeText);
      }
    } catch (e) {
      console.error('[FRONTEND SETTINGS LOOKUP FAIL] Could not load Twilio settings configurations:', e);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  // Synchronously update the test messaging body to template context if selected template changes
  useEffect(() => {
    if (settings[activeTemplateTab]) {
      setTestSmsBody(settings[activeTemplateTab]);
    }
  }, [activeTemplateTab, settings]);

  /**
   * Submits saved Configuration/Templates parameters securely
   */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const resp = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(settings)
      });
      const data = await resp.json();
      if (data.success) {
        showFeedbackMessage(
          "Paramètres enregistrés !", 
          "Les gabarits SMS et identifiants Twilio ont été mis à jour dans PostgreSQL.", 
          "success"
        );
        fetchLogs(); // refresh logs
      } else {
        showFeedbackMessage("Échec de sauvegarde", data.error || "Une erreur est survenue", "error");
      }
    } catch (err: any) {
      showFeedbackMessage("Échec de sauvegarde", "Liaison au serveur interrompue.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  /**
   * Triggers a real-time Test dispatch to a mobile phone
   */
  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber) {
      setTestResult({ success: false, message: "Veuillez entrer un numéro de téléphone valide." });
      return;
    }
    if (!testSmsBody) {
      setTestResult({ success: false, message: "Le contenu du message SMS ne peut pas être vide." });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const resp = await fetch('/api/notifications/send-test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          toPhone: testPhoneNumber,
          body: testSmsBody
        })
      });
      const data = await resp.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: `SMS Expédié ! Signal accepté par Twilio avec ID: ${data.sid}. Formate acheminé: ${data.formattedPhone}`
        });
        showFeedbackMessage("SMS de test envoyé !", "Le SMS a été relayé avec succès.", "success");
        fetchLogs(); // update dispatch list immediately
      } else {
        setTestResult({
          success: false,
          message: "Échec de l'expédition de test Twilio.",
          errorDetails: data.error || "Une réponse inattendue a été renvoyée par le serveur."
        });
        showFeedbackMessage("Échec de l'envoi", data.error || "Une erreur Twilio s'est produite", "error");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Erreur réseau critique.",
        errorDetails: "Impossible de joindre l'API d'acheminement SMS."
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTemplateTextChange = (text: string) => {
    setSettings(prev => ({
      ...prev,
      [activeTemplateTab]: text
    }));
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipientContact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.templateName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return log.status === statusFilter;
  });

  // Calculate stats
  const sentCount = logs.filter(l => l.status === 'sent').length;
  const pendingCount = logs.filter(l => l.status === 'pending').length;
  const failedCount = logs.filter(l => l.status === 'failed').length;

  const activeTemplateDescription = {
    templateWelcome: {
      title: "Bienvenue (Onboarding)",
      desc: "Déclenché après la validation d'adhésion d'un nouveau citoyen dans la plateforme municipale.",
      variables: ["{name}", "{contractId}", "{address}", "{binType}"]
    },
    templateNearDue: {
      title: "Facture proche échéance",
      desc: "Rappel automatique envoyé quelques jours avant l'échéance légale de paiement.",
      variables: ["{name}", "{invoiceRef}", "{amount}", "{dueDate}"]
    },
    templateOverdue: {
      title: "Retard de redevance",
      desc: "Mise en demeure impayée envoyée pour suspendre le ramassage des ordures.",
      variables: ["{name}", "{invoiceRef}", "{amount}"]
    },
    templateAbonnement: {
      title: "Statut de l'Abonnement",
      desc: "Alertes d'actions sur abonnements (Renouvellement, Expiration, Suspension, Réactivation).",
      variables: ["{planName}", "{statusEvent}"]
    },
    templateCollecte: {
      title: "Validation Collecte IoT",
      desc: "Confirmation instantanée générée par les camions AKPBF sur vidage des puces RFID.",
      variables: ["{binCode}", "{weight}", "{statusEvent}"]
    }
  }[activeTemplateTab];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-150/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-850 tracking-tight flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-indigo-600" />
            <span>Portail Télécom Twilio Direct</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">
            Centrale d'acheminement SMS en temps réel, édition de gabarits institutionnels et moniteur de liaison
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
            settings.enabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          {settings.enabled ? (
            <>
              <ToggleRight className="h-5 w-5 text-emerald-600" />
              <span>SMS Automatiques : ACTIFS</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-5 w-5 text-rose-600" />
              <span>SMS Automatiques : DÉSACTIVÉS</span>
            </>
          )}
        </button>
      </div>

      {isLoadingSettings ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 text-xs font-medium">Chargement des paramètres Twilio sécurisés...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: API parameters & Templates Editor */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Twilio Credentials Configuration Settings card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Key className="h-4 w-4 text-indigo-600" />
                  <span>Identifiants & Paramétrage Twilio API</span>
                </h3>
                <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded-full uppercase">
                  Protégé par SSL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Account SID Twilio</label>
                  <input
                    type="text"
                    required
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={settings.accountSid}
                    onChange={(e) => setSettings(prev => ({ ...prev, accountSid: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Auth Token Secret</label>
                  <input
                    type="password"
                    required
                    placeholder="Saisir ou remplacer le code secret..."
                    value={settings.authToken}
                    onChange={(e) => setSettings(prev => ({ ...prev, authToken: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Numéro d'expéditeur Twilio</label>
                  <input
                    type="text"
                    required
                    placeholder="+1234567890"
                    value={settings.phoneNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Numéro virtuel ou SenderID loué sur la console Twilio</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Relance d'impayé (Jours d'échéance)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.daysBeforeDue}
                    onChange={(e) => setSettings(prev => ({ ...prev, daysBeforeDue: parseInt(e.target.value, 10) || 5 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-sans focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Déclenche automatiquement la relance d'échéance impayée X jours avant.</p>
                </div>
              </div>
            </div>

            {/* Template editing module */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  <span>Gestionnaire de Gabarits Nationaux</span>
                </h3>
              </div>

              {/* Tabs list inside Editor */}
              <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab('templateWelcome')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 text-center ${
                    activeTemplateTab === 'templateWelcome'
                      ? 'bg-white text-indigo-650 shadow-2xs border border-slate-100'
                      : 'text-slate-500 hover:bg-slate-120/40 hover:text-slate-800'
                  }`}
                >
                  Bienvenue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab('templateNearDue')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 text-center ${
                    activeTemplateTab === 'templateNearDue'
                      ? 'bg-white text-indigo-650 shadow-2xs border border-slate-100'
                      : 'text-slate-500 hover:bg-slate-120/40 hover:text-slate-800'
                  }`}
                >
                  Échéance
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab('templateOverdue')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 text-center ${
                    activeTemplateTab === 'templateOverdue'
                      ? 'bg-white text-indigo-650 shadow-2xs border border-slate-100'
                      : 'text-slate-500 hover:bg-slate-120/40 hover:text-slate-800'
                  }`}
                >
                  Mise en demeure
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab('templateAbonnement')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 text-center ${
                    activeTemplateTab === 'templateAbonnement'
                      ? 'bg-white text-indigo-650 shadow-2xs border border-slate-100'
                      : 'text-slate-500 hover:bg-slate-120/40 hover:text-slate-800'
                  }`}
                >
                  Abonnement
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplateTab('templateCollecte')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 text-center ${
                    activeTemplateTab === 'templateCollecte'
                      ? 'bg-white text-indigo-650 shadow-2xs border border-slate-100'
                      : 'text-slate-500 hover:bg-slate-120/40 hover:text-slate-800'
                  }`}
                >
                  Collecte IoT
                </button>
              </div>

              {/* Template details descriptors */}
              {activeTemplateDescription && (
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <h4 className="font-extrabold text-[12px] text-slate-850">{activeTemplateDescription.title}</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">{activeTemplateDescription.desc}</p>
                  
                  {/* Variables listing badges */}
                  <div className="pt-1 select-none flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">variables :</span>
                    {activeTemplateDescription.variables.map(variable => (
                      <span 
                        key={variable}
                        className="text-[9.5px] bg-slate-150 font-mono text-indigo-650 font-bold px-2 py-0.5 rounded-lg cursor-help hover:bg-indigo-50"
                        title="Ce tag dynamique sera automatiquement interpolé par l'ERP."
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Textarea text changer */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Rédiger le SMS automatique</label>
                <textarea
                  rows={4}
                  value={settings[activeTemplateTab] || ''}
                  onChange={(e) => handleTemplateTextChange(e.target.value)}
                  placeholder="Saisissez le texte personnalisé..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
                
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="text-slate-400">Enregistré dans PostgreSQL</span>
                  <span className="block font-bold">
                    {(settings[activeTemplateTab] || '').length} car. • {Math.ceil((settings[activeTemplateTab] || '').length / 160)} SMS
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 bg-indigo-600 font-extrabold text-xs text-white rounded-xl shadow-xs hover:bg-indigo-700 transition flex items-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  {isSavingSettings ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Sauvegarder les Paramètres</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Live Mockup Simulator and Instant Test SMS */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Real Interactive Mobile Device Mockup */}
            <div className="bg-slate-900 rounded-[50px] p-4 border-[8px] border-slate-800 shadow-xl space-y-4 relative overflow-hidden h-[420px] flex flex-col">
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-full z-20 flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-700 rounded-lg" />
              </div>

              {/* Status information mock */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold px-2 pt-2">
                <span>08:45</span>
                <span className="text-indigo-400">AKPBF Télécom Direct</span>
                <div className="flex gap-1 items-center">
                  <span>5G</span>
                  <div className="w-3.5 h-1.5 bg-slate-400 rounded-xs" />
                </div>
              </div>

              {/* Chat Title segment */}
              <div className="flex items-center gap-2.5 border-b border-slate-750 pb-2.5 pt-1">
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-black text-[10px] text-white">
                  AK
                </div>
                <div>
                  <h4 className="font-extrabold text-[10.5px] text-white flex items-center gap-1">
                    <span>AKPBF - ASSAINISSEMENT</span>
                    {settings.enabled ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    )}
                  </h4>
                  <span className="text-[7.5px] text-slate-400 block font-semibold">Service SMS Automatique Cocody</span>
                </div>
              </div>

              {/* Chat screen dynamic bubbles */}
              <div className="flex-1 overflow-y-auto space-y-3 pt-2 text-white border-b border-slate-800/60 pb-3">
                <span className="block text-center text-[7.5px] text-slate-500 uppercase tracking-widest font-extrabold">
                  Aujourd'hui
                </span>
                
                <div className="bg-slate-800 rounded-3xl rounded-tl-xs p-3.5 max-w-[85%] text-left text-[10px] text-slate-200 leading-relaxed font-sans border border-slate-700">
                  {settings[activeTemplateTab] || "Gabarit en cours d'édition..."}
                  <span className="block text-[7px] text-right text-indigo-400 font-bold mt-1.5">08:45 ✓ Délivré</span>
                </div>
              </div>

              {/* Keyboard dummy placeholder */}
              <div className="flex gap-1.5 items-center pt-2">
                <div className="bg-slate-800 text-[8.5px] text-slate-500 px-3 py-2 rounded-full flex-1">
                  Répondre en Côte d'Ivoire...
                </div>
                <button 
                  type="button" 
                  disabled
                  className="p-1.5 bg-indigo-600 rounded-full shrink-0 cursor-not-allowed"
                >
                  <Send className="h-3 w-3 text-white" />
                </button>
              </div>
            </div>

            {/* Instant Real-Time Test SMS Sender Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-650" />
                <span>Réseau d'Acheminement SMS Direct</span>
              </h3>
              
              <p className="text-[11px] text-slate-500 font-medium">
                Saisissez un numéro opérationnel pour tester en conditions réelles (sans aucune simulation).
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Numéro Mobile Citoyen</label>
                  <input
                    type="text"
                    required={isSendingTest}
                    placeholder="Ex: +225 07 48 29 10 22"
                    value={testPhoneNumber}
                    onChange={(e) => setTestPhoneNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[8px] text-slate-400 block font-semibold">
                    Seuls les numéros réels formatés (débutant par +225, +33...) sont éligibles.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Texte du Message d'essai</label>
                  <textarea
                    rows={2}
                    placeholder="Rédiger votre SMS personnalisé..."
                    value={testSmsBody}
                    onChange={(e) => setTestSmsBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-705 font-medium leading-relaxed font-sans focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Return validation info alerts */}
                {testResult && (
                  <div className={`p-3 rounded-2xl text-[11px] leading-normal font-semibold border ${
                    testResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-150' 
                      : 'bg-rose-50 text-rose-800 border-rose-150'
                  }`}>
                    <div className="flex items-start gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p>{testResult.message}</p>
                        {testResult.errorDetails && (
                          <p className="mt-1 font-mono text-[9.5px] bg-white p-2 rounded-xl border border-rose-100 text-rose-700">
                            <strong>Cause :</strong> {testResult.errorDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSendTestSms}
                  disabled={isSendingTest}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-slate-800 font-extrabold text-xs text-white rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Liaison Transmetteur Twilio...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Expédier le SMS d'essai réel</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </form>
      )}

      {/* Database/Registry Logs tracking table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs space-y-4 p-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <Database className="h-4 w-4 text-indigo-600" />
              <span>Registre d'envoi et file de livraison AKPBF</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Historique des métriques d'envoi, relances et motifs détaillés d'incident télécom
            </p>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Search box filters */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Téléphone, nom ou texte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>

            {/* Refresh logs button */}
            <button
              type="button"
              onClick={fetchLogs}
              disabled={isLoadingLogs}
              className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer disabled:bg-slate-100"
              title="Rafraîchir les logs"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick filters pills row */}
        <div className="flex items-center gap-2 pb-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white border-transparent'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tous ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('sent')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'sent'
                ? 'bg-emerald-600 text-white border-transparent'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Délivrés ({sentCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-transparent'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            En attente ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              statusFilter === 'failed'
                ? 'bg-rose-600 text-white border-transparent'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Incidents ({failedCount})
          </button>
        </div>

        {/* Logs Table Layout */}
        <div className="overflow-auto max-h-[350px] border border-slate-150 rounded-2xl">
          <table className="w-full text-left font-sans text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-150 font-extrabold text-slate-550 uppercase text-[9.5px]">
              <tr>
                <th className="p-3.5">N° Destination</th>
                <th className="p-3.5">Gabarit / Motif</th>
                <th className="p-3.5">Message Transmis</th>
                <th className="p-3.5">Date & Heure d'envoi</th>
                <th className="p-3.5 text-center">Statut Twilio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium font-sans">
                    Chargement du registre d'acheminement...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium font-sans">
                    Aucun enregistrement ne correspond aux filtres appliqués.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-800">{log.recipientName}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{log.recipientContact}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-block bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-lg text-[9.5px] uppercase">
                        {log.templateName}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-[320px]">
                      <div className="text-slate-650 font-semibold leading-relaxed truncate font-sans" title={log.content}>
                        {log.content}
                      </div>
                      {log.lastError && (
                        <div className="text-[9px] text-rose-600 font-mono mt-0.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>Incident : {log.lastError}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[10.5px]">
                      {new Date(log.sentAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold text-center uppercase tracking-wider ${
                        log.status === 'sent' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                          : log.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-150'
                          : 'bg-rose-50 text-rose-800 border border-rose-150'
                      }`}>
                        {log.status === 'sent' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Délivré</span>
                          </>
                        ) : log.status === 'pending' ? (
                          <>
                            <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                            <span>En attente</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-rose-600" />
                            <span>Échec</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
