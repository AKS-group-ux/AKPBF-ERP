/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Database, 
  Terminal, 
  Layers, 
  Network, 
  FileCode, 
  FolderGit2, 
  ShieldCheck, 
  Rocket, 
  ChevronRight, 
  Play, 
  Copy, 
  Check, 
  Grid,
  Activity,
  Eye,
  Palette,
  MapPin,
  Sliders,
  FileText,
  Users,
  Coins,
  Map,
  Sparkles,
  CheckCircle2,
  Award
} from 'lucide-react';
import { API_SPECS, DB_TABLES } from '../documentation';

// Preset API definitions
interface SpecApi {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  roleRequired: string;
  payload?: string;
  response: string;
}

export default function ArchitectHub() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'database' | 'api' | 'security' | 'plan' | 'design-system'>('design-system');
  const [selectedScreen, setSelectedScreen] = useState<string>('dashboard');
  const [selectedApi, setSelectedApi] = useState<SpecApi>(API_SPECS[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [apiConsoleOutput, setApiConsoleOutput] = useState<string>('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Handle copying DB column trigger
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Run real Live API requests to our backend
  const handleTestApi = async () => {
    setIsApiLoading(true);
    setApiConsoleOutput('⌛ Connexion aux serveurs de production locaux d\'AKPBF...\n🛰️ Envoi de la demande d\'authentification...\n');

    try {
      // 1. Authenticate with admin account to claim fresh JWT token
      const authRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authMethod: 'email',
          email: 'groupaksservices@zohomail.com',
          password: 'Admin@2026'
        })
      });

      if (!authRes.ok) {
        throw new Error('Échec d\'authentification administrateur automatique.');
      }

      const { token } = await authRes.json();
      setApiConsoleOutput(prev => prev + '🔑 Authentification réussie ! Token JWT signé récupéré.\n🚀 Résolution de l\'URL opérationnelle...\n');

      // Map documentation paths to our real operational backend endpoints
      let realPath = selectedApi.path;
      let requestBody = selectedApi.payload ? JSON.parse(selectedApi.payload) : undefined;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (realPath === '/api/v1/subscribers' && selectedApi.method === 'GET') {
        realPath = '/api/billing/debts';
      } else if (realPath === '/api/v1/subscribers' && selectedApi.method === 'POST') {
        realPath = '/api/notifications/enqueue';
        requestBody = {
          recipient: '+225 07 48 29 10 22',
          channel: 'SMS',
          content: 'Bienvenue chez AKPBF ! Votre raccordement RFID a été activé.'
        };
      } else if (realPath === '/api/v1/billing/generate') {
        realPath = '/api/billing/cycle';
        requestBody = {};
      } else if (realPath === '/api/v1/routes/optimize') {
        realPath = '/api/gps/optimize';
        requestBody = { routeId: 'COCODY-RTE-2026' };
      } else if (realPath === '/api/v1/payments/webhook') {
        realPath = '/api/payments/webhook';
        // HMAC SHA-256 signature for test payload
        // Calculated for {"reference":"TXN-ORA-8841-K","status":"SUCCESS"}
        headers['x-akpbf-signature'] = 'c570b674cfb15993b49eeae7002ee8109bf27f80f2dff7e662985f5bc0b6d210';
        requestBody = {
          reference: 'TXN-ORA-8841-K',
          status: 'SUCCESS'
        };
      }

      setApiConsoleOutput(prev => prev + `📤 [Live Call] ${selectedApi.method} ${realPath} HTTP/1.1\n`);

      const res = await fetch(realPath, {
        method: selectedApi.method,
        headers,
        body: requestBody ? JSON.stringify(requestBody) : undefined
      });

      const responseText = await res.text();
      let formattedResponse = responseText;
      try {
        const json = JSON.parse(responseText);
        formattedResponse = JSON.stringify(json, null, 2);
      } catch (e) {
        // Raw text block fallback
      }

      setApiConsoleOutput(prev => {
        return prev + `📥 Statut HTTP : ${res.status} ${res.statusText}\n` +
               `📦 En-têtes : application/json\n\n` + 
               `${formattedResponse}`;
      });
    } catch (err: any) {
      setApiConsoleOutput(prev => prev + `❌ Échec d'appel API : ${err.message || err}\n`);
    } finally {
      setIsApiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-850 tracking-tight">Portail de l'Architecte Senior ─ AKPBF Technical Hub</h2>
          <p className="text-slate-500 text-sm mt-0.5">Dossier technique exhaustif d'ingénierie logicielle pour municipalités de large échelle</p>
        </div>
        
        {/* Sub Navigation Bar inside the Hub */}
        <div className="flex flex-wrap bg-slate-100 rounded-xl p-1 self-start gap-1">
          <button 
            onClick={() => setActiveTab('design-system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold font-sans transition cursor-pointer ${activeTab === 'design-system' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-650 hover:text-slate-900 bg-transparent hover:bg-slate-200/50'}`}
          >
            🎨 UI/UX Design System
          </button>
          <button 
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${activeTab === 'architecture' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Topology & UML
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${activeTab === 'database' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Schema SQL (DB)
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${activeTab === 'api' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Playground API
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${activeTab === 'security' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Rôles & RBAC
          </button>
          <button 
            onClick={() => setActiveTab('plan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${activeTab === 'plan' ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Phases Dev
          </button>
        </div>
      </div>

      {/* RENDER TAB 0: DESIGN SYSTEM, WIREFRAMES & DETAILED SPECS */}
      {activeTab === 'design-system' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header introduction to design system */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary/95 text-white rounded-2xl p-6 shadow-md border border-brand-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-1/3 opacity-15 pointer-events-none">
              <svg viewBox="0 0 100 100" className="h-full w-full object-cover">
                <circle cx="80" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M 0 50 Q 50 100 100 50" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
            <div className="relative space-y-2">
              <span className="text-[10px] font-bold uppercase bg-brand-accent/20 text-brand-accent px-2.5 py-1 rounded-full border border-brand-accent/30 tracking-widest inline-block select-none">
                Charte Graphique & Spécifications Senior UI/UX
              </span>
              <h3 className="text-xl font-black tracking-tight font-sans">
                AKPBF Enterprise Design System (Stripe & Linear Inspired)
              </h3>
              <p className="text-white/85 text-xs max-w-2xl leading-relaxed">
                Ce hub synthétise les directives de design de niveau supérieur d'AKPBF. Les interfaces sont pensées pour un usage professionnel rigoureux en Côte d'Ivoire et Afrique de l'Ouest, conciliant ergonomie de terrain et rigueur comptable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left selector rail - 10 screens specified by the user */}
            <div className="lg:col-span-1 space-y-2">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="pb-2.5 border-b border-slate-100 flex items-center gap-1.5 text-slate-800">
                  <Palette className="h-4.5 w-4.5 text-brand-primary" />
                  <span className="font-extrabold text-xs uppercase tracking-widest text-slate-700">Sélectionner un Écran</span>
                </div>
                
                <div className="flex flex-col gap-1 text-left">
                  {[
                    { id: 'dashboard', label: '1. Tableau de Bord', num: 'Dashboard', icon: Grid },
                    { id: 'subscribers', label: '2. Portefeuille Clients', num: 'Subscribers', icon: Users },
                    { id: 'abonnements', label: '3. Offres & Abonnements', num: 'Plans', icon: Sparkles },
                    { id: 'paiements', label: '4. Passerelle Paiements', num: 'Payments', icon: Coins },
                    { id: 'factures', label: '5. Registre des Factures', num: 'Invoices', icon: FileCode },
                    { id: 'collectes', label: '6. Tournées de Collecte', num: 'Collection', icon: Play },
                    { id: 'agents', label: '7. Équipages & Camions', num: 'Drivers', icon: Award },
                    { id: 'cartographie', label: '8. SIG & Cartographie', num: 'GIS', icon: MapPin },
                    { id: 'rapports', label: '9. Indicateurs & Rapports', num: 'Reports', icon: Activity },
                    { id: 'parametres', label: '10. Configuration SaaS', num: 'Settings', icon: Sliders }
                  ].map((scr) => {
                    const isSelected = selectedScreen === scr.id;
                    const IconComp = scr.icon;
                    return (
                      <button
                        key={scr.id}
                        type="button"
                        onClick={() => setSelectedScreen(scr.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition cursor-pointer text-xs font-semibold ${
                          isSelected 
                            ? 'bg-brand-primary text-white font-extrabold shadow-sm' 
                            : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp className={`h-4 w-4 ${isSelected ? 'text-brand-accent' : 'text-slate-400'}`} />
                          <span>{scr.label}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-brand-accent text-brand-primary font-bold' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {scr.num}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right side specifications and interactive Wireframe */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Wireframe and details card */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition duration-300 flex flex-col">
                
                {/* Visual Wireframe Previewer Label */}
                <div className="bg-slate-50/70 border-b border-slate-100 p-4.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4.5 w-4.5 text-brand-primary" />
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-700">Wireframe interactif haute-fidélité</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Simulation structurelle pour écran {selectedScreen.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-[10px] text-brand-primary font-black uppercase tracking-wider">AKPBF Premium UI</span>
                  </div>
                </div>

                {/* Wireframe Mockup Canvas */}
                <div className="p-6 bg-slate-100 border-b border-slate-100 font-sans flex items-center justify-center min-h-[300px]">
                  
                  {/* Selected Screen Wireframe Simulator Rendering */}
                  {selectedScreen === 'dashboard' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 space-y-4">
                      {/* Top Bar inside wireframe */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                          <div className="h-3 w-20 bg-slate-250 rounded animate-pulse" />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-6 w-12 bg-slate-200 rounded-lg" />
                          <div className="h-6 w-24 bg-brand-primary rounded-lg" />
                        </div>
                      </div>
                      {/* KPI cards in wireframe */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <span className="text-[8px] uppercase text-slate-400 block tracking-wider">Abonnés Actifs</span>
                          <div className="text-sm font-black text-brand-primary">1 420 Foyers</div>
                          <div className="h-1 w-full bg-slate-200 rounded" />
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <span className="text-[8px] uppercase text-slate-400 block tracking-wider">Taux de Recouvrement</span>
                          <div className="text-sm font-black text-emerald-600">92.4 %</div>
                          <div className="h-1 w-full bg-slate-200 rounded" />
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <span className="text-[8px] uppercase text-slate-400 block tracking-wider">Bacs Saturés (&gt;80%)</span>
                          <div className="text-sm font-black text-amber-600">32 Bacs</div>
                          <div className="h-1 w-full bg-slate-200 rounded" />
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <span className="text-[8px] uppercase text-slate-400 block tracking-wider">Camions Actifs</span>
                          <div className="text-sm font-black text-indigo-600">3 / 4 Flotte</div>
                          <div className="h-1 w-full bg-slate-200 rounded" />
                        </div>
                      </div>
                      {/* Chart area in wireframe */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 border border-slate-100 rounded-xl col-span-2 space-y-3">
                          <div className="h-3 w-40 bg-slate-200 rounded" />
                          <div className="h-28 bg-gradient-to-t from-slate-50 to-slate-100 flex items-end justify-between px-4 pb-2">
                            <div className="w-6 bg-slate-200 rounded-t h-1/2" />
                            <div className="w-6 bg-brand-accent rounded-t h-2/3" />
                            <div className="w-6 bg-brand-primary rounded-t h-4/5" />
                            <div className="w-6 bg-slate-250 rounded-t h-1/3" />
                          </div>
                        </div>
                        <div className="p-3 border border-slate-100 rounded-xl col-span-1 space-y-3">
                          <div className="h-3 w-16 bg-slate-200 rounded" />
                          <div className="space-y-2">
                            {[1, 2, 3].map(item => (
                              <div key={item} className="flex justify-between items-center text-[10px] text-slate-500">
                                <span className="h-2 w-12 bg-slate-200 rounded" />
                                <span className="h-2.5 w-6 bg-brand-accent/30 rounded" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'subscribers' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 space-y-4">
                      {/* Header with Search and Actions */}
                      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                        <div>
                          <h5 className="font-extrabold text-xs text-slate-800">Portefeuille Clients de Salubrité</h5>
                          <p className="text-[9px] text-slate-400 font-semibold" >Gestion administrative & livraisons RFID</p>
                        </div>
                        <div className="h-7 w-28 bg-brand-primary rounded-lg" />
                      </div>
                      {/* Filter Row */}
                      <div className="flex gap-2">
                        <div className="h-6 w-20 bg-slate-100 border border-slate-150 rounded-lg" />
                        <div className="h-6 w-20 bg-slate-100 border border-slate-150 rounded-lg" />
                        <div className="h-6 w-20 bg-slate-100 border border-slate-150 rounded-lg" />
                        <div className="h-6 w-32 bg-slate-50 border border-slate-150 rounded-lg flex-1" />
                      </div>
                      {/* Client Table mockup */}
                      <div className="border border-slate-155 rounded-xl overflow-hidden text-[10px]">
                        <div className="bg-slate-50 p-2 border-b border-slate-150 font-bold text-slate-500 flex justify-between">
                          <span className="w-1/4">Référence</span>
                          <span className="w-1/4">Nom</span>
                          <span className="w-1/4">Quartier</span>
                          <span className="w-1/4">État Bac</span>
                        </div>
                        {[1, 2, 3].map(item => (
                          <div key={item} className="p-2.5 border-b border-slate-100 flex justify-between items-center text-slate-650">
                            <span className="w-1/4 font-mono text-brand-primary">#ABO-225-00{item}</span>
                            <span className="w-1/4 font-bold">Koffi Kouamé</span>
                            <span className="w-1/4 text-slate-400">Cocody-Angré</span>
                            <span className="w-1/4 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                              <span>20% (Standard)</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'abonnements' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 space-y-4">
                      <div className="text-center space-y-1 max-w-sm mx-auto">
                        <h5 className="font-extrabold text-xs text-slate-800">Gabarit d'Abonnement Fiscal Municipal</h5>
                        <p className="text-[9px] text-slate-400 font-semibold leading-normal">Classification tarifaire AKPBF indexée sur le volume de stockage (Stripe Inspired)</p>
                      </div>
                      {/* 3 cards row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {[
                          { name: 'Social Standard', price: '3,000 FCFA', vol: 'Bac 240L', desc: 'Retrait 2 fois / semaine' },
                          { name: 'Résidentiel Plus', price: '5,500 FCFA', vol: 'Bac 360L', desc: 'Retrait 3 fois / semaine' },
                          { name: 'Secteur Industriel', price: '15,000 FCFA', vol: '1100L Conteneur', desc: 'Retrait quotidien' }
                        ].map((pl, i) => (
                          <div key={i} className={`p-4 border rounded-2xl flex flex-col justify-between gap-3 text-left ${i === 1 ? 'border-brand-primary bg-emerald-50/5/10 ring-1 ring-brand-accent/20' : 'border-slate-200 bg-slate-50/50'}`}>
                            <div className="space-y-1">
                              <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">{pl.name}</span>
                              <div className="font-black text-slate-800 text-sm mt-0.5">{pl.price}</div>
                              <span className="text-[8px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-brand-primary block w-fit font-semibold">{pl.vol}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-tight">{pl.desc}</p>
                            <div className={`h-6 w-full text-center rounded-lg text-[9px] font-bold flex items-center justify-center cursor-pointer ${i === 1 ? 'bg-brand-primary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                              Sélectionner l'offre
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'paiements' && (
                    <div className="w-full bg-slate-900 rounded-xl p-5 border border-slate-800 text-white space-y-3.5">
                      <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Coins className="h-4 w-4 text-brand-accent" />
                          <span className="font-bold text-xs">Caisse & Passerelle Mobile Money (Wave / Orange)</span>
                        </div>
                        <span className="text-[8px] bg-emerald-500/20 text-brand-accent px-2 py-0.5 rounded font-black">PROD OK</span>
                      </div>
                      {/* Grid containing selected invoice info and gateway select */}
                      <div className="grid grid-cols-3 gap-3 text-[10px]">
                        <div className="p-3 bg-slate-850 rounded-xl space-y-1 border border-zinc-805">
                          <span className="text-slate-400 uppercase text-[7.5px] tracking-wider block">Facture sélectionnée</span>
                          <strong className="text-indigo-400 block font-mono">FAC-2026-614</strong>
                          <span className="text-slate-200 font-medium">Bamba Sidiki</span>
                        </div>
                        <div className="p-3 bg-slate-850 rounded-xl space-y-1 border border-zinc-805">
                          <span className="text-slate-400 uppercase text-[7.5px] tracking-wider block">Montant redevance</span>
                          <strong className="text-brand-accent text-xs block">5 500 FCFA</strong>
                          <span className="text-slate-400">Période: Mai 2026</span>
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-center">
                          <div className="h-6 w-full bg-slate-850 border border-zinc-800 rounded-lg px-2 text-[9px] flex items-center justify-between text-slate-300">
                            <span>Orange Money</span>
                            <span className="text-[8px]">▼</span>
                          </div>
                          <button type="button" className="h-6 w-full bg-brand-accent hover:bg-brand-accent/90 text-brand-primary font-bold rounded-lg text-[9px] cursor-pointer">
                            Valider encaissement
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'factures' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 space-y-4">
                      {/* Table for Registre general des titres de recettes */}
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800 block">Registre Général des Titres de Recettes / Facturer</span>
                        <div className="flex gap-1.5">
                          <div className="h-6 w-20 bg-slate-50 border border-slate-150 rounded" />
                          <div className="h-6 w-20 bg-slate-50 border border-slate-150 rounded" />
                        </div>
                      </div>
                      {/* Factures lines */}
                      <div className="border border-slate-150 rounded-xl overflow-hidden font-mono text-[9px]">
                        <div className="bg-slate-50 p-2 text-slate-500 font-bold flex justify-between border-b border-slate-150">
                          <span className="w-1/5">Numéro</span>
                          <span className="w-1/5">Échéance</span>
                          <span className="w-1/5">Abonné</span>
                          <span className="w-1/5">Redevance</span>
                          <span className="w-1/5 text-right">Statut</span>
                        </div>
                        <div className="p-2 border-b border-slate-100 flex justify-between items-center text-slate-600 font-medium">
                          <span className="w-1/5 font-semibold text-brand-primary">FAC-2026-104</span>
                          <span className="w-1/5">10 Juin 2026</span>
                          <span className="w-1/5 text-slate-850 font-bold font-sans">Sangaré Alassane</span>
                          <span className="w-1/5">3 500 FCFA</span>
                          <span className="w-1/5 text-right"><span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">✓ Payé</span></span>
                        </div>
                        <div className="p-2 border-b border-slate-100 flex justify-between items-center text-slate-600 font-medium">
                          <span className="w-1/5 font-semibold text-brand-primary">FAC-2026-105</span>
                          <span className="w-1/5">10 Juin 2026</span>
                          <span className="w-1/5 text-slate-850 font-bold font-sans">Kouassi Célestine</span>
                          <span className="w-1/5">5 500 FCFA</span>
                          <span className="w-1/5 text-right"><span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">⌛ En attente</span></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'collectes' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800">Planification Géographique des Tournées</span>
                        <div className="h-6 w-20 bg-brand-primary rounded-lg" />
                      </div>
                      {/* Active tour progress checklist in wireframe */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 col-span-1 text-left">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Équipage actif</span>
                          <strong className="text-slate-800 block text-xs">Camion #COL-402</strong>
                          <span className="text-[10px] text-brand-primary font-bold">Tournée Cocody</span>
                        </div>
                        {/* Progressive steps */}
                        <div className="p-3 border border-slate-150 rounded-xl col-span-2 space-y-2 text-left">
                          <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                            <span>Points collectés</span>
                            <span className="text-brand-primary">4 / 7 Foyers (57%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand-primary h-full w-[57%]" />
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-medium">
                            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                            <span>Prochain vidage : Belles Rives #ABO-394</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'agents' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 space-y-3">
                      <div className="pb-1 border-b border-slate-100 text-left">
                        <h5 className="font-extrabold text-xs text-slate-800">Surveillance des Équipages de Terrain</h5>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Disponibilité des éboueurs et conducteurs d'engins municipaux</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center">
                            <h6 className="font-bold text-xs text-slate-800">Kouamé N'Guessan</h6>
                            <span className="w-2 h-2 rounded-full bg-brand-primary" />
                          </div>
                          <p className="text-[9px] text-slate-500 font-mono">Conducteur compacteur • Plaque: D-2051-CI</p>
                          <div className="text-[9px] text-slate-400">Total collecté : <strong>5 400 Kg</strong></div>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center">
                            <h6 className="font-bold text-xs text-slate-800">Coulibaly Moussa</h6>
                            <span className="w-2 h-2 rounded-full bg-slate-350" />
                          </div>
                          <p className="text-[9px] text-slate-500 font-mono">Chauffeur Benne • Plaque: E-0024-CI</p>
                          <div className="text-[9px] text-slate-400">Total collecté : <strong>3 200 Kg</strong></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'cartographie' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col h-[280px]">
                      {/* Map top controller */}
                      <div className="bg-slate-50 p-2 flex justify-between items-center border-b border-slate-150 text-[10px]">
                        <span className="font-bold text-slate-700">SIG PostGIS Interactive Projection (Cocody)</span>
                        <div className="flex gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-brand-primary text-white font-bold text-[8px]">EPSG:4326</span>
                        </div>
                      </div>
                      {/* Grid representation */}
                      <div className="flex-1 bg-slate-900 relative p-4 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10 flex gap-4 flex-wrap">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => <div key={n} className="border border-white w-20 h-20" />)}
                        </div>
                        {/* Geometric shape representation */}
                        <svg viewBox="0 0 100 100" className="w-40 h-40 relative z-10 text-brand-accent animate-pulse">
                          <circle cx="50" cy="50" r="1.5" fill="#4CAF50" />
                          <circle cx="50" cy="50" r="12" fill="none" stroke="#4CAF50" strokeWidth="0.5" strokeDasharray="1 1" />
                          <path d="M 12 80 L 50 50 L 80 15" stroke="#4CAF50" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 2" fill="none" />
                          <rect x="10" y="75" width="4" height="4" rx="1" fill="#1B5E20" />
                          <rect x="48" y="48" width="4" height="4" rx="1" fill="#1e293b" stroke="#ffffff" strokeWidth="0.5" />
                          <rect x="78" y="13" width="4" height="4" rx="1" fill="#ff9900" />
                        </svg>
                        <div className="absolute bottom-2 left-2 p-2 bg-slate-950/80 border border-slate-800 text-[8px] text-slate-300 rounded font-bold font-mono">
                          Latitude: 5.3458 • Longitude: -3.9842
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'rapports' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                          <h5 className="font-extrabold text-xs text-slate-800">Indicateurs de Performance (SaaS Rapports)</h5>
                          <p className="text-[9px] text-slate-400 font-semibold" >Rapport de conformité opérationnelle et recouvrements</p>
                        </div>
                        <div className="h-6 w-24 bg-slate-150 border border-slate-200 rounded flex items-center justify-center text-[9px] font-bold cursor-pointer">
                          Exporter en CSV
                        </div>
                      </div>
                      {/* Metric widgets row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-left">
                          <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">Recettes Encaissées</span>
                          <span className="text-sm font-black text-brand-primary">4 970 000 FCFA</span>
                          <span className="text-[8px] text-emerald-600 font-bold block">✓ 100% Vérifié</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-left">
                          <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">Masse Ordures (Tonnes)</span>
                          <span className="text-sm font-black text-slate-800">124.5 Tonnes</span>
                          <span className="text-[8px] text-slate-400 font-medium block">Période : Mai 2026</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-left">
                          <span className="text-[8px] text-slate-400 block uppercase font-bold tracking-wider">Foyers Servis</span>
                          <span className="text-sm font-black text-slate-800">98.5% Taux Service</span>
                          <span className="text-[8px] text-brand-primary font-bold block">Cocody/Yopougon/Marcory</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'parametres' && (
                    <div className="w-full bg-white rounded-xl border border-slate-200/70 shadow-sm p-4 space-y-4">
                      <div className="pb-2 border-b border-slate-100 flex justify-between items-center">
                        <span className="font-extrabold text-xs text-slate-800">Configuration SaaS & Métriques Multi-Tenant</span>
                        <div className="h-6 w-24 bg-brand-primary rounded-lg text-[9px] font-bold flex items-center justify-center text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-left text-[10px] text-slate-600">
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <div className="font-extrabold text-slate-850">Variables du Système Municipal</div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-400 block">Période Fiscale Active</label>
                            <input type="text" disabled defaultValue="Mai 2026" className="w-full bg-white border border-slate-200 text-[9px] p-1 rounded" />
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                          <div className="font-extrabold text-slate-850">Clés API Secrètes (Production Gateway)</div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-400 block">Bearer Token JWT</label>
                            <input type="password" disabled defaultValue="••••••••••••••••••••••••••••••••" className="w-full bg-white border border-slate-200 text-[9px] p-1 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* UX & UI Specs details */}
                <div className="p-6 space-y-5 text-left text-slate-700 bg-white">
                  
                  {/* Dynamic description of the selected item */}
                  {selectedScreen === 'dashboard' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          La grille est organisée en Bento Grid asymétrique (12 colonnes standard combinées en lignes fluides). Elle respecte les formats de cards épurées inspirés par linear.app. Les marges extérieures sont de <code>p-6 md:p-8</code> avec des gouttières de <code>gap-5</code> pour optimiser la respiration et le contraste naturel.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>4 Cards KPIs de synthèse à bords arrondis de <code>rounded-2xl</code> et micro-fond dégradé léger.</li>
                          <li>Graphiques synchronisés Recharts de coloris <strong>#1B5E20</strong> et <strong>#4CAF50</strong>.</li>
                          <li>Flux vertical de journalisation asynchrone des alertes de voirie RFID.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Les raccourcis contextuels interactifs (ex: Bouton d'optimisation instantané) redirigent intelligemment l'utilisateur sur d'autres onglets de manière asynchrone. <br />
                          <strong>Icônes :</strong> <code>LayoutDashboard</code>, <code>ArrowUpRight</code>, <code>TrendingUp</code>, <code>Users</code>, <code>Activity</code>. <br />
                          <strong>UX Core :</strong> Temps de chargement ultra-court grâce au calcul pré-indexé en cache des données agrégées. Les états vides de graphs restituent une trame neutre animée pour éviter le sursaut visuel.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'subscribers' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Mise en page de type <strong>"Registry Ledger" (Style Stripe)</strong> avec barre de contrôle supérieure fluide. Le tableau des abonnés tire parti du défilement horizontal résilient (<code>overflow-x-auto</code>) pour préserver une lisibilité maximale sur écrans mobiles.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Sélecteur d'arrondissement déroulant pour Cocody, Yopougon, Marcory.</li>
                          <li>Bouton d'appel à l'action contrasté <code>bg-brand-primary hover:bg-brand-primary/90</code> de création rapide de client.</li>
                          <li>Pilules de taux de remplissage en couleur d'accent vert ou orange pour déceler le trop-plein en un coup d'œil.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Pagination asynchrone par curseur. Filtres cumulatifs autorisant le tri instantané sans recharger la page. <br />
                          <strong>Icônes :</strong> <code>Users</code>, <code>Search</code>, <code>Trash2</code>, <code>UserPlus</code>, <code>SlidersHorizontal</code>. <br />
                          <strong>UX Core :</strong> Saisie de recherche assistée par filtre d'expression régulière (Regex debounced à 150ms) pour une réactivité optimale du portefeuille des abonnés.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'abonnements' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Présentation de type <strong>pricing plans</strong> à 3 colonnes symétriques sur ordinateur, qui s'empilent naturellement sur mobile (<code>grid-cols-1 sm:grid-cols-3</code>). La carte médiane "Résidentiel Plus" est rehaussée par rapport aux autres pour désigner commercialement l'offre d'adoption recommandée.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Conteneurs à bordure fine <code>border-slate-200</code> avec fond d'accentuation ultra-léger.</li>
                          <li>Badges de type de bac associé (ex: Bac Standard 240L, Bac Grand 360L, Conteneur 1100L).</li>
                          <li>Pilules de prix à forte emphase typographique en noirs obscurs très contrastés.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Sélection immédiate d'un abonnement lors de l'enregistrement du client en tiroir coulissant. <br />
                          <strong>Icônes :</strong> <code>Sparkles</code>, <code>Check</code>, <code>Award</code>, <code>Info</code>. <br />
                          <strong>UX Core :</strong> Formules et descriptifs rédigés en langage humble et accessible. Boutons actifs simulés offrant des transitions de survol de type scale-down tactile réconfortant (<code>active:scale-95</code>).
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'paiements' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Un panneau d'exploitation sombre en bas de page ou en surimpression à haut contraste (<code>bg-slate-900</code>) pour séparer l'action comptable critique de guichet de la simple consultation. Grille à 3 colonnes pour structurer les métriques d'imputation.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Sélecteur de passerelle pour Mobile Money d'Afrique de l'Ouest (Wave, Orange Money) et transaction espèces.</li>
                          <li>Indicateur de montant en double-taille de police, d'une tonalité apaisante et de haute lisibilité.</li>
                          <li>Contrôle de validation vert bouton <code>bg-emerald-500 hover:bg-emerald-600</code> sécurisé.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Fermeture par croix d'arrêt asynchrone et raccourcis d'imputation de factures directes. <br />
                          <strong>Icônes :</strong> <code>Coins</code>, <code>Check</code>, <code>X</code>, <code>Smartphone</code>. <br />
                          <strong>UX Core :</strong> Simulation de passerelle Mobile Money réaliste pour l'opérateur avec animation de chargement et retours d'émissions de décharges par SMS et logs de sécurité d'audit correspondants.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'factures' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Registre de factures conçu sous forme de <strong>grand livre de comptes (Ledger)</strong> inspiré du minimalisme pragmatique d'Odoo et Notion. Alignements précis et marges resserrées pour condenser l'information sans perte de lisibilité.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Période de facturation active matérialisée par des en-têtes condensés à haute valeur d'appel.</li>
                          <li>Badges de statuts bicolores de grande netteté : Vert (Payé), Orange (En attente), Rouge (Arriéré).</li>
                          <li>Garniture comptable ordonnée avec colonnes de libellés monétaires (FCFA).</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Recherche croisée par numéro de facture ou nom d'adhérent. Tri multicritères par date d'échéance. <br />
                          <strong>Icônes :</strong> <code>FileCode</code>, <code>Calendar</code>, <code>Coins</code>, <code>Search</code>. <br />
                          <strong>UX Core :</strong> Intégration d'un système de génération groupée des factures de redevance pour tous les adhérents actifs en un clic, accélérant le travail des directions financières municipales.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'collectes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Conception ergonomique articulée autour de la <strong>planification opérationnelle</strong>. Divise l'espace en une zone de suivi d'avancement des compacteurs et un registre des points d'apports géolocalisés.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Barres de progression horizontales pour restituer en temps réel l'avancement métrique de la tournée.</li>
                          <li>Puces d'évaluation de l'état RFID de vidage des bacs du secteur attribué.</li>
                          <li>Cartographie interactive ou simulation asynchrone réactive du trajet des bennes.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Boutons d'affectation immédiate d'un chauffeur benne à un itinéraire à l'état de brouillon. <br />
                          <strong>Icônes :</strong> <code>Play</code>, <code>Navigation</code>, <code>CheckCircle2</code>, <code>Truck</code>. <br />
                          <strong>UX Core :</strong> Simulation dynamique du camion de ramassage avec mises à jour de l'état de vidage à 0% et cumul du tonnage collecté en direct, éliminant les lenteurs d'affichage du parc.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'agents' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Structure en <strong>grille de cartes de profils (Linear inspired)</strong>, optimisée pour le contrôle opérationnel rapide. Les cartes utilisent une structure compacte pour compiler l'état d'activité, le véhicule mobilisé et la performance collectée d'un agent.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Badges d'état avec couleur sémantique : Vert (En tournée), Jaune (Inactif), Gris (Hors-ligne).</li>
                          <li>Blocs de saisie simplifiée des tonnage collecté en bout de ligne.</li>
                          <li>Boutons discrets de licenciement ou d'affectation de camions.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Formulaire rapide d'incorporation de chauffeur par tiroir superposé fluide. <br />
                          <strong>Icônes :</strong> <code>Award</code>, <code>Phone</code>, <code>Settings</code>, <code>Truck</code>. <br />
                          <strong>UX Core :</strong> Tonnage global mis de côté de manière à mesurer individuellement la productivité de chaque chauffeur de camion compacteur AKPBF.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'cartographie' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          L'interface est structurée en <strong>canevas plein écran (Notion inspired)</strong> et contrôles de projection géodésique superposés. Un quadrillage mathématique restitue le positionnement PostGIS de Cocody en Afrique équatoriale.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Zone interactive de rendu SVG/Canvas gérant le tracé vectoriel dynamique des chemins de collecte optimums.</li>
                          <li>Lecteur de coordonnées géographiques instantané en pied de carte pour l'audit carto.</li>
                          <li>Puces d'identification des clusters de bacs à ordures critiques en surcharge élevée.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Zoom vectoriel et centrage de caméra cartographique sur la position de l'équipage. <br />
                          <strong>Icônes :</strong> <code>MapPin</code>, <code>Map</code>, <code>Navigation</code>, <code>Compass</code>. <br />
                          <strong>UX Core :</strong> Heuristique d'optimisation (VRP) résolvant le trajet le plus court entre les points critiques saturés. Moteur de rendu optimisé gérant l'antialiasing des chemins vectoriels tracés par le moteur du SIG.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'rapports' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Tableau de bord de <strong>Business Intelligence (BI)</strong> structuré pour l'audit et l'inspection de conformité. Disposition en grille de cartes de synthèse compactes complémentaires du tableau de répartition périodique.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Filtres de dates par trimestre ou années fiscales pour affiner l'échantillonnage de redevance.</li>
                          <li>Boutons contrastés d'exportations aux formats reconnus (CSV, xlsx standard) de Stripe-like.</li>
                          <li>Surcharges de KPIs illustrant le bilan d'exploitation et la propreté métropolitaine consolidée.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Filtres généraux reliés à la base PostgreSQL de production d'AKPBF. <br />
                          <strong>Icônes :</strong> <code>Activity</code>, <code>FileText</code>, <code>FolderGit2</code>, <code>Download</code>. <br />
                          <strong>UX Core :</strong> Exportation asynchrone sécurisée. Les fichiers volumineux sont préparés en tâche de fond sur RabbitMQ avec alertes de téléchargement en cloche pour ne jamais figer la plateforme.
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedScreen === 'parametres' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Structure Visuelle & Grille</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          Rubrique d'intégration technique et d'administration générale (Stripe/Linear inspired). Un agencement clair sépare les variables administratives (ex: période de recouvrement active) des clés APIs et webhooks de raccord.
                        </p>

                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit pt-2">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Composants UI</span>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11.5px]">
                          <li>Formulaires d'options à double colonne avec bordures et ombres fines <code>shadow-xs</code>.</li>
                          <li>Champs d'introductions de secrets masqués par défaut d'une protection anti-espion.</li>
                          <li>Badges indiquant l'interconnexion asynchrone avec PostgreSQL et les API Mobile Money de test.</li>
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-100 pb-1 w-fit">
                          <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
                          <span>Navigation, Icônes & Expérience</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Navigation :</strong> Onglets de sous-sélections des webhooks ou profils de sécurité. <br />
                          <strong>Icônes :</strong> <code>Sliders</code>, <code>ShieldCheck</code>, <code>Key</code>, <code>Gear</code>. <br />
                          <strong>UX Core :</strong> Masquage automatique des secrets de production sensibles, géré côté serveur sans transit en texte brut dans l'iFrame, assurant une protection RGPD sans faille.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        </div>
      )}
      {activeTab === 'architecture' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {/* System topology */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-indigo-550" />
                1. Architecture Systémique Globale (SaaS Multi-Tenant)
              </h3>

              <div className="text-xs text-slate-650 leading-relaxed space-y-3">
                <p>
                  Pour répondre aux impératifs d'un logiciel vendu à des municipalités de grande envergure (ex: Abidjan, Yamoussoukro, Cotonou), le système AKPBF est conçu sur une **architecture orientée services (Microservices prêtes à l'échelle)** qui dissocie les responsabilités logistiques, financières, cartographiques et d'administration générale.
                </p>

                {/* SVG Microservices Flow diagram */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-205 flex justify-center py-6">
                  <svg viewBox="0 0 600 240" className="w-full max-w-lg">
                    <rect x="10" y="10" width="120" height="40" rx="5" fill="#f8fafc" stroke="#64748b" strokeWidth="2"/>
                    <text x="70" y="34" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="bold">Clients (Web & Mobil)</text>

                    <path d="M 70 50 L 70 80" stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />

                    <rect x="10" y="80" width="120" height="40" rx="5" fill="#312e81" stroke="#4338ca" strokeWidth="2"/>
                    <text x="70" y="104" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">API Gateway + JWT</text>

                    {/* Routing Arrows splits */}
                    <path d="M 130 100 L 220 50" stroke="#64748b" strokeWidth="2" fill="none" />
                    <path d="M 130 100 L 220 110" stroke="#64748b" strokeWidth="2" fill="none" />
                    <path d="M 130 100 L 220 170" stroke="#64748b" strokeWidth="2" fill="none" />

                    {/* Microservices Boxes */}
                    <rect x="220" y="30" width="150" height="35" rx="5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5"/>
                    <text x="295" y="52" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="bold">Svc Facturation & Caisse</text>

                    <rect x="220" y="92" width="150" height="35" rx="5" fill="#ecfdf5" stroke="#34d399" strokeWidth="1.5"/>
                    <text x="295" y="114" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="bold">Svc SIG & Optimisation Tournées</text>

                    <rect x="220" y="152" width="150" height="35" rx="5" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.5"/>
                    <text x="295" y="174" textAnchor="middle" fill="#6d28d9" fontSize="9" fontWeight="bold">Svc Abonnés & Contrats</text>

                    {/* DB line connections */}
                    <path d="M 370 47 L 450 100" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 370 110 L 450 110" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 370 170 L 450 120" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Final Database box */}
                    <rect x="450" y="80" width="130" height="60" rx="8" fill="#1e293b" stroke="#0f172a" strokeWidth="2"/>
                    <text x="515" y="110" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">PostgreSQL + PostGIS</text>
                    <text x="515" y="125" textAnchor="middle" fill="#64748b" fontSize="8">(Spatial Index Cluster)</text>
                  </svg>
                </div>

                <ul className="list-disc pl-5 space-y-2 mt-3 text-slate-600">
                  <li><strong>L'API Gateway (Kong/Nginx) :</strong> Assure la terminaison SSL, limite le taux de requêtes (Rate-limiting) et filtre les requêtes via validation de jetons JWT.</li>
                  <li><strong>Service SIG & Optimisation (PostGIS) :</strong> Utilise une base de données de projection géographique coordonnée (EPSG:4326) avec PostGIS pour résoudre le problème du voyageur de commerce (VRP) par heuristiques.</li>
                  <li><strong>Moteur d'expédition asynchrone (RabbitMQ + Redis) :</strong> Soulage les requêtes clients en dépêchant les files d'attente d'envois automatiques de SMS (via passerelle Orange Money API / Twilio) et de facturation globale en tâche de fond.</li>
                </ul>
              </div>
            </div>

            {/* Complete UML Class Diagram description */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Network className="h-4.5 w-4.5 text-indigo-550" />
                2. Spécification UML Métier & Séquence
              </h3>
              
              <div className="text-xs text-slate-650 leading-relaxed space-y-3">
                <p>
                  Le diagramme d'états-transitions de la salubrité municipale intègre les capteurs IoT des bacs comme déclencheurs d'itinéraires et d'alerte de contentieux avant facturation.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-205 flex justify-center">
                  <svg viewBox="0 0 600 220" className="w-full max-w-lg">
                    {/* States circles */}
                    <rect x="25" y="80" width="90" height="40" rx="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="70" y="104" textAnchor="middle" fill="#334155" fontSize="8" fontWeight="bold">1. Enrôlement SIG</text>

                    <path d="M 115 100 L 165 100" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrow)" />

                    <rect x="165" y="80" width="100" height="40" rx="5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="215" y="104" textAnchor="middle" fill="#0369a1" fontSize="8" fontWeight="bold">2. Cycle Facture</text>

                    <path d="M 265 100 L 315 100" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrow)" />

                    <rect x="315" y="80" width="100" height="40" rx="5" fill="#ecfdf5" stroke="#34d399" strokeWidth="1.5" />
                    <text x="365" y="104" textAnchor="middle" fill="#047857" fontSize="8" fontWeight="bold">3. Règlement Valide</text>

                    <path d="M 415 100 L 465 100" stroke="#64748b" strokeWidth="1.5" markerEnd="url(#arrow)" />

                    <rect x="465" y="80" width="105" height="40" rx="5" fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" />
                    <text x="517" y="104" textAnchor="middle" fill="#ea580c" fontSize="8" fontWeight="bold">4. Tournée RFID</text>

                    {/* Failure loop */}
                    <path d="M 215 120 L 215 180 L 365 180 L 365 120" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3" fill="none" markerEnd="url(#arrow)" />
                    <text x="290" y="175" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">Relances automatiques si impayé &gt; Échéance</text>
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* Right Side Card: Senior Architecture Summary Stats */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
                <h4 className="font-bold text-xs uppercase tracking-wider">Plan de Sécurisation Avancé</h4>
              </div>

              <div className="space-y-4 text-xs leading-relaxed">
                <div className="space-y-1">
                  <span className="font-bold text-slate-350 block">HTTPS & SSL Intégral :</span>
                  <p className="text-slate-400 text-[10.5px]">En-têtes HSTS requis, certificats renouvelés Let's Encrypt de niveau Wildcard.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-350 block">Clapiers API / CORS Strict :</span>
                  <p className="text-slate-400 text-[10.5px]">Restriction CORS d'origines vers les sous-domaines officiels d'AKPBF uniquement.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-350 block">Hachage des secrets d'Auth :</span>
                  <p className="text-slate-400 text-[10.5px]">Algorithme Argon2id résistant aux attaques par force brute pour les mots de passe agents.</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-350 block">Données postales cryptées (GDPR) :</span>
                  <p className="text-slate-400 text-[10.5px]">Anonymisation des courriels et cartes de paiement en conformité avec la réglementation locale.</p>
                </div>
              </div>
            </div>

            {/* Cloud scaling */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Dimensionnement SaaS Municipal</h4>
              
              <div className="space-y-2 text-slate-650 text-xs leading-relaxed">
                <p>
                  Cette topologie supporte simultanément jusqu'à <strong>50 municipalités de 100 000 foyers</strong>, moyennant un partitionnement par clé d'abonné client (Sharding SQL).
                </p>
                <div className="p-2.5 bg-indigo-50/50 rounded-lg text-[10px] text-indigo-805 font-mono">
                  Seuil de cache Redis : 92.4% de Hits estimé sur la géolocalisation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: POSTGRES RELATIONAL DATABASE DDL */}
      {activeTab === 'database' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {/* Relational details text */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-indigo-550" />
                  Schéma de Base de Données Relational (PostgreSQL / PostGIS)
                </h3>
              </div>

              <p className="text-xs text-slate-650 leading-relaxed">
                Voici le dictionnaire de données complet des tables constituant le ciment logique de la plateforme <strong>AKPBF</strong>. Les colonnes géographiques tirent parti de l'extension spatiale <code>PostGIS</code> pour indexer efficacement les coordonnées par arbres R-Tree.
              </p>

              {/* Collapsible SQLite/Postgres DDL tables dictionary */}
              <div className="space-y-4.5">
                {DB_TABLES.map(table => (
                  <div key={table.name} className="border border-slate-150 rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-50 p-2.5 flex items-center justify-between border-b border-slate-150">
                      <span className="font-mono font-bold text-slate-800 text-xs">CREATE TABLE {table.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-slate-400 italic font-semibold">{table.description}</span>
                    </div>

                    <div className="overflow-x-auto text-left">
                      <table className="w-full text-xs font-sans text-slate-600">
                        <thead className="bg-slate-100/50 border-b border-slate-150 font-bold text-slate-500 uppercase text-[9px]">
                          <tr>
                            <th className="p-2.5">Colonne</th>
                            <th className="p-2.5">Type de données</th>
                            <th className="p-2.5">Réglementation & Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {table.columns.map(col => (
                            <tr key={col.name} className="hover:bg-slate-50/20">
                              <td className="p-2.5 font-mono text-indigo-700 font-semibold">{col.name}</td>
                              <td className="p-2.5 font-mono text-[10.5px] text-slate-500">{col.type}</td>
                              <td className="p-2.5 text-slate-600">{col.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SQL query copy tools on the Right panel */}
          <div className="lg:col-span-1 space-y-4 font-sans">
            <div className="bg-slate-950 text-slate-300 rounded-xl p-4.5 border border-slate-900 space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Terminal className="h-4.5 w-4.5" />
                  <span className="font-extrabold text-[11px] uppercase tracking-wider">PostgreSQL DDL & GIS Script (Copy)</span>
                </div>
                <button 
                  onClick={() => handleCopyCode(
                    `-- PostgreSQL Pro Database Schema - Platforme AKPBF\n` +
                    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n` +
                    `CREATE EXTENSION IF NOT EXISTS "postgis";\n\n` +
                    `-- 1. MODULE ZONES\n` +
                    `CREATE TABLE tb_zones (\n` +
                    `    zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    name VARCHAR(100) UNIQUE NOT NULL CONSTRAINT chk_zone_name CHECK (length(name) >= 3),\n` +
                    `    commune VARCHAR(100) NOT NULL,\n` +
                    `    geom_polygon GEOMETRY(Polygon, 4326) NOT NULL,\n` +
                    `    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n` +
                    `);\n` +
                    `CREATE INDEX idx_zones_geom_polygon ON tb_zones USING GIST (geom_polygon);\n\n` +
                    `-- 2. MODULE UTILISATEURS (RBAC)\n` +
                    `CREATE TABLE tb_users (\n` +
                    `    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    email VARCHAR(150) UNIQUE NOT NULL,\n` +
                    `    phone VARCHAR(20) UNIQUE NOT NULL,\n` +
                    `    password_hash VARCHAR(255) NOT NULL,\n` +
                    `    full_name VARCHAR(150) NOT NULL,\n` +
                    `    role VARCHAR(50) NOT NULL CONSTRAINT chk_user_role CHECK (role IN ('ADMIN_MUN', 'CONTROLEUR_CO', 'CHAUFFEUR', 'COLLECTEUR', 'CITOYEN')),\n` +
                    `    is_active BOOLEAN NOT NULL DEFAULT TRUE,\n` +
                    `    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n` +
                    `);\n` +
                    `CREATE INDEX idx_users_role ON tb_users(role) WHERE is_active = TRUE;\n\n` +
                    `-- 3. MODULE ABONNEMENTS\n` +
                    `CREATE TABLE tb_subscription_plans (\n` +
                    `    plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    name VARCHAR(100) UNIQUE NOT NULL,\n` +
                    `    monthly_price_fcfa NUMERIC(12,2) NOT NULL CONSTRAINT chk_monthly_price CHECK (monthly_price_fcfa >= 0),\n` +
                    `    bin_volume_liters INTEGER NOT NULL CONSTRAINT chk_bin_volume CHECK (bin_volume_liters > 0),\n` +
                    `    pickups_per_week INTEGER NOT NULL CONSTRAINT chk_pickups_per_week CHECK (pickups_per_week > 0),\n` +
                    `    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n` +
                    `);\n\n` +
                    `-- 4. MODULE CLIENTS (ABONNES)\n` +
                    `CREATE TABLE tb_subscribers (\n` +
                    `    subscriber_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    user_id UUID REFERENCES tb_users(user_id) ON DELETE SET NULL,\n` +
                    `    zone_id UUID REFERENCES tb_zones(zone_id) NOT NULL,\n` +
                    `    plan_id UUID REFERENCES tb_subscription_plans(plan_id) NOT NULL,\n` +
                    `    fullname VARCHAR(200) NOT NULL,\n` +
                    `    phone VARCHAR(20) NOT NULL,\n` +
                    `    address_street VARCHAR(255) NOT NULL,\n` +
                    `    geom_point GEOMETRY(Point, 4326) NOT NULL,\n` +
                    `    bin_rfid_uid VARCHAR(100) UNIQUE NOT NULL,\n` +
                    `    bin_status VARCHAR(30) DEFAULT 'NORMAL' CONSTRAINT chk_bin_status CHECK (bin_status IN ('NORMAL', 'EMPTY', 'OVERFLOW', 'DAMAGE')),\n` +
                    `    is_active BOOLEAN NOT NULL DEFAULT TRUE,\n` +
                    `    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n` +
                    `);\n` +
                    `CREATE INDEX idx_subscribers_geom_point ON tb_subscribers USING GIST (geom_point);\n` +
                    `CREATE INDEX idx_subscribers_zone ON tb_subscribers (zone_id);\n` +
                    `CREATE INDEX idx_subscribers_rfid ON tb_subscribers (bin_rfid_uid);\n\n` +
                    `-- 5. MODULE CAMIONS\n` +
                    `CREATE TABLE tb_trucks (\n` +
                    `    truck_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    license_plate VARCHAR(30) UNIQUE NOT NULL,\n` +
                    `    model_brand VARCHAR(100) NOT NULL,\n` +
                    `    capacity_kg NUMERIC(10,2) NOT NULL CONSTRAINT chk_truck_capacity CHECK (capacity_kg > 0),\n` +
                    `    current_status VARCHAR(30) DEFAULT 'ACTIVE' CONSTRAINT chk_truck_status CHECK (current_status IN ('ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE')),\n` +
                    `    purchased_date DATE\n` +
                    `);\n\n` +
                    `-- 6. MODULE AGENTS\n` +
                    `CREATE TABLE tb_agents (\n` +
                    `    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    user_id UUID UNIQUE REFERENCES tb_users(user_id) ON DELETE CASCADE NOT NULL,\n` +
                    `    job_title VARCHAR(100) NOT NULL CONSTRAINT chk_agent_job CHECK (job_title IN ('DRIVER', 'COLLECTOR')),\n` +
                    `    driving_license_num VARCHAR(50) UNIQUE,\n` +
                    `    is_available BOOLEAN NOT NULL DEFAULT TRUE,\n` +
                    `    hired_date DATE NOT NULL\n` +
                    `);\n\n` +
                    `-- 7. MODULE COLLECTES (TOURNÉES)\n` +
                    `CREATE TABLE tb_collector_routes (\n` +
                    `    route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    zone_id UUID REFERENCES tb_zones(zone_id) NOT NULL,\n` +
                    `    truck_id UUID REFERENCES tb_trucks(truck_id) NOT NULL,\n` +
                    `    primary_driver_id UUID REFERENCES tb_agents(agent_id) NOT NULL,\n` +
                    `    scheduled_start_time TIMESTAMPTZ NOT NULL,\n` +
                    `    actual_start_time TIMESTAMPTZ,\n` +
                    `    actual_end_time TIMESTAMPTZ,\n` +
                    `    total_tonnage_collected NUMERIC(10,3) DEFAULT 0,\n` +
                    `    status VARCHAR(30) DEFAULT 'PENDING' CONSTRAINT chk_route_status CHECK (status IN ('PENDING', 'ON_GOING', 'COMPLETED', 'CANCELLED')),\n` +
                    `    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n` +
                    `);\n` +
                    `CREATE INDEX idx_routes_status_date ON tb_collector_routes (status, scheduled_start_time);\n\n` +
                    `-- 8. MODULE COLLECTES (PASSAGES/TRACE)\n` +
                    `CREATE TABLE tb_collection_logs (\n` +
                    `    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    route_id UUID REFERENCES tb_collector_routes(route_id) ON DELETE CASCADE NOT NULL,\n` +
                    `    subscriber_id UUID REFERENCES tb_subscribers(subscriber_id) NOT NULL,\n` +
                    `    scanned_rfid VARCHAR(100) NOT NULL,\n` +
                    `    collection_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n` +
                    `    estimated_volume_liters INTEGER CONSTRAINT chk_est_volume CHECK (estimated_volume_liters >= 0),\n` +
                    `    agent_notes TEXT\n` +
                    `);\n` +
                    `CREATE INDEX idx_coll_logs_composite ON tb_collection_logs(route_id, subscriber_id);\n` +
                    `CREATE INDEX idx_coll_logs_time ON tb_collection_logs(collection_time DESC);\n\n` +
                    `-- 9. MODULE FACTURES\n` +
                    `CREATE TABLE tb_invoices (\n` +
                    `    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    invoice_code VARCHAR(50) UNIQUE NOT NULL,\n` +
                    `    subscriber_id UUID REFERENCES tb_subscribers(subscriber_id) NOT NULL,\n` +
                    `    billing_period VARCHAR(7) NOT NULL,\n` +
                    `    amount_due_fcfa NUMERIC(12,2) NOT NULL CONSTRAINT chk_invoice_amount CHECK (amount_due_fcfa > 0),\n` +
                    `    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,\n` +
                    `    due_date DATE NOT NULL,\n` +
                    `    payment_status VARCHAR(30) DEFAULT 'PENDING' CONSTRAINT chk_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'OVERDUE', 'WRITE_OFF')),\n` +
                    `    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,\n` +
                    `    CONSTRAINT ukey_subscriber_period UNIQUE(subscriber_id, billing_period)\n` +
                    `);\n` +
                    `CREATE INDEX idx_invoices_search ON tb_invoices(subscriber_id, billing_period, payment_status);\n\n` +
                    `-- 10. MODULE PAIEMENTS\n` +
                    `CREATE TABLE tb_payments (\n` +
                    `    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    invoice_id UUID REFERENCES tb_invoices(invoice_id) NOT NULL,\n` +
                    `    amount_paid_fcfa NUMERIC(12,2) NOT NULL CONSTRAINT chk_pay_amount CHECK (amount_paid_fcfa > 0),\n` +
                    `    payment_method VARCHAR(50) NOT NULL CONSTRAINT chk_pay_method CHECK (payment_method IN ('WAVE', 'ORANGE_MONEY', 'MTN_MOMO', 'CASH_MUNICIPAL')),\n` +
                    `    carrier_tx_id VARCHAR(100) UNIQUE NOT NULL,\n` +
                    `    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP\n` +
                    `);\n` +
                    `CREATE INDEX idx_payments_invoice ON tb_payments(invoice_id);\n\n` +
                    `-- 11. MODULE NOTIFICATIONS\n` +
                    `CREATE TABLE tb_notifications (\n` +
                    `    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    recipient_phone VARCHAR(20) NOT NULL,\n` +
                    `    type VARCHAR(30) NOT NULL,\n` +
                    `    message_body TEXT NOT NULL,\n` +
                    `    send_status VARCHAR(20) DEFAULT 'SENT',\n` +
                    `    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,\n` +
                    `    retry_count INTEGER DEFAULT 0\n` +
                    `);\n` +
                    `CREATE INDEX idx_notifications_status ON tb_notifications(send_status, sent_at);\n\n` +
                    `-- 12. HISTORIQUE MODULE (AUDIT)\n` +
                    `CREATE TABLE tb_audit_history (\n` +
                    `    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n` +
                    `    operator_user_id UUID REFERENCES tb_users(user_id) ON DELETE SET NULL,\n` +
                    `    action_type VARCHAR(50) NOT NULL,\n` +
                    `    table_name VARCHAR(50) NOT NULL,\n` +
                    `    record_id UUID NOT NULL,\n` +
                    `    old_state JSONB,\n` +
                    `    new_state JSONB,\n` +
                    `    ip_address INET,\n` +
                    `    logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP\n` +
                    `);\n` +
                    `CREATE INDEX idx_audit_table_record ON tb_audit_history(table_name, record_id);\n` +
                    `CREATE INDEX idx_audit_logged_at ON tb_audit_history(logged_at DESC);`
                  )}
                  className="text-slate-400 hover:text-white transition duration-150 active:scale-95 cursor-pointer p-1"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-450" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="space-y-1 text-slate-400">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-white">PostgreSQL & PostGIS Spécifications</p>
                <p className="text-[10.5px] leading-relaxed">
                  Cette base de données relie <strong>12 tables SQL</strong>. Elle gère la géolocalisation des bacs, la facturation mensuelle, et est optimisée pour des dizaines de milliers d'abonnés grâce à l'indexation spatiale <strong>GIST</strong>, des index partiels sur rôles actifs et des index temporels de traçabilité.
                </p>
              </div>

              <pre className="flex-1 bg-slate-900 p-3 rounded-lg text-[9.5px] font-mono text-slate-200 overflow-x-auto leading-relaxed border border-slate-800/80">
{`-- 1. Indexation PostGIS Spatiale (R-Tree)
CREATE INDEX idx_sub_geom 
  ON tb_subscribers USING GIST(geom_point);

-- 2. Index partiel (Gains RAM & CPU)
CREATE INDEX idx_users_active_role 
  ON tb_users (role) WHERE is_active = TRUE;

-- 3. Requête de proximité d'un camion
-- recherche des bacs pleins (< 5km)
SELECT subscriber_id, fullname,
  ST_Distance(geom_point, ST_MakePoint(-3.98, 5.35)::geography) AS distance_metres
FROM tb_subscribers
WHERE bin_status = 'OVERFLOW'
  AND ST_DWithin(geom_point, ST_MakePoint(-3.98, 5.35)::geography, 5000)
ORDER BY distance_metres ASC;

-- 4. Contraintes d'intégrité strictes
ALTER TABLE tb_invoices 
  ADD CONSTRAINT ukey_subscriber_period 
  UNIQUE(subscriber_id, billing_period);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 3: API PLAYGROUND INTERACTIVE SIMULATOR */}
      {activeTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel API List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-xl p-4 border border-slate-105 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileCode className="h-4.5 w-4.5 text-indigo-550" />
                Liste des API Rest (v1)
              </h3>

              <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
                {API_SPECS.map(api => {
                  const isSelected = selectedApi.path === api.path;
                  return (
                    <div 
                      key={api.path}
                      onClick={() => { setSelectedApi(api); setApiConsoleOutput(''); }}
                      className={`p-3 rounded-lg border transition cursor-pointer flex flex-col text-left gap-1 ${
                        isSelected ? 'bg-indigo-50/50 border-indigo-400 text-indigo-950' : 'bg-white border-slate-100 hover:bg-slate-50/80 text-slate-600'
                      }`}
                    >
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black ${
                          api.method === 'GET' ? 'bg-sky-100 text-sky-800' :
                          api.method === 'POST' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {api.method}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-slate-700">{api.path}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{api.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right/Middle panel: API details and Interactive Console Terminal */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-4 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="font-mono text-[10.5px] bg-slate-100 px-2 py-0.5 rounded text-indigo-700 font-bold">{selectedApi.method} {selectedApi.path}</span>
                  <p className="text-slate-500 text-xs mt-1.5">{selectedApi.description}</p>
                </div>

                <button 
                  onClick={handleTestApi}
                  disabled={isApiLoading}
                  className="self-start sm:self-center bg-indigo-650 hover:bg-indigo-755 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Tester l'API
                </button>
              </div>

              {/* API specification parameters layout details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Rôle RBAC Exigé</span>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold font-mono">
                    {selectedApi.roleRequired}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Spécification Payload</span>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-500 font-mono">
                    Type: application/json
                  </div>
                </div>
              </div>

              {selectedApi.payload && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Exemple de requête (Payload JSON)</span>
                  <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg text-[10px] font-mono overflow-x-auto border border-slate-800">
                    {selectedApi.payload}
                  </pre>
                </div>
              )}

              {/* Interactive terminal output console */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Terminal de Retour API (Live Playback)</span>
                <pre className="bg-slate-950 text-slate-250 p-4 rounded-xl text-[10.5px] font-mono h-[160px] overflow-y-auto leading-relaxed border border-slate-900">
                  {apiConsoleOutput || "🔌 Cliquez sur 'Tester l'API' ci-dessus pour simuler une requête HTTP asynchrone sécurisée..."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 4: ROLES & RBAC MATRIX */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-550" />
              Politique Globale d'Autorisation (Role-Based Access Control)
            </h3>
            <p className="text-xs text-slate-500">Dîner d'autorisation des profils municipaux et citoyens rattachés à la propreté urbaine.</p>
          </div>

          <div className="overflow-x-auto text-left">
            <table className="w-full text-xs font-sans text-slate-600 border border-collapse">
              <thead className="bg-slate-50 border-b border-slate-150 font-bold text-slate-500 text-[9px] uppercase tracking-wider">
                <tr>
                  <th className="p-3 border">Rôle Municipal</th>
                  <th className="p-3 border text-center">Gestion Abonnés & SIG</th>
                  <th className="p-3 border text-center">Lancement Facturation (Fiscale)</th>
                  <th className="p-3 border text-center">Encaissement Caisse</th>
                  <th className="p-3 border text-center">Clôture des Tournées</th>
                  <th className="p-3 border text-center">Gabarits SMS/Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50/20">
                  <td className="p-3 border font-bold text-indigo-700">Maire / SuperAdmin Municipal</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                </tr>
                <tr className="hover:bg-slate-50/20">
                  <td className="p-3 border font-bold text-slate-700">Responsable Salubrité / Chef de Service</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-indigo-600 font-semibold bg-indigo-50/20">Sélection Gabarit</td>
                </tr>
                <tr className="hover:bg-slate-50/20">
                  <td className="p-3 border font-bold text-slate-700">Comptable / Agent Financier</td>
                  <td className="p-3 border text-center text-indigo-500 font-semibold bg-indigo-50/20">Lir Seule</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-emerald-600 font-bold bg-emerald-50/40">Lecture/Écriture</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                </tr>
                <tr className="hover:bg-slate-50/20">
                  <td className="p-3 border font-bold text-slate-700">Agent Chauffeur / Éboueur de Terrain</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                  <td className="p-3 border text-center text-indigo-650 font-bold bg-indigo-50/40">Émargement RFID</td>
                  <td className="p-3 border text-center text-rose-600 bg-rose-50/40 font-bold">Refusé</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER TAB 5: SAAS TECHNOLOGIES & 5-PHASE DEVELOPMENT PLAN */}
      {activeTab === 'plan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            
            {/* 5-phase plan */}
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Rocket className="h-4.5 w-4.5 text-indigo-550" />
                Plan Global de Déploiement Municipal (5 Phases)
              </h3>

              <div className="relative border-l border-zinc-200 ml-4.5 pl-6 space-y-6 text-xs text-slate-650 font-medium">
                <div className="relative">
                  <div className="absolute -left-9 top-1 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">1</div>
                  <h4 className="font-bold text-slate-800 text-xs">Phase 1: Mobilisation du Cadastre & Enrôlement SIG</h4>
                  <p className="text-slate-500 mt-1">Saisie géodésique des points d'apport volontaire et branchement des foyers. Déploiement d'un conteneur de devis de bacs de tri.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-9 top-1 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">2</div>
                  <h4 className="font-bold text-slate-800 text-xs">Phase 2: Moteur de Facturation & Passerelle Mobile Money</h4>
                  <p className="text-slate-500 mt-1">Test d'interconnexion asynchrone sécurisée avec Orange Money, MTN, et Wave. Intégration du grand livre comptable de redevance.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-9 top-1 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">3</div>
                  <h4 className="font-bold text-slate-800 text-xs">Phase 3: Équipements RFID & Terminaux Chauffeur</h4>
                  <p className="text-slate-500 mt-1">Installation des lecteurs sur les camions compacteurs et distribution de l'application mobile de navigation routière hors-ligne.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-9 top-1 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">4</div>
                  <h4 className="font-bold text-slate-800 text-xs">Phase 4: Campagne de Télédépêches SMS Citoyennes</h4>
                  <p className="text-slate-500 mt-1">Lancement de la plateforme automatisée d'alerte SMS "Veille de Collecte". Communication publique pour l'adoption générale.</p>
                </div>

                <div className="relative">
                  <div className="absolute -left-9 top-1 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">5</div>
                  <h4 className="font-bold text-slate-800 text-xs">Phase 5: Tableau de bord BI final & Consolidation Municipale</h4>
                  <p className="text-slate-500 mt-1">Mise à disposition des indicateurs métropolitains pour d'autres départements (ex: finances, maires, cabinets d'audit urbain).</p>
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-1 space-y-4">
            {/* Tech recommended highlights list */}
            <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl p-4.5 space-y-4">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-500 block">Pile de Technologies Recommandée</span>

              <ul className="space-y-3.5 text-xs text-slate-400">
                <li className="flex gap-2.5 items-start">
                  <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Cadre Applicatif (SPA / Mobile)</strong>
                    <p className="text-[10px] text-slate-400 font-mono">React v19 + Vite / Tailwind v4 • React Native pour GPS.</p>
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Moteur Serveur API (Backend)</strong>
                    <p className="text-[10px] text-slate-400 font-mono">Express JS + Typescript ou C# .NET Core.</p>
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Base de Données</strong>
                    <p className="text-[10px] text-slate-400 font-mono">PostgreSQL avec extension géospatiale PostGIS.</p>
                  </div>
                </li>
                <li className="flex gap-2.5 items-start">
                  <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-sans">Système de messagerie</strong>
                    <p className="text-[10px] text-slate-400 font-mono">RabbitMQ pour les notifications SMS asynchrones.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
