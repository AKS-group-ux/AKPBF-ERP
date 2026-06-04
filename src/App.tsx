/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
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
  Cpu,
  Mail,
  FileText,
  Shield
} from 'lucide-react';

import { Subscriber, Invoice, CollectorAgent, Route, NotificationLog, SubscriptionPlan, SubscriptionHistoryLog, Contract, ContractTemplate, PaymentReceipt, Emplacement, CollectionProof } from './types';
import { 
  INITIAL_PLANS, 
  INITIAL_SUBSCRIBERS, 
  INITIAL_AGENTS, 
  INITIAL_ROUTES, 
  INITIAL_INVOICES, 
  INITIAL_NOTIFS,
  INITIAL_EMPLACEMENTS
} from './mockData';
import { generateAllDemoData } from './demo_generator';

// Sub views imports
import DashboardView from './components/DashboardView';
import SubscribersView from './components/SubscribersView';
import BillingView from './components/BillingView';
import RoutesView from './components/RoutesView';
import AgentsView from './components/AgentsView';
import NotificationsView from './components/NotificationsView';
import EmailsManagementView from './components/EmailsManagementView';
import ArchitectHub from './components/ArchitectHub';

// New missing views imports
import SubscriptionPlansView from './components/SubscriptionPlansView';
import ContractsView from './components/ContractsView';
import PaymentsView from './components/PaymentsView';
import QuickPaymentView from './components/QuickPaymentView';
import ReportsView from './components/ReportsView';
import GpsMapView from './components/GpsMapView';
import UnpaidDebtsView from './components/UnpaidDebtsView';
import BinsManagementView from './components/BinsManagementView';
import AiPredictionsView from './components/AiPredictionsView';
import { BrowserRouter as Router, Routes, Route as RouterRoute, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ClientPortalView from './components/ClientPortalView';
import UnifiedAuth from './components/UnifiedAuth';
import RegisterPage from './components/RegisterPage';
import SubscriberDetailView from './components/SubscriberDetailView';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Enterprise ERP Modules imports
import AccountingView from './components/AccountingView';
import ExpensesView from './components/ExpensesView';
import StockView from './components/StockView';
import FleetView from './components/FleetView';
import HrView from './components/HrView';

import UserProfileMenu from './components/UserProfileMenu';
import EmplacementsView from './components/EmplacementsView';
import ThemeToggle from './components/ThemeToggle';
import UsersManagementView from './components/UsersManagementView';

const INITIAL_TEMPLATES: ContractTemplate[] = [
  {
    id: 'tpl_standard',
    name: 'Contrat d\'Abonnement Standard Particulier',
    status: 'active',
    body: `CONTRAT DE PRESTATION DE SERVICE SALUBRITÉ AKPBF
Numéro du contrat : {{contract_number}}
Client Citoyen d'Abidjan : {{client_name}} (N° Citoyen: {{client_number}})

Il est d'un commun accord convenu ce qui suit entre AKPBF Salubrité Urbaine (contact : {{company_phone}} / {{company_email}}) et l'Abonné(e) désigné(e) ci-dessus :

1. Prestation : AKPBF met à disposition un bac standard d'enlèvement et effectuera le ramassage planifié à l'adresse indiquée.
2. Formule Souscrite : {{subscription_name}} au prix mensuel fixe de {{subscription_price}}.
3. Période de validité : Le présent engagement prend effet le {{start_date}} et restera d'application stricte jusqu'au {{end_date}}.

Fait à Abidjan, Côte d'Ivoire.`
  },
  {
    id: 'tpl_premium',
    name: 'Contrat d\'Abonnement Premium Famille',
    status: 'active',
    body: `CONTRAT PREMIUM RESIDENTIEL - AKPBF CODY
Réf Contrat : {{contract_number}}
Bénéficiaire : {{client_name}} (ID Mairie: {{client_number}})

Conclu sous l'égide de la mairie d'Abidjan pour la salubrité publique :

- Type de forfait : {{subscription_name}}
- Redevance mensuelle : {{subscription_price}}
- Date de prise d'effet : {{start_date}}
- Échéance contractuelle : {{end_date}}

Une redevance due de {{subscription_price}} est payable par prélèvement ou Mobile Money (Orange Money/Wave) au début de chaque mois. En cas d'inexécution sous un délai de 30 jours, le service d'enlèvement sera suspendu de plein droit.

Signé électroniquement en direct.`
  },
  {
    id: 'tpl_pro',
    name: 'Convention de Salubrité et d\'Hygiène Commerciale B2B',
    status: 'active',
    body: `CONVENTION COMMERCIALE D'ENLÈVEMENT DE DÉCHETS B2B
Contrat N° : {{contract_number}}
Partenaire B2B : {{client_name}} (N° de registre : {{client_number}})

Le prestataire {{company_name}} s'engage à vider sur un plan quotidien (Lundi au Samedi) les conteneurs du client.

Conditions Financières:
- Abonnement : {{subscription_name}}
- Redevance Mensuelle : {{subscription_price}}
- Engagement : Du {{start_date}} au {{end_date}}

Contact assistance B2B : {{company_phone}} / {{company_email}}.`
  }
];

function generateInitialContracts(): Contract[] {
  return [
    {
      id: 'CNT-2026-6081',
      contractNumber: 'CNT-2026-6081',
      subscriberId: 'SUB-4029',
      subscriberName: 'Koffi Jean-Jacques',
      planId: 'plan_eco',
      planName: 'Standard Municipal',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      amount: 3500,
      status: 'active',
      signatureDate: '2026-01-01',
      termsAndConditions: `CONTRAT DE PRESTATION DE SERVICE SALUBRITÉ AKPBF\nNuméro du contrat : CNT-2026-6081\nClient Citoyen d'Abidjan : Koffi Jean-Jacques (N° Citoyen: SUB-4029)\n\nIl est d'un commun accord convenu ce qui suit entre AKPBF Salubrité Urbaine (contact : +225 27 22 45 61 / contact@salubrite.akpbf.ci) et l'Abonné(e) désigné(e) ci-dessus :\n\n1. Prestation : AKPBF met à disposition un bac standard d'enlèvement et effectuera le ramassage planifié à l'adresse indiquée.\n2. Formule Souscrite : Standard Municipal au prix mensuel fixe de 3 500 FCFA.\n3. Période de validité : Le présent engagement prend effet le 2026-01-01 et restera d'application stricte jusqu'au 2026-12-31.\n\nFait à Abidjan, Côte d'Ivoire.`
    },
    {
      id: 'CNT-2026-1933',
      contractNumber: 'CNT-2026-1933',
      subscriberId: 'SUB-1933',
      subscriberName: 'Soro Aminata',
      planId: 'plan_pro',
      planName: 'Professionnel & Commerce',
      startDate: '2026-02-01',
      endDate: '2027-01-31',
      amount: 15000,
      status: 'active',
      signatureDate: '2026-02-01',
      termsAndConditions: `CONVENTION COMMERCIALE D'ENLÈVEMENT DE DÉCHETS B2B\nContrat N° : CNT-2026-1933\nPartenaire B2B : Soro Aminata (N° de registre : SUB-1933)\n\nLe prestataire AKPBF s'engage à vider sur un plan quotidien (Lundi au Samedi) les conteneurs du client.\n\nConditions Financières:\n- Abonnement : Professionnel & Commerce\n- Redevance Mensuelle : 15 005 FCFA\n- Engagement : Du 2026-02-01 au 2027-01-31\n\nContact assistance B2B : +225 27 22 45 61 / contact@salubrite.akpbf.ci.`
    },
    {
      id: 'CNT-2026-8842',
      contractNumber: 'CNT-2026-8842',
      subscriberId: 'SUB-8842',
      subscriberName: 'Mamadou Diallo',
      planId: 'plan_eco',
      planName: 'Standard Municipal',
      startDate: '2025-10-01',
      endDate: '2026-09-30',
      amount: 3500,
      status: 'suspended',
      signatureDate: '2025-10-01',
      termsAndConditions: `CONTRAT DE PRESTATION DE SERVICE SALUBRITÉ AKPBF\nNuméro du contrat : CNT-2026-8842\nClient Citoyen d'Abidjan : Mamadou Diallo (N° Citoyen: SUB-8842)\n\nIl est d'un commun accord convenu ce qui suit entre AKPBF Salubrité Urbaine et l'Abonné(e) désigné(e) ci-dessus :\n\n- Type de forfait : Standard Municipal au prix mensuel fixe de 3 500 FCFA.\n- Engagement : Du 2025-10-01 au 2026-09-30.`
    }
  ];
}

function generateInitialCollectionProofs(): CollectionProof[] {
  return [
    {
      id: "PRF-1042",
      collectionDate: "2026-05-20",
      collectionTime: "07:29",
      clientId: "SUB-4029",
      clientName: "Koffi Jean-Jacques",
      contractRef: "CNT-2026-6081",
      planName: "Contrat Premium (3 passages)",
      agentName: "Agent Kouassi (Camion B04)",
      vehiclePlate: "CI-225-B04",
      status: "Complétée",
      comments: "Poids résiduel collecté : 12 Kg • Statut : Traitée",
      photoBeforeUrl: "https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60",
      photoAfterUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60",
      gpsLatitude: 5.3489,
      gpsLongitude: -3.9995,
      clientSignature: "STAMP-E-104288",
      qrCodeVal: "RFID-SUB-4029"
    },
    {
      id: "PRF-884",
      collectionDate: "2026-05-16",
      collectionTime: "08:05",
      clientId: "SUB-1933",
      clientName: "Soro Aminata",
      contractRef: "CNT-2026-1933",
      planName: "Professionnel & Commerce",
      agentName: "Agent Kouassi (Camion B04)",
      vehiclePlate: "CI-225-B42",
      status: "Complétée",
      comments: "Poids résiduel collecté : 9 Kg • Statut : Traitée",
      photoBeforeUrl: "https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60",
      photoAfterUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60",
      gpsLatitude: 5.3512,
      gpsLongitude: -4.0012,
      clientSignature: "STAMP-E-884023",
      qrCodeVal: "RFID-SUB-1933"
    },
    {
      id: "PRF-221",
      collectionDate: "2026-05-10",
      collectionTime: "07:15",
      clientId: "SUB-8842",
      clientName: "Mamadou Diallo",
      contractRef: "CNT-2026-8842",
      planName: "Standard Municipal (1 passage)",
      agentName: "Agent Coulibaly (Camion C08)",
      vehiclePlate: "CI-225-C08",
      status: "Complétée",
      comments: "Prise en charge régulière. Matériel inspecté.",
      photoBeforeUrl: "https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60",
      photoAfterUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60",
      gpsLatitude: 5.3456,
      gpsLongitude: -3.9876,
      clientSignature: "STAMP-E-221045",
      qrCodeVal: "RFID-SUB-8842"
    }
  ];
}

function generateInitialReceipts(): PaymentReceipt[] {
  return [
    {
      id: 'REC-2026-0001',
      paymentRef: 'PAY-TX-998124',
      subscriberId: 'SUB-4029',
      subscriberName: 'Koffi Jean-Jacques',
      contractNumber: 'CNT-2026-6081',
      invoiceId: 'FAC_KOFFI_01',
      paymentDate: '2026-05-10',
      amountPaid: 3500,
      paymentMethod: 'Orange Money',
      remainingBalance: 0,
      electronicSignature: 'CERT-SIG-4421-AKPBF'
    },
    {
      id: 'REC-2026-0002',
      paymentRef: 'PAY-TX-440291',
      subscriberId: 'SUB-1933',
      subscriberName: 'Soro Aminata',
      contractNumber: 'CNT-2026-1933',
      invoiceId: 'FAC_SORO_01',
      paymentDate: '2026-05-12',
      amountPaid: 15000,
      paymentMethod: 'Wave',
      remainingBalance: 0,
      electronicSignature: 'CERT-SIG-8802-AKPBF'
    }
  ];
}

const LOCAL_STORAGE_KEY = 'akpbf_erp_state_v2';

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: sessionUser, logout: handleLogoutContext, loading: authSessionLoading } = useAuth();
  const [lastRole, setLastRole] = useState<string | null>(null);

  // Strict role switch separation security check
  useEffect(() => {
    if (sessionUser) {
      if (lastRole && lastRole !== sessionUser.role) {
        // Clear everything immediately - security protocol
        setLastRole(null);
        handleLogoutContext();
        alert('Sécurité : Un changement de rôle nécessite une nouvelle authentification.');
      } else {
        setLastRole(sessionUser.role);
      }
    } else {
      setLastRole(null);
    }
  }, [sessionUser, lastRole, handleLogoutContext]);

  // Odoo Subscription actions historical audit logs
  const [auditLogs, setAuditLogs] = useState<SubscriptionHistoryLog[]>(() => {
    const saved = localStorage.getItem('akpbf_erp_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'LOG-001',
        subscriberId: 'AKPBF-000001',
        subscriberName: 'Jean-Jacques Coulibaly',
        action: 'creation',
        description: 'Initialisation du contrat et affectation du bac RFID 240L Standard.',
        timestamp: '2026-05-10 09:30',
        operator: 'Admin AKPBF'
      },
      {
        id: 'LOG-002',
        subscriberId: 'AKPBF-000002',
        subscriberName: 'Aminata Koné',
        action: 'state_change',
        oldState: 'pending_validation',
        newState: 'active',
        description: 'Changement d\'état du contrat vers "Actif". Redirection vers le moteur de facturation automatique.',
        timestamp: '2026-05-14 11:20',
        operator: 'Système Central ERP'
      }
    ];
  });

  const logAuditAction = (
    subId: string, 
    subName: string, 
    action: SubscriptionHistoryLog['action'], 
    desc: string, 
    oldState?: string, 
    newState?: string
  ) => {
    const newLog: SubscriptionHistoryLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9050)}`,
      subscriberId: subId,
      subscriberName: subName,
      action,
      oldState,
      newState,
      description: desc,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      operator: sessionUser ? sessionUser.name : 'Système Automatique'
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem('akpbf_erp_audit_logs', JSON.stringify(updated));
  };

  const handleLogin = (user: typeof sessionUser) => {
    if (user) {
      // Redirection logic to appropriate spaces as requested (Phase 2 core)
      if (user.role === 'CLIENT') {
        setActiveTab('client_portal');
        navigate('/client');
      } else if (user.role === 'COMPTABLE') {
        setActiveTab('billing');
        navigate('/cashier');
      } else if (user.role === 'SUPERVISEUR') {
        setActiveTab('dashboard');
        navigate('/supervisor');
      } else if (user.role === 'CHAUFFEUR' || user.role === 'AGENT') {
        setActiveTab('routes');
        navigate('/agent');
      } else if (user.role === 'AGENT_RECOUVREMENT') {
        setActiveTab('dashboard');
        navigate('/agent');
      } else {
        // ADMINISTRATEUR
        setActiveTab('dashboard');
        navigate('/admin');
      }
    }
  };

  const handleLogout = () => {
    handleLogoutContext();
    setActiveTab('dashboard');
    navigate('/');
  };

  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem('akpbf_erp_active_tab') || 'dashboard';
  });

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    localStorage.setItem('akpbf_erp_active_tab', tab);
  };

  const isTabAllowedForRole = (tab: string, role: string) => {
    if (!role) return false;
    if (role === 'CLIENT') return ['dashboard', 'contract', 'invoices', 'receipts', 'collections', 'claims', 'profile', 'emplacements'].includes(tab);
    if (role === 'COMPTABLE') return ['billing', 'accounts', 'reports'].includes(tab);
    if (role === 'CHAUFFEUR' || role === 'AGENT') return ['routes', 'qr_scanner'].includes(tab);
    if (role === 'AGENT_RECOUVREMENT') return ['dashboard', 'subscribers', 'quick_payment', 'billing', 'payments', 'unpaid_debts'].includes(tab);
    if (role === 'SUPERVISEUR') return ['dashboard', 'contacts', 'billing', 'accounts', 'fleet', 'stock', 'reports', 'settings'].includes(tab);
    return true; // ADMIN is allowed all
  };

  // Sync URIs with matching active workspace tabs
  useEffect(() => {
    const path = location.pathname;
    const role = sessionUser?.role;
    const savedTab = localStorage.getItem('akpbf_erp_active_tab');

    if (savedTab && role && isTabAllowedForRole(savedTab, role)) {
      setActiveTabState(savedTab);
      return;
    }

    if (path === '/agent') {
      const defaultTab = 'routes';
      setActiveTab(defaultTab);
    } else if (path === '/cashier') {
      const defaultTab = 'billing';
      setActiveTab(defaultTab);
    } else if (path === '/supervisor') {
      const defaultTab = 'dashboard';
      setActiveTab(defaultTab);
    } else if (path === '/admin') {
      const defaultTab = 'dashboard';
      setActiveTab(defaultTab);
    }
  }, [location.pathname, sessionUser?.role]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dark/Light Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('akpbf_erp_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Track theme changes and set body/html class and data-theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('akpbf_erp_theme', theme);
  }, [theme]);

  // Close sidebar on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isSidebarOpen]);

  // Core municipal database states including subscription plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [selectedSubDetailId, setSelectedSubDetailId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agents, setAgents] = useState<CollectorAgent[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>([]);

  // Odoo Contracts and receipts states
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [emplacements, setEmplacements] = useState<Emplacement[]>([]);
  const [collectionProofs, setCollectionProofs] = useState<CollectionProof[]>([]);

  const loadStateFromServer = useCallback(async () => {
    const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
    if (!token) return;
    try {
      const response = await fetch('/api/erp/state', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.plans && data.plans.length > 0) setPlans(data.plans);
        if (data.subscribers && data.subscribers.length > 0) setSubscribers(data.subscribers);
        if (data.invoices && data.invoices.length > 0) setInvoices(data.invoices);
        if (data.contracts && data.contracts.length > 0) setContracts(data.contracts);
        if (data.receipts && data.receipts.length > 0) setReceipts(data.receipts);
        if (data.emplacements && data.emplacements.length > 0) setEmplacements(data.emplacements);
        if (data.notifLogs && data.notifLogs.length > 0) setNotifLogs(data.notifLogs);
        if (data.auditLogs && data.auditLogs.length > 0) setAuditLogs(data.auditLogs);
        if (data.collectionProofs && data.collectionProofs.length > 0) setCollectionProofs(data.collectionProofs);
      }
    } catch (err) {
      console.error("Failed to load ERP state from postgres server:", err);
    }
  }, []);

  const syncLedgerToServer = useCallback(async (
    updatedContracts: any[],
    updatedReceipts: any[],
    updatedEmplacements: any[],
    updatedNotifs: any[],
    updatedAudits: any[],
    updatedCollectionProofs?: any[]
  ) => {
    const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
    if (!token) return;
    try {
      await fetch('/api/erp/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contracts: updatedContracts,
          receipts: updatedReceipts,
          emplacements: updatedEmplacements,
          notifLogs: updatedNotifs,
          auditLogs: updatedAudits,
          collectionProofs: updatedCollectionProofs !== undefined ? updatedCollectionProofs : collectionProofs
        })
      });
    } catch (err) {
      console.error("Failed to sync ledger:", err);
    }
  }, [collectionProofs]);

  // Load state from local storage or real server backend on mount
  useEffect(() => {
    const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
    if (token) {
      loadStateFromServer();
    } else {
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
          
          // Load contracts, templates, receipts, or seed them if empty
          setContracts(parsed.contracts && parsed.contracts.length > 0 ? parsed.contracts : generateInitialContracts());
          setTemplates(parsed.templates && parsed.templates.length > 0 ? parsed.templates : INITIAL_TEMPLATES);
          setReceipts(parsed.receipts && parsed.receipts.length > 0 ? parsed.receipts : generateInitialReceipts());
          setEmplacements(parsed.emplacements && parsed.emplacements.length > 0 ? parsed.emplacements : INITIAL_EMPLACEMENTS);
          setCollectionProofs(parsed.collectionProofs && parsed.collectionProofs.length > 0 ? parsed.collectionProofs : generateInitialCollectionProofs());
        } catch (e) {
          console.error('Error parsing local storage ERP state - loading high fidelity presets', e);
          loadInitialPresets();
        }
      } else {
        loadInitialPresets();
      }
    }
  }, [loadStateFromServer]);

  // Sync automatic tab redirection once user context is loaded
  useEffect(() => {
    if (sessionUser) {
      loadStateFromServer();
      if (sessionUser.role === 'CLIENT') {
        setActiveTab('client_portal');
      } else if (sessionUser.role === 'COMPTABLE') {
        setActiveTab('accounting');
      } else if (sessionUser.role === 'CHAUFFEUR' || sessionUser.role === 'AGENT') {
        setActiveTab('routes');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [sessionUser, loadStateFromServer]);

  // Helper method to reload initials with high-fidelity AKPBF simulated databases
  const loadInitialPresets = () => {
    const demo = generateAllDemoData();
    const initContracts = generateInitialContracts();
    const initTemplates = INITIAL_TEMPLATES;
    const initReceipts = generateInitialReceipts();
    const initEmplacements = INITIAL_EMPLACEMENTS;
    const initCollectionProofs = generateInitialCollectionProofs();

    setPlans(demo.plans);
    setSubscribers(demo.subscribers);
    setInvoices(demo.invoices);
    setAgents(demo.agents);
    setRoutes(demo.routes);
    setNotifLogs(demo.notifLogs);
    setContracts(initContracts);
    setTemplates(initTemplates);
    setReceipts(initReceipts);
    setEmplacements(initEmplacements);
    setCollectionProofs(initCollectionProofs);

    saveStateToLocalStorage(
      demo.plans, 
      demo.subscribers, 
      demo.invoices, 
      demo.agents, 
      demo.routes, 
      demo.notifLogs,
      initContracts,
      initTemplates,
      initReceipts,
      initEmplacements,
      initCollectionProofs
    );
  };

  // Sync state to local storage when state modifications occur
  const saveStateToLocalStorage = (
    currentPlans: SubscriptionPlan[],
    subs: Subscriber[],
    invs: Invoice[],
    agts: CollectorAgent[],
    rts: Route[],
    notifs: NotificationLog[],
    cnts?: Contract[],
    tpls?: ContractTemplate[],
    rcpts?: PaymentReceipt[],
    empls?: Emplacement[],
    collPrfs?: CollectionProof[]
  ) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      plans: currentPlans,
      subscribers: subs,
      invoices: invs,
      agents: agts,
      routes: rts,
      notifLogs: notifs,
      contracts: cnts || contracts,
      templates: tpls || templates,
      receipts: rcpts || receipts,
      emplacements: empls || emplacements,
      collectionProofs: collPrfs || collectionProofs
    }));
  };

  // Emplacements multi-location management handlers
  const handleAddEmplacement = (newEmp: Emplacement) => {
    const updated = [newEmp, ...emplacements];
    setEmplacements(updated);
    saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, contracts, templates, receipts, updated);
  };

  const handleUpdateEmplacement = (updatedEmp: Emplacement) => {
    const updated = emplacements.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmplacements(updated);
    saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, contracts, templates, receipts, updated);
  };

  const handleDeleteEmplacement = (id: string) => {
    const updated = emplacements.filter(e => e.id !== id);
    setEmplacements(updated);
    saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, contracts, templates, receipts, updated);
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
  const handleAddSubscriber = async (newSub: Subscriber) => {
    try {
      // 1. Instantly update local React and local storage state eagerly
      const updatedSubs = [newSub, ...subscribers];
      setSubscribers(updatedSubs);

      // Auto-spawn enrollment notification log and sync ledger
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

      saveStateToLocalStorage(plans, updatedSubs, invoices, agents, routes, updatedNotifs);

      // 2. Submit to database asynchronously
      const response = await fetch('/api/erp/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSub)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur de création.");
      }
      
      await syncLedgerToServer(contracts, receipts, emplacements, updatedNotifs, auditLogs);
      
      // 3. Trigger server refresh in background if a valid token is present
      const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
      if (token) {
        await loadStateFromServer();
      }
    } catch (err: any) {
      console.error('Failed to add subscriber:', err);
      // Flow gracefully with local memory safe-fallback
    }
  };

  const handleUpdateSubscriber = async (updatedSub: Subscriber) => {
    try {
      // 1. Instantly update React state and local storage
      const updatedSubs = subscribers.map(s => s.id === updatedSub.id ? updatedSub : s);
      setSubscribers(updatedSubs);
      saveStateToLocalStorage(plans, updatedSubs, invoices, agents, routes, notifLogs);

      const response = await fetch(`/api/erp/subscribers/${updatedSub.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token')}`
        },
        body: JSON.stringify(updatedSub)
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur d'édition.");
      }

      const prevSub = subscribers.find(s => s.id === updatedSub.id);
      
      if (prevSub && prevSub.status !== updatedSub.status) {
        logAuditAction(
          updatedSub.id, 
          updatedSub.name, 
          'state_change', 
          `Passage du statut de "${prevSub.status}" à "${updatedSub.status}".`,
          prevSub.status,
          updatedSub.status
        );

        // Automatic Invoicing when subscription becomes Active!
        if (updatedSub.status === 'active' && (prevSub.status === 'draft' || prevSub.status === 'pending_validation')) {
          const plan = plans.find(p => p.id === updatedSub.planId) || plans[0];
          const amount = plan ? plan.price : 2000;
          
          await fetch('/api/erp/invoices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token')}`
            },
            body: JSON.stringify({
              subscriberId: updatedSub.id,
              amount,
              dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().substring(0, 10),
              period: 'Mise en Service - Juin 2026',
              status: 'pending'
            })
          });

          // Also log the invoice creation action audit log!
          logAuditAction(
            updatedSub.id, 
            updatedSub.name, 
            'creation', 
            `Mise en service du contrat. Facture de ${amount} FCFA émise automatiquement.`,
            undefined,
            'active'
          );
        }
      }

      await syncLedgerToServer(contracts, receipts, emplacements, notifLogs, auditLogs);
      
      const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
      if (token) {
        await loadStateFromServer();
      }
    } catch (err: any) {
      console.error('Failed to update subscriber:', err);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      // 1. Instantly update React state and local storage
      const updatedSubs = subscribers.filter(s => s.id !== id);
      setSubscribers(updatedSubs);
      saveStateToLocalStorage(plans, updatedSubs, invoices, agents, routes, notifLogs);

      const response = await fetch(`/api/erp/subscribers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token')}`
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erreur de suppression.");
      }

      const token = localStorage.getItem('akpbf_erp_token') || sessionStorage.getItem('akpbf_erp_token');
      if (token) {
        await loadStateFromServer();
      }
    } catch (err: any) {
      console.error('Failed to delete subscriber:', err);
    }
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

  const handleProcessBulkPayment = (
    subscriberId: string,
    invoiceIds: string[],
    method: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces',
    agentName: string = 'Agent de Recouvrement AKPBF'
  ) => {
    // 1. Mark matched invoices as paid
    const updatedInvs = invoices.map(i => {
      if (invoiceIds.includes(i.id)) {
        return {
          ...i,
          status: 'paid' as const,
          paymentMethod: method,
          paidDate: '2026-06-03'
        };
      }
      return i;
    });
    setInvoices(updatedInvs);

    // 2. Aggregate amount and update subscriber paymentStatus
    const sub = subscribers.find(s => s.id === subscriberId);
    if (!sub) return;

    const totalPaidSum = invoices
      .filter(i => invoiceIds.includes(i.id))
      .reduce((sum, curr) => sum + curr.amount, 0);

    const updatedSubs = subscribers.map(s => {
      if (s.id === subscriberId) {
        return {
          ...s,
          paymentStatus: 'paid' as const,
          status: 'active' as const
        };
      }
      return s;
    });
    setSubscribers(updatedSubs);

    // 3. Register unified Receipt
    const newReceipt: PaymentReceipt = {
      id: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriberId: subscriberId,
      subscriberName: sub.name,
      amountPaid: totalPaidSum,
      paymentDate: '2026-06-03',
      paymentMethod: method,
      paymentRef: `TXN-MUN-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceId: invoiceIds.join(', '),
      contractNumber: `CNT-2026-${subscriberId.split('-')[1] || '0129'}`,
      remainingBalance: 0,
      electronicSignature: `AKPBF-MASS-STAMP-${Math.floor(100000 + Math.random() * 900000)}`
    };
    const updatedReceipts = [newReceipt, ...receipts];
    setReceipts(updatedReceipts);

    // 4. Save SMS alert dispatch
    const bulkSmsLog: NotificationLog = {
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: sub.name,
      recipientContact: sub.phone || '+225 00 00 00',
      type: 'sms',
      templateName: 'Validation Encaiss. Regroupé',
      content: `MAIRIE D'ABIDJAN : Encaissé régulé de ${totalPaidSum} FCFA (${invoiceIds.length} mois) par l'agent ${agentName} via ${method}. Reçu unique de voirie durable de l'assainissement : ${newReceipt.id}. Merci de votre civisme !`,
      sentAt: 'À l\'instant',
      status: 'sent'
    };
    const updatedNotifs = [bulkSmsLog, ...notifLogs];
    setNotifLogs(updatedNotifs);

    // 5. Add Audit Trail log
    const auditLogEntry: SubscriptionHistoryLog = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      subscriberId: subscriberId,
      subscriberName: sub.name,
      action: 'state_change',
      description: `Règlement collectif de ${invoiceIds.length} mois pour un total de ${totalPaidSum} FCFA (Encaissé terrain : ${agentName} via ${method})`,
      timestamp: new Date().toISOString(),
      operator: agentName
    };
    const updatedAuditLogs = [auditLogEntry, ...auditLogs];
    setAuditLogs(updatedAuditLogs);

    saveStateToLocalStorage(
      plans,
      updatedSubs,
      updatedInvs,
      agents,
      routes,
      updatedNotifs,
      contracts,
      templates,
      updatedReceipts,
      emplacements,
      collectionProofs
    );
  };

  const handleSendMockReminders = () => {
    // Send standard SMS alerts for any non-paid bills
    const overdueInvs = invoices.filter(i => i.status === 'overdue' || (i.status as string) === 'unpaid');
    
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

  const handleAddCollectionProof = (proof: CollectionProof) => {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const ipAddress = "197.228.32.48"; // Standard Ivorian Orange IP

    // 1. New collection proof
    const updatedProofs = [proof, ...collectionProofs];
    setCollectionProofs(updatedProofs);

    // 2. New Audit log listing: utilisateur, date, heure, action, adresse IP
    const auditMsg = `Validation de collecte RFID #${proof.qrCodeVal} de l'abonné ${proof.clientName}. Agent: ${proof.agentName}. IP: ${ipAddress}.`;
    const newAuditLog: SubscriptionHistoryLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9050)}`,
      subscriberId: proof.clientId,
      subscriberName: proof.clientName,
      action: 'modification',
      description: auditMsg,
      timestamp: `${formattedDate} ${formattedTime}`,
      operator: sessionUser ? `${sessionUser.name} [IP: ${ipAddress}]` : `Système Automatique [IP: ${ipAddress}]`
    };
    const updatedAudits = [newAuditLog, ...auditLogs];
    setAuditLogs(updatedAudits);
    localStorage.setItem('akpbf_erp_audit_logs', JSON.stringify(updatedAudits));

    // 3. New email notification
    const emailBody = `Cher(e) éco-citoyen(ne) ${proof.clientName},\n\nNous confirmons que la collecte de vos déchets a été effectuée avec succès par les services municipaux AKPBF.\n\n` +
      `- Date de collecte : ${proof.collectionDate}\n` +
      `- Heure de collecte : ${proof.collectionTime}\n` +
      `- Référence contrat : ${proof.contractRef}\n` +
      `- Type d'abonnement : ${proof.planName}\n` +
      `- Véhicule de voirie : ${proof.vehiclePlate}\n` +
      `- Code d'identification RFID : ${proof.qrCodeVal}\n\n` +
      `Votre preuve numérique de passage de service a été consignée sous la référence ${proof.id} et est disponible en temps réel dans votre Portail Client AKPBF.\n\n` +
      `Merci pour votre engagement civique.\n\n` +
      `Cordialement,\n` +
      `AKPBF - Salubrité Urbaine & Logistique Verte Abidjan.`;

    const newNotifLog: NotificationLog = {
      id: `NTF-${Math.floor(1000 + Math.random() * 9000)}`,
      recipientName: proof.clientName,
      recipientContact: proof.clientId,
      type: 'email',
      templateName: 'Preuve de service de Collecte',
      content: emailBody,
      sentAt: `${formattedDate} à ${formattedTime}`,
      status: 'sent'
    };
    const updatedNotifs = [newNotifLog, ...notifLogs];
    setNotifLogs(updatedNotifs);

    // 4. Save and sync
    saveStateToLocalStorage(
      plans,
      subscribers,
      invoices,
      agents,
      routes,
      updatedNotifs,
      contracts,
      templates,
      receipts,
      emplacements,
      updatedProofs
    );

    syncLedgerToServer(contracts, receipts, emplacements, updatedNotifs, updatedAudits, updatedProofs);
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

  const canAccessTab = (tab: string) => {
    const r = sessionUser ? sessionUser.role : 'ADMINISTRATEUR';
    
    // Strict separation: No administrator can ever load the client portal tab
    if (tab === 'client_portal') return r === 'CLIENT';
    // Strict separation: No client can ever load any administration tab
    if (r === 'CLIENT') return false;

    if (r === 'ADMINISTRATEUR') return true;
    
    if (r === 'COMPTABLE') {
      return ['dashboard', 'billing', 'payments', 'unpaid_debts', 'reports', 'accounting', 'expenses', 'contracts', 'emails', 'quick_payment'].includes(tab);
    }
    
    if (r === 'CAISSIER') {
      return ['quick_payment', 'billing', 'payments'].includes(tab);
    }
    
    if (r === 'SUPERVISEUR') {
      return ['dashboard', 'subscribers', 'bins', 'routes', 'gps', 'agents', 'notifications', 'fleet', 'contracts', 'emplacements', 'emails'].includes(tab);
    }
    
    if (r === 'CHAUFFEUR') {
      return ['routes', 'gps', 'bins'].includes(tab);
    }
    
    if (r === 'AGENT') {
      return ['routes', 'bins'].includes(tab);
    }

    if (r === 'AGENT_RECOUVREMENT') {
      return ['dashboard', 'subscribers', 'quick_payment', 'billing', 'payments', 'unpaid_debts'].includes(tab);
    }
    
    return false;
  };

  if (authSessionLoading) {
    return (
      <div id="auth-loading-screen" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 font-sans">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute font-mono text-xs text-emerald-400 font-black animate-pulse">AK</div>
        </div>
        <p className="mt-4 text-xs font-bold text-slate-400 tracking-widest uppercase animate-pulse">Vérification de session sécurisée...</p>
      </div>
    );
  }

  const clientSub = sessionUser ? (
    subscribers.find(s => s.phone === sessionUser.phone || s.email === sessionUser.email || s.id === sessionUser.subscriberId) || {
      id: sessionUser.subscriberId || sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email || "",
      phone: sessionUser.phone || "",
      address: "Mairie d'Abidjan, Côte d'Ivoire",
      neighborhood: "Cocody",
      lat: 5.3489,
      lng: -3.9995,
      planId: "plan_eco",
      status: 'active' as const,
      binType: 'Standard 240L' as const,
      lastCollectionDate: 'Aujourd\'hui',
      currentBinLevel: 10,
      paymentStatus: 'paid' as const,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
      collectionsRealized: 4,
      unpaidDays: 0
    }
  ) : null;

  return (
    <Routes>
      <RouterRoute path="/" element={
        <LandingPage 
          plans={plans}
          subscribers={subscribers}
          onAddSubscriber={handleAddSubscriber}
          onLogin={handleLogin}
          onAddNotificationLogs={(notif) => {
            const logs = [notif, ...notifLogs];
            setNotifLogs(logs);
            saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, logs, contracts, templates, receipts);
          }}
          theme={theme}
          setTheme={setTheme}
        />
      } />

      <RouterRoute path="/login" element={
        sessionUser ? (
          sessionUser.role === 'CLIENT' ? <Navigate to="/client" replace /> :
          sessionUser.role === 'COMPTABLE' ? <Navigate to="/cashier" replace /> :
          sessionUser.role === 'SUPERVISEUR' ? <Navigate to="/supervisor" replace /> :
          sessionUser.role === 'CHAUFFEUR' || sessionUser.role === 'AGENT' || sessionUser.role === 'AGENT_RECOUVREMENT' ? <Navigate to="/agent" replace /> :
          <Navigate to="/admin" replace />
        ) : (
          <UnifiedAuth 
            subscribers={subscribers}
            onLogin={handleLogin}
          />
        )
      } />

      <RouterRoute path="/register" element={
        sessionUser ? (
          sessionUser.role === 'CLIENT' ? <Navigate to="/client" replace /> :
          sessionUser.role === 'COMPTABLE' ? <Navigate to="/cashier" replace /> :
          sessionUser.role === 'SUPERVISEUR' ? <Navigate to="/supervisor" replace /> :
          sessionUser.role === 'CHAUFFEUR' || sessionUser.role === 'AGENT' || sessionUser.role === 'AGENT_RECOUVREMENT' ? <Navigate to="/agent" replace /> :
          <Navigate to="/admin" replace />
        ) : (
          <RegisterPage 
            plans={plans}
            onAddSubscriber={handleAddSubscriber}
            onAddNotificationLogs={(notif) => {
              const logs = [notif, ...notifLogs];
              setNotifLogs(logs);
              saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, logs, contracts, templates, receipts);
            }}
          />
        )
      } />

      <RouterRoute path="/client" element={
        sessionUser && sessionUser.role === 'CLIENT' && clientSub ? (
          <ClientPortalView 
            subscribers={subscribers}
            invoices={invoices}
            plans={plans}
            routes={routes}
            contracts={contracts}
            receipts={receipts}
            emplacements={emplacements}
            collectionProofs={collectionProofs}
            onAddEmplacement={handleAddEmplacement}
            onUpdateEmplacement={handleUpdateEmplacement}
            onDeleteEmplacement={handleDeleteEmplacement}
            onUpdateSubscriber={handleUpdateSubscriber}
            onPayInvoice={handlePayInvoice}
            onAddNotification={(newNotif) => {
              const logs = [newNotif, ...notifLogs];
              setNotifLogs(logs);
              saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, logs, contracts, templates, receipts);
            }}
            onAddContract={(cnt) => {
              const updated = [cnt, ...contracts];
              setContracts(updated);
              saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, updated, templates, receipts);
            }}
            onUpdateContract={(cnt) => {
              const updated = contracts.map(c => c.id === cnt.id ? cnt : c);
              setContracts(updated);
              saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, updated, templates, receipts);
            }}
            onAddReceipt={(rec) => {
              const updated = [...receipts, rec];
              setReceipts(updated);
              saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, contracts, templates, updated);
            }}
            onAddHistoryLog={(log) => {
              logAuditAction(log.subscriberId, log.subscriberName, log.action, log.description, log.oldState, log.newState);
            }}
            loggedClient={clientSub}
            onLogoutCentral={handleLogout}
          />
        ) : (
          <Navigate to="/" replace />
        )
      } />

      {/* Internal ERP Dashboard paths */}
      <RouterRoute path="/agent" element={
        sessionUser && (sessionUser.role === 'AGENT' || sessionUser.role === 'CHAUFFEUR' || sessionUser.role === 'SUPERVISEUR' || sessionUser.role === 'ADMINISTRATEUR' || sessionUser.role === 'AGENT_RECOUVREMENT') ? (
          adminWorkspace()
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <RouterRoute path="/cashier" element={
        sessionUser && (sessionUser.role === 'COMPTABLE' || sessionUser.role === 'ADMINISTRATEUR') ? (
          adminWorkspace()
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <RouterRoute path="/supervisor" element={
        sessionUser && (sessionUser.role === 'SUPERVISEUR' || sessionUser.role === 'ADMINISTRATEUR') ? (
          adminWorkspace()
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <RouterRoute path="/admin" element={
        sessionUser && sessionUser.role === 'ADMINISTRATEUR' ? (
          adminWorkspace()
        ) : (
          <Navigate to="/" replace />
        )
      } />

      <RouterRoute path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  function adminWorkspace() {
    const isRecoveryAgent = sessionUser?.role === 'AGENT_RECOUVREMENT';
    const assignedZones = sessionUser?.assignedZones || [];
    const hasZoneFilter = isRecoveryAgent && assignedZones.length > 0;

    // Filter subscribers, invoices, receipts and contracts according to agents zones
    const zoneFilteredSubscribers = hasZoneFilter 
      ? subscribers.filter(s => assignedZones.some(z => s.neighborhood?.toLowerCase() === z.toLowerCase())) 
      : subscribers;

    const zoneFilteredInvoices = hasZoneFilter 
      ? invoices.filter(i => {
          const sub = subscribers.find(s => s.id === i.subscriberId);
          return sub && assignedZones.some(z => sub.neighborhood?.toLowerCase() === z.toLowerCase());
        }) 
      : invoices;

    const zoneFilteredReceipts = hasZoneFilter 
      ? receipts.filter(r => {
          const sub = subscribers.find(s => s.id === r.subscriberId);
          return sub && assignedZones.some(z => sub.neighborhood?.toLowerCase() === z.toLowerCase());
        }) 
      : receipts;

    const zoneFilteredContracts = hasZoneFilter 
      ? contracts.filter(c => {
          const sub = subscribers.find(s => s.id === c.subscriberId);
          return sub && assignedZones.some(z => sub.neighborhood?.toLowerCase() === z.toLowerCase());
        }) 
      : contracts;

    const renderSidebarButton = (
      tabId: string, 
      label: string, 
      IconComponent: any, 
      colorTheme: 'emerald' | 'amber' | 'indigo' | 'sky' | 'purple' = 'emerald',
      pulseEffect = false,
      badge?: string | number
    ) => {
      const isActive = activeTab === tabId;
      
      const colors = {
        emerald: {
          activeBg: 'text-indigo-205 text-white font-extrabold',
          hoverBg: 'hover:bg-slate-800/40 hover:text-indigo-300',
          iconActive: 'text-indigo-350',
          iconHover: 'group-hover:text-indigo-400',
          pillColor: 'bg-indigo-600/20 border-l-4 border-[#635BFF] border-r border-[#635BFF]/20 border-t border-b border-[#635BFF]/20'
        },
        amber: {
          activeBg: 'text-indigo-205 text-white font-extrabold',
          hoverBg: 'hover:bg-slate-800/40 hover:text-indigo-300',
          iconActive: 'text-indigo-350',
          iconHover: 'group-hover:text-indigo-400',
          pillColor: 'bg-indigo-600/20 border-l-4 border-[#635BFF] border-r border-[#635BFF]/20 border-t border-b border-[#635BFF]/20'
        },
        indigo: {
          activeBg: 'text-indigo-205 text-white font-extrabold',
          hoverBg: 'hover:bg-slate-800/40 hover:text-indigo-300',
          iconActive: 'text-indigo-350',
          iconHover: 'group-hover:text-[#635BFF]',
          pillColor: 'bg-indigo-600/20 border-l-4 border-[#635BFF] border-r border-[#635BFF]/20 border-t border-b border-[#635BFF]/20'
        },
        sky: {
          activeBg: 'text-indigo-205 text-white font-extrabold',
          hoverBg: 'hover:bg-slate-800/40 hover:text-indigo-300',
          iconActive: 'text-indigo-350',
          iconHover: 'group-hover:text-[#635BFF]',
          pillColor: 'bg-indigo-600/20 border-l-4 border-[#635BFF] border-r border-[#635BFF]/20 border-t border-b border-[#635BFF]/20'
        },
        purple: {
          activeBg: 'text-indigo-205 text-white font-extrabold',
          hoverBg: 'hover:bg-slate-800/40 hover:text-indigo-300',
          iconActive: 'text-indigo-350',
          iconHover: 'group-hover:text-[#635BFF]',
          pillColor: 'bg-indigo-600/20 border-l-4 border-[#635BFF] border-r border-[#635BFF]/20 border-t border-b border-[#635BFF]/20'
        }
      };

      const c = colors[colorTheme];

      return (
        <button
          type="button"
          onClick={() => { setActiveTab(tabId); setIsSidebarOpen(false); }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-all duration-300 ease-out group select-none cursor-pointer relative ${
            isActive 
              ? `${c.activeBg} scale-[1.02]` 
              : `text-slate-400 hover:text-slate-200 hover:translate-x-1.5 ${c.hoverBg} rounded-xl`
          }`}
        >
          <div className="flex items-center gap-3 relative z-10">
            <IconComponent className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 ${
              isActive 
                ? `${c.iconActive} scale-110 ${pulseEffect ? 'animate-pulse' : ''}` 
                : `text-slate-500 ${c.iconHover} group-hover:scale-105`
            }`} />
            <span className="font-semibold tracking-wide">{label}</span>
          </div>
          {badge !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide relative z-10 ${
              isActive ? 'bg-slate-950 text-emerald-400 border border-emerald-950/30' : 'bg-slate-850 text-slate-500 group-hover:bg-slate-750 group-hover:text-white'
            }`}>
              {badge}
            </span>
          )}
          {isActive && (
            <motion.span
              layoutId="activeAdminTabBackground"
              className={`absolute inset-0 rounded-xl -z-10 ${c.pillColor}`}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            />
          )}
        </button>
      );
    };

    return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased transition-colors duration-200">
      
      {/* MOBILE HEADER RESPONSIVE TOGGLE */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-650 p-1 rounded-lg text-white font-black text-xs">AKPBF</div>
          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white">AKPBF Salubrité</span>
        </div>
        <div className="flex items-center gap-2">
          {sessionUser && (
            <UserProfileMenu 
              user={sessionUser} 
              onLogout={handleLogout} 
            />
          )}
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 px-2 border border-slate-700 bg-slate-800 rounded hover:bg-slate-700 active:scale-95 transition"
          >
            {isSidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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
            {canAccessTab('dashboard') && renderSidebarButton('dashboard', 'Tableau de Bord', LayoutDashboard, 'emerald')}
            {canAccessTab('subscribers') && renderSidebarButton('subscribers', 'Gestion des Abonnés', Users, 'emerald', false, subscribers.length)}
            {canAccessTab('emplacements') && renderSidebarButton('emplacements', 'Gestion des Emplacements', MapPin, 'amber', true, emplacements.length)}
            {canAccessTab('contracts') && renderSidebarButton('contracts', 'Gestion des Contrats', FileText, 'emerald', false, contracts.length)}
            {canAccessTab('bins') && renderSidebarButton('bins', 'Gestion des Poubelles', Camera, 'emerald')}
            {canAccessTab('ai') && renderSidebarButton('ai', 'Prévisions IA & Assistant', Cpu, 'amber', true)}
            {canAccessTab('plans') && renderSidebarButton('plans', 'Abonnements (Forfaits)', Layers, 'emerald', false, plans.length)}
            {canAccessTab('quick_payment') && renderSidebarButton('quick_payment', 'Encaissement Rapide', Coins, 'emerald', true)}
            {canAccessTab('billing') && renderSidebarButton('billing', 'Facturation - Caisse', Coins, 'emerald')}
            {canAccessTab('payments') && renderSidebarButton('payments', 'Paiements & Trésorerie', CreditCard, 'emerald')}
            {canAccessTab('unpaid_debts') && renderSidebarButton('unpaid_debts', 'Gestion des Impayés', AlertCircle, 'amber')}
            {canAccessTab('routes') && renderSidebarButton('routes', 'Tournées (SIG)', Navigation, 'emerald', false, routes.length)}
            {canAccessTab('gps') && renderSidebarButton('gps', 'Carte GPS Live', MapPin, 'emerald')}
            {canAccessTab('reports') && renderSidebarButton('reports', 'Rapports & Stats', TrendingUp, 'emerald')}
            {canAccessTab('agents') && renderSidebarButton('agents', 'Agents & Équipages', Award, 'emerald', false, agents.length)}
            {canAccessTab('notifications') && renderSidebarButton('notifications', "Canaux d'Alerte SMS", Smartphone, 'emerald')}
            {canAccessTab('emails') && renderSidebarButton('emails', 'Emails Professionnels', Mail, 'emerald')}

            {(canAccessTab('accounting') || canAccessTab('expenses') || canAccessTab('stock') || canAccessTab('fleet') || canAccessTab('hr')) && (
              <div className="pt-3 border-t border-slate-800 mt-3 block">
                <span className="text-[9.5px] font-bold text-amber-500 uppercase tracking-widest block px-3.5 mb-2 font-mono">FINANCES & OPÉRATIONS</span>
                
                {canAccessTab('accounting') && renderSidebarButton('accounting', 'Comptabilité Générale', BookOpen, 'emerald')}
                {canAccessTab('expenses') && renderSidebarButton('expenses', 'Dépenses & Achats', Coins, 'amber')}
                {canAccessTab('stock') && renderSidebarButton('stock', 'Gestion de Stock', Layers, 'sky')}
                {canAccessTab('fleet') && renderSidebarButton('fleet', 'Flotte & Véhicules', Award, 'amber')}
                {canAccessTab('hr') && renderSidebarButton('hr', 'Ressources Humaines (RH)', Users, 'purple')}
              </div>
            )}

            {canAccessTab('users') && (
              <div className="pt-3.5 border-t border-slate-800/80 mt-3.5 block">
                <span className="text-[9.5px] font-extrabold text-indigo-400 uppercase tracking-widest block px-3.5 mb-2 font-mono flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-indigo-500 animate-pulse" /> SÉCURITÉ ADMINISTRATIVE
                </span>
                {renderSidebarButton('users', 'Habilitations & Rôles', Shield, 'indigo')}
              </div>
            )}

            {canAccessTab('architect_hub') && (
              <div className="pt-3 border-t border-slate-800 mt-3 block">
                <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest block px-3 mb-2">Documentation</span>
                {renderSidebarButton('architect_hub', "Portail de l'Architecte", Layers, 'emerald')}
              </div>
            )}
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
            onClick={() => { loadInitialPresets(); localStorage.removeItem(LOCAL_STORAGE_KEY); window.location.reload(); }}
            className="w-full text-left text-[11px] font-bold text-slate-500 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-slate-850 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            Réinitialiser les données
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER PANEL */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen">
        
        {/* UPPER CONSOLE BAR */}
        <header className="hidden md:flex bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 items-center justify-between shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            <span>Aujourd'hui : 22 Mai 2026</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Base PostgreSQL : Connectée (Simulée)</span>
            </div>
            
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {sessionUser && (
              <UserProfileMenu 
                user={sessionUser} 
                onLogout={handleLogout} 
              />
            )}
          </div>
        </header>

        {/* INNER SCROLL CONTENT - VIEWS SWITCH */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {selectedSubDetailId ? (
            <SubscriberDetailView 
              subscriberId={selectedSubDetailId}
              onClose={() => setSelectedSubDetailId(null)}
              subscribers={subscribers}
              plans={plans}
              invoices={invoices}
              receipts={receipts}
              contracts={contracts}
              notifLogs={notifLogs}
              auditLogs={auditLogs}
              emplacements={emplacements}
              userRole={sessionUser?.role}
              sessionUser={sessionUser}
              onUpdateSubscriber={handleUpdateSubscriber}
              onProcessBulkPayment={handleProcessBulkPayment}
            />
          ) : (
            <ProtectedRoute allowedRoles={
              activeTab === 'dashboard' ? ['ADMINISTRATEUR', 'COMPTABLE', 'SUPERVISEUR', 'AGENT_RECOUVREMENT'] :
              activeTab === 'subscribers' ? ['ADMINISTRATEUR', 'SUPERVISEUR', 'AGENT_RECOUVREMENT'] :
              activeTab === 'bins' ? ['ADMINISTRATEUR', 'SUPERVISEUR', 'CHAUFFEUR', 'AGENT'] :
              activeTab === 'ai' ? ['ADMINISTRATEUR'] :
              activeTab === 'plans' ? ['ADMINISTRATEUR'] :
              activeTab === 'quick_payment' ? ['ADMINISTRATEUR', 'COMPTABLE', 'CAISSIER', 'AGENT_RECOUVREMENT'] :
              activeTab === 'billing' ? ['ADMINISTRATEUR', 'COMPTABLE', 'AGENT_RECOUVREMENT'] :
              activeTab === 'payments' ? ['ADMINISTRATEUR', 'COMPTABLE', 'AGENT_RECOUVREMENT'] :
              activeTab === 'unpaid_debts' ? ['ADMINISTRATEUR', 'COMPTABLE', 'AGENT_RECOUVREMENT'] :
            activeTab === 'routes' ? ['ADMINISTRATEUR', 'SUPERVISEUR', 'CHAUFFEUR', 'AGENT'] :
            activeTab === 'gps' ? ['ADMINISTRATEUR', 'SUPERVISEUR', 'CHAUFFEUR'] :
            activeTab === 'reports' ? ['ADMINISTRATEUR', 'COMPTABLE'] :
            activeTab === 'agents' ? ['ADMINISTRATEUR', 'SUPERVISEUR'] :
            activeTab === 'notifications' ? ['ADMINISTRATEUR', 'SUPERVISEUR'] :
            activeTab === 'emails' ? ['ADMINISTRATEUR', 'COMPTABLE', 'SUPERVISEUR'] :
            activeTab === 'contracts' ? ['ADMINISTRATEUR', 'COMPTABLE', 'SUPERVISEUR'] :
            activeTab === 'emplacements' ? ['ADMINISTRATEUR', 'SUPERVISEUR'] :
            activeTab === 'accounting' ? ['ADMINISTRATEUR', 'COMPTABLE'] :
            activeTab === 'expenses' ? ['ADMINISTRATEUR', 'COMPTABLE'] :
            activeTab === 'stock' ? ['ADMINISTRATEUR'] :
            activeTab === 'fleet' ? ['ADMINISTRATEUR', 'SUPERVISEUR'] :
            activeTab === 'hr' ? ['ADMINISTRATEUR'] :
            activeTab === 'users' ? ['ADMINISTRATEUR'] :
            activeTab === 'architect_hub' ? ['ADMINISTRATEUR'] :
            []
          }>
            {activeTab === 'dashboard' && (
            <DashboardView 
              subscribers={zoneFilteredSubscribers} 
              invoices={zoneFilteredInvoices} 
              agents={agents} 
              plans={plans}
              routes={routes}
              userRole={sessionUser?.role}
              onNavigateToTab={handleNavToTab}
            />
          )}

          {activeTab === 'subscribers' && (
            <SubscribersView 
              subscribers={zoneFilteredSubscribers} 
              plans={plans}
              collectionProofs={collectionProofs}
              onAddSubscriber={handleAddSubscriber}
              onUpdateSubscriber={handleUpdateSubscriber}
              onDeleteSubscriber={handleDeleteSubscriber}
              onSelectSubscriber={setSelectedSubDetailId}
            />
          )}

          {activeTab === 'bins' && (
            <BinsManagementView 
              subscribers={zoneFilteredSubscribers}
              onUpdateSubscriber={handleUpdateSubscriber}
              onAddCollectionProof={handleAddCollectionProof}
            />
          )}

          {activeTab === 'ai' && (
            <AiPredictionsView 
              subscribers={zoneFilteredSubscribers}
              invoices={zoneFilteredInvoices}
              plans={plans}
              routes={routes}
              onNavigateToTab={handleNavToTab}
            />
          )}

          {activeTab === 'plans' && (
            <SubscriptionPlansView 
              plans={plans}
              subscribers={zoneFilteredSubscribers}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onDeletePlan={handleDeletePlan}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView 
              invoices={zoneFilteredInvoices} 
              subscribers={zoneFilteredSubscribers}
              plans={plans}
              onGenerateMonthlyInvoices={handleGenerateMonthlyInvoices}
              onPayInvoice={handlePayInvoice}
              onSendMockReminders={handleSendMockReminders}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView 
              invoices={zoneFilteredInvoices}
              subscribers={zoneFilteredSubscribers}
              onPayInvoice={handlePayInvoice}
            />
          )}

          {activeTab === 'quick_payment' && (
            <QuickPaymentView 
              subscribers={zoneFilteredSubscribers}
              invoices={zoneFilteredInvoices}
              receipts={zoneFilteredReceipts}
              onPaymentSuccess={loadStateFromServer}
            />
          )}

          {activeTab === 'unpaid_debts' && (
            <UnpaidDebtsView 
              subscribers={zoneFilteredSubscribers}
              invoices={zoneFilteredInvoices}
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
              onUpdateSubscriber={handleUpdateSubscriber}
              onUpdateAgentCollected={handleUpdateAgentCollected}
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
            <NotificationsView />
          )}

          {activeTab === 'emails' && (
            <EmailsManagementView />
          )}

          {activeTab === 'contracts' && (
            <ContractsView 
              contracts={contracts}
              templates={templates}
              subscribers={subscribers}
              plans={plans}
              onAddContract={(cnt) => {
                const updated = [cnt, ...contracts];
                setContracts(updated);
                saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, updated, templates, receipts);
              }}
              onUpdateContract={(cnt) => {
                const updated = contracts.map(c => c.id === cnt.id ? cnt : c);
                setContracts(updated);
                saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, updated, templates, receipts);
              }}
              onDeleteContract={(id) => {
                const updated = contracts.filter(c => c.id !== id);
                setContracts(updated);
                saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, updated, templates, receipts);
              }}
              onSaveTemplate={(tpl) => {
                const updated = templates.some(t => t.id === tpl.id) 
                  ? templates.map(t => t.id === tpl.id ? tpl : t) 
                  : [...templates, tpl];
                setTemplates(updated);
                saveStateToLocalStorage(plans, subscribers, invoices, agents, routes, notifLogs, contracts, updated, receipts);
              }}
              onAddHistoryLog={(log) => {
                logAuditAction(log.subscriberId, log.subscriberName, log.action, log.description, log.oldState, log.newState);
              }}
              historyLogs={auditLogs}
            />
          )}

          {activeTab === 'emplacements' && (
            <EmplacementsView 
              emplacements={emplacements}
              subscribers={subscribers}
              onAddEmplacement={handleAddEmplacement}
              onUpdateEmplacement={handleUpdateEmplacement}
              onDeleteEmplacement={handleDeleteEmplacement}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingView 
              invoices={invoices}
              subscribers={subscribers}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView />
          )}

          {activeTab === 'stock' && (
            <StockView />
          )}

          {activeTab === 'fleet' && (
            <FleetView />
          )}

          {activeTab === 'hr' && (
            <HrView />
          )}

          {activeTab === 'users' && (
            <UsersManagementView />
          )}

          {activeTab === 'architect_hub' && (
            <ArchitectHub />
          )}
          </ProtectedRoute>
          )}
        </div>
      </main>
    </div>
    );
  }
}
