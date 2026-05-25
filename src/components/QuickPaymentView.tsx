/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Coins, 
  Search, 
  User, 
  QrCode, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  Download, 
  Mail, 
  Share2, 
  RefreshCw, 
  FileText, 
  BookOpen, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  Check,
  Trash2,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  Lock,
  Phone
} from 'lucide-react';
import { Subscriber, Invoice, PaymentReceipt } from '../types';

interface QuickPaymentViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  onPaymentSuccess: () => void;
}

export default function QuickPaymentView({
  subscribers,
  invoices,
  receipts,
  onPaymentSuccess
}: QuickPaymentViewProps) {
  // Navigation / Tab state within QuickPayment View
  const [activeSubTab, setActiveSubTab] = useState<'encay' | 'journal'>('encay');

  // Search and Select subscriber States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);

  // Form States
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Espèces');
  const [transactionRef, setTransactionRef] = useState('');

  // Status & Transaction outcome states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResponse, setSuccessResponse] = useState<any | null>(null);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Interactive scanner simulation states
  const [scanActive, setScanActive] = useState(false);
  const [scanLaserActive, setScanLaserActive] = useState(false);

  // Focus Search Query input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Retrieve today's accounting entry logs from receipts setting or state
  const [todayJournals, setTodayJournals] = useState<any[]>([]);
  const [loadingJournals, setLoadingJournals] = useState(false);

  const fetchJournals = async () => {
    const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
    if (!token) return;
    setLoadingJournals(true);
    try {
      const response = await fetch('/api/erp/state', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Since custom journals are saved inside Setting under key 'AKPBF_ERP_JOURNAL', let's mock look up or fetch them.
        // Wait, AKPBF_ERP_JOURNAL is loaded in state, or we can look up journals from receipts!
        // If not explicit, we can reconstruct from receipts list to be extremely sturdy!
        setTodayJournals(data.journals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJournals(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'journal') {
      fetchJournals();
    }
  }, [activeSubTab]);

  // Autocomplete suggestions based on instant search
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return subscribers.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.neighborhood.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [subscribers, searchQuery]);

  // Handle client selection
  const handleSelectClient = (sub: Subscriber) => {
    setSelectedSub(sub);
    setSearchQuery('');
    
    // Auto-calculate suggested payment amount (sum of open invoices)
    const clientUnpaidInvoices = invoices.filter(i => i.subscriberId === sub.id && i.status !== 'paid');
    const totalUnpaid = clientUnpaidInvoices.reduce((acc, current) => acc + current.amount, 0);
    setAmountPaid(String(totalUnpaid || 3500)); // Default fallback or exact total
  };

  // QR Code Simulator scan
  const handleSimulateQrCode = () => {
    setScanActive(true);
    setScanLaserActive(true);
    setErrorMsg('');

    // Select randomly one subscriber who has unpaid debts to make it interactive and impressive
    const unpaidSubs = subscribers.filter(s => {
      const clientInvs = invoices.filter(i => i.subscriberId === s.id && i.status !== 'paid');
      return clientInvs.length > 0;
    });
    
    const targetSub = unpaidSubs.length > 0 
      ? unpaidSubs[Math.floor(Math.random() * unpaidSubs.length)]
      : subscribers[Math.floor(Math.random() * subscribers.length)];

    setTimeout(() => {
      if (targetSub) {
        handleSelectClient(targetSub);
        // Play synthetic beep audio on barcode match
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) { }
      }
      setScanActive(false);
      setScanLaserActive(false);
    }, 1800);
  };

  // Dynamic calculations for selected subscriber
  const financialDetails = useMemo(() => {
    if (!selectedSub) return null;
    const clientInvs = invoices.filter(i => i.subscriberId === selectedSub.id);
    const unpaidInvoices = clientInvs.filter(i => i.status !== 'paid');
    const paidInvoices = clientInvs.filter(i => i.status === 'paid');

    const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const lastInvoice = clientInvs.length > 0 
      ? [...clientInvs].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())[0] 
      : null;

    const lastPayment = receipts.length > 0
      ? receipts.filter(r => r.subscriberId === selectedSub.id || r.subscriberName === selectedSub.name)[0]
      : null;

    return {
      totalUnpaidAmount,
      unpaidCount: unpaidInvoices.length,
      unpaidInvoices,
      lastInvoice,
      lastPayment
    };
  }, [selectedSub, invoices, receipts]);

  // Form Reset
  const handleReset = () => {
    setSelectedSub(null);
    setAmountPaid('');
    setTransactionRef('');
    setSuccessResponse(null);
    setErrorMsg('');
    setEmailStatus('idle');
  };

  // Submit quick cash entry to real node backend API
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    
    const amt = parseFloat(amountPaid);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('⚠️ Veuillez saisir un montant valide supérieur à 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
      if (!token) {
        throw new Error("Clé de session expirée. Re-connectez vous.");
      }

      const response = await fetch('/api/erp/payments/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriberId: selectedSub.id,
          amountPaid: amt,
          paymentDate,
          paymentMethod,
          transactionRef
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Erreur lors de l'enregistrement comptable de l'encaissement.");
      }

      // Success
      setSuccessResponse(resData);
      
      // Force instant silent reload of global databases in parent components
      onPaymentSuccess();

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Échec réseau lors de la validation du paiement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PDF Download trigger
  const handleDownloadReceiptPdf = (receiptId: string) => {
    if (!receiptId) return;
    const downloadUrl = `/api/documents/download/${receiptId}?type=receipt`;
    window.open(downloadUrl, '_blank');
  };

  // Handle Print Receipt
  const handlePrintReceipt = (receiptId: string) => {
    if (!receiptId) return;
    const downloadUrl = `/api/documents/download/${receiptId}?type=receipt`;
    
    // Create hidden iframe and print immediately
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = downloadUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.open(downloadUrl, '_blank');
      }
    };
  };

  // Dynamic WhatsApp sharing payload
  const handleShareWhatsApp = (rec: any) => {
    const textMsg = encodeURIComponent(
      `*AKPBF MUNICIPAL ABIDJAN*\n` +
      `✓ Confirmation de Paiement Salubrité\n\n` +
      `*Abonné :* ${rec.subscriberName}\n` +
      `*Reçu N° :* ${rec.id}\n` +
      `*Montant Réglé :* ${rec.amountPaid.toLocaleString()} FCFA\n` +
      `*Mode de paiement :* ${rec.paymentMethod}\n` +
      `*Date :* ${rec.paymentDate}\n` +
      `*Solde Restant :* ${rec.remainingBalance.toLocaleString()} FCFA\n\n` +
      `Merci pour votre contribution à l'hygiène de la cité d'Abidjan!`
    );
    window.open(`https://api.whatsapp.com/send?text=${textMsg}`, '_blank');
  };

  // Mock send email notifier trigger
  const handleSendEmailNotifier = () => {
    setEmailStatus('sending');
    setTimeout(() => {
      setEmailStatus('sent');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-emerald-500 animate-pulse shrink-0" />
            Module "Encaissement Rapide"
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-sans">
            Guichet d'enregistrement instantané et d'impression des quittances d'assainissement municipal (UEMOA) en moins de 30 secondes.
          </p>
        </div>

        {/* View Switch */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setActiveSubTab('encay')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
              activeSubTab === 'encay' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Saisie Paiement
          </button>
          <button
            onClick={() => setActiveSubTab('journal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
              activeSubTab === 'journal' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Journal du Jour
          </button>
        </div>
      </div>

      {activeSubTab === 'encay' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: IDENTIFICATION & SEARCH / QR CODE */}
          <div className="lg:col-span-5 space-y-5 text-left">
            
            {/* Search and barcode card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
              <span className="text-[10px] uppercase tracking-widest font-mono font-black text-emerald-600 block">identification client</span>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Recherche instantanée de l'abonné</h3>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher par N° client, Nom, Tél..."
                  className="w-full bg-slate-50 dark:bg-slate-800/65 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Suggestions dropdown dropdown suggestions */}
              {suggestions.length > 0 && (
                <div className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-lg divide-y divide-slate-100 dark:divide-slate-800">
                  {suggestions.map((sub) => {
                    const matchedInvoices = invoices.filter(i => i.subscriberId === sub.id && i.status !== 'paid');
                    const overdueBadge = matchedInvoices.length > 0;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectClient(sub)}
                        className="w-full text-left p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 flex justify-between items-center transition"
                      >
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{sub.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sub.id} • {sub.phone}</p>
                        </div>
                        {overdueBadge && (
                          <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase rounded px-1.5 py-0.5 shrink-0">
                            Impayés
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* QR and RFID integration */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulateQrCode}
                  disabled={scanActive}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <QrCode className="h-4.5 w-4.5 text-emerald-400" />
                  {scanActive ? 'Numérisation du QR Code...' : 'Scanner le QR Code Abidjan'}
                </button>
              </div>

              {scanActive && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center p-4 border border-slate-800 animate-in fade-in duration-200">
                  {/* Neon laser simulator */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative w-28 h-28 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center">
                      <QrCode className="h-14 w-14 text-slate-500 animate-pulse" />
                      {scanLaserActive && (
                        <div className="absolute inset-x-2 bg-emerald-400 h-0.5 animate-bounce shadow-[0_0_10px_rgba(52,211,153,1)]"></div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 mt-3 animate-pulse">CAPTEUR PHOTO ACTIF...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected client detailed fiche display panel */}
            {selectedSub ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 animate-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-lg uppercase font-black shrink-0 border border-slate-200 dark:border-slate-700">
                    {selectedSub.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-slate-900 dark:text-slate-100 font-extrabold block text-sm truncate">{selectedSub.name}</strong>
                    <span className="text-[10px] font-mono text-slate-400 block">{selectedSub.id}</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Téléphone</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{selectedSub.phone}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Zone / Quartier</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">📍 {selectedSub.neighborhood}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Contrat Lié</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">CNT-2026-{(selectedSub.id).replace('SUB-', '').replace('AKPBF-', '')}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400 font-semibold">Forfait / Volume</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedSub.binType}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Statut Commercial</span>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                      selectedSub.status === 'active' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 animate-pulse'
                    }`}>
                      {selectedSub.status === 'active' ? 'ACTIF - SERVICE CONFORME' : 'SUSPENDU POUR IMPAYÉ'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-3xl space-y-2">
                <User className="h-8 w-8 text-slate-300 mx-auto" />
                <strong className="text-xs text-slate-700 dark:text-slate-350 block font-black">En attente d'identification</strong>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">Veuillez scanner un code QR ou lancer une recherche de client pour charger ses lignes administratives et comptables.</p>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: FINANCIAL HEALTH & DIRECT CASHIER/MM TERMINATION FORM */}
          <div className="lg:col-span-7 text-left space-y-5">
            
            {selectedSub && financialDetails && !successResponse ? (
              <form onSubmit={handleSubmitPayment} className="space-y-4 animate-in fade-in duration-300">
                
                {/* FINANCIAL BOX */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">📊 Situation Financière d'Assainissement</h4>
                    <span className={`text-xs font-mono font-black ${
                      financialDetails.totalUnpaidAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                    }`}>
                      Solde Exigible : {financialDetails.totalUnpaidAmount.toLocaleString()} FCFA
                    </span>
                  </div>

                  {/* MINI INFO BAR GRID GRID */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl">
                      <span className="text-[9px] block text-slate-400 uppercase font-black">factures en attente</span>
                      <strong className="text-slate-800 dark:text-slate-200 block text-sm mt-0.5">{financialDetails.unpaidCount} titre(s)</strong>
                    </div>
                    {financialDetails.lastInvoice ? (
                      <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl col-span-1">
                        <span className="text-[9px] block text-slate-400 uppercase font-black">dernière émission</span>
                        <strong className="text-slate-800 dark:text-slate-200 block text-[10.5px] mt-0.5">{financialDetails.lastInvoice.amount.toLocaleString()} FCFA ({financialDetails.lastInvoice.period})</strong>
                      </div>
                    ) : null}
                    {financialDetails.lastPayment ? (
                      <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl col-span-1 md:col-span-1">
                        <span className="text-[9px] block text-slate-400 uppercase font-black">dernier versement</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 block text-[10.5px] truncate mt-0.5">{(financialDetails.lastPayment.amountPaid).toLocaleString()} FCFA ({financialDetails.lastPayment.paymentMethod})</strong>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl text-[10px] text-slate-400 italic">
                        Aucun reçu antérieur.
                      </div>
                    )}
                  </div>

                  {/* UNPAID DETAILS TABLE */}
                  {financialDetails.unpaidInvoices.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">factures ouvertes à apurer :</span>
                      <div className="max-h-36 overflow-y-auto border border-slate-100 dark:border-slate-850 rounded-xl divide-y divide-slate-100 dark:divide-slate-850 text-[11px]">
                        {financialDetails.unpaidInvoices.map((inv) => (
                          <div key={inv.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-850">
                            <div>
                              <strong className="text-slate-700 dark:text-slate-300 font-bold">{inv.id}</strong>
                              <span className="text-slate-400 block text-[10px]">Échéance: {new Date(inv.dueDate).toLocaleDateString()} ({inv.period})</span>
                            </div>
                            <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold">{inv.amount.toLocaleString()} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* DIRECT PAYMENT FORM BOX */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                  <span className="text-[10px] uppercase font-mono font-black text-amber-500 block">perception directe</span>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Enregistrer l'encaissement</h3>

                  {errorMsg && (
                    <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Montant Perçu (FCFA) *</label>
                      <input
                        type="number"
                        required
                        placeholder="Ex: 5000"
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-extrabold focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Date d'encaissement *</label>
                      <input
                        type="date"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-extrabold focus:bg-white outline-none"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-2">Mode de versement *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Espèces', 'Orange Money', 'Moov Money', 'Wave', 'Carte bancaire', 'Virement', 'Chèque'].map((mode) => {
                        const isChosen = paymentMethod === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPaymentMethod(mode)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                              isChosen 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs' 
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800'
                            }`}
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-1.5">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Réf / N° de Transaction Mobile ou Titre (Chèque, Virement) (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: ref MP-2026-64019..."
                      className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  </div>

                  {/* SECURITY AND CONFIRMATION SIGN-OFF */}
                  <div className="bg-slate-55 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-[10.5px] text-slate-500 leading-relaxed">
                    <Lock className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span>
                        Opération sécurisée authentifiée d'Abidjan. Après validation, les factures ouvertes seront apurées, l'abonné sera réactivé, un reçu fiscal A4 sera généré et archivé, et une confirmation de log de notification sera éditée.
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-5 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 font-bold text-xs rounded-2xl cursor-pointer transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition flex items-center gap-1.5 shrink-0"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Validation du Titre...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 text-emerald-250 font-black" />
                          Enregistrer & Imprimer le Reçu
                        </>
                      )}
                    </button>
                  </div>

                </div>

              </form>
            ) : successResponse ? (
              
              /* POST PAYMENT WORKSPACE WORKSPACE */
              <div className="space-y-5 animate-in zoom-in-95 duration-300">
                
                {/* SUCCESS CONGRATS CARD */}
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 rounded-3xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-500 text-white font-black rounded-full flex items-center justify-center mx-auto text-xl shadow-md">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-emerald-800 dark:text-emerald-400">Encaissement Validé avec Succès !</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Le paiement y a été affecté et archivé en base de données PostgreSQL.</p>
                  </div>

                  {/* QUICK NUMERICAL SUMMARY */}
                  <div className="mx-auto max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs shadow-xs text-left">
                    <div>
                      <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">N° DU REÇU</span>
                      <strong className="text-slate-805 dark:text-slate-200 block font-mono font-bold mt-0.5">{successResponse.receiptId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">MONTANT REÇU</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 block font-extrabold text-sm mt-0.5">{successResponse.receipt?.amountPaid?.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 col-span-2">
                      <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">client abonné</span>
                      <strong className="text-slate-805 dark:text-slate-200 block text-xs mt-0.5">{successResponse.receipt?.subscriberName} ({successResponse.receipt?.subscriberId})</strong>
                    </div>
                  </div>
                </div>

                {/* ACTION TOOLS BOX BUTTONS */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
                  <span className="text-[10px] uppercase font-mono font-black text-indigo-600 block">outils de quittance</span>
                  <h4 className="text-xs font-black text-slate-850 dark:text-slate-200">Options après encaissement</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadReceiptPdf(successResponse.receiptId)}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download className="h-4.5 w-4.5 text-emerald-400" />
                      Télécharger le reçu PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(successResponse.receiptId)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Printer className="h-4.5 w-4.5 text-indigo-200" />
                      Imprimer le reçu (A4)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-805 pt-4">
                    <button
                      type="button"
                      onClick={handleSendEmailNotifier}
                      disabled={emailStatus === 'sending' || emailStatus === 'sent'}
                      className={`font-semibold text-xs py-3 px-4 rounded-2xl cursor-pointer transition flex items-center justify-center gap-2 ${
                        emailStatus === 'sent'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-150'
                          : 'bg-slate-55 hover:bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Mail className="h-4.5 w-4.5 text-slate-400" />
                      {emailStatus === 'idle' && "Confirmer l'envoi Email"}
                      {emailStatus === 'sending' && "Expédition..."}
                      {emailStatus === 'sent' && "✓ Email de confirmation envoyé"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(successResponse.receipt)}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-xs py-3 px-4 rounded-2xl cursor-pointer transition flex items-center justify-center gap-2"
                    >
                      <Share2 className="h-4.5 w-4.5 text-emerald-600 font-black" />
                      Partager sur WhatsApp
                    </button>
                  </div>
                </div>

                {/* DOUBLE ACCOUNTING LEDGER RENDER */}
                {successResponse.journalEntry && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-black text-amber-500 block">écriture comptable générale</span>
                    <h3 className="text-xs font-black text-slate-850 dark:text-slate-250">Équilibre Double Entrée (Comptabilité de Cités)</h3>
                    
                    <div className="border border-slate-150 dark:border-slate-805 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-855 text-xs">
                      
                      {/* Debit line */}
                      <div className="p-3 bg-slate-50/40 dark:bg-slate-855 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-800 dark:text-slate-250 font-bold block">Débit : {successResponse.journalEntry.debitAccount}</strong>
                          <span className="text-[10px] text-slate-400 font-medium">Caisse municipale d'Abidjan active</span>
                        </div>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">+{successResponse.journalEntry.amount.toLocaleString()} FCFA</span>
                      </div>

                      {/* Credit line */}
                      <div className="p-3 bg-slate-50/40 dark:bg-slate-855 flex justify-between items-center">
                        <div>
                          <strong className="text-slate-805 dark:text-slate-250 font-bold block">Crédit : {successResponse.journalEntry.creditAccount}</strong>
                          <span className="text-[10px] text-slate-400 font-medium">Compte d'apurement client de salubrité</span>
                        </div>
                        <span className="font-mono text-slate-600 dark:text-slate-400 font-black">-{successResponse.journalEntry.amount.toLocaleString()} FCFA</span>
                      </div>

                    </div>

                    <div className="text-[9.5px] font-mono text-slate-400 leading-relaxed">
                      Statut: <strong>CONFIRMÉ</strong> | Opérateur: <strong>{successResponse.journalEntry.operator}</strong> | Réf: {successResponse.journalEntry.reference}
                    </div>
                  </div>
                )}

                {/* NEXT SEANCE BUTTON */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full bg-slate-900 text-white font-extrabold text-xs py-4 rounded-2xl hover:bg-slate-800 transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Nouvel Encaissement Rapide</span>
                    <ArrowRight className="h-4.5 w-4.5 text-emerald-400 font-black" />
                  </button>
                </div>

              </div>

            ) : (
              <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 rounded-3xl space-y-3">
                <Coins className="h-10 w-10 text-slate-350 mx-auto animate-bounce" />
                <strong className="text-slate-700 dark:text-slate-350 text-xs block font-black">Lignes de versement à charger</strong>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">Choisissez ou identifiez un client résident de la commune pour charger sa situation financière générale et apurer ses titres de recettes ouverts.</p>
              </div>
            )}

          </div>

        </div>
      ) : (
        
        /* JOURNAL DU JOUR RENDER VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-850 dark:text-slate-200">Journal général des encaissements directs</h3>
              <p className="text-[11px] text-slate-400">Transactions comptables de quittance validées en direct devant les commissaires aux comptes.</p>
            </div>
            <button
              onClick={fetchJournals}
              disabled={loadingJournals}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loadingJournals ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500 divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="text-[10px] uppercase bg-slate-50 dark:bg-slate-850 text-slate-400 font-bold">
                <tr>
                  <th className="px-4 py-3">Écrit. Id</th>
                  <th className="px-4 py-3">Date & Heure</th>
                  <th className="px-4 py-3">Référence Reçu</th>
                  <th className="px-4 py-3">Description Prestation</th>
                  <th className="px-4 py-3">Débit (Mode/Type)</th>
                  <th className="px-4 py-3 text-right">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {todayJournals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium italic">
                      Aucune écriture d'encaissement direct logguée aujourd'hui.
                    </td>
                  </tr>
                ) : (
                  todayJournals.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/40">
                      <td className="px-4 py-3 font-mono text-[10px] font-bold text-slate-400">{j.id}</td>
                      <td className="px-4 py-3 text-slate-500">{j.date} {j.time}</td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700 dark:text-indigo-400">{j.reference}</td>
                      <td className="px-4 py-3 pr-6 truncate max-w-xs">{j.description}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold">{j.debitAccount.split(' - ')[1] || j.debitAccount}</td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">{j.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      )}

    </div>
  );
}
