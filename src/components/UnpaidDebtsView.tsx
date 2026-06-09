/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Play, 
  UserX, 
  UserCheck, 
  FileText, 
  Database, 
  GitBranch, 
  ChevronRight, 
  Search, 
  Activity, 
  Filter, 
  ShieldAlert, 
  Zap,
  Info,
  Calendar,
  Send,
  Eye,
  Check,
  RefreshCw,
  Coins,
  Phone,
  Settings,
  Flame,
  Activity as HeartRate,
  TrendingDown
} from 'lucide-react';
import { Subscriber, Invoice, SubscriptionPlan, NotificationLog } from '../types';

interface UnpaidDebtsViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  onUpdateSubscriber: (updatedSub: Subscriber) => void;
  onPayInvoice: (invoiceId: string, method: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces') => void;
  onAddNotification: (notif: NotificationLog) => void;
  cityFilter?: string; // Multiville filter from App
}

interface RecoverActionLog {
  id: string;
  subscriberName: string;
  subscriberId: string;
  invoiceId: string;
  debtAgeDays: number;
  unpaidAmount: number;
  statusBefore: string;
  statusAfter: string;
  actionTaken: string; // SMS, Email, WhatsApp, Appel, Promesse, Suspension, Résiliation
  type: 'sms' | 'email' | 'whatsapp' | 'call' | 'promise' | 'suspension' | 'resiliation';
  timestamp: string;
  adminApproved: boolean;
}

export default function UnpaidDebtsView({
  subscribers,
  invoices,
  plans,
  onUpdateSubscriber,
  onPayInvoice,
  onAddNotification,
  cityFilter = 'all'
}: UnpaidDebtsViewProps) {
  
  // Tabs: 'ledger' (Les Débiteurs et Traitement), 'auto_rules' (Règles d'Automatisation), 'logs' (Journal des Relances)
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'auto_rules' | 'logs'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom filter on debt stages: 'all', '0-30', '31-60', '61-90', '90+'
  const [debtAgeFilter, setDebtAgeFilter] = useState<'all' | '0-30' | '31-60' | '61-90' | '90+'>('all');

  // Configurable Automatic Rules parameters (in days)
  const [autoRuleDays1, setAutoRuleDays1] = useState(30); // Warning / Avertissement
  const [autoRuleDays2, setAutoRuleDays2] = useState(60); // Reminder / Relance
  const [autoRuleDays3, setAutoRuleDays3] = useState(90); // Service Suspension
  const [autoRuleDays4, setAutoRuleDays4] = useState(120); // Resiliation proposal / Proposition résiliation

  // Simulated Custom debt days per subscriber id to enable wide testing ranges
  const [simulatedSubDebtDays, setSimulatedSubDebtDays] = useState<{ [key: string]: number }>({
    'SUB-8842': 95,   // 95 Days Overdue -> 90+ bucket
    'SUB-2110': 42,   // 42 Days Overdue -> 31-60 bucket
    'SUB-9944': 14,   // 14 Days Overdue -> 0-30 bucket
    'SUB-4029': 75,   // 75 Days Overdue -> 61-90 bucket
  });

  // Action history logs
  const [recoveringLogs, setRecoveringLogs] = useState<RecoverActionLog[]>([
    {
      id: 'REC-226-01',
      subscriberName: 'Ouedraogo Boureima',
      subscriberId: 'SUB-8842',
      invoiceId: 'FAC-2026-031',
      debtAgeDays: 95,
      unpaidAmount: 3500,
      statusBefore: 'active',
      statusAfter: 'suspended',
      actionTaken: 'Suspension Administrative Securité',
      type: 'suspension',
      timestamp: '2026-06-02 10:45',
      adminApproved: true
    },
    {
      id: 'REC-226-02',
      subscriberName: 'Bamba Mariam',
      subscriberId: 'SUB-5591',
      invoiceId: 'FAC-2026-102',
      debtAgeDays: 42,
      unpaidAmount: 12000,
      actionTaken: 'WhatsApp : Rappel de courtoisie',
      type: 'whatsapp',
      timestamp: '2026-06-04 14:12',
      statusBefore: 'active',
      statusAfter: 'active',
      adminApproved: true
    }
  ]);

  // Execute manual single action on a subscriber
  const handleExecuteAction = (
    debtor: any, 
    actionType: 'sms' | 'email' | 'whatsapp' | 'call' | 'promise' | 'suspension' | 'resiliation',
    unpaidSum: number,
    pendingInvoiceId: string
  ) => {
    let actionLabel = '';
    let description = '';
    let targetStatus: Subscriber['status'] = debtor.status;

    switch(actionType) {
      case 'sms':
        actionLabel = 'Avis SMS de relance';
        description = `AKPBF RECOUVREMENT : Retard de paiement constaté sur votre facture d'abonnement salubrité (${unpaidSum} FCFA). Veuillez régulariser par Orange Money / Wave.`;
        break;
      case 'email':
        actionLabel = 'Courriel de mise en demeure';
        description = `Cher(e) ${debtor.name}, nous constatons un retard persistant de paiement de votre redevance de ramassage d'ordure d'un montant de ${unpaidSum} FCFA. Résolution requise sous 48h.`;
        break;
      case 'whatsapp':
        actionLabel = 'Rappel officiel WhatsApp';
        description = `Bonjour ${debtor.name}, AKPBF Services vous informe qu'un solde débiteur de ${unpaidSum} FCFA perturbe la continuité de collecte de vos bacs. Merci de régler ce jour.`;
        break;
      case 'call':
        actionLabel = 'Appel téléphonique du Contentieux';
        description = `Entretien téléphonique ou mémo vocal enregistré avec ${debtor.name} à propos du non-paiement prolongé de ${unpaidSum} FCFA.`;
        break;
      case 'promise':
        actionLabel = 'Promesse de paiement enregistrée';
        description = `L'abonné ${debtor.name} s'engage formellement à régulariser sa situation financière de ${unpaidSum} FCFA avant la fin de semaine.`;
        break;
      case 'suspension':
        actionLabel = 'Suspension officielle du Service';
        description = `Alerte AKPBF : Suite à un retard de paiement excessif, le ramassage de vos bacs d'ordures à ${debtor.address} est officiellement SUSPENDU.`;
        targetStatus = 'suspended';
        break;
      case 'resiliation':
        actionLabel = 'Résiliation de contrat salubrité';
        description = `Information AKPBF : Votre abonnement municipal d'assainissement d'ordures est RÉSILIÉ. Votre bac standard sera confisqué.`;
        targetStatus = 'terminated';
        break;
    }

    // Insert Log
    const newLogId = `REC-226-${Math.floor(100 + Math.random() * 900)}`;
    const newLog: RecoverActionLog = {
      id: newLogId,
      subscriberName: debtor.name,
      subscriberId: debtor.id,
      invoiceId: pendingInvoiceId || 'FAC-GEN-951',
      debtAgeDays: debtor.debtAgeDays,
      unpaidAmount: unpaidSum,
      statusBefore: debtor.status,
      statusAfter: targetStatus,
      actionTaken: actionLabel,
      type: actionType,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      adminApproved: true
    };

    setRecoveringLogs(prev => [newLog, ...prev]);

    // Update Subscriber status in system
    if (targetStatus !== debtor.status) {
      onUpdateSubscriber({
        ...debtor,
        status: targetStatus,
        paymentStatus: 'overdue'
      });
    }

    // Add general notifications logs
    onAddNotification({
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: debtor.name,
      recipientContact: actionType === 'email' ? debtor.email : debtor.phone,
      type: actionType === 'email' ? 'email' : 'sms',
      templateName: `Contentieux : ${actionLabel}`,
      content: description,
      sentAt: 'À l\'instant',
      status: 'sent'
    });

    alert(`⚡ Action accomplie avec succès !\n- Action : ${actionLabel}\n- Notification transmise à ${debtor.name} (${debtor.phone}).`);
  };

  // Run global batch process matching adjustable parameters
  const handleRunBatchProcessor = () => {
    let triggeredCount = 0;
    const batchLogs: RecoverActionLog[] = [];

    debtorList.forEach(debtor => {
      let actionType: 'sms' | 'email' | 'whatsapp' | 'call' | 'promise' | 'suspension' | 'resiliation' | null = null;
      let actionLabel = '';
      let targetStatus: Subscriber['status'] = debtor.status;
      const unpaidSum = debtor.unpaidSum;
      const tDays = debtor.debtAgeDays;

      if (tDays >= autoRuleDays4) {
        actionType = 'resiliation';
        actionLabel = `Moteur Auto J+${autoRuleDays4} : Proposition de résiliation de contrat`;
        targetStatus = 'terminated';
      } else if (tDays >= autoRuleDays3) {
        actionType = 'suspension';
        actionLabel = `Moteur Auto J+${autoRuleDays3} : Suspension de service d'enlèvement`;
        targetStatus = 'suspended';
      } else if (tDays >= autoRuleDays2) {
        actionType = 'email';
        actionLabel = `Moteur Auto J+${autoRuleDays2} : Relance comptable formelle`;
      } else if (tDays >= autoRuleDays1) {
        actionType = 'sms';
        actionLabel = `Moteur Auto J+${autoRuleDays1} : Avertissement de retard par SMS`;
      }

      if (actionType) {
        const batchLogId = `REC-AR-${Math.floor(1000 + Math.random() * 9000)}`;
        const actionLog: RecoverActionLog = {
          id: batchLogId,
          subscriberId: debtor.id,
          subscriberName: debtor.name,
          invoiceId: debtor.pendingInvoiceId || 'FAC-AUTO',
          debtAgeDays: tDays,
          unpaidAmount: unpaidSum,
          statusBefore: debtor.status,
          statusAfter: targetStatus,
          actionTaken: actionLabel,
          type: actionType,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          adminApproved: true
        };

        batchLogs.push(actionLog);
        triggeredCount++;

        if (targetStatus !== debtor.status) {
          onUpdateSubscriber({
            ...debtor,
            status: targetStatus,
            paymentStatus: 'overdue'
          });
        }

        // Fire SMS / Notification logs
        onAddNotification({
          id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
          recipientName: debtor.name,
          recipientContact: debtor.phone,
          type: 'sms',
          templateName: `Moteur Auto Relance`,
          content: `AKPBF AUTOMATION : ${actionLabel} appliquée sur la fiche ${debtor.id}. Montant impayé : ${unpaidSum} FCFA.`,
          sentAt: 'À l\'instant',
          status: 'sent'
        });
      }
    });

    if (batchLogs.length > 0) {
      setRecoveringLogs(prev => [...batchLogs, ...prev]);
      alert(`🤖 Moteur automatique exécuté conforme aux règles :\n- ${triggeredCount} relances de masse et de suspensions générées et appliquées en base !`);
    } else {
      alert("🔍 Aucune nouvelle transition automatique d'impayé détectée sur vos paramètres.");
    }
  };

  // Encaisser & Réactiver standard flow
  const handlePayAndReactivate = (invoiceId: string, subId: string) => {
    onPayInvoice(invoiceId, 'Wave');
    
    // Auto reactivate suspended contracts
    const sub = subscribers.find(s => s.id === subId);
    if (sub) {
      const originalStatus = sub.status;
      onUpdateSubscriber({
        ...sub,
        status: 'active',
        paymentStatus: 'paid'
      });

      const logId = `REC-REV-${Math.floor(100 + Math.random() * 900)}`;
      const reactivateLog: RecoverActionLog = {
        id: logId,
        subscriberId: sub.id,
        subscriberName: sub.name,
        invoiceId: invoiceId,
        debtAgeDays: 0,
        unpaidAmount: 0,
        statusBefore: originalStatus,
        statusAfter: 'active',
        actionTaken: 'Arbitrage : Encaissé & Réactivation Automatique',
        type: 'promise',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        adminApproved: true
      };

      setRecoveringLogs(prev => [reactivateLog, ...prev]);

      onAddNotification({
        id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: sub.name,
        recipientContact: sub.phone,
        type: 'sms',
        templateName: 'Réactivation Immédiate',
        content: `RÉACTIVATION AKPBF : Versement de régularisation comptabilisé. Votre compte a été remis en service actif. Le camion passera à la prochaine tournée.`,
        sentAt: 'À l\'instant',
        status: 'sent'
      });

      alert(`🎉 Versement de régularisation validé avec succès. Abonnement de ${sub.name} réactivé immédiatement !`);
    }
  };

  // Adjust custom simulation overdue debt days
  const handleSetDebtDays = (subId: string, days: number) => {
    setSimulatedSubDebtDays(prev => ({
      ...prev,
      [subId]: days
    }));
  };

  // Calculate detailed debtors with simulation weights
  const debtorList = useMemo(() => {
    return subscribers.map(sub => {
      // Unpaid invoices
      const unpaidInvs = invoices.filter(i => i.subscriberId === sub.id && i.status !== 'paid');
      const unpaidSum = unpaidInvs.reduce((sum, inv) => sum + inv.amount, 0);

      // Get simulated days
      let debtDays = simulatedSubDebtDays[sub.id];
      if (debtDays === undefined) {
        // Fallback calculation depending on initial status
        if (sub.status === 'suspended' || sub.paymentStatus === 'overdue') {
          debtDays = 95; // default 90+
        } else if (sub.paymentStatus === 'unpaid') {
          debtDays = 42; // default 31-60
        } else {
          debtDays = 0;
        }
      }

      // Bucket categorization
      let ageBucket: '0-30' | '31-60' | '61-90' | '90+' | 'stable' = 'stable';
      if (debtDays > 90) ageBucket = '90+';
      else if (debtDays >= 61) ageBucket = '61-90';
      else if (debtDays >= 31) ageBucket = '31-60';
      else if (debtDays > 0) ageBucket = '0-30';

      return {
        ...sub,
        unpaidSum,
        unpaidCount: unpaidInvs.length,
        pendingInvoiceId: unpaidInvs[0]?.id || '',
        debtAgeDays: debtDays,
        ageBucket
      };
    }).filter(debtor => {
      // 1. Must have simulated debt or real overdue invoices or be suspended
      if (debtor.debtAgeDays === 0 && debtor.unpaidSum === 0 && debtor.status !== 'suspended') return false;

      // 2. City Filter (multi-city layout compatibility)
      // Check if we matches active city filter (neighborhood context)
      // If client neighborhood is Karpala, Gounghin, Pissy, Somgandé -> they reside in Ouagadougou.
      // We can map neighborhoods to city or filter generally
      
      // 3. Search filter
      const textToSearch = `${debtor.name} ${debtor.id} ${debtor.neighborhood}`.toLowerCase();
      if (searchTerm && !textToSearch.includes(searchTerm.toLowerCase())) return false;

      // 4. Aging category filter
      if (debtAgeFilter !== 'all' && debtor.ageBucket !== debtAgeFilter) return false;

      return true;
    });
  }, [subscribers, invoices, simulatedSubDebtDays, searchTerm, debtAgeFilter]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const list = debtorList;
    const totalDue = list.reduce((sum, d) => sum + d.unpaidSum, 0);
    const count0_30 = list.filter(d => d.ageBucket === '0-30').length;
    const count31_60 = list.filter(d => d.ageBucket === '31-60').length;
    const count61_90 = list.filter(d => d.ageBucket === '61-90').length;
    const count90_plus = list.filter(d => d.ageBucket === '90+').length;
    return { totalDue, count0_30, count31_60, count61_90, count90_plus };
  }, [debtorList]);

  return (
    <div className="space-y-6" id="unpaid-debts-view-container">
      
      {/* Module Executive Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-201/80 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#635BFF] font-black">
            <Zap className="h-4 w-4" />
            <span>CRON ENGINE RELANCES • MODULE DE RECOUVREMENT DE REDEVANCES</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Suivi du Recouvrement (FCFA)</h2>
          <p className="text-slate-500 text-sm mt-0.5 mt-1">
            Visualisation des créances ventilées par tranches d'âges, administration manuelle des relances multi-canaux et paramétrage des exclusions de tournées.
          </p>
        </div>

        <button 
          onClick={handleRunBatchProcessor}
          className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2 border border-slate-700 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
          <span>Exécuter le Batch de Relances Automatiques</span>
        </button>
      </div>

      {/* RECOUVREMENT SPREAD AND RETARD CATEGORIES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Category Range 1 */}
        <button 
          onClick={() => setDebtAgeFilter('0-30')}
          className={`text-left p-4 rounded-xl border transition cursor-pointer relative shadow-3xs hover:scale-101 duration-150 ${debtAgeFilter === '0-30' ? 'border-[#635BFF] bg-indigo-50/50' : 'bg-white border-slate-200'}`}
        >
          <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>0 - 30 Jours d'Impayé</span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">{stats.count0_30} Dossiers</div>
          <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Avertissement recommandé</span>
        </button>

        {/* Category Range 2 */}
        <button 
          onClick={() => setDebtAgeFilter('31-60')}
          className={`text-left p-4 rounded-xl border transition cursor-pointer relative shadow-3xs hover:scale-101 duration-150 ${debtAgeFilter === '31-60' ? 'border-[#635BFF] bg-indigo-50/50' : 'bg-white border-slate-200'}`}
        >
          <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>31 - 60 Jours d'Impayé</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <div className="text-xl font-black text-slate-805 mt-1">{stats.count31_60} Dossiers</div>
          <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Relance forte & SMS</span>
        </button>

        {/* Category Range 3 */}
        <button 
          onClick={() => setDebtAgeFilter('61-90')}
          className={`text-left p-4 rounded-xl border transition cursor-pointer relative shadow-3xs hover:scale-101 duration-150 ${debtAgeFilter === '61-90' ? 'border-[#635BFF] bg-indigo-50/50' : 'bg-white border-slate-200'}`}
        >
          <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>61 - 90 Jours d'Impayé</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="text-xl font-black text-slate-805 mt-1">{stats.count61_90} Dossiers</div>
          <span className="text-[10px] font-semibold text-rose-600 mt-1 block">Suspension immédiate de ramassage</span>
        </button>

        {/* Category Range 4 */}
        <button 
          onClick={() => setDebtAgeFilter('90+')}
          className={`text-left p-4 rounded-xl border transition cursor-pointer relative shadow-3xs hover:scale-101 duration-150 ${debtAgeFilter === '90+' ? 'border-[#635BFF] bg-indigo-50/50' : 'bg-white border-slate-200'}`}
        >
          <div className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>90+ Jours d'Impayé</span>
            <span className="w-2.5 h-2.5 bg-slate-900 rounded-full" />
          </div>
          <div className="text-xl font-black text-red-650 mt-1">{stats.count90_plus} Dossiers</div>
          <span className="text-[10px] font-semibold text-red-600 font-bold mt-1 block">Proposition résiliation & contentieux</span>
        </button>

      </div>

      {/* CORE VIEW SUB-NAVIGATION TABS */}
      <div className="flex items-center border-b border-slate-200 gap-6 text-xs font-bold pb-2 text-slate-400">
        <button 
          onClick={() => { setActiveSubTab('ledger'); setDebtAgeFilter('all'); }}
          className={`pb-2.5 transition relative cursor-pointer ${activeSubTab === 'ledger' ? 'text-slate-900 border-b-2 border-[#635BFF]' : 'hover:text-slate-600'}`}
        >
          Livre de Recouvrement Actif ({debtorList.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('auto_rules')}
          className={`pb-2.5 transition relative cursor-pointer ${activeSubTab === 'auto_rules' ? 'text-slate-900 border-b-2 border-[#635BFF]' : 'hover:text-slate-600'}`}
        >
          ⚙️ Paramétrage des Règles Automatiques
        </button>
        <button 
          onClick={() => setActiveSubTab('logs')}
          className={`pb-2.5 transition relative cursor-pointer ${activeSubTab === 'logs' ? 'text-slate-900 border-b-2 border-[#635BFF]' : 'hover:text-slate-600'}`}
        >
          Journal d'Actions de Recouvrement ({recoveringLogs.length})
        </button>
      </div>

      {/* ACTIVE VIEW RENDERING */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            
            {/* Header controls filter bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
              <div className="relative max-w-sm w-full">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Rechercher nom, localité ou référence citoyenne..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-[#635BFF]/10 pl-9 pr-4 py-2 text-xs font-semibold rounded-xl outline-hidden focus:border-[#635BFF]"
                />
              </div>

              {debtAgeFilter !== 'all' && (
                <div className="text-[10.5px] p-1 px-3 bg-[#635BFF]/5 border border-[#635BFF]/15 text-[#635BFF] font-extrabold rounded-lg flex items-center gap-1">
                  <span>Tranche active : {debtAgeFilter === '90+' ? 'Plus de 90 Jours' : `${debtAgeFilter} Jours d'Impayé`}</span>
                  <button onClick={() => setDebtAgeFilter('all')} className="text-slate-500 font-bold hover:text-black ml-1 scale-105">✕</button>
                </div>
              )}
            </div>

            {/* List Table Grid layout */}
            <div className="overflow-x-auto text-xs font-medium">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Citoyen (Réf Contrat)</th>
                    <th className="py-3 px-4">Localisation & Ville</th>
                    <th className="py-3 px-4">Montant Exigible</th>
                    <th className="py-3 px-4">Retard (Simulé)</th>
                    <th className="py-3 px-4">Statut Service</th>
                    <th className="py-3 px-4">Actions de Recouvrement Manuelles</th>
                    <th className="py-3 px-4 text-center">Régularisation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debtorList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        🔍 Aucun foyer débiteur ne correspond aux critères filtrés ({cityFilter === 'all' ? 'Toutes villes' : cityFilter}).
                      </td>
                    </tr>
                  ) : (
                    debtorList.map(debtor => {
                      const plan = plans.find(p => p.id === debtor.planId);
                      const dueAmt = debtor.unpaidSum > 0 ? debtor.unpaidSum : (plan?.price || 3500);

                      return (
                        <tr key={debtor.id} className="hover:bg-slate-50/20 transition duration-150">
                          
                          {/* 1. Citizen detail */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900">{debtor.name}</div>
                            <span className="font-mono text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {debtor.id}
                            </span>
                          </td>

                          {/* 2. Neighborhood city */}
                          <td className="py-3.5 px-4 space-y-0.5 text-slate-500">
                            <div className="font-semibold text-slate-800">{debtor.neighborhood} • {cityFilter === 'all' ? 'Burkina' : cityFilter}</div>
                            <div className="font-mono text-[10px] text-slate-400">{debtor.phone}</div>
                          </td>

                          {/* 3. Due balance */}
                          <td className="py-3.5 px-4">
                            <div className="font-black text-red-650 font-mono text-[12.5px]">
                              {dueAmt.toLocaleString()} FCFA
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              ({debtor.unpaidCount || 1} impayés)
                            </span>
                          </td>

                          {/* 4. Retard selectors */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1">
                              <select 
                                value={debtor.debtAgeDays} 
                                onChange={(e) => handleSetDebtDays(debtor.id, Number(e.target.value))}
                                className="bg-white border border-slate-205 rounded p-1 text-[10px] font-bold text-slate-700 outline-hidden"
                              >
                                <option value="15">15 jours (&lt; 1m)</option>
                                <option value="45">45 jours (1-2m)</option>
                                <option value="75">75 jours (2-3m)</option>
                                <option value="105">105 jours (3m+)</option>
                                <option value="150">150 jours (5m+)</option>
                              </select>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                                debtor.ageBucket === '90+' ? 'bg-red-50 text-red-800' :
                                debtor.ageBucket === '61-90' ? 'bg-rose-50 text-rose-800' :
                                debtor.ageBucket === '31-60' ? 'bg-amber-50 text-amber-800' :
                                'bg-yellow-50 text-yellow-850'
                              }`}>
                                {debtor.ageBucket}
                              </span>
                            </div>
                          </td>

                          {/* 5. Service status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                              debtor.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                              debtor.status === 'suspended'
                                ? 'bg-rose-50 text-rose-800 border-rose-150' :
                                'bg-slate-900 text-slate-100'
                            }`}>
                              {debtor.status === 'active' ? 'Opérationnel' : debtor.status === 'suspended' ? 'Suspendu' : 'Résilié'}
                            </span>
                          </td>

                          {/* 6. Execution buttons list */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              <button 
                                onClick={() => handleExecuteAction(debtor, 'sms', dueAmt, debtor.pendingInvoiceId)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg border border-slate-200 transition cursor-pointer"
                              >
                                SMS
                              </button>
                              <button 
                                onClick={() => handleExecuteAction(debtor, 'email', dueAmt, debtor.pendingInvoiceId)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg border border-slate-200 transition cursor-pointer"
                              >
                                Email
                              </button>
                              <button 
                                onClick={() => handleExecuteAction(debtor, 'whatsapp', dueAmt, debtor.pendingInvoiceId)}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                              >
                                WhatsApp
                              </button>
                              <button 
                                onClick={() => handleExecuteAction(debtor, 'call', dueAmt, debtor.pendingInvoiceId)}
                                className="bg-sky-50 hover:bg-sky-100 text-sky-850 text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg border border-sky-200 transition cursor-pointer"
                              >
                                Appel
                              </button>
                              <button 
                                onClick={() => handleExecuteAction(debtor, 'promise', dueAmt, debtor.pendingInvoiceId)}
                                className="bg-yellow-50 hover:bg-yellow-100 text-yellow-850 text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg border border-yellow-200 transition cursor-pointer"
                              >
                                Promesse
                              </button>
                              <button 
                                onClick={() => handleExecuteAction(debtor, 'suspension', dueAmt, debtor.pendingInvoiceId)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg border border-rose-200 transition cursor-pointer"
                              >
                                Suspendre
                              </button>
                            </div>
                          </td>

                          {/* 7. Quick pay cash in */}
                          <td className="py-3.5 px-4 text-center">
                            {debtor.unpaidCount > 0 ? (
                              <button 
                                onClick={() => handlePayAndReactivate(debtor.pendingInvoiceId, debtor.id)}
                                className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition active:scale-95 text-[10px] cursor-pointer"
                              >
                                Toucher & Réactiver
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Exempté</span>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom ledger info */}
            <div className="bg-slate-50/60 p-3 px-4 text-[10.5px] text-slate-400 font-semibold border-t border-slate-100 flex items-center justify-between">
              <span>Moteur de recouvrement de Salubrité municipale • Décalage UTC+0</span>
              <span className="text-[#635BFF] flex items-center gap-0.5 font-bold">
                <Info className="h-4 w-4" />
                AKPBF Burkina Faso Regolations
              </span>
            </div>

          </div>
        </div>
      )}

      {/* AUTOMATIC TIMED RULES ADJUSTMENT VIEW */}
      {activeSubTab === 'auto_rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
          
          {/* Rules parameters adjustment card */}
          <div className="bg-white border border-slate-202 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Settings className="h-5 w-5 text-[#635BFF]" />
              <h3 className="font-extrabold text-sm text-slate-900">Seuils et Règles de Relance Automatique</h3>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Modifiez ci-dessous les paramètres de seuils temporels d'impayés pour déclencher les alertes et les suspensions de service. Les suspensions d'ordures bloquent instantanément le camion de la tournée.
            </p>

            {/* Parameters list sliders */}
            <div className="space-y-4">
              {/* Threshold 1 */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5Packed">
                  <span>⚠️ Avertissement Retard Retenu (Étape 1)</span>
                  <span className="text-slate-800 font-extrabold">{autoRuleDays1} Jours</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="45" 
                  value={autoRuleDays1} 
                  onChange={(e) => setAutoRuleDays1(Number(e.target.value))}
                  className="w-full accent-[#635BFF]" 
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Déclenche un avis SMS / Courriel standard.</span>
              </div>

              {/* Threshold 2 */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                  <span>✉️ Relance Forte & Intérêt 5% (Étape 2)</span>
                  <span className="text-slate-800 font-extrabold">{autoRuleDays2} Jours</span>
                </div>
                <input 
                  type="range" 
                  min="46" 
                  max="80" 
                  value={autoRuleDays2} 
                  onChange={(e) => setAutoRuleDays2(Number(e.target.value))}
                  className="w-full accent-[#635BFF]" 
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Enveloppe d'avis comminatoire avec calcul d'intérêts de pénalité.</span>
              </div>

              {/* Threshold 3 */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                  <span>🛑 Suspension Service d'Enlèvement (Étape 3)</span>
                  <span className="text-slate-800 font-extrabold">{autoRuleDays3} Jours</span>
                </div>
                <input 
                  type="range" 
                  min="81" 
                  max="115" 
                  value={autoRuleDays3} 
                  onChange={(e) => setAutoRuleDays3(Number(e.target.value))}
                  className="w-full accent-rose-600" 
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 text-red-600 font-semibold">Le contrat passe à SUSPENDU et le bac est confisqué.</span>
              </div>

              {/* Threshold 4 */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                  <span>🔥 Proposition Résiliation de Contrat (Étape Finale)</span>
                  <span className="text-slate-800 font-extrabold">{autoRuleDays4} Jours</span>
                </div>
                <input 
                  type="range" 
                  min="116" 
                  max="180" 
                  value={autoRuleDays4} 
                  onChange={(e) => setAutoRuleDays4(Number(e.target.value))}
                  className="w-full accent-slate-900" 
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Notification de convocation juridique.</span>
              </div>
            </div>

            <button 
              onClick={handleRunBatchProcessor}
              className="w-full bg-[#635BFF] hover:bg-indigo-700 text-white text-xs font-bold p-3.5 rounded-xl transition cursor-pointer"
            >
              Appliquer les Seuils et Ré-évaluer la Base Active
            </button>
          </div>

          {/* Workflow guide visualizer box */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <GitBranch className="h-5 w-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm">Automate des relances d'Afrique de l'Ouest</h3>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <p>AKPBF ERP utilise un automate d'état qui s'exécute chaque nuit à Ouagadougou.</p>
                
                <div className="p-3 bg-slate-850 rounded-xl space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-yellow-300 font-bold">
                    <span>1. J+{autoRuleDays1} : AVERTISSEMENT SMS</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <span>2. J+{autoRuleDays2} : RELANCE DE COURTOISIE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <span>3. J+{autoRuleDays3} : SUSPENSION DE SERVICE</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-red-550 font-black">
                    <span>4. J+{autoRuleDays4} : SUPPRESSION DU CONTRAT</span>
                  </div>
                </div>

                <p>Si un abonné paie sa créance, l'automate le repasse immédiatement à l'état <strong className="text-emerald-400">OPÉRATIONNEL</strong> et le réintègre en tournée.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[10.5px] italic text-slate-500 text-center">
              Système certifié conforme aux chartes municipales.
            </div>
          </div>

        </div>
      )}

      {/* LOGS LIST VIEW */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-850">Livre d'Audit de Contentieux</h3>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Traçabilité des avertissements officiels administrés.</p>
            </div>
            <button 
              onClick={() => {
                setRecoveringLogs([]);
                alert("Historique des relances remis à zéro.");
              }}
              className="p-1.5 bg-slate-100 text-slate-500 hover:text-slate-850 rounded-lg text-[10.5px] font-bold cursor-pointer"
            >
              Vider le Journal
            </button>
          </div>

          <div className="divide-y divide-slate-100 font-medium">
            {recoveringLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Aucune relance consignée dans le journal d'audits.
              </div>
            ) : (
              recoveringLogs.map(log => {
                return (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-semibold">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase font-black text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.id}
                        </span>
                        <h4 className="text-slate-900 font-extrabold">{log.subscriberName}</h4>
                        <span className="text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">{log.timestamp}</span>
                      </div>
                      
                      <p className="text-slate-500 text-[11px] mt-1">
                        Type : <strong className="text-slate-700">{log.actionTaken}</strong> ({log.debtAgeDays} jours de retard - {log.unpaidAmount.toLocaleString()} FCFA).
                      </p>
                    </div>

                    <div className="shrink-0 text-slate-400 font-mono text-[10px]">
                      Abonné : {log.subscriberId}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
}
