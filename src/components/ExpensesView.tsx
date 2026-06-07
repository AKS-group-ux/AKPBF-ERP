/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard, 
  Fuel, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Coins, 
  FolderLock, 
  FileCheck,
  ChevronRight,
  Eye,
  Camera
} from 'lucide-react';

// Supplier Interface
interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  category: 'Fuel' | 'Vehicles Repair' | 'Equipment' | 'Telecom' | 'Insure' | 'Others';
  outstandingDebt: number;
}

// Supplier Invoice Interface
interface SupplierInvoice {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  category: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'paid' | 'cancelled';
  validationFlow: 'Comptable' | 'Directeur' | 'Terminé';
  justificatifUrl?: string;
}

const INITIAL_SUPPLIERS: Supplier[] = [];

const INITIAL_SUPPLIER_INVOICES: SupplierInvoice[] = [];

export default function ExpensesView() {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'invoices' | 'expenses'>('expenses');
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>(INITIAL_SUPPLIER_INVOICES);

  // New Supplier form states
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCategory, setSupCategory] = useState<'Fuel' | 'Vehicles Repair' | 'Equipment' | 'Telecom' | 'Insure' | 'Others'>('Fuel');

  // New Vendor invoice form states
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [invoiceSupplierId, setInvoiceSupplierId] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('');
  const [invoiceAmt, setInvoiceAmt] = useState('');
  const [invoiceDue, setInvoiceDue] = useState('');
  const [invoiceCat, setInvoiceCat] = useState('Carburant');

  // Active document for preview dialog
  const [activeJustificatif, setActiveJustificatif] = useState<string | null>(null);

  // Metrics calculation
  const stats = useMemo(() => {
    const totalDettes = suppliers.reduce((sum, s) => sum + s.outstandingDebt, 0);
    const pendingApprovalSum = supplierInvoices
      .filter(i => i.status === 'pending_approval')
      .reduce((sum, i) => sum + i.amount, 0);
    const approvedInvoicesSum = supplierInvoices
      .filter(i => i.status === 'approved')
      .reduce((sum, i) => sum + i.amount, 0);
    const paidSum = supplierInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);

    return { totalDettes, pendingApprovalSum, approvedInvoicesSum, paidSum };
  }, [suppliers, supplierInvoices]);

  // Create Supplier
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;

    const newSupplier: Supplier = {
      id: `FOUR-00${suppliers.length + 1}`,
      name: supName,
      contactName: supContact,
      email: supEmail,
      phone: supPhone,
      address: supAddress,
      category: supCategory,
      outstandingDebt: 0
    };

    setSuppliers([...suppliers, newSupplier]);
    setSupName('');
    setSupContact('');
    setSupEmail('');
    setSupPhone('');
    setSupAddress('');
    setIsAddSupplierOpen(false);
  };

  // Create Vendor Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceSupplierId || !invoiceNum || !invoiceAmt) return;

    const selectedSup = suppliers.find(s => s.id === invoiceSupplierId);
    if (!selectedSup) return;

    const newInvoice: SupplierInvoice = {
      id: `FAC-FOUR-0${supplierInvoices.length + 1}`,
      supplierId: invoiceSupplierId,
      supplierName: selectedSup.name,
      invoiceNumber: invoiceNum,
      amount: parseFloat(invoiceAmt),
      dueDate: invoiceDue || '2026-06-30',
      category: invoiceCat,
      status: 'draft',
      validationFlow: 'Comptable',
      justificatifUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=400&auto=format&fit=crop&q=60'
    };

    setSupplierInvoices([...supplierInvoices, newInvoice]);
    
    // Auto increment supplier debt
    setSuppliers(prev => prev.map(s => s.id === invoiceSupplierId ? { ...s, outstandingDebt: s.outstandingDebt + parseFloat(invoiceAmt) } : s));

    setInvoiceSupplierId('');
    setInvoiceNum('');
    setInvoiceAmt('');
    setIsAddInvoiceOpen(false);
  };

  // Process validation sequence (Hierarchical flow)
  // Draft -> Pending Approval -> Approved -> Paid
  const handleAdvanceValidation = (invoiceId: string) => {
    setSupplierInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;

      if (inv.status === 'draft') {
        return { ...inv, status: 'pending_approval', validationFlow: 'Comptable' };
      } else if (inv.status === 'pending_approval') {
        return { ...inv, status: 'approved', validationFlow: 'Directeur' };
      } else if (inv.status === 'approved') {
        return { ...inv, status: 'paid', validationFlow: 'Terminé' };
      }
      return inv;
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">ERP Factures Fournisseurs & Dépenses</h2>
          <p className="text-slate-500 text-sm mt-0.5">Validation hiérarchique SYSCOHADA des dettes d'exploitation et notes de frais</p>
        </div>

        {/* Buttons to quickly trigger creation modals */}
        <div className="flex gap-2">
          {activeTab === 'suppliers' ? (
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Fournisseur</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddInvoiceOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Enregistrer Facture</span>
            </button>
          )}
        </div>
      </div>

      {/* METRIC SHIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dettes Fournisseurs</span>
            <h3 className="text-xl font-black text-amber-600">{stats.totalDettes.toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">En attente de validation</span>
            <h3 className="text-xl font-black text-rose-700">{stats.pendingApprovalSum.toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Clock className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Prêtes pour paiement</span>
            <h3 className="text-xl font-black text-emerald-800">{stats.approvedInvoicesSum.toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileCheck className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Réglé (Mai)</span>
            <h3 className="text-xl font-black text-slate-850">{stats.paidSum.toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Coins className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex border-b border-slate-100 pb-3 gap-1">
        {[
          { id: 'expenses', label: 'Ressources & Dépenses Directes', icon: Fuel },
          { id: 'invoices', label: 'Factures Fournisseurs / Dettes', icon: FileText },
          { id: 'suppliers', label: 'Annuaire Fournisseurs', icon: Building2 }
        ].map(tb => {
          const TabIcon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                activeTab === tb.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-850 bg-transparent'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER VIEW: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Registre des Entreprises & Prestataires</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-slate-400 font-sans font-semibold border border-dashed border-slate-200 rounded-xl">
                Aucun prestataire ou fournisseur enregistré.
              </div>
            ) : (
              suppliers.map(sup => (
                <div key={sup.id} className="p-4 rounded-xl border border-slate-200/75 hover:border-slate-350 transition flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-850">{sup.name}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">{sup.id}</span>
                      </div>
                      <span className="text-[10.5px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-100/50">{sup.category}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 leading-relaxed font-sans">
                      <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> <span>{sup.email}</span></div>
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> <span>{sup.phone}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> <span>{sup.address}</span></div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Solde payable :</span>
                    <strong className={`font-black ${sup.outstandingDebt > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {sup.outstandingDebt.toLocaleString()} FCFA
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW: SUPPLIER INVOICES (FACTURATION ACHATS) */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Grand Livre des Échéances Fournisseurs</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-bold uppercase text-[9px] tracking-widest text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="p-3">Ref ERP</th>
                  <th className="p-3">Num Facture</th>
                  <th className="p-3">Fournisseur</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Échéance</th>
                  <th className="p-3">Niveau de Validation</th>
                  <th className="p-3 text-center">Contrôles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-slate-650">
                {supplierInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-sans font-semibold">
                      Aucune facture fournisseur ou échéance enregistrée.
                    </td>
                  </tr>
                ) : (
                  supplierInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-slate-800">{inv.id}</td>
                      <td className="p-3 text-indigo-750 font-bold">{inv.invoiceNumber}</td>
                      <td className="p-3 font-sans font-bold text-slate-800">{inv.supplierName}</td>
                      <td className="p-3 font-sans text-slate-500 font-medium">{inv.category}</td>
                      <td className="p-3 font-black text-amber-700">{inv.amount.toLocaleString()} FCFA</td>
                      <td className="p-3 font-sans text-slate-400 font-semibold">{inv.dueDate}</td>
                      <td className="p-3 font-sans text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${
                            inv.status === 'draft' ? 'bg-slate-400' :
                            inv.status === 'pending_approval' ? 'bg-rose-500' :
                            inv.status === 'approved' ? 'bg-emerald-500 animate-pulse' :
                            'bg-blue-600'
                          }`} />
                          <span className="font-bold text-slate-700">
                            {inv.status === 'draft' ? 'Brouillon' :
                             inv.status === 'pending_approval' ? 'Visa Comptable' :
                             inv.status === 'approved' ? 'Visa Direction Sces' :
                             'Acquitté'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center flex items-center justify-center gap-1.5">
                        {inv.justificatifUrl && (
                          <button
                            onClick={() => setActiveJustificatif(inv.justificatifUrl || null)}
                            className="p-1 text-slate-400 hover:text-slate-800 border border-slate-200 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Voir justificatif"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}

                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleAdvanceValidation(inv.id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-[10px] rounded transition active:scale-95 cursor-pointer"
                          >
                            {inv.status === 'draft' ? "Visa Compt." :
                             inv.status === 'pending_approval' ? "Visa Dir." : 
                             inv.status === 'approved' ? "Payer" : "Suivant"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: CORPDEXP / NOTES DE FRAIS */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Grille des frais d'exploitation directs</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Enregistrement instantané des dépenses carburant, téléphone, assurances mutuelles, etc.</p>
            </div>
            <button
              onClick={() => setIsAddInvoiceOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 font-bold hover:bg-emerald-700 text-white rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Camera className="h-4 w-4" />
              <span>Photographier Reçu</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs select-none">
            {supplierInvoices.filter(inv => inv.status === 'paid').length === 0 ? (
              <div className="col-span-3 p-8 text-center text-slate-400 font-sans font-semibold border border-dashed border-slate-200 rounded-xl animate-fade-in">
                Aucune note de frais ou dépense directe enregistrée.
              </div>
            ) : (
              supplierInvoices.filter(inv => inv.status === 'paid').map((inv) => (
                <div key={inv.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group">
                  <div className="flex justify-between items-center text-left">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                      <Fuel className="h-5 w-5" />
                    </div>
                    <strong className="text-emerald-700 font-black text-sm">{inv.amount.toLocaleString()} FCFA</strong>
                  </div>

                  <div className="space-y-1 text-left">
                    <h4 className="font-extrabold text-slate-800 text-xs">{inv.category}</h4>
                    <p className="text-[11px] text-slate-500 font-normal leading-normal">{inv.supplierName} - Facture ref {inv.invoiceNumber}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400 font-semibold">Échéance {inv.dueDate}</span>
                    <span className="text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded-full font-bold">✓ Validé & Payé</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* POPUP MODAL: ADD SUPPLIER */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateSupplier} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 text-left">
            <div className="bg-emerald-600 p-4 text-white font-extrabold text-xs uppercase tracking-widest">
              Nouveau Prestataire / Fournisseur
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Raison Sociale :</label>
                <input required type="text" value={supName} onChange={e=>setSupName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Ex: Shell CI S.A." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Contact Chef :</label>
                  <input type="text" value={supContact} onChange={e=>setSupContact(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Koffi Paul" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Secteur Service :</label>
                  <select value={supCategory} onChange={e=>setSupCategory(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <option value="Fuel">Carburant</option>
                    <option value="Vehicles Repair">Maintenance Camion</option>
                    <option value="Equipment">Fournitures Bacs</option>
                    <option value="Telecom">Téléphonie Connectique</option>
                    <option value="Insure">Assurances</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Email :</label>
                  <input type="email" value={supEmail} onChange={e=>setSupEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="b2b@shell.ci" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Téléphone :</label>
                  <input required type="text" value={supPhone} onChange={e=>setSupPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="+225 05..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Adresse Siège :</label>
                <input type="text" value={supAddress} onChange={e=>setSupAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Plateau Boulevard ..." />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition hover:bg-emerald-700 cursor-pointer">Enregistrer</button>
                <button type="button" onClick={()=>setIsAddSupplierOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold transition hover:bg-slate-200 cursor-pointer">Fermer</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: ADD VENDOR INVOICE */}
      {isAddInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvoice} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 text-left">
            <div className="bg-slate-900 p-4 text-white font-extrabold text-xs uppercase tracking-widest">
              Imputer Dépense / Facture Fournisseur
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Choisir Fournisseur :</label>
                <select required value={invoiceSupplierId} onChange={e=>setInvoiceSupplierId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                  <option value="">-- Choisir --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Numéro de Pièce/Facture :</label>
                  <input required type="text" value={invoiceNum} onChange={e=>setInvoiceNum(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Ex: AX-8801" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Catégorie Comptable :</label>
                  <input type="text" value={invoiceCat} onChange={e=>setInvoiceCat(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Carburant, Stock sacs..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Montant (FCFA) :</label>
                  <input required type="number" value={invoiceAmt} onChange={e=>setInvoiceAmt(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Somme brute" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Échéance de Règlement :</label>
                  <input type="date" value={invoiceDue} onChange={e=>setInvoiceDue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" />
                </div>
              </div>

              {/* Mock photo receipt load */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-indigo-950">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-indigo-600" />
                  <span className="font-bold text-[10.5px]">Attacher un reçu photo (Simulé)</span>
                </div>
                <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black">ACTIF</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold transition hover:bg-slate-800 cursor-pointer">Valider Ecr.</button>
                <button type="button" onClick={()=>setIsAddInvoiceOpen(false)} className="flex-1 bg-slate-105 text-slate-600 py-2.5 rounded-xl font-bold transition hover:bg-slate-200 cursor-pointer">Fermer</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL: JUSTIFICATIF PREVIEWER */}
      {activeJustificatif && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setActiveJustificatif(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150" onClick={e=>e.stopPropagation()}>
            <div className="bg-slate-900 text-white p-4 font-bold text-xs uppercase flex justify-between tracking-wide">
              <span>Aperçu de la pièce comptable</span>
              <button onClick={() => setActiveJustificatif(null)}>✕</button>
            </div>
            <div className="p-5 flex flex-col items-center gap-3">
              <img src={activeJustificatif} referrerPolicy="no-referrer" alt="Justificatif comptable" className="w-full max-h-60 object-cover rounded-xl border border-slate-100" />
              <p className="text-[10.5px] text-slate-400 text-center leading-normal">
                Visualisation de la facture numérisée par les équipes de terrain d'AKPBF. Certifié conforme pour l'audit fiscal municipal.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
