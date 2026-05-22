/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent } from 'react';
import { 
  Coins, 
  Search, 
  Filter, 
  CheckCircle2, 
  Download, 
  Printer, 
  Wifi, 
  Webhook,
  Activity,
  Smartphone,
  Check,
  CreditCard,
  QrCode
} from 'lucide-react';
import { Invoice, Subscriber } from '../types';

interface PaymentsViewProps {
  invoices: Invoice[];
  subscribers: Subscriber[];
  onPayInvoice: (id: string, method: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces') => void;
}

export default function PaymentsView({
  invoices,
  subscribers,
  onPayInvoice
}: PaymentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [activePayment, setActivePayment] = useState<Invoice | null>(null);

  // Webhook webhook states
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [webhookStatusMessage, setWebhookStatusMessage] = useState('');
  const [selectedSimMethod, setSelectedSimMethod] = useState<'Wave' | 'Orange Money'>('Wave');
  const [subscriberToSimulate, setSubscriberToSimulate] = useState('');

  // Extract paid invoices
  const paidInvoices = useMemo(() => {
    return invoices.filter(i => i.status === 'paid');
  }, [invoices]);

  const filteredPayments = useMemo(() => {
    return paidInvoices.filter(p => {
      const matchesSearch = 
        p.subscriberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [paidInvoices, searchTerm, methodFilter]);

  // Total collected metric
  const totalCollectedSum = useMemo(() => {
    return paidInvoices.reduce((sum, current) => sum + current.amount, 0);
  }, [paidInvoices]);

  // Simulate carrier webhook transaction validation (Wave/Orange Money API integration simulator)
  const triggerSimulationWebhook = (e: FormEvent) => {
    e.preventDefault();
    if (!subscriberToSimulate) {
      setWebhookStatusMessage('⚠️ Veuillez choisir un abonné.');
      return;
    }

    const matchedSub = subscribers.find(s => s.id === subscriberToSimulate);
    if (!matchedSub) return;

    // Find a pending invoice of theirs
    const matchedPendingInvoice = invoices.find(i => i.subscriberId === subscriberToSimulate && i.status !== 'paid');
    
    if (!matchedPendingInvoice) {
      setWebhookStatusMessage(`⚠️ Aucun titre de recette "Non Payé" trouvé chez ${matchedSub.name}.`);
      return;
    }

    setIsSimulatingWebhook(true);
    setWebhookStatusMessage('');

    setTimeout(() => {
      onPayInvoice(matchedPendingInvoice.id, selectedSimMethod as any);
      setIsSimulatingWebhook(false);
      setWebhookStatusMessage(`✅ Webhook Validé ! Facture ${matchedPendingInvoice.id} réglée instantanément via API ${selectedSimMethod}.`);
      
      // Auto-set the active payment for immediate visual inspection
      setActivePayment({
        ...matchedPendingInvoice,
        status: 'paid',
        paymentMethod: selectedSimMethod as any,
        paidDate: '2026-05-22'
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Caisse & Trésorerie Mobile Money</h2>
          <p className="text-slate-500 text-sm mt-0.5">Livre journal des paiements, rapprochement bancaire et passerelle d'API de télé-encaissement</p>
        </div>
      </div>

      {/* Numerical logs grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-indigo-300 transition duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Recouvert</span>
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight">{totalCollectedSum.toLocaleString()} <span className="text-xs text-slate-500 font-bold">FCFA</span></h3>
            <p className="text-slate-400 text-xs font-semibold">Toutes méthodes confondues</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Coins className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transactions Wave</span>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {paidInvoices.filter(p=>p.paymentMethod==='Wave').reduce((sum, p)=>sum+p.amount, 0).toLocaleString()} <span className="text-xs text-slate-500">FCFA</span>
            </h3>
            <p className="text-slate-400 text-xs font-semibold">{paidInvoices.filter(p=>p.paymentMethod==='Wave').length} transactions validées</p>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl font-bold text-xs font-mono">
            WAVE
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Orange Money</span>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {paidInvoices.filter(p=>p.paymentMethod==='Orange Money').reduce((sum, p)=>sum+p.amount, 0).toLocaleString()} <span className="text-xs text-slate-500">FCFA</span>
            </h3>
            <p className="text-slate-400 text-xs font-semibold">{paidInvoices.filter(p=>p.paymentMethod==='Orange Money').length} paiements API</p>
          </div>
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl font-bold text-xs font-mono">
            OM
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Espèces / Guichet</span>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {paidInvoices.filter(p=>p.paymentMethod==='Espèces').reduce((sum, p)=>sum+p.amount, 0).toLocaleString()} <span className="text-xs text-slate-500">FCFA</span>
            </h3>
            <p className="text-slate-400 text-xs font-semibold">Bordereaux de quittance cash</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs font-mono">
            CASH
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API webhook Gateway tester */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs h-fit hover:border-indigo-200 transition duration-200">
          <div className="flex items-center gap-1.5 pb-2 border-b border-indigo-50">
            <Webhook className="h-5 w-5 text-indigo-600 animate-pulse" />
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">Simulateur Webhook API Carrier</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Permet de tester la réponse de l'API de paiement instantané d'AKPBF en simulant un protocole de notification push Wave / Orange Money.
          </p>

          <form onSubmit={triggerSimulationWebhook} className="mt-4 space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-bold text-slate-600">Sélectionner un Abonné Débiteur :</label>
              <select 
                value={subscriberToSimulate}
                onChange={(e) => setSubscriberToSimulate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 text-xs focus:outline-none"
              >
                <option value="">-- Choisir un client débiteur --</option>
                {subscribers.map((s) => {
                  const hasPending = invoices.some(i => i.subscriberId === s.id && i.status !== 'paid');
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id}) {hasPending ? "─ Facture En Cours" : "─ En Règle"}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600">Opérateur Émetteur :</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSimMethod('Wave')}
                  className={`p-2.5 rounded-lg border font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedSimMethod === 'Wave' 
                      ? 'bg-sky-50 border-sky-500 text-sky-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Wave SDK
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSimMethod('Orange Money')}
                  className={`p-2.5 rounded-lg border font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedSimMethod === 'Orange Money' 
                      ? 'bg-orange-50 border-orange-500 text-orange-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Orange Money
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSimulatingWebhook}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {isSimulatingWebhook ? (
                <>
                  <Wifi className="h-4 w-4 animate-spin text-indigo-400" />
                  Envoi de la signature webhook...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" />
                  Donner l'accord de paiement
                </>
              )}
            </button>

            {webhookStatusMessage && (
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] font-semibold text-slate-700 border border-slate-100 whitespace-pre-line animate-fade-in">
                {webhookStatusMessage}
              </div>
            )}
          </form>
        </div>

        {/* ledger list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-50/50">
              <div className="relative w-full sm:flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>

              <select 
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-white border border-slate-200 p-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                <option value="All">Toutes Méthodes</option>
                <option value="Wave">Wave</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Carte Bancaire">Carte Bancaire</option>
                <option value="Espèces">Espèces</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 font-bold uppercase text-[9px] tracking-widest text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="p-3">ID Recette</th>
                    <th className="p-3">Abonné</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Date Encaissement</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-slate-400 font-medium">
                        Aucun reçu d'encaissement trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/50 transition duration-150">
                        <td className="p-3 font-mono font-bold text-slate-800">{pay.id}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-755 text-sm">{pay.subscriberName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Période : {pay.period}</div>
                        </td>
                        <td className="p-3 font-extrabold text-emerald-600">{pay.amount.toLocaleString()} FCFA</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase inline-block ${
                            pay.paymentMethod === 'Wave' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            pay.paymentMethod === 'Orange Money' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                            'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}>
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500 font-semibold">{pay.paidDate || '22 Mai 2026'}</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => setActivePayment(pay)}
                            className="bg-indigo-600 hover:bg-vigo-700 text-white font-bold px-2.5 py-1 text-[11px] rounded transition active:scale-95 cursor-pointer"
                          >
                            Reçu
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / PDF Simulation invoice detail receipt */}
      {activePayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-4.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-extrabold text-[11px] uppercase tracking-wider">Acquittement de Paiement AKPBF</span>
              </div>
              <button onClick={() => setActivePayment(null)} className="text-emerald-100 hover:text-white transition cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-6 font-sans text-xs">
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Statut de Transaction</span>
                <div className="text-xl font-extrabold">PAYÉ & REGULARISÉ</div>
                <div className="text-xs font-mono font-bold mt-1 text-emerald-500">REF: {activePayment.id}</div>
              </div>

              {/* Receipt metadata */}
              <div className="space-y-3.5 border-y border-slate-100 py-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Abonné redevable :</span>
                  <span className="font-extrabold text-slate-800">{activePayment.subscriberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Période de taxation :</span>
                  <span className="font-bold text-slate-700">{activePayment.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Méthode d'encaissement :</span>
                  <span className="font-black text-indigo-700 uppercase">{activePayment.paymentMethod || 'Wave'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-50 pt-2.5">
                  <span className="text-slate-400 font-bold text-sm">Montant Acquitté :</span>
                  <span className="font-black text-base text-emerald-600">{activePayment.amount.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* Fake QR barcode */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <QrCode className="h-10 w-10 text-slate-800 shrink-0" />
                <p className="text-[10px] text-slate-400 leading-normal">
                  Ce reçu numérique fait foi de quittance de redevance pour les archives de salubrité de l'année 2026.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button 
                  onClick={() => alert('Impression du reçu en cours (Simulation)...')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-lg transition text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Imprimer (PDF)
                </button>
                <button 
                  onClick={() => setActivePayment(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition text-center cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
