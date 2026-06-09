/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Send,
  User,
  Layers,
  ChevronRight,
  TrendingDown,
  Building,
  Check,
  UserCheck
} from 'lucide-react';
import { Subscriber } from '../types';

export interface TicketComment {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

export interface ComplaintTicket {
  id: string;
  subscriberId: string;
  subscriberName: string;
  subscriberPhone: string;
  city: string; // Ouagadougou, Bobo-Dioulasso, etc.
  category: "NON_COLLECTE" | "FACTURATION" | "CASSE_BAC" | "AUTRE";
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'investigating' | 'resolved' | 'closed';
  agentAssigned?: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}

interface ComplaintsViewProps {
  subscribers: Subscriber[];
  cityFilter?: string; // Multiville filter
  onAddNotification?: (notif: any) => void;
}

export default function ComplaintsView({ 
  subscribers, 
  cityFilter = 'all',
  onAddNotification 
}: ComplaintsViewProps) {
  // Mock initialized list of municipal waste collection complaints in BF
  const [tickets, setTickets] = useState<ComplaintTicket[]>([
    {
      id: "TKT-2026-620",
      subscriberId: "SUB-4029",
      subscriberName: "Koffi Jean-Jacques",
      subscriberPhone: "+226 70 25 36 98",
      city: "Ouagadougou",
      category: "NON_COLLECTE",
      description: "Le camion-benne est passé dans notre rue à Karpala sans vider mon bac standard de 240L ce lundi matin.",
      priority: "high",
      status: "open",
      createdAt: "2026-06-05 08:30",
      updatedAt: "2026-06-05 08:30",
      comments: [
        {
          id: "c1",
          senderName: "Système AKPBF",
          senderRole: "Robot d'Assistance",
          content: "Ticket créé par le portail abonné. Validation immédiate.",
          timestamp: "2026-06-05 08:30"
        }
      ]
    },
    {
      id: "TKT-2026-621",
      subscriberId: "SUB-1933",
      subscriberName: "Soro Aminata",
      subscriberPhone: "+226 76 12 45 78",
      city: "Bobo-Dioulasso",
      category: "FACTURATION",
      description: "Double facturation constatée sur mon paiement Orange Money pour la formule Professionnel de Mai 2026.",
      priority: "medium",
      status: "investigating",
      agentAssigned: "Sawadogo Salif (Comptable)",
      createdAt: "2026-06-04 10:15",
      updatedAt: "2026-06-04 14:20",
      comments: [
        {
          id: "c2",
          senderName: "Sawadogo Salif",
          senderRole: "Comptable",
          content: "Vérification en cours avec l'opérateur Orange Money Burkina S.A.",
          timestamp: "2026-06-04 14:20"
        }
      ]
    },
    {
      id: "TKT-2026-622",
      subscriberId: "SUB-8842",
      subscriberName: "Mamadou Diallo",
      subscriberPhone: "+226 71 88 55 22",
      city: "Ouagadougou",
      category: "CASSE_BAC",
      description: "Le couvercle de mon bac de 360L a été cassé lors de la manutention mécanique par les éboueurs.",
      priority: "critical",
      status: "assigned",
      agentAssigned: "Kaboré Souleymane (Superviseur Zone)",
      createdAt: "2026-06-03 16:45",
      updatedAt: "2026-06-05 11:10",
      comments: [
        {
          id: "c3",
          senderName: "Kaboré Souleymane",
          senderRole: "Superviseur",
          content: "Planification d'un échange standard de cuve de bac dans la tournée municipale de demain.",
          timestamp: "2026-06-05 11:10"
        }
      ]
    }
  ]);

  // View states
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'NON_COLLECTE' | 'FACTURATION' | 'CASSE_BAC' | 'AUTRE'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'investigating' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  // Form states for creating a new complaint
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSubId, setNewSubId] = useState('');
  const [newCategory, setNewCategory] = useState<'NON_COLLECTE' | 'FACTURATION' | 'CASSE_BAC' | 'AUTRE'>('NON_COLLECTE');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newCity, setNewCity] = useState('Ouagadougou');

  // Comment formulation
  const [commentText, setCommentText] = useState('');
  const [agentNameChoice, setAgentNameChoice] = useState('Inspecteur Voirie AKPBF');
  const [agentRoleChoice, setAgentRoleChoice] = useState('Comptable / Superviseur');

  // Autocomplete matching list for subscribers
  const filteredSubsForCreate = useMemo(() => {
    if (!newSubId) return [];
    return subscribers.filter(s => 
      s.name.toLowerCase().includes(newSubId.toLowerCase()) || 
      s.id.toLowerCase().includes(newSubId.toLowerCase())
    ).slice(0, 5);
  }, [subscribers, newSubId]);

  // Select subscriber from autocomplete
  const [selectedSubForNew, setSelectedSubForNew] = useState<Subscriber | null>(null);

  const handleSelectSub = (sub: Subscriber) => {
    setSelectedSubForNew(sub);
    setNewSubId(sub.name);
  };

  // Create Ticket Submission
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForNew || !newDescription) {
      alert("Veuillez sélectionner un abonné valide et saisir une description de l'incident.");
      return;
    }

    const ticketId = `TKT-2026-${Math.floor(650 + Math.random() * 350)}`;
    const newTkt: ComplaintTicket = {
      id: ticketId,
      subscriberId: selectedSubForNew.id,
      subscriberName: selectedSubForNew.name,
      subscriberPhone: selectedSubForNew.phone || "+226 ",
      city: newCity,
      category: newCategory,
      description: newDescription,
      priority: newPriority,
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comments: [
        {
          id: `c_${Date.now()}`,
          senderName: "Administration Centrale AKPBF",
          senderRole: "Service Clientèle",
          content: "Ticket d'incident enregistré et classé. En attente d'évaluation technique.",
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    };

    setTickets(prev => [newTkt, ...prev]);

    // Send notification log if provided
    if (onAddNotification) {
      onAddNotification({
        id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
        recipientName: selectedSubForNew.name,
        recipientContact: selectedSubForNew.phone || "SMS",
        type: 'sms',
        templateName: 'Ticket Reçu',
        content: `AKPBF ALERTE : Votre ticket ${ticketId} (${newCategory}) a bien été créé. Notre équipe intervient promptement.`,
        sentAt: 'À l\'instant',
        status: 'sent'
      });
    }

    // Reset local form
    setSelectedSubForNew(null);
    setNewSubId('');
    setNewDescription('');
    setIsAddOpen(false);
    alert(`🎉 Ticket ${ticketId} généré et transmis au superviseur de la zone !`);
  };

  // Add Comment to active ticket
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText) return;

    const newComment: TicketComment = {
      id: `c_${Date.now()}`,
      senderName: agentNameChoice,
      senderRole: agentRoleChoice,
      content: commentText,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          comments: [...t.comments, newComment]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket(prev => prev ? { ...prev, comments: [...prev.comments, newComment], updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : null);
    setCommentText('');
  };

  // Change Ticket Status
  const handleChangeStatus = (ticketId: string, newStatus: ComplaintTicket['status']) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket(prev => prev && prev.id === ticketId ? { ...prev, status: newStatus, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : null);

    if (onAddNotification) {
      const tkt = tickets.find(t => t.id === ticketId);
      if (tkt) {
        onAddNotification({
          id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
          recipientName: tkt.subscriberName,
          recipientContact: tkt.subscriberPhone,
          type: 'sms',
          templateName: 'Statut Clôture Ticket',
          content: `AKPBF ALERTE : Le statut de votre réclamation ${ticketId} est désormais [${newStatus.toUpperCase()}]. Satisfaction client assurée.`,
          sentAt: 'À l\'instant',
          status: 'sent'
        });
      }
    }
  };

  // Assign agent helper
  const handleAssignAgent = (ticketId: string, agentName: string) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'assigned' as const,
          agentAssigned: agentName,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return t;
    });
    setTickets(updatedTickets);
    setSelectedTicket(prev => prev && prev.id === ticketId ? { ...prev, status: 'assigned', agentAssigned: agentName, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) } : null);
  };

  // Filtered List calculations
  const displayTickets = useMemo(() => {
    return tickets.filter(t => {
      // 1. City Filter (multi-city support)
      if (cityFilter !== 'all' && t.city.toLowerCase() !== cityFilter.toLowerCase()) return false;

      // 2. Search Text
      const textToSearch = `${t.id} ${t.subscriberName} ${t.description}`.toLowerCase();
      if (searchTerm && !textToSearch.includes(searchTerm.toLowerCase())) return false;

      // 3. Category Filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // 4. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'open' && t.status !== 'open' && t.status !== 'assigned') return false;
        if (statusFilter === 'investigating' && t.status !== 'investigating') return false;
        if (statusFilter === 'resolved' && t.status !== 'resolved' && t.status !== 'closed') return false;
      }

      // 5. Priority Filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      return true;
    });
  }, [tickets, cityFilter, searchTerm, categoryFilter, statusFilter, priorityFilter]);

  // Statistics
  const ticketStats = useMemo(() => {
    const currentTickets = tickets.filter(t => cityFilter === 'all' || t.city.toLowerCase() === cityFilter.toLowerCase());
    const total = currentTickets.length;
    const open = currentTickets.filter(t => t.status === 'open' || t.status === 'assigned' || t.status === 'investigating').length;
    const resolved = currentTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const critical = currentTickets.filter(t => t.priority === 'critical' || t.priority === 'high').length;
    return { total, open, resolved, critical };
  }, [tickets, cityFilter]);

  return (
    <div className="space-y-6" id="complaints-view-container">
      
      {/* Module Executive Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/80 gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#635BFF] font-black">
            <MessageSquare className="h-4 w-4" />
            <span>MUNICIPAL TICKET ENGINE • SERVICE DES RÉCLAMATIONS ET INCIDENTS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestion des Réclamations Abonnés</h2>
          <p className="text-slate-500 text-sm mt-0.5">Traitement, historique de suivi, attribution aux équipages municipaux et communication citoyenne.</p>
        </div>

        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-slate-900 text-white hover:bg-slate-850 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 border border-slate-700 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 text-emerald-400" />
          <span>Créer un Ticket d'Incident citoyen</span>
        </button>
      </div>

      {/* METRIC BADGES CARD SHELF */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Total des Réclamations</div>
          <div className="text-2xl font-black text-slate-850 mt-1">{ticketStats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1 block">Toutes catégories confondues</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider text-amber-600">Tickets Actifs En Attente</div>
          <div className="text-2xl font-black text-slate-850 mt-1">{ticketStats.open}</div>
          <div className="text-[10px] text-amber-600 mt-1 font-semibold block">Intervention requise</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider text-emerald-600">Résolus / Clôturés</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{ticketStats.resolved}</div>
          <div className="text-[10px] text-slate-400 mt-1 block">Taux de résolution : {ticketStats.total ? Math.round((ticketStats.resolved / ticketStats.total) * 100) : 100}%</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-3xs">
          <div className="text-rose-700 text-[10px] font-black uppercase tracking-wider">Urgence Elevée / Critique</div>
          <div className="text-2xl font-black text-rose-800 mt-1">{ticketStats.critical}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1 block">Priorité d'exploitation absolue</div>
        </div>
      </div>

      {/* TICKET FILTERS AND TWO PANEL GRID WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFTPANEL: COMPLAINTS MASTER LEDGER (Lg: 5 columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[480px]">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="Rechercher ticket (ID, Client, Motif)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 text-xs font-semibold rounded-xl outline-hidden focus:border-[#635BFF]"
              />
            </div>

            {/* Quick selectors row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">Catégorie</label>
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold outline-hidden"
                >
                  <option value="all">Toutes</option>
                  <option value="NON_COLLECTE">Non collecté</option>
                  <option value="FACTURATION">Factures</option>
                  <option value="CASSE_BAC">Casse Matériel</option>
                  <option value="AUTRE">Autres</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">Statut</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold outline-hidden"
                >
                  <option value="all">Tous</option>
                  <option value="open">Actif / Ouvert</option>
                  <option value="investigating">En cours</option>
                  <option value="resolved">Résolu</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">Degré Urgence</label>
                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-1 text-[10px] font-bold outline-hidden"
                >
                  <option value="all">Toutes</option>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>
          </div>

          {/* List display */}
          <div className="divide-y divide-slate-150 overflow-y-auto max-h-[500px]">
            {displayTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-350" />
                <p className="text-xs font-semibold">Aucun incident ne correspond à vos filtres.</p>
              </div>
            ) : (
              displayTickets.map(tkt => {
                const isSelected = selectedTicket?.id === tkt.id;
                return (
                  <button
                    key={tkt.id}
                    onClick={() => setSelectedTicket(tkt)}
                    className={`w-full text-left p-4 hover:bg-slate-50/60 block transition relative select-none cursor-pointer ${isSelected ? 'bg-[#635BFF]/5/40 border-l-4 border-[#635BFF]' : ''}`}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{tkt.id} • {tkt.city}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        tkt.status === 'open' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        tkt.status === 'assigned' ? 'bg-indigo-50 text-indigo-800 border border-indigo-150' :
                        tkt.status === 'investigating' ? 'bg-sky-50 text-sky-850 border border-sky-200' :
                        'bg-emerald-50 text-emerald-800'
                      }`}>
                        {tkt.status === 'open' ? 'Nouveau' :
                         tkt.status === 'assigned' ? 'Assigné' :
                         tkt.status === 'investigating' ? 'Enquête' : 'Résolu'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-850 mt-1 pointer-events-none">{tkt.subscriberName}</h4>
                    <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 pointer-events-none">{tkt.description}</p>

                    <div className="flex items-center justify-between mt-3 pointer-events-none text-[10px] text-slate-400 font-semibold">
                      <span className={`font-bold uppercase ${
                        tkt.priority === 'critical' ? 'text-red-650' :
                        tkt.priority === 'high' ? 'text-amber-600' :
                        tkt.priority === 'medium' ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        🔴 {tkt.priority.toUpperCase()}
                      </span>
                      <span>Modifié : {tkt.updatedAt.split(' ')[1] || tkt.updatedAt}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: DETAIL TICKET & COMMENTS WORKBENCH (Lg: 7 columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm min-h-[480px]">
          {selectedTicket ? (
            <div className="p-6 space-y-6">
              
              {/* Ticket Headline Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-150 pb-5 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#635BFF] uppercase tracking-wide bg-[#635BFF]/10 px-2 py-0.5 rounded">
                      {selectedTicket.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400">({selectedTicket.city})</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{selectedTicket.subscriberName}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Tél : <span className="font-bold text-slate-700">{selectedTicket.subscriberPhone}</span> • Abonné Réf : <span className="font-mono font-bold">{selectedTicket.subscriberId}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    selectedTicket.status === 'open' ? 'bg-amber-100 text-amber-800' :
                    selectedTicket.status === 'investigating' ? 'bg-sky-100 text-sky-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    Statut : {selectedTicket.status.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Créé le {selectedTicket.createdAt}</span>
                </div>
              </div>

              {/* Description box */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">DESCRIPTIF DU CITOYEN :</div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Assignment controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-b-slate-150 pb-5 select-none">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Attribuer à un Agent / Service</span>
                  <div className="flex gap-1.5">
                    <select 
                      onChange={(e) => handleAssignAgent(selectedTicket.id, e.target.value)}
                      value={selectedTicket.agentAssigned || ''}
                      className="w-full bg-white border border-slate-205 p-1.5 text-xs font-semibold rounded-lg outline-hidden focus:border-[#635BFF]"
                    >
                      <option value="">-- Choisir équipage --</option>
                      <option value="Diallo Alassane (Chauffeur Camion B01)">Diallo Alassane (Camion B01)</option>
                      <option value="Kaboré Souleymane (Superviseur)">Kaboré Souleymane (Superviseur)</option>
                      <option value="Sawadogo Salif (Comptable)">Sawadogo Salif (Comptable)</option>
                      <option value="Secteur 15 - Camion B04">Équipe Benne Standard B04</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Mettre à jour l'avancement</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleChangeStatus(selectedTicket.id, 'investigating')}
                      className="flex-1 bg-sky-50 text-sky-850 hover:bg-sky-100 rounded-lg p-1.5 text-[11px] font-bold border border-sky-200 transition cursor-pointer text-center"
                    >
                      Mettre en enquête
                    </button>
                    <button 
                      onClick={() => handleChangeStatus(selectedTicket.id, 'resolved')}
                      className="flex-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg p-1.5 text-[11px] font-bold border border-emerald-250 transition cursor-pointer text-center"
                    >
                      Résoudre & Clôturer
                    </button>
                  </div>
                </div>
              </div>

              {/* COMMENTS AND TIMELINE */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#635BFF] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Historique des Suivis & Commentaires ({selectedTicket.comments.length})</span>
                </span>

                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedTicket.comments.map((c) => (
                    <div key={c.id} className="p-3 border border-slate-150 rounded-xl space-y-1 bg-white">
                      <div className="flex items-center justify-between text-[10px] font-black pointer-events-none">
                        <span className="text-slate-800 flex items-center gap-1">
                          <User className="h-3 w-3 text-emerald-500" />
                          {c.senderName} <span className="text-slate-400 text-[9px] font-medium">({c.senderRole})</span>
                        </span>
                        <span className="text-slate-400 font-mono font-medium">{c.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-650 leading-normal font-semibold">
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Form to submit a comment */}
                <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-150 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400">
                    <div>
                      <label className="block mb-1">Votre Nom</label>
                      <input 
                        type="text" 
                        value={agentNameChoice}
                        onChange={(e) => setAgentNameChoice(e.target.value)}
                        className="w-full text-slate-705 p-1 px-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold outline-hidden" 
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Votre Rôle</label>
                      <input 
                        type="text" 
                        value={agentRoleChoice}
                        onChange={(e) => setAgentRoleChoice(e.target.value)}
                        className="w-full text-slate-705 p-1 px-2 border border-slate-200 rounded-lg bg-slate-50 text-xs font-semibold outline-hidden" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Saisir un commentaire ou rapport de tournée pour le citoyen..." 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 border border-slate-205 p-2 rounded-xl text-xs font-semibold outline-hidden focus:border-[#635BFF]"
                    />
                    <button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl cursor-pointer hover:scale-95 transition shrink-0"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </form>

              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 h-full flex flex-col items-center justify-center space-y-3.5">
              <MessageSquare className="h-12 w-12 text-[#635BFF]/30" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-slate-805">Aucune réclamation sélectionnée</p>
                <p className="text-xs text-slate-500 max-w-sm">Veuillez sélectionner un ticket citoyen dans le grand livre de gauche pour afficher l'historique et y répondre.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* MODAL TO ADD A NEW COMPLAINT/INCIDENT */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={() => setIsAddOpen(false)} />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full relative z-10 overflow-hidden transform animate-in zoom-in-95 ease-out duration-150">
            <div className="p-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 pb-0">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>Nouveau Ticket d'Incident Citoyen</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white px-1 font-bold select-none cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              
              {/* City selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ville du Burkina Faso</label>
                <select 
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full bg-white border border-slate-205 p-2 rounded-xl text-xs font-semibold outline-hidden focus:border-[#635BFF]"
                >
                  <option value="Ouagadougou">Ouagadougou</option>
                  <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                  <option value="Koudougou">Koudougou</option>
                  <option value="Ouahigouya">Ouahigouya</option>
                  <option value="Fada N'Gourma">Fada N'Gourma</option>
                </select>
              </div>

              {/* Sub ID Autocomplete input */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Abonné Concerné</label>
                <input 
                  type="text"
                  placeholder="Saisir nom ou référence de l'abonné..."
                  value={newSubId}
                  onChange={(e) => {
                    setNewSubId(e.target.value);
                    if (selectedSubForNew && e.target.value !== selectedSubForNew.name) {
                      setSelectedSubForNew(null);
                    }
                  }}
                  className="w-full bg-white border border-slate-205 p-2 rounded-xl text-xs font-semibold outline-hidden focus:border-[#635BFF]"
                />

                {/* Dropdown list if any matches */}
                {!selectedSubForNew && filteredSubsForCreate.length > 0 && (
                  <div className="absolute left-0 right-0 bg-white border border-slate-205 rounded-xl shadow-lg z-20 mt-1 max-h-[140px] overflow-y-auto divide-y divide-slate-100">
                    {filteredSubsForCreate.map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSelectSub(sub)}
                        className="w-full text-left p-2 hover:bg-slate-50 block transition text-xs font-semibold text-slate-805 cursor-pointer"
                      >
                        {sub.name} <span className="text-slate-400 text-[10px]">({sub.id} - {sub.neighborhood})</span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedSubForNew && (
                  <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-150 text-emerald-805 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 justify-between">
                    <span>Abonné sélectionné : <strong>{selectedSubForNew.name}</strong></span>
                    <button type="button" onClick={() => setSelectedSubForNew(null)} className="text-emerald-700 font-bold px-1 select-none">✕</button>
                  </div>
                )}
              </div>

              {/* Incidents Categories */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type d'incident</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-205 p-2 rounded-xl text-xs font-semibold outline-hidden focus:border-[#635BFF]"
                >
                  <option value="NON_COLLECTE">Bac d'ordures non vidé</option>
                  <option value="FACTURATION">Erreur de facturation / mobile money</option>
                  <option value="CASSE_BAC">Bac cassé ou volé</option>
                  <option value="AUTRE">Autre réclamation municipale</option>
                </select>
              </div>

              {/* Priority levels */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Niveau d'Urgence</label>
                <select 
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-white border border-slate-205 p-2 rounded-xl text-xs font-semibold outline-hidden focus:border-[#635BFF]"
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique - Urgence Hygiène</option>
                </select>
              </div>

              {/* Description inputs */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description Détaillée</label>
                <textarea 
                  rows={3}
                  placeholder="Expliquer en détail l'incident signalé par le citoyen..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white border border-slate-205 p-2 rounded-xl text-xs font-semibold outline-hidden focus:border-[#635BFF]"
                />
              </div>

              {/* Action row buttons */}
              <div className="flex gap-2.5 pt-2 select-none">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold p-3.5 rounded-xl transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#635BFF] hover:bg-indigo-700 text-white text-xs font-bold p-3.5 rounded-xl transition cursor-pointer"
                >
                  Créer le Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
