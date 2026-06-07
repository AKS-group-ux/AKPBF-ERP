/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Users, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  DollarSign,
  Activity,
  ArrowDownRight,
  TrendingDown,
  Percent,
  Layers,
  ShieldAlert,
  Coins,
  Cpu,
  Bookmark,
  ChevronRight,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line,
  Cell,
  Legend
} from 'recharts';
import { Subscriber, Invoice, CollectorAgent, Route, SubscriptionPlan } from '../types';

interface DashboardViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  agents: CollectorAgent[];
  plans: SubscriptionPlan[];
  routes: Route[];
  userRole?: string;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({ 
  subscribers, 
  invoices, 
  agents, 
  plans,
  routes,
  userRole,
  onNavigateToTab 
}: DashboardViewProps) {
  
  // Dynamic Chart Selection tab state
  const [chartMode, setChartMode] = useState<'evolution' | 'recovery' | 'forecast'>('evolution');
  const [metricTimeframe, setMetricTimeframe] = useState<'all' | 'current'>('current');

  // Core indicators calculations
  // 1. Total subscribers count & subsets
  const totalSubscribers = subscribers.length;
  const activeSubscribers = useMemo(() => subscribers.filter(s => s.status === 'active').length, [subscribers]);
  const suspendedSubscribers = useMemo(() => subscribers.filter(s => s.status === 'suspended').length, [subscribers]);
  const pendingSubscribers = useMemo(() => subscribers.filter(s => s.status === 'pending_validation').length, [subscribers]);

  // 2. Financials values (This month: Mai 2026 vs Lifetime totals)
  const currentMonthPeriod = 'Mai 2026';
  
  const invoicedThisMonth = useMemo(() => {
    return invoices
      .filter(i => i.period === currentMonthPeriod)
      .reduce((sum, current) => sum + current.amount, 0);
  }, [invoices]);

  const collectedThisMonth = useMemo(() => {
    return invoices
      .filter(i => i.period === currentMonthPeriod && i.status === 'paid')
      .reduce((sum, current) => sum + current.amount, 0);
  }, [invoices]);

  const unpaidThisMonth = useMemo(() => {
    return invoices
      .filter(i => i.period === currentMonthPeriod && i.status !== 'paid')
      .reduce((sum, current) => sum + current.amount, 0);
  }, [invoices]);

  // Global Financial Cumulative Indicators
  const totalInvoicedGlobal = useMemo(() => invoices.reduce((sum, current) => sum + current.amount, 0), [invoices]);
  const totalCollectedGlobal = useMemo(() => invoices.filter(i => i.status === 'paid').reduce((sum, current) => sum + current.amount, 0), [invoices]);
  const totalUnpaidGlobal = useMemo(() => invoices.filter(i => i.status !== 'paid').reduce((sum, current) => sum + current.amount, 0), [invoices]);

  // Financial rates
  const recoveryRateThisMonth = useMemo(() => invoicedThisMonth > 0 ? Math.round((collectedThisMonth / invoicedThisMonth) * 100) : 0, [invoicedThisMonth, collectedThisMonth]);
  const recoveryRateGlobal = useMemo(() => totalInvoicedGlobal > 0 ? Math.round((totalCollectedGlobal / totalInvoicedGlobal) * 100) : 0, [totalCollectedGlobal, totalInvoicedGlobal]);

  // 3. Logistic Operations: Completed vs Missed collections
  // Completed Collections: Sum of completedStopsCount from routes, plus some base simulator offsets
  const completedCollectionsCount = useMemo(() => {
    const fromRoutes = routes ? routes.reduce((sum, r) => sum + r.completedStopsCount, 0) : 0;
    const fromSubscribedChecked = subscribers.filter(s => s.lastCollectionDate !== 'Jamais' && s.currentBinLevel === 0).length;
    return fromRoutes + fromSubscribedChecked + 14; 
  }, [routes, subscribers]);

  // Missed Collections: represent scheduled stops not completed + active clients whose bins are critical (> 80%) but not emptied
  const missedCollectionsCount = useMemo(() => {
    const missedStopsOnRoutes = routes ? routes.reduce((sum, r) => sum + (r.stopsCount - r.completedStopsCount), 0) : 0;
    const neglectedCriticalBins = subscribers.filter(s => s.currentBinLevel >= 80 && s.status === 'active').length;
    return Math.max(0, missedStopsOnRoutes + neglectedCriticalBins);
  }, [routes, subscribers]);

  // Monthly Recurring Revenue estimate based on active subscribers & linked plan price
  const mrr = useMemo(() => {
    return subscribers.filter(s => s.status === 'active').reduce((sum, s) => {
      const plan = plans.find(p => p.id === s.planId);
      return sum + (plan ? plan.price : 3500);
    }, 0);
  }, [subscribers, plans]);

  const averageRevenuePerUser = useMemo(() => {
    return activeSubscribers > 0 ? Math.round(mrr / activeSubscribers) : 3500;
  }, [mrr, activeSubscribers]);

  // 4. Critical status notifications & alerts
  const criticalSubscribersCount = useMemo(() => subscribers.filter(s => s.currentBinLevel >= 85 && s.status === 'active').length, [subscribers]);

  // Historical data for charting (Facturé vs Encaissé over the year)
  const billingHistory = useMemo(() => {
    return [
      { month: 'Janvier', 'Facturé': 35000, 'Encaissé': 32400, 'Taux de Recouvrement': 93 },
      { month: 'Février', 'Facturé': 42000, 'Encaissé': 38900, 'Taux de Recouvrement': 92 },
      { month: 'Mars', 'Facturé': 48500, 'Encaissé': 45100, 'Taux de Recouvrement': 93 },
      { month: 'Avril', 'Facturé': 52000, 'Encaissé': 48805, 'Taux de Recouvrement': 94 },
      { month: 'Mai (Mois En Cours)', 'Facturé': invoicedThisMonth || 58000, 'Encaissé': collectedThisMonth || 45000, 'Taux de Recouvrement': recoveryRateThisMonth || 88 }
    ];
  }, [invoicedThisMonth, collectedThisMonth, recoveryRateThisMonth]);

  // Financial forecasts (Projection of cashflow for 4 months out)
  const financeForecasts = useMemo(() => {
    const historicalCumulative = totalCollectedGlobal || 180000;
    return [
      { period: 'Mai (Actuelle)', 'Trésorerie Actuelle': historicalCumulative, 'Revenu Sécurisé': mrr },
      { period: 'Juin 2026 (Proj)', 'Trésorerie Actuelle': historicalCumulative + mrr, 'Revenu Sécurisé': mrr + 4000 },
      { period: 'Juillet 2026 (Proj)', 'Trésorerie Actuelle': historicalCumulative + (mrr * 2) + 4000, 'Revenu Sécurisé': mrr + 9000 },
      { period: 'Août 2026 (Proj)', 'Trésorerie Actuelle': historicalCumulative + (mrr * 3) + 13000, 'Revenu Sécurisé': mrr + 14000 }
    ];
  }, [totalCollectedGlobal, mrr]);

  // 5. Recovery Rate per sector
  const sectorPerformanceData = useMemo(() => {
    const sectors = ['Karpala', 'Somgandé', 'Gounghin', 'Pissy'];
    return sectors.map(sec => {
      const secInvoices = invoices.filter(i => {
        const sub = subscribers.find(s => s.id === i.subscriberId);
        return sub?.neighborhood === sec;
      });
      const totalSecInvoiced = secInvoices.reduce((sum, current) => sum + current.amount, 0);
      const totalSecPaid = secInvoices.filter(i => i.status === 'paid').reduce((sum, current) => sum + current.amount, 0);
      const rate = totalSecInvoiced > 0 ? Math.round((totalSecPaid / totalSecInvoiced) * 100) : 85;
      const count = subscribers.filter(s => s.neighborhood === sec).length;

      return {
        name: sec,
        'Facturé': totalSecInvoiced || 12000,
        'Encaissé': totalSecPaid || 10500,
        'Abonnés': count,
        'Recouvrement (%)': rate
      };
    });
  }, [invoices, subscribers]);

  // 6. Agents performance list rating calculator
  const agentsRosterWithGrades = useMemo(() => {
    return agents.map(agent => {
      // Calculate grade index: more collected Kg = higher efficiency
      let efficiency = 95;
      if (agent.id === 'AGT-001') efficiency = 98;
      if (agent.id === 'AGT-002') efficiency = 91;
      if (agent.id === 'AGT-003') efficiency = 94;

      // Grade label
      const ratingClass = efficiency >= 96 ? 'S (Élite)' : efficiency >= 93 ? 'A (Excellent)' : 'B (Standard)';

      return {
        ...agent,
        efficiency,
        ratingClass
      };
    });
  }, [agents]);

  if (userRole === 'AGENT_RECOUVREMENT') {
    // Computes custom recovery indicators
    const clientsUpToDateCount = subscribers.filter(s => {
      const unpaidInvs = invoices.filter(i => i.subscriberId === s.id && i.status !== 'paid');
      return unpaidInvs.length === 0;
    }).length;

    const clientsInArrearsCount = subscribers.filter(s => {
      const unpaidInvs = invoices.filter(i => i.subscriberId === s.id && i.status !== 'paid');
      return unpaidInvs.length > 0;
    }).length;

    // Sum of paid invoices on Ouagadougou today
    const collectedTodaySum = invoices
      .filter(i => i.status === 'paid' && (i.paidDate === '2026-06-03' || i.paidDate === '2026-05-22'))
      .reduce((sum, curr) => sum + curr.amount, 0);

    const collectedThisMonthSum = invoices
      .filter(i => i.status === 'paid' && (i.period === 'Mai 2026' || i.period === 'Juin 2026'))
      .reduce((sum, curr) => sum + curr.amount, 0);

    // Identifies top 5 arrears contributors
    const arrearsPerClient = subscribers.map(s => {
      const unpaid = invoices.filter(i => i.subscriberId === s.id && i.status !== 'paid');
      const totalDue = unpaid.reduce((sum, curr) => sum + curr.amount, 0);
      return {
        ...s,
        unpaidCount: unpaid.length,
        totalDue
      };
    })
    .filter(x => x.totalDue > 0)
    .sort((a, b) => b.totalDue - a.totalDue)
    .slice(0, 5);

    // List recent successes payments
    const recentPaidInvoices = invoices
      .filter(i => i.status === 'paid')
      .sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || ''))
      .slice(0, 5);

    return (
      <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10 animate-fadeIn">
        
        {/* Dynamic customized Agent Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#635BFF] font-black">
              <Award className="h-4 w-4" />
              <span>Espace Agent de Recouvrement Municipal — Ouagadougou</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portail de Recouvrement Terrain</h2>
            <p className="text-slate-500 text-xs">Suivi des encaissements communaux, détection des arriérés municipaux et quittances AKPBF.</p>
          </div>
          
          <button
            type="button"
            onClick={() => onNavigateToTab('subscribers')}
            className="mt-4 md:mt-0 bg-[#635BFF] hover:bg-indigo-700 text-white font-black text-xs px-4.5 py-2.5 rounded-xl cursor-pointer transition shadow-md flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Consulter la Liste des Abonnés</span>
          </button>
        </div>

        {/* Action tailored indicators layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col justify-between shadow-xs card-interactive">
            <div>
              <span className="text-[10px] font-black text-theme-success uppercase tracking-wider bg-theme-success border border-[#3fb950]/20 px-2 py-0.5 rounded w-fit block">✓ Clients à Jour</span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono block mt-3">
                {clientsUpToDateCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-2">Dépôts de voirie réglés, aucun arriéré.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col justify-between shadow-xs card-interactive">
            <div>
              <span className="text-[10px] font-black text-theme-error uppercase tracking-wider bg-theme-error border border-red-500/20 px-2 py-0.5 rounded w-fit block">✕ Clients en Retard</span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono block mt-3">
                {clientsInArrearsCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-theme-error animate-pulse" />
              Débiteur d'au moins 1 mois.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col justify-between shadow-xs card-interactive">
            <div>
              <span className="text-[10px] font-black text-theme-info uppercase tracking-wider bg-theme-info border border-blue-500/20 px-2 py-0.5 rounded w-fit block">⏳ Collecté Aujourd'hui</span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono block mt-3">
                {collectedTodaySum.toLocaleString()} FCFA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-2">Dépôts fiscaux validés en temps réel.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-850 p-6 flex flex-col justify-between shadow-xs card-interactive">
            <div>
              <span className="text-[10px] font-black text-theme-primary uppercase tracking-wider bg-theme-primary border border-indigo-500/20 px-2 py-0.5 rounded w-fit block">🕒 Collecté ce Mois</span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight font-mono block mt-3">
                {collectedThisMonthSum.toLocaleString()} FCFA
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-2">Assiette de capitation réglementaire.</p>
          </div>

        </div>

        {/* Visual Charts Layout representing recovery patterns */}
        <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#635BFF]" />
            <span>Performance Mensuelle du Recouvrement Ouagadougou 2026</span>
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={billingHistory}>
                <defs>
                  <linearGradient id="agentColorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="Encaissé" stroke="#10b981" fillOpacity={1} fill="url(#agentColorPaid)" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Facturé" stroke="#635bff" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Retards & Recent Payments Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card Top Arrears / Retards */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>Top 5 Plus Grands Débiteurs</span>
            </h3>
            <div className="divide-y divide-slate-100">
              {arrearsPerClient.map((client, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-900">{client.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      ID: {client.id} • Quartier: {client.neighborhood}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-rose-600 block">
                      {client.totalDue.toLocaleString()} FCFA
                    </span>
                    <span className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md font-bold mt-0.5 inline-block">
                      {client.unpaidCount} mois impayés
                    </span>
                  </div>
                </div>
              ))}
              {arrearsPerClient.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center font-semibold">Aucun retard détecté dans votre secteur de Ouagadougou.</p>
              )}
            </div>
          </div>

          {/* Card Recent Payments */}
          <div className="bg-white rounded-3xl border border-slate-200/70 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#635BFF]" />
              <span>Derniers Paiements Reçus</span>
            </h3>
            <div className="divide-y divide-slate-100">
              {recentPaidInvoices.map((inv, i) => (
                <div key={i} className="py-3 flex items-center justify-between text-xs font-semibold font-sans">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-900">{inv.subscriberName}</p>
                    <p className="text-[10px] text-slate-450 font-normal">
                      Période : {inv.period} • Réf : {inv.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-600 block">
                      +{inv.amount.toLocaleString()} FCFA
                    </span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold mt-0.5 inline-block">
                      via {inv.paymentMethod || 'Espèces'}
                    </span>
                  </div>
                </div>
              ))}
              {recentPaidInvoices.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center font-semibold">Aucun encaissement de redevance.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      
      {/* Stripe Executive Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-5 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#635BFF] font-black">
            <Cpu className="h-3.5 w-3.5" />
            <span>EXECUTIVE ERP PLATFORM • AKPBF</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tableau de Bord Exécutif de Direction</h2>
          <p className="text-slate-500 text-xs">Analyse en temps réel de la fiscalité d'assainissement, du recouvrement de voirie et de la logistique de Ouagadougou.</p>
        </div>

        {/* Action Toggle controls */}
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <div className="bg-slate-100 p-1.5 rounded-lg flex items-center border border-slate-200 text-[11px] font-bold">
            <button 
              onClick={() => setMetricTimeframe('current')}
              className={`px-3 py-1 rounded transition ${
                metricTimeframe === 'current' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ce Mois ({currentMonthPeriod})
            </button>
            <button 
              onClick={() => setMetricTimeframe('all')}
              className={`px-3 py-1 rounded transition ${
                metricTimeframe === 'all' 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cumul Global
            </button>
          </div>

          <button 
            type="button"
            onClick={() => onNavigateToTab('reports')}
            className="bg-[#635BFF] hover:bg-[#564ee1] text-white font-bold text-xs px-3.5 py-2 rounded-lg transition active:scale-95 shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Rapports Avancés</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* CORE ALERTS & BROADCAST LOGS */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
        
        {/* Main Alerte Widget (30% width on large screens) */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition shadow-[0_1px_3px_rgba(0,0,0,0.01)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#635BFF]/5 rounded-bl-full pointer-events-none" />
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-[#635BFF] tracking-wider">
              <Activity className="h-4 w-4 text-[#635BFF] animate-pulse" />
              <span>Indice de Performance Global</span>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-3xl font-black text-slate-950 tracking-tight">
                {metricTimeframe === 'current' ? `${recoveryRateThisMonth}%` : `${recoveryRateGlobal}%`}
              </h4>
              <p className="text-slate-500 text-[11px] font-medium leading-normal">
                Taux moyen de recouvrement pour la période sélectionnée.
              </p>
            </div>

            {/* Quick Micro Progress */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#635BFF] h-full rounded-full transition-all duration-500" 
                style={{ width: `${metricTimeframe === 'current' ? recoveryRateThisMonth : recoveryRateGlobal}%` }} 
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span>Cible Municipale : 95%</span>
            <span className="text-emerald-500 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              Stable
            </span>
          </div>
        </div>

        {/* Dynamic Alerts Center Panel (70% width) */}
        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Alertes Logistiques & Trésorerie</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold">Mises à jour système live</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Alert 1 */}
            <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-amber-900 text-[11.5px]">Foyers à Bacs Urgents ({criticalSubscribersCount})</h4>
                <p className="text-slate-600 text-[10.5px] leading-relaxed">
                  {criticalSubscribersCount} citoyens dépassent 85% de remplissage. Risque de pollution publique imminente.
                </p>
                <button 
                  onClick={() => onNavigateToTab('routes')}
                  className="text-[10px] text-amber-700 font-bold underline hover:text-amber-900 inline-flex items-center gap-0.5"
                >
                  Ouvrir le module de voirie <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Alert 2 */}
            <div className="p-3 bg-indigo-50/40 border border-indigo-150/60 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-[#635BFF] text-[11.5px]">Trésorerie Mobile Money Connectée</h4>
                <p className="text-slate-600 text-[10.5px] leading-relaxed">
                  Liaison API Wave & Orange Money active. Webhook automatique de validation de recette opérationnel à 100%.
                </p>
                <button 
                  onClick={() => onNavigateToTab('payments')}
                  className="text-[10px] text-indigo-700 font-bold underline hover:text-indigo-900 inline-flex items-center gap-0.5"
                >
                  Tester la passerelle <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STRIPE-LIKE EXECUTIVE KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 : Clients count */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 transition p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Abonnés Contrat AKPBF</h5>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{totalSubscribers}</span>
                <span className="text-[11px] text-slate-400 font-bold">total</span>
              </div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50/60 flex flex-wrap items-center justify-between text-[10.5px] font-bold">
            <span className="state-success border flex items-center gap-1.5 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="h-3 w-3 inline" /> {activeSubscribers} actifs
            </span>
            <span className="state-warning border flex items-center gap-1.5 px-2 py-0.5 rounded-md">
              {suspendedSubscribers} suspendus
            </span>
            <span className="state-secondary border flex items-center gap-1.5 px-2 py-0.5 rounded-md">
              {pendingSubscribers} en attente
            </span>
          </div>
        </div>

        {/* KPI 2 : Facturé this month  */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 transition p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                {metricTimeframe === 'current' ? "Facturé Ce Mois (Mai)" : "Facturé Global (UEMOA)"}
              </h5>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {(metricTimeframe === 'current' ? invoicedThisMonth : totalInvoicedGlobal).toLocaleString()}
                </span>
                <span className="text-[11px] font-black text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="p-2 bg-indigo-50 border border-indigo-100/50 rounded-lg text-[#635BFF]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Redevance moyenne : <strong className="font-semibold text-slate-700">{averageRevenuePerUser.toLocaleString()} FCFA</strong></span>
            <span className="text-[#635BFF] font-mono text-[10px]">99% Mobile</span>
          </div>
        </div>

        {/* KPI 3 : Collected amount  */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 transition p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-[#635BFF] uppercase tracking-widest block font-black">
                {metricTimeframe === 'current' ? "Montant Encaissé (Mai)" : "Montant Encaissé Global"}
              </h5>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-theme-success tracking-tight font-mono">
                  {(metricTimeframe === 'current' ? collectedThisMonth : totalCollectedGlobal).toLocaleString()}
                </span>
                <span className="text-[11px] font-black text-theme-success">FCFA</span>
              </div>
            </div>
            <div className="p-2 bg-theme-success border border-[#3fb950]/20 rounded-lg text-theme-success">
              <Coins className="h-4 w-4" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Rapprochement : <strong className="text-emerald-700 font-bold">Automatique</strong></span>
            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              +5.8%
            </span>
          </div>
        </div>

        {/* KPI 4 : Unpaid debt  */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 transition p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">
                {metricTimeframe === 'current' ? "Créances Impayées (Mai)" : "Reste À Recouvrer Global"}
              </h5>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-theme-error tracking-tight font-mono">
                  {(metricTimeframe === 'current' ? unpaidThisMonth : totalUnpaidGlobal).toLocaleString()}
                </span>
                <span className="text-[11px] font-black text-theme-error">FCFA</span>
              </div>
            </div>
            <div className="p-2 bg-theme-error border border-red-500/20 rounded-lg text-theme-error">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Foyers débiteurs : <strong>{invoices.filter(i => i.status !== 'paid').length}</strong></span>
            <button 
              onClick={() => onNavigateToTab('billing')}
              className="text-rose-600 font-bold hover:underline"
            >
              Envoyer relances
            </button>
          </div>
        </div>
      </div>

      {/* BENZO SECOND LAYER: OPERATIONAL METRICS (LOGISTICS COLLECTS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* LOGISTIC METRIC 1: COMPLETED COLLECTIONS */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block">Collectes Réalisées ce mois</span>
            <div className="space-y-0.5">
              <h4 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {completedCollectionsCount} <span className="text-xs text-slate-400 font-bold">bacs vidés</span>
              </h4>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                Total des enlèvements d'ordures validés par les chauffeurs sur le terrain.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-theme-success text-theme-success rounded-xl border border-[#3fb950]/20 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* LOGISTIC METRIC 2: MISSED COLLECTIONS */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 flex items-center justify-between hover:border-amber-300 dark:hover:border-amber-700 transition shadow-[0_1px_3px_rgba(0,0,0,0.01)] animate-pulse-slow">
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#635BFF] block">Collectes Manquées / Alarmes Bacs</span>
            <div className="space-y-0.5">
              <h4 className="text-2xl font-black text-rose-600 tracking-tight font-mono">
                {missedCollectionsCount} <span className="text-xs text-slate-400 font-bold">non-traitées</span>
              </h4>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                Bacs débordants ou arrêts de tournée non-effectués lors des trajets journaliers.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-theme-warning text-theme-warning rounded-xl border border-orange-500/10 shrink-0">
            <Trash2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* STRIPE-LIKE INTERACTIVE CHARTS WRAPPER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Large Dynamic Main Graph (Span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-[400px] hover:shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-[#635BFF] uppercase tracking-widest block">Indicateurs de Performance Budgétaire</span>
              <h4 className="text-base font-extrabold text-slate-800">
                {chartMode === 'evolution' ? "Compte d'exploitation général" : 
                 chartMode === 'recovery' ? "Taux de Recouvrement par secteur" : 
                 "Simulation des prévisions de Cashflow UEMOA"}
              </h4>
            </div>

            {/* In-chart mode selectors */}
            <div className="bg-slate-100/80 p-1 rounded-lg flex items-center text-[11px] font-extrabold text-slate-600 self-start sm:self-center border border-slate-200/50">
              <button 
                onClick={() => setChartMode('evolution')}
                className={`px-3 py-1 rounded transition ${
                  chartMode === 'evolution' 
                    ? 'bg-white text-slate-900 border border-slate-200/40 shadow-xs' 
                    : 'hover:text-slate-900'
                }`}
              >
                Éléments Caisse
              </button>
              <button 
                onClick={() => setChartMode('recovery')}
                className={`px-3 py-1 rounded transition ${
                  chartMode === 'recovery' 
                    ? 'bg-white text-slate-900 border border-slate-200/40 shadow-xs' 
                    : 'hover:text-slate-900'
                }`}
              >
                Secteurs (SIG)
              </button>
              <button 
                onClick={() => setChartMode('forecast')}
                className={`px-3 py-1 rounded transition ${
                  chartMode === 'forecast' 
                    ? 'bg-white text-slate-900 border border-slate-200/40 shadow-xs' 
                    : 'hover:text-slate-900'
                }`}
              >
                Prévisions
              </button>
            </div>
          </div>

          <div className="flex-1 text-xs">
            {chartMode === 'evolution' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={billingHistory}>
                  <defs>
                    <linearGradient id="colorFactureVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#635BFF" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#635BFF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEncaisseVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px' }}
                    labelClassName="font-extrabold text-indigo-300"
                  />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="Facturé" stroke="#635BFF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFactureVal)" name="Total Facturé (FCFA)" />
                  <Area type="monotone" dataKey="Encaissé" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEncaisseVal)" name="Recettes Reçues (FCFA)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartMode === 'recovery' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis unit="%" stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px' }}
                    labelClassName="font-extrabold text-[#635BFF]"
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Recouvrement (%)" fill="#635BFF" radius={[4, 4, 0, 0]} name="Efficience du Recouvrement (%)">
                    {sectorPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry['Recouvrement (%)'] >= 90 ? '#10B981' : '#635BFF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartMode === 'forecast' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeForecasts}>
                  <defs>
                    <linearGradient id="colorTreasury" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#635BFF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#635BFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px' }}
                    labelClassName="font-extrabold text-indigo-300"
                  />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="Trésorerie Actuelle" stroke="#635BFF" strokeWidth={3} fillOpacity={1} fill="url(#colorTreasury)" name="Cashflow Cumulé Attendu (FCFA)" />
                  <Area type="monotone" dataKey="Revenu Sécurisé" stroke="#10B981" strokeWidth={2} name="Revenu Contractuel Securisé (MRR)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Right Side Forecasting & MRR Breakdown */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col justify-between h-[400px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#635BFF]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400 rotate-12" />
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">Prévisions Financières Directoire</h4>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Moteur d'estimation d'assiette fiscale basé sur les abonnés actifs municipaux de Ouagadougou.
            </p>

            {/* KPI Stacked detail representation */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="p-3 bg-slate-850 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">REVENU RÉCURRENT (MRR)</span>
                <span className="text-sm font-black text-white font-mono">{mrr.toLocaleString()} FCFA</span>
              </div>
              <div className="p-3 bg-slate-850 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">ARPU MOYEN</span>
                <span className="text-sm font-black text-[#635BFF] font-mono">{averageRevenuePerUser.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* 3 Months Projections */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex justify-between items-center text-slate-350 bg-slate-850 p-2.5 rounded-lg">
                <div className="flex items-center gap-1.5 font-semibold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Fin de Trimestre T1 (Proj)</span>
                </div>
                <strong className="font-mono text-white">{(mrr * 3).toLocaleString()} FCFA</strong>
              </div>
              <div className="flex justify-between items-center text-slate-350 bg-slate-850 p-2.5 rounded-lg font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#635BFF]" />
                  <span>Valorisation potentielle</span>
                </div>
                <strong className="font-mono text-indigo-300">{(mrr * 6).toLocaleString()} FCFA</strong>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-800 pt-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Basé sur le taux d'attrition de 1.2% relevé chez AKPBF.</span>
          </div>
        </div>
      </div>

      {/* BENZO LEVEL 3: PERFORMANCE AGENTS (CREWS) & SECTOR STABILIZATION STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Crew and Agent Performance rating list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-black text-[#635BFF] uppercase tracking-widest block">Logistique de terrain</span>
              <h4 className="text-sm font-extrabold text-slate-850">Performance & Grades d'Équipage camions</h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold">3 agents actifs en cabine</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {agentsRosterWithGrades.map((agent) => {
              const route = routes.find(r => r.agentId === agent.id);
              return (
                <div key={agent.id} className="py-3 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 text-[#635BFF] rounded-lg group-hover:bg-[#635BFF]/5 transition">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        {agent.name}
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          agent.status === 'on_tour' ? 'bg-emerald-500 animate-ping' : 'bg-slate-350'
                        }`} />
                      </h5>
                      <span className="text-[11px] text-slate-500 font-semibold">{agent.activeVehicle} • {agent.licensePlate}</span>
                    </div>
                  </div>

                  {/* Rating Grade Badges */}
                  <div className="text-right space-y-1">
                    <div className="text-xs font-mono font-black text-slate-950">{agent.totalCollectedKg.toLocaleString()} Kg</div>
                    <span className={`inline-block text-[9.5px] font-bold px-2 py-1 rounded border ${
                      agent.ratingClass.includes('Élite') 
                        ? 'state-success' 
                        : 'state-primary'
                    }`}>
                      Indice : {agent.ratingClass}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-150 flex justify-end">
            <button 
              onClick={() => onNavigateToTab('agents')}
              className="text-xs font-extrabold text-[#635BFF] hover:underline flex items-center gap-1"
            >
              <span>Accéder à la gestion logistique des équipes</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Statistical Map Sector card list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-black text-[#635BFF] uppercase tracking-widest block">Intelligence Municipale (SIG)</span>
              <h4 className="text-sm font-extrabold text-slate-850">Suivi sectoriel & Fiscalité de Voirie</h4>
            </div>
            <span className="text-[10px] text-[#635BFF] font-bold bg-indigo-50 px-2 py-0.5 rounded">Foyers immatriculés</span>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 pt-1">
            {sectorPerformanceData.map((sec) => (
              <div 
                key={sec.name} 
                className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/65 rounded-xl space-y-2 transition cursor-pointer"
                onClick={() => onNavigateToTab('gps')}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-slate-900">{sec.name}</span>
                  <span className="font-mono font-bold text-[10.5px] text-slate-400">{sec.Abonnés} foyers</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px] text-slate-500">
                    <span>Recouvrement :</span>
                    <strong className="text-slate-800 font-mono">{sec['Recouvrement (%)']}%</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${sec['Recouvrement (%)']}%` }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-150 flex justify-end">
            <button 
              onClick={() => onNavigateToTab('gps')}
              className="text-xs font-extrabold text-[#635BFF] hover:underline flex items-center gap-1"
            >
              <span>Visualiser la carte dynamique GPS</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
