/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Trash2, 
  UserPlus, 
  Filter, 
  Sliders, 
  Check, 
  AlertCircle, 
  X, 
  Phone, 
  Mail, 
  CreditCard,
  Edit2
} from 'lucide-react';
import { Subscriber, SubscriptionPlan } from '../types';

interface SubscribersViewProps {
  subscribers: Subscriber[];
  plans: SubscriptionPlan[];
  onAddSubscriber: (newSub: Subscriber) => void;
  onUpdateSubscriber: (updatedSub: Subscriber) => void;
  onDeleteSubscriber: (id: string) => void;
}

export default function SubscribersView({ 
  subscribers, 
  plans, 
  onAddSubscriber, 
  onUpdateSubscriber, 
  onDeleteSubscriber 
}: SubscribersViewProps) {
  // State for search and filter controls
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Form states for creating a new subscriber
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubAddress, setNewSubAddress] = useState('');
  const [newSubNeighborhood, setNewSubNeighborhood] = useState('Cocody');
  const [newSubPlanId, setNewSubPlanId] = useState('plan_eco');
  const [newSubBinType, setNewSubBinType] = useState<'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L'>('Standard 240L');

  // State for viewing subscriber details
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form error notification
  const [formError, setFormError] = useState('');

  // Handle subscriber selection
  const handleOpenDetails = (sub: Subscriber) => {
    setSelectedSub(sub);
    setIsDetailsOpen(true);
  };

  // Neighborhood option list
  const neighborhoods = ['All', 'Cocody', 'Plateau', 'Marcory', 'Yopougon'];

  // Filter subscribers list
  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.phone.toLowerCase().includes(searchTerm);
    
    const matchesNeighborhood = selectedNeighborhood === 'All' || sub.neighborhood === selectedNeighborhood;
    const matchesPlan = selectedPlan === 'All' || sub.planId === selectedPlan;
    const matchesStatus = selectedStatus === 'All' || sub.status === selectedStatus;

    return matchesSearch && matchesNeighborhood && matchesPlan && matchesStatus;
  });

  // Handle adding new subscriber
  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubEmail || !newSubPhone || !newSubAddress) {
      setFormError('Veuillez remplir tous les champs requis.');
      return;
    }

    // Rough Abidjan coordinates bounding box
    // Cocody: lat 5.35, lng -3.98
    // Plateau: lat 5.32, lng -4.01
    // Marcory: lat 5.29, lng -3.97
    // Yopougon: lat 5.33, lng -4.08
    let baseLat = 5.3524;
    let baseLng = -3.9875;
    if (newSubNeighborhood === 'Plateau') { baseLat = 5.3211; baseLng = -4.0198; }
    else if (newSubNeighborhood === 'Marcory') { baseLat = 5.2952; baseLng = -3.9781; }
    else if (newSubNeighborhood === 'Yopougon') { baseLat = 5.3344; baseLng = -4.0851; }

    // Add tiny randomized offset to make dots distinct on the map simulator
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    const newSub: Subscriber = {
      id: `SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newSubName,
      email: newSubEmail,
      phone: newSubPhone,
      address: newSubAddress,
      neighborhood: newSubNeighborhood,
      lat: baseLat + latOffset,
      lng: baseLng + lngOffset,
      planId: newSubPlanId,
      status: 'pending',
      binType: newSubBinType,
      lastCollectionDate: 'Jamais',
      currentBinLevel: 0,
      paymentStatus: 'unpaid'
    };

    onAddSubscriber(newSub);
    
    // Clear variables
    setNewSubName('');
    setNewSubEmail('');
    setNewSubPhone('');
    setNewSubAddress('');
    setFormError('');
    setIsAddOpen(false);
  };

  // Slider change for container fill levels simulation
  const handleBinLevelSlider = (level: number) => {
    if (!selectedSub) return;
    const updated = { ...selectedSub, currentBinLevel: level };
    setSelectedSub(updated);
    onUpdateSubscriber(updated);
  };

  // Toggle subscriber status
  const handleToggleStatus = (status: 'active' | 'suspended' | 'pending') => {
    if (!selectedSub) return;
    const updated = { ...selectedSub, status };
    setSelectedSub(updated);
    onUpdateSubscriber(updated);
  };

  // Toggle subscriber payment status
  const handleTogglePayment = (paymentStatus: 'paid' | 'unpaid' | 'overdue') => {
    if (!selectedSub) return;
    const updated = { ...selectedSub, paymentStatus };
    setSelectedSub(updated);
    onUpdateSubscriber(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portefeuille des Abonnés</h2>
          <p className="text-slate-500 text-sm mt-0.5">Enrôlement, gestion administrative et monitoring des bacs à ordures</p>
        </div>
        <button 
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-center flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Nouvel Abonné
        </button>
      </div>

      {/* Advanced Filters and Search row */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center hover:border-slate-350 transition duration-300">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, téléphone, email ou ID abonne..."
            className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Dropdowns filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Neighborhood */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select 
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="bg-transparent text-xs text-slate-600 focus:outline-none font-medium cursor-pointer"
            >
              <option value="All">Tout Abidjan</option>
              {neighborhoods.filter(n => n !== 'All').map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Grille Tarifaires */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl">
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            <select 
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="bg-transparent text-xs text-slate-600 focus:outline-none font-medium cursor-pointer"
            >
              <option value="All">Tous Grilles</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Statut Contrat */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl">
            <Check className="h-3.5 w-3.5 text-slate-400" />
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-600 focus:outline-none font-medium cursor-pointer"
            >
              <option value="All">Tous Statuts</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
              <option value="pending">En dépôt d'activation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid showing Subscribers */}
      <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-xs hover:shadow-md transition duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Identifiant</th>
                <th className="p-4">Abonné / Contact</th>
                <th className="p-4">Secteur Municipal</th>
                <th className="p-4">Tarif Mensuel</th>
                <th className="p-4">Niveau Bac</th>
                <th className="p-4 text-center">Facturation</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400 font-medium">
                    Aucun abonné enregistré ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map(sub => {
                  const plan = plans.find(p => p.id === sub.planId);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="p-4 font-mono font-bold text-slate-800">{sub.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 text-sm">{sub.name}</div>
                        <div className="text-slate-400 text-[10px] mt-0.5">{sub.phone} • {sub.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-700">{sub.neighborhood}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{sub.address}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{plan ? `${plan.price.toLocaleString()} FCFA` : 'N/A'}</div>
                        <div className="text-[10px] text-indigo-500 font-semibold mt-0.5">{plan?.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                sub.currentBinLevel >= 80 ? 'bg-rose-500' : 
                                sub.currentBinLevel >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${sub.currentBinLevel}%` }}
                            />
                          </div>
                          <span className={`font-mono font-bold text-[10px] ${
                            sub.currentBinLevel >= 80 ? 'text-rose-600' : 
                            sub.currentBinLevel >= 50 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {sub.currentBinLevel}%
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{sub.binType}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 
                          sub.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.status === 'active' ? 'En Règle' : sub.status === 'suspended' ? 'Mise à pied' : 'Créé (Inactif)'}
                        </span>
                        <span className={`block text-[9px] mt-1 font-semibold ${
                          sub.paymentStatus === 'paid' ? 'text-emerald-600' : 
                          sub.paymentStatus === 'overdue' ? 'text-rose-600' : 'text-amber-600'
                        }`}>
                          {sub.paymentStatus === 'paid' ? 'À Jour' : sub.paymentStatus === 'overdue' ? 'Impayé Exigible' : 'Facturation Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleOpenDetails(sub)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg font-bold transition duration-150 active:scale-95"
                          >
                            Dossier
                          </button>
                          <button 
                            onClick={() => onDeleteSubscriber(sub.id)}
                            className="p-1 px-1.5 text-rose-650 bg-rose-50 hover:bg-rose-100 rounded-lg active:scale-95 transition duration-150"
                            title="Résilier contrat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW SUBSCRIBER */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-indigo-650 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                <h3 className="font-bold text-lg">Formulaire d'Enrôlement Abonné</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-indigo-250 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Chef de Ménage / Raison Sociale *</label>
                <input 
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Ex: Koffi Marc-Aurèle"
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-700 text-sm rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Numéro de Téléphone *</label>
                  <input 
                    type="tel"
                    value={newSubPhone}
                    onChange={(e) => setNewSubPhone(e.target.value)}
                    placeholder="Ex: +225 07 00 00 00 01"
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-700 text-sm rounded-lg focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Adresse Email *</label>
                  <input 
                    type="email"
                    value={newSubEmail}
                    onChange={(e) => setNewSubEmail(e.target.value)}
                    placeholder="Ex: m.koffi@email.ci"
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-700 text-sm rounded-lg focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Quartier (Abidjan) *</label>
                  <select 
                    value={newSubNeighborhood}
                    onChange={(e) => setNewSubNeighborhood(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-700 text-sm rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Cocody">Cocody</option>
                    <option value="Plateau">Plateau</option>
                    <option value="Marcory">Marcory</option>
                    <option value="Yopougon">Yopougon</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Grille Tarifaire (Abonnement) *</label>
                  <select 
                    value={newSubPlanId}
                    onChange={(e) => setNewSubPlanId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-700 text-sm rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.price} FCFA/Mois)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Type de Conteneur *</label>
                  <select 
                    value={newSubBinType}
                    onChange={(e) => setNewSubBinType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-700 text-sm rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Standard 240L">Standard 240Litres</option>
                    <option value="Bac Grand 360L">Bac Grand 360Litres</option>
                    <option value="Conteneur 1100L">Conteneur Collectif 1100Litres</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Coordonnées GPS</label>
                  <div className="bg-slate-100 p-2 rounded-lg text-slate-500 text-xs font-mono flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Auto-calculées du secteur SIG</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Localisation physique (Rue, Porte, Repère) *</label>
                <input 
                  type="text"
                  value={newSubAddress}
                  onChange={(e) => setNewSubAddress(e.target.value)}
                  placeholder="Ex: Rue des Jardins, face Villa 33, en face Pharmacie"
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-700 text-sm rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Créer le contrat & Affecter le SIG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBSCRIBER DETAILS & SIMULATION FOR THE CAPTORS */}
      {isDetailsOpen && selectedSub && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-indigo-400 font-bold">{selectedSub.id}</span>
                <h3 className="font-bold text-lg text-white mt-0.5">Dossier de l'Abonné Municipal</h3>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between border-b border-slate-100 pb-5">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-slate-800">{selectedSub.name}</h4>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    {selectedSub.address}, {selectedSub.neighborhood} (Abidjan)
                  </p>
                  <p className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                    COORD: {selectedSub.lat.toFixed(5)}, {selectedSub.lng.toFixed(5)}
                  </p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Statut Abonnement</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-100">
                    <button 
                      onClick={() => handleToggleStatus('active')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${selectedSub.status === 'active' ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Actif
                    </button>
                    <button 
                      onClick={() => handleToggleStatus('suspended')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${selectedSub.status === 'suspended' ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Suspendu
                    </button>
                  </div>
                </div>
              </div>

              {/* IoT Simulator section */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-500" />
                    <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Simulateur Capteur Bacs IoT (SIG)</h5>
                  </div>
                  <span className="text-[10px] text-zinc-550 italic font-mono">Modif. instantanée pour démo</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Niveau de remplissage estimé :</span>
                    <span className="font-mono text-indigo-600">{selectedSub.currentBinLevel}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={selectedSub.currentBinLevel}
                    onChange={(e) => handleBinLevelSlider(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg duration-100"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Vide (0%)</span>
                    <span>Modéré (50%)</span>
                    <span>Critique (&gt; 80%)</span>
                  </div>
                </div>
              </div>

              {/* Financial Status section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Solde Comptable</span>
                      <h5 className="font-bold text-slate-800 text-sm mt-1">{plans.find(p=>p.id===selectedSub.planId)?.price.toLocaleString()} FCFA / Mois</h5>
                    </div>
                    <CreditCard className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">Paiement :</span>
                    <select 
                      value={selectedSub.paymentStatus}
                      onChange={(e) => handleTogglePayment(e.target.value as any)}
                      className={`font-bold focus:outline-none cursor-pointer text-xs rounded-md p-1 ${
                        selectedSub.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 
                        selectedSub.paymentStatus === 'overdue' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      <option value="paid">À Jour</option>
                      <option value="unpaid">Non Payé (Relancé)</option>
                      <option value="overdue">Impayé Exigible</option>
                    </select>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Détails Logistiques</span>
                      <h5 className="font-bold text-slate-800 text-xs mt-1">{selectedSub.binType}</h5>
                    </div>
                    <Sliders className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-4 text-xs text-slate-500">
                    Dernière collecte : <strong className="text-slate-700">{selectedSub.lastCollectionDate}</strong>
                  </div>
                </div>
              </div>

              {/* Simulated Customer Service details */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Contact & Téléconsultation</h5>
                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <a href={`tel:${selectedSub.phone}`} className="flex-1 bg-indigo-50 text-indigo-750 hover:bg-indigo-100 p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition duration-150">
                    <Phone className="h-4 w-4" />
                    Appeler ({selectedSub.phone})
                  </a>
                  <a href={`mailto:${selectedSub.email}`} className="flex-1 bg-sky-50 text-sky-750 hover:bg-sky-100 p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition duration-150">
                    <Mail className="h-4 w-4" />
                    Envoyer Email ({selectedSub.email})
                  </a>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsDetailsOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                >
                  Fermer le dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
