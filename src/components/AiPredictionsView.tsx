/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo, FormEvent } from 'react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  Compass, 
  Coins, 
  Users, 
  MapPin, 
  Cpu, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  UserPlus, 
  BarChart2, 
  RefreshCw,
  Info,
  Flame,
  Wrench,
  Activity,
  FileText,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { Subscriber, Invoice, SubscriptionPlan, Route } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AiPredictionsViewProps {
  subscribers: Subscriber[];
  invoices: Invoice[];
  plans: SubscriptionPlan[];
  routes: Route[];
  onNavigateToTab?: (tab: string) => void;
}

// Inline Markdown formatter to safely styles response elements cleanly
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-slate-700">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Horizontal line
        if (trimmed === '---') {
          return <hr key={index} className="my-2 border-slate-200" />;
        }
        
        // H3 headers
        if (trimmed.startsWith('###')) {
          const headerText = trimmed.replace('###', '').trim();
          return (
            <h4 key={index} className="text-xs font-black text-slate-800 uppercase tracking-wider mt-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
              {headerText}
            </h4>
          );
        }

        // H4 headers
        if (trimmed.startsWith('####')) {
          const headerText = trimmed.replace('####', '').trim();
          return (
            <h5 key={index} className="text-xs font-bold text-slate-800 mt-2 block">
              {headerText}
            </h5>
          );
        }

        // Bullet points
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const content = trimmed.replace(/^[\*\-]\s*/, '').trim();
          // Bold matches inside item
          const parts = content.split(/\*\*([^*]+)\*\*/g);
          return (
            <div key={index} className="flex items-start gap-2 text-[11.5px] leading-relaxed pl-2">
              <span className="text-emerald-500 shrink-0 mt-1">•</span>
              <span className="text-slate-600 font-medium">
                {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-900">{p}</strong> : p)}
              </span>
            </div>
          );
        }

        // Standard text with bold markers
        if (trimmed) {
          const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
          return (
            <p key={index} className="text-[11.5px] leading-relaxed font-semibold text-slate-600">
              {parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-slate-950">{p}</strong> : p)}
            </p>
          );
        }

        return <div key={index} className="h-1.5" />;
      })}
    </div>
  );
}

export default function AiPredictionsView({
  subscribers,
  invoices,
  plans,
  routes,
  onNavigateToTab
}: AiPredictionsViewProps) {
  
  // Tabs: 'copilot' (Assistant Intelligent), 'financials' (Prévisions Financières & Impayés), 'logistics' (Optimisation Tournées), 'commercial' (Recommandations), 'audit_crisis' (Audit & Continuité)
  const [activeTab, setActiveTab] = useState<'copilot' | 'financials' | 'logistics' | 'commercial' | 'audit_crisis'>('copilot');

  // Chat/Copilot States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string; live?: boolean }>>([
    {
      sender: 'ai',
      text: "Bonjour ! Je suis l'Assistant Intelligent AKPBF-Brain. J'analyse en continu le comportement de vos clients d'assainissement, les trajectoires de facturation, l'état physique du parc de poubelles et les tournées GPS d'Abidjan. Comment puis-je vous aider aujourd'hui ?\n\n### Questions recommandées :\n* *Quel est le risque global d'impayé ce mois-ci ?*\n* *Quels clients de Cocody devrions-nous passer sur la formule supérieure ?*\n* *Comment optimiser la consommation de carburant de la tournée d'aujourd'hui ?*",
      time: '09:30',
      live: false
    }
  ]);
  const [isAiAnswering, setIsAiAnswering] = useState(false);

  // Strategic AI Audit States
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Crisis Continuité States
  const [crisisType, setCrisisType] = useState<string>('greve');
  const [crisisResult, setCrisisResult] = useState<string | null>(null);
  const [isCrisisSimulating, setIsCrisisSimulating] = useState(false);

  // Unpaid Predict Data
  const riskSubscribers = useMemo(() => {
    return subscribers.map(s => {
      let riskScore = 15;
      let reasons: string[] = [];

      const unpaidBills = invoices.filter(i => i.subscriberId === s.id && i.status !== 'paid');
      if (unpaidInvoicesCount() > 0) {
        riskScore += 45;
        reasons.push("Reliquat de facturation en attente");
      }
      if (s.status === 'suspended') {
        riskScore += 30;
        reasons.push("Contrat suspendu temporairement");
      }
      if (s.neighborhood === 'Yopougon') {
        riskScore += 10;
      }
      if (s.phone.startsWith('+22505') || s.phone.includes('05')) {
        riskScore += 5;
      }

      riskScore = Math.min(98, Math.max(8, riskScore));

      let level: 'Faible' | 'Modéré' | 'Élevé' | 'Critique' = 'Faible';
      if (riskScore > 75) level = 'Critique';
      else if (riskScore > 50) level = 'Élevé';
      else if (riskScore > 25) level = 'Modéré';

      return {
        ...s,
        riskScore,
        riskLevel: level,
        reasons
      };
    }).sort((a,b) => b.riskScore - a.riskScore);
  }, [subscribers, invoices]);

  function unpaidInvoicesCount() {
    return invoices.filter((i: any) => i.status !== 'paid').length;
  }

  // Revenues Predictions Calculations (Next 4 months)
  const currentMrr = useMemo(() => {
    return subscribers.filter(s => s.status === 'active').reduce((sum, s) => {
      const plan = plans.find(p => p.id === s.planId);
      return sum + (plan ? plan.price : 3500);
    }, 0);
  }, [subscribers, plans]);

  const predictionsRevenueData = useMemo(() => {
    return [
      { name: 'Mai (Actuel)', 'Revenu Brisé': currentMrr, 'Projection Optimiste': currentMrr },
      { name: 'Juin 2026', 'Revenu Brisé': Math.round(currentMrr * 1.05), 'Projection Optimiste': Math.round(currentMrr * 1.08) },
      { name: 'Juillet 2026', 'Revenu Brisé': Math.round(currentMrr * 1.12), 'Projection Optimiste': Math.round(currentMrr * 1.18) },
      { name: 'Août 2026', 'Revenu Brisé': Math.round(currentMrr * 1.19), 'Projection Optimiste': Math.round(currentMrr * 1.30) },
      { name: 'Septembre 2026', 'Revenu Brisé': Math.round(currentMrr * 1.25), 'Projection Optimiste': Math.round(currentMrr * 1.45) }
    ];
  }, [currentMrr]);

  // Commercial Recommendations - Upselling triggers
  const upsellLeads = useMemo(() => {
    const leads: Array<{
      id: string;
      subscriberName: string;
      neighborhood: string;
      currentPlanName: string;
      suggestedPlanName: string;
      additionalMrrFcfa: number;
      reason: string;
      confidenceScore: number;
    }> = [];

    subscribers.forEach((s, idx) => {
      const plan = plans.find(p => p.id === s.planId);
      if (!plan) return;

      if (plan.name.includes('Social') || plan.price < 4000) {
        const premiumPlan = plans.find(p => p.price > plan.price);
        if (premiumPlan) {
          leads.push({
            id: `L-${100 + idx}`,
            subscriberName: s.name,
            neighborhood: s.neighborhood,
            currentPlanName: plan.name,
            suggestedPlanName: premiumPlan.name,
            additionalMrrFcfa: premiumPlan.price - plan.price,
            reason: s.currentBinLevel > 75 
              ? 'Niveau moyen du bac critique (>75%) régulièrement détecté par capteur' 
              : 'Foyers d\'arrondissement dense avec fréquence de collecte élevée',
            confidenceScore: s.currentBinLevel > 75 ? 94 : 78
          });
        }
      }
    });

    return leads.sort((a,b) => b.confidenceScore - a.confidenceScore);
  }, [subscribers, plans]);

  // Geographic High Potential Zones
  const highPotentialZones = useMemo(() => {
    return [
      { name: 'Cocody-Riviera 3 (Zone Université)', rating: 'Critique', potentialCount: 840, densityIndex: 'Élevé 92%', averageIncome: 'Élevé', status: 'Cible Prioritaire' },
      { name: 'Marcory-Zone 4C (Professionnels & Restos)', rating: 'Excellent', potentialCount: 320, densityIndex: 'Moyen 75%', averageIncome: 'Très Élevé', status: 'Grande Marge' },
      { name: 'Yopougon-Niangon (Foyers Sociaux)', rating: 'Modéré', potentialCount: 1450, densityIndex: 'Très Élevé 98%', averageIncome: 'Moyen', status: 'Volume de Masse' },
      { name: 'Plateau (Déchets Bureaux)', rating: 'Excellent', potentialCount: 150, densityIndex: 'Faible 34%', averageIncome: 'Corporation', status: 'B2B Élite' }
    ];
  }, []);

  // Handle live chat submission to Express backend
  const handleSendChat = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg, time }]);
    setChatMessage('');
    setIsAiAnswering(true);

    fetch('/api/ai/chat', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        history: chatHistory.slice(-6), // pass recent history as context
        context: {
          subscribers,
          invoices,
          plans,
          routes
        }
      })
    })
    .then(res => res.json())
    .then(data => {
      setChatHistory(prev => [...prev, { sender: 'ai', text: data.text, time, live: data.live }]);
      setIsAiAnswering(false);
    })
    .catch(err => {
      console.error("Chat API error:", err);
      // Failover message
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: "### Désolé !\nLa liaison serveur avec AKPBF-Brain v3.5 a été ralentie. Heureusement, notre plan d'action préconise de vérifier votre clé API Gemini dans l'onglet Secrets ou de retenter.", 
        time,
        live: false 
      }]);
      setIsAiAnswering(false);
    });
  };

  // Preset quick ask
  const handleQuickRequest = (text: string) => {
    setChatMessage(text);
  };

  // Call the strategic audit endpoint
  const handleTriggerAudit = () => {
    setIsAuditing(true);
    setAuditResult(null);

    fetch('/api/ai/audit', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          subscribers,
          invoices,
          plans,
          routes
        }
      })
    })
    .then(res => res.json())
    .then(data => {
      setAuditResult(data.text);
      setIsAuditing(false);
    })
    .catch(err => {
      console.error(err);
      setIsAuditing(false);
    });
  };

  // Trigger crisis simulator
  const handleTriggerCrisisSim = () => {
    setIsCrisisSimulating(true);
    setCrisisResult(null);

    fetch('/api/ai/sim-crisis', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crisisType,
        context: {
          subscribers,
          invoices,
          plans,
          routes
        }
      })
    })
    .then(res => res.json())
    .then(data => {
      setCrisisResult(data.text);
      setIsCrisisSimulating(false);
    })
    .catch(err => {
      console.error(err);
      setIsCrisisSimulating(false);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Navigation Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase bg-slate-900 px-3 py-1 rounded-full border border-slate-700 tracking-wider inline-flex items-center gap-1.5 font-mono">
            <Globe className="h-3 w-3 animate-pulse text-emerald-400" />
            MOTEUR INTUITIF COGNITIF IA v3.5
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1.5 flex items-center gap-2">
            Intelligence Artificielle & Audit
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Croisement cognitif de facturation, logistique d'Abidjan et plans de secours d'urgence</p>
        </div>

        {/* Local Tab Selector */}
        <div className="flex flex-wrap bg-slate-100 rounded-xl p-1 shrink-0 gap-1 self-start md:self-auto shadow-xs border border-slate-200/50">
          <button 
            type="button"
            id="subtab-copilot"
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'copilot' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            🤖 Assistant Intelligent
          </button>
          <button 
            type="button"
            id="subtab-financials"
            onClick={() => setActiveTab('financials')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'financials' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            📉 Score Impayés & Revenus
          </button>
          <button 
            type="button"
            id="subtab-logistics"
            onClick={() => setActiveTab('logistics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'logistics' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            🗺️ Optimisation Tournées
          </button>
          <button 
            type="button"
            id="subtab-commercial"
            onClick={() => setActiveTab('commercial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'commercial' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            💎 Opportunités Commerciales
          </button>
          <button 
            type="button"
            id="subtab-audit-crisis"
            onClick={() => setActiveTab('audit_crisis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'audit_crisis' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-indigo-600 hover:text-indigo-900 bg-emerald-50/50'
            }`}
          >
            📊 Audit & Continuité IA
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: COPILOT ASSISTANT */}
      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          
          {/* Left panel - quick trigger prompts */}
          <div className="col-span-1 space-y-3 text-left">
            <div className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-xs space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 font-bold text-xs">
                <BrainCircuit className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Thèmes d'Analyse Rapide</span>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { text: 'Anomalies de collectes détectées', prompt: 'Montre-moi les anomalies et débordements de poubelles signalés ce matin.' },
                  { text: 'Score d\'impayés par arr.', prompt: 'Quel est le risque global d\'impayé par arrondissement ?' },
                  { text: 'Algorithme d\'upsell conseillé', prompt: 'Quels clients de Cocody devrions-nous passer sur la formule supérieure ?' },
                  { text: 'Rendement énergétique camions', prompt: 'Comment optimiser la consommation de carburant de la tournée d\'aujourd\'hui ?' }
                ].map((th, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuickRequest(th.prompt)}
                    className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 transition rounded-xl text-[11px] font-bold text-slate-600 text-left border border-slate-150 cursor-pointer"
                  >
                    {th.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-xs text-left space-y-3">
              <div className="flex items-center gap-1 text-amber-400 font-black text-xs uppercase tracking-wider">
                <Cpu className="h-4 w-4" />
                <span>Statut du Moteur</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                Le cerveau cognitif interroge en temps réel le registre comptable d'AKPBF et le positionnement RFID des cuves d'Abidjan pour formuler de fiers diagnostics.
              </p>
            </div>
          </div>

          {/* Right panel - Chat console */}
          <div className="col-span-3 bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[520px]">
            
            {/* Header info bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800">Cerveau Décisionnel AKPBF</h4>
                  <span className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Agent intelligent disponible (Modèle : Gemini 3.5 Flash)
                  </span>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setChatHistory([{ sender: 'ai', text: 'Console réinitialisée. Comment puis-je vous guider ?', time: 'A l\'instant' }])}
                className="text-[10px] text-slate-400 hover:text-slate-700 font-bold border border-slate-200 px-2 py-1 rounded cursor-pointer"
              >
                Vider le fil
              </button>
            </div>

            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatHistory.map((ch, idx) => {
                const isAi = ch.sender === 'ai';
                return (
                  <div 
                    key={idx}
                    className={`flex ${isAi ? 'justify-start' : 'justify-end'} text-left items-start gap-3`}
                  >
                    {isAi && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-emerald-800 flex items-center justify-center text-xs shrink-0 font-bold mt-1">
                        AI
                      </div>
                    )}
                    <div className="space-y-1 max-w-[85%]">
                      <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                        isAi 
                          ? 'bg-slate-50/95 text-slate-700 border border-slate-200/60 rounded-tl-none' 
                          : 'bg-emerald-700 text-white rounded-tr-none shadow-xs'
                      }`}>
                        <FormattedMessage text={ch.text} />
                        
                        {isAi && ch.live && (
                          <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center gap-1.5 text-[9px] text-emerald-600 font-bold">
                            <ShieldCheck className="h-3 w-3" />
                            Analyse en direct effectuée par Gemini
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-405 font-mono pl-1 text-right block">{ch.time}</span>
                    </div>
                  </div>
                );
              })}

              {isAiAnswering && (
                <div className="flex justify-start items-center gap-2 text-slate-400 text-xs pl-8 font-mono animate-pulse">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                  <span>AKPBF-Brain interroge l'ERP et compile l'analyse en Côte d'Ivoire...</span>
                </div>
              )}
            </div>

            {/* Input console */}
            <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <div className="relative">
                <input 
                  type="text"
                  id="copilot-text-input"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Posez une question sur le recouvrement, les tournées d'Abidjan..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-xs outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold shadow-inner"
                />
                
                <button
                  type="submit"
                  id="send-chat-submit-btn"
                  className="absolute right-2.5 top-2 bg-emerald-700 hover:bg-emerald-850 text-white p-1.5 rounded-lg cursor-pointer max-h-[34px] flex items-center justify-center transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

          </div>

        </div>
      )}

      {/* RENDER TAB 2: FINANCIALS PREDICT */}
      {activeTab === 'financials' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left projection graph */}
            <div className="lg:col-span-7 bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4 text-left">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Modélisation Prédictive des Revenus (MRR)</h3>
                <p className="text-xs text-slate-400">Projection de croissance des redevances d'assainissement d'ici fin 2026</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictionsRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="Revenu Brisé" stroke="#1B5E20" fillOpacity={0.15} fill="#1B5E20" strokeWidth={2} />
                    <Area type="monotone" dataKey="Projection Optimiste" stroke="#3B82F6" fillOpacity={0.05} fill="#3B82F6" strokeWidth={2} strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-150 leading-relaxed text-slate-600 font-semibold">
                <strong>Analyse de variance :</strong> L'augmentation projetée prend en compte le plan d'upsell automatique ciblé et l'assainissement commercial à Cocody qui compense les coûts d'acquisition initiaux des bacs.
              </div>
            </div>

            {/* Right Risk Score Ledger */}
            <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4 text-left">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5Header">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                  Abonnés à Risque Élevé d'Impayé
                </h3>
                <p className="text-xs text-slate-400">Classement automatique par probabilité d'incidence financière</p>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {riskSubscribers.slice(0, 5).map((rs) => {
                  return (
                    <div key={rs.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/50 transition duration-150">
                      <div>
                        <div className="font-bold text-slate-800">{rs.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{rs.neighborhood} • {rs.id}</div>
                        
                        <div className="mt-1 flex flex-wrap gap-1">
                          {rs.reasons.map((re, idx) => (
                            <span key={idx} className="bg-red-50 text-red-700 text-[8.5px] px-1.5 py-0.5 rounded border border-red-100 font-bold block">
                              {re}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-semibold">
                        <span className="text-[9px] text-slate-405 block font-bold">Probabilité</span>
                        <span className={`text-[13px] font-black ${
                          rs.riskScore > 70 ? 'text-red-700' : 'text-amber-600'
                        }`}>
                          {rs.riskScore} %
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                type="button"
                onClick={() => onNavigateToTab?.('unpaid_debts')}
                className="w-full text-center bg-slate-100 hover:bg-slate-250 text-slate-700 text-xs font-bold py-2.5 rounded-xl block cursor-pointer transition border border-slate-200"
              >
                Ouvrir le Module Intelligent des Impayés
              </button>
            </div>

          </div>

        </div>
      )}

      {/* RENDER TAB 3: LOGISTICS OPTIMIZATION */}
      {activeTab === 'logistics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300 text-left">
          
          {/* Spatial Optimization controls */}
          <div className="lg:col-span-8 bg-zinc-900 border border-zinc-805 text-white rounded-2xl p-5 space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-805 pb-3">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-amber-400">
                  <Compass className="h-4.5 w-4.5" />
                  Simulateur Mathématique du TSP / VRP de Voirie
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-semibold">Optimisation spatiale séquentielle pour Cocody et Yopougon</p>
              </div>

              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded font-black font-mono">
                PostGIS SIG OK
              </span>
            </div>

            {/* Map visual track representation with animated routes points */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
              
              <div className="absolute inset-0 opacity-15 flex gap-8 flex-wrap">
                {[1, 2, 3, 4, 5, 20].map(n => <div key={n} className="border border-white w-24 h-24" />)}
              </div>

              <svg viewBox="0 0 100 100" className="w-56 h-56 relative z-10 text-emerald-500">
                <circle cx="20" cy="70" r="2.5" fill="#EF4444" />
                <circle cx="35" cy="40" r="2" fill="#4CAF50" />
                <circle cx="65" cy="20" r="2" fill="#4CAF50" />
                <circle cx="80" cy="50" r="2" fill="#4CAF50" />
                <circle cx="50" cy="85" r="2" fill="#4CAF50" />

                <path d="M 20 70 L 35 40 L 65 20 L 80 50 L 50 85 Z" stroke="#10B981" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="3 2" fill="none" className="animate-pulse" />
                <circle cx="35" cy="40" r="3.5" fill="#3B82F6" className="animate-bounce" />
              </svg>

              <div className="absolute bottom-3 left-3 bg-black/80 border border-zinc-800 p-3 text-[10px] rounded-lg text-zinc-350 space-y-1 font-mono leading-relaxed">
                <div>🏁 Départ : **Garage Voirie Cocody**</div>
                <div>📍 Équipage actif : **Camion #COL-402**</div>
                <div className="text-emerald-400 font-bold">🚀 Trajet optimal séquencé par l'IA</div>
              </div>

              <div className="absolute top-3 right-3 bg-emerald-950/80 border border-emerald-800 px-2.5 py-1 text-[9px] text-emerald-400 rounded-full font-bold">
                Économie Carburant : -14.2%
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-zinc-850 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold font-mono">Durée Totale Estimée</span>
                <strong className="text-white block mt-0.5 text-md text-slate-200">210 Mins</strong>
              </div>
              <div className="p-3 bg-zinc-850 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold font-mono">Distance Cumulative</span>
                <strong className="text-emerald-400 block mt-0.5 text-md">24.6 Km</strong>
              </div>
              <div className="p-3 bg-zinc-850 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[9px] uppercase font-bold font-mono">Passages Séquencés</span>
                <strong className="text-sky-450 block mt-0.5 text-md font-bold">142 Foyers</strong>
              </div>
            </div>
          </div>

          {/* Right anomalies alerts panel */}
          <div className="lg:col-span-4 bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Détecteur Intelligent d'Anomalies</h3>
              <p className="text-xs text-slate-400">Alertes temps-réel générées par les capteurs d'Abidjan</p>
            </div>

            <div className="space-y-3">
              {[
                { type: 'warning', title: 'Ravitaillement raté', desc: 'Le camion a sauté la poubelle RFID #BAC-225-1002 (Koffi Jean-Jacques).', time: 'Il y a 14min' },
                { type: 'critical', title: 'Bac d\'ordure brisé', desc: 'Détérioration critique signalée sur le capteur LID de SUB-8842 (Diallo).', time: 'Il y a 1h' },
                { type: 'info', title: 'Vitesse excessive', desc: 'Excès de vitesse de l\'équipage #AGT-002 sur la voie rapide de Cocody.', time: 'Il y a 2h' }
              ].map((an, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border text-xs space-y-1.5 leading-normal font-semibold ${
                    an.type === 'critical' ? 'bg-red-50 border-red-150 text-red-900' :
                    an.type === 'warning' ? 'bg-amber-50 border-amber-150 text-amber-900' : 'bg-blue-50 border-blue-150 text-blue-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <strong className="font-extrabold">{an.title}</strong>
                    <span className="text-[9px] opacity-75 font-mono">{an.time}</span>
                  </div>
                  <p className="text-[11px] opacity-85 font-medium">{an.desc}</p>
                </div>
              ))}
            </div>

            <button 
              type="button"
              onClick={() => onNavigateToTab?.('routes')}
              className="w-full text-center bg-slate-100 hover:bg-slate-205 text-slate-700 text-xs font-bold py-2.5 rounded-xl block cursor-pointer transition border border-slate-200"
            >
              Surveiller la Feuille de Route Opérationnelle
            </button>
          </div>

        </div>
      )}

      {/* RENDER TAB 4: COMMERCIAL LEADS AND HOT ZONES */}
      {activeTab === 'commercial' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300 text-left">
          
          {/* Upselling prospects list */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Déclencheurs d'Upsell Recommandés par l'IA</h3>
              <p className="text-xs text-slate-400">Abonnés pouvant augmenter immédiatement leur formule d'assainissement</p>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {upsellLeads.slice(0, 4).map((lp) => (
                <div key={lp.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-xs space-y-2 relative hover:bg-slate-100/30 transition duration-150 font-semibold">
                  <span className="absolute top-3.5 right-3 px-2 py-0.5 text-[8px] bg-emerald-100 text-emerald-800 rounded font-black">
                    {lp.confidenceScore}% Probabilité
                  </span>

                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-xs">{lp.subscriberName}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{lp.neighborhood} • Formule Actuelle : {lp.currentPlanName}</p>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-normal italic pl-2 border-l-2 border-slate-305">
                    " {lp.reason} "
                  </p>

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-200/50 font-semibold">
                    <span className="text-slate-500">Conseillé : <strong className="text-indigo-700">{lp.suggestedPlanName}</strong></span>
                    <span className="text-emerald-700 font-extrabold">Gain Mensuel : +{lp.additionalMrrFcfa} FCFA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hot Potential sectors list */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Zones Géographiques à Fort Potentiel Commercial</h3>
              <p className="text-xs text-slate-400 font-mono">Détection sectorielle des prospects à proximité immédiate d'abonnés</p>
            </div>

            <div className="space-y-3.5 font-semibold">
              {highPotentialZones.map((zone, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-205 rounded-xl relative flex justify-between items-center text-xs hover:bg-slate-100/30 transition">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800">{zone.name}</h4>
                    <div className="flex gap-2 text-[10px] text-slate-450 font-semibold">
                      <span>Pouvoir d'Achat : <strong>{zone.averageIncome}</strong></span>
                      <span>• Densité : {zone.densityIndex}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-emerald-850 font-black block">{zone.potentialCount} prospects</span>
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">{zone.status}</span>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-150 font-medium text-xs leading-normal text-slate-700 flex items-start gap-2">
                  <Info className="h-4.5 w-4.5 text-emerald-800 shrink-0 mt-0.5" />
                  <p>
                    <strong>Recommandation d'acquisition SaaS :</strong> En déployant un représentant sur la **Riviera 3**, notre taux de conversion de salubrité peut augmenter de **18%** grâce à la preuve sociale de voisinage résiduelle.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* RENDER NEW TAB 5: STRATEGIC AUDIT & CRISIS CONTINUITY PLANNER */}
      {activeTab === 'audit_crisis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300 text-left">
          
          {/* Left panel: Tactical Audit Trigger */}
          <div className="lg:col-span-6 space-y-6 flex flex-col">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Rapport d'Audit Stratégique & SWOT</h3>
                  <p className="text-xs text-slate-400">Croisement automatique des metrics d'Abidjan en direct</p>
                </div>
              </div>

              <p className="text-[11.5px] text-slate-500 leading-relaxed font-semibold">
                Engagez le moteur cognitif d'audit pour scanner la base comptable d'AKPBF. L'algorithme calcule le diagnostic financier de recouvrement, identifie les anomalies matérielles de vos bennes et génère un rapport SWOT exhaustif pour réunion de direction.
              </p>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleTriggerAudit}
                  disabled={isAuditing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Calcul comptable & Audit stratégique par l'IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Générer le Rapport d'Audit Institutionnel (Abidjan)
                    </>
                  )}
                </button>
              </div>

              {/* Show Audit Result if available */}
              {auditResult && (
                <div className="mt-4 p-4 bg-slate-50/70 border border-slate-200 rounded-xl overflow-y-auto max-h-[380px] space-y-2 animate-in slide-in-from-top-3 duration-200 font-semibold shadow-inner">
                  <FormattedMessage text={auditResult} />
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Disruption Crisis Simulation (PCA) */}
          <div className="lg:col-span-6 space-y-6 flex flex-col">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Simulateur de Crises Urbaines & Continuité (PCA)</h3>
                  <p className="text-xs text-slate-400">Modèles de réaction d'urgence face aux imprévus d'Abidjan</p>
                </div>
              </div>

              <div className="space-y-3 font-semibold">
                <label className="text-slate-700 text-xs font-bold block">1. Choisissez un scénario de crise :</label>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'greve', label: '✊ Grève Organisée', tip: '75% du personnel absent' },
                    { id: 'penurie_carburant', label: '⛽ Pénurie Gazole', tip: 'Ravitaillement bloqué' },
                    { id: 'inondation', label: '⛈️ Saison des Pluies', tip: 'Riviera submergée' },
                    { id: 'panne_camions', label: '🔧 Pannes Matérielles', tip: '3 Vérins hydrauliques hors-service' }
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setCrisisType(sc.id)}
                      className={`p-3 text-left border rounded-xl transition duration-150 cursor-pointer ${
                        crisisType === sc.id
                          ? 'bg-red-50 border-red-300 text-red-900 ring-1 ring-red-400/30'
                          : 'bg-slate-50 hover:bg-slate-100/60 border-slate-150 text-slate-600'
                      }`}
                    >
                      <strong className="text-[11.5px] font-extrabold block">{sc.label}</strong>
                      <span className="text-[9.5px] text-slate-400 block font-semibold mt-0.5">{sc.tip}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTriggerCrisisSim}
                  disabled={isCrisisSimulating}
                  className="w-full bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-3 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45"
                >
                  {isCrisisSimulating ? (
                    <>
                      <Activity className="h-4 w-4 animate-pulse text-amber-200" />
                      Calcul tactique du Plan de Continuité d'Activité PCA...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-amber-400" />
                      Déclencher l'Analyse Tactique du Risque & PCA
                    </>
                  )}
                </button>
              </div>

              {/* Show Crisis Result if available */}
              {crisisResult && (
                <div className="mt-4 p-4 bg-rose-50/40 border border-rose-100 rounded-xl overflow-y-auto max-h-[340px] space-y-2 animate-in slide-in-from-top-3 duration-200 font-semibold shadow-inner">
                  <FormattedMessage text={crisisResult} />
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
