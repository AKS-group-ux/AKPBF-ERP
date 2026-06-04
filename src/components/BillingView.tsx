/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  DollarSign, 
  FileText, 
  Send, 
  Check, 
  X, 
  Search, 
  Filter, 
  Download, 
  Coins, 
  Smartphone, 
  Printer, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Invoice, Subscriber, SubscriptionPlan, NotificationLog } from '../types';
import { documentService } from '../services/documentService';

interface BillingViewProps {
  invoices: Invoice[];
  subscribers: Subscriber[];
  plans: SubscriptionPlan[];
  onGenerateMonthlyInvoices: (period: string) => void;
  onPayInvoice: (invoiceId: string, method: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces') => void;
  onSendMockReminders: () => void;
}

export default function BillingView({
  invoices,
  subscribers,
  plans,
  onGenerateMonthlyInvoices,
  onPayInvoice,
  onSendMockReminders
}: BillingViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedInvoiceForBilling, setSelectedInvoiceForBilling] = useState<Invoice | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces'>('Orange Money');
  
  // State for Invoice document replica viewer
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // States for notifications success feedback
  const [billingNotification, setBillingNotification] = useState('');
  const [reminderNotification, setReminderNotification] = useState('');

  // Total finances
  const stats = useMemo(() => {
    let paidAmt = 0;
    let pendingAmt = 0;
    let overdueAmt = 0;

    invoices.forEach(i => {
      if (i.status === 'paid') paidAmt += i.amount;
      else if (i.status === 'pending') pendingAmt += i.amount;
      else if (i.status === 'overdue') overdueAmt += i.amount;
    });

    return { paidAmt, pendingAmt, overdueAmt };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.subscriberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.subscriberId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Monthly invoice generation trigger
  const handleGenerateInvoices = () => {
    onGenerateMonthlyInvoices('Mai 2026');
    setBillingNotification('Cycle de facturation Mai 2026 complété avec succès ── Toutes les factures ont été créées !');
    setTimeout(() => setBillingNotification(''), 5000);
  };

  // Reminder trigger
  const handleSendReminders = () => {
    onSendMockReminders();
    setReminderNotification('Relance SMS & Email acheminée à tous les abonnés en retard de paiement (Simulée) !');
    setTimeout(() => setReminderNotification(''), 5000);
  };

  // Payment trigger
  const handlePayInvoice = () => {
    if (!selectedInvoiceForBilling) return;
    onPayInvoice(selectedInvoiceForBilling.id, paymentGateway);
    setSelectedInvoiceForBilling(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-850 tracking-tight">Facturation & Recouvrements</h2>
          <p className="text-slate-500 text-sm mt-0.5">Émission de redevance, télépaiements Mobile Money et apurement des créances</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            type="button"
            onClick={handleGenerateInvoices}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-emerald-50 active:scale-95"
          >
            <Coins className="h-4 w-4" />
            Lancer Facturation Mensuelle
          </button>
          
          <button 
            type="button"
            onClick={handleSendReminders}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-indigo-50 active:scale-95"
          >
            <Send className="h-4 w-4" />
            Relancer les Impayés
          </button>
        </div>
      </div>

      {/* Success Toasts */}
      {billingNotification && (
        <div className="bg-emerald-50 border border-emerald-255 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in-50 slide-in-from-top-4 duration-200">
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{billingNotification}</span>
        </div>
      )}

      {reminderNotification && (
        <div className="bg-indigo-50 border border-indigo-255 text-indigo-850 p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-sm animate-in fade-in-50 slide-in-from-top-4 duration-200">
          <Check className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
          <span className="font-semibold">{reminderNotification}</span>
        </div>
      )}

      {/* Financial Status Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-emerald-300 transition duration-250">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Recettes encaissées</span>
            <div className="text-2xl font-black text-slate-950 mt-1.5">{stats.paidAmt.toLocaleString()} FCFA</div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">✓ Entrées caisse effectives</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Check className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-amber-300 transition duration-250">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Facturation en attente</span>
            <div className="text-2xl font-black text-slate-950 mt-1.5">{stats.pendingAmt.toLocaleString()} FCFA</div>
            <span className="text-[10px] text-amber-600 font-bold block mt-1.5">⌛ Échéance de dépôt</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between hover:shadow-md hover:border-rose-300 transition duration-250">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Créances en Arriéré</span>
            <div className="text-2xl font-black text-rose-600 mt-1.5">{stats.overdueAmt.toLocaleString()} FCFA</div>
            <span className="text-[10px] text-rose-550 font-bold block mt-1.5">⚠ Contentieux / Relances en cours</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Cashier Payment Simulation Area */}
      {selectedInvoiceForBilling && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 animate-in slide-in-from-top-6 duration-200 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-400" />
              <h4 className="font-bold text-sm text-slate-100">Caisse d'Encaissement Mobile Money & Guichet (Simulateur)</h4>
            </div>
            <button type="button" onClick={() => setSelectedInvoiceForBilling(null)} className="text-slate-400 hover:text-white transition cursor-pointer">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="bg-slate-850 p-4 rounded-xl text-xs border border-slate-800">
              <div className="text-slate-400 uppercase tracking-widest font-bold">Facture Selectionnée</div>
              <div className="font-bold text-indigo-300 mt-1.5 text-sm">{selectedInvoiceForBilling.id}</div>
              <div className="text-sm font-semibold mt-0.5 text-slate-200">{selectedInvoiceForBilling.subscriberName}</div>
            </div>

            <div className="bg-slate-850 p-4 rounded-xl text-xs border border-slate-800">
              <div className="text-slate-400 uppercase tracking-widest font-bold">Montant exigible</div>
              <div className="font-black text-rose-405 text-xl mt-1 text-rose-300">{selectedInvoiceForBilling.amount.toLocaleString()} FCFA</div>
              <div className="text-slate-400 font-semibold mt-0.5">Période: {selectedInvoiceForBilling.period}</div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Passerelle de Paiement</label>
              <div className="flex gap-2">
                <select 
                  value={paymentGateway}
                  onChange={(e) => setPaymentGateway(e.target.value as any)}
                  className="bg-slate-850 border border-slate-800 text-white text-xs p-3 rounded-xl flex-1 cursor-pointer focus:outline-none focus:border-indigo-500"
                >
                  <option value="Orange Money">Orange Money</option>
                  <option value="Wave">Wave FCFA</option>
                  <option value="Carte Bancaire">Carte Bancaire Visa</option>
                  <option value="Espèces">Espèces (Municipal Guichet)</option>
                </select>
                <button 
                  type="button"
                  onClick={handlePayInvoice}
                  className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm shadow-emerald-500/10"
                >
                  <Check className="h-4 w-4" />
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main invoices tabular registry */}
      <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-xs hover:shadow-md transition duration-200">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 text-sm">Registre Général des Titres de Recettes / Factures</h3>
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="N° facture, Nom abonne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {/* Filter */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="All">Tous les statuts</option>
              <option value="paid">Payées</option>
              <option value="pending">En attente</option>
              <option value="overdue">Impayées (Arriéré)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto text-xs text-slate-600 text-left">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100 font-bold text-slate-400 uppercase text-[9px] tracking-wider">
              <tr>
                <th className="p-4">N° Facture</th>
                <th className="p-4">Identifiant / Débiteur</th>
                <th className="p-4">Période Comptable</th>
                <th className="p-4 text-emerald-800">Montant Redevance</th>
                <th className="p-4">Échéance de Dépôt</th>
                <th className="p-4">Mode & Statut</th>
                <th className="p-4 text-center">Actions de Caisse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400 font-medium">
                    Aucun enregistrement trouvé.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 font-mono font-bold text-slate-800 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      {inv.id}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 text-sm">{inv.subscriberName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ID: {inv.subscriberId}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-750">{inv.period}</td>
                    <td className="p-4 font-black text-slate-800 text-sm">{inv.amount.toLocaleString()} FCFA</td>
                    <td className="p-4 text-slate-500">{inv.dueDate}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-wider self-start ${
                          inv.status === 'paid' ? 'state-success' : 
                          inv.status === 'overdue' ? 'state-error' : 'state-warning'
                        }`}>
                          {inv.status === 'paid' ? '✓ Soldée (Émargé)' : inv.status === 'overdue' ? '✕ Contrainte Exigible' : '🕒 En Attente'}
                        </span>
                        {inv.status === 'paid' && (
                          <span className="text-[10px] text-slate-400 italic block">Via : <strong>{inv.paymentMethod}</strong> (le {inv.paidDate})</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {inv.status !== 'paid' && (
                          <button 
                            onClick={() => setSelectedInvoiceForBilling(inv)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg transition text-xs active:scale-95"
                          >
                            Encaisser
                          </button>
                        )}
                        <button 
                          onClick={() => setViewingInvoice(inv)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-20 px-2 py-1 rounded-lg transition text-xs flex items-center gap-1 active:scale-95"
                          title="Visualiser facture municipale réplique"
                        >
                          <FileText className="h-3 w-3" />
                          Facture
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MUNICIPAL INVOICE REPLICA MODAL VISUALIZER */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in-50 duration-200 relative">
            
            {/* Close */}
            <button onClick={() => setViewingInvoice(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition">
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Document replica printable */}
            <div className="p-6 md:p-8 space-y-6" id="municipal-bill-document">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-emerald-600 rounded-lg text-white font-black text-xs">AKPBF</div>
                    <span className="font-extrabold text-slate-900 tracking-tight text-md">AKPBF Municipal Service</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">République de Côte d'Ivoire<br />Direction des Services de Salubrité Urbaine</p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-slate-400 lowercase tracking-widest block font-mono">REPUBLIQUE C.I.</span>
                  <div className="bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded-lg text-[10px] mt-2 block">TITRE DE RECETTE</div>
                </div>
              </div>

              {/* Bill identifier and credentials details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Abonné Client</span>
                  <div className="font-bold text-slate-800 text-sm mt-1">{viewingInvoice.subscriberName}</div>
                  <div className="text-slate-500 mt-1">ID Abonné : <span className="font-mono font-bold text-slate-700">{viewingInvoice.subscriberId}</span></div>
                  <div className="text-slate-550">Secteur géographique : Abidjan Zone 4/Plateau</div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Référence Facture</span>
                  <div className="font-mono font-black text-slate-800 text-xs mt-1">{viewingInvoice.id}</div>
                  <div className="text-slate-500 mt-1">Date d'émission : {viewingInvoice.issueDate}</div>
                  <div className="text-slate-500">Période d'abonnement : <strong>{viewingInvoice.period}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-50 p-2.5 font-bold text-slate-600 grid grid-cols-4 border-b border-slate-200">
                  <span className="col-span-2">Désignation de la Municipalité</span>
                  <span className="text-center">Quantité</span>
                  <span className="text-right">Total Net</span>
                </div>
                <div className="p-3 grid grid-cols-4 gap-y-2 border-b border-slate-100 text-slate-700 font-medium">
                  <span className="col-span-2">Redevance Municipale Enlèvement Ordures Ménagères (REOM)</span>
                  <span className="text-center font-mono">1 mois</span>
                  <span className="text-right font-bold text-slate-800">{viewingInvoice.amount.toLocaleString()} FCFA</span>
                </div>
                {/* Total */}
                <div className="bg-slate-50/50 p-3 grid grid-cols-4 font-bold text-slate-800">
                  <span className="col-span-3 text-right text-slate-500">Net à Payer (FCFA) :</span>
                  <span className="text-right text-sm font-black text-slate-900">{viewingInvoice.amount.toLocaleString()} FCFA</span>
                </div>
              </div>

              {/* QR Code and directions replica */}
              <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 text-slate-500 text-[11px] border border-slate-100">
                {/* Simulated QR Code */}
                <div className="w-16 h-16 bg-slate-300 border border-slate-200 shrink-0 rounded flex flex-col items-center justify-center p-1">
                  <div className="grid grid-cols-4 gap-0.5 w-full h-full bg-slate-900 p-1 rounded-sm">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className={`rounded-xs ${i % 3 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-slate-900'}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Instructions de règlement :</span>
                  <p className="leading-relaxed">
                    Vous pouvez régler cette redevance via nos services Mobile Money (Orange Money, Wave) en composant le canal municipal ou directement via ce portail AKPBF.
                  </p>
                  <p className="text-[10px] text-slate-400">Date limite d'exigibilité fiscale : <strong>{viewingInvoice.dueDate}</strong></p>
                </div>
              </div>

              {/* Status stamp */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[9px] text-slate-400 italic">Signature de l'ordonnateur : Trésor Public Municipal d'Abidjan</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border-2 border-dashed ${
                  viewingInvoice.status === 'paid' ? 'state-success' : 'state-error'
                }`}>
                  {viewingInvoice.status === 'paid' ? '✓ FACTURE ACQUITTEE' : '✕ EN SOUFFRANCE'}
                </span>
              </div>
            </div>

            {/* Document trigger actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button 
                onClick={async () => {
                  try {
                    await documentService.printPdf('invoice', viewingInvoice.id);
                  } catch (e) {
                    alert("Erreur lors de l'impression de la facture.");
                  }
                }}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              <button 
                onClick={() => setViewingInvoice(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition active:scale-95 cursor-pointer"
              >
                Confirmer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
