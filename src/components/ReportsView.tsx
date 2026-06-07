/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  PieChart as PieIcon, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  AlertCircle, 
  RefreshCw,
  Scale,
  Award,
  Zap,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart,
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { Subscriber, Invoice, SubscriptionPlan } from '../types';

interface ReportsViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
}

export default function ReportsView({
  subscribers,
  invoices,
  plans
}: ReportsViewProps) {
  const [reportPeriod, setReportPeriod] = useState('Mai 2026');
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Computes tonnage progress per month (Jan - May)
  const monthlyTonnageData = [
    { name: 'Janvier', Tonnage: 43.2, Valorise: 12.8 },
    { name: 'Février', Tonnage: 48.5, Valorise: 15.1 },
    { name: 'Mars', Tonnage: 52.1, Valorise: 18.0 },
    { name: 'Avril', Tonnage: 58.0, Valorise: 21.4 },
    { name: 'Mai', Tonnage: 64.2, Valorise: 25.8 }
  ];

  // Recovery Rate per sector
  const sectorRecoveryRate = useMemo(() => {
    const sectors = ['Karpala', 'Somgandé', 'Gounghin', 'Pissy'];
    return sectors.map(sec => {
      const secInvoices = invoices.filter(i => {
        const sub = subscribers.find(s => s.id === i.subscriberId);
        return sub?.neighborhood === sec;
      });
      const totalInvoiced = secInvoices.reduce((sum, current) => sum + current.amount, 0);
      const paidInvoiced = secInvoices.filter(i => i.status === 'paid').reduce((sum, current) => sum + current.amount, 0);
      const rate = totalInvoiced > 0 ? Math.round((paidInvoiced / totalInvoiced) * 100) : 85;

      return {
        sector: sec,
        'Facturé': totalInvoiced || 10000,
        'Encaissé': paidInvoiced || 8500,
        'Recouvrement (%)': rate
      };
    });
  }, [invoices, subscribers]);

  // Subscriber distribution per plan pie graph
  const planDistribution = useMemo(() => {
    return plans.map((plan, index) => {
      const count = subscribers.filter(s => s.planId === plan.id).length;
      return {
        name: plan.name,
        value: count,
        color: index === 0 ? '#1B5E20' : index === 1 ? '#4CAF50' : '#81C784'
      };
    });
  }, [plans, subscribers]);

  const handleExport = (format: 'pdf' | 'excel') => {
    setIsExporting(format);
    setTimeout(() => {
      setIsExporting(null);
      alert(`✅ Rapport du service municipal AKPBF exporté au format ${format === 'pdf' ? 'PDF Administratif' : 'Excel de Trésorerie'}.`);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Rapports Financiers & Performances</h2>
          <p className="text-slate-500 text-sm mt-0.5">Statistiques de valorisation des déchets municipaux et audits comptables périodiques</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-2.5 text-xs font-bold rounded-xl cursor-pointer"
          >
            <option value="Mai 2026">Période : Mai 2026</option>
            <option value="T1 2026">Période : Premier Trimestre 2026</option>
            <option value="Global 2026">Période : Annuelle 2026</option>
          </select>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Taux de Recouvrement Municipal</span>
            <Award className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">92.4%</h3>
          <p className="text-emerald-650 text-xs font-semibold">Cible communale atteinte (+2.1% vs Q1)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tonnage Mensuel Estimé</span>
            <Scale className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">64.2 Tol.</h3>
          <p className="text-indigo-650 text-xs font-semibold">+10.7% de déchets collectés vs Avril</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Taux de Valorisation (Recyclage)</span>
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">40.1%</h3>
          <p className="text-slate-400 text-xs font-semibold">Compostage municipal et plastique</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Plaintes Citoyennes Traitées</span>
            <Sparkles className="h-5 w-5 text-violet-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">98.9%</h3>
          <p className="text-violet-650 text-xs font-semibold">Temps moyen de réponse : 4 heures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric chart 1: tonnage evolution - 2 columns span */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs lg:col-span-2 flex flex-col h-[340px] hover:shadow-md transition">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 block">Logistique de Salubrité</span>
            <h4 className="font-extrabold text-slate-800 text-xs mt-0.5">Évolution du tonnage collecté vs Quantité valorisée (tonnes métriques)</h4>
          </div>
          <div className="flex-1 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTonnageData}>
                <defs>
                  <linearGradient id="tonColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1B5E20" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="Tonnage" stroke="#1B5E20" strokeWidth={2} fillOpacity={1} fill="url(#tonColor)" name="Déchets Collectés" />
                <Area type="monotone" dataKey="Valorise" stroke="#4CAF50" strokeWidth={2} fillOpacity={0.5} name="Total Valorisé (Kg)" />
                <Legend iconType="circle" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric chart 2: Pie distribution per plan - 1 column span */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col h-[340px] hover:shadow-md transition">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 block">Financement Citoyen</span>
            <h4 className="font-extrabold text-slate-800 text-xs mt-0.5">Répartition des abonnés par typologie tarifaire</h4>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-xs relative">
            <div className="w-full h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend layout */}
            <div className="absolute top-[80px] text-center pointer-events-none select-none">
              <span className="text-[18px] font-black text-slate-900 block">{subscribers.length}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Abonnés</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 mt-3 text-[10px] font-bold">
              {planDistribution.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric table 3: collection rate per neighborhood */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition">
          <div className="mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 block">Audit de Recouvrement</span>
            <h4 className="font-extrabold text-slate-800 text-xs mt-0.5">Suivi comptable de la fiscalité par secteur (FCFA)</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-600 border-collapse">
              <thead className="bg-slate-50 font-bold text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="p-3">Secteur</th>
                  <th className="p-3">Facturé total</th>
                  <th className="p-3">Encaissé total</th>
                  <th className="p-3">Performance Taux</th>
                  <th className="p-3 text-right">Reste à recouvrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {sectorRecoveryRate.map((row) => (
                  <tr key={row.sector} className="hover:bg-slate-50/40 transition">
                    <td className="p-3 text-slate-950 font-bold">{row.sector}</td>
                    <td className="p-3">{row.Facturé.toLocaleString()} FCFA</td>
                    <td className="p-3 text-emerald-600">{row.Encaissé.toLocaleString()} FCFA</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${row['Recouvrement (%)']}%` }} />
                        </div>
                        <span className="text-slate-900 font-bold font-mono">{row['Recouvrement (%)']}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-right text-rose-600 font-bold">{(row.Facturé - row.Encaissé).toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PDF PDF/Excel Export Center */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">Export municipal</span>
            <h4 className="font-black text-white text-base mt-1">Générateur d'états comptables</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Téléchargez les états généraux d'assainissement signés numériquement par le Directeur Technique municipal d'AKPBF.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/80 p-3.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-slate-200">
                <FileText className="h-5 w-5 text-rose-455" />
                <div>
                  <h5 className="font-black text-left text-xs">Rapport PDF Complet</h5>
                  <p className="text-[9px] text-slate-400 font-medium text-left">Pour le Conseil Municipal • Signé</p>
                </div>
              </div>
              {isExporting === 'pdf' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
              ) : (
                <Download className="h-4 w-4 text-slate-450" />
              )}
            </button>

            <button
              onClick={() => handleExport('excel')}
              disabled={isExporting !== null}
              className="w-full bg-slate-800 hover:bg-slate-750 border border-slate-700/80 p-3.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-slate-200">
                <FileSpreadsheet className="h-5 w-5 text-emerald-455" />
                <div>
                  <h5 className="font-black text-xs text-left">Tableau de Caisse Excel</h5>
                  <p className="text-[9px] text-slate-400 font-medium text-left font-mono">OM/WAVE/CASH • Rapprochement</p>
                </div>
              </div>
              {isExporting === 'excel' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
              ) : (
                <Download className="h-4 w-4 text-slate-450" />
              )}
            </button>
          </div>

          <div className="text-[9px] text-slate-400/80 text-center leading-normal">
            Généré conformément à la norme municipale UEMOA d'assainissement urbain.
          </div>
        </div>
      </div>
    </div>
  );
}
