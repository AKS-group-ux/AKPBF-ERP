/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  Layers, 
  User, 
  Smartphone, 
  Camera, 
  ShoppingBag, 
  HelpCircle, 
  LogOut, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Printer, 
  Download, 
  ChevronRight, 
  ShieldAlert, 
  Eye, 
  MessageSquare, 
  Lock, 
  Plus, 
  TrendingUp, 
  Inbox, 
  Check, 
  Bell, 
  RefreshCw,
  Search,
  Sliders,
  X,
  SmartphoneIcon
} from 'lucide-react';
import { Subscriber, Invoice, SubscriptionPlan, Route } from '../types';
import { POSTGRES_SQL_SCHEMA, FASTAPI_MODELS_PYTHON, FASTAPI_REST_API } from '../demo/database_assets';

interface ClientPortalViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  routes: Route[];
  onUpdateSubscriber: (updatedSub: Subscriber) => void;
  onPayInvoice: (invoiceId: string, paymentMethod?: any) => void;
  onAddNotification: (newNotif: any) => void;
}

// Preset products for the Boutique AKPBF
const BOUTIQUE_PRODUCTS = [
  { id: 'prod-01', name: 'Bac Standard d\'Assainissement 240L', description: 'Idéal pour les ménages de 4 à 6 personnes. Haute résilience thermique.', price: 15000, image: 'https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', stock: 140 },
  { id: 'prod-02', name: 'Bac Premium Haute Capacité 360L', description: 'Idéal pour foyers denses et petites entreprises. Traitement spécial anti-odeur.', price: 23000, image: 'https://images.unsplash.com/photo-1621451537084-482c730e3a0a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', stock: 65 },
  { id: 'prod-03', name: 'Conteneur Métallique B2B 1100L', description: 'Conçu pour restaurants, syndics de copropriété et mairies.', price: 110000, image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', stock: 12 },
  { id: 'prod-04', name: 'Kit municipal de 50 Sacs d\'Ordures', description: 'Sacs étanches certifiés Biodégradables par la mairie d\'Abidjan.', price: 4500, image: 'https://images.unsplash.com/photo-1621451537084-482c730e3a0a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', stock: 350 }
];

// Connection logs for security simulation
const INITIAL_SECURITY_LOGS = [
  { id: 1, device: 'Chrome sur macOS Catalina', location: 'Abidjan, Riviera 3', time: 'Aujourd\'hui à 09:30', current: true },
  { id: 2, device: 'Safari sur iPhone 15 Pro', location: 'Abidjan, Plateau', time: 'Hier à 14:15', current: false },
  { id: 3, device: 'Android WebView App AKPBF', location: 'Abidjan, Cocody-Angré', time: '18 Mai 2026', current: false }
];

export default function ClientPortalView({
  subscribers,
  invoices,
  plans,
  routes,
  onUpdateSubscriber,
  onPayInvoice,
  onAddNotification
}: ClientPortalViewProps) {
  
  // Login flow state
  const [currentUser, setCurrentUser] = useState<Subscriber | null>(() => subscribers[0] || null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  
  // Custom login credentials - prefilled with Admin details as requested
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone' | 'id'>('email');
  const [loginEmail, setLoginEmail] = useState('admin@akpbf.com');
  const [loginPassword, setLoginPassword] = useState('Admin@2026');
  const [loginPhone, setLoginPhone] = useState('+225 05 05 05 05');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginId, setLoginId] = useState('AKPBF-000001');
  const [otpSent, setOtpSent] = useState(false);

  // Layout tabs inside the portal
  const [portalTab, setPortalTab] = useState<'dashboard' | 'subscriptions' | 'invoices' | 'payments' | 'collections' | 'bin' | 'boutique' | 'tickets' | 'chat' | 'security' | 'admin' | 'blueprints'>('dashboard');

  // Interactive Simulated Modals & Triggers
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [paymentVendor, setPaymentVendor] = useState<'OM' | 'MOOV' | 'CARD'>('OM');
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('+225 ');
  const [paymentOtpCode, setPaymentOtpCode] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // New Ticket construction state
  const [ticketCategory, setTicketCategory] = useState('Collecte oubliée');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketLocation, setTicketLocation] = useState('Cocody, Abidjan');
  const [ticketFile, setTicketFile] = useState<string | null>(null);
  const [ticketCreatedSuccess, setTicketCreatedSuccess] = useState(false);
  const [clientTickets, setClientTickets] = useState<Array<{
    id: string; category: string; desc: string; date: string; status: 'Ouvert' | 'En cours' | 'Résolu' | 'Fermé'; sector: string; photo?: string;
  }>>([
    { id: 'TCK-2026-004', category: 'Bac endommagé', desc: 'Roue gauche arrachée lors de la dernière levée matinale du camion.', date: '2026-05-18', status: 'En cours', sector: 'Cocody' },
    { id: 'TCK-2026-001', category: 'Retard de passage', desc: 'Le camion habituel de jeudi est passé avec 6 heures de retard.', date: '2026-05-10', status: 'Résolu', sector: 'Cocody' }
  ]);

  // Subscriptions upgrade simulation
  const [selectedUpgradePlanId, setSelectedUpgradePlanId] = useState('');
  const [subscriptionRequestSent, setSubscriptionRequestSent] = useState(false);

  // Interactive Live Chat box states
  const [clientChatMsg, setClientChatMsg] = useState('');
  const [clientChatHistory, setClientChatHistory] = useState<Array<{ sender: 'client' | 'support'; text: string; time: string }>>([
    { sender: 'support', text: "Bienvenue dans l'espace d'assistance direct AKPBF ! Un conseiller municipal est actuellement connecté et disponible pour traiter votre dossier de salubrité.", time: '09:30' }
  ]);
  const [chatAnswering, setChatAnswering] = useState(false);

  // Store purchases billing mock
  const [purchasedQty, setPurchasedQty] = useState(1);
  const [selectedPurchaseProduct, setSelectedPurchaseProduct] = useState<any | null>(null);
  const [boutiqueOrders, setBoutiqueOrders] = useState<Array<{ id: string; name: string; date: string; amount: number; qty: number; status: string }>>([
    { id: 'CMD-88421', name: 'Kit municipal de 50 Sacs d\'Ordures', date: '2026-05-15', amount: 4500, qty: 1, status: 'Livré' }
  ]);

  // Notifications Logs
  const [portalNotifs, setPortalNotifs] = useState<Array<{ id: string; title: string; text: string; date: string; read: boolean; type: string }>>([
    { id: 'N-1', title: 'Facture émise', text: 'La facture mensuelle d\'abonnement d\'assainissement du mois de Mai est disponible.', date: '2026-05-01', read: false, type: 'facture' },
    { id: 'N-2', title: 'Confirmation de paiement', text: 'Nous confirmons la réception de votre paiement Mobile Money de 3,500 FCFA.', date: '2026-04-28', read: true, type: 'paiement' },
    { id: 'N-3', title: 'Alerte Passage Camion', text: 'Le camion de voirie passera demain entre 6h et 9h du matin.', date: 'A l\'instant', read: false, type: 'collecte' }
  ]);

  // Security variables
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityLogs, setSecurityLogs] = useState(INITIAL_SECURITY_LOGS);

  // Client profile state
  const [clientProfile, setClientProfile] = useState({
    phone: '',
    email: '',
    address: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'
  });
  const [profileModifHistory, setProfileModifHistory] = useState<string[]>([
    'Enregistrement initial municipal (Novembre 2025)'
  ]);

  // Filter client-specific invoices
  const clientInvoices = useMemo(() => {
    if (!currentUser) return [];
    return invoices.filter(i => i.subscriberId === currentUser.id);
  }, [invoices, currentUser]);

  // Current balance calculation
  const clientBalance = useMemo(() => {
    return clientInvoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  }, [clientInvoices]);

  // Trigger login simulation
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    let found: Subscriber | undefined;

    if (loginMethod === 'email') {
      const canonicalEmail = loginEmail.trim().toLowerCase();
      
      // 1. Check Admin Account
      if (canonicalEmail === 'admin@akpbf.com') {
        if (loginPassword === 'Admin@2026') {
          setIsAdminLoggedIn(true);
          setIsLoggedIn(true);
          const adminSub: Subscriber = {
            id: 'ADMIN-001',
            name: 'Administrateur AKPBF',
            email: 'admin@akpbf.com',
            phone: '+225 01 01 01 01',
            address: 'Hôtel de Ville de Cocody, Abidjan',
            neighborhood: 'Cocody',
            lat: 5.3524,
            lng: -3.9875,
            planId: 'plan_entreprise_15000',
            status: 'active',
            binType: 'Conteneur 1100L',
            lastCollectionDate: 'Aujourd\'hui',
            currentBinLevel: 10,
            paymentStatus: 'paid'
          };
          setCurrentUser(adminSub);
          setPortalTab('admin');
          return;
        } else {
          alert("Mot de passe incorrect pour le compte Administrateur !");
          return;
        }
      }

      // 2. Check Client Account
      if (loginPassword !== 'Test@2026' && loginPassword !== '••••••••') {
        alert("Mot de passe incorrect pour le Portail Citoyen. (Conseil d'évaluation: tous les abonnés se connectent avec le mot de passe 'Test@2026')");
        return;
      }

      found = subscribers.find(s => s.email.toLowerCase() === canonicalEmail);
      if (!found) {
        alert(`Aucun abonné AKPBF enregistré avec l'adresse e-mail "${loginEmail}".\nRessaisissez l'e-mail d'un client de la liste ou utilisez l'auto-connexion rapide ci-dessous !`);
        return;
      }
      setIsAdminLoggedIn(false);
      setPortalTab('dashboard');

    } else if (loginMethod === 'id') {
      found = subscribers.find(s => s.id.toLowerCase() === loginId.trim().toLowerCase() || s.id.includes(loginId.trim()));
      setIsAdminLoggedIn(false);
      setPortalTab('dashboard');
    } else if (loginMethod === 'phone') {
      found = subscribers.find(s => s.phone.replace(/\s+/g, '').includes(loginPhone.replace(/\s+/g, '')));
      setIsAdminLoggedIn(false);
      setPortalTab('dashboard');
    }

    if (found) {
      setCurrentUser(found);
      setIsLoggedIn(true);
      setClientProfile({
        phone: found.phone,
        email: found.email,
        address: found.address,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'
      });
      // Add secure login telemetry simulation
      setSecurityLogs(prev => [
        { id: Date.now(), device: 'Chiffrage SSL Portail Citoyen', location: found?.neighborhood || 'Abidjan', time: 'À l\'instant', current: true },
        ...prev.map(l => ({ ...l, current: false }))
      ]);
    } else {
      alert("Identifiant inconnu dans la base AKPBF. Utilisez l'auto-connexion ci-dessous pour tester facilement !");
    }
  };

  const handleAutoLogin = (sub: Subscriber) => {
    setIsAdminLoggedIn(false);
    setCurrentUser(sub);
    setIsLoggedIn(true);
    setPortalTab('dashboard');
    setClientProfile({
      phone: sub.phone,
      email: sub.email,
      address: sub.address,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60'
    });
    setSecurityLogs(prev => [
      { id: Date.now(), device: 'Auto-Connexion Administrateur', location: sub.neighborhood, time: 'À l\'instant', current: true },
      ...prev.map(l => ({ ...l, current: false }))
    ]);
  };

  const handleSendClientChat = (e: FormEvent) => {
    e.preventDefault();
    if (!clientChatMsg.trim()) return;

    const userText = clientChatMsg;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setClientChatHistory(prev => [...prev, { sender: 'client', text: userText, time }]);
    setClientChatMsg('');
    setChatAnswering(true);

    setTimeout(() => {
      let responseText = "Merci pour votre message. Un agent d'AKPBF de votre quartier étudie actuellement votre requête. Nous vous recontacterons également par SMS.";
      const lower = userText.toLowerCase();

      if (lower.includes('poubelle') || lower.includes('bac')) {
        responseText = `Concernant votre poubelle (${currentUser?.binType || 'Standard'}), vous pouvez effectuer une demande de renouvellement ou commander un bac renforcé directement via l'onglet "Boutique d'Équipement". Votre score d'intégrité actuel est de 85/100 (Bon Équipement).`;
      } else if (lower.includes('facture') || lower.includes('payer') || lower.includes('tarifs')) {
        responseText = "Pour régler vos factures en retard, nous vous recommandons d'utiliser le paiement sécurisé Orange Money ou Moov Money disponible dans l'onglet 'Mes Factures'. Le crédit se met à jour immédiatement après saisie de votre code OTP.";
      } else if (lower.includes('retard') || lower.includes('oublie') || lower.includes('camion')) {
        responseText = "Nous présentons nos excuses pour la gêne occasionnée. J'ai partagé vos coordonnées d'arrondissement avec l'équipe logistique de camion-benne d'aujourd'hui pour un passage accéléré.";
      }

      setClientChatHistory(prev => [...prev, { sender: 'support', text: responseText, time }]);
      setChatAnswering(false);
    }, 1550);
  };

  // Submit report simulation
  const handleCreateTicket = (e: FormEvent) => {
    e.preventDefault();
    if (!ticketDescription.trim()) return;

    const newTck = {
      id: `TCK-2026-${100 + clientTickets.length}`,
      category: ticketCategory,
      desc: ticketDescription,
      date: new Date().toISOString().split('T')[0],
      status: 'Ouvert' as const,
      sector: currentUser?.neighborhood || 'Abidjan',
      photo: ticketFile || undefined
    };

    setClientTickets([newTck, ...clientTickets]);
    setTicketDescription('');
    setTicketCreatedSuccess(true);
    setTimeout(() => setTicketCreatedSuccess(false), 4000);
  };

  // Online Payment flow trigger
  const handleInitiatePayment = (invoice: Invoice) => {
    setActivePaymentInvoice(invoice);
    setPaymentSuccess(false);
    setPaymentPhoneNumber(currentUser?.phone || '+225 ');
  };

  const handleConfirmOnlinePayment = () => {
    if (!activePaymentInvoice) return;
    setIsPaying(true);

    setTimeout(() => {
      onPayInvoice(activePaymentInvoice.id, paymentVendor === 'OM' ? 'Orange Money' : paymentVendor === 'MOOV' ? 'Wave' : 'Carte Bancaire');
      
      // Update notifications
      const confirmedNotif = {
        id: `N-${Date.now()}`,
        title: 'Paiement Terminé',
        text: `Félicitations ! Votre paiement par ${paymentVendor} de ${activePaymentInvoice.amount.toLocaleString()} FCFA a été validé avec succès.`,
        date: 'À l\'instant',
        read: false,
        type: 'paiement'
      };
      setPortalNotifs([confirmedNotif, ...portalNotifs]);

      setIsPaying(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setActivePaymentInvoice(null);
        setPaymentSuccess(false);
      }, 1500);
    }, 1800);
  };

  // Simulate buying boutique items
  const handleOpenPurchaseBoutique = (prod: any) => {
    setSelectedPurchaseProduct(prod);
    setPurchasedQty(1);
  };

  const handleConfirmBoutiquePurchase = () => {
    if (!selectedPurchaseProduct) return;
    
    const amount = selectedPurchaseProduct.price * purchasedQty;
    const newOrder = {
      id: `CMD-${Math.floor(Math.random() * 90000 + 10000)}`,
      name: selectedPurchaseProduct.name,
      date: new Date().toISOString().split('T')[0],
      amount,
      qty: purchasedQty,
      status: 'Livraison en préparation'
    };

    setBoutiqueOrders([newOrder, ...boutiqueOrders]);
    
    // Auto-create unpaid invoice or withdraw from virtual wallet if we simulated it
    setSelectedPurchaseProduct(null);
    alert(`Votre commande d'équipement de salubrité urbaine a bien été validée! Facture de ${amount.toLocaleString()} FCFA générée. Livraison prévue sous 48h.`);
  };

  // Admin section statistics
  const adminStats = useMemo(() => {
    return {
      totalPortalSubscribers: subscribers.length,
      connectedActive: 3,
      openTickets: clientTickets.filter(t => t.status === 'Ouvert' || t.status === 'En cours').length,
      binSales: boutiqueOrders.length,
      revenueBoutique: boutiqueOrders.reduce((sum, o) => sum + o.amount, 0)
    };
  }, [subscribers, clientTickets, boutiqueOrders]);


  // LOGIN INTERFACE WRAPPER IF NOT COOKIED/LOGGED IN
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden p-6 md:p-8 text-left space-y-6 animate-in fade-in duration-300">
        
        {/* Portal top logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-600 text-white items-center justify-center text-xl font-mono font-black shadow-md">
            AK
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Portail Abonnés AKPBF</h2>
          <p className="text-xs text-slate-500">Gérez vos abonnements, signalez des incidents et réglez vos factures par Mobile Money</p>
        </div>

        {/* Tab logins */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
          <button 
            type="button"
            onClick={() => setLoginMethod('id')}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              loginMethod === 'id' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ID Client unique
          </button>
          <button 
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              loginMethod === 'email' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            E-mail
          </button>
          <button 
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 text-center rounded-lg transition ${
              loginMethod === 'phone' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            OTP Téléphone
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {loginMethod === 'id' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-450 tracking-wider">Votre Numéro Unique d'Abonné</label>
              <input 
                type="text"
                id="portal-login-id"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Ex. SUB-001 ou SUB-002"
                className="w-full bg-slate-50 border border-slate-250 focus:border-emerald-600 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono outline-hidden"
              />
            </div>
          )}

          {loginMethod === 'email' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">Adresse E-mail Enregistrée</label>
                <input 
                  type="email"
                  id="portal-login-email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nom@service-assainissement.ci"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-650 rounded-xl p-2.5 text-xs font-semibold outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">Mot de Passe</label>
                <input 
                  type="password"
                  id="portal-login-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-650 rounded-xl p-2.5 text-xs font-semibold outline-hidden"
                />
              </div>
            </div>
          )}

          {loginMethod === 'phone' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-400">Numéro de Téléphone (Orange, Wave, Moov)</label>
                <input 
                  type="text"
                  id="portal-login-phone"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="Ex: +225 05 06..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-650 rounded-xl p-2.5 text-xs font-semibold outline-hidden"
                />
              </div>

              {otpSent ? (
                <div className="space-y-1">
                  <span className="text-[11px] text-emerald-700 font-bold block">✓ Code SMS Transmis sur votre mobile</span>
                  <input 
                    type="text"
                    id="portal-login-otp"
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    placeholder="Saisissez le code OTP à 4 chiffres"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl p-2.5 text-xs font-black text-center tracking-widest outline-hidden font-mono"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  id="send-otp-btn"
                  onClick={() => setOtpSent(true)}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-250 transition"
                >
                  Envoyer un OTP d'accès par SMS (Gratuit)
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            id="portal-login-submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-3 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="h-4 w-4 text-emerald-300" />
            Accéder à mon Portail Citoyen
          </button>
        </form>

        {/* Demo Fast Account Selectors */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[11px] leading-relaxed text-slate-650 space-y-1">
            <strong className="text-slate-800">🔑 Identifiants officiels de démonstration :</strong>
            <div className="font-mono text-[10px] space-y-0.5">
              <div>• Admin: <span className="text-indigo-800 font-bold">admin@akpbf.com</span> / <span className="text-indigo-800 font-bold">Admin@2026</span></div>
              <div>• Abonnés: <span className="text-emerald-800 font-bold">[E-mail du client]</span> / <span className="text-emerald-800 font-bold">Test@2026</span></div>
            </div>
          </div>

          <span className="text-[10px] uppercase font-black text-slate-450 block tracking-wider text-center">Raccourcis de Connexion d'Évaluation :</span>
          <div className="space-y-2">
            {/* Quick Admin Access Button */}
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
                setLoginEmail('admin@akpbf.com');
                setLoginPassword('Admin@2026');
                alert("Identifiants Administrateur saisis ! Cliquez sur 'Accéder à mon Portail' ou 'Entrée'.");
              }}
              className="w-full p-2 bg-indigo-50 hover:bg-indigo-650 text-indigo-900 hover:text-white transition rounded-xl text-[10.5px] border border-indigo-200 font-bold cursor-pointer text-center"
            >
              🛠️ Remplir l'Administrateur AKPBF
            </button>

            <div className="grid grid-cols-2 gap-2 text-left">
              {/* Particular Client */}
              <button
                type="button"
                onClick={() => {
                  const part = subscribers.find(s => s.id === 'AKPBF-000001') || subscribers[0];
                  if (part) {
                    setLoginMethod('email');
                    setLoginEmail(part.email);
                    setLoginPassword('Test@2026');
                    handleAutoLogin(part);
                  }
                }}
                className="p-2.5 bg-slate-50 hover:bg-emerald-600 text-slate-800 hover:text-white transition rounded-xl text-[10px] border border-slate-200/60 leading-tight text-left font-bold cursor-pointer truncate"
              >
                <div>🏡 Ménage Particulier</div>
                <div className="text-[8px] font-mono opacity-80 mt-0.5">AKPBF-000001 • Test@2026</div>
              </button>

              {/* Enterprise Client */}
              <button
                type="button"
                onClick={() => {
                  const ent = subscribers.find(s => s.id === 'AKPBF-000051') || subscribers[51];
                  if (ent) {
                    setLoginMethod('email');
                    setLoginEmail(ent.email);
                    setLoginPassword('Test@2026');
                    handleAutoLogin(ent);
                  }
                }}
                className="p-2.5 bg-slate-50 hover:bg-emerald-600 text-slate-800 hover:text-white transition rounded-xl text-[10px] border border-slate-200/60 leading-tight text-left font-bold cursor-pointer truncate"
              >
                <div>🏢 Entreprise / B2B</div>
                <div className="text-[8px] font-mono opacity-80 mt-0.5">AKPBF-000051 • Test@2026</div>
              </button>

              {/* Association Client */}
              <button
                type="button"
                onClick={() => {
                  const assoc = subscribers.find(s => s.id === 'AKPBF-000071') || subscribers[71];
                  if (assoc) {
                    setLoginMethod('email');
                    setLoginEmail(assoc.email);
                    setLoginPassword('Test@2026');
                    handleAutoLogin(assoc);
                  }
                }}
                className="p-2.5 bg-slate-50 hover:bg-emerald-600 text-slate-800 hover:text-white transition rounded-xl text-[10px] border border-slate-200/60 leading-tight text-left font-bold cursor-pointer truncate"
              >
                <div>🤝 Association</div>
                <div className="text-[8px] font-mono opacity-80 mt-0.5">AKPBF-000071 • Test@2026</div>
              </button>

              {/* Overdue/Late Client */}
              <button
                type="button"
                onClick={() => {
                  const lateSub = subscribers.find(s => s.paymentStatus === 'overdue') || subscribers[2];
                  if (lateSub) {
                    setLoginMethod('email');
                    setLoginEmail(lateSub.email);
                    setLoginPassword('Test@2026');
                    handleAutoLogin(lateSub);
                  }
                }}
                className="p-2.5 bg-slate-50 hover:bg-amber-600 text-slate-800 hover:text-white transition rounded-xl text-[10px] border border-slate-200/60 leading-tight text-left font-bold cursor-pointer truncate"
              >
                <div>⚠️ Client En Retard</div>
                <div className="text-[8px] font-mono opacity-80 mt-0.5">
                  {subscribers.find(s => s.paymentStatus === 'overdue')?.id || 'AKPBF-000003'} • Suspendu / Retard
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // PORTAL MAIN INTERFACE FOR LOGGED IN USERS
  return (
    <div className="bg-slate-50/50 border border-slate-200 rounded-3xl overflow-hidden shadow-xl animate-in fade-in duration-300 min-h-[640px] flex flex-col md:flex-row text-left">
      
      {/* 1. PORTAL LATERAL BAR (Notion Style Drawer) */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shrink-0 border-r border-slate-800 gap-6">
        <div className="space-y-5">
          {/* Subscriber summary seal */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 leading-tight">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 shadow-md text-white flex items-center justify-center font-bold text-md tracking-wider">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-100 text-xs truncate" title={currentUser?.name}>{currentUser?.name}</h4>
              <span className="text-[10.5px] text-emerald-400 font-bold font-mono block mt-0.5">{currentUser?.id}</span>
            </div>
          </div>

          {/* Lateral list of submenus - filtered dynamically based on admin status */}
          <nav className="space-y-1 text-xs font-semibold">
            {(isAdminLoggedIn 
              ? [
                  { id: 'admin', label: 'Console Administrateur', icon: TrendingUp },
                  { id: 'blueprints', label: '📜 Spécifications SQL & API', icon: Sliders }
                ]
              : [
                  { id: 'dashboard', label: 'Tableau de Bord', icon: Sliders },
                  { id: 'subscriptions', label: 'Mon Abonnement', icon: Layers },
                  { id: 'invoices', label: 'Mes Factures', icon: FileText, count: clientInvoices.filter(i => i.status !== 'paid').length },
                  { id: 'payments', label: 'Reçus de Paiement', icon: CreditCard },
                  { id: 'collections', label: 'Suivi de Collecte', icon: Calendar },
                  { id: 'bin', label: 'Ma Poubelle Connectée', icon: Camera },
                  { id: 'tickets', label: 'Signaler un Incident', icon: HelpCircle, count: clientTickets.filter(t => t.status === 'Ouvert').length },
                  { id: 'chat', label: 'Messagerie Directe', icon: MessageSquare },
                  { id: 'security', label: 'Sécurité & Session', icon: Inbox }
                ]
            ).map((it) => {
              const Icon = it.icon;
              const isSelected = portalTab === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setPortalTab(it.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-700 font-extrabold text-white shadow-xs' 
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{it.label}</span>
                  </div>
                  {it.count && it.count > 0 ? (
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {it.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Support Call-out */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/60 text-[10.5px] leading-relaxed text-slate-400">
            <strong>Besoin d'aide ?</strong> Appelez la permanence municipale AKPBF au <strong>3035</strong> (N° Vert gratuit de salubrité)
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoggedIn(false);
              setCurrentUser(null);
            }}
            className="w-full text-left text-slate-400 hover:text-white transition text-xs font-bold flex items-center gap-1.5 px-3 py-1 bg-slate-850 hover:bg-slate-800 rounded cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion Espace
          </button>
        </div>
      </aside>

      {/* 2. PORTAL MAIN WORK AREA */}
      <div className="flex-1 p-5 md:p-8 space-y-6">
        
        {/* UPPER STATUS BAR */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
              Espace Client Citoyen Sécurisé
            </span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight mt-1 flex items-center gap-1.5">
              <span>Réseau d'assainissement AKPBF</span>
            </h1>
          </div>

          {/* Quick stats tags */}
          <div className="flex gap-2 text-xs">
            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${currentUser?.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`} />
              Statut : {currentUser?.status === 'active' ? 'Abonnement Actif' : 'Suspendu'}
            </span>
          </div>
        </header>

        {/* PORTAL WIDGET SWITCH-ROUTER */}

        {/* A. TABLEAU DE BORD (DASHBOARD) */}
        {portalTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Dynamic Welcome Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-6 rounded-3xl shadow-sm text-left">
              <div className="relative z-10 space-y-3 max-w-lg">
                <span className="text-[9px] bg-emerald-700/60 font-mono tracking-widest uppercase px-2 py-0.5 rounded-sm font-bold">
                  Secteur Abidjan : {currentUser?.neighborhood}
                </span>
                <h2 className="text-lg font-black tracking-tight leading-tight">
                  Bonjour, {currentUser?.name} ! Vos collectes municipales sont à jour.
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Bienvenue sur votre portail d'assainissement urbain. Votre solde redevance actuel s'élève à 
                  <strong className="text-white text-sm font-black mx-1 font-mono">
                    {clientBalance.toLocaleString()} FCFA
                  </strong>.
                </p>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPortalTab('invoices')}
                    className="bg-white text-emerald-900 border border-white hover:bg-slate-100 text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Régler mes factures
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortalTab('tickets')}
                    className="bg-emerald-700/60 hover:bg-emerald-700/90 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-emerald-600.50 transition cursor-pointer"
                  >
                    Signaler un bac plein
                  </button>
                </div>
              </div>

              {/* Decorative radial background */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-700/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Core KPI Cards Layout (Requested) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] uppercase font-bold text-slate-450 block">Abonnement</span>
                <strong className={`text-md font-black block mt-1 ${
                  currentUser?.status === 'active' ? 'text-emerald-750' : 'text-amber-600'
                }`}>
                  {currentUser?.status === 'active' ? 'Actif' : 'Non-Actif'}
                </strong>
                <span className="text-[9px] text-slate-400 mt-0.5 block font-semibold">Renouvellement auto</span>
              </div>

              <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] uppercase font-bold text-slate-450 block">Paiement</span>
                <strong className={`text-md font-black block mt-1 ${
                  clientBalance === 0 ? 'text-emerald-750' : 'text-red-650'
                }`}>
                  {clientBalance === 0 ? 'À jour' : 'Arriéré Dû'}
                </strong>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">{clientBalance.toLocaleString()} FCFA</span>
              </div>

              <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] uppercase font-bold text-slate-450 block">Collectes (Mai)</span>
                <strong className="text-md font-black block mt-1 text-slate-800">12 Passages</strong>
                <span className="text-[9px] text-slate-400 mt-0.5 block font-semibold">Taux de ramassage 100%</span>
              </div>

              <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs text-left">
                <span className="text-[10px] uppercase font-bold text-slate-450 block">Signalements ouverts</span>
                <strong className="text-md font-black block mt-1 text-indigo-750">
                  {clientTickets.filter(t => t.status === 'Ouvert' || t.status === 'En cours').length} Ouvert(s)
                </strong>
                <span className="text-[9px] text-slate-400 mt-0.5 block font-semibold">Suivi d'incidents direct</span>
              </div>

            </div>

            {/* Invoices List / Notification Center splits */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Quick invoice payment summary */}
              <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs text-left space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h3 className="font-extrabold text-xs uppercase text-slate-850">Mes dernières factures</h3>
                  <button
                    type="button"
                    onClick={() => setPortalTab('invoices')}
                    className="text-emerald-750 hover:underline text-[11px] font-bold"
                  >
                    Tout voir ({clientInvoices.length})
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-450 border-b border-slate-100 font-bold">
                        <th className="p-2.5">Facture</th>
                        <th className="p-2.5">Période</th>
                        <th className="p-2.5">Montant</th>
                        <th className="p-2.5 text-center">État</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">Aucune facture émise pour votre compte d'assainissement.</td>
                        </tr>
                      ) : (
                        clientInvoices.slice(0, 3).map((inv) => (
                          <tr key={inv.id} className="border-b border-slate-100 font-medium">
                            <td className="p-2.5 font-bold font-mono text-slate-700">{inv.id}</td>
                            <td className="p-2.5 text-slate-500">{inv.period}</td>
                            <td className="p-2.5 font-bold text-slate-850 font-mono">{inv.amount.toLocaleString()} FCFA</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 text-[9.5px] rounded-full border font-bold inline-block ${
                                inv.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                              }`}>
                                {inv.status === 'paid' ? 'Payée' : 'Impayée'}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              {inv.status !== 'paid' ? (
                                <button
                                  type="button"
                                  onClick={() => handleInitiatePayment(inv)}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] px-2.5 py-1 rounded transition"
                                >
                                  Payer
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px]">Reçu disponible</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Mini Notifications Alert Hub */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h3 className="font-extrabold text-xs uppercase text-slate-800">Alertes temps-réel</h3>
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                </div>

                <div className="space-y-3">
                  {portalNotifs.slice(0, 3).map((n) => (
                    <div key={n.id} className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl text-xs space-y-1 relative">
                      <span className="text-[8.5px] font-bold text-slate-400 font-mono absolute top-2 right-3">{n.date}</span>
                      <strong className="text-slate-800 block leading-snug">{n.title}</strong>
                      <p className="text-[10.5px] text-slate-500 leading-normal">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* B. MES ABONNEMENTS (MY SUBSCRIPTIONS) */}
        {portalTab === 'subscriptions' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Gestion de ma formule d'abonnement</h3>
              <p className="text-xs text-slate-400">Vérifiez les volumes autorisés et demandez un surclassement de poubelle</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">Abonnement Actuel</span>
                    <h4 className="text-lg font-black text-slate-800 mt-1">
                      {plans.find(p => p.id === currentUser?.planId)?.name || 'Formule Standard R3'}
                    </h4>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[11px] font-bold rounded-full">
                    Actif
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-semibold block">Redevance mensuelle</span>
                    <strong className="text-slate-800 font-mono text-[14px]">
                      {(plans.find(p => p.id === currentUser?.planId)?.price || 3500).toLocaleString()} FCFA
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-semibold block">Fréquence de ramassage</span>
                    <strong className="text-slate-800 block mt-0.5 font-bold">3 fois par semaine (L-M-V)</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 font-sans">
                    <span className="text-slate-400 font-semibold block">Date d'engagement</span>
                    <strong className="text-slate-800 block mt-0.5">14 Décembre 2025</strong>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <span className="text-slate-400 font-semibold block">Prochain prélèvement</span>
                    <strong className="text-slate-800 block mt-0.5">01 Juin 2026</strong>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <strong className="text-xs uppercase text-slate-800 block">Prestations inclues dans l'abonnement :</strong>
                  <ul className="text-xs space-y-2 text-slate-600 font-medium">
                    <li className="flex items-center gap-2">✓ Équipement de cuve étanche avec transpondeur RFID intégré</li>
                    <li className="flex items-center gap-2">✓ Garantie d'enlèvement d'encombrants municipaux de taille standard</li>
                    <li className="flex items-center gap-2">✓ Accès prioritaire au service client direct de la mairies d'Abidjan</li>
                  </ul>
                </div>
              </div>

              {/* Formula upgrade panel */}
              <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-xs uppercase text-indigo-800">Ugrader ou Changer de forfait</h4>
                
                {subscriptionRequestSent ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs space-y-2.5 leading-relaxed font-semibold">
                    <strong>✓ Demande de changement émise !</strong>
                    <p>Votre requête a bien été enregistrée et transmise au secrétariat AKPBF de votre quartier. Vous recevrez une notification d'approbation sous 12h.</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-500 leading-relaxed font-semibold">
                      Vous constatez des débordements fréquents ? Surclassez votre formule d'assainissement pour bénéficier d'un bac de 360L ou d'une collecte quotidienne.
                    </p>

                    <div className="space-y-2">
                      <label className="font-bold text-slate-700 block text-[11px]">Choisissez la formule ciblée :</label>
                      <select
                        id="portal-upgrade-plan"
                        value={selectedUpgradePlanId}
                        onChange={(e) => setSelectedUpgradePlanId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden"
                      >
                        <option value="">Sélectionnez un forfait supérieur...</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({(p.price).toLocaleString()} FCFA/mois)</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSubscriptionRequestSent(true)}
                      disabled={!selectedUpgradePlanId}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-2.5 rounded-xl cursor-pointer disabled:opacity-50 transition text-center block text-xs"
                    >
                      Soumettre ma Demande Municipale
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* C. MES FACTURES (MY INVOICES) */}
        {portalTab === 'invoices' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Suivi des Factures d'Assainissement</h3>
              <p className="text-xs text-slate-400">Téléchargez vos pièces comptables et payez via Mobile Money sécurisé</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-450 border-b border-slate-200 font-extrabold">
                      <th className="p-4">Numéro de Pièce</th>
                      <th className="p-4">Date d'Émission</th>
                      <th className="p-4">Date d'Échéance</th>
                      <th className="p-4">Montant Net</th>
                      <th className="p-4 text-center">Statut Facture</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">Aucune facture émise sur ce compte.</td>
                      </tr>
                    ) : (
                      clientInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition font-medium">
                          <td className="p-4 font-mono font-bold text-slate-800">{inv.id}</td>
                          <td className="p-4 text-slate-500">{inv.dueDate}</td>
                          <td className="p-4 text-slate-500 font-sans">{inv.issueDate}</td>
                          <td className="p-4 font-bold font-mono text-slate-900">{inv.amount.toLocaleString()} FCFA</td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 text-[10px] rounded-full font-bold border inline-block ${
                              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                              {inv.status === 'paid' ? 'Payée' : 'Impayée'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Simulateur d'impression de facture ${inv.id} - Période: ${inv.period}. Document prêt !`);
                              }}
                              className="p-1 px-2.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 text-[10px] font-bold"
                            >
                              Imprimer / PDF
                            </button>

                            {inv.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => handleInitiatePayment(inv)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] px-3.5 py-1 rounded transition"
                              >
                                Payer en Ligne
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

          </div>
        )}

        {/* INTERACTIVE PAYMENTS DIALOG POPUP SIMULATOR (Requested) */}
        {activePaymentInvoice && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5 text-left animate-in zoom-in-95 duration-200">
              
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-sm text-slate-800">Passerelle de Paiement Mobile Money API</h4>
                <button
                  type="button"
                  onClick={() => setActivePaymentInvoice(null)}
                  className="p-1.5 hover:bg-slate-150 rounded"
                >
                  <X className="h-5 w-5 text-slate-450" />
                </button>
              </div>

              {paymentSuccess ? (
                <div className="py-6 text-center space-y-2 text-emerald-800">
                  <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                  <strong className="text-md block">Transaction Validée !</strong>
                  <p className="text-xs text-slate-500">Mise à jour immédiate effectuée sur le système d'assainissement municipal.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-150 font-serif">
                    <span className="text-slate-400 font-sans block text-[10px]">Facture en règlement :</span>
                    <strong className="font-mono">{activePaymentInvoice.id}</strong>
                    <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200 leading-none">
                      <span className="text-slate-500 font-semibold font-sans">Montant redevance :</span>
                      <strong className="font-mono text-emerald-800 text-sm font-black">{activePaymentInvoice.amount.toLocaleString()} FCFA</strong>
                    </div>
                  </div>

                  {/* Vendor radio */}
                  <div className="space-y-2 text-xs">
                    <label className="text-[11px] font-bold text-slate-500 uppercase block pl-0.5">Moyen de règlement</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => { setPaymentVendor('OM'); setPaymentPhoneNumber('+225 07 '); }}
                        className={`p-2.5 rounded-xl border-2 font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          paymentVendor === 'OM' ? 'border-orange-500 bg-orange-50/10 text-orange-800' : 'border-slate-150 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px]">Orange Money</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPaymentVendor('MOOV'); setPaymentPhoneNumber('+225 01 '); }}
                        className={`p-2.5 rounded-xl border-2 font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          paymentVendor === 'MOOV' ? 'border-blue-500 bg-blue-50/10 text-blue-800' : 'border-slate-150 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px]">Moov Money</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPaymentVendor('CARD'); }}
                        className={`p-2.5 rounded-xl border-2 font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                          paymentVendor === 'CARD' ? 'border-indigo-600 bg-indigo-50/10 text-indigo-800' : 'border-slate-150 bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="text-[10px]">Wave / Carte</span>
                      </button>
                    </div>
                  </div>

                  {paymentVendor !== 'CARD' ? (
                    <div className="space-y-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Votre numéro Mobile Money :</label>
                        <input
                          type="text"
                          id="mobile-payment-phone"
                          value={paymentPhoneNumber}
                          onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div className="p-3 bg-amber-50/60 text-amber-900 border border-amber-150 rounded-xl text-[10.5px]">
                        Composez le <strong>*144*82#</strong> pour confirmer et générer votre OTP de paiement secret Orange Money.
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Code Secret OTP :</label>
                        <input
                          type="text"
                          id="mobile-payment-otp"
                          value={paymentOtpCode}
                          onChange={(e) => setPaymentOtpCode(e.target.value)}
                          placeholder="Ex: 4859"
                          className="w-full bg-slate-50 border border-slate-200 text-center tracking-widest rounded-xl p-2.5 text-xs font-mono font-black border-dashed"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Titulaire de la carte :</label>
                        <input
                          type="text"
                          id="card-payment-holder"
                          defaultValue={currentUser?.name}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block">Numéro de Carte Bleue :</label>
                        <input
                          type="text"
                          id="card-payment-number"
                          placeholder="4000 1234 5678 9010"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmOnlinePayment}
                    disabled={isPaying}
                    className="w-full bg-emerald-700 hover:bg-emerald-850 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer"
                  >
                    {isPaying ? 'Exécution du prélèvement bancaire...' : `Valider le règlement de ${activePaymentInvoice.amount.toLocaleString()} FCFA`}
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* D. MES PAIEMENTS RECUS (MY PAYMENTS HISTORY) */}
        {portalTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Grand livre de mes règlements redevances</h3>
              <p className="text-xs text-slate-400">Historique général des dépôts espèces et prélèvements Orange Money réussis</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 border-b border-slate-150 font-bold">
                    <th className="p-3.5">Référence Dépôt</th>
                    <th className="p-3.5">Date de Saisie</th>
                    <th className="p-3.5">Mode de Paiement</th>
                    <th className="p-3.5">Transaction ID</th>
                    <th className="p-3.5 font-bold">Montant</th>
                    <th className="p-3.5 text-right">Pièce comptable</th>
                  </tr>
                </thead>
                <tbody>
                  {clientInvoices.filter(i => i.status === 'paid').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-slate-400 text-center font-semibold">Aucun versement enregistré sur cette période.</td>
                    </tr>
                  ) : (
                    clientInvoices.filter(i => i.status === 'paid').map((paid) => (
                      <tr key={paid.id} className="border-b border-slate-100 font-medium">
                        <td className="p-3.5 font-mono font-bold text-slate-700">{paid.id}</td>
                        <td className="p-3.5 text-slate-500 font-sans">22 Mai 2026</td>
                        <td className="p-3.5 font-semibold text-emerald-800">
                          {paid.paymentMethod || 'Orange Money'}
                        </td>
                        <td className="p-3.5 text-[11px] font-mono text-slate-400 uppercase">TXN-77492-ABIDJAN</td>
                        <td className="p-3.5 font-black text-slate-800 font-mono">{paid.amount.toLocaleString()} FCFA</td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Téléchargement du reçu officiel AKPBF pour la période ${paid.period}.`)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1 px-2 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Télécharger Reçu PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* E. MES COLLECTES (MY COLLECTIONS TRACKER) */}
        {portalTab === 'collections' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Calendrier des levées de déchets d'Abidjan</h3>
              <p className="text-xs text-slate-400">Vérifiez les dates d'historique de passage du camion-benne et de scannage RFID</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase">Passages de voirie récents (2026)</h4>
                  <span className="text-[10px] font-bold text-emerald-800">Arrondissement : Cocody-Riviera</span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {[
                    { date: 'Hier à 08:14', inspector: 'Mamadou Touré (Conducteur Camion #COL-402)', state: 'Effectué', tracking: 'RFID OK' },
                    { date: '19 Mai 2026 à 07:44', inspector: 'Gérard Gnakpa (Voirie Nord)', state: 'Effectué', tracking: 'RFID OK' },
                    { date: '16 Mai 2026 à 08:31', inspector: 'Mamadou Touré', state: 'Effectué', tracking: 'RFID OK' }
                  ].map((col, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-400 text-[10px]">{col.date}</span>
                        <h5 className="font-bold text-slate-800">{col.inspector}</h5>
                        <p className="text-[10px] text-emerald-800">Preuve GPS certifié : Lat -5.341, Lng -3.982</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-0.5 text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-full font-bold">
                          {col.state}
                        </span>
                        <span className="block text-[8.5px] text-slate-400 font-bold mt-1 uppercase font-mono">{col.tracking}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collections calendar sidebar info */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-4">
                <h4 className="font-extrabold text-indigo-800 uppercase tracking-wide">Prochains passages planifiés</h4>
                
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <strong className="text-indigo-900">Mardi 26 Mai 2026</strong>
                      <span className="text-[9px] bg-indigo-600 text-white font-mono px-1.5 rounded">07:30</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold leading-normal">
                      Veuillez sortir votre bac d'assainissement la veille au soir à l'angle carrossable de l'avenue.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <strong className="text-slate-700">Vendredi 29 Mai 2026</strong>
                      <span className="text-[9px] bg-slate-400 text-white font-mono px-1.5 rounded">07:30</span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 font-medium">Collecte tri sélectif / recyclage municipal.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* F. SUIVI DE MA POUBELLE (MY BIN TRACING) */}
        {portalTab === 'bin' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Fiche technique de ma poubelle AKPBF</h3>
              <p className="text-xs text-slate-400">Données IoT et diagnostic matériel de la cuve certifiées par vision d'IA</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Picture + parameters card */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-5">
                  <img 
                    src="https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
                    alt="Ma poubelle et scellé" 
                    referrerPolicy="no-referrer"
                    className="w-full md:w-36 h-36 object-cover rounded-2xl border border-slate-200"
                  />

                  <div className="flex-1 space-y-3.5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Scellé Éléctronique RFID</span>
                      <strong className="text-sm font-black text-slate-850 font-mono">RFID-ABIDJAN-992B</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                      <div>
                        <span className="text-slate-400 font-semibold block">Capacité :</span>
                        <strong className="font-bold text-slate-700">{currentUser?.binType}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Mise en service :</span>
                        <strong className="font-bold text-slate-700">14 Novembre 2025</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Couleur Cuve :</span>
                        <strong className="font-bold text-slate-700">Vert d'Assainissement</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Dernier contrôle physique :</span>
                        <strong className="font-bold text-slate-700">15 Mars 2026</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Score metrics */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-medium">
                <h4 className="font-extrabold uppercase text-slate-800 tracking-wider">État structurel du bac</h4>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-750">Score de Santé :</span>
                    <strong className="text-emerald-800">92 / 100 (Bon)</strong>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: '92%' }} />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1 font-semibold">
                    L'analyse optique montre un vieillissement normal. Les roues, couvercle et charnières d'attelage sont conformes.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* G. BOUTIQUE AKPBF (STORE) */}
        {portalTab === 'boutique' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Commander des équipements d'assainissement</h3>
              <p className="text-xs text-slate-400">Achetez une nouvelle poubelle homologuée ou faites-vous livrer des sacs certifiés</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {BOUTIQUE_PRODUCTS.map((prod) => (
                <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-3.5 shadow-xs text-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="h-32 rounded-xl overflow-hidden relative">
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-850 leading-tight">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{prod.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center bg-slate-50/20 -mx-3.5 -mb-3.5 p-3.5 mt-auto">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none">Tarif municipal</span>
                      <strong className="text-slate-800 font-mono text-xs font-black">{(prod.price).toLocaleString()} F</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenPurchaseBoutique(prod)}
                      className="bg-emerald-700 hover:bg-emerald-850 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition"
                    >
                      Commander
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Previous Boutique orders table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs text-left space-y-3 mt-4">
              <h4 className="font-extrabold text-slate-800 uppercase text-xs pb-1 border-b border-slate-100">Mes commandes boutique passées</h4>
              
              <div className="overflow-x-auto text-xs font-medium">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 border-b border-slate-150">
                      <th className="p-2">Numéro Commande</th>
                      <th className="p-2">Date d'achat</th>
                      <th className="p-2">Produit commandé</th>
                      <th className="p-2">Quantité</th>
                      <th className="p-2">Total Payé</th>
                      <th className="p-2">Statut Livraison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boutiqueOrders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100">
                        <td className="p-2 font-mono font-bold text-slate-700">{o.id}</td>
                        <td className="p-2 text-slate-500 font-sans">{o.date}</td>
                        <td className="p-2 font-semibold text-slate-800">{o.name}</td>
                        <td className="p-2 text-slate-500">{o.qty}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{o.amount.toLocaleString()} FCFA</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded-full text-[9px] inline-block">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for ordering item */}
            {selectedPurchaseProduct && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white border rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h4 className="font-black text-xs uppercase text-slate-800">Commander l'équipement</h4>
                    <button type="button" onClick={() => setSelectedPurchaseProduct(null)} className="p-1 hover:bg-slate-100 rounded">
                      <X className="h-5 w-5 text-slate-450" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{selectedPurchaseProduct.name}</p>
                  
                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] font-bold text-slate-500 block">Quantité :</label>
                    <input 
                      type="number"
                      min={1}
                      max={10}
                      value={purchasedQty}
                      onChange={(e) => setPurchasedQty(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-black font-mono text-center text-xs"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold bg-slate-50 p-3 rounded-lg">
                    <span>Montant total :</span>
                    <strong className="text-indigo-800 text-sm font-black font-mono">
                      {(selectedPurchaseProduct.price * purchasedQty).toLocaleString()} FCFA
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmBoutiquePurchase}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
                  >
                    Valider l'achat immédiat
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* H. MES SIGNALEMENTS (HELP TICKETS) */}
        {portalTab === 'tickets' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Signaler une anomalie ou un incident</h3>
              <p className="text-xs text-slate-400 font-medium">Déclarez un bac cassé, un oubli de ramassage ou joignez des clichés géotaggés</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Report ticket Form constructor */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-medium">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase pb-2 border-b border-slate-100">Nouveau Ticket de Salubrité</h4>
                
                {ticketCreatedSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl leading-normal font-semibold">
                    ✓ Votre signalement a bien été déposé ! L'équipe logistique municipale d'Abidjan a été mandatée.
                  </div>
                )}

                <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block pl-0.5">Catégorie d'Incident :</label>
                    <select
                      id="ticket-category-select"
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden"
                    >
                      <option value="Collecte oubliée">Collecte oubliée ou sautée</option>
                      <option value="Bac endommagé">Bac d'ordures endommagé</option>
                      <option value="Passage retardé">Retard de passage constaté</option>
                      <option value="Dépôt sauvage">Dépôt sauvage d'ordures de rue</option>
                      <option value="Autre">Autre demande</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block pl-0.5">Description précise :</label>
                    <textarea
                      id="ticket-desc-textarea"
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      rows={3}
                      placeholder="Décrivez précisément la situation (ex: poubelle fissurée, bac resté plein après passage du camion de jeudi, etc.)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-1 focus:ring-emerald-550 outline-hidden focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block pl-0.5">Coordonnées GPS / Adresse :</label>
                    <input 
                      type="text"
                      id="ticket-location-field"
                      value={ticketLocation}
                      onChange={(e) => setTicketLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold"
                    />
                  </div>

                  {/* Photo selector mock */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block pl-0.5">Pièce Jointe :</label>
                    <button
                      type="button"
                      onClick={() => setTicketFile('https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60')}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100/60 border border-dashed border-slate-300 rounded-xl text-center text-slate-650 cursor-pointer text-[10.5px] font-bold"
                    >
                      {ticketFile ? '✓ Photo du bac brisé attachée' : '📸 Rattacher une photo du bac ou du trottoir'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    id="submit-ticket-form-btn"
                    className="w-full bg-emerald-750 hover:bg-emerald-800 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer shadow-xs active:scale-95 transition"
                  >
                    Déposer mon Signalement Citoyen
                  </button>
                </form>
              </div>

              {/* Tickets list */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-4">
                <h4 className="font-extrabold text-slate-800 uppercase text-xs pb-1 border-b border-slate-100">Suivi administratif de mes incidents</h4>
                
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {clientTickets.map((tck) => (
                    <div key={tck.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/40 border border-slate-200 rounded-xl relative text-xs space-y-2 leading-relaxed">
                      <span className="absolute top-3.5 right-4 font-mono font-bold text-[9px] text-slate-400">{tck.id}</span>
                      
                      <div className="space-y-0.5">
                        <strong className="text-slate-800 block text-xs">{tck.category}</strong>
                        <span className="text-[9.5px] text-slate-400 font-semibold">{tck.date} • {tck.sector}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium whitespace-pre-line leading-normal bg-white p-2 border border-slate-150 rounded-lg">
                        {tck.desc}
                      </p>

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="font-bold text-slate-550">Statut : 
                          <strong className={`ml-1 text-[9px] px-2 py-0.5 rounded-full font-black border ${
                            tck.status === 'Ouvert' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                            tck.status === 'En cours' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {tck.status}
                          </strong>
                        </span>
                        
                        {tck.photo && (
                          <span className="text-[10px] text-emerald-800 font-bold">✓ Image attachée</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* I. CHAT DIRECT WITH CUSTOMER SERVICE */}
        {portalTab === 'chat' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Messagerie directe d'assainissement d'urgence</h3>
              <p className="text-xs text-slate-400">Discussion directe avec le conseiller de salubrité de garde d'Abidjan</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs h-[400px] flex flex-col justify-between">
              
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-semibold">
                {clientChatHistory.map((cit, idx) => {
                  const isClient = cit.sender === 'client';
                  return (
                    <div key={idx} className={`flex ${isClient ? 'justify-end' : 'justify-start'} text-left items-start gap-2 max-w-[85%] ${isClient ? 'ml-auto' : ''}`}>
                      <div className={`p-3 rounded-2xl ${
                        isClient ? 'bg-emerald-700 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 border border-slate-200 rounded-tl-none whitespace-pre-line'
                      }`}>
                        {cit.text}
                        <span className="text-[8.5px] block font-mono pl-0.5 mt-1 text-right opacity-70 font-bold">{cit.time}</span>
                      </div>
                    </div>
                  );
                })}

                {chatAnswering && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10.5px] font-mono animate-pulse">
                    <bot className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
                    <span>Le conseiller AKPBF dactylographie...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendClientChat} className="p-3 border-t border-slate-100 bg-slate-50/50 flex">
                <input
                  type="text"
                  id="direct-chat-message-txt"
                  value={clientChatMsg}
                  onChange={(e) => setClientChatMsg(e.target.value)}
                  placeholder="Écrivez un message ici..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-hidden focus:ring-1 focus:ring-emerald-500 font-sans"
                />
                
                <button
                  type="submit"
                  id="submit-direct-chat-btn"
                  className="bg-emerald-700 hover:bg-emerald-850 text-white px-4 py-2.5 rounded-xl ml-2 cursor-pointer transition flex items-center justify-center font-extrabold text-xs"
                >
                  <Send className="h-4 w-4 shrink-0" />
                </button>
              </form>

            </div>

          </div>
        )}

        {/* J. SÉCURITÉ & SESSION */}
        {portalTab === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Sécurité du compte d'assainissement</h3>
              <p className="text-xs text-slate-400">Gérez votre mot de passe, authentification double-facteur (2FA) et vos connexions locales</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Authenticator parameters list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs font-semibold text-slate-700">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase pb-2 border-b border-slate-100">Dispositifs de Sécurisation</h4>
                
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <strong className="text-slate-800 block text-[11.5px]">Double Authentification (2FA)</strong>
                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">Un SMS de confirmation OTP sera exigé à chaque connexion</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      alert(twoFactorEnabled ? '2FA Désactivée avec succès.' : 'Double authentification active. Un code d\'activation a été transmis.');
                    }}
                    className={`p-1 px-3.5 rounded-xl text-[10.5px] font-black tracking-wide border cursor-pointer ${
                      twoFactorEnabled ? 'bg-emerald-100 border-emerald-250 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {twoFactorEnabled ? 'Active [✓]' : 'Désactivée'}
                  </button>
                </div>

                <div className="p-3 bg-amber-50/20 rounded-xl border border-amber-150 text-[11px] leading-normal text-slate-600">
                  <strong>Journal de scannage :</strong> L'utilisation combinée du QR Code de votre bac et de votre OTP téléphone garantit qu'aucune tierce personne d'Abidjan ne peut falsifier vos levées ni altérer votre facturation d'assainissement publique.
                </div>
              </div>

              {/* Connected Active Devices */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-4 text-left">
                <h4 className="font-extrabold text-slate-800 uppercase text-xs pb-1 border-b border-slate-100">Sessions Actives & Connexions</h4>
                
                <div className="space-y-3">
                  {securityLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-700">
                      <div>
                        <span className="font-bold text-slate-800 block flex items-center gap-1">
                          {log.device}
                          {log.current && <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-250 font-black tracking-normal px-1.5 rounded-md">Cet Appareil</span>}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-normal block">{log.location} • {log.time}</span>
                      </div>

                      {!log.current && (
                        <button
                          type="button"
                          onClick={() => {
                            setSecurityLogs(securityLogs.filter(l => l.id !== log.id));
                            alert('Session révoquée avec succès.');
                          }}
                          className="text-[10px] text-red-650 hover:underline cursor-pointer"
                        >
                          Révoquer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* K. CONSOLE ADMINISTRATEUR TELEMETRY (Requested) */}
        {portalTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left font-semibold text-slate-700">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Télémétrie d'usage du Portail Client Municipal</h3>
              <p className="text-xs text-slate-400 font-mono">Vue globale des requêtes, tickets et paiements générés par les usagers d'assainissement</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="text-slate-400 block text-[10px]">Utilisateurs en ligne</span>
                <strong className="text-slate-850 block mt-1 text-md font-black">{adminStats.connectedActive} Abonnés</strong>
                <span className="text-[9.5px] text-emerald-600 block mt-0.5">Session active et cookies OK</span>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="text-slate-400 block text-[10px]">Dossiers d'accidents</span>
                <strong className="text-amber-700 block mt-1 text-md font-black">{adminStats.openTickets} Activés</strong>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">Assignés aux camions</span>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="text-slate-400 block text-[10px]">Ventes d'Équipements</span>
                <strong className="text-slate-800 block mt-1 text-md font-black">{adminStats.binSales} Commandes</strong>
                <span className="text-[9.5px] text-indigo-700 block mt-0.5">Total: {adminStats.revenueBoutique.toLocaleString()} FCFA</span>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs text-left">
                <span className="text-slate-400 block text-[10px]">Taux d'usage API OM</span>
                <strong className="text-slate-850 block mt-1 text-md font-black">98.92 %</strong>
                <span className="text-[9.5px] text-slate-400 block mt-0.5">Passerelle Orange Abidjan</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-xs space-y-3.5">
              <h4 className="font-extrabold text-slate-800 uppercase text-xs pb-1 border-b border-slate-100">Journal d'activité du portail citoyen</h4>
              
              <div className="space-y-2.5">
                {[
                  { d: 'À l\'instant', sub: currentUser?.name, op: 'Consultation du carnet technique de la poubelle connectée.' },
                  { d: 'Il y a 10 min', sub: 'Koffi Kouassi', op: 'Authentification réussie par OTP SMS Mobile Money.' },
                  { d: 'Il y a 1h', sub: 'Diallo Mamadou', op: 'Acquittement de la facture de Mai de 4,500 FCFA.' }
                ].map((act, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center text-[11px] leading-relaxed">
                    <div>
                      <strong className="text-slate-800">{act.sub}</strong>
                      <span className="text-slate-500 ml-2">{act.op}</span>
                    </div>

                    <span className="text-[9.5px] text-slate-400 shrink-0 font-mono italic">{act.d}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* L. SPÉCIFICATIONS TECHNIQUES SQL & API REST (Blueprints) */}
        {portalTab === 'blueprints' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h3 className="font-extrabold text-md text-slate-800">Spécifications Techniques & Code de Restauration</h3>
              <p className="text-xs text-slate-400 font-mono">Déploiement en production, scripts SQL, modèles de base de données et routeurs REST API</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl text-xs space-y-4">
              <p className="text-slate-650 leading-relaxed font-semibold">
                Ces ressources permettent de monter instantanément les serveurs backend d'AKPBF conformes à la maquette de production. La structure inclut tous les index de géolocalisation et clés de relation pour l'assainissement d'Abidjan.
              </p>

              {/* SQL scripts Copy card */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-slate-200 px-4 py-3 font-mono font-bold text-[11px] flex justify-between items-center">
                  <span>🐘 SCRIPT DE RESTAURATION POSTGRESQL (schema.sql)</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(POSTGRES_SQL_SCHEMA);
                      alert("Script SQL copié dans votre presse-papiers !");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[10px] rounded font-mono font-black border border-emerald-500 cursor-pointer"
                  >
                    COPIER LE SCRIPT
                  </button>
                </div>
                <div className="p-4 bg-slate-950 font-mono text-[10.5px] text-emerald-400 overflow-x-auto max-h-72 whitespace-pre leading-relaxed">
                  {POSTGRES_SQL_SCHEMA}
                </div>
              </div>

              {/* DB Python models */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-slate-200 px-4 py-3 font-mono font-bold text-[11px] flex justify-between items-center">
                  <span>🐍 MODÈLISATIONS BACKEND PYTHON (models.py)</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(FASTAPI_MODELS_PYTHON);
                      alert("Modèles Python SQLAlchemy copiés !");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[10px] rounded font-mono font-black border border-emerald-500 cursor-pointer"
                  >
                    COPIER LE SCRIPT
                  </button>
                </div>
                <div className="p-4 bg-slate-950 font-mono text-[10.5px] text-amber-300 overflow-x-auto max-h-72 whitespace-pre leading-relaxed">
                  {FASTAPI_MODELS_PYTHON}
                </div>
              </div>

              {/* API and FastAPI routers */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-slate-250 px-4 py-3 font-mono font-bold text-[11px] flex justify-between items-center">
                  <span>⚡ ROUTAGE REST API FASTAPI & WEBSOCKET (main.py)</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(FASTAPI_REST_API);
                      alert("Routeurs REST API copiés avec succès !");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[10px] rounded font-mono font-black border border-emerald-500 cursor-pointer"
                  >
                    COPIER LE SCRIPT
                  </button>
                </div>
                <div className="p-4 bg-slate-950 font-mono text-[10.5px] text-indigo-300 overflow-x-auto max-h-72 whitespace-pre leading-relaxed">
                  {FASTAPI_REST_API}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
