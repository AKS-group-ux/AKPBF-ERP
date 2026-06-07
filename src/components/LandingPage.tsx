import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, 
  MapPin, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Shield, 
  ChevronRight, 
  PlusCircle, 
  Smartphone, 
  Sparkles, 
  Star, 
  Clock, 
  Truck, 
  Map, 
  PhoneCall, 
  FileText, 
  HelpCircle,
  Menu,
  X,
  Lock,
  Mail,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SubscriptionPlan, Subscriber } from '../types';
import ThemeToggle from './ThemeToggle';

interface LandingPageProps {
  plans: SubscriptionPlan[];
  subscribers: Subscriber[];
  onAddSubscriber: (sub: any) => Promise<any>;
  onLogin: (sessionUser: any) => void;
  onAddNotificationLogs?: (notif: any) => void;
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export default function LandingPage({ 
  plans, 
  subscribers, 
  onAddSubscriber, 
  onLogin,
  onAddNotificationLogs,
  theme,
  setTheme
}: LandingPageProps) {
  const navigate = useNavigate();
  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'pricing' | 'zones' | 'register' | 'complaint' | 'login'>('home');
  
  // Registration Form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+226 ');
  const [regAddress, setRegAddress] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('Karpala');
  const [regPlanId, setRegPlanId] = useState('plan_eco');
  const [regBinType, setRegBinType] = useState<'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L'>('Standard 240L');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Complaint Form states
  const [compName, setCompName] = useState('');
  const [compPhone, setCompPhone] = useState('+225 ');
  const [compSubscriberId, setCompSubscriberId] = useState('');
  const [compCategory, setCompCategory] = useState('non_collection');
  const [compMessage, setCompMessage] = useState('');
  const [compLocation, setCompLocation] = useState('Marcory');
  const [compLoading, setCompLoading] = useState(false);
  const [compSuccess, setCompSuccess] = useState<string | null>(null);

  // Track programmatic scrolling to prevent Scroll Spy feedback loops
  const isScrollingProgrammatically = useRef(false);
  const scrollProgrammaticTimeoutRef = useRef<any>(null);

  // Auto scroll to section helper
  const scrollToSection = (id: string, tabName: any) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false);
    
    isScrollingProgrammatically.current = true;
    if (scrollProgrammaticTimeoutRef.current) {
      clearTimeout(scrollProgrammaticTimeoutRef.current);
    }
    
    // Slight delay of 150ms to let mobile menu collapse and layout stabilize
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 88; // Height of the sticky header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Release lock after smooth scroll completes
        scrollProgrammaticTimeoutRef.current = setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 1000);
      } else {
        isScrollingProgrammatically.current = false;
      }
    }, 150);
  };

  // Scroll Spy to track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return;

      const sectionIds = [
        { id: 'hero-section', tab: 'home' },
        { id: 'services-section', tab: 'services' },
        { id: 'pricing-section', tab: 'pricing' },
        { id: 'zones-section', tab: 'zones' },
        { id: 'registration-section', tab: 'register' },
        { id: 'complaint-section', tab: 'complaint' }
      ];

      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      const headerHeight = 90;
      let currentSection = 'home';

      for (const section of sectionIds) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop - headerHeight - 120;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentSection = section.tab;
          }
        }
      }

      // Special handling for being near the bottom of the page
      if (window.innerHeight + scrollPosition >= document.documentElement.scrollHeight - 120) {
        currentSection = 'complaint';
      }

      setActiveTab(currentSection as any);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initially
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollProgrammaticTimeoutRef.current) {
        clearTimeout(scrollProgrammaticTimeoutRef.current);
      }
    };
  }, []);

  // Prepopulate form if plan selected
  const handleSelectPlan = (planId: string) => {
    setRegPlanId(planId);
    scrollToSection('registration-section', 'register');
  };

  const renderDesktopNavLink = (sectionId: string, tabId: 'home' | 'services' | 'pricing' | 'zones' | 'register' | 'complaint', label: string) => {
    const isActive = activeTab === tabId;
    return (
      <button
        type="button"
        onClick={() => scrollToSection(sectionId, tabId)}
        className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 relative select-none cursor-pointer flex items-center justify-center min-w-[90px]"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className={`relative z-10 transition-colors duration-300 ${
          isActive 
            ? 'text-emerald-700 dark:text-emerald-400 font-extrabold scale-105' 
            : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold'
        }`}>
          {label}
        </span>
        {isActive && (
          <motion.span 
            layoutId="activePublicTabBackground"
            className="absolute inset-0 bg-emerald-100/40 dark:bg-emerald-950/60 rounded-xl border border-emerald-500/10 dark:border-emerald-400/15 border-b-2 border-b-emerald-600 dark:border-b-emerald-400 shadow-xs -z-10"
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />
        )}
      </button>
    );
  };

  const renderMobileNavLink = (sectionId: string, tabId: 'home' | 'services' | 'pricing' | 'zones' | 'register' | 'complaint', label: string) => {
    const isActive = activeTab === tabId;
    return (
      <button 
        type="button"
        onClick={() => scrollToSection(sectionId, tabId)}
        className="w-full text-left py-2.5 px-4 text-xs font-bold rounded-lg transition-all duration-200 block select-none cursor-pointer relative"
      >
        <span className={`relative z-10 transition-colors duration-350 ${
          isActive 
            ? 'text-emerald-700 dark:text-emerald-400 font-black' 
            : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500 font-semibold'
        }`}>
          {label}
        </span>
        {isActive && (
          <motion.span 
            layoutId="activeMobileTabBackground"
            className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/45 rounded-xl border-l-4 border-l-emerald-500 dark:border-l-emerald-400 -z-10 shadow-xs"
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          />
        )}
      </button>
    );
  };

  // Submit subscriber registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName || !regEmail || !regPhone || !regAddress) {
      setRegError("S'il vous plaît complétez tous les champs requis.");
      return;
    }

    // Email format checks
    const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!mailRegex.test(regEmail.trim())) {
      setRegError("L'adresse e-mail n'est pas au format valide (ex: citoyen@ouaga.bf).");
      return;
    }

    // Phone format checks (Burkina Faso phone length is usually 8 digits)
    const cleanPh = regPhone.replace(/[\s\-\+]/g, '');
    if (cleanPh.length < 8) {
      setRegError("Le numéro de téléphone est trop court ou invalide.");
      return;
    }

    setRegLoading(true);

    try {
      const generatedId = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
      const selectedPlan = plans.find(p => p.id === regPlanId) || plans[0];
      
      const newSub: Subscriber = {
        id: generatedId,
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim(),
        neighborhood: regNeighborhood,
        lat: 5.3489 + (Math.random() - 0.5) * 0.04,
        lng: -3.9995 + (Math.random() - 0.5) * 0.04,
        planId: regPlanId,
        status: 'pending_validation',
        binType: regBinType,
        lastCollectionDate: 'Jamais',
        currentBinLevel: 0,
        paymentStatus: 'unpaid',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        collectionsRealized: 0,
        unpaidDays: 0
      };

      // Success
      const serverSub = await onAddSubscriber(newSub);
      const actualId = serverSub?.id || generatedId;

      // Log notification
      if (onAddNotificationLogs) {
        onAddNotificationLogs({
          id: `MSG-${Math.floor(1000 + Math.random() * 9000)}-Q`,
          recipientName: regName,
          recipientContact: regPhone,
          type: 'sms',
          templateName: 'Bienvenue',
          content: `Bonjour ${regName}, bienvenue chez AKPBF ! Votre inscription à la formule ${selectedPlan.name} est enregistrée. Identifiant : ${actualId}.`,
          sentAt: new Date().toISOString(),
          status: 'sent'
        });
      }

      setRegSuccess(actualId);
      setRegLoading(false);

      // Clear fields
      setRegName('');
      setRegEmail('');
      setRegPhone('+226 ');
      setRegAddress('');
    } catch (err: any) {
      setRegError(err.message);
      setRegLoading(false);
    }
  };

  // Submit complaint
  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compPhone || !compMessage) {
      alert("Veuillez remplir les informations de contact et le message de réclamation.");
      return;
    }

    setCompLoading(true);

    setTimeout(() => {
      const ticketId = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
      setCompSuccess(ticketId);
      setCompLoading(false);

      if (onAddNotificationLogs) {
        onAddNotificationLogs({
          id: `MSG-${Math.floor(1000 + Math.random() * 9000)}-Q`,
          recipientName: compName,
          recipientContact: compPhone,
          type: 'sms',
          templateName: 'Ticket Réclamation',
          content: `Mairie de Ouagadougou - AKPBF : Réclamation ${ticketId} enregistrée avec succès. Notre équipe technique intervient dans un délai de 24h. Merci.`,
          sentAt: new Date().toISOString(),
          status: 'sent'
        });
      }

      // Clear fields
      setCompName('');
      setCompPhone('+226 ');
      setCompSubscriberId('');
      setCompMessage('');
    }, 1500);
  };

  const neighborhoods = [
    'Karpala', 'Somgandé', 'Gounghin', 'Pissy', 'Ouaga 2000', 'Tampouy',
    'Patte d\'Oie', 'Cissin', 'Wemtenga', 'Dassasgho', 'Koulouba', 'Sanyiri'
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      
      {/* 1. HEADER SECTION & NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero-section', 'home')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black font-mono text-lg shadow-md shadow-emerald-500/20">
              AK
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight block">AKPBF Salubrité</span>
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest block leading-none">MUNICIPE ABIDJAN</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {renderDesktopNavLink('hero-section', 'home', 'Accueil')}
            {renderDesktopNavLink('services-section', 'services', 'Nos Services')}
            {renderDesktopNavLink('pricing-section', 'pricing', 'Forfaits')}
            {renderDesktopNavLink('zones-section', 'zones', 'Secteurs & Stats')}
            {renderDesktopNavLink('registration-section', 'register', "S'inscrire")}
            {renderDesktopNavLink('complaint-section', 'complaint', 'Réclamation')}
          </nav>

          {/* Action Login button */}
          <div className="hidden md:flex items-center gap-4">
            {theme && setTheme && (
              <ThemeToggle theme={theme} setTheme={setTheme} />
            )}
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-650 dark:hover:bg-emerald-600 transition text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/5 hover:-translate-y-0.5"
            >
              <Lock className="h-4 w-4" />
              Accès Portail Pro
            </button>
          </div>

          {/* Toggle Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
            {theme && setTheme && (
              <ThemeToggle theme={theme} setTheme={setTheme} />
            )}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-705"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-slate-200/65 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2.5 overflow-hidden font-medium"
            >
              {renderMobileNavLink('hero-section', 'home', 'Accueil')}
              {renderMobileNavLink('services-section', 'services', 'Nos Services')}
              {renderMobileNavLink('pricing-section', 'pricing', 'Forfaits')}
              {renderMobileNavLink('zones-section', 'zones', 'Secteurs & Stats')}
              {renderMobileNavLink('registration-section', 'register', "S'inscrire en Ligne")}
              {renderMobileNavLink('complaint-section', 'complaint', 'Réclamation')}
              <button 
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg text-xs font-bold tracking-wider text-center flex justify-center items-center gap-2 shadow-xs"
              >
                <Lock className="h-4 w-4" />
                Accès Portail Pro
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. HERO SLIDE & OPERATIONAL VISION */}
      <section id="hero-section" className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 dark:from-slate-900/40 dark:via-slate-950 dark:to-slate-950 transition-colors duration-200">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-300/10 dark:bg-emerald-950/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-teal-300/10 dark:bg-teal-950/10 rounded-full blur-3xl pointer-events-none translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Technologie Civique & Salubrité Digitale
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
              Simplifions la gestion des déchets à <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Ouagadougou</span>
            </h1>
            <p className="text-sm sm:text-md text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
              Al-Kaïda Prestations - Bureaux & Facturation (AKPBF) propose un écosystème intelligent de ramassage municipal connecté par puce RFID, de planification de flotte verte par GPS, de signature de contrats électroniques de services civiques, et d'alertes par SMS.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={() => scrollToSection('registration-section', 'register')}
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs tracking-wider rounded-xl uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                S'abonner en Ligne
              </button>
              <button 
                onClick={() => scrollToSection('complaint-section', 'complaint')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-200 font-extrabold text-xs tracking-wider rounded-xl uppercase transition flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                Soumettre un Signalement
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                Validation sous 24h
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                Collecte Garantie
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            {/* Immersive Dashboard Layout Mock Preview */}
            <div className="relative p-1.5 bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-slate-800/80 rounded-[2.5rem] shadow-2xl backdrop-blur-md overflow-hidden animate-in zoom-in-95 duration-500">
              
              <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-[2.2rem] space-y-6 text-left relative">
                
                {/* Visual Indicator of Live Fleet GPS Status */}
                <div className="flex items-center justify-between border-b border-slate-800/85 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-mono text-slate-400 font-bold tracking-widest uppercase">SYSTÈME SIG EN DIRECT</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded">Commune Connectée</span>
                </div>

                {/* Simulated Truck State Widget */}
                <div className="space-y-3 bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-200 leading-none">Benne Renault D16</h4>
                        <span className="text-[9px] text-slate-500 font-bold">Immatriculation : CI-3891-EF</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-350">Vitesse: 38 km/h</span>
                  </div>

                  {/* Bin Fill Status */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Remplissage Benne :</span>
                      <span className="text-emerald-400 font-bold">72%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>
                </div>

                {/* Connected Citizen Mock Status */}
                <div className="space-y-3 bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Prochain passage estimé :</span>
                    <span className="text-indigo-455 font-bold text-slate-200">Demain, 08:30</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Secteur Riviera 3 - Rue des Jardins</span>
                  </div>
                </div>

                {/* Micro floating UI Badges */}
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-2xl p-4 shadow-xl flex items-center gap-2 transform rotate-3 hover:rotate-0 transition duration-300">
                  <Users className="h-5 w-5" />
                  <div>
                    <span className="text-[10px] font-bold text-emerald-100 block uppercase">ABONNÉS</span>
                    <span className="text-lg font-black block leading-none">8,450+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BUSINESS STATISTICS GRID */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-250/50 dark:border-slate-800 py-12 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex justify-center items-center gap-1.5">
                <Users className="h-5 w-5 text-emerald-500" />
                8,450+
              </div>
              <p className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Abonnés satisfaits</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex justify-center items-center gap-1.5">
                <Trash2 className="h-5 w-5 text-emerald-500" />
                42 tonnes
              </div>
              <p className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Déchets enlevés / jour</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex justify-center items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                99.2%
              </div>
              <p className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Taux de ramassage ponctuel</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex justify-center items-center gap-1.5">
                <Truck className="h-5 w-5 text-emerald-500" />
                12 camions
              </div>
              <p className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Géolocalisés GPS live</p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. COMPANY DESCRIPTION & SALUBRITE VALUES */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 text-left space-y-4">
            <span className="text-emerald-500 dark:text-emerald-400 font-bold block text-xs tracking-wider uppercase font-mono">QUI SOMMES-NOUS ?</span>
            <h2 className="text-2xl sm:text-3.5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight">
              Al-Kaïda Prestations - Bureaux & Facturation (AKPBF) : Pilier de la transition écologique de Ouagadougou
            </h2>
            <p className="text-xs sm:text-sm text-slate-655 text-slate-600 dark:text-slate-350 leading-relaxed font-semibold">
              Sous l'égide de la politique d'assainissement et de préservation de l'environnement des municipalités de l'UEMOA, nous opérons avec ferveur pour doter les citoyens burkinabè d'outils technologiques avancés de salubrité publique.
            </p>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white leading-normal">Bacs Puces RFID connectés</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Évaluation du taux de remplissage pour un vide intelligent évitant les nuisances odorantes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white leading-normal">Optimisation d'itinéraires (SIG)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Algorithmes heuristiques réduisant de 18% les émissions carbonées de notre flotte d'enlèvement.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl grid sm:grid-cols-2 gap-6 shadow-md transition-colors duration-205">
            
            <div className="p-5 bg-emerald-50/50 dark:bg-slate-950/40 rounded-2xl space-y-2 border border-emerald-100/50 dark:border-emerald-950/20">
              <Shield className="h-7 w-7 text-emerald-500" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-none">Certifié Salubrité Verte</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Conformité stricte avec les normes environnementales et chartes de salubrité du Burkina Faso.</p>
            </div>

            <div className="p-5 bg-emerald-50/50 dark:bg-slate-950/40 rounded-2xl space-y-2 border border-emerald-100/50 dark:border-emerald-950/20">
              <Smartphone className="h-7 w-7 text-emerald-500" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-none">Alertes SMS & Factures</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Notifications instantanées avant le passage des bennes et relances par Mobile Money de Ouagadougou.</p>
            </div>

            <div className="p-5 bg-emerald-50/50 dark:bg-slate-950/40 rounded-2xl space-y-2 border border-emerald-100/50 dark:border-emerald-950/20">
              <Clock className="h-7 w-7 text-emerald-500" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-none">Intervention Rapide</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Gestion des réclamations via notre plateforme dédiée avec déblocage sous 24h.</p>
            </div>

            <div className="p-5 bg-emerald-50/50 dark:bg-slate-950/40 rounded-2xl space-y-2 border border-emerald-100/50 dark:border-emerald-950/20">
              <FileText className="h-7 w-7 text-emerald-500" />
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-none">Contrats Électroniques</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Dossiers signés via portail citoyen avec reçu de caisse instantané.</p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. SERVICES OF WASTE COLLECTION */}
      <section id="services-section" className="py-20 bg-white dark:bg-slate-900 transition-colors duration-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-500 tracking-wider uppercase font-mono">DÉTAIL DES SERVICES</span>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">Des prestations modernes adaptées à votre quotidien</h2>
            <p className="text-slate-550 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium">
              Du ménage individuel aux industries complexes de Ouagadougou, AKPBF met en œuvre des approches de ramassage structurées et technologiques.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Service 1 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 space-y-4 hover:shadow-lg transition">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl inline-block">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Collecte Résidentielle Ordinaire</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Service hebdomadaire ou bishebdomadaire d'enlèvement d'ordures pour villas et appartements. Mise à disposition de bacs connectés sécurisés et vidage systématique.
              </p>
              <ul className="text-xs font-bold space-y-2 pt-2 text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Bacs puces RFID standard 240L
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Passage fixe 2 à 3 fois par semaine
                </li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 space-y-4 hover:shadow-lg transition">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl inline-block">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Services Commerciaux & B2B</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Opérations d'élimination de déchets pour boutiques, bureaux administratifs, restaurants et commerces de Ouagadougou, avec fréquence de rotation modulée.
              </p>
              <ul className="text-xs font-bold space-y-2 pt-2 text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Conteneurs géants 1100L mobilisables
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Conventions contractuelles personnalisées
                </li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 space-y-4 hover:shadow-lg transition">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl inline-block">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">Enlèvement Urgent & Spécifique</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enlèvement d'urgence pour encombrants, déchets de démolitions légères ou déchets végétaux lourds suite à des élagages, commandé directement en ligne.
              </p>
              <ul className="text-xs font-bold space-y-2 pt-2 text-slate-600 dark:text-slate-350">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Intervention expresse en moins de 4h
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Paiement à l'acte par Orange Money / Wave
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 6. SUBSCRIBER PACKAGES / SUBSCRIPTION PLANS */}
      <section id="pricing-section" className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-500 tracking-wider uppercase font-mono">FORFAITS FLEXIBLES</span>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">Formules et redevances de salubrité publique</h2>
            <p className="text-slate-550 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium">
              Des tarifs encadrés par la mairie, indexés à la volumétrie requise. Pas de mauvaise surprise, paiement mensuel ou annuel.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((p) => {
              const iconObj = p.id === 'plan_eco' ? Trash2 : p.id === 'plan_pro' ? Truck : Sparkles;
              return (
                <div 
                  key={p.id}
                  className={`bg-white dark:bg-slate-900 border ${
                    regPlanId === p.id 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/25' 
                      : 'border-slate-200 dark:border-slate-800'
                    } p-6 md:p-8 rounded-3xl space-y-6 flex flex-col justify-between hover:shadow-lg transition relative`}
                >
                  {regPlanId === p.id && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider">
                      Formule Sélectionnée
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-md sm:text-lg font-black text-slate-950 dark:text-white">{p.name}</h3>
                        <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-widest">{p.reference}</span>
                      </div>
                      <span className="p-2 bg-emerald-50 dark:bg-slate-950/60 text-emerald-500 rounded-xl">
                        {p.id === 'plan_eco' ? <Trash2 className="h-5 w-5" /> : p.id === 'plan_pro' ? <Truck className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black price-text !text-slate-950 dark:!text-white">{p.price.toLocaleString()}</span>
                      <span className="text-xs font-bold text-slate-500">FCFA / {p.frequency.toLowerCase()}</span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      {p.description}
                    </p>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Volume: <strong className="text-slate-900 dark:text-white">{p.allowedVolume}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Fréquence: <strong className="text-slate-900 dark:text-white">{p.collectionFrequency}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>Puce RFID: <strong className="text-slate-900 dark:text-white">Incluse gratuite</strong></span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full py-3 text-center text-xs font-black tracking-wider uppercase rounded-xl transition ${
                      regPlanId === p.id 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    Choisir cette formule
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 7. CUSTOMER REGISTRATION STEPPER */}
      <section id="registration-section" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800 transition-colors duration-200 text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold text-emerald-500 tracking-wider uppercase font-mono">ADHÉSION CITOYENNE</span>
            <h2 className="text-2xl sm:text-3.5xl font-black text-slate-950 dark:text-white tracking-tight">Inscription d'un nouvel abonné en ligne</h2>
            <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 font-medium max-w-xl mx-auto">
              Remplissez le formulaire de service salubrité ci-dessous. Votre bac sera équipé de sa clé électronique RFID et livré à votre porte sous 24h.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-6 md:p-10 rounded-3xl border border-slate-200/60 dark:border-slate-800">
            
            {regSuccess ? (
              <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-650 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-950 dark:text-white">Inscription Réussie !</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                    Votre dossier municipal est enregistré sous la référence de citoyen :
                  </p>
                  <div className="inline-block px-5 py-2.5 bg-slate-900 border border-slate-805 text-emerald-400 font-mono font-black rounded-xl text-lg tracking-widest shadow-lg">
                    {regSuccess}
                  </div>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-4 rounded-2xl max-w-md mx-auto text-xs text-left leading-relaxed">
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 block mb-1">ℹ Prochaines étapes :</span>
                  1. Un installateur de Ouagadougou AKPBF prendra contact pour arrimer la puce RFID à votre portail.<br/>
                  2. Vos codes d'accès ont été configurés avec votre adresse e-mail.<br/>
                  3. Vous recevrez un premier SMS de confirmation.
                </div>

                <button 
                  onClick={() => setRegSuccess(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase"
                >
                  Inscrire un autre foyer
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                
                {regError && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-950 p-4 rounded-xl text-xs font-semibold select-none flex items-center gap-2 animate-pulse">
                    <span>⚠️</span>
                    <p>{regError}</p>
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Nom Complet du Citoyen / Foyer</label>
                    <input 
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Mamadou Coulibaly"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Adresse E-mail</label>
                    <input 
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="m.coulibaly@gmail.com"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Téléphone de Ouagadougou (+226)</label>
                    <input 
                      type="text"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+226 70 12 34 56"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    />
                  </div>

                  {/* Sector / Neighborhood */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Secteur / Quartier desservi</label>
                    <select 
                      value={regNeighborhood}
                      onChange={(e) => setRegNeighborhood(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    >
                      {neighborhoods.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Subscription Plan selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Formule d'Abonnement souhaitée</label>
                    <select 
                      value={regPlanId}
                      onChange={(e) => setRegPlanId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()} FCFA)</option>
                      ))}
                    </select>
                  </div>

                  {/* Bin category */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Capacité Poubelle requise</label>
                    <select 
                      value={regBinType}
                      onChange={(e) => setRegBinType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    >
                      <option value="Standard 240L">Standard 240L (Recommandé particuliers)</option>
                      <option value="Bac Grand 360L">Bac Grand 360L (Familles ou Commerces)</option>
                      <option value="Conteneur 1100L">Conteneur 1100L (Copropriétés ou B2B)</option>
                    </select>
                  </div>
                </div>

                {/* Detailed exact physical address */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Adresse Géographique Précise (Rue, Villa, Résidence, Repère)</label>
                  <textarea 
                    required
                    rows={2}
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Riviera 3, Rue des Jardins, face à la pharmacie Riviera, Villa 42B"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-802 rounded-xl p-4 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                  />
                </div>

                <div className="text-left bg-emerald-50/40 dark:bg-slate-900 border border-emerald-100/50 dark:border-slate-800 p-4 rounded-xl flex items-start gap-3">
                  <Info className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                    En cliquant sur "Valider mon Raccordement", vous acceptez que vos coordonnées soient transférées à notre service SIG logistique pour le déploiement du bac RFID et la sécurité publique de Côte d'Ivoire.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wider uppercase rounded-xl transition flex items-center justify-center gap-2"
                >
                  {regLoading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Configuration électronique en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      Valider mon Raccordement AKPBF
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>
      </section>

      {/* 8. INCIDENT & COMPLAINT SYSTEM (RECLAMATION) */}
      <section id="complaint-section" className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold text-amber-500 tracking-wider uppercase font-mono">DÉCLARATION D'INCIDENT</span>
            <h2 className="text-2xl sm:text-3.5xl font-black text-slate-950 dark:text-white tracking-tight">Ouverture d'une réclamation ou signalement</h2>
            <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 font-medium max-w-xl mx-auto">
              Un bac cassé ? Une levée non effectuée ? Un abus ? Déclarez l'anomalie. Nos équipes logistiques sont notifiées de suite par liaison centrale.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            
            {compSuccess ? (
              <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto text-3xl font-bold">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-950 dark:text-white">Réclamation Enregistrée !</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                    Votre ticket d'incident municipal a été créé avec le code de suivi :
                  </p>
                  <div className="inline-block px-5 py-2.5 bg-slate-900 border border-slate-800 text-amber-400 font-mono font-black rounded-xl text-lg tracking-widest shadow-lg">
                    {compSuccess}
                  </div>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/60 p-4 rounded-2xl max-w-md mx-auto text-xs text-left leading-relaxed text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">📢 Dispatching Instantané :</span>
                  L'alerte a été relayée à la commission d'assainissement et au chauffeur de garde de votre secteur. Un SMS de suivi d'intervention vous a été envoyé.
                </div>

                <button 
                  onClick={() => setCompSuccess(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase"
                >
                  Déclarer un autre problème
                </button>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-6">
                
                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* Citizen Name */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Votre Nom Complet</label>
                    <input 
                      type="text"
                      required
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      placeholder="Jean-Jacques Koffi"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Téléphone de contact</label>
                    <input 
                      type="text"
                      required
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value)}
                      placeholder="+225 05 01 02 03"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    />
                  </div>

                  {/* Subscriber ID (Optional) */}
                  <div className="space-y-1.5 col-span-1">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">ID unique d'abonné (Optionnel)</label>
                    <input 
                      type="text"
                      value={compSubscriberId}
                      onChange={(e) => setCompSubscriberId(e.target.value)}
                      placeholder="SUB-4029"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    />
                  </div>

                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Nature du Signalement</label>
                    <select 
                      value={compCategory}
                      onChange={(e) => setCompCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    >
                      <option value="non_collection">Ramassage manqué / Oubli de camion</option>
                      <option value="broken_bin">Bac poubelle cassé ou dégradé</option>
                      <option value="billing_issue">Incohérence ou contestation de facture</option>
                      <option value="illegal_dump">Dépôt sauvage d'ordures hors bac</option>
                      <option value="other">Autre motif de doléance municipale</option>
                    </select>
                  </div>

                  {/* Incident location */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Localisation de l'anomalie</label>
                    <select 
                      value={compLocation}
                      onChange={(e) => setCompLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                    >
                      <option value="Karpala">Karpala</option>
                      <option value="Somgandé">Somgandé / Zone Ind.</option>
                      <option value="Gounghin">Gounghin</option>
                      <option value="Pissy">Pissy</option>
                      <option value="Ouaga 2000">Ouaga 2000</option>
                    </select>
                  </div>

                </div>

                {/* Complaint detailed message */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Description circonstanciée de l'incident</label>
                  <textarea 
                    required
                    rows={4}
                    value={compMessage}
                    onChange={(e) => setCompMessage(e.target.value)}
                    placeholder="Détaillez : Le camion n'est pas passé ce matin malgré notre puce validée, ou notre couvercle de bac 240L a été endommagé lors du vidage..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-802 rounded-xl p-4 text-xs font-semibold outline-none focus:border-emerald-500 text-slate-850 dark:text-white transition"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={compLoading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wider uppercase rounded-xl transition flex items-center justify-center gap-2"
                >
                  {compLoading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Dispatching au centre logistique...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
                      Soumettre la doléance à AKPBF
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>
      </section>

      {/* 9. SERVED AREAS & SECTORS (ZONES DESSERVIES) */}
      <section id="zones-section" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800 transition-colors duration-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-emerald-500 tracking-wider uppercase font-mono">ZONES DE COUVERTURE</span>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight">Secteurs opérationnels de Ouagadougou</h2>
            <p className="text-slate-550 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium">
              Nous couvrons les principaux pôles économiques et résidentiels avec une planification rigoureuse sous SIG.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left lists of zones */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 dark:bg-slate-950/40 border border-emerald-100/50 dark:border-emerald-950/10 rounded-2xl flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Zone Est (Somgandé - Wemtenga)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Somgandé, Wemtenga, Dassasgho, Sanyiri. 3 camions connectés de garde par jour.</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-slate-950/40 border border-emerald-100/50 dark:border-emerald-950/10 rounded-2xl flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Zone Sud (Karpala - Ouaga 2000)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Karpala, Ouaga 2000, Patte d'Oie. Point de fort trafic commercial B2B.</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-slate-950/40 border border-emerald-100/50 dark:border-emerald-950/10 rounded-2xl flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Zone Ouest (Gounghin - Pissy)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Gounghin, Pissy, Tampouy, Cissin. Secteurs à forte densité résidentielle.</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-slate-950/40 border border-emerald-100/50 dark:border-emerald-950/10 rounded-2xl flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Zone Centrale Administrative (Koulouba)</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">Quartier des affaires, banques, ministères, Koulouba. Service d'enlèvement quotidien de nuit.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Map/Graphic Panel of Ouagadougou Operations */}
            <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-805 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Map className="h-4 w-4" />
                  Cartographie logistique réactive
                </span>
                <span className="text-xs text-slate-500 font-bold">Ouagadougou SIG v2.4</span>
              </div>

              {/* Graphical simulation panel of Ouagadougou Map */}
              <div className="bg-slate-900 dark:bg-slate-950 h-72 rounded-2xl relative overflow-hidden flex items-center justify-center p-4 border border-slate-800">
                
                {/* Simulated geographic paths */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <line x1="10%" y1="10%" x2="90%" y2="80%" stroke="#10b981" strokeWidth="4" strokeDasharray="5,5" />
                    <line x1="5%" y1="60%" x2="95%" y2="30%" stroke="#10b981" strokeWidth="3" />
                    <line x1="40%" y1="0%" x2="40%" y2="100%" stroke="#10b981" strokeWidth="2" />
                    <circle cx="20%" cy="30%" r="50" stroke="#10b981" strokeWidth="1" fill="none" />
                    <circle cx="70%" cy="60%" r="90" stroke="#10b981" strokeWidth="1" fill="none" />
                  </svg>
                </div>

                {/* Simulated markers */}
                <div className="absolute top-[20%] left-[30%] bg-emerald-500 text-white p-2 rounded-xl text-[9px] font-black tracking-wide shadow-lg transform scale-95 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  KARPALA
                </div>
                <div className="absolute top-[50%] left-[65%] bg-emerald-500 text-white p-2 rounded-xl text-[9px] font-black tracking-wide shadow-lg transform rotate-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  OUAGA 2000
                </div>
                <div className="absolute top-[70%] left-[15%] bg-teal-500/80 text-white p-1.5 rounded-lg text-[8.5px] font-semibold tracking-wide shadow-lg flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-white" />
                  SOMGANDE
                </div>
                <div className="absolute top-[40%] left-[45%] bg-indigo-550 bg-indigo-600 text-white p-1.5 rounded-lg text-[8.5px] font-bold tracking-wide shadow-lg flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-white" />
                  KOULOUBA
                </div>

                {/* Connected truck indicator icon moving around */}
                <div className="absolute top-[32%] left-[48%] bg-amber-500 text-white p-1.5 rounded-full shadow-xl animate-bounce">
                  <Truck className="h-4 w-4" />
                </div>

                <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-400 space-y-1 text-left">
                  <span className="font-bold text-slate-200 uppercase block">LEGENDE SIG</span>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Secteurs Actifs</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Camion Collecteur Connecté GPS</div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 11. FOOTER INTUITIONS */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-left transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 text-white font-black text-xs p-2 rounded-lg font-mono">AKPBF</div>
              <span className="text-white font-extrabold text-sm tracking-tight">AKPBF Salubrité</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Al-Kaïda Prestations - Bureaux & Facturation (Commune de Ouagadougou). ERP de gestion intégrée, plan d'hygiène urbaine et de services civiques intelligents connectés en direct.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider uppercase">Services municipaux</h4>
            <ul className="text-[11px] space-y-2">
              <li><button onClick={() => scrollToSection('services-section', 'services')} className="hover:text-white transition">Collecte Résidentielle</button></li>
              <li><button onClick={() => scrollToSection('services-section', 'services')} className="hover:text-white transition">Convention B2B & Bureaux</button></li>
              <li><button onClick={() => scrollToSection('services-section', 'services')} className="hover:text-white transition">Gestion des encombrants</button></li>
              <li><button onClick={() => scrollToSection('zones-section', 'zones')} className="hover:text-white transition">SIG & Géolocalisation GPS</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider uppercase">Espace Foyer & Citoyen</h4>
            <ul className="text-[11px] space-y-2">
              <li><button onClick={() => scrollToSection('registration-section', 'register')} className="hover:text-white transition">S'inscrire en ligne</button></li>
              <li><button onClick={() => scrollToSection('pricing-section', 'pricing')} className="hover:text-white transition">Formules de redevance</button></li>
              <li><button onClick={() => scrollToSection('complaint-section', 'complaint')} className="hover:text-white transition">Soumettre une réclamation</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition">Portail Facturation & Contrats</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs tracking-wider uppercase">Contact d'assistance</h4>
            <p className="text-[11px] leading-relaxed">
              <strong>Mairie de Ouagadougou, Burkina Faso</strong><br/>
              Boîte Postale : BP 42 Ouagadougou 01<br/>
              Téléphone : +226 25 30 11 22<br/>
              Email : <a href="mailto:contact@salubrite.akpbf.bf" className="text-emerald-500 hover:underline">contact@salubrite.akpbf.bf</a>
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px]">
          <span>© 2026 AKPBF Salubrité de Ouagadougou. Tous droits de salubrité publique réservés par l'UEMOA.</span>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <a href="#" className="hover:text-white transition">Mentions Légales</a>
            <a href="#" className="hover:text-white transition">Charte de Confidentialité RGPD</a>
            <a href="#" className="hover:text-white transition">Accessibilité WCAG</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
