import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Home, 
  ShoppingBag, 
  Utensils, 
  GlassWater, 
  Briefcase, 
  Warehouse, 
  Trash, 
  Scale, 
  Clock, 
  Eye, 
  Layers, 
  Users,
  Compass,
  CheckCircle,
  X 
} from 'lucide-react';
import { Emplacement, Subscriber } from '../types';

interface EmplacementsViewProps {
  emplacements: Emplacement[];
  subscribers: Subscriber[];
  onAddEmplacement: (emp: Emplacement) => void;
  onUpdateEmplacement: (emp: Emplacement) => void;
  onDeleteEmplacement: (id: string) => void;
  currentLoggedClient?: Subscriber | null; // If pass, behaves as Client view
}

export default function EmplacementsView({
  emplacements,
  subscribers,
  onAddEmplacement,
  onUpdateEmplacement,
  onDeleteEmplacement,
  currentLoggedClient
}: EmplacementsViewProps) {
  const isClientMode = !!currentLoggedClient;

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('ALL');
  const [selectedSubId, setSelectedSubId] = useState<string>('ALL');

  // Form states for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Emplacement | null>(null);

  const [formSubscriberId, setFormSubscriberId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formType, setFormType] = useState<'Maison' | 'Boutique' | 'Restaurant' | 'Maquis' | 'Bureau' | 'Entrepôt'>('Maison');
  const [formAddress, setFormAddress] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formGps, setFormGps] = useState('');
  const [formWasteType, setFormWasteType] = useState<'Ménagers' | 'Plastiques' | 'Cartons & Papiers' | 'Organiques' | 'Métaux & Canettes' | 'Verres'>('Ménagers');
  const [formVolume, setFormVolume] = useState('240L');
  const [formFrequency, setFormFrequency] = useState('2 fois par semaine');

  // Interactive Simulated Coordinates Tool
  const [isLocating, setIsLocating] = useState(false);

  // Initialize form
  const openAddModal = () => {
    setEditingEmp(null);
    setFormSubscriberId(isClientMode ? currentLoggedClient!.id : (subscribers[0]?.id || ''));
    setFormLabel('');
    setFormType('Maison');
    setFormAddress('');
    setFormNeighborhood(isClientMode ? currentLoggedClient!.neighborhood : 'Cocody');
    setFormGps('5.3500, -4.0020');
    setFormWasteType('Ménagers');
    setFormVolume('240L');
    setFormFrequency('2 fois par semaine');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Emplacement) => {
    setEditingEmp(emp);
    setFormSubscriberId(emp.subscriberId);
    setFormLabel(emp.label);
    setFormType(emp.type);
    setFormAddress(emp.address);
    setFormNeighborhood(emp.neighborhood);
    setFormGps(emp.gpsCoordinates);
    setFormWasteType(emp.wasteType);
    setFormVolume(emp.estimatedVolume);
    setFormFrequency(emp.collectionFrequency);
    setIsModalOpen(true);
  };

  // Simulates GPS fetching
  const handleAutoLocate = () => {
    setIsLocating(true);
    setTimeout(() => {
      const neighborhoodsCoords: { [key: string]: [number, number] } = {
        'Cocody': [5.3571, -4.0083],
        'Plateau': [5.3211, -4.0189],
        'Marcory': [5.3094, -3.9928],
        'Treichville': [5.3023, -4.0121],
        'Yopougon': [5.3415, -4.0725],
        'Abobo': [5.4120, -4.0210],
        'Koumassi': [5.2950, -3.9740],
        'Adjamé': [5.3680, -4.0250]
      };
      
      const center = neighborhoodsCoords[formNeighborhood] || [5.3480, -4.0100];
      const latNoise = (Math.random() - 0.5) * 0.015;
      const lngNoise = (Math.random() - 0.5) * 0.015;
      const accurateLat = (center[0] + latNoise).toFixed(5);
      const accurateLng = (center[1] + lngNoise).toFixed(5);
      
      setFormGps(`${accurateLat}, ${accurateLng}`);
      setIsLocating(false);
    }, 800);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formAddress.trim()) {
      alert('Veuillez renseigner le libellé et l\'adresse complète.');
      return;
    }

    if (editingEmp) {
      const updated: Emplacement = {
        ...editingEmp,
        subscriberId: formSubscriberId,
        label: formLabel,
        type: formType,
        address: formAddress,
        neighborhood: formNeighborhood,
        gpsCoordinates: formGps,
        wasteType: formWasteType,
        estimatedVolume: formVolume,
        collectionFrequency: formFrequency
      };
      onUpdateEmplacement(updated);
      alert('Emplacement mis à jour de manière permanente.');
    } else {
      const newEmp: Emplacement = {
        id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        subscriberId: formSubscriberId,
        reference: `RE-26-${String(emplacements.length + 101).padStart(4, '0')}`,
        label: formLabel,
        type: formType,
        address: formAddress,
        neighborhood: formNeighborhood,
        gpsCoordinates: formGps,
        wasteType: formWasteType,
        estimatedVolume: formVolume,
        collectionFrequency: formFrequency
      };
      onAddEmplacement(newEmp);
      alert('Nouvel emplacement enregistré avec succès.');
    }
    setIsModalOpen(false);
  };

  // Filter computation
  const filteredEmplacements = useMemo(() => {
    return emplacements.filter(emp => {
      // 1. Client specific filter
      if (isClientMode) {
        if (emp.subscriberId !== currentLoggedClient!.id) return false;
      } else {
        if (selectedSubId !== 'ALL' && emp.subscriberId !== selectedSubId) return false;
      }

      // 2. Type filter
      if (typeFilter !== 'ALL' && emp.type !== typeFilter) return false;

      // 3. Neighborhood filter
      if (neighborhoodFilter !== 'ALL' && emp.neighborhood !== neighborhoodFilter) return false;

      // 4. Clean search filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesLabel = emp.label.toLowerCase().includes(query);
        const matchesRef = emp.reference.toLowerCase().includes(query);
        const matchesAddress = emp.address.toLowerCase().includes(query);
        return matchesLabel || matchesRef || matchesAddress;
      }

      return true;
    });
  }, [emplacements, isClientMode, currentLoggedClient, selectedSubId, typeFilter, neighborhoodFilter, searchTerm]);

  // Unique neighborhoods options
  const uniqueNeighborhoods = useMemo(() => {
    const list = emplacements.map(e => e.neighborhood);
    // Include user default ones as well
    const defaultList = ['Cocody', 'Plateau', 'Marcory', 'Treichville', 'Yopougon', 'Abobo', 'Koumassi', 'Adjamé'];
    return Array.from(new Set([...list, ...defaultList])).sort();
  }, [emplacements]);

  // Icons mapper matching location type
  const getTypeIcon = (type: Emplacement['type']) => {
    switch (type) {
      case 'Maison': return <Home className="h-5 w-5 text-emerald-600" />;
      case 'Boutique': return <ShoppingBag className="h-5 w-5 text-indigo-500" />;
      case 'Restaurant': return <Utensils className="h-5 w-5 text-amber-500" />;
      case 'Maquis': return <GlassWater className="h-5 w-5 text-orange-500 animate-pulse" />;
      case 'Bureau': return <Briefcase className="h-5 w-5 text-sky-500" />;
      case 'Entrepôt': return <Warehouse className="h-5 w-5 text-violet-500" />;
      default: return <MapPin className="h-5 w-5 text-slate-500" />;
    }
  };

  const currentLoggedClientName = useMemo(() => {
    if (isClientMode) return currentLoggedClient!.name;
    return '';
  }, [isClientMode, currentLoggedClient]);

  return (
    <div className="space-y-6" id="emplacements-module-container">
      {/* Module Title Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest uppercase font-mono block">Module Multi-Sites</span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isClientMode ? 'Mes Emplacements de Collecte' : 'Gestion des Emplacements Clients'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            {isClientMode 
              ? `Gérez les différents sites liés à votre abonnement citoyen : résidences, commerces, maquis, ou restaurants.`
              : 'Supervisez, référencez et géolocalisez tous les points d\'enlèvement actifs rattachés aux fiches abonnés d\'Abidjan.'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white text-xs rounded-xl flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-md shadow-emerald-500/10"
        >
          <Plus className="h-4.5 w-4.5" />
          Ajouter un Emplacement
        </button>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row gap-3">
        {/* Search Input inline */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par référence, libellé, adresse..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 text-slate-800 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Type select */}
        <div className="w-full md:w-44">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 text-slate-700 dark:text-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
          >
            <option value="ALL">Tous les types ({isClientMode ? 'Ménages / Pro' : 'Tous'})</option>
            <option value="Maison">Maison</option>
            <option value="Boutique">Boutique</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Maquis">Maquis</option>
            <option value="Bureau">Bureau</option>
            <option value="Entrepôt">Entrepôt</option>
          </select>
        </div>

        {/* Neighborhood select */}
        <div className="w-full md:w-40">
          <select
            value={neighborhoodFilter}
            onChange={(e) => setNeighborhoodFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 text-slate-700 dark:text-slate-200 rounded-xl p-2.5 text-xs font-semibold outline-none"
          >
            <option value="ALL">Tous les quartiers</option>
            {uniqueNeighborhoods.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Admin subscriber select filter */}
        {!isClientMode && (
          <div className="w-full md:w-52">
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 text-emerald-600 dark:text-emerald-400 font-extrabold rounded-xl p-2.5 text-xs outline-none"
            >
              <option value="ALL">Filtrer par Abonné (Tous)</option>
              {subscribers.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name} ({sub.id})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid listing */}
      {filteredEmplacements.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl text-slate-400">
            <MapPin className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">Aucun Emplacement Trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Il n'y a aucun point de collecte correspondant à votre recherche. Souhaitez-vous créer un nouvel emplacement maintenant ?
          </p>
          <button 
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl transition"
          >
            Créer un premier emplacement
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmplacements.map((emp) => {
            const owner = subscribers.find(s => s.id === emp.subscriberId);
            return (
              <div 
                key={emp.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden group"
              >
                {/* Visual marker of type */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0">
                      {getTypeIcon(emp.type)}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 block">{emp.reference}</span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-none mt-1">{emp.label}</h4>
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition duration-150">
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      title="Modifier"
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Voulez-vous supprimer définitivement cet emplacement "${emp.label}" ?`)) {
                          onDeleteEmplacement(emp.id);
                        }
                      }}
                      title="Supprimer"
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-slate-400 hover:text-red-600 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body details */}
                <div className="space-y-2 text-[11.5px] text-slate-600 dark:text-slate-350">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{emp.address}, <span className="font-bold text-slate-800 dark:text-white">{emp.neighborhood}</span></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold">{emp.gpsCoordinates}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800/60 text-[10.5px]">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Déchets</span>
                      <span className="font-bold truncate text-slate-850 dark:text-slate-200 block">{emp.wasteType}</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Volume / Fréquence</span>
                      <span className="font-bold text-indigo-500 dark:text-teal-400 block truncate leading-none">
                        {emp.estimatedVolume} <span className="text-slate-400 text-[10px] font-normal font-mono">({emp.collectionFrequency})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Admin context: Who owns it */}
                {!isClientMode && owner && (
                  <div className="mt-3 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl flex items-center gap-2 border border-slate-100 dark:border-slate-850">
                    <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <div className="text-[10px] font-bold leading-tight truncate">
                      <span className="text-slate-400 block">Abonné propriétaire</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold">{owner.name}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE & EDIT MODAL form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight leading-none">
                    {editingEmp ? 'Modifier l\'Emplacement' : 'Nouvel Emplacement'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">CONFIGURER VOS COORDONNÉES ET DÉCHETS</span>
                </div>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
              {/* If admin, must specify which customer */}
              {!isClientMode && (
                <div className="space-y-1">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Abonné propriétaire</label>
                  <select
                    value={formSubscriberId}
                    onChange={(e) => setFormSubscriberId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-xs outline-none focus:border-emerald-500 font-bold"
                  >
                    {subscribers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Libellé / Nom de l'emplacement</label>
                  <input 
                    type="text"
                    required
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="Ex: Villa d'Angré, Maquis du Vallon..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Type d'emplacement</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="Maison">Maison</option>
                    <option value="Boutique">Boutique</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Maquis">Maquis</option>
                    <option value="Bureau">Bureau</option>
                    <option value="Entrepôt">Entrepôt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Adresse complète</label>
                  <input 
                    type="text"
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Ex: Rue 12, Face Église St Jacques"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Quartier</label>
                  <select
                    value={formNeighborhood}
                    onChange={(e) => setFormNeighborhood(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl p-2.5 text-xs font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="Cocody">Cocody</option>
                    <option value="Plateau">Plateau</option>
                    <option value="Marcory">Marcory</option>
                    <option value="Treichville">Treichville</option>
                    <option value="Yopougon">Yopougon</option>
                    <option value="Abobo">Abobo</option>
                    <option value="Koumassi">Koumassi</option>
                    <option value="Adjamé">Adjamé</option>
                  </select>
                </div>
              </div>

              {/* GPS simulator component row */}
              <div className="space-y-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Coordonnées GPS (Latitude, Longitude)</label>
                  <button
                    type="button"
                    onClick={handleAutoLocate}
                    disabled={isLocating}
                    className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Géolocalisation...' : 'Simuler par rapport au Quartier'}</span>
                  </button>
                </div>
                <input 
                  type="text"
                  required
                  value={formGps}
                  onChange={(e) => setFormGps(e.target.value)}
                  placeholder="Ex: 5.3521, -4.0125"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-xl p-2.5 text-xs font-mono font-bold tracking-tight outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Type de Déchets</label>
                  <select
                    value={formWasteType}
                    onChange={(e) => setFormWasteType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                  >
                    <option value="Ménagers">Ménagers</option>
                    <option value="Plastiques">Plastiques</option>
                    <option value="Cartons & Papiers">Cartons & Papiers</option>
                    <option value="Organiques">Organiques</option>
                    <option value="Métaux & Canettes">Métaux</option>
                    <option value="Verres">Verres</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Volume estimé</label>
                  <select
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                  >
                    <option value="120L">Standard 120L</option>
                    <option value="240L">Standard 240L</option>
                    <option value="360L">Bac Grand 360L</option>
                    <option value="1100L">Conteneur GMT 1100L</option>
                    <option value="2.5m³">Benne Rotative 2.5m³</option>
                    <option value="5m³">Ampliroll Grand 5m³</option>
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Fréquence levée</label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl p-2 text-xs font-semibold outline-none"
                  >
                    <option value="1 fois par semaine">Habituel (1x/sem)</option>
                    <option value="2 fois par semaine">Habituel (2x/sem)</option>
                    <option value="3 fois par semaine">Tri-hebdomadaire (3x/sem)</option>
                    <option value="Quotidien">Quotidien exceptionnel</option>
                    <option value="Sur Appel">Sur demande / Appel</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
              >
                {editingEmp ? 'Sauvegarder les modifications' : 'Créer l\'emplacement'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
