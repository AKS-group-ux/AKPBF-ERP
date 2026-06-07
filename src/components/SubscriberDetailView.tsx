/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  CreditCard, 
  FileText, 
  Trash2, 
  Clock, 
  Activity, 
  MessageSquare,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileCheck,
  Send,
  Printer,
  Share2,
  FileDown
} from 'lucide-react';
import { Subscriber, SubscriptionPlan, Invoice, PaymentReceipt, Contract, NotificationLog, SubscriptionHistoryLog, Emplacement } from '../types';
import { jsPDF } from 'jspdf';

interface SubscriberDetailViewProps {
  subscriberId: string;
  onClose: () => void;
  subscribers: Subscriber[];
  plans: SubscriptionPlan[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  contracts: Contract[];
  notifLogs: NotificationLog[];
  auditLogs: SubscriptionHistoryLog[];
  emplacements: Emplacement[];
  userRole?: string;
  sessionUser?: any;
  onUpdateSubscriber?: (sub: Subscriber) => void;
  onProcessBulkPayment?: (
    subscriberId: string,
    invoiceIds: string[],
    method: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces',
    agentName: string
  ) => void;
  onAddInvoices?: (newInvs: Invoice[]) => void;
  onRemoveInvoices?: (invIds: string[]) => void;
}

export default function SubscriberDetailView({
  subscriberId,
  onClose,
  subscribers,
  plans,
  invoices,
  receipts,
  contracts,
  notifLogs,
  auditLogs,
  emplacements,
  userRole,
  sessionUser,
  onUpdateSubscriber,
  onProcessBulkPayment,
  onAddInvoices,
  onRemoveInvoices
}: SubscriberDetailViewProps) {
  // Find subscriber profile
  const sub = useMemo(() => {
    return subscribers.find(s => s.id === subscriberId);
  }, [subscribers, subscriberId]);

  if (!sub) {
    return (
      <div id="sub-detail-notfound" className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Abonné introuvable</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">L'identifiant d'abonné unique "{subscriberId}" n'existe pas ou a été supprimé.</p>
        <button 
          onClick={onClose} 
          className="mt-4 inline-flex items-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste des abonnés
        </button>
      </div>
    );
  }

  // Matching active plan
  const plan = useMemo(() => {
    return plans.find(p => p.id === sub.planId) || plans[0];
  }, [plans, sub]);

  // Matching contract
  const contract = useMemo(() => {
    return contracts.find(c => c.subscriberId === sub.id);
  }, [contracts, sub]);

  // Client invoices
  const clientInvoices = useMemo(() => {
    return invoices.filter(i => i.subscriberId === sub.id);
  }, [invoices, sub]);

  // Invoice calculations
  const invoicesSummary = useMemo(() => {
    const paid = clientInvoices.filter(i => i.status === 'paid');
    const unpaid = clientInvoices.filter(i => i.status === 'pending');
    const overdue = clientInvoices.filter(i => i.status === 'overdue');

    const totalPaid = receipts
      .filter(r => r.subscriberId === sub.id)
      .reduce((sum, r) => sum + r.amountPaid, 0);

    const remainingBalance = clientInvoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      paid,
      unpaid,
      overdue,
      totalPaid,
      remainingBalance
    };
  }, [clientInvoices, receipts, sub]);

  // Client Payments log
  const clientReceipts = useMemo(() => {
    return receipts.filter(r => r.subscriberId === sub.id);
  }, [receipts, sub]);

  // Local interactive complaints lists state (representing "Réclamations, Signalements, Demandes de Service")
  const [complaints, setComplaints] = useState<any[]>([]);

  const [newComplaintType, setNewComplaintType] = useState('Réclamation');
  const [newComplaintCat, setNewComplaintCat] = useState('Collecte omise');
  const [newComplaintDesc, setNewComplaintDesc] = useState('');
  const [newComplaintPriority, setNewComplaintPriority] = useState('Moyenne');
  const [isAddComplaintOpen, setIsAddComplaintOpen] = useState(false);

  // For administrative reply
  const [selectedComplaintForReply, setSelectedComplaintForReply] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Handle adding complaint
  const handleAddComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintDesc.trim()) return;

    const newComp = {
      id: `RC-2026-${Math.floor(100 + Math.random() * 900)}`,
      type: newComplaintType,
      category: newComplaintCat,
      desc: newComplaintDesc,
      date: new Date().toISOString().split('T')[0],
      status: 'En attente',
      priority: newComplaintPriority,
      response: ''
    };

    setComplaints([newComp, ...complaints]);
    setNewComplaintDesc('');
    setIsAddComplaintOpen(false);

    // Dynamic audit entry
    const auditLog: SubscriptionHistoryLog = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriberId: sub.id,
      subscriberName: sub.name,
      action: 'modification',
      description: `Ouverture d'un dossier de réclamation (${newComplaintType} - ${newComplaintCat})`,
      timestamp: new Date().toISOString(),
      operator: 'Portail Client / Agent'
    };
    auditLogs.unshift(auditLog);
  };

  const handleReplyComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedComplaintForReply) return;

    setComplaints(prev => prev.map(c => {
      if (c.id === selectedComplaintForReply.id) {
        return {
          ...c,
          status: 'Résolu',
          response: adminReplyText
        };
      }
      return c;
    }));

    // Trigger local audit entry
    const auditLog: SubscriptionHistoryLog = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriberId: sub.id,
      subscriberName: sub.name,
      action: 'modification',
      description: `Réponse officielle apportée à la réclamation ${selectedComplaintForReply.id}`,
      timestamp: new Date().toISOString(),
      operator: 'Administrateur AKPBF'
    };
    auditLogs.unshift(auditLog);

    setAdminReplyText('');
    setSelectedComplaintForReply(null);
  };

  // Chronological Client Activities Audit Log Filtered for this customer
  const clientActivities = useMemo(() => {
    const clientSpecific = auditLogs.filter(log => log.subscriberId === sub.id);
    
    // Supplement with static entries for realistic tracking if empty
    if (clientSpecific.length === 0) {
      return [
        { id: 'AUD-3001', action: 'creation', description: 'Création initiale du compte citoyen de Ouagadougou.', timestamp: sub.startDate || '2026-05-10T08:00:00Z', operator: 'Alkaïda Benjamin (Admin)' },
        { id: 'AUD-3002', action: 'renewal', description: 'Vérification réglementaire de solvabilité effectuée.', timestamp: sub.startDate || '2026-05-10T11:00:00Z', operator: 'Système Automatique' },
        ...(sub.status === 'active' ? [{ id: 'AUD-3003', action: 'state_change', description: 'Activation réglementaire de l\'abonnement de voirie.', timestamp: sub.startDate || '2026-05-10T12:00:00Z', operator: 'Gérard Gnakoury (Logistique)' }] : [])
      ];
    }
    return clientSpecific.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, sub]);

  // Invoice Filters & Pagination states
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [invFilterStatus, setInvFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [invPage, setInvPage] = useState(1);
  const invPerPage = 4;

  // Selected periods for mass checkout
  const [selectedMonthsForPay, setSelectedMonthsForPay] = useState<string[]>([]);
  const [bulkPayMethod, setBulkPayMethod] = useState<'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces'>('Orange Money');
  const [lastBulkReceipt, setLastBulkReceipt] = useState<any | null>(null);

  // States for manual test invoice generation
  const [testMonth, setTestMonth] = useState('Janvier');
  const [testStatus, setTestStatus] = useState<'overdue' | 'pending'>('overdue');
  const [testError, setTestError] = useState('');

  // Map 12 months for visual tracking
  const monthsData = useMemo(() => {
    const list = [
      { name: 'Janvier', index: 1 },
      { name: 'Février', index: 2 },
      { name: 'Mars', index: 3 },
      { name: 'Avril', index: 4 },
      { name: 'Mai', index: 5 },
      { name: 'Juin', index: 6 },
      { name: 'Juillet', index: 7 },
      { name: 'Août', index: 8 },
      { name: 'Septembre', index: 9 },
      { name: 'Octobre', index: 10 },
      { name: 'Novembre', index: 11 },
      { name: 'Décembre', index: 12 }
    ];

    return list.map(m => {
      const periodStr = `${m.name} 2026`;
      const matchedInv = clientInvoices.find(inv => inv.period === periodStr);

      let status: 'paid' | 'pending' | 'overdue' | 'upcoming' = 'upcoming';
      let invoiceId = m.name; // fallback identification key
      let paymentDate = '';
      let prRef = '';
      let collectorAgent = '';

      if (matchedInv) {
        invoiceId = matchedInv.id;
        if (matchedInv.status === 'paid') {
          status = 'paid';
          const matchedRc = receipts.find(rc => rc.invoiceId && rc.invoiceId.includes(matchedInv.id));
          paymentDate = matchedInv.paidDate || matchedRc?.paymentDate || '03 Juin 2026';
          prRef = matchedRc?.id || `REC-${Math.floor(1000 + Math.random() * 9000)}`;
          collectorAgent = matchedRc?.paymentMethod === 'Espèces' ? 'Mamadou Soro (Recouvreur)' : 'En Ligne Mairie';
        } else if (matchedInv.status === 'overdue') {
          status = 'overdue';
        } else {
          status = 'pending';
        }
      } else {
        status = 'upcoming';
      }

      return {
        ...m,
        status,
        invoiceId,
        paymentDate,
        amount: plan.price,
        prRef,
        collectorAgent
      };
    });
  }, [clientInvoices, receipts, plan]);

  // Bulk Payment Helpers
  const handleSelectAllUntilToday = () => {
    const toSelect = monthsData
      .filter(m => m.status === 'overdue' || m.status === 'pending')
      .filter(m => m.index <= 6)
      .map(m => m.invoiceId);
    setSelectedMonthsForPay(toSelect);
  };

  const handleSelectAllYear = () => {
    const toSelect = monthsData
      .filter(m => m.status === 'overdue' || m.status === 'pending')
      .map(m => m.invoiceId);
    setSelectedMonthsForPay(toSelect);
  };

  const handleToggleMonthSelection = (id: string) => {
    if (selectedMonthsForPay.includes(id)) {
      setSelectedMonthsForPay(prev => prev.filter(x => x !== id));
    } else {
      setSelectedMonthsForPay(prev => [...prev, id]);
    }
  };

  const handleBulkCheckoutSubmit = () => {
    if (selectedMonthsForPay.length === 0) return;

    // Filter out mock IDs and link existing real IDs or generate
    const finalInvs = selectedMonthsForPay.map(item => {
      // If mock, generate real lookup tag string
      if (item.length <= 15 && !item.startsWith('INV-')) {
        return `INV-REG-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      return item;
    });

    const collectorCtx = sessionUser?.name || 'Yao Konan (Recouvreur AKPBF)';
    if (onProcessBulkPayment) {
      onProcessBulkPayment(sub.id, finalInvs, bulkPayMethod, collectorCtx);
    }

    const receiptObj = {
      id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      amountPaid: selectedMonthsForPay.length * plan.price,
      paymentDate: '2026-06-03',
      paymentMethod: bulkPayMethod,
      paymentRef: `TXN-MUN-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setLastBulkReceipt({
      receipt: receiptObj,
      months: monthsData.filter(m => selectedMonthsForPay.includes(m.invoiceId)).map(m => m.name)
    });

    setSelectedMonthsForPay([]);
  };

  // Download PDF Receipt using jsPDF
  const handleDownloadPdfReceipt = (receipt: PaymentReceipt, citizen: Subscriber, paidMonths: string[]) => {
    try {
      const doc = new jsPDF() as any;
      
      // Slate background banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("DISTRICT AUTONOME D'ABIDJAN", 15, 18);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("SERVICES COMMUNAUX DE L'ASSAINISSEMENT & DE LA VOIRIE", 15, 26);
      doc.text("AKPBF S.A. - COMPTABILITÉ DES REÇUS FISCAUX", 15, 32);

      // Title
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`REÇU UNIQUE D'ENCAISSEMENT : ${receipt.id}`, 15, 55);

      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, 60, 195, 60);

      // Citoyen Information
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("CITOYEN CONTRIBUABLE :", 15, 70);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`Nom Complet : ${citizen.name}`, 15, 78);
      doc.text(`ID Client Forfait : ${citizen.id}`, 15, 84);
      doc.setFont("helvetica", "normal");
      doc.text(`Téléphone : ${citizen.phone}`, 15, 90);
      doc.text(`Zone / Quartier : ${citizen.neighborhood} - Ouagadougou`, 15, 96);
      doc.text(`Adresse Géographique : ${citizen.address}`, 15, 102);

      // Separator
      doc.line(15, 108, 195, 108);

      // Transaction parameters
      doc.setTextColor(100, 116, 139);
      doc.text("DÉTAILS DES PÉRIODES SOLDÉES :", 15, 118);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(paidMonths.join(', '), 15, 126);

      doc.setFont("helvetica", "normal");
      doc.text("Moyen d'Encaissé :", 15, 136);
      doc.setFont("helvetica", "bold");
      doc.text(receipt.paymentMethod, 75, 136);

      doc.setFont("helvetica", "normal");
      doc.text("Identifiant Opération :", 15, 142);
      doc.setFont("helvetica", "bold");
      doc.text(receipt.paymentRef, 75, 142);

      doc.setFont("helvetica", "normal");
      doc.text("Date Heure d'Émission :", 15, 148);
      doc.setFont("helvetica", "bold");
      doc.text(receipt.paymentDate, 75, 148);

      doc.setFont("helvetica", "normal");
      doc.text("Tarif de Base Formule :", 15, 154);
      doc.setFont("helvetica", "bold");
      doc.text(`${(plan.price).toLocaleString()} FCFA / mois`, 75, 154);

      // High Visibility highlight amount box
      doc.setFillColor(240, 253, 250); // soft emerald
      doc.rect(15, 162, 180, 22, 'F');
      doc.setTextColor(5, 150, 105);
      doc.setFontSize(15);
      doc.text(`MONTANT RECOUVRÉ : ${receipt.amountPaid.toLocaleString()} FCFA`, 20, 176);

      // Sceau footer
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Ce titre certifie la consignation légitime des contributions de voirie de Ouagadougou.", 15, 202);
      doc.text("Validé et signé numériquement par AKPBF S.A.", 15, 207);

      doc.setFillColor(248, 250, 252);
      doc.rect(130, 218, 65, 35, 'F');
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("LE REGISSEUR DE CAPITATION", 133, 224);
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.2);
      doc.line(133, 226, 190, 226);
      doc.text("Sceau Digital Mairie de Ouagadougou", 135, 245);

      doc.save(`Recu_AKP_${receipt.id}.pdf`);
    } catch (e) {
      console.error("jsPDF builder execution failed", e);
    }
  };

  // WhatsApp Quick dispatch trigger with real api
  const handleSendWhatsAppReceipt = (receipt: PaymentReceipt, citizen: Subscriber, paidMonths: string[]) => {
    const message = `Bonjour *${citizen.name}*,

Mairie de Ouagadougou - Reçu de Voirie AKPBF :
Votre paiement de *${receipt.amountPaid.toLocaleString()} FCFA* pour la redevance municipale de *${paidMonths.length} mois* (${paidMonths.join(', ')}) a été encaissé avec succès via *${receipt.paymentMethod}*.

*Récapitulatif :*
- Référence Reçu : ${receipt.id}
- Référence Transaction : ${receipt.paymentRef}
- Date d'encaissement : ${receipt.paymentDate}
- Agent de Recouvrement : ${sessionUser?.name || 'Service de Voirie Municipale'}

Votre service d'assainissement municipal reste pleinement actif. Merci pour votre civisme !
_Sceau digital municipal de Ouagadougou_`;

    const encoded = encodeURIComponent(message);
    const rawPh = citizen.phone.replace(/[\s\-\+]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${rawPh}&text=${encoded}`;
    window.open(url, '_blank');
  };

  const filteredInvoices = useMemo(() => {
    return clientInvoices.filter(inv => {
      const matchesSearch = inv.id.toLowerCase().includes(invSearchQuery.toLowerCase()) || 
                            inv.period.toLowerCase().includes(invSearchQuery.toLowerCase());
      const matchesStatus = invFilterStatus === 'all' || 
                            (invFilterStatus === 'paid' && inv.status === 'paid') ||
                            (invFilterStatus === 'pending' && inv.status === 'pending') ||
                            (invFilterStatus === 'overdue' && inv.status === 'overdue');
      return matchesSearch && matchesStatus;
    });
  }, [clientInvoices, invSearchQuery, invFilterStatus]);

  // Paged invoices
  const pagedInvoices = useMemo(() => {
    const startIdx = (invPage - 1) * invPerPage;
    return filteredInvoices.slice(startIdx, startIdx + invPerPage);
  }, [filteredInvoices, invPage]);

  const totalInvPages = Math.ceil(filteredInvoices.length / invPerPage) || 1;

  // Simulate Photo
  const citizenAvatar = useMemo(() => {
    const names = sub.name.split(' ');
    const initials = names.map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div className="w-16 h-16 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
        {initials}
      </div>
    );
  }, [sub.name]);

  return (
    <div id={`subs-details-panel-${sub.id}`} className="space-y-6">
      {/* Back Header Nav bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="group inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-bold transition duration-200 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>← Retour à la liste des abonnés</span>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">ID DOSSIER: {sub.id}</span>
          <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg border ${
            sub.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
            sub.status === 'suspended' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
            sub.status === 'pending_validation' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' :
            'bg-rose-50 text-rose-700 border-rose-200/50'
          }`}>
            {sub.status === 'active' ? 'Compte Actif' : sub.status === 'suspended' ? 'Suspendu' : sub.status === 'pending_validation' ? 'Validation Requise' : sub.status}
          </span>
        </div>
      </div>

      {/* Grid structure bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CLIENT DATA & PLAN DETAILS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* CARD 1: INFORMATIONS CLIENT */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <span>INFORMATIONS CITOYEN</span>
            </h3>

            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              {citizenAvatar}
              <div>
                <h4 className="text-base font-black text-slate-900 leading-tight">{sub.name}</h4>
                <p className="text-[11px] font-mono font-medium text-slate-400 mt-1">Numéro Client : {sub.id}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Inscrit le {sub.startDate || "10 Mai 2026"}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Téléphone</span>
                <span className="text-slate-800 font-extrabold col-span-2 flex items-center gap-1.5 justify-end">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {sub.phone}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Email</span>
                <span className="text-slate-800 font-extrabold col-span-2 flex items-center gap-1.5 justify-end truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {sub.email}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Adresse</span>
                <span className="text-slate-800 font-extrabold col-span-2 text-right">
                  {sub.address}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-t border-slate-100/70 pt-3">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Quartier</span>
                <span className="text-slate-800 font-extrabold col-span-2 text-right">{sub.neighborhood}</span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Secteur</span>
                <span className="text-zinc-600 font-extrabold col-span-2 text-right">Ouagadougou Nord-Est</span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Zone</span>
                <span className="text-indigo-600 font-black col-span-2 text-right font-mono text-[11px] bg-indigo-50/70 px-2 py-0.5 rounded-md inline-block ml-auto">
                  ZONE-{sub.neighborhood.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 py-1 border-t border-slate-100/70 pt-3">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Type Bac</span>
                <span className="text-slate-800 font-bold col-span-2 text-right">{sub.binType}</span>
              </div>
              <div className="grid grid-cols-3 py-1">
                <span className="text-slate-400 font-bold col-span-1 uppercase text-[10px]">Niveau Bac</span>
                <span className="text-slate-800 font-mono font-bold col-span-2 text-right flex items-center justify-end gap-1">
                  <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden inline-block mr-1">
                    <div 
                      className={`h-full rounded-full ${sub.currentBinLevel >= 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                      style={{ width: `${sub.currentBinLevel}%` }}
                    />
                  </div>
                  {sub.currentBinLevel}%
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: INFORMATIONS ABONNEMENT */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-slate-500" />
              <span>DÉTAILS ABONNEMENT</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Formule d'Assainissement</span>
                  <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">{plan.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Tarif Mensuel</span>
                  <span className="text-xs font-black text-indigo-600 font-mono block">{plan.price.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center py-1">
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Début Engagement</span>
                  <span className="font-mono text-[11.5px] font-extrabold text-slate-700">{sub.startDate || "2026-05-10"}</span>
                </div>
                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Fin Engagement</span>
                  <span className="font-mono text-[11.5px] font-extrabold text-slate-700">{sub.endDate || "2027-05-10"}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Fréquence</span>
                  <span className="text-slate-800 font-extrabold">{plan.collectionFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Paiements</span>
                  <span className="text-slate-800 font-extrabold">{plan.frequency}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Contrat Réf</span>
                  <span className="text-zinc-600 font-mono font-bold text-xs">
                    {contract?.contractNumber || `CNT-2026-${sub.id.split('-')[1] || '0129'}`}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Signature du contrat</span>
                  <span className="text-emerald-600 flex items-center gap-1 text-[9px] font-black uppercase">
                    <CheckCircle className="h-3 w-3 shrink-0" />
                    Signé en ligne
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  Validé et scellé via l’adresse IP de Ouagadougou sous l'empreinte cryptographique blockchain locale AKP-STAMP.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER & RIGHT COLUMNS: BILLING, PAYMENTS, CLAIMS & AUDIT LOGS */}
        <div className="lg:col-span-2 space-y-6">

          {/* FINANCIAL DASH METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/40 rounded-3xl border border-emerald-100 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Total Collecté/Payé</span>
                <span className="text-xl font-black text-emerald-800 tracking-tight font-mono block mt-1">
                  {invoicesSummary.totalPaid.toLocaleString()} FCFA
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold mt-2 hover:underline cursor-pointer block">Voir reçus de voirie →</span>
            </div>

            <div className="bg-rose-50/40 rounded-3xl border border-rose-100 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Solde Exigible Restant</span>
                <span className="text-xl font-black text-rose-800 tracking-tight font-mono block mt-1">
                  {invoicesSummary.remainingBalance.toLocaleString()} FCFA
                </span>
              </div>
              <span className="text-[10px] text-rose-600 font-bold mt-2 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                {invoicesSummary.overdue.length} Factures en retard
              </span>
            </div>

            <div className="bg-indigo-50/40 rounded-3xl border border-indigo-100 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">Collectes Effectuées</span>
                <span className="text-xl font-black text-indigo-950 tracking-tight font-mono block mt-1">
                  {sub.collectionsRealized ?? 12} passages
                </span>
              </div>
              <span className="text-[10px] text-indigo-700 font-bold mt-2">Dernière validée: {sub.lastCollectionDate}</span>
            </div>
          </div>

          {/* ANNUAL PAYMENT TRACKING SYSTEM - CLIENT TIMELINE HUD */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
            
            {/* Header section with total unpaid visual badges */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-900/40">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Suivi des Paiements Annuels — Exercice 2026</h3>
                  <p className="text-[10px] text-slate-400">Visualisation, encaissement de masse, et impression légale des reçus de voirie municipaux.</p>
                </div>
              </div>

              {/* Outstanding Arrears Metrics Counter */}
              <div className="flex items-center gap-2">
                <div className="bg-rose-955/60 border border-rose-900/60 rounded-xl px-3 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-rose-450 block tracking-wider">Mois en Retard</span>
                  <span className="text-sm font-black text-rose-200 font-mono">
                    {monthsData.filter(m => m.status === 'overdue').length} mois
                  </span>
                </div>
                <div className="bg-amber-955/60 border border-amber-900/60 rounded-xl px-3 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-amber-450 block tracking-wider">Redevance Due</span>
                  <span className="text-sm font-black text-amber-200 font-mono">
                    {(monthsData.filter(m => m.status === 'overdue' || m.status === 'pending').length * plan.price).toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action buttons for fast mass selections */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllUntilToday}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Payer tous les arriérés</span>
              </button>
              <button
                type="button"
                onClick={handleSelectAllYear}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Régler toute l'année 2026</span>
              </button>
              {selectedMonthsForPay.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMonthsForPay([])}
                  className="bg-transparent hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl font-bold cursor-pointer transition"
                >
                  Désélectionner tout
                </button>
              )}
            </div>

            {/* Console de Simulation & Tests */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/85 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2.5">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                    Console de Simulation & Tests
                  </h4>
                  <p className="text-[10px] text-slate-400">Générez manuellement des impayés et des dettes sur l'abonné pour tester instantanément.</p>
                </div>
                
                {/* Clean up button for this subscriber */}
                <button
                  type="button"
                  onClick={() => {
                    if (onRemoveInvoices) {
                      const subInvs = invoices.filter(i => i.subscriberId === sub.id).map(i => i.id);
                      if (subInvs.length > 0) {
                        onRemoveInvoices(subInvs);
                      }
                      setTestError('');
                    }
                  }}
                  className="self-start sm:self-center text-[9.5px] font-bold text-rose-450 hover:text-rose-450 bg-rose-955/40 hover:bg-rose-900/40 px-2.5 py-1 rounded-md border border-rose-900/50 transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Vider les factures de l'abonné</span>
                </button>
              </div>

              {testError && (
                <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 text-[10px] p-2 rounded-lg flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-450 shrink-0" />
                  <span>{testError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <span className="text-[9px] font-bold uppercase text-slate-500 font-sans tracking-wider">Mois d'Arriéré</span>
                  <select
                    value={testMonth}
                    onChange={(e) => {
                      setTestMonth(e.target.value);
                      setTestError('');
                    }}
                    className="bg-slate-900 border border-slate-800 text-slate-250 p-2 rounded-xl text-xs cursor-pointer focus:outline-none focus:border-indigo-500"
                  >
                    {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(m => (
                      <option key={m} value={m}>{m} 2026</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 min-w-[130px]">
                  <span className="text-[9px] font-bold uppercase text-slate-500 font-sans tracking-wider">Statut de la Dette</span>
                  <select
                    value={testStatus}
                    onChange={(e) => {
                      setTestStatus(e.target.value as any);
                      setTestError('');
                    }}
                    className="bg-slate-900 border border-slate-800 text-slate-250 p-2 rounded-xl text-xs cursor-pointer focus:outline-none focus:border-indigo-500"
                  >
                    <option value="overdue">✕ En Retard (Impayé)</option>
                    <option value="pending">🕒 En Attente (À échoir)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase text-slate-500 font-sans tracking-wider">Montant</span>
                  <div className="bg-slate-900 border border-slate-800 text-emerald-400 p-2 rounded-xl text-xs font-mono font-black">
                    {(plan ? plan.price : 2500).toLocaleString()} FCFA
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const periodStr = `${testMonth} 2026`;
                    // Check if invoice already exists
                    const exists = invoices.some(i => i.subscriberId === sub.id && i.period === periodStr);
                    if (exists) {
                      setTestError(`Une facture existe déjà pour la période ${periodStr}.`);
                      return;
                    }

                    const newInv = {
                      id: `FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                      subscriberId: sub.id,
                      subscriberName: sub.name,
                      amount: plan ? plan.price : 2500,
                      dueDate: '2026-06-10',
                      issueDate: '2026-05-22',
                      status: testStatus,
                      period: periodStr
                    };

                    if (onAddInvoices) {
                      onAddInvoices([newInv]);
                      setTestError('');
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs tracking-wide transition active:scale-95 cursor-pointer flex items-center gap-1.5 sm:mt-auto sm:ml-auto"
                >
                  <CheckCircle className="h-4.5 w-4.5" />
                  <span>Générer Facture de Test</span>
                </button>
              </div>
            </div>

            {/* The 12-Month Calendar Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {monthsData.map((m, idx) => {
                const isSelected = selectedMonthsForPay.includes(m.invoiceId);
                const isClickable = m.status === 'overdue' || m.status === 'pending';

                // Core styling defined in Design System (Light Mode & Dark Mode separate variables)
                const cardBaseStyle = "relative rounded-2xl border p-3.5 flex flex-col justify-between h-[115px] select-none shadow-xs card-interactive transition-all duration-200";
                let cardThemeStyle = "";
                
                if (m.status === 'paid') {
                  cardThemeStyle = "bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs";
                } else if (m.status === 'overdue') {
                  cardThemeStyle = isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30 dark:ring-indigo-400/20 text-slate-900 dark:text-slate-100 font-bold"
                    : "bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-red-400 cursor-pointer";
                } else if (m.status === 'pending') {
                  cardThemeStyle = isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30 dark:ring-indigo-400/20 text-slate-900 dark:text-slate-100 font-bold"
                    : "bg-white dark:bg-slate-900/60 dark:backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400 cursor-pointer";
                } else {
                  cardThemeStyle = "bg-slate-50/30 dark:bg-slate-950/40 border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-600 opacity-60";
                }

                return (
                  <div
                    key={idx}
                    onClick={() => isClickable && handleToggleMonthSelection(m.invoiceId)}
                    className={`${cardBaseStyle} ${cardThemeStyle}`}
                  >
                    {/* Header Monthly details */}
                    <div className="flex justify-between items-start">
                      <div className={`text-xs font-black uppercase tracking-wider ${
                        isSelected 
                          ? 'text-indigo-650 dark:text-indigo-400 font-black'
                          : 'text-blue-600 dark:text-blue-400 font-bold'
                      }`}>
                        {m.name}
                      </div>

                      {isClickable && (
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span className="text-indigo-500 dark:text-indigo-400 text-xs font-bold animate-pulse" title="Sélectionné">
                              ✓
                            </span>
                          )}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Badge Status Display using global variables */}
                    <div className="mt-2">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 w-fit ${
                        m.status === 'paid'
                          ? 'state-success'
                          : m.status === 'overdue'
                          ? 'state-error'
                          : m.status === 'pending'
                          ? 'state-warning'
                          : 'state-info'
                      }`}>
                        {m.status === 'paid'
                          ? '✓ Payé'
                          : m.status === 'overdue'
                          ? '✕ Retard'
                          : m.status === 'pending'
                          ? '🕒 En attente'
                          : '⌛ À venir'}
                      </span>
                    </div>

                    {/* Metadata summary tooltip for audit trail */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50 text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {m.status === 'paid' ? (
                        <span title={`Réf: ${m.prRef} par ${m.collectorAgent}`}>
                          N° {m.prRef.split('-')[1] || m.prRef} • {m.paymentDate}
                        </span>
                      ) : (
                        <span>{m.amount.toLocaleString()} FCFA</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mass Payment Cart checkout interface */}
            {selectedMonthsForPay.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-center gap-4 animate-fadeIn relative z-10">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="h-10 w-10 bg-emerald-950 text-emerald-400 border border-emerald-900/60 rounded-xl flex items-center justify-center font-mono font-black text-sm">
                    {selectedMonthsForPay.length}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wide">Panier de Recouvrement</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      Enregistrement groupé de de {selectedMonthsForPay.length} mois de redevances ordinaires.
                    </p>
                  </div>
                </div>

                {/* Computational HUD */}
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto justify-end">
                  
                  {/* Select Payment channels available in Burkina Faso */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 w-full md:w-auto">
                    <span className="text-[9px] font-black uppercase text-slate-400 shrink-0">Mode encaissement :</span>
                    <select
                      value={bulkPayMethod}
                      onChange={(e) => setBulkPayMethod(e.target.value as any)}
                      className="bg-transparent text-xs font-extrabold text-slate-200 outline-none cursor-pointer py-1"
                    >
                      <option value="Orange Money" className="bg-slate-900">Orange Money</option>
                      <option value="Wave" className="bg-slate-900">Moov Money</option>
                      <option value="Carte Bancaire" className="bg-slate-900">Carte Visa</option>
                      <option value="Espèces" className="bg-slate-900">Espèces (Régie Terrain)</option>
                    </select>
                  </div>

                  {/* Pricing HUD and validation click */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Montant consolidé</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {(selectedMonthsForPay.length * plan.price).toLocaleString()} FCFA
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleBulkCheckoutSubmit}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-xl cursor-pointer shadow-lg shadow-emerald-950 transition w-full md:w-auto uppercase tracking-wider text-center"
                    >
                      Encaisser le règlement
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Receipt Popup Drawer Hub representing instant printed invoice */}
            {lastBulkReceipt && (
              <div className="bg-emerald-950/20 border border-emerald-910/60 rounded-2xl p-4 space-y-3.5 animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-350 uppercase tracking-wide">Paiements de Voirie validés avec succès !</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Titre de recettes AKP unique: {lastBulkReceipt.receipt.id} • Périodes liquidées: {lastBulkReceipt.months.join(', ')}.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastBulkReceipt(null)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-350 cursor-pointer"
                  >
                    [Fermer l'alerte]
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDownloadPdfReceipt(lastBulkReceipt.receipt, sub, lastBulkReceipt.months)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>Télécharger Reçu Municipal PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppReceipt(lastBulkReceipt.receipt, sub, lastBulkReceipt.months)}
                    className="bg-slate-800 hover:bg-slate-755 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Notifier par WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* CARD 3: FACTURATION (With research, fitlers, pagination) */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span>LIVRE DES FACTURES DE VOIRIE</span>
              </h3>
              
              {/* STATUS INDICATORS AS QUICK STATS */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total :</span>
                <span className="text-[10.5px] font-black font-mono text-zinc-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  {clientInvoices.length} factures
                </span>
              </div>
            </div>

            {/* SEARCH AND FILTERS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search bar */}
              <div className="md:col-span-6 relative">
                <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-450" />
                <input
                  type="text"
                  placeholder="Recherche par ID ou Période (ex: Mai 2026)..."
                  value={invSearchQuery}
                  onChange={(e) => {
                    setInvSearchQuery(e.target.value);
                    setInvPage(1);
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition duration-150"
                />
              </div>

              {/* Status filtering dropdown */}
              <div className="md:col-span-6 flex gap-2">
                <div className="relative flex-1">
                  <Filter className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-450" />
                  <select
                    value={invFilterStatus}
                    onChange={(e) => {
                      setInvFilterStatus(e.target.value as any);
                      setInvPage(1);
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none cursor-pointer focus:border-indigo-500 transition duration-150"
                  >
                    <option value="all">Tous les statuts de paiement</option>
                    <option value="paid">Payées uniquement</option>
                    <option value="pending">En attente (Non payées)</option>
                    <option value="overdue">En retard de règlement</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Invoices table data */}
            <div className="overflow-x-auto rounded-2xl border border-slate-150">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-150">
                    <th className="p-3">Numéro</th>
                    <th className="p-3">Période</th>
                    <th className="p-3">Date d'émission</th>
                    <th className="p-3">Dû avant</th>
                    <th className="p-3 text-right">Montant</th>
                    <th className="p-3 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-bold italic">
                        Aucune facture ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    pagedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-650">{inv.id}</td>
                        <td className="p-3 font-extrabold text-slate-805">{inv.period}</td>
                        <td className="p-3 text-slate-500">{inv.issueDate}</td>
                        <td className="p-3 text-slate-500">{inv.dueDate}</td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-900">{inv.amount.toLocaleString()} FCFA</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            inv.status === 'overdue' ? 'bg-rose-50 text-rose-700 animate-pulse' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {inv.status === 'paid' ? 'Payée' : inv.status === 'overdue' ? 'En Retard' : 'Non Payée'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalInvPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400">
                  Page <strong className="text-slate-700">{invPage}</strong> sur <strong className="text-slate-700">{totalInvPages}</strong>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={invPage === 1}
                    onClick={() => setInvPage(prev => Math.max(prev - 1, 1))}
                    className="p-1 px-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer flex items-center"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold">Préc.</span>
                  </button>
                  <button
                    disabled={invPage === totalInvPages}
                    onClick={() => setInvPage(prev => Math.min(prev + 1, totalInvPages))}
                    className="p-1 px-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer flex items-center"
                  >
                    <span className="text-[10px] font-bold">Suiv.</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: PAIEMENTS ENCAISSÉS */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-slate-500" />
              <span>HISTORIQUE COMPLET DE PAIEMENTS & REÇUS ENCAISSÉS</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-150">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-150">
                    <th className="p-3">Numéro Reçu</th>
                    <th className="p-3">Date d'encaissement</th>
                    <th className="p-3">Moyen</th>
                    <th className="p-3">Réf transaction</th>
                    <th className="p-3 text-right">Montant réglé</th>
                    <th className="p-3 text-right">Opérateur / Caissier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-405 font-bold italic">
                        Aucun paiement n’a encore été encaissé pour cet abonné citoyen.
                      </td>
                    </tr>
                  ) : (
                    clientReceipts.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono font-extrabold text-indigo-705">{rec.id}</td>
                        <td className="p-3 font-semibold text-slate-700">{rec.paymentDate}</td>
                        <td className="p-3 text-slate-600">{rec.paymentMethod}</td>
                        <td className="p-3 font-mono text-[10.5px] text-slate-400">{rec.paymentRef}</td>
                        <td className="p-3 text-right font-mono font-black text-emerald-600">{rec.amountPaid.toLocaleString()} FCFA</td>
                        <td className="p-3 text-right font-extrabold text-slate-800">Alkaïda B. (Admin)</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 5: RÉCLAMATIONS ET DEMANDES (Interactive) */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <span>RÉCLAMATIONS, SIGNALEMENTS ET DEMANDES</span>
              </h3>
              
              <button
                type="button"
                onClick={() => setIsAddComplaintOpen(!isAddComplaintOpen)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-705 text-[10.5px] font-black px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <span>+ Déclarer un incident</span>
              </button>
            </div>

            {/* Dynamic mini form to log a ticket */}
            {isAddComplaintOpen && (
              <form onSubmit={handleAddComplaintSubmit} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type de demande</label>
                    <select
                      value={newComplaintType}
                      onChange={(e) => {
                        setNewComplaintType(e.target.value);
                        if (e.target.value === 'Réclamation') setNewComplaintCat('Collecte omise');
                        else if (e.target.value === 'Signalement') setNewComplaintCat('Bac cassé');
                        else setNewComplaintCat('Délocalisation bac');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="Réclamation">Réclamation d'exploitation</option>
                      <option value="Signalement">Signalement technique</option>
                      <option value="Demande de service">Demande administrative</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Catégorie</label>
                    <select
                      value={newComplaintCat}
                      onChange={(e) => setNewComplaintCat(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    >
                      {newComplaintType === 'Réclamation' ? (
                        <>
                          <option value="Collecte omise">Collecte municipale omise</option>
                          <option value="Comportement agent">Comportement d'équipe terrain</option>
                          <option value="Facturation abusive">Divergence tarifaire</option>
                        </>
                      ) : newComplaintType === 'Signalement' ? (
                        <>
                          <option value="Bac cassé">Rupture / Bac endommagé</option>
                          <option value="Débordement">Débordement publique</option>
                          <option value="Absence puce RFID">Capteur SIG hors service</option>
                        </>
                      ) : (
                        <>
                          <option value="Délocalisation bac">Déplacement de l'emplacement d'assainissement</option>
                          <option value="Ajustement planning">Fréquence de passage</option>
                          <option value="Attestation voirie">Édition attestation spéciale</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Priorité d'intervention</label>
                    <select
                      value={newComplaintPriority}
                      onChange={(e) => setNewComplaintPriority(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="Basse">Basse (Délai 72h)</option>
                      <option value="Moyenne">Moyenne (Délai 24h)</option>
                      <option value="Haute">Haute d'Urgence (Délai 12h)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description détaillée des faits</label>
                  <textarea
                    rows={2}
                    value={newComplaintDesc}
                    onChange={(e) => setNewComplaintDesc(e.target.value)}
                    placeholder="Veuillez expliciter précisément l'incident (ex: les camions ne sont pas passés devant mon de maison depuis mardi...)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsAddComplaintOpen(false)}
                    className="bg-slate-250 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl transition cursor-pointer font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition cursor-pointer font-bold"
                  >
                    Transmettre à la Mairie
                  </button>
                </div>
              </form>
            )}

            {/* Administrative response modal popup */}
            {selectedComplaintForReply && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in duration-200 text-xs">
                  <div className="bg-slate-950 p-4 text-white flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[9px] text-indigo-400 font-bold">{selectedComplaintForReply.id}</span>
                      <h4 className="font-bold text-sm text-white mt-0.5">Apporter une résolution administrative</h4>
                    </div>
                    <button onClick={() => setSelectedComplaintForReply(null)} className="text-slate-400 hover:text-white transition">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleReplyComplaintSubmit} className="p-5 space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Signalement / Réclamation initial</span>
                      <p className="font-extrabold text-slate-800">{selectedComplaintForReply.category} - Nom: {sub.name}</p>
                      <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">"{selectedComplaintForReply.desc}"</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-extrabold uppercase text-slate-450 block">Réponse d'exploitation donnée</label>
                      <textarea
                        rows={3}
                        required
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Exprimez précisément la résolution apportée (ex: Bac remplacé ce matin, camion dépêché en tournée d'urgence)..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedComplaintForReply(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition cursor-pointer font-bold"
                      >
                        Fermer
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition cursor-pointer font-bold"
                      >
                        Valider la résolution
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List of complaints */}
            <div className="space-y-3">
              {complaints.length === 0 ? (
                <div className="p-6 text-center text-slate-400 italic font-semibold">
                  Aucun dossier de réclamation enregistré.
                </div>
              ) : (
                complaints.map((c) => (
                  <div key={c.id} className="bg-slate-50/70 p-4 border border-slate-150 rounded-2xl space-y-3 hover:translate-y-[-1px] transition-transform duration-150">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-indigo-500 font-extrabold">{c.id}</span>
                          <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded-md tracking-wider ${
                            c.type === 'Réclamation' ? 'bg-amber-50 text-amber-700 border border-amber-200/30' :
                            c.type === 'Signalement' ? 'bg-indigo-50 text-indigo-705 border border-indigo-200/30' :
                            'bg-teal-50 text-teal-700 border border-teal-200/30'
                          }`}>
                            {c.type}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800">{c.category}</h4>
                        <p className="text-[11px] text-slate-500 italic">"{c.desc}"</p>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <span className="text-[10px] text-slate-400 block font-medium">Déclaré le {c.date}</span>
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`w-1.5 h-1.5 rounded-full ${c.priority === 'Haute' ? 'bg-rose-500' : c.priority === 'Moyenne' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                          <span className="text-[9px] uppercase font-bold text-slate-400">Priorité {c.priority}</span>
                        </div>
                      </div>
                    </div>

                    {c.response ? (
                      <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100 flex items-start gap-1.5 mt-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] font-black uppercase text-emerald-600 block">RÉSOLU - RÉPONSE DONNÉE</span>
                          <p className="text-[10.5px] font-extrabold text-slate-700 leading-relaxed mt-0.5">{c.response}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-100/60 p-3 rounded-xl border border-slate-200/50 flex justify-between items-center mt-2.5">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-400">
                          <Clock className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                          <span>Dossier en traitement logistique sous 24h</span>
                        </div>
                        {userRole === 'ADMINISTRATEUR' || userRole === 'COMPTABLE' || !userRole ? (
                          <button
                            type="button"
                            onClick={() => setSelectedComplaintForReply(c)}
                            className="bg-white hover:bg-slate-50 text-indigo-705 border border-slate-200 text-[10px] font-black px-2.5 py-1 rounded-lg transition"
                          >
                            Répondre & Clôturer
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CARD 6: ACTIVITÉS CLIENT DE VOIRIE (Audit Trail) */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-500" />
              <span>ACTIVITÉS ET GESTION EXÉCUTIVE DU DOSSIER (TRAÇABILITÉ)</span>
            </h3>

            <div className="relative border-l border-slate-200 pl-4 space-y-5 py-2">
              {clientActivities.map((log, index) => (
                <div key={log.id || index} className="relative group text-xs text-slate-700">
                  {/* Bullet indicator */}
                  <div className="absolute -left-[20.5px] top-1 w-3 h-3 rounded-full bg-slate-950 dark:bg-zinc-700 border-2 border-white dark:border-slate-800" />
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{log.id || `AUD-00${index}`}</span>
                      <span className="text-slate-450 font-medium font-mono text-[10.5px]">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Récemment'}</span>
                    </div>
                    <p className="font-bold text-slate-850">{log.description}</p>
                    <p className="text-[10px] text-slate-400 font-semibold shrink-0">
                      Signé et validé par : <strong className="text-slate-500">{log.operator || "Système Automatique"}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
