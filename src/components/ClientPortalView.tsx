import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Coins, 
  Layers, 
  User, 
  Smartphone, 
  Printer, 
  Download, 
  LogOut, 
  Calendar, 
  MapPin, 
  Check, 
  X,
  Bell,
  HelpCircle,
  FileCheck2,
  Lock,
  Plus,
  Send,
  Menu
} from 'lucide-react';
import { Subscriber, Invoice, SubscriptionPlan, Route, Contract, PaymentReceipt, SubscriptionHistoryLog, Emplacement, CollectionProof } from '../types';
import UserProfileMenu from './UserProfileMenu';
import EmplacementsView from './EmplacementsView';
import ThemeToggle from './ThemeToggle';
import { documentService } from '../services/documentService';

interface ClientPortalViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  routes: Route[];
  contracts: Contract[];
  receipts: PaymentReceipt[];
  emplacements: Emplacement[];
  collectionProofs?: CollectionProof[];
  onAddEmplacement: (emp: Emplacement) => void;
  onUpdateEmplacement: (emp: Emplacement) => void;
  onDeleteEmplacement: (id: string) => void;
  onUpdateSubscriber: (updatedSub: Subscriber) => void;
  onPayInvoice: (invoiceId: string, paymentMethod: string) => void;
  onAddNotification: (newNotif: any) => void;
  onAddContract: (cnt: Contract) => void;
  onUpdateContract: (cnt: Contract) => void;
  onAddReceipt: (rec: PaymentReceipt) => void;
  onAddHistoryLog: (log: Omit<SubscriptionHistoryLog, 'id' | 'timestamp'>) => void;
  loggedClient: Subscriber;
  onLogoutCentral: () => void;
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export default function ClientPortalView({
  subscribers,
  invoices,
  plans,
  routes,
  contracts,
  receipts,
  emplacements,
  collectionProofs = [],
  onAddEmplacement,
  onUpdateEmplacement,
  onDeleteEmplacement,
  onUpdateSubscriber,
  onPayInvoice,
  onAddNotification,
  onAddContract,
  onUpdateContract,
  onAddReceipt,
  onAddHistoryLog,
  loggedClient,
  onLogoutCentral,
  theme = 'light',
  setTheme = () => {}
}: ClientPortalViewProps) {
  const [activeTab, setActiveTabState] = useState<'dashboard' | 'contract' | 'invoices' | 'receipts' | 'collections' | 'claims' | 'profile' | 'emplacements'>(() => {
    const saved = localStorage.getItem('akpbf_client_active_tab');
    return (saved as any) || 'dashboard';
  });

  const setActiveTab = (tab: 'dashboard' | 'contract' | 'invoices' | 'receipts' | 'collections' | 'claims' | 'profile' | 'emplacements') => {
    setActiveTabState(tab);
    localStorage.setItem('akpbf_client_active_tab', tab);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Invoice Payment Processing State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentVendor, setPaymentVendor] = useState<'orange' | 'wave' | 'card'>('orange');
  const [paymentPhone, setPaymentPhone] = useState(loggedClient.phone || '+225 07 ');
  const [paymentOtp, setPaymentOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Printable Document Preview Modal
  const [activePdfDoc, setActivePdfDoc] = useState<{ type: 'contract' | 'invoice' | 'receipt' | 'attestation'; data: any } | null>(null);

  // Claims (Réclamations) State
  const [newClaimCat, setNewClaimCat] = useState('Collecte oubliée');
  const [newClaimDesc, setNewClaimDesc] = useState('');
  const [claimsList, setClaimsList] = useState([
    { id: 'REC-2026-001', category: 'Bac endommagé', desc: 'Roue cassée par le camion lors de la levée.', date: '2026-05-18', status: 'En cours' },
    { id: 'REC-2026-002', category: 'Retard de ramassage', desc: 'Camion en retard de 24h par rapport au planning.', date: '2026-05-10', status: 'Résolu' }
  ]);

  // Direct profile modification
  const [profileEmail, setProfileEmail] = useState(loggedClient.email || '');
  const [profilePhone, setProfilePhone] = useState(loggedClient.phone || '');
  const [profileAddress, setProfileAddress] = useState(loggedClient.address || '');

  // 1. Find client Contract
  const activeContract = useMemo(() => {
    return contracts.find(c => c.subscriberId === loggedClient.id) || null;
  }, [contracts, loggedClient]);

  // 2. Fetch logged client invoices
  const clientInvoices = useMemo(() => {
    return invoices.filter(i => i.subscriberId === loggedClient.id);
  }, [invoices, loggedClient]);

  // 3. Unpaid Balance specific to this client
  const clientBalance = useMemo(() => {
    return clientInvoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [clientInvoices]);

  // 4. Fetch logged client receipts
  const clientReceipts = useMemo(() => {
    return receipts.filter(r => r.subscriberId === loggedClient.id);
  }, [receipts, loggedClient]);

  const activePlan = useMemo(() => {
    return plans.find(p => p.id === loggedClient.planId) || plans[0];
  }, [plans, loggedClient]);

  const renderClientSidebarButton = (
    tabId: 'dashboard' | 'contract' | 'invoices' | 'receipts' | 'collections' | 'claims' | 'profile' | 'emplacements',
    label: string,
    IconComponent: any,
    colorTheme: 'emerald' | 'amber' = 'emerald',
    pulseEffect = false,
    badge?: string | number
  ) => {
    const isActive = activeTab === tabId;
    
    const colors = {
      emerald: {
        activeBg: 'text-emerald-400 font-extrabold',
        hoverBg: 'hover:bg-slate-800/40 hover:text-emerald-300',
        iconActive: 'text-emerald-400',
        iconHover: 'group-hover:text-emerald-400',
        pillColor: 'bg-emerald-950/40 border-l-4 border-l-emerald-500 border-r border-t border-b border-emerald-900/30'
      },
      amber: {
        activeBg: 'text-amber-400 font-extrabold',
        hoverBg: 'hover:bg-slate-800/40 hover:text-amber-300',
        iconActive: 'text-amber-400',
        iconHover: 'group-hover:text-amber-400',
        pillColor: 'bg-amber-955/40 border-l-4 border-l-amber-500 border-r border-t border-b border-amber-900/30'
      }
    };

    const c = colors[colorTheme];

    return (
      <button
        type="button"
        onClick={() => { setActiveTab(tabId); setIsSidebarOpen(false); }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs transition-all duration-305 ease-out group select-none cursor-pointer relative ${
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
        {badge !== undefined && badge !== 0 && (
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide relative z-10 ${
            isActive ? 'bg-slate-950 text-emerald-400 border border-emerald-950/30' : 'bg-red-500 text-white animate-pulse'
          }`}>
            {badge}
          </span>
        )}
        {isActive && (
          <motion.span
            layoutId="activeClientTabBackground"
            className={`absolute inset-0 rounded-xl -z-10 ${c.pillColor}`}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          />
        )}
      </button>
    );
  };

  // Handle Contract electronic signature submit
  const handleElectronicSignatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedSignature.trim() && !hasDrawn) {
      alert('Veuillez signer électroniquement en écrivant votre nom ou en traçant votre signature.');
      return;
    }

    if (!activeContract) return;

    // Transition contract to Signed & Active status
    const updatedContract: Contract = {
      ...activeContract,
      status: 'active',
      signatureDate: '2026-05-23',
      signedOnline: true
    };

    onUpdateContract(updatedContract);

    // Also transition subscriber status to active if pending_validation
    if (loggedClient.status === 'pending_validation' || loggedClient.status === 'draft') {
      onUpdateSubscriber({
        ...loggedClient,
        status: 'active'
      });
    }

    onAddHistoryLog({
      subscriberId: loggedClient.id,
      subscriberName: loggedClient.name,
      action: 'state_change',
      newState: 'active',
      description: `Signature électronique effectuée en ligne par le citoyen pour le contrat ${activeContract.contractNumber}.`,
      operator: 'Authentification Citoyen'
    });

    setIsSignModalOpen(false);
    setTypedSignature('');
    setHasDrawn(false);
    alert('Félicitations ! Votre contrat a été validé et signé électroniquement avec succès.');
  };

  // Process Simulated MM Payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    if (!otpSent && paymentVendor !== 'card') {
      setOtpSent(true);
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      onPayInvoice(payingInvoice.id, paymentMethodLabel(paymentVendor));

      // Generate instant payment receipt!
      const receiptId = `REC-2026-${String(receipts.length + 101).padStart(4, '0')}`;
      const newRec: PaymentReceipt = {
        id: receiptId,
        paymentRef: `PAY-TX-${Math.floor(Math.random() * 900000 + 100000)}`,
        subscriberId: loggedClient.id,
        subscriberName: loggedClient.name,
        contractNumber: activeContract ? activeContract.contractNumber : 'CNT-2026-MUNI',
        invoiceId: payingInvoice.id,
        paymentDate: '2026-05-23',
        amountPaid: payingInvoice.amount,
        paymentMethod: paymentMethodLabel(paymentVendor),
        remainingBalance: Math.max(0, clientBalance - payingInvoice.amount),
        electronicSignature: `CERT-SIG-${Math.floor(Math.random() * 8000 + 1000)}-AKPBF`
      };

      onAddReceipt(newRec);

      onAddHistoryLog({
        subscriberId: loggedClient.id,
        subscriberName: loggedClient.name,
        action: 'payment',
        newState: 'active',
        description: `Paiement en ligne de ${payingInvoice.amount} FCFA pour la facture ${payingInvoice.id}. Reçu ${receiptId} généré.`,
        operator: 'Portail Client'
      });

      setIsProcessingPayment(false);
      setPayingInvoice(null);
      setOtpSent(false);
      setPaymentOtp('');
      
      alert(`Votre paiement a été traité en sécurité. Le reçu n° ${receiptId} est à votre disposition.`);
    }, 1500);
  };

  const paymentMethodLabel = (v: 'orange' | 'wave' | 'card') => {
    if (v === 'orange') return 'Orange Money';
    if (v === 'wave') return 'Wave';
    return 'Carte Bancaire';
  };

  // Submit Claim
  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaimDesc.trim()) return;

    const newC = {
      id: `REC-2026-${String(claimsList.length + 101).padStart(3, '0')}`,
      category: newClaimCat,
      desc: newClaimDesc,
      date: '2026-05-23',
      status: 'En cours'
    };

    setClaimsList([newC, ...claimsList]);
    setNewClaimDesc('');
    alert('Votre réclamation a été transmise au service d\'hygiène communal de la mairie d\'Abidjan.');
  };

  // Save profile info
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSubscriber({
      ...loggedClient,
      email: profileEmail,
      phone: profilePhone,
      address: profileAddress
    });
    alert('Fiche de contact mise à jour dans la base sécurisée de la mairie.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row antialiased font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200" id="client-portal-view-container">
      
      {/* CLIENT MOBILE HEADER */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1 rounded-lg text-white font-black text-[10px] sm:text-xs">PORTAIL</div>
          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white">Citoyen AKPBF</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          {loggedClient && (
            <UserProfileMenu 
              user={{
                id: loggedClient.id,
                name: loggedClient.name,
                email: loggedClient.email,
                role: 'CLIENT' as const,
                phone: loggedClient.phone,
                subscriberId: loggedClient.id
              }}
              onLogout={onLogoutCentral}
              subscriberDetails={loggedClient}
            />
          )}
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 px-2 border border-slate-700 bg-slate-800 rounded-lg hover:bg-slate-700 active:scale-95 transition text-slate-300"
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

      {/* Client Sidebar Interface Layout */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 flex flex-col justify-between p-5 border-r border-slate-850 w-64 transition-transform duration-250 ease-in-out shrink-0 h-screen overflow-y-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 font-mono text-white text-xs p-1.5 rounded-lg font-black">AK_PREM</div>
              <div>
                <h2 className="text-white text-sm font-black tracking-tight">Portail Citoyen</h2>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">AKPBF AL-SALUBRITÉ</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-450 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1 block">
            {renderClientSidebarButton('dashboard', 'Tableau de Bord', Layers)}
            {renderClientSidebarButton('contract', "Mon Contrat d'Enlèvement", FileCheck2)}
            {renderClientSidebarButton('invoices', 'Mes Factures de Salubrité', CreditCard, 'emerald', false, clientInvoices.filter(i => i.status !== 'paid').length)}
            {renderClientSidebarButton('receipts', 'Mes Reçus Officiels', Printer)}
            {renderClientSidebarButton('collections', 'Mes Collectes Historiques', Clock)}
            {renderClientSidebarButton('claims', 'Mes Réclamations Mairie', AlertTriangle, 'amber')}
            {renderClientSidebarButton('emplacements', 'Mes Emplacements', MapPin, 'amber', true, emplacements.filter(e => e.subscriberId === loggedClient.id).length)}
            {renderClientSidebarButton('profile', 'Mon Profil & Contact', User)}
          </nav>
        </div>

        {/* Bottom Profile Logged and Logout */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs uppercase">
              {loggedClient.name.substring(0,2)}
            </div>
            <div className="text-[11px] font-semibold text-slate-300 leading-tight">
              <div className="text-white truncate max-w-[130px] font-bold">{loggedClient.name}</div>
              <div className="text-slate-500 font-mono font-bold mt-0.5">{loggedClient.id}</div>
            </div>
          </div>

          <button
            onClick={() => { onLogoutCentral(); setIsSidebarOpen(false); }}
            className="w-full py-2 bg-slate-850 hover:bg-red-950/40 hover:text-red-400 text-slate-400 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-800 hover:border-red-900/60 animate-none shrink-0"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion Sécurisée
          </button>
        </div>
      </aside>

      {/* Main viewport Client tab contents */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen">
        {/* Dynamic header simulation bar */}
        <div className="bg-white border-b border-slate-100 p-4 md:px-8 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-slate-100 py-1.5 px-3 rounded-xl border border-slate-200/60 text-[10px] font-mono font-bold tracking-tight text-slate-500 flex-1 max-w-lg">
            <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-emerald-700">https://</span>
            <span className="text-slate-700">akpbf-salubrite.ci/portal/{activeTab}</span>
          </div>

          <div className="flex items-center gap-3.5 pl-4">
            <UserProfileMenu 
              user={{
                id: loggedClient.id,
                name: loggedClient.name,
                email: loggedClient.email,
                role: 'CLIENT' as const,
                phone: loggedClient.phone,
                subscriberId: loggedClient.id
              }}
              onLogout={onLogoutCentral}
              subscriberDetails={loggedClient}
            />
          </div>
        </div>

        {/* Dashboard display tabs */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header greeting */}
              <div className="bg-radial from-slate-900 to-slate-950 p-6 md:p-8 rounded-3xl border border-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-2 relative z-10">
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest font-mono">PORTAIL CITOYEN DE L'ASSAINISSEMENT</span>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight leading-none">Akwaba, {loggedClient.name} !</h3>
                  <p className="text-slate-400 text-xs font-medium max-w-xl">
                    Suivez vos livraisons de bacs, vos contributions de salubrité, visualisez votre contrat d'adhésion officielle et téléchargez vos justificatifs fiscaux d'assainissement d'Abidjan.
                  </p>
                </div>
              </div>

              {/* Status summary bento grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Contract widget */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Contrat Principal</span>
                    <FileText className="h-4.5 w-4.5 text-indigo-550" />
                  </div>
                  <div>
                    <h5 className="font-black font-mono text-slate-850 text-md leading-none">
                      {activeContract ? activeContract.contractNumber : 'Brouillon'}
                    </h5>
                    <p className="text-[10.5px] text-slate-500 font-semibold mt-1">
                      {activeContract ? `Signé le ${activeContract.signatureDate || 'En attente'}` : 'Génération municipale nécessaire'}
                    </p>
                  </div>
                </div>

                {/* Sub status widget */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Abonnement Mairie</span>
                    <Layers className="h-4.5 w-4.5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        loggedClient.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`} />
                      <span className="font-black text-xs text-slate-800 capitalize">
                        {loggedClient.status === 'active' ? 'Actif' : 'En dépôt d\'activation'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-serif block truncate mt-1">
                      {activePlan.name}
                    </p>
                  </div>
                </div>

                {/* Expiration date widget */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Échéance du bail</span>
                    <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                  </div>
                  <div>
                    <h5 className="font-black text-sm text-slate-800 font-mono leading-none">
                      {activeContract ? activeContract.endDate : 'Jamais'}
                    </h5>
                    <p className="text-[10.5px] text-emerald-600 font-bold mt-1">Renouvellement tacite</p>
                  </div>
                </div>

                {/* Remaining balance widget */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Solde Restant Dû</span>
                    <Coins className="h-4.5 w-4.5 text-amber-500" />
                  </div>
                  <div>
                    <h5 className={`font-mono font-black text-md leading-none ${
                      clientBalance > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-650'
                    }`}>
                      {clientBalance.toLocaleString()} FCFA
                    </h5>
                    <p className="text-[10.5px] text-slate-500 font-semibold mt-1">
                      {clientBalance > 0 ? 'Facture en souffrance' : 'Tous vos frais sont à jour'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoices list and recent garbage collections layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recent Collections */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-black text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Clock className="h-4.5 w-4.5 text-indigo-550" />
                      Dernières collectes effectuées
                    </h4>
                    <button onClick={() => setActiveTab('collections')} className="text-[11px] font-bold text-emerald-600 hover:underline">Voir Historique</button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3 text-xs leading-tight">
                      <div className="w-1.5 h-12 bg-emerald-500 rounded-full shrink-0" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800">Bac vidé entièrement</div>
                        <div className="text-[11px] text-slate-500">Secteur d'Abidjan : {loggedClient.neighborhood} • Benne d'Assainissement</div>
                        <div className="text-[10px] text-indigo-600 font-bold font-mono">20 Mai 2026 à 07:29</div>
                      </div>
                    </div>

                    <div className="flex gap-3 text-xs leading-tight opacity-75">
                      <div className="w-1.5 h-12 bg-emerald-500 rounded-full shrink-0" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-700">Bac vidé entièrement</div>
                        <div className="text-[11px] text-slate-500">Secteur d'Abidjan : {loggedClient.neighborhood} • Benne d'Assainissement</div>
                        <div className="text-[10px] text-indigo-600 font-bold font-mono">16 Mai 2026 à 08:05</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Unpaid Invoices */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-black text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <CreditCard className="h-4.5 w-4.5 text-amber-555" />
                      Facturation récente
                    </h4>
                    <button onClick={() => setActiveTab('invoices')} className="text-[11px] font-bold text-emerald-605 hover:underline">Gérer Factures</button>
                  </div>

                  <div className="space-y-3">
                    {clientInvoices.length === 0 ? (
                      <p className="text-center text-slate-400 py-4 font-semibold text-xs">Aucune facture émise.</p>
                    ) : (
                      clientInvoices.slice(0, 2).map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono font-black text-indigo-600 block">{inv.id}</span>
                            <div className="font-bold text-slate-800">Assainissement - {inv.period}</div>
                            <div className="text-[10.5px] text-slate-400 font-semibold">Échéance : {inv.dueDate}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-mono font-black text-slate-900">{inv.amount.toLocaleString()} FCFA</div>
                            {inv.status === 'paid' ? (
                              <span className="inline-flex px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-lg">Payé</span>
                            ) : (
                              <button
                                onClick={() => setPayingInvoice(inv)}
                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black hover:bg-emerald-700 transition cursor-pointer"
                              >
                                Payer en ligne
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Mon Contrat */}
          {activeTab === 'contract' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                <div>
                  <h3 className="text-md font-black text-slate-800 tracking-tight">Votre Engagement de Salubrité</h3>
                  <p className="text-xs text-slate-500 font-medium font-mono">ID Contrat : {activeContract ? activeContract.contractNumber : 'Brouillon municipal'}</p>
                </div>

                <div className="flex gap-2">
                  {activeContract && (
                    <button
                      onClick={() => setActivePdfDoc({ type: 'contract', data: activeContract })}
                      className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-150 transition flex items-center gap-1.5"
                    >
                      <Download className="h-4 w-4" />
                      Visualiser PDF
                    </button>
                  )}

                  {activeContract && activeContract.status !== 'active' && activeContract.status !== 'signed' && (
                    <button
                      onClick={() => setIsSignModalOpen(true)}
                      className="px-4 py-2 bg-emerald-605 text-white rounded-xl text-xs font-black shadow-sm hover:bg-emerald-700 transition flex items-center gap-1.5"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      Signer le contrat en ligne
                    </button>
                  )}
                </div>
              </div>

              {!activeContract ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Aucun Contrat Actif Détecté</h4>
                    <p className="text-slate-500 text-xs font-medium max-w-md mx-auto mt-1">
                      Votre fiche d'assainissement est enregistrée mais la mairie n'a pas encore lié de contrat officiel à votre compte. Veuillez faire une demande ou contacter le support.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Visual constraints paper */}
                  <div className="md:col-span-2 border border-slate-200 bg-slate-50/50 p-6 md:p-8 rounded-2xl max-h-[500px] overflow-y-auto font-mono text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap">
                    <div className="text-center font-bold text-slate-900 border-b border-slate-300 pb-3 mb-4 text-xs">
                      CONTRAT OFFICIEL AKPBF - ENREGISTRÉ SOUS LA RÉF {activeContract.contractNumber}
                    </div>
                    {activeContract.termsAndConditions}
                  </div>

                  {/* Sidebar stats panel */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 text-xs font-medium">
                      <h4 className="font-black text-slate-800 uppercase text-[10px] border-b border-slate-200 pb-1">DÉTAILS COMPLÉMENTAIRES</h4>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="text-slate-400 font-bold uppercase text-[9px]">Type Forfait</div>
                          <div className="font-bold text-slate-700">{activeContract.planName}</div>
                        </div>

                        <div>
                          <div className="text-slate-400 font-bold uppercase text-[9px]">Frais Forfaitaires</div>
                          <span className="font-black text-emerald-650 font-mono">{activeContract.amount.toLocaleString()} FCFA / Mois</span>
                        </div>

                        <div>
                          <div className="text-slate-400 font-bold uppercase text-[9px]">Début d'effet</div>
                          <span className="font-mono text-slate-600 font-bold">{activeContract.startDate}</span>
                        </div>

                        <div>
                          <div className="text-slate-400 font-bold uppercase text-[9px]">Date de fin</div>
                          <span className="font-mono text-slate-600 font-bold">{activeContract.endDate}</span>
                        </div>

                        <div>
                          <div className="text-slate-400 font-bold uppercase text-[9px]">État du Document</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block mt-1 ${
                            activeContract.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {activeContract.status === 'active' || activeContract.status === 'signed' ? 'Accepté & Signé en Ligne' : 'Abonnement en attente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/60 p-4 space-y-2.5 text-xs text-emerald-700">
                      <h5 className="font-bold flex items-center gap-1.5 uppercase text-[10px]">
                        <Check className="h-4.5 w-4.5 shrink-0" />
                        Signature Électronique Prévue
                      </h5>
                      <p className="leading-normal font-medium text-[11px]">
                        Grâce au certificat immuable de la mairie d'Abidjan, validez d'un clic votre engagement pour passer d'En attente à Actif.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mes Factures */}
          {activeTab === 'invoices' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-800 tracking-tight">Vos Factures Émises</h3>
                <p className="text-xs text-slate-500 font-medium">Contrôle fiscal d'assainissement domestique</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-4">Référence Facture</th>
                      <th className="p-4">Période concernée</th>
                      <th className="p-4">Date Limite de paiement</th>
                      <th className="p-4">Montant Exigible</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {clientInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Aucune facture en attente.</td>
                      </tr>
                    ) : (
                      clientInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="p-4 font-bold font-mono text-indigo-650">{inv.id}</td>
                          <td className="p-4 font-bold text-slate-700">{inv.period}</td>
                          <td className="p-4 text-slate-500 font-mono font-bold">{inv.dueDate}</td>
                          <td className="p-4 font-black font-mono text-slate-850">{inv.amount.toLocaleString()} FCFA</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {inv.status === 'paid' ? 'Acquittée' : 'En souffrance'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {inv.status !== 'paid' && (
                                <button
                                  onClick={() => setPayingInvoice(inv)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white font-black rounded-lg transition"
                                >
                                  Régler la facture
                                </button>
                              )}
                              <button
                                onClick={() => setActivePdfDoc({ type: 'invoice', data: inv })}
                                className="p-1.5 bg-slate-50 hover:bg-slate-150 text-slate-600 rounded-lg transition"
                                title="Imprimer Facture"
                              >
                                <Printer className="h-4 w-4" />
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
          )}

          {/* Mes Reçus */}
          {activeTab === 'receipts' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-800 tracking-tight">Vos Reçus de Paiement Officiels</h3>
                <p className="text-xs text-slate-500 font-medium">Preuves électroniques d'assainissement communal</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientReceipts.length === 0 ? (
                  <p className="col-span-3 text-center text-slate-400 py-8 font-semibold text-xs">Aucun reçu trouvé. Réglez une facture pour générer automatiquement un reçu de paiement PDF.</p>
                ) : (
                  clientReceipts.map((rec) => (
                    <div key={rec.id} className="p-5 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-black text-indigo-650 uppercase">{rec.id}</span>
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-550" />
                        </div>
                        
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">Montant libéré</div>
                          <div className="font-mono font-black text-slate-800 text-sm">{rec.amountPaid.toLocaleString()} FCFA</div>
                        </div>

                        <div className="text-[11px] font-medium text-slate-500 space-y-1">
                          <div>Mode de paiement : <strong className="text-slate-700">{rec.paymentMethod}</strong></div>
                          <div>Date de transaction : <span className="font-mono font-semibold">{rec.paymentDate}</span></div>
                          <div>Réf: <span className="font-mono font-semibold">{rec.paymentRef}</span></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <span className="text-[9.5px] font-mono font-black text-slate-400 block truncate max-w-[120px]" title={rec.electronicSignature}>
                          {rec.electronicSignature}
                        </span>
                        
                        <button
                          onClick={() => setActivePdfDoc({ type: 'receipt', data: rec })}
                          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-[10.5px] transition flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Reçu PDF
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Collectes */}
          {activeTab === 'collections' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-800 tracking-tight text-left">Rapports d'enlèvement et levées de bacs</h3>
                <p className="text-xs text-slate-500 font-medium text-left">Tracking RFID municipal en temps réel</p>
              </div>

              <div className="p-4 bg-emerald-50/20 rounded-2xl border border-emerald-100 text-emerald-800 flex items-start gap-3 text-left">
                <MapPin className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">Informations logistiques du secteur : </span>
                  Votre résidence est située dans le secteur de ramassage officiel <strong className="text-slate-900">{loggedClient.neighborhood}</strong>. 
                  Votre bac <strong className="text-slate-900">{loggedClient.binType}</strong> est équipé d'un tag RFID de voirie assurant la consignation automatique du vidage.
                </div>
              </div>

              {(() => {
                const clientCollectionProofs = collectionProofs.filter(p => 
                  p.clientId === loggedClient.id || 
                  p.clientId === (loggedClient as any).subscriberId ||
                  p.clientName.toLowerCase() === loggedClient.name.toLowerCase()
                );

                if (clientCollectionProofs.length === 0) {
                  return (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-xs text-slate-500 font-bold">Aucune preuve de collecte enregistrée pour le moment.</p>
                      <p className="text-[10px] text-slate-400">Le camion municipal passera d'ici peu selon votre planning d'abonnement.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 text-left">
                    <div className="relative border-l border-slate-200 pl-6 space-y-6 text-xs font-medium">
                      {clientCollectionProofs.map((proof) => (
                        <div key={proof.id} className="relative">
                          <span className="absolute -left-[30px] top-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center font-bold text-white text-[8px]">
                            ✓
                          </span>
                          <div className="font-bold text-slate-800 text-sm">
                            Rapport de service n° {proof.id}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-1 space-y-1">
                            <p>{proof.comments || 'Collecte accomplie.'}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 bg-slate-50 p-2 rounded-xl text-[10px]">
                              <div>
                                <span className="text-slate-400 block font-normal">Véhicule de passage :</span>
                                <strong className="text-slate-700">{proof.vehiclePlate}</strong> ({proof.agentName})
                              </div>
                              <div>
                                <span className="text-slate-400 block font-normal">Validation :</span>
                                <strong>RFID Conforme ({proof.qrCodeVal})</strong>
                              </div>
                            </div>
                          </div>
                          <div className="text-[11px] text-indigo-650 font-bold font-mono mt-1 w-full flex flex-wrap justify-between items-center bg-indigo-50/50 p-1.5 px-3 rounded-lg gap-2">
                            <span>Le {proof.collectionDate} à {proof.collectionTime}</span>
                            <span className="text-[10px] text-zinc-550 font-sans tracking-wide">Signature : <strong>{proof.clientSignature || 'STAMP-OK'}</strong></span>
                          </div>
                        </div>
                      ))}

                      {/* Standard background setup history line */}
                      <div className="relative">
                        <span className="absolute -left-[30px] top-0.5 w-4 h-4 bg-slate-400 rounded-full border-2 border-white flex items-center justify-center font-bold text-white text-[8px]">
                          ✓
                        </span>
                        <div className="font-bold text-slate-700">Prise en charge initiale</div>
                        <div className="text-slate-550 text-[11px] mt-0.5">Livraison à domicile et consignation informatique du bac standard.</div>
                        <div className="text-[10px] text-slate-400 font-bold font-mono mt-1">10 Novembre 2025</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Réclamations */}
          {activeTab === 'claims' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h3 className="text-md font-black text-slate-800 border-b border-slate-100 pb-2">Déposer une nouvelle requête de voirie</h3>
                
                <form onSubmit={handleAddClaim} className="space-y-4 text-xs font-medium">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nature de l'incident / Catégorie</label>
                    <select
                      value={newClaimCat}
                      onChange={(e) => setNewClaimCat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-bold"
                    >
                      <option value="Collecte oubliée">Collecte oubliée (Bac non vidé)</option>
                      <option value="Réclamation Contrat">Réclamation concernant le contrat</option>
                      <option value="Bac cassé / Vandalisé">Bac détruit, volé ou endommagé</option>
                      <option value="Retard intempestif">Retards répétés d'enlèvement</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Description précise des faits</label>
                    <textarea
                      required
                      value={newClaimDesc}
                      onChange={(e) => setNewClaimDesc(e.target.value)}
                      rows={4}
                      placeholder="Détaillez le problème rencontré (ex: le camion a sauté Cocody Ouest le jeudi 21...)"
                      className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 p-3 rounded-xl font-medium"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                    Transmettre ma réclamation
                  </button>
                </form>
              </div>

              {/* Claims tracking history list */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase text-slate-400 tracking-wider">Suivi de vos requêtes</h4>
                
                <div className="space-y-3.5 max-h-[400px] overflow-y-auto">
                  {claimsList.map((claim) => (
                    <div key={claim.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{claim.category}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          claim.status === 'Résolu' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">{claim.desc}</p>
                      <div className="text-[9.5px] text-slate-400 font-mono font-bold">{claim.date} • {claim.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Emplacements Multi-sites */}
          {activeTab === 'emplacements' && (
            <EmplacementsView 
              emplacements={emplacements}
              subscribers={subscribers}
              onAddEmplacement={onAddEmplacement}
              onUpdateEmplacement={onUpdateEmplacement}
              onDeleteEmplacement={onDeleteEmplacement}
              currentLoggedClient={loggedClient}
            />
          )}

          {/* Profil */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs max-w-xl mx-auto space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-800 tracking-tight">Vos Identifiants d'Abonnés</h3>
                <p className="text-xs text-slate-500 font-medium font-mono">ID de Citoyen Abidjan : {loggedClient.id}</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-medium">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Nom Complet d'état Civil (Immuable)</label>
                  <input
                    type="text"
                    disabled
                    value={loggedClient.name}
                    className="w-full bg-slate-100 border border-slate-200 outline-none text-slate-500 px-3 py-2.5 rounded-xl font-bold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Adresse E-mail Enregistrée</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 px-3 py-2.5 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Numéro de Téléphone (Mobile Money)</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 px-3 py-2.5 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Adresse Résidentielle de Salubrité</label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 px-3 py-2.5 rounded-xl font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer"
                  >
                    Enregistrer mes informations
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* Electronic Sign Draw Modal */}
      {isSignModalOpen && activeContract && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsSignModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2 mb-2">
              <FileCheck2 className="h-5 w-5 text-emerald-600" />
              Signature Électronique Certifiée
            </h3>
            
            <p className="text-[11px] text-slate-500 mb-4 font-medium leading-relaxed">
              En signant ce contrat, vous déclarez accepter de manière inconditionnelle les Conditions Générales de Salubrité d'enlèvement urbain d'Abidjan.
            </p>

            <form onSubmit={handleElectronicSignatureSubmit} className="space-y-4 text-xs font-medium text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Méthode 1 : Prénom et Nom pour Signature</label>
                <input
                  type="text"
                  placeholder="Écrivez votre nom (Ex: Koffi Jean-Jacques)"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none p-2.5 rounded-xl font-bold font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Méthode 2 : Tracé Visuel de Signature (Optionnel)</label>
                <div 
                  className="h-28 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center relative select-none cursor-crosshair border-dashed border-slate-400"
                  onMouseDown={() => { setIsDrawingSignature(true); setHasDrawn(true); }}
                  onMouseUp={() => setIsDrawingSignature(false)}
                  onMouseLeave={() => setIsDrawingSignature(false)}
                >
                  {hasDrawn ? (
                    <div className="font-serif italic text-emerald-700 text-base font-black opacity-80">
                      {typedSignature || loggedClient.name}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[10.5px] font-bold">Tracez votre signature avec le curseur</span>
                  )}
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setHasDrawn(false); }}
                      className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-[10px] font-bold rounded"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl space-y-1">
                <span className="text-[9.5px] font-black text-emerald-800 uppercase block tracking-wider font-mono">Considérations Juridiques :</span>
                <span className="text-[10.5px] text-emerald-750 block leading-normal leading-relaxed">
                  L'inscription de votre nom et son enregistrement confèrent à cette transaction une valeur d'authentification valide auprès des tribunaux civils d'Abidjan.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-750 text-white font-black rounded-xl transition cursor-pointer shadow-md"
              >
                Accepter les Conditions & Signer mon contrat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Mobile Money Simulated Cashier Drawer */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setPayingInvoice(null);
                setOtpSent(false);
              }}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2 mb-1">
              <CreditCard className="h-5 w-5 text-emerald-600" />
              Paiement Sécurisé Mobile Money
            </h3>
            
            <p className="text-[11px] text-slate-500 mb-4 font-medium leading-relaxed">
              Réglement de la facture <strong className="text-indigo-600 font-mono">{payingInvoice.id}</strong> pour le montant de <strong className="text-emerald-700 font-mono">{payingInvoice.amount.toLocaleString()} FCFA</strong>.
            </p>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs font-medium text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Opérateur de Trésorerie</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setPaymentVendor('orange'); setOtpSent(false); }}
                    className={`py-2 px-3 border rounded-xl text-center text-[10.5px] font-black transition cursor-pointer ${
                      paymentVendor === 'orange' ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Orange Money
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentVendor('wave'); setOtpSent(false); }}
                    className={`py-2 px-3 border rounded-xl text-center text-[10.5px] font-black transition cursor-pointer ${
                      paymentVendor === 'wave' ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Wave
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentVendor('card'); setOtpSent(false); }}
                    className={`py-2 px-3 border rounded-xl text-center text-[10.5px] font-black transition cursor-pointer ${
                      paymentVendor === 'card' ? 'bg-slate-900 text-white border-slate-950 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Carte Bancaire
                  </button>
                </div>
              </div>

              {paymentVendor !== 'card' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de Téléphone associé</label>
                    <input
                      type="text"
                      required
                      placeholder="+225 "
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none p-2.5 rounded-xl font-bold font-mono text-[11.5px]"
                    />
                  </div>

                  {otpSent && (
                    <div className="space-y-1 animate-in slide-in-from-top-2">
                      <label className="text-[10px] text-emerald-600 font-bold">Saisir le Code d'autorisation reçu par SMS</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 88921"
                        value={paymentOtp}
                        onChange={(e) => setPaymentOtp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none p-2.5 rounded-xl font-black text-center font-mono tracking-widest text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {paymentVendor === 'card' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Numéro de carte bancaire</label>
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none p-2.5 rounded-xl font-bold font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Expiration</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/AA"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 p-2 rounded-xl text-center font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">CVC</label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        maxLength={3}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 p-2 rounded-xl text-center font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition flex items-center justify-center gap-2 shadow-md"
              >
                {isProcessingPayment ? (
                  <span>Transaction d'assainissement en cours...</span>
                ) : (
                  <>
                    <Check className="h-4.5 w-4.5" />
                    <span>{otpSent || paymentVendor === 'card' ? 'Confirmer le débit sécurisé' : 'Demander le code OTP par SMS'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF Engine Glory Modal for Client Portal */}
      {activePdfDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 flex flex-col justify-between max-h-[90vh]">
            <button
              onClick={() => setActivePdfDoc(null)}
              className="absolute top-4 right-4 p-1.5 bg-white hover:bg-slate-200 text-slate-550 rounded-full transition shadow-xs z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-550" />
                <h4 className="font-extrabold text-slate-700 text-[10px] uppercase font-mono tracking-wider">Aperçu du Certificat PDF Généré (Mairie d'Abidjan)</h4>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await documentService.printPdf(activePdfDoc.type, activePdfDoc.data.id || activePdfDoc.data.contractNumber);
                    } catch (e) {
                      alert("Erreur lors du traitement de l'impression.");
                    }
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-[10.5px] transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimer
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await documentService.downloadPdf(activePdfDoc.type, activePdfDoc.data.id || activePdfDoc.data.contractNumber);
                    } catch (e) {
                      alert("Erreur lors du téléchargement du document.");
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10.5px] transition flex items-center gap-1.5 shadow-md"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </button>
              </div>
            </div>

            {/* High fidelity PDF paper preview */}
            <div className="flex-1 overflow-y-auto bg-white p-8 md:p-11 rounded-2xl shadow-inner border border-slate-250 font-sans text-slate-800 text-xs relative max-w-full leading-relaxed">
              {/* Paper Background watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <div className="border-[15px] border-emerald-555 p-20 rounded-full text-[85px] font-black tracking-widest text-emerald-650 rotate-45">AKPBF</div>
              </div>

              {/* PDF Contents Switches */}
              <div className="space-y-6 relative">
                {/* Header metadata layout */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="bg-emerald-650 text-white font-serif font-black text-sm p-1.5 rounded-lg tracking-wider">AKPBF</div>
                      <span className="font-serif font-extrabold text-sm tracking-tight text-slate-950">AKPBF ASSAINISSEMENT</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-medium font-mono">République de Côte d'Ivoire • Union - Discipline - Travail</p>
                    <p className="text-[8.5px] text-slate-400">Direction de la Salubrité • Boulevard Cadre, Abidjan</p>
                  </div>
                  <div className="text-right text-[10px] space-y-1">
                    <div className="font-black text-rose-600 font-mono">N° : {activePdfDoc.data.id || activePdfDoc.data.contractNumber}</div>
                    <div className="text-slate-505 font-bold uppercase">Réf Document: {activePdfDoc.type.toUpperCase()}_OFFICIEL</div>
                    <div className="text-slate-500 font-semibold font-mono">Date : 23 Mai 2026</div>
                  </div>
                </div>

                {activePdfDoc.type === 'contract' && (
                  <>
                    <div className="text-center py-4">
                      <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest underline decoration-2 decoration-emerald-500">CONTRAT CADRE DE SALUBRITÉ URBAINE</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Fourniture de bac géré et enlèvement planifié des ordures ménagères</p>
                    </div>

                    <div className="grid grid-cols-2 gap-7 p-4 bg-slate-50 rounded-xl border border-slate-100 text-[10.5px]">
                      <div className="space-y-1.5">
                        <div className="font-black text-slate-900 uppercase border-b border-slate-200 pb-1 flex items-center gap-1">L'ENTREPRISE AKPBF</div>
                        <div className="font-bold text-slate-800">AKPBF Salubrité Urbaine SAS</div>
                        <div className="text-slate-500 font-mono">contact@salubrite.akpbf.ci</div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="font-black text-slate-900 uppercase border-b border-slate-200 pb-1 flex items-center gap-1">L'ABONNÉ CITOYEN</div>
                        <div className="font-bold text-slate-800">{loggedClient.name}</div>
                        <div className="text-slate-600">ID d'Abonné ERP: {loggedClient.id}</div>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <h5 className="font-extrabold text-slate-950 border-b border-slate-200 pb-1 uppercase text-[10px]">Article Premier : Forfait & Spécificités Financières</h5>
                      <p className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                        {activePdfDoc.data.termsAndConditions}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-10">
                      <div className="text-left space-y-4">
                        <div className="text-[9px] uppercase font-black text-slate-400">Pour la Direction AKPBF</div>
                        <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-350 bg-slate-50/30 rounded-lg">
                          <span className="font-serif italic text-slate-400 text-[10px]">Seing Mairie Apposé</span>
                        </div>
                      </div>

                      <div className="text-right space-y-4">
                        <div className="text-[9px] uppercase font-black text-slate-400">Signature Citoyen</div>
                        <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-350 bg-emerald-50/20 rounded-lg">
                          <span className="font-mono text-emerald-800 text-[10px] font-bold">SIGNATURE CERTIFIÉE EN LIGNE • {loggedClient.name}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activePdfDoc.type === 'invoice' && (
                  <>
                    <div className="text-center py-4">
                      <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest underline decoration-2 decoration-emerald-500">FACTURE DE PRESTATION MENSUELLE</h3>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div>Abonné Citoyen : <strong className="text-slate-900">{loggedClient.name}</strong></div>
                      <div>ID Client: <span className="font-mono font-bold">{loggedClient.id}</span></div>
                      <div>Période concernée : <strong className="text-slate-900">{activePdfDoc.data.period}</strong></div>
                      <div>Statut : <span className="font-bold text-rose-550">NON REGLEE</span></div>
                    </div>

                    <div className="grid grid-cols-3 border border-slate-200 text-center font-mono text-[11px]">
                      <div className="bg-slate-100 p-2 font-black border-r border-b border-slate-200">Description</div>
                      <div className="bg-slate-100 p-2 font-black border-r border-b border-slate-200">Période</div>
                      <div className="bg-slate-100 p-2 font-black border-b border-slate-200">Montant net</div>
                      <div className="p-2 border-r">Assainissement domestique</div>
                      <div className="p-2 border-r">{activePdfDoc.data.period}</div>
                      <div className="p-2 font-black">{activePdfDoc.data.amount.toLocaleString()} FCFA</div>
                    </div>

                    <div className="text-right font-black text-md text-emerald-650">
                      Total Exigible : {activePdfDoc.data.amount.toLocaleString()} FCFA
                    </div>
                  </>
                )}

                {activePdfDoc.type === 'receipt' && (
                  <>
                    <div className="text-center py-4">
                      <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest underline decoration-2 decoration-emerald-500">REÇU DE PAIEMENT ACQUITTE</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Document de quitus fiscal de salubrité urbaine</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] font-medium space-y-2">
                      <div>Quittance sécurisée à l'intention de : <strong className="text-slate-900">{loggedClient.name}</strong></div>
                      <div>ID d'Abonné Mairie : <span className="font-mono font-bold">{loggedClient.id}</span></div>
                      <div>Référence Contrat Cadre : <span className="font-mono font-bold">{activePdfDoc.data.contractNumber}</span></div>
                      <div>Facture acquittée : <span className="font-mono font-bold text-indigo-650">{activePdfDoc.data.invoiceId}</span></div>
                      <div>Montant payé : <strong className="text-emerald-700 font-mono text-sm">{activePdfDoc.data.amountPaid.toLocaleString()} FCFA</strong></div>
                      <div>Date effectuation : <span className="font-mono font-bold">{activePdfDoc.data.paymentDate}</span></div>
                      <div>Mode de versement : <strong className="text-slate-800">{activePdfDoc.data.paymentMethod}</strong></div>
                      <div>Réf Mairie : <span className="font-mono font-semibold">{activePdfDoc.data.paymentRef}</span></div>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-1.5 text-[10.5px]">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Signature Électronique Certifiée :
                      </div>
                      <p className="font-mono font-bold text-emerald-750 block truncate text-[10px]">
                        {activePdfDoc.data.electronicSignature}
                      </p>
                      <span className="text-[9px] text-slate-500">Ce reçu électronique certifié atteste que l'abonné s'est acquitté de l'ensemble de ses redevances d'assainissement d'Abidjan pour la période concernée.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
