/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
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
  Coins
} from 'lucide-react';
import { Subscriber, Invoice, SubscriptionPlan, NotificationLog } from '../types';

interface UnpaidDebtsViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  onUpdateSubscriber: (updatedSub: Subscriber) => void;
  onPayInvoice: (invoiceId: string, method: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces') => void;
  onAddNotification: (notif: NotificationLog) => void;
}

interface RecoverActionLog {
  id: string;
  subscriberName: string;
  subscriberId: string;
  invoiceId: string;
  delayMonths: number;
  unpaidAmount: number;
  statusBefore: string;
  statusAfter: string;
  actionTaken: 'Avertissement SMS/Mail' | 'Notification renforcée' | 'Mise En Demeure' | 'Suspension de Contrat' | 'Réactivation Automatique';
  type: 'email' | 'sms' | 'system';
  timestamp: string;
  adminApproved: boolean;
}

export default function UnpaidDebtsView({
  subscribers,
  invoices,
  plans,
  onUpdateSubscriber,
  onPayInvoice,
  onAddNotification
}: UnpaidDebtsViewProps) {
  
  // Tabs: 'ledger' (Les Débiteurs et Traitement), 'workflow' (Schéma & Logique Métier), 'logs' (Journal des Actions)
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'workflow' | 'logs'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'warning' | 'reinforced' | 'put_in_suit' | 'suspended'>('all');
  
  // Custom mock unpaid database to track dates and test different debt age ranges
  const [targetSubscriberDebtWeeks, setTargetSubscriberDebtWeeks] = useState<{ [key: string]: number }>({
    'SUB-8842': 8,   // 2 Months -> Notification renforcée
    'SUB-2110': 4,   // 1 Month -> Avertissement
    'SUB-9944': 13   // 3 Months overdue -> Mise en demeure
  });

  // Action history state
  const [recoveringLogs, setRecoveringLogs] = useState<RecoverActionLog[]>([
    {
      id: 'REC-001',
      subscriberName: 'Mamadou Diallo',
      subscriberId: 'SUB-8842',
      invoiceId: 'FAC-2026-003',
      delayMonths: 2,
      unpaidAmount: 3500,
      statusBefore: 'active',
      statusAfter: 'active',
      actionTaken: 'Notification renforcée',
      type: 'email',
      timestamp: '2026-05-18 10:45',
      adminApproved: true
    },
    {
      id: 'REC-002',
      subscriberName: 'Ouedraogo Salif',
      subscriberId: 'SUB-9944',
      invoiceId: 'FAC-2026-008',
      delayMonths: 3,
      unpaidAmount: 6000,
      statusBefore: 'active',
      statusAfter: 'active',
      actionTaken: 'Mise En Demeure',
      type: 'sms',
      timestamp: '2026-05-20 09:12',
      adminApproved: false // Requires admin approval!
    }
  ]);

  // Dynamic Rule Processor simulator logic. Runs dynamically to evaluate subscribers' overdue bills.
  const handleRunBatchProcessor = () => {
    let triggeredActionsCount = 0;
    const newLogs: RecoverActionLog[] = [];

    // Loop through each subscriber who has overdue invoices
    subscribers.forEach(sub => {
      // Find overdue invoices for this subscriber
      const subInvoices = invoices.filter(i => i.subscriberId === sub.id && i.status !== 'paid');
      if (subInvoices.length === 0) return;

      const unpaidSum = subInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const firstInvoice = subInvoices[0];

      // Use simulated weeks/months overdue or fallback on invoice age estimation
      // Let's check simulated duration first, if not declared set a default based on sub.paymentStatus
      let simulatedWeeks = targetSubscriberDebtWeeks[sub.id];
      if (simulatedWeeks === undefined) {
        simulatedWeeks = sub.paymentStatus === 'overdue' ? 8 : sub.paymentStatus === 'unpaid' ? 4 : 0;
      }
      
      const simulatedMonths = Math.floor(simulatedWeeks / 4) || 1;

      if (simulatedWeeks === 0) return;

      let action: 'Avertissement SMS/Mail' | 'Notification renforcée' | 'Mise En Demeure' | 'Suspension de Contrat' | null = null;
      let notificationType: 'email' | 'sms' | 'system' = 'sms';
      let notificationContent = '';
      let targetStatus: Subscriber['status'] = sub.status;

      if (simulatedMonths >= 6) {
        action = 'Suspension de Contrat';
        notificationType = 'system';
        notificationContent = `ALERTE SUSPENSION AKPBF : Votre contrat ${sub.id} a été suspendu automatiquement après 6 mois d'impayés (${unpaidSum} FCFA). La collecte de votre bac est annulée d'urgence.`;
        targetStatus = 'suspended';
      } else if (simulatedMonths >= 3) {
        action = 'Mise En Demeure';
        notificationType = 'sms';
        notificationContent = `AKPBF MISE EN DEMEURE : Avis solennel de recouvrement forcé sous contrat ${sub.id}. Solde impayé exigible depuis 3 mois : ${unpaidSum} FCFA. Régularisation immédiate requise sous peine de poursuites.`;
      } else if (simulatedMonths >= 2) {
        action = 'Notification renforcée';
        notificationType = 'email';
        notificationContent = `Cher(e) ${sub.name}, votre redevance de salubrité AKPBF enregistre 2 mois de retard (${unpaidSum} FCFA). Un intérêt de pénalité de 5% pourrait s'appliquer sous peu. Contactez la mairies de votre secteur.`;
      } else if (simulatedMonths >= 1) {
        action = 'Avertissement SMS/Mail';
        notificationType = 'sms';
        notificationContent = `AKPBF RAPPEL : Votre facture de redevance pour le service de voirie enregistre 1 mois de retard (${unpaidSum} FCFA). Merci de régulariser afin d'éviter la suspension de vos levées.`;
      }

      if (action) {
        // Build recover action log
        const logId = `REC-${Math.floor(100 + Math.random() * 900)}`;
        const actionLog: RecoverActionLog = {
          id: logId,
          subscriberId: sub.id,
          subscriberName: sub.name,
          invoiceId: firstInvoice.id,
          delayMonths: simulatedMonths,
          unpaidAmount: unpaidSum,
          statusBefore: sub.status,
          statusAfter: targetStatus,
          actionTaken: action,
          type: notificationType,
          timestamp: 'À l\'instant',
          adminApproved: action !== 'Suspension de Contrat' && action !== 'Mise En Demeure' // High impact actions require manual validation
        };

        newLogs.push(actionLog);
        triggeredActionsCount++;

        // Auto change subscriber status in the state database if auto-approved
        if (actionLog.adminApproved && targetStatus !== sub.status) {
          onUpdateSubscriber({
            ...sub,
            status: targetStatus,
            paymentStatus: 'overdue'
          });
        }

        // Fire official notification logs
        onAddNotification({
          id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
          recipientName: sub.name,
          recipientContact: notificationType === 'sms' ? sub.phone : sub.email,
          type: notificationType === 'system' ? 'sms' : notificationType,
          templateName: `Moteur Impayés : ${action}`,
          content: notificationContent,
          sentAt: 'A l\'instant',
          status: 'sent'
        });
      }
    });

    if (newLogs.length > 0) {
      setRecoveringLogs(prev => [...newLogs, ...prev]);
      alert(`⚡ Moteur exécuté avec succès. ${triggeredActionsCount} actions générées et stockées dans l'historique !`);
    } else {
      alert("🔍 Aucune nouvelle anomalie de solvabilité détectée par le scanner.");
    }
  };

  // Administrator approval / Validation action
  const handleApproveAction = (logId: string) => {
    const updated = recoveringLogs.map(log => {
      if (log.id === logId) {
        // Execute state changes for the subscriber
        const targetSub = subscribers.find(s => s.id === log.subscriberId);
        if (targetSub) {
          let updatedStatus = targetSub.status;
          if (log.actionTaken === 'Suspension de Contrat') {
            updatedStatus = 'suspended';
          }
          
          onUpdateSubscriber({
            ...targetSub,
            status: updatedStatus,
            paymentStatus: 'overdue'
          });
        }
        return { ...log, adminApproved: true };
      }
      return log;
    });

    setRecoveringLogs(updated);

    const logDetails = recoveringLogs.find(l => l.id === logId);
    if (logDetails) {
      onAddNotification({
        id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: logDetails.subscriberName,
        recipientContact: 'Validation Système',
        type: 'sms',
        templateName: 'Validation Administrative Recouvrement',
        content: `PROMPT ADMIN : Action '${logDetails.actionTaken}' approuvée officiellement par l'administrateur de voirie sur le contrat ${logDetails.subscriberId}.`,
        sentAt: 'À l\'instant',
        status: 'sent'
      });
    }

    alert("✅ Action approuvée et répercutée sur le dossier actif de l'abonné.");
  };

  // Pay and trigger automatic reactivation
  const handlePayAndReactivate = (invoiceId: string, subId: string) => {
    onPayInvoice(invoiceId, 'Wave');
    
    // Auto reactivate contract if suspended
    const sub = subscribers.find(s => s.id === subId);
    if (sub) {
      const originalStatus = sub.status;
      onUpdateSubscriber({
        ...sub,
        status: 'active',
        paymentStatus: 'paid'
      });

      // Insert action reactivating the logs
      const logId = `REC-${Math.floor(100 + Math.random() * 900)}`;
      const reactivateLog: RecoverActionLog = {
        id: logId,
        subscriberId: sub.id,
        subscriberName: sub.name,
        invoiceId: invoiceId,
        delayMonths: 0,
        unpaidAmount: 0,
        statusBefore: originalStatus,
        statusAfter: 'active',
        actionTaken: 'Réactivation Automatique',
        type: 'sms',
        timestamp: 'À l\'instant',
        adminApproved: true
      };

      setRecoveringLogs(prev => [reactivateLog, ...prev]);

      onAddNotification({
        id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: sub.name,
        recipientContact: sub.phone,
        type: 'sms',
        templateName: 'Contrat Réactivé',
        content: `RÉACTIVATION AKPBF : Suite à votre versement, votre compte a été basculé sous statut ${reactivateLog.statusAfter}. Vos bacs sont de nouveau inscrits sur les tournées des camions-bennes.`,
        sentAt: 'À l\'instant',
        status: 'sent'
      });

      alert(`🎉 Régularisation réussie. Contrat de ${sub.name} remis automatiquement à l'état Actif !`);
    }
  };

  // Adjust simulated debt parameter
  const handleSetWeeksDebt = (subId: string, weeks: number) => {
    setTargetSubscriberDebtWeeks(prev => ({
      ...prev,
      [subId]: weeks
    }));
  };

  // Filter subscribers list who have unpaid or simulated overdue debts
  const debtorList = useMemo(() => {
    return subscribers.map(sub => {
      const unpaidInvs = invoices.filter(i => i.subscriberId === sub.id && i.status !== 'paid');
      const unpaidSum = unpaidInvs.reduce((sum, inv) => sum + inv.amount, 0);
      
      let simulatedWeeks = targetSubscriberDebtWeeks[sub.id];
      if (simulatedWeeks === undefined) {
        simulatedWeeks = sub.paymentStatus === 'overdue' ? 8 : sub.paymentStatus === 'unpaid' ? 4 : 0;
      }
      
      const simulatedMonths = Math.floor(simulatedWeeks / 4) || (unpaidInvs.length > 0 ? 1 : 0);

      // Determine current policy tier
      let currentTier: 'RAS' | 'Avertissement' | 'Notification renforcée' | 'Mise En Demeure' | 'Suspension du contrat' = 'RAS';
      if (sub.status === 'suspended') {
        currentTier = 'Suspension du contrat';
      } else if (simulatedMonths >= 6) {
        currentTier = 'Suspension du contrat';
      } else if (simulatedMonths >= 3) {
        currentTier = 'Mise En Demeure';
      } else if (simulatedMonths >= 2) {
        currentTier = 'Notification renforcée';
      } else if (simulatedMonths >= 1) {
        currentTier = 'Avertissement';
      }

      return {
        ...sub,
        unpaidSum,
        unpaidCount: unpaidInvs.length,
        pendingInvoiceId: unpaidInvs[0]?.id || '',
        simulatedWeeks,
        simulatedMonths,
        currentTier
      };
    }).filter(debtor => {
      // Must have simulated debt or actual unpaid sum
      if (debtor.simulatedWeeks === 0 && debtor.unpaidSum === 0 && debtor.status !== 'suspended') return false;
      
      // Match search string
      const matchesSearch = debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            debtor.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Level filter
      if (filterLevel === 'all') return matchesSearch;
      if (filterLevel === 'warning') return matchesSearch && debtor.currentTier === 'Avertissement';
      if (filterLevel === 'reinforced') return matchesSearch && debtor.currentTier === 'Notification renforcée';
      if (filterLevel === 'put_in_suit') return matchesSearch && debtor.currentTier === 'Mise En Demeure';
      if (filterLevel === 'suspended') return matchesSearch && (debtor.currentTier === 'Suspension du contrat' || debtor.status === 'suspended');

      return matchesSearch;
    });
  }, [subscribers, invoices, targetSubscriberDebtWeeks, searchTerm, filterLevel]);

  return (
    <div className="space-y-6">
      
      {/* Upper Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#635BFF] font-black">
            <Zap className="h-4 w-4 text-[#635BFF]" />
            <span>CRON ENGINE • MODULE FISCAL DE RECOUVREMENT OBSTINÉ</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Impayés & Contentieux</h2>
          <p className="text-slate-500 text-sm mt-0.5">Automatisation des suspensions de service d'assainissement et relances juridiques multi-canaux d'Abidjan.</p>
        </div>

        {/* Global manual audit scanner button */}
        <button 
          onClick={handleRunBatchProcessor}
          className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2 border border-slate-700 active:scale-95 transition cursor-pointer"
        >
          <Play className="h-4 w-4 text-emerald-400 fill-emerald-400" />
          <span>Exécuter le batch de recouvrement nocturne</span>
        </button>
      </div>

      {/* CORE RULE DECK REPRESENTATION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Tier 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 relative hover:border-slate-350 transition shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Retard &gt; 1 Mois</span>
            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[9.5px] font-bold">Étape 1</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900">Avertissement Simple</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Envoi automatique d'un SMS et e-mail à l'abonné récapitulant les sommes dues exigibles.
            </p>
          </div>
          <div className="text-[10px] bg-slate-50 p-2 rounded text-slate-400 font-mono">
            Canal : SMS & Courriel • <span className="text-[#635BFF] font-bold">SMS-AVERT</span>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 relative hover:border-slate-350 transition shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Retard &gt; 2 Mois</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9.5px] font-bold">Étape 2</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900">Notification Renforcée</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Avis d'impôt avec intérêt comminatoire de 5% du solde et avertissement pré-suspension à J-15.
            </p>
          </div>
          <div className="text-[10px] bg-slate-50 p-2 rounded text-slate-400 font-mono">
            Canal : Email & SMS • <span className="text-[#635BFF] font-bold">MAIL-RELANCE</span>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 relative hover:border-slate-350 transition shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Retard &gt; 3 Mois</span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[9.5px] font-bold">Étape 3</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900">Mise En Demeure</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Dernier avis formel avant recours. Demande d'intervention d'huissier municipal enregistrée au greffe.
            </p>
          </div>
          <div className="text-[10px] bg-slate-50 p-2 rounded text-slate-400 font-mono">
            Canal : SMS & Papier • <span className="text-rose-600 font-bold">ADMIN-APPROB</span>
          </div>
        </div>

        {/* Tier 4 */}
        <div className="bg-slate-950 text-white rounded-xl p-4 space-y-3 relative shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Retard &gt; 6 Mois</span>
            <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[9.5px] font-bold">Étape Finale</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-100">Suspension Automatique</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Contrat bloqué. Bacs retirés de l'algorithme des tournées. Bacs déclarés hors d'usage.
            </p>
          </div>
          <div className="text-[10px] bg-slate-900 p-2 rounded text-slate-500 font-mono">
            Effet : Blocage SIG immédiat
          </div>
        </div>

      </div>

      {/* CORE WORKFLOW AND LOGS SUB NAVIGATION TABS */}
      <div className="flex items-center border-b border-slate-150 gap-6 text-xs font-bold pb-2 text-slate-400">
        <button 
          onClick={() => setActiveSubTab('ledger')}
          className={`pb-2.5 transition relative cursor-pointer ${activeSubTab === 'ledger' ? 'text-slate-900 border-b-2 border-[#635BFF]' : 'hover:text-slate-600'}`}
        >
          Grand Livre des Débiteurs ({debtorList.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('workflow')}
          className={`pb-2.5 transition relative cursor-pointer ${activeSubTab === 'workflow' ? 'text-slate-900 border-b-2 border-[#635BFF]' : 'hover:text-slate-600'}`}
        >
          Workflow & SGBD PostgreSQL
        </button>
        <button 
          onClick={() => setActiveSubTab('logs')}
          className={`pb-2.5 transition relative cursor-pointer ${activeSubTab === 'logs' ? 'text-slate-900 border-b-2 border-[#635BFF]' : 'hover:text-slate-600'}`}
        >
          Journal d'Actions & Avis ({recoveringLogs.length})
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            
            {/* Table Filters upper banner */}
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  placeholder="Rechercher un dossier débiteur (Nom, ID)..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 text-xs font-medium rounded-xl outline-hidden focus:border-slate-350"
                />
              </div>

              {/* Status selectors */}
              <div className="flex items-center gap-2 text-xs">
                <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="flex bg-white border border-slate-200 p-1.5 rounded-lg font-bold gap-1 text-[10.5px]">
                  <button 
                    onClick={() => setFilterLevel('all')}
                    className={`px-2.5 py-1 rounded ${filterLevel === 'all' ? 'bg-[#635BFF] text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Tous
                  </button>
                  <button 
                    onClick={() => setFilterLevel('warning')}
                    className={`px-2.5 py-1 rounded ${filterLevel === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Avertissement
                  </button>
                  <button 
                    onClick={() => setFilterLevel('reinforced')}
                    className={`px-2.5 py-1 rounded ${filterLevel === 'reinforced' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Pris en faute (+2m)
                  </button>
                  <button 
                    onClick={() => setFilterLevel('put_in_suit')}
                    className={`px-2.5 py-1 rounded ${filterLevel === 'put_in_suit' ? 'bg-rose-100 text-rose-800' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Mise en demeure
                  </button>
                  <button 
                    onClick={() => setFilterLevel('suspended')}
                    className={`px-2.5 py-1 rounded ${filterLevel === 'suspended' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Suspendus
                  </button>
                </div>
              </div>
            </div>

            {/* List Table Grid representation */}
            <div className="overflow-x-auto text-xs font-medium">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-slate-405 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Abonné (Contrat)</th>
                    <th className="py-3 px-4">Localité/Contact</th>
                    <th className="py-3 px-4">Créances (Nbre)</th>
                    <th className="py-3 px-4">Délai Retard Retenu</th>
                    <th className="py-3 px-4">Statut Service</th>
                    <th className="py-3 px-4">Traitement Contentieux</th>
                    <th className="py-3 px-4 text-center">Ractions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 select-none">
                  {debtorList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        🔍 Aucun dossier de contentieux ne correspond à vos filtres.
                      </td>
                    </tr>
                  ) : debtorList.map((debtor) => {
                    const planInfo = plans.find(p => p.id === debtor.planId);
                    const contractWarning = debtor.currentTier;
                    
                    return (
                      <tr key={debtor.id} className="hover:bg-slate-50/50 transition">
                        
                        {/* 1. Name and id contract */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-850">{debtor.name}</div>
                          <span className="font-mono text-[9px] uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {debtor.id}
                          </span>
                        </td>

                        {/* 2. Neighborhood & Contact details */}
                        <td className="py-3 px-4 space-y-0.5 text-slate-500">
                          <div>Secteur {debtor.neighborhood}</div>
                          <div className="font-mono text-[10px]">{debtor.phone}</div>
                        </td>

                        {/* 3. Delayed Invoices */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-rose-600 font-mono">
                            {debtor.unpaidSum > 0 ? `${debtor.unpaidSum.toLocaleString()} FCFA` : `${planInfo?.price || 3500} FCFA (Est)`}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            ({debtor.unpaidCount || 1} impayés)
                          </span>
                        </td>

                        {/* 4. Overdue weeks controls */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <select 
                              value={debtor.simulatedWeeks ?? 0} 
                              onChange={(e) => handleSetWeeksDebt(debtor.id, Number(e.target.value))}
                              className="bg-white border border-slate-200 rounded p-1 text-[10.5px] font-bold text-slate-700 outline-hidden"
                            >
                              <option value="0">À jour (Ok)</option>
                              <option value="4">4 semaines (~1 Mois)</option>
                              <option value="8">8 semaines (~2 Mois)</option>
                              <option value="12">12 semaines (~3 Mois)</option>
                              <option value="24">24 semaines (~6 Mois)</option>
                            </select>
                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                              ({debtor.simulatedMonths}m)
                            </span>
                          </div>
                        </td>

                        {/* 5. Status code */}
                        <td className="py-3 px-4">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            debtor.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-150'
                          }`}>
                            {debtor.status === 'active' ? 'Opérationnel' : 'Suspendu (Bloqué)'}
                          </span>
                        </td>

                        {/* 6. Legal Alert tier */}
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-bold font-mono ${
                            contractWarning === 'Suspension du contrat' ? 'bg-slate-900 text-slate-100' :
                            contractWarning === 'Mise En Demeure' ? 'bg-rose-100 text-rose-800' :
                            contractWarning === 'Notification renforcée' ? 'bg-amber-100 text-amber-800' :
                            contractWarning === 'Avertissement' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {contractWarning}
                          </span>
                        </td>

                        {/* 7. Specific payment trigger and instant reactivation */}
                        <td className="py-3 px-4 text-center">
                          {debtor.unpaidCount > 0 ? (
                            <button
                              onClick={() => handlePayAndReactivate(debtor.pendingInvoiceId, debtor.id)}
                              className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg transition active:scale-95 text-[10.5px] cursor-pointer"
                              title="Toucher et Reactiver"
                            >
                              Encaisser & Réactiver 
                            </button>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Exempte</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom info banner */}
            <div className="bg-slate-50 p-3 px-4 text-[10.5px] text-slate-400 font-semibold border-t border-slate-100 flex items-center justify-between">
              <span>Le batch comptable nocturne s'exécute à 00h00 heure locale d'Abidjan.</span>
              <span className="text-[#635BFF] flex items-center gap-0.5">
                <Info className="h-3.5 w-3.5" />
                Loi ERP UEMOA v12.1 Compliance
              </span>
            </div>

          </div>
        </div>
      )}

      {/* WORKFLOW PATH & POSTGRESQL SCHEMAS DETAIL VISUALIZER */}
      {activeSubTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
          
          {/* Left panel Schema SQL DB structure */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="h-5 w-5 text-[#635BFF]" />
              <h3 className="font-extrabold text-sm text-slate-900">Architecture SGBD PostgreSQL (SQL Prêt)</h3>
            </div>

            <p className="text-slate-500 text-[11.5px] leading-relaxed">
              Pour assurer l'intégrité et l'obstination fiscale, voici la structure relationnelle à provisionner pour supporter le moteur métier d'impayés :
            </p>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10.5px] leading-relaxed overflow-x-auto space-y-4">
              <div>
                <span className="text-emerald-400 block font-bold">-- 1. Table de suivi des Recouvrements Contentieux</span>
                <span>{"CREATE TABLE IF NOT EXISTS tax_recovering_actions (\n"}</span>
                <span>{"  id VARCHAR(30) PRIMARY KEY,\n"}</span>
                <span>{"  subscriber_id VARCHAR(30) NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,\n"}</span>
                <span>{"  unpaid_invoice_id VARCHAR(30) NOT NULL REFERENCES invoices(id),\n"}</span>
                <span>{"  delay_months INT NOT NULL DEFAULT 0,\n"}</span>
                <span>{"  unpaid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,\n"}</span>
                <span>{"  action_type VARCHAR(50) NOT NULL, -- 'WARNING' | 'REINFORCED' | 'LAWSUIT' | 'SUSPEND'\n"}</span>
                <span>{"  admin_approved BOOLEAN DEFAULT FALSE,\n"}</span>
                <span>{"  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n"}</span>
                <span>{");"}</span>
              </div>

              <div>
                <span className="text-amber-400 block font-bold">-- 2. Trigger de réactivation SQL sur paiement</span>
                <span>{"CREATE OR REPLACE FUNCTION reactivate_subscriber_on_payment()\n"}</span>
                <span>{"RETURNS TRIGGER AS $$\n"}</span>
                <span>{"BEGIN\n"}</span>
                <span>{"  IF NEW.status = 'paid' THEN\n"}</span>
                <span>{"    UPDATE subscribers \n"}</span>
                <span>{"    SET status = 'active', payment_status = 'paid' \n"}</span>
                <span>{"    WHERE id = NEW.subscriber_id;\n"}</span>
                <span>{"  END IF;\n"}</span>
                <span>{"  RETURN NEW;\n"}</span>
                <span>{"END;\n"}</span>
                <span>{"$$ LANGUAGE plpgsql;"}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[#635BFF] flex items-center gap-2 text-[10.5px] font-bold">
              <Info className="h-4.5 w-4.5 shrink-0" />
              <span>Ce schéma assure un verrouillage de sécurité : aucun camion ne sera affecté à un foyer suspendu.</span>
            </div>
          </div>

          {/* Right panel SVG Flowchart and logic workflow */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <GitBranch className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Pipeline de Décision Métier Contentieux</h3>
              </div>

              <p className="text-slate-500 text-[11.5px] leading-relaxed">
                Le diagramme d'état ci-dessous schématise la transition de contrat d'un foyer d'Abidjan :
              </p>

              {/* Visual SVG diagram representation */}
              <div className="p-4 bg-slate-950 rounded-xl flex flex-col items-center justify-center space-y-4 py-8 relative">
                
                {/* Stage 1 */}
                <div className="w-48 p-2.5 bg-emerald-900/60 border border-emerald-500 rounded-lg text-center text-[10.5px]">
                  <strong className="block text-emerald-300 font-extrabold">CONTRAT ACTIF</strong>
                  <span className="text-[10px] text-slate-400">Factures rattachées réglées</span>
                </div>

                <div className="h-4 w-0.5 bg-indigo-500/50" />

                {/* Stage 2 */}
                <div className="w-48 p-2.5 bg-yellow-950/60 border border-yellow-500 rounded-lg text-center text-[10.5px]">
                  <strong className="block text-yellow-300 font-extrabold">E1 : Avertissement (&gt; 1m)</strong>
                  <span className="text-[10px] text-slate-400">Courriel de relance informel</span>
                </div>

                <div className="h-4 w-0.5 bg-indigo-500/50" />

                {/* Stage 3 */}
                <div className="w-48 p-2.5 bg-amber-950/80 border border-amber-500 rounded-lg text-center text-[10.5px]">
                  <strong className="block text-amber-300 font-extrabold">E2 : Relance forte (&gt; 2m)</strong>
                  <span className="text-[10px] text-slate-400">Menace fiscale + pénalité 5%</span>
                </div>

                <div className="h-4 w-0.5 bg-indigo-500/50" />

                {/* Stage 4 */}
                <div className="w-48 p-2.5 bg-rose-950 border border-rose-500/80 rounded-lg text-center text-[10.5px]">
                  <strong className="block text-rose-300 font-extrabold">E3 : Mise En Demeure (&gt; 3m)</strong>
                  <span className="text-[10px] text-slate-400">Approbation d'huissier requise</span>
                </div>

                <div className="h-4 w-0.5 bg-[#635BFF]" />

                {/* Stage 5 */}
                <div className="w-48 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-center text-[10.5px]">
                  <strong className="font-extrabold text-slate-200 block">E4 : SUSPENDU (&gt; 6m)</strong>
                  <span className="text-[10px] text-rose-400 font-black">Hors tournée SIG</span>
                </div>

                {/* Loop Back transition */}
                <div className="absolute right-4 top-1/4 h-2/3 w-8 border-r-2 border-dashed border-emerald-500 rounded-r-xl flex items-center justify-center pointer-events-none">
                  <span className="text-[7.5px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded rotate-90 transform translate-x-3.5 whitespace-nowrap">
                    RECHARGE (REMPLACER PAIEMENT) -- RÉACTIVATION AUTOMATIQUE
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10.5px] text-slate-400 text-center italic">
              Conçu pour l'assainissement urbain d'Afrique de l'Ouest (UEMOA CEP).
            </div>
          </div>

        </div>
      )}

      {/* DETAILED ACTION JOURNAL & ADMONITION LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-850">Historique des Audits & Traitements Fiscaux</h3>
              <p className="text-[11.5px] text-slate-400 mt-0.5">Vues d'audit réglementaires pour la traçabilité des avertissements officiels administrés.</p>
            </div>
            <button 
              onClick={() => {
                setRecoveringLogs([
                  {
                    id: 'REC-001',
                    subscriberName: 'Mamadou Diallo',
                    subscriberId: 'SUB-8842',
                    invoiceId: 'FAC-2026-003',
                    delayMonths: 2,
                    unpaidAmount: 3500,
                    statusBefore: 'active',
                    statusAfter: 'active',
                    actionTaken: 'Notification renforcée',
                    type: 'email',
                    timestamp: '2026-05-18 10:45',
                    adminApproved: true
                  },
                  {
                    id: 'REC-002',
                    subscriberName: 'Ouedraogo Salif',
                    subscriberId: 'SUB-9944',
                    invoiceId: 'FAC-2026-008',
                    delayMonths: 3,
                    unpaidAmount: 6000,
                    statusBefore: 'active',
                    statusAfter: 'active',
                    actionTaken: 'Mise En Demeure',
                    type: 'sms',
                    timestamp: '2026-05-20 09:12',
                    adminApproved: false
                  }
                ]);
                alert("Logs d'audits réinitialisés aux valeurs d'usine.");
              }}
              className="p-1.5 bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer"
            >
              Réinitialiser l'historique
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-[11.5px]">
            {recoveringLogs.map((log) => (
              <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Log metadata */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {log.id}
                    </span>
                    <h5 className="font-extrabold text-slate-900">{log.subscriberName}</h5>
                    <span className="text-slate-400 font-bold">•</span>
                    <span className="text-[10px] text-slate-400 font-mono">Date : {log.timestamp}</span>
                  </div>

                  <p className="text-slate-500 text-[11px]">
                    Action : <strong className="text-slate-700">{log.actionTaken}</strong> ({log.delayMonths} mois de retard - {log.unpaidAmount.toLocaleString()} FCFA impayés). 
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-0.5">
                      {log.type === 'sms' ? <MessageSquare className="h-3 w-3 inline text-[#635BFF]" /> : <Mail className="h-3 w-3 inline text-emerald-500" />}
                      {log.type.toUpperCase()} envoyé
                    </span>
                    <span>•</span>
                    <span>Facture source : {log.invoiceId}</span>
                  </div>
                </div>

                {/* Admin validation triggers */}
                <div>
                  {log.adminApproved ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Approuvé & Applique</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded inline-flex items-center gap-0.5 shrink-0">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        <span>En validation Admin</span>
                      </span>
                      <button
                        onClick={() => handleApproveAction(log.id)}
                        className="p-1.5 px-3 bg-slate-900 text-white hover:bg-[#635BFF] rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer"
                      >
                        Valider l'Action
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
