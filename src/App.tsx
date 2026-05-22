/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Users, 
  Trash2, 
  Coins, 
  Navigation, 
  Settings, 
  Layers, 
  Smartphone, 
  Award, 
  HelpCircle, 
  Menu, 
  X, 
  LogOut, 
  LayoutDashboard,
  Calendar,
  AlertCircle,
  CreditCard,
  MapPin,
  TrendingUp,
  LineChart,
  BookOpen,
  Sparkles,
  Camera,
  Cpu
} from 'lucide-react';

import { Subscriber, Invoice, CollectorAgent, Route, NotificationLog, SubscriptionPlan } from './types';
import { 
  INITIAL_PLANS, 
  INITIAL_SUBSCRIBERS, 
  INITIAL_AGENTS, 
  INITIAL_ROUTES, 
  INITIAL_INVOICES, 
  INITIAL_NOTIFS 
} from './mockData';
import { generateAllDemoData } from './demo_generator';

// Sub views imports
import DashboardView from './components/DashboardView';
import SubscribersView from './components/SubscribersView';
import BillingView from './components/BillingView';
import RoutesView from './components/RoutesView';
import AgentsView from './components/AgentsView';
import NotificationsView from './components/NotificationsView';
import ArchitectHub from './components/ArchitectHub';

// New missing views imports
import SubscriptionPlansView from './components/SubscriptionPlansView';
import PaymentsView from './components/PaymentsView';
import ReportsView from './components/ReportsView';
import GpsMapView from './components/GpsMapView';
import UnpaidDebtsView from './components/UnpaidDebtsView';
import BinsManagementView from './components/BinsManagementView';
import AiPredictionsView from './components/AiPredictionsView';
import ClientPortalView from './components/ClientPortalView';

const LOCAL_STORAGE_KEY = 'akpbf_erp_state_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Core municipal database states including subscription plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agents, setAgents] = useState<CollectorAgent[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>([]);

  // Load state from local storage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPlans(parsed.plans && parsed.plans.length > 0 ? parsed.plans : generateAllDemoData().plans);
        setSubscribers(parsed.subscribers && parsed.subscribers.length > 0 ? parsed.subscribers : generateAllDemoData().subscribers);
        setInvoices(parsed.invoices && parsed.invoices.length > 0 ? parsed.invoices : generateAllDemoData().invoices);
        setAgents(parsed.agents && parsed.agents.length > 0 ? parsed.agents : generateAllDemoData().agents);
        setRoutes(parsed.routes && parsed.routes.length > 0 ? parsed.routes : generateAllDemoData().routes);
        setNotifLogs(parsed.notifLogs && parsed.notifLogs.length > 0 ? parsed.notifLogs : generateAllDemoData().notifLogs);
      } catch (e) {
        console.error('Error parsing local storage ERP state - loading high fidelity presets', e);
        loadInitialPresets();
      }
    } else {
      loadInitialPresets();
    }
  }, []);

  // Helper method to reload initials with high-fidelity AKPBF simulated databases
  const loadInitialPresets = () => {
    const demo = generateAllDemoData();
    setPlans(demo.plans);
    setSubscribers(demo.subscribers);
    setInvoices(demo.invoices);
    setAgents(demo.agents);
    setRoutes(demo.routes);
    setNotifLogs(demo.notifLogs);
    saveStateToLocalStorage(demo.plans, demo.subscribers, demo.invoices, demo.agents, demo.routes, demo.notifLogs);
  };

  // Sync state to local storage when state modifications occur
  const saveStateToLocalStorage = (
    currentPlans: SubscriptionPlan[],
    subs: Subscriber[],
    invs: Invoice[],
    agts: CollectorAgent[],
    rts: Route[],
    notifs: NotificationLog[]
  ) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      plans: currentPlans,
      subscribers: subs,
      invoices: invs,
      agents: agts,
      routes: rts,
      notifLogs: notifs
    }));
  };

  // Plans Management
  const handleAddPlan = (newPlan: SubscriptionPlan) => {
    const updated = [...plans, newPlan];
    setPlans(updated);
    saveStateToLocalStorage(updated, subscribers, invoices, agents, routes, notifLogs);
  };

  const handleUpdatePlan = (updatedPlan: SubscriptionPlan) => {
    const updated = plans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setPlans(updated);
    saveStateToLocalStorage(updated, subscribers, invoices, agents, routes, notifLogs);
  };

  const handleDeletePlan = (id: string) => {
    const updated = plans.filter(p => p.id !== id);
    setPlans(updated);
    saveStateToLocalStorage(updated, subscribers, invoices, agents, routes, notifLogs);
  };

  // State modification wrappers
  const handleAddSubscriber = (newSub: Subscriber) => {
    const updated = [newSub, ...subscribers];
    setSubscribers(updated);
    saveStateToLocalStorage(plans, updated, invoices, agents, routes, notifLogs);

    // Auto-spawn enrollment notification log
    const enrollmentSmsLog: NotificationLog = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: newSub.name,
      recipientContact: newSub.phone,
      type: 'sms',
      templateName: 'Enrôlement Service',
      content: `AKPBF : Bienvenue ! Votre dossier de salubrité a été validé sous le contrat ${newSub.id}. Un bac de type ${newSub.binType} sera livré d'ici 24h.`,
      sentAt: 'A l\'instant',
      status: 'sent'
    };
    const updatedNotifs = [enrollmentSmsLog, ...notifLogs];
    setNotifLogs(updatedNotifs);
    saveStateToLocalStorage(plans, updated, invoices, agents, routes, updatedNotifs);
  };

  const handleUpdateSubscriber = (updatedSub: Subscriber) => {
    const updated = subscribers.map(s => s.id === updatedSub.id ? updatedSub : s);
    setSubscribers(updated);
    saveStateToLocalStorage(plans, updated, invoices, agents, routes, notifLogs);
  };

  const handleDeleteSubscriber = (id: string) => {
    const updated = subscribers.filter(s => s.id !== id);
    setSubscribers(updated);
    // Filter out his related pending bills as well for consistent ledger metrics
    const updatedInvs = invoices.filter(i => i.subscriberId !== id);
    setInvoices(updatedInvs);
    saveStateToLocalStorage(plans, updated, updatedInvs, agents, routes, notifLogs);
  };

  const handleGenerateMonthlyInvoices = (period: string) => {
    // Generate an invoice for every active subscriber who doesn't have one for this period
    const newInvoices: Invoice[] = [];

    subscribers.forEach(sub => {
      if (sub.status !== 'active') return;

      const hasInvoiceForPeriod = invoices.some(i => i.subscriberId === sub.id && i.period === period);
      if (hasInvoiceForPeriod) return;

      const plan = plans.find(p => p.id === sub.planId);
      const amount = plan ? plan.price : 3550;

      newInvoices.push({
        id: `FAC-2026-${Math.floor(100 + Math.random() * 900)}`,
        subscriberId: sub.id,
        subscriberName: sub.name,
        amount,
        dueDate: '2026-06-10',
        issueDate: '2026-05-22',
        status: 'pending',
        period
      });
    });

    if (newInvoices.length > 0) {
      const updatedInvs = [...newInvoices, ...invoices];
      setInvoices(updatedInvs);
      
      // Emit system SMS alert for new billing period
      const newNotifLogs: NotificationLog[] = newInvoices.map(inv => ({
        id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: inv.subscriberName,
        recipientContact: subscribers.find(s=>s.id === inv.subscriberId)?.phone || '+225 00 00 00 00',
        type: 'sms',
        templateName: 'Nouvelle Facture',
        content: `AKPBF ALERTE : Votre facture de redevance pour la période ${period} a été émise (${inv.amount} FCFA). Échéance exigible le ${inv.dueDate}. Réglable via Wave ou Orange Money.`,
        sentAt: 'À l\'instant',
        status: 'sent'
      }));

      const updatedNotifs = [...newNotifLogs, ...notifLogs];
      setNotifLogs(updatedNotifs);

      // Set subscriber payment statuses to unpaid for billing run transparency
      const updatedSubs = subscribers.map(s => {
        const found = newInvoices.some(inv => inv.subscriberId === s.id);
        if (found) {
          return { ...s, paymentStatus: 'unpaid' as const };
        }
        return s;
      });
      setSubscribers(updatedSubs);

      saveStateToLocalStorage(plans, updatedSubs, updatedInvs, agents, routes, updatedNotifs);
    }
  };

  const handlePayInvoice = (invoiceId: string, method: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces') => {
    const updatedInvs = invoices.map(i => {
      if (i.id === invoiceId) {
        return { 
          ...i, 
          status: 'paid' as const, 
          paymentMethod: method, 
          paidDate: '2026-05-22' 
        };
      }
      return i;
    });

    setInvoices(updatedInvs);

    // Get invoice subscriber id
    const matchedInvoice = invoices.find(i => i.id === invoiceId);
    let updatedSubs = subscribers;
    if (matchedInvoice) {
      updatedSubs = subscribers.map(s => {
        if (s.id === matchedInvoice.subscriberId) {
          return { ...s, paymentStatus: 'paid' as const, status: 'active' as const };
        }
        return s;
      });
      setSubscribers(updatedSubs);

      // Emit cashier SMS receipt log
      const cashierReceiptNotif: NotificationLog = {
        id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: matchedInvoice.subscriberName,
        recipientContact: subscribers.find(s=>s.id === matchedInvoice.subscriberId)?.phone || '+225 00 00 00',
        type: 'sms',
        templateName: 'Validation Paiement',
        content: `AKPBF REÇU : Paiement de ${matchedInvoice.amount} FCFA imputé avec succès sur la facture ${invoiceId} par ${method}. Votre service de voirie reste actif !`,
        sentAt: 'À l\'instant',
        status: 'sent'
      };
      const updatedNotifs = [cashierReceiptNotif, ...notifLogs];
      setNotifLogs(updatedNotifs);

      saveStateToLocalStorage(plans, updatedSubs, updatedInvs, agents, routes, updatedNotifs);
    }
  };

  const handleSendMockReminders = () => {
    // Send standard SMS alerts for any non-paid bills
    const overdueInvs = invoices.filter(i => i.status === 'overdue' || i.status === 'unpaid');
    
    const newLogs: NotificationLog[] = overdueInvs.map(inv => ({
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: inv.subscriberName,
      recipientContact: subscribers.find(s=>s.id === inv.subscriberId)?.phone || '+225 00 00',
      type: 'sms',
      templateName: 'Rappel de redevance',
      content: `RELANCE AKPBF : Sauf erreur fiscale de notre part, votre titre de recette de Mai (${inv.amount} FCFA) est impayé. Veuillez régulariser d'urgence via portail.`,
      sentAt: 'À l\'instant',
      status: 'sent'
    }));

    if (newLogs.length > 0) {
      const updatedNotifs = [...newLogs, ...notifLogs];
      setNotifLogs(updatedNotifs);
      
      // Update subscriber statuses to overdue
      const updatedSubs = subscribers.map(s => {
        const hasOverdue = overdueInvs.some(inv => inv.subscriberId === s.id);
        if (hasOverdue) {
          return { ...s, paymentStatus: 'overdue' as const };
        }
        return s;
      });
      setSubscribers(updatedSubs);

      saveStateToLocalStorage(plans, updatedSubs, invoices, agents, routes, updatedNotifs);
    }
  };

  const handleAddRoute = (newRoute: Route) => {
    const updated = [newRoute, ...routes];
    setRoutes(updated);

    // Update agent status if selected
    let updatedAgents = agents;
    if (newRoute.agentId) {
      updatedAgents = agents.map(a => a.id === newRoute.agentId ? { ...a, status: 'on_tour' as const } : a);
      setAgents(updatedAgents);
    }

    saveStateToLocalStorage(plans, subscribers, invoices, updatedAgents, updated, notifLogs);
  };

  const handleUpdateRoute = (updatedRoute: Route) => {
    const updated = routes.map(r => r.id === updatedRoute.id ? updatedRoute : r);
    setRoutes(updated);

    // Toggle agent status depending on route status completion
    let updatedAgents = agents;
    if (updatedRoute.agentId) {
      const activeStatus = updatedRoute.status === 'active' ? 'on_tour' as const : 'idle' as const;
      updatedAgents = agents.map(a => a.id === updatedRoute.agentId ? { ...a, status: activeStatus } : a);
      setAgents(updatedAgents);
    }

    saveStateToLocalStorage(plans, subscribers, invoices, updatedAgents, updated, notifLogs);
  };

  const handleUpdateSubscriberBin = (id: string, level: number) => {
    const updated = subscribers.map(s => {
      if (s.id === id) {
        // Record last collection date if bin level set to 0%
        return { 
          ...s, 
          currentBinLevel: level,
          lastCollectionDate: level === 0 ? '22 Mai 2026' : s.lastCollectionDate
        };
      }
      return s;
    });
    setSubscribers(updated);
    saveStateToLocalStorage(plans, updated, invoices, agents, routes, notifLogs);
  };

  const handleUpdateAgentCollected = (agentId: string, addedKg: number) => {
    const updated = agents.map(a => a.id === agentId ? { ...a, totalCollectedKg: a.totalCollectedKg + addedKg } : a);
    setAgents(updated);
    saveStateToLocalStorage(plans, subscribers, invoices, updated, routes, notifLogs);
  };

  const handleAddAgent = (newAgent: CollectorAgent) => {
    const updated = [newAgent, ...agents];
    setAgents(updated);
    saveStateToLocalStorage(plans, subscribers, invoices, updated, routes, notifLogs);
  };

  const handleDeleteAgent = (id: string) => {
    const updated = agents.filter(a => a.id !== id);
    setAgents(updated);
    saveStateToLocalStorage(plans, subscribers, invoices, updated, routes, notifLogs);
  };

  // Switch helper
  const handleNavToTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      
      {/* MOBILE HEADER RESPONSIVE TOGGLE */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-650 p-1 rounded-lg text-white font-black text-xs">AKPBF</div>
          <span className="font-extrabold text-sm tracking-tight text-white">AKPBF ERP Salubrité</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 px-2 border border-slate-700 bg-slate-800 rounded hover:bg-slate-700 active:scale-95 transition"
        >
          {isSidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </header>

      {/* SIDEBAR MAIN MENU NAVIGATION PANEL */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800 text-slate-300 w-64 p-5 flex flex-col justify-between transition-transform duration-250 ease-in-out shrink-0 h-screen overflow-y-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Logo seal */}
          <div className="flex items-center gap-2 pb-3.5 border-b border-slate-800 shrink-0">
            <div className="bg-emerald-500 text-white font-black text-xs p-1.5 rounded-lg font-mono">AKPBF</div>
            <div>
              <h1 className="font-black text-white text-md tracking-tight">AKPBF Salubrité</h1>
              <span className="text-[10px] text-emerald-400 font-bold block">LOGICIEL MUNICIPAL</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1 my-4 flex-1">
            <div className="pb-3 border-b border-slate-800/80 mb-3.5">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block px-3 mb-1.5 font-mono">ESPACE CITOYENS</span>
              <button 
                type="button"
                onClick={() => { setActiveTab('client_portal'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs transition duration-150 ${
                  activeTab === 'client_portal' 
                    ? 'bg-amber-600 text-white font-bold rounded-xl border-l-4 border-amber-400 shadow-md' 
                    : 'bg-emerald-950/35 hover:bg-emerald-900/45 text-emerald-400 font-bold border border-emerald-900/50 rounded-xl'
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0 text-amber-400 animate-bounce" />
                PROPORTAL CLIENT (Stripe)
              </button>
            </div>

            <button 
              type="button"
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'dashboard' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              Tableau de Bord
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('subscribers'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'subscribers' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              Gestion des Abonnés
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('bins'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'bins' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Camera className="h-4 w-4 shrink-0 text-emerald-500" />
              Gestion des Poubelles
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('ai'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'ai' 
                  ? 'bg-slate-800 text-amber-400 font-bold border-l-4 border-amber-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Cpu className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
              Prévisions IA & Assistant
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('plans'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'plans' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              Abonnements (Forfaits)
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('billing'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'billing' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Coins className="h-4 w-4 shrink-0" />
              Facturation - Caisse
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('payments'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'payments' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              Paiements & Trésorerie
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('unpaid_debts'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'unpaid_debts' 
                  ? 'bg-slate-800 text-amber-400 font-bold border-l-4 border-amber-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              Gestion des Impayés
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('routes'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'routes' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Navigation className="h-4 w-4 shrink-0" />
              Tournées (SIG)
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('gps'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'gps' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              Carte GPS Live
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'reports' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              Rapports & Stats
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('agents'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'agents' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Award className="h-4 w-4 shrink-0" />
              Agents & Équipages
            </button>

            <button 
              type="button"
              onClick={() => { setActiveTab('notifications'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition duration-150 ${
                activeTab === 'notifications' 
                  ? 'bg-slate-800 text-emerald-400 font-bold border-l-4 border-emerald-500 rounded-r-xl' 
                  : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
              }`}
            >
              <Smartphone className="h-4 w-4 shrink-0" />
              Canaux d'Alerte SMS
            </button>
            
            <div className="pt-3 border-t border-slate-800 mt-3 block">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-3 mb-1.5">Documentation</span>
              <button 
                type="button"
                onClick={() => { setActiveTab('architect_hub'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-2 py-2 text-xs transition duration-150 ${
                  activeTab === 'architect_hub' 
                    ? 'bg-emerald-600/90 text-white font-bold rounded-xl' 
                    : 'hover:bg-slate-800/60 text-slate-400 font-semibold hover:text-slate-200 rounded-xl'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                Portail de l'Architecte
              </button>
            </div>
          </nav>
        </div>

        {/* Footer/Reset default database presets */}
        <div className="space-y-3 pt-3.5 border-t border-slate-800 text-left shrink-0">
          <div className="p-2 bg-slate-850 rounded-lg text-[10px] text-slate-500 flex items-center gap-1.5 leading-normal">
            <AlertCircle className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>Mode Demonstration UEMOA</span>
          </div>
          <button 
            type="button"
            onClick={() => { loadInitialPresets(); localStorage.removeItem(LOCAL_STORAGE_KEY); location.reload(); }}
            className="w-full text-left text-[11px] font-bold text-slate-500 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-slate-850 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            Réinitialiser les données
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER PANEL */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen">
        
        {/* UPPER CONSOLE BAR */}
        <header className="hidden md:flex bg-white border-b border-slate-100 px-6 py-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <Calendar className="h-3.5 w-3.5 text-indigo-550" />
            <span>Aujourd'hui : 22 Mai 2026</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Base PostgreSQL : Connectée (Simulée)</span>
            </div>
            
            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold font-mono text-xs">
                AD
              </div>
              <span>Admin AKPBF</span>
            </div>
          </div>
        </header>

        {/* INNER SCROLL CONTENT - VIEWS SWITCH */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView 
              subscribers={subscribers} 
              invoices={invoices} 
              agents={agents} 
              plans={plans}
              routes={routes}
              onNavigateToTab={handleNavToTab}
            />
          )}

          {activeTab === 'subscribers' && (
            <SubscribersView 
              subscribers={subscribers} 
              plans={plans}
              onAddSubscriber={handleAddSubscriber}
              onUpdateSubscriber={handleUpdateSubscriber}
              onDeleteSubscriber={handleDeleteSubscriber}
            />
          )}

          {activeTab === 'bins' && (
            <BinsManagementView 
              subscribers={subscribers}
              onUpdateSubscriber={handleUpdateSubscriber}
            />
          )}

          {activeTab === 'ai' && (
            <AiPredictionsView 
              subscribers={subscribers}
              invoices={invoices}
              plans={plans}
              routes={routes}
              onNavigateToTab={handleNavToTab}
            />
          )}

          {activeTab === 'plans' && (
            <SubscriptionPlansView 
              plans={plans}
              subscribers={subscribers}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView 
              invoices={invoices} 
              subscribers={subscribers}
              plans={plans}
              onGenerateMonthlyInvoices={handleGenerateMonthlyInvoices}
              onPayInvoice={handlePayInvoice}
              onSendMockReminders={handleSendMockReminders}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView 
              invoices={invoices}
              subscribers={subscribers}
              onPayInvoice={handlePayInvoice}
            />
          )}

          {activeTab === 'unpaid_debts' && (
            <UnpaidDebtsView 
              subscribers={subscribers}
              invoices={invoices}
              plans={plans}
              onUpdateSubscriber={handleUpdateSubscriber}
              onPayInvoice={handlePayInvoice}
              onAddNotification={(newNotif) => {
                const updated = [newNotif, ...notifLogs];
                setNotifLogs(updated);
                saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, updated);
              }}
            />
          )}

          {activeTab === 'routes' && (
            <RoutesView 
              routes={routes} 
              subscribers={subscribers} 
              agents={agents}
              onAddRoute={handleAddRoute}
              onUpdateRoute={handleUpdateRoute}
              onUpdateSubscriberBin={handleUpdateSubscriberBin}
              onUpdateAgentCollected={handleUpdateAgentCollected}
            />
          )}

          {activeTab === 'gps' && (
            <GpsMapView 
              subscribers={subscribers}
              agents={agents}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView 
              subscribers={subscribers}
              invoices={invoices}
              plans={plans}
            />
          )}

          {activeTab === 'agents' && (
            <AgentsView 
              agents={agents} 
              onAddAgent={handleAddAgent}
              onDeleteAgent={handleDeleteAgent}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView logs={notifLogs} />
          )}

          {activeTab === 'client_portal' && (
            <ClientPortalView 
              subscribers={subscribers}
              invoices={invoices}
              plans={plans}
              routes={routes}
              onUpdateSubscriber={handleUpdateSubscriber}
              onPayInvoice={handlePayInvoice}
              onAddNotification={(newNotif) => {
                const logs = [newNotif, ...notifLogs];
                setNotifLogs(logs);
                saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, logs);
              }}
            />
          )}

          {activeTab === 'architect_hub' && (
            <ArchitectHub />
          )}
        </div>
      </main>
    </div>
  );
}
