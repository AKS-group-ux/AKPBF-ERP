/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useMemo } from 'react';
import { 
  Database, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileSpreadsheet, 
  RefreshCw, 
  TrendingUp, 
  BookOpen, 
  Scale, 
  Receipt, 
  Coins, 
  Search, 
  Printer, 
  CheckCircle2, 
  Lock
} from 'lucide-react';
import { Invoice, Subscriber } from '../types';
import { documentService } from '../services/documentService';

interface AccountingViewProps {
  invoices: Invoice[];
  subscribers: Subscriber[];
}

// Structured Mock Journal Entry
interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  label: string;
  journal: 'VENTES' | 'ACHATS' | 'BANQUE' | 'CAISSE';
  debitAccount: string;
  creditAccount: string;
  debitValue: number;
  creditValue: number;
  status: 'draft' | 'posted';
}

// Static initial business expense/purchase journals for high fidelity demo
const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  { id: 'ECR-2026-001', date: '2026-05-01', ref: 'ACH-2026-901', label: 'Carburant Camion #COL-402', journal: 'ACHATS', debitAccount: '6061 (Carburant)', creditAccount: '4011 (Dettes Fournisseurs)', debitValue: 120000, creditValue: 120000, status: 'posted' },
  { id: 'ECR-2026-002', date: '2026-05-02', ref: 'REG-2026-901', label: 'Paiement Fournisseur Sodirep - Chèque #4510', journal: 'BANQUE', debitAccount: '4011 (Dettes Fournisseurs)', creditAccount: '5121 (SGBI Banque)', debitValue: 120000, creditValue: 120000, status: 'posted' },
  { id: 'ECR-2026-003', date: '2026-05-05', ref: 'ACH-2026-902', label: 'Maintenance Vidange Camion #COL-403', journal: 'ACHATS', debitAccount: '6151 (Entretien Véhicules)', creditAccount: '4011 (Fournisseurs)', debitValue: 185000, creditValue: 185000, status: 'posted' },
  { id: 'ECR-2026-004', date: '2026-05-10', ref: 'ACH-2026-903', label: 'Achat de 500 sacs poubelles biodégradables', journal: 'ACHATS', debitAccount: '6021 (Stock Sacs)', creditAccount: '4011 (Fournisseurs)', debitValue: 75000, creditValue: 75000, status: 'posted' },
  { id: 'ECR-2026-005', date: '2026-05-10', ref: 'PAY-SAL-01', label: 'Acompte salaires éboueurs Mai', journal: 'CAISSE', debitAccount: '6411 (Salaires)', creditAccount: '5221 (Caisse Principale)', debitValue: 450000, creditValue: 450000, status: 'posted' },
  { id: 'ECR-2026-006', date: '2026-05-15', ref: 'ACH-2026-904', label: 'Assurance Flotte Municipale AXA', journal: 'ACHATS', debitAccount: '6161 (Primes d\'assurance)', creditAccount: '4011 (Fournisseurs)', debitValue: 350000, creditValue: 350000, status: 'posted' },
  { id: 'ECR-2026-007', date: '2026-05-20', ref: 'REG-TAX-01', label: 'Abonnement Internet Orange Fibre', journal: 'CAISSE', debitAccount: '6261 (Téléphone & Internet)', creditAccount: '5221 (Caisse Principale)', debitValue: 45000, creditValue: 45000, status: 'posted' }
];

// Bank statement lines for reconciliation
interface StatementLine {
  id: string;
  date: string;
  label: string;
  amount: number;
  reconciled: boolean;
  matchingTxId?: string;
}

export default function AccountingView({ invoices, subscribers }: AccountingViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'journals' | 'ledger' | 'trial' | 'income' | 'balance-sheet' | 'reconciliation'>('journals');
  const [journalFilter, setJournalFilter] = useState<'ALL' | 'VENTES' | 'ACHATS' | 'BANQUE' | 'CAISSE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for localized trial balance and bookkeeping dynamic entries
  const [customEntries, setCustomEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);

  // Bank Statement Items for Rapprochement Bancaire
  const [bankStatement, setBankStatement] = useState<StatementLine[]>([
    { id: 'STM-001', date: '2026-05-22', label: 'VIR MOBILE MONEY WAVE ACQUITTEMENT', amount: 5500, reconciled: false },
    { id: 'STM-002', date: '2026-05-21', label: 'CHQ #4510 SODIREP ENGIND', amount: -120000, reconciled: false },
    { id: 'STM-003', date: '2026-05-20', label: 'VIR ORANGE MONEY REGLEMENT ABONNEMENT', amount: 3500, reconciled: false },
    { id: 'STM-004', date: '2026-05-18', label: 'VERSMENT ESPECES GUICHET MUNICIPAL', amount: 35000, reconciled: false },
    { id: 'STM-005', date: '2026-05-15', label: 'PRELEVEMENT FIBRE TELECOM', amount: -45000, reconciled: false }
  ]);

  // Combine dynamic invoices as VENTES Journal entries
  const allJournals = useMemo(() => {
    // 1. Map generated invoices to VENTES journal entries
    const salesInvoices: JournalEntry[] = invoices.map(inv => {
      const isPaid = inv.status === 'paid';
      return {
        id: `ECR-VT-${inv.id}`,
        date: inv.issueDate,
        ref: inv.id,
        label: `Facturation Salubrité [${inv.subscriberName}] - Période ${inv.period}`,
        journal: 'VENTES' as const,
        debitAccount: '4111 (Clients Créances)',
        creditAccount: '7061 (Prestations de services - Ordures)',
        debitValue: inv.amount,
        creditValue: inv.amount,
        status: 'posted' as const
      };
    });

    // 2. Map PAID invoices to BANQUE or CAISSE journal entries
    const paymentEntries: JournalEntry[] = invoices
      .filter(inv => inv.status === 'paid')
      .map(inv => {
        const isMobileMoney = inv.paymentMethod === 'Wave' || inv.paymentMethod === 'Orange Money';
        const account = isMobileMoney ? '5122 (Comptes Mobile Money)' : inv.paymentMethod === 'Carte Bancaire' ? '5121 (SGBI Banque)' : '5221 (Caisse Principale)';
        const journal = isMobileMoney || inv.paymentMethod === 'Carte Bancaire' ? 'BANQUE' as const : 'CAISSE' as const;
        return {
          id: `ECR-RE-${inv.id}`,
          date: inv.paidDate || inv.issueDate,
          ref: inv.id,
          label: `Encaissement redevance [${inv.subscriberName}] via ${inv.paymentMethod || 'Espèces'}`,
          journal,
          debitAccount: account,
          creditAccount: '4111 (Clients Créances)',
          debitValue: inv.amount,
          creditValue: inv.amount,
          status: 'posted' as const
        };
      });

    // Combine static and dynamic entries
    return [...salesInvoices, ...paymentEntries, ...customEntries].sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, customEntries]);

  // General statistics computed inside Odoo Accounting engine
  const totals = useMemo(() => {
    let sales = 0;
    let purchases = 0;
    let bank = 0;
    let cash = 0;

    allJournals.forEach(entry => {
      if (entry.journal === 'VENTES') sales += entry.debitValue;
      if (entry.journal === 'ACHATS') purchases += entry.debitValue;
      if (entry.journal === 'BANQUE') bank += entry.debitValue;
      if (entry.journal === 'CAISSE') cash += entry.debitValue;
    });

    return { sales, purchases, bank, cash };
  }, [allJournals]);

  // List of unique accounts with credits & debits for Trial Balance (Balance générale)
  const trialBalanceAccounts = useMemo(() => {
    const balanceMap: { [acc: string]: { debit: number; credit: number } } = {};

    allJournals.forEach(entry => {
      // Debit Account accumulation
      if (!balanceMap[entry.debitAccount]) {
        balanceMap[entry.debitAccount] = { debit: 0, credit: 0 };
      }
      balanceMap[entry.debitAccount].debit += entry.debitValue;

      // Credit Account accumulation
      if (!balanceMap[entry.creditAccount]) {
        balanceMap[entry.creditAccount] = { debit: 0, credit: 0 };
      }
      balanceMap[entry.creditAccount].credit += entry.creditValue;
    });

    return Object.keys(balanceMap).map(accountName => {
      const db = balanceMap[accountName].debit;
      const cr = balanceMap[accountName].credit;
      const finalVal = db - cr;
      return {
        account: accountName,
        debit: db,
        credit: cr,
        soldeDebiteur: finalVal > 0 ? finalVal : 0,
        soldeCrediteur: finalVal < 0 ? Math.abs(finalVal) : 0
      };
    });
  }, [allJournals]);

  // Compute Income Statement (Compte de résultat)
  const incomeStatement = useMemo(() => {
    const products: { [acc: string]: number } = {};
    const charges: { [acc: string]: number } = {};
    let totalProducts = 0;
    let totalCharges = 0;

    allJournals.forEach(entry => {
      // Products (Class 7)
      if (entry.creditAccount.startsWith('7')) {
        products[entry.creditAccount] = (products[entry.creditAccount] || 0) + entry.creditValue;
        totalProducts += entry.creditValue;
      }
      if (entry.debitAccount.startsWith('7')) {
        products[entry.debitAccount] = (products[entry.debitAccount] || 0) - entry.debitValue;
        totalProducts -= entry.debitValue;
      }

      // Charges (Class 6)
      if (entry.debitAccount.startsWith('6')) {
        charges[entry.debitAccount] = (charges[entry.debitAccount] || 0) + entry.debitValue;
        totalCharges += entry.debitValue;
      }
      if (entry.creditAccount.startsWith('6')) {
        charges[entry.creditAccount] = (charges[entry.creditAccount] || 0) - entry.creditValue;
        totalCharges -= entry.creditValue;
      }
    });

    const netResult = totalProducts - totalCharges;

    return {
      products: Object.entries(products).map(([name, val]) => ({ name, val })),
      charges: Object.entries(charges).map(([name, val]) => ({ name, val })),
      totalProducts,
      totalCharges,
      netResult
    };
  }, [allJournals]);

  // Bank Reconciliation dynamic action
  const handleReconcile = (statementId: string) => {
    setBankStatement(prev => 
      prev.map(line => line.id === statementId ? { ...line, reconciled: true } : line)
    );
  };

  const salesInVoicesOnly = allJournals.filter(f => f.journal === 'VENTES');
  const purchaseInvoicesOnly = allJournals.filter(f => f.journal === 'ACHATS');
  const bankEntriesOnly = allJournals.filter(f => f.journal === 'BANQUE');
  const cashEntriesOnly = allJournals.filter(f => f.journal === 'CAISSE');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">ERP Module Comptabilité</h2>
          <p className="text-slate-500 text-sm mt-0.5">Grand livre unifié, Plan comptable SYSCOHADA révisé et rapprochements bancaires automatisés</p>
        </div>

        {/* Action button triggers for export */}
        <div className="flex items-center gap-2">
          <button 
            onClick={async () => {
              try {
                await documentService.downloadPdf('report', 'syscohada_bilan');
              } catch (e) {
                alert("Erreur lors de la génération du bilan comptable.");
              }
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer Bilans</span>
          </button>
          <div className="p-1 px-2.5 bg-emerald-50 text-emerald-850 text-xs font-semibold rounded-lg flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span>Grand Livre Verrouillé</span>
          </div>
        </div>
      </div>

      {/* COMPTABILITE SUB MENU */}
      <div className="flex flex-wrap border-b border-slate-200/60 pb-3 gap-1">
        {[
          { id: 'journals', label: 'Journaux Comptables', icon: BookOpen },
          { id: 'ledger', label: 'Grand Livre Général', icon: Database },
          { id: 'trial', label: 'Balance Générale', icon: Scale },
          { id: 'income', label: 'Compte de Résultat (P&L)', icon: TrendingUp },
          { id: 'balance-sheet', label: 'Bilan Comptable Actif/Passif', icon: Receipt },
          { id: 'reconciliation', label: 'Rapprochement Bancaire', icon: RefreshCw }
        ].map(sub => {
          const SubIcon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition rounded-lg cursor-pointer ${
                isActive 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 bg-transparent'
              }`}
            >
              <SubIcon className={`h-4 w-4 ${isActive ? 'text-brand-accent' : 'text-slate-400'}`} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chiffre d’Affaires (Ventes J.)</span>
            <h3 className="text-xl font-black text-emerald-800">{totals.sales.toLocaleString()} <span className="text-xs text-slate-400 font-bold">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dépenses Enregistrées (Fourn.)</span>
            <h3 className="text-xl font-black text-amber-800">{totals.purchases.toLocaleString()} <span className="text-xs text-slate-400 font-bold">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fonds En Banque</span>
            <h3 className="text-xl font-black text-slate-850">{totals.bank.toLocaleString()} <span className="text-xs text-slate-400 font-bold">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/85 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Livre de Caisse</span>
            <h3 className="text-xl font-black text-slate-850">{totals.cash.toLocaleString()} <span className="text-xs text-slate-400 font-bold">FCFA</span></h3>
          </div>
          <div className="p-2.5 bg-violet-50 text-violet-700 rounded-xl">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* RENDER VIEW: JOURNAUX COMPTABLES */}
      {activeSubTab === 'journals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Journaux comptables d'exploitation</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Toutes les opérations fiscales et de caisse enregistrées de manière immuable</p>
            </div>

            {/* Quick Filter */}
            <div className="flex flex-wrap gap-2.5">
              {[
                { id: 'ALL', label: 'Tous Journaux' },
                { id: 'VENTES', label: 'Ventes (Clients)' },
                { id: 'ACHATS', label: 'Achats (Dépenses)' },
                { id: 'BANQUE', label: 'Banque' },
                { id: 'CAISSE', label: 'Caisse' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setJournalFilter(f.id as any)}
                  className={`px-3 py-1 bg-slate-50 border text-xs font-bold rounded-lg transition hover:bg-slate-100 cursor-pointer ${
                    journalFilter === f.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 font-bold uppercase text-[9px] tracking-widest text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="p-3">Séquence Ecr.</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Réf Sce</th>
                  <th className="p-3">Libellé de l’Écriture</th>
                  <th className="p-3">Journal</th>
                  <th className="p-3">Compte Débit</th>
                  <th className="p-3">Compte Crédit</th>
                  <th className="p-3 text-right">Débit</th>
                  <th className="p-3 text-right">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-650 font-mono text-[11px]">
                {allJournals
                  .filter(e => journalFilter === 'ALL' || e.journal === journalFilter)
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-slate-800">{entry.id}</td>
                      <td className="p-3 font-sans font-medium text-slate-500 whitespace-nowrap">{entry.date}</td>
                      <td className="p-3 font-bold text-indigo-700">{entry.ref}</td>
                      <td className="p-3 font-sans font-semibold text-slate-800 antialiased min-w-[240px]">{entry.label}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                          entry.journal === 'VENTES' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          entry.journal === 'ACHATS' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          entry.journal === 'BANQUE' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          'bg-violet-50 text-violet-700 border border-violet-100'
                        }`}>
                          {entry.journal}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{entry.debitAccount}</td>
                      <td className="p-3 text-slate-500">{entry.creditAccount}</td>
                      <td className="p-3 text-right font-extrabold text-blue-800">{entry.debitValue.toLocaleString()}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-700">{entry.creditValue.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: GRAND LIVRE GENERALE */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Grand Livre Général Analytique</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Ventilation complète des flux systémiques par comptes SYSCOHADA</p>
          </div>

          <div className="space-y-6">
            {trialBalanceAccounts.map(account => {
              // Extract matching entries
              const debits = allJournals.filter(j => j.debitAccount === account.account);
              const credits = allJournals.filter(j => j.creditAccount === account.account);
              
              if (debits.length === 0 && credits.length === 0) return null;

              return (
                <div key={account.account} className="border border-slate-200/70 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100">
                    <span className="font-extrabold text-xs text-slate-850 font-mono">{account.account}</span>
                    <div className="flex gap-4 text-xs font-semibold">
                      <span className="text-slate-500">Mouv. Débit: <strong className="text-blue-800">{account.debit.toLocaleString()} FCFA</strong></span>
                      <span className="text-slate-500">Mouv. Crédit: <strong className="text-emerald-700">{account.credit.toLocaleString()} FCFA</strong></span>
                      {account.soldeDebiteur > 0 ? (
                        <span className="text-blue-700 font-black">Solde débiteur: {account.soldeDebiteur.toLocaleString()} FCFA</span>
                      ) : (
                        <span className="text-emerald-700 font-black">Solde créditeur: {account.soldeCrediteur.toLocaleString()} FCFA</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50/40 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="p-2.5 pl-4">Pièce</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Désignation</th>
                          <th className="p-2.5">Type Journal</th>
                          <th className="p-2.5 text-right">Débit</th>
                          <th className="p-2.5 text-right pr-4">Crédit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-mono text-[10.5px]">
                        {debits.map(d => (
                          <tr key={d.id} className="hover:bg-slate-50/30">
                            <td className="p-2.5 pl-4 font-bold text-slate-705">{d.id}</td>
                            <td className="p-2.5 font-sans font-medium text-slate-500">{d.date}</td>
                            <td className="p-2.5 font-sans text-slate-750 font-semibold">{d.label}</td>
                            <td className="p-2.5 text-slate-400 text-[9px] font-black">{d.journal}</td>
                            <td className="p-2.5 text-right font-extrabold text-blue-800">{d.debitValue.toLocaleString()}</td>
                            <td className="p-2.5 text-right pr-4 text-slate-300">-</td>
                          </tr>
                        ))}
                        {credits.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/30">
                            <td className="p-2.5 pl-4 font-bold text-slate-705">{c.id}</td>
                            <td className="p-2.5 font-sans font-medium text-slate-500">{c.date}</td>
                            <td className="p-2.5 font-sans text-slate-750 font-semibold">{c.label}</td>
                            <td className="p-2.5 text-slate-400 text-[9px] font-black">{c.journal}</td>
                            <td className="p-2.5 text-right text-slate-300">-</td>
                            <td className="p-2.5 text-right pr-4 font-extrabold text-emerald-700">{c.creditValue.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER VIEW: BALANCE GENERALE */}
      {activeSubTab === 'trial' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Balance Générale des Comptes</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Vérification de la dualité crédit/débit et équilibre comptable SYSCOHADA</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 font-bold uppercase text-[9px] tracking-widest text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="p-3" rowSpan={2}>Compte Libellé</th>
                  <th className="p-3 text-center border-b border-slate-100" colSpan={2}>Mouvements de Période</th>
                  <th className="p-3 text-center border-b border-slate-100" colSpan={2}>Soldes Finaux</th>
                </tr>
                <tr>
                  <th className="p-2.5 text-right bg-slate-50/40">Débit</th>
                  <th className="p-2.5 text-right bg-slate-50/40">Crédit</th>
                  <th className="p-2.5 text-right bg-slate-50/70">Solde Débiteur</th>
                  <th className="p-2.5 text-right bg-slate-50/70">Solde Créditeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-slate-650">
                {trialBalanceAccounts.map(account => (
                  <tr key={account.account} className="hover:bg-slate-50/30">
                    <td className="p-3 font-sans font-bold text-slate-800">{account.account}</td>
                    <td className="p-3 text-right text-blue-800 font-semibold">{account.debit.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-800 font-semibold">{account.credit.toLocaleString()}</td>
                    <td className="p-3 text-right text-indigo-900 font-extrabold">{account.soldeDebiteur > 0 ? account.soldeDebiteur.toLocaleString() : '-'}</td>
                    <td className="p-3 text-right text-emerald-700 font-extrabold">{account.soldeCrediteur > 0 ? account.soldeCrediteur.toLocaleString() : '-'}</td>
                  </tr>
                ))}
                
                {/* Balance Totals verification */}
                <tr className="bg-slate-900 text-white font-extrabold text-[12px]">
                  <td className="p-3">TOTAL GÉNÉRAL VÉRIFIÉ</td>
                  <td className="p-3 text-right text-amber-300">
                    {trialBalanceAccounts.reduce((sum, a) => sum + a.debit, 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-amber-300">
                    {trialBalanceAccounts.reduce((sum, a) => sum + a.credit, 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-emerald-400">
                    {trialBalanceAccounts.reduce((sum, a) => sum + a.soldeDebiteur, 0).toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-emerald-400">
                    {trialBalanceAccounts.reduce((sum, a) => sum + a.soldeCrediteur, 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: COMPTE DE RESULTAT */}
      {activeSubTab === 'income' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Charges Class 6 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
            <h3 className="text-sm font-black text-rose-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
               charges dexploitation (Classe 6)
            </h3>
            
            <div className="divide-y divide-slate-100 font-sans text-xs">
              {incomeStatement.charges.map(chg => (
                <div key={chg.name} className="py-3 flex justify-between">
                  <span className="font-semibold text-slate-700 font-mono">{chg.name}</span>
                  <span className="font-bold text-rose-700">{chg.val.toLocaleString()} FCFA</span>
                </div>
              ))}
              {incomeStatement.charges.length === 0 && (
                <div className="py-8 text-center text-slate-400">Aucune charge imputée.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-800">
              <span>Total Charges</span>
              <span className="text-rose-800 text-sm font-black">{incomeStatement.totalCharges.toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Products Class 7 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
            <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              PRODUITS D'EXPLOITATION (Classe 7)
            </h3>

            <div className="divide-y divide-slate-100 font-sans text-xs">
              {incomeStatement.products.map(prd => (
                <div key={prd.name} className="py-3 flex justify-between">
                  <span className="font-semibold text-slate-700 font-mono">{prd.name}</span>
                  <span className="font-bold text-emerald-700">{prd.val.toLocaleString()} FCFA</span>
                </div>
              ))}
              {incomeStatement.products.length === 0 && (
                <div className="py-8 text-center text-slate-400">Aucun produit imputé.</div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-slate-800">
              <span>Total Produits</span>
              <span className="text-emerald-800 text-sm font-black">{incomeStatement.totalProducts.toLocaleString()} FCFA</span>
            </div>

            {/* Net Financial Result box matching Odoo standards */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-emerald-950 mt-10">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Résultat Net Analytique</span>
                <span className="text-xs text-slate-500">Marge brute d'exercice</span>
              </div>
              <strong className={`text-base font-black ${incomeStatement.netResult >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {incomeStatement.netResult.toLocaleString()} FCFA
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: BILAN COMPTABLE */}
      {activeSubTab === 'balance-sheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-left">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Bilan Comptable d'Assainissement</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Synthèse statutaire de l'actif immobilisé / circulant et passif exigible</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100 text-xs">
            
            {/* ACTIF ACCUMULATIONS */}
            <div className="space-y-4">
              <h4 className="font-black text-xs text-blue-900 border-b border-blue-50 pb-2 flex justify-between">
                <span>ACTIF (Avoir du Domaine Public)</span>
                <span className="font-sans text-[10px] uppercase text-slate-400">SYSCOHADA</span>
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between font-medium">
                  <div>
                    <strong className="block text-slate-800">Actif Immobilisé (10 camions, 4 compacteurs)</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Compte 244 (Matériel de transport)</span>
                  </div>
                  <strong className="text-slate-800">45 000 000 FCFA</strong>
                </div>

                <div className="flex justify-between font-medium">
                  <div>
                    <strong className="block text-slate-800">Créances clients ordinaires</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Compte 4111 (Clients d'assainissement)</span>
                  </div>
                  <strong className="text-indigo-800">
                    {trialBalanceAccounts.find(a=>a.account.startsWith('4111'))?.soldeDebiteur?.toLocaleString() || '0'} FCFA
                  </strong>
                </div>

                <div className="flex justify-between font-medium">
                  <div>
                    <strong className="block text-slate-800">Liquidités en coffre caisse</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Compte 5221 (Caisse principale)</span>
                  </div>
                  <strong className="text-slate-800">
                    {trialBalanceAccounts.find(a=>a.account.startsWith('5221'))?.soldeDebiteur?.toLocaleString() || '0'} FCFA
                  </strong>
                </div>

                <div className="flex justify-between font-medium">
                  <div>
                    <strong className="block text-slate-800">Comptes de Trésorerie Mobile Money</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Compte 5122 (Comptes télé-Validation)</span>
                  </div>
                  <strong className="text-slate-800">
                    {trialBalanceAccounts.find(a=>a.account.startsWith('5122'))?.soldeDebiteur?.toLocaleString() || '0'} FCFA
                  </strong>
                </div>
              </div>
            </div>

            {/* PASSIF ACCUMULATIONS */}
            <div className="space-y-4 md:pl-8 pt-6 md:pt-0">
              <h4 className="font-black text-xs text-emerald-800 border-b border-emerald-50 pb-2 flex justify-between">
                <span>PASSIF (Capitaux propres & Dettes)</span>
                <span className="font-sans text-[10px] uppercase text-slate-400">SYSCOHADA</span>
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between font-medium">
                  <div>
                    <strong className="block text-slate-800">Dotation Initiale d’Investissement</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Compte 101 (Capital Municipal de Base)</span>
                  </div>
                  <strong className="text-slate-800">45 000 000 FCFA</strong>
                </div>

                <div className="flex justify-between font-medium">
                  <div>
                    <strong className="block text-slate-800">Créditeurs & Fournisseurs</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Compte 4011 (Dettes Carburant/Primes)</span>
                  </div>
                  <strong className="text-emerald-700">
                    {trialBalanceAccounts.find(a=>a.account.startsWith('4011'))?.soldeCrediteur?.toLocaleString() || '0'} FCFA
                  </strong>
                </div>

                <div className="flex justify-between font-medium">
                  <div>
                    <strong className="block text-slate-800">Bénéfices/Résultat d'Exercice Non Distribué</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Compte 13 (Résultat Net Mai)</span>
                  </div>
                  <strong className={`${incomeStatement.netResult >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {incomeStatement.netResult.toLocaleString()} FCFA
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: RECONCILIATION BANCAIRE */}
      {activeSubTab === 'reconciliation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 text-left">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Moteur de Rapprochement Bancaire</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Faire coïncider les factures acquittées sur AKPBF avec les lignes d’extraits de comptes réels</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Stats summaries inside reconciliation tab */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4 h-fit">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Audit des soldes</span>
              
              <div className="space-y-3 text-xs leading-relaxed text-slate-650">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Total Extrait :</span>
                  <span className="font-bold text-slate-800">-123 000 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Lignes reconciliées :</span>
                  <span className="font-bold text-emerald-600">
                    {bankStatement.filter(b=>b.reconciled).length} / {bankStatement.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1 select-none">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300" 
                    style={{ width: `${(bankStatement.filter(b=>b.reconciled).length / bankStatement.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200/60 rounded-xl text-[10.5px] text-slate-500">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 inline mr-1" />
                <span>Le rapprochement est une exigence comptable légale de contrôle interne.</span>
              </div>
            </div>

            {/* Reconciliation interactive stream */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Lignes relevées d’opérateurs bancaires</h4>
              
              <div className="space-y-3">
                {bankStatement.map(line => (
                  <div 
                    key={line.id} 
                    className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                      line.reconciled 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-indigo-650 font-bold">{line.id}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{line.date}</span>
                      </div>
                      <strong className="text-xs text-slate-800 block">{line.label}</strong>
                      {line.reconciled && (
                        <span className="text-[9px] text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded-full font-bold">✓ Rapproché dans le Grand Livre</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <strong className={`text-sm font-black font-mono ${line.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {line.amount > 0 ? `+${line.amount}` : line.amount} FCFA
                      </strong>

                      {!line.reconciled ? (
                        <button
                          onClick={() => handleReconcile(line.id)}
                          className="px-3 py-1 bg-slate-900 text-white font-extrabold text-[10px] rounded-lg hover:bg-emerald-600 transition cursor-pointer"
                        >
                          Rapprocher
                        </button>
                      ) : (
                        <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
