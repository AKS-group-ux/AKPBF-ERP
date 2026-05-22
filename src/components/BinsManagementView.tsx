/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Trash2, 
  QrCode, 
  Camera, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  Calendar, 
  Activity, 
  History, 
  ShieldCheck, 
  Clock, 
  Info,
  CheckCircle2, 
  Search, 
  Filter, 
  Cpu, 
  Eye, 
  User, 
  ChevronRight,
  Maximize2,
  RefreshCw,
  TrendingUp,
  X,
  MapPin
} from 'lucide-react';
import { Subscriber } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface Bin {
  id: string;
  qrCode: string;
  subscriberId: string;
  subscriberName: string;
  neighborhood: string;
  capacity: '240L' | '360L' | '1100L';
  color: 'Vert de Salubrité' | 'Gris Écologique' | 'Bleu Recyclage' | 'Jaune Professionnel';
  type: 'Ordures Ménagères R3' | 'Matériaux Recyclables' | 'Biodéchets Humides' | 'Déchets Volumineux';
  acquisitionDate: string;
  status: 'Excellent' | 'Bon' | 'Moyen' | 'Mauvais' | 'Critique';
  healthScore: number; // 0 to 100%
  estimatedLifespanMonths: number;
  photoHistory: Array<{ date: string; url: string; note: string; classification: string }>;
  inspections: Array<{
    date: string;
    inspector: string;
    defectsDetected: string[];
    score: number;
    notes: string;
    state: string;
  }>;
}

interface BinsManagementViewProps {
  subscribers: Subscriber[];
  onUpdateSubscriber?: (updatedSub: Subscriber) => void;
}

// Bins Damage presets for simulated camera capture
const BIN_DAMAGE_PRESETS = [
  {
    id: 'wheel-ok',
    name: 'Roue en Bon État',
    url: 'https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // green plastic wheel
    classification: 'Bon',
    healthScore: 92,
    defects: [],
    notes: 'Aucun défaut mécanique détecté sur l\'axe ni les roues de roulement.'
  },
  {
    id: 'crack-heavy',
    name: 'Fissure Structurelle Majeure',
    url: 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // cracked bin wall
    classification: 'Critique',
    healthScore: 18,
    defects: ['Fissure latérale', 'Déformation par compression thermique'],
    notes: 'Infiltration d\'eaux d\'écouvaison possible. Risque d\'éclatement à la levée.'
  },
  {
    id: 'lid-broken',
    name: 'Couvercle Arraché',
    url: 'https://images.unsplash.com/photo-1621451537084-482c730e3a0a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // broken trash can
    classification: 'Mauvais',
    healthScore: 40,
    defects: ['Couvercle manquant ou fissuré', 'Charnières arrachées'],
    notes: 'Animaux nuisibles et propagation d\'odeurs nocives dans le quartier.'
  },
  {
    id: 'wheel-broken',
    name: 'Essieu & Roues Cassées',
    url: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // trash close-up wheel axis
    classification: 'Mauvais',
    healthScore: 45,
    defects: ['Roue gauche absente', 'Liaison d\'essieu pliée'],
    notes: 'Déplacement difficile pour l\'agent collecteur et fatigue physique accrue.'
  },
  {
    id: 'corroded-damaged',
    name: 'Déformation Écrasement',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // crushed container
    classification: 'Moyen',
    healthScore: 65,
    defects: ['Corrosion légère', 'Déformation de compression latérale'],
    notes: 'Capacité volumétrique diminuée de 15%. La prise d\'ascenseur du camion reste fonctionnelle.'
  }
];

export default function BinsManagementView({ subscribers, onUpdateSubscriber }: BinsManagementViewProps) {
  // Generate initial bins list matched with active subscribers
  const [bins, setBins] = useState<Bin[]>(() => {
    return subscribers.map((sub, idx) => {
      const capacities: Array<'240L' | '360L' | '1100L'> = ['240L', '360L', '1100L'];
      const subCapacity = sub.binType.includes('1100L') ? capacities[2] : sub.binType.includes('360L') ? capacities[1] : capacities[0];
      const conditions: Array<'Excellent' | 'Bon' | 'Moyen' | 'Mauvais' | 'Critique'> = ['Excellent', 'Bon', 'Moyen', 'Mauvais', 'Critique'];
      
      // Seed deterministic health based on index to ensure interesting dispersion
      let status = conditions[idx % conditions.length];
      let score = 95;
      if (status === 'Excellent') score = 96;
      else if (status === 'Bon') score = 84;
      else if (status === 'Moyen') score = 62;
      else if (status === 'Mauvais') score = 38;
      else if (status === 'Critique') score = 15;

      const colors = ['Vert de Salubrité', 'Gris Écologique', 'Bleu Recyclage', 'Jaune Professionnel'];
      const types = ['Ordures Ménagères R3', 'Matériaux Recyclables', 'Biodéchets Humides'];

      const yearOffset = 2023 + (idx % 3);
      const estimationLifespan = Math.max(3, Math.round(score * 0.6));

      return {
        id: `BAC-225-${1000 + idx}`,
        qrCode: `AKPBF-QR-${1000 + idx}`,
        subscriberId: sub.id,
        subscriberName: sub.name,
        neighborhood: sub.neighborhood,
        capacity: subCapacity,
        color: colors[idx % colors.length] as any,
        type: types[idx % types.length] as any,
        acquisitionDate: `12-04-${yearOffset}`,
        status,
        healthScore: score,
        estimatedLifespanMonths: yearOffset === 2025 ? estimationLifespan + 24 : estimationLifespan,
        photoHistory: [
          {
            date: '2025-11-10',
            url: 'https://images.unsplash.com/photo-1591195221085-b1a30221ecee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
            note: 'Livraison initiale du matériel et vérification du scellé RFID.',
            classification: 'Excellent'
          }
        ],
        inspections: [
          {
            date: '2026-03-15',
            inspector: 'Gérard Gnakpa (Contrôleur N°2)',
            defectsDetected: score < 70 ? ['Usure mécanique des pivots', 'Rayures structurales'] : [],
            score: score + 5 > 100 ? 100 : score + 5,
            notes: 'Inspection pré-saison. État de conservation général conforme.',
            state: status
          }
        ]
      };
    });
  });

  const [selectedBin, setSelectedBin] = useState<Bin | null>(bins[0] || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Excellent' | 'Bon' | 'Moyen' | 'Mauvais' | 'Critique'>('all');
  const [capacityFilter, setCapacityFilter] = useState<'all' | '240L' | '360L' | '1100L'>('all');
  
  // Interactive Simulator States
  const [activeTab, setActiveTab] = useState<'roster' | 'analytics' | 'inspection'>('roster');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedPresetImage, setSelectedPresetImage] = useState(BIN_DAMAGE_PRESETS[1]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiReportResult, setAiReportResult] = useState<any | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [customInspectorName, setCustomInspectorName] = useState('Agent Mobile Camion-Benne');

  // Filter calculations
  const filteredBins = useMemo(() => {
    return bins.filter(b => {
      const matchSearch = b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.subscriberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchCapacity = capacityFilter === 'all' || b.capacity === capacityFilter;
      return matchSearch && matchStatus && matchCapacity;
    });
  }, [bins, searchTerm, statusFilter, capacityFilter]);

  // Statistics for Charts
  const healthStats = useMemo(() => {
    const excellentCount = bins.filter(b => b.status === 'Excellent').length;
    const bonCount = bins.filter(b => b.status === 'Bon').length;
    const moyenCount = bins.filter(b => b.status === 'Moyen').length;
    const mauvaisCount = bins.filter(b => b.status === 'Mauvais').length;
    const critiqueCount = bins.filter(b => b.status === 'Critique').length;

    return [
      { name: 'Excellent', value: excellentCount, fill: '#1B5E20' }, // custom brand primary
      { name: 'Bon', value: bonCount, fill: '#4CAF50' }, // custom brand accent
      { name: 'Moyen', value: moyenCount, fill: '#F59E0B' }, // amber
      { name: 'Mauvais', value: mauvaisCount, fill: '#EF4444' }, // red
      { name: 'Critique', value: critiqueCount, fill: '#7F1D1D' } // dark red
    ];
  }, [bins]);

  const capacityStats = useMemo(() => {
    const b240 = bins.filter(b => b.capacity === '240L').length;
    const b360 = bins.filter(b => b.capacity === '360L').length;
    const b1100 = bins.filter(b => b.capacity === '1100L').length;

    return [
      { name: 'Bac Standard 240L', volume: b240, color: '#3B82F6' },
      { name: 'Grand Bac 360L', volume: b360, color: '#8B5CF6' },
      { name: 'Conteneur 1100L', volume: b1100, color: '#EC4899' }
    ];
  }, [bins]);

  // Trigger simulated AI Analysis flow
  const handleStartAiInspection = () => {
    setAiAnalyzing(true);
    setAiReportResult(null);

    setTimeout(() => {
      const isDamaged = selectedPresetImage.defects.length > 0;
      setAiReportResult({
        detectedDefects: selectedPresetImage.defects,
        classification: selectedPresetImage.classification,
        healthScore: selectedPresetImage.healthScore,
        estimatedLifespanMonths: Math.max(2, Math.round(selectedPresetImage.healthScore * 0.6)),
        notes: selectedPresetImage.notes
      });
      setAiAnalyzing(false);
    }, 2000);
  };

  // Submit and save mock AI inspection reporting to state
  const handleSaveInspectionReport = () => {
    if (!selectedBin || !aiReportResult) return;

    const newInspection = {
      date: new Date().toISOString().split('T')[0],
      inspector: customInspectorName,
      defectsDetected: aiReportResult.detectedDefects,
      score: aiReportResult.healthScore,
      notes: aiReportResult.notes,
      state: aiReportResult.classification
    };

    const newPhoto = {
      date: new Date().toISOString().split('T')[0],
      url: selectedPresetImage.url,
      note: `Inspection Terrain - ${customInspectorName}. Risques : ${aiReportResult.detectedDefects.join(', ') || 'Néant'}`,
      classification: aiReportResult.classification
    };

    const updatedBins = bins.map(b => {
      if (b.id === selectedBin.id) {
        return {
          ...b,
          status: aiReportResult.classification as any,
          healthScore: aiReportResult.healthScore,
          estimatedLifespanMonths: aiReportResult.estimatedLifespanMonths,
          photoHistory: [newPhoto, ...b.photoHistory],
          inspections: [newInspection, ...b.inspections]
        };
      }
      return b;
    });

    setBins(updatedBins);
    
    // Auto-update matched subscriber bin level context if applicable
    const updatedModel = updatedBins.find(b => b.id === selectedBin.id);
    if (updatedModel && onUpdateSubscriber) {
      const relatedSub = subscribers.find(s => s.id === selectedBin.subscriberId);
      if (relatedSub) {
        onUpdateSubscriber({
          ...relatedSub,
          // simulated link or state marker
          currentBinLevel: aiReportResult.healthScore < 30 ? 90 : relatedSub.currentBinLevel
        });
      }
    }

    // Refresh display
    setSelectedBin(updatedModel || null);
    setIsCameraActive(false);
    setAiReportResult(null);
    setIsInspectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-brand-primary uppercase bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 tracking-wider inline-block">
            Salubrité Connectée • IoT RFID
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1.5 flex items-center gap-2">
            Gestion Avancée du Parc de Poubelles
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Vérification, QR Codes, géotagging et inspection robotique par IA embarquée</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 rounded-xl p-1 shrink-0 gap-1 self-start md:self-auto">
          <button 
            type="button"
            id="tab-roster-btn"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roster' 
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-250/20' 
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            📋 Liste des Bacs
          </button>
          <button 
            type="button"
            id="tab-inspection-btn"
            onClick={() => setActiveTab('inspection')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inspection' 
                ? 'bg-emerald-700 text-white shadow-xs font-black' 
                : 'text-amber-700 hover:text-amber-900 bg-amber-50 rounded-lg'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            Scanner & IA Inspect
          </button>
          <button 
            type="button"
            id="tab-analytics-btn"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-250/20' 
                : 'text-slate-600 hover:text-slate-900 bg-transparent'
            }`}
          >
            📊 Analyses Statologiques
          </button>
        </div>
      </div>

      {/* RENDER ROSTER & SPECIFIC DETAILS VIEW */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* List and search column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
              
              {/* Search + Filters row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-450" />
                  <input 
                    type="text"
                    id="bin-search-input"
                    placeholder="Chercher par code poubelle, propriétaire, secteur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-hidden font-medium"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select 
                    id="filter-status-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="all">Tous les États</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Bon">Bon</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Mauvais">Mauvais</option>
                    <option value="Critique">Critique</option>
                  </select>

                  <select 
                    id="filter-capacity-select"
                    value={capacityFilter}
                    onChange={(e) => setCapacityFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="all">Toutes Capacités</option>
                    <option value="240L">240 Litres</option>
                    <option value="360L">360 Litres</option>
                    <option value="1100L">1100 Litres</option>
                  </select>
                </div>
              </div>

              {/* Bins Table Ledger */}
              <div className="border border-slate-150 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-bold">
                      <th className="p-3">Référence Bac</th>
                      <th className="p-3">Propriétaire</th>
                      <th className="p-3">Volume</th>
                      <th className="p-3">Sécurisation</th>
                      <th className="p-3">Score de Vie</th>
                      <th className="p-3 text-center">État Général</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBins.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                          Aucune poubelle trouvée avec ces spécifications de filtrage.
                        </td>
                      </tr>
                    ) : (
                      filteredBins.map((bin) => {
                        const isSelected = selectedBin?.id === bin.id;
                        
                        // Color styling for status pill
                        const statusColors = {
                          Excellent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          Bon: 'bg-green-50 text-green-800 border-green-200',
                          Moyen: 'bg-amber-50 text-amber-800 border-amber-200',
                          Mauvais: 'bg-red-50 text-red-800 border-red-200',
                          Critique: 'bg-red-950/10 text-red-900 border-red-350'
                        };

                        return (
                          <tr 
                            key={bin.id}
                            onClick={() => setSelectedBin(bin)}
                            className={`border-b border-slate-100 hover:bg-slate-50/70 transition cursor-pointer ${
                              isSelected ? 'bg-emerald-50/20 shadow-xs border-l-4 border-l-emerald-600' : ''
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <QrCode className="h-3.5 w-3.5 text-slate-400" />
                                <span>{bin.id}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div>
                                <div className="font-bold text-slate-800">{bin.subscriberName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{bin.neighborhood}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                                {bin.capacity}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-500">
                              <span className="text-[10px] bg-sky-50 text-sky-800 px-1.5 py-0.5 border border-sky-100 rounded">
                                RFID Scellé
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      bin.healthScore > 80 ? 'bg-emerald-600' :
                                      bin.healthScore > 50 ? 'bg-amber-500' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${bin.healthScore}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[10px]">{bin.healthScore}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 border text-[10px] rounded-full font-bold inline-block ${statusColors[bin.status]}`}>
                                {bin.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button 
                                type="button"
                                className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] hover:underline flex items-center gap-0.5 ml-auto"
                              >
                                Défiler <ChevronRight className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Detailed inspection pane */}
          <div className="lg:col-span-1 space-y-4">
            {selectedBin ? (
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-5 text-left transition duration-300">
                
                {/* Header Information */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">Rattaché RFID : {selectedBin.qrCode}</span>
                      <h3 className="font-extrabold text-sm text-slate-800 mt-0.5">{selectedBin.id}</h3>
                    </div>
                    <span className="p-2 bg-slate-100 rounded-xl">
                      <QrCode className="h-5 w-5 text-emerald-800" />
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Propriétaire</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <User className="h-3 w-3 text-emerald-700 shrink-0" />
                        <span className="truncate">{selectedBin.subscriberName}</span>
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[9px] text-slate-400 block font-semibold uppercase">Zone Géo (Abidjan)</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                        <span>{selectedBin.neighborhood}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Core Parameters Stack */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Spécifications Mécaniques</h4>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Modèle Capacité:</span>
                      <p className="font-bold mt-0.5" id="spec-capacity-val">{selectedBin.capacity}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Couleur Cuve:</span>
                      <p className="font-bold mt-0.5">{selectedBin.color}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium font-sans">Tri Sélectif/Usage:</span>
                      <p className="font-semibold mt-0.5 text-slate-600">{selectedBin.type}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Mise en Service:</span>
                      <p className="font-bold mt-0.5">{selectedBin.acquisitionDate}</p>
                    </div>
                  </div>
                </div>

                {/* Health Rating Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Santé de la Poubelle</span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full ${
                      selectedBin.healthScore > 80 ? 'bg-emerald-150 text-emerald-800' :
                      selectedBin.healthScore > 50 ? 'bg-amber-150 text-amber-800' : 'bg-red-150 text-red-800'
                    }`}>
                      {selectedBin.healthScore} / 100
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        selectedBin.healthScore > 80 ? 'bg-emerald-600' :
                        selectedBin.healthScore > 50 ? 'bg-amber-500' : 'bg-red-650'
                      }`}
                      style={{ width: `${selectedBin.healthScore}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Vie restante :</span>
                    </div>
                    <span className="font-bold text-slate-700 text-right">{selectedBin.estimatedLifespanMonths} Mois (est.)</span>
                  </div>
                </div>

                {/* Photo History Timeline */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Dossier Historique Photos</h4>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('inspection')}
                      className="text-xs text-brand-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      Prendre Photo
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {selectedBin.photoHistory.map((ph, idx) => (
                      <div key={idx} className="flex gap-2.5 bg-slate-50 hover:bg-slate-100/60 p-2 rounded-xl border border-slate-150 text-xs">
                        <img 
                          src={ph.url} 
                          alt="Surveillance Poubelle" 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[10px] text-slate-400 font-mono">{ph.date}</span>
                            <span className="text-[9px] bg-slate-200 font-bold px-1.5 rounded-sm">{ph.classification}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate" title={ph.note}>{ph.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inspections History Stack */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inspections de Salubrité Physique</h4>
                  
                  <div className="space-y-2.5">
                    {selectedBin.inspections.map((ins, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/5 text-slate-600 rounded-xl border border-dashed border-slate-200 text-xs text-left space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 font-mono">{ins.date}</span>
                          <span className="font-semibold text-emerald-800 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">Score: {ins.score}%</span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic">" {ins.notes} "</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                          <span>Inspecteur: <strong className="text-slate-600 font-semibold">{ins.inspector}</strong></span>
                          <span>{ins.defectsDetected.length > 0 ? `${ins.defectsDetected.length} anomalies` : 'Conforme'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-medium">
                Veuillez sélectionner un bac d'ordures dans la liste à gauche pour consulter son profil technique et d'audit.
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER DYNAMIC SCREEN: SCANNER ET IA INSPECT */}
      {activeTab === 'inspection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Simulated Camera Scanner */}
          <div className="lg:col-span-7 bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4 text-left">
            <div>
              <h3 className="font-extrabold text-slate-800 text-md">Terminal d'Inspection Optique AKPBF IA</h3>
              <p className="text-xs text-slate-400">Sélectionnez une situation de dégradation pour simuler l'inspection terrain par webcam / caméra intégrée</p>
            </div>

            {/* Target Bin selector input */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-600 block pl-0.5">1. Sélectionner la poubelle cible à auditer</label>
              <select 
                id="select-target-bin-inspection"
                value={selectedBin?.id || ''}
                onChange={(e) => {
                  const target = bins.find(b => b.id === e.target.value);
                  if (target) setSelectedBin(target);
                }}
                className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
              >
                {bins.map(b => (
                  <option key={b.id} value={b.id}>{b.id} ({b.subscriberName} — {b.neighborhood})</option>
                ))}
              </select>
            </div>

            {/* Photo presets representing standard defects requested by the user */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-600 block pl-0.5">2. Choisir la photo diagnostique à charger dans le capteur</label>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {BIN_DAMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetImage(preset);
                      setAiReportResult(null);
                    }}
                    className={`p-1.5 rounded-xl border-2 text-left space-y-1 transition duration-150 group cursor-pointer ${
                      selectedPresetImage.id === preset.id 
                        ? 'border-emerald-600 bg-emerald-50/10' 
                        : 'border-slate-150 hover:border-slate-350 bg-slate-50'
                    }`}
                  >
                    <div className="h-14 overflow-hidden rounded-lg relative">
                      <img 
                        src={preset.url} 
                        alt={preset.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      {preset.defects.length > 0 && (
                        <span className="absolute bottom-1 right-1 bg-red-650 text-white text-[8px] px-1 rounded-sm font-bold animate-pulse">
                          DÉFAUT
                        </span>
                      )}
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-700 block truncate leading-tight pr-0.5">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive camera view screen */}
            <div className="relative aspect-video w-full rounded-2xl bg-zinc-900 border-4 border-slate-800 overflow-hidden flex flex-col items-center justify-center">
              
              {/* Photo background */}
              <img 
                src={selectedPresetImage.url} 
                alt="Camera Lens Feed" 
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-85"
              />

              {/* Bounding Boxes HUD overlay when AI finished and defects found */}
              {aiReportResult && aiReportResult.detectedDefects.length > 0 && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Wheel bounding box if wheel damage is selected */}
                  {selectedPresetImage.id === 'wheel-broken' && (
                    <div className="absolute border-4 border-red-500 bg-red-500/10 rounded-lg p-1.5 animate-pulse" style={{ bottom: '15%', left: '35%', width: '35%', height: '35%' }}>
                      <span className="bg-red-600 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded leading-none absolute -top-5 left-0">
                        ROUE ENCRASSÉE / ABSENTE (94.2% Confiance)
                      </span>
                    </div>
                  )}

                  {/* Lid bounding box if lid is broken */}
                  {selectedPresetImage.id === 'lid-broken' && (
                    <div className="absolute border-4 border-orange-500 bg-orange-500/10 rounded-lg p-1.5 animate-pulse" style={{ top: '10%', left: '20%', width: '60%', height: '40%' }}>
                      <span className="bg-orange-600 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded leading-none absolute -top-5 left-0">
                        COUVERCLE ARRACHÉ / CHARNIÈRES BRISÉES (98.7% Confiance)
                      </span>
                    </div>
                  )}

                  {/* Crack bounding box if crack-heavy */}
                  {selectedPresetImage.id === 'crack-heavy' && (
                    <div className="absolute border-4 border-red-600 bg-red-600/10 rounded-lg p-1.5 animate-pulse" style={{ top: '25%', left: '40%', width: '25%', height: '55%' }}>
                      <span className="bg-red-700 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded leading-none absolute -top-5 left-0">
                        FISSURE APEX DE LA CUVE (89.1% Confiance)
                      </span>
                    </div>
                  )}

                  {/* Mild deformation */}
                  {selectedPresetImage.id === 'corroded-damaged' && (
                    <div className="absolute border-4 border-amber-500 bg-amber-500/10 rounded-lg p-1.5 animate-pulse" style={{ top: '15%', left: '25%', width: '50%', height: '60%' }}>
                      <span className="bg-amber-600 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded leading-none absolute -top-5 left-0">
                        DÉFORMATION PAR CHOC COMPRESSEUR (91.4% Confiance)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Lens HUD markings */}
              <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2 font-mono text-[8.5px] text-white/70">
                <div className="flex justify-between">
                  <span>REC [●] 2026-05-22</span>
                  <span>ISO 400 • F/2.8</span>
                </div>
                <div className="self-center flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold">
                  <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span>MODÈLE DÉTECTION AKPBF-VISION-V3</span>
                </div>
                <div className="flex justify-between">
                  <span>LAT: +5.3458</span>
                  <span>LNG: -3.9842</span>
                </div>
              </div>

              {/* Centered blinking shutter overlay */}
              {aiAnalyzing && (
                <div className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center space-y-3">
                  <Cpu className="h-8 w-8 text-brand-accent animate-spin" />
                  <p className="text-white text-xs font-bold tracking-widest animate-pulse font-mono">
                    ANALYSE VISION-IA EN COURS... [DÉTECTION ÉROSIONS ET CRASSE]
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons inside scanner block */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                <span>Diagnostic certifié UEMOA par Intelligence Artificielle</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  id="reset-lens-btn"
                  onClick={() => setAiReportResult(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Effacer
                </button>
                <button
                  type="button"
                  id="trigger-ai-inspect-btn"
                  onClick={handleStartAiInspection}
                  disabled={aiAnalyzing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-emerald-300 shrink-0" />
                  Analyser la Photo par l'IA
                </button>
              </div>
            </div>

          </div>

          {/* AI Diagnostic Result & Finalization */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
              
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest">Rapport Machine de l'IA</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Classification automatique d'intégrité de la poubelle</p>
              </div>

              {aiReportResult ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Big Grade classification visualizer */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Classification d'État</span>
                      <strong className={`text-lg font-black block mt-0.5 ${
                        aiReportResult.classification === 'Excellent' || aiReportResult.classification === 'Bon' ? 'text-emerald-700' :
                        aiReportResult.classification === 'Moyen' ? 'text-amber-600' : 'text-red-700'
                      }`}>
                        {aiReportResult.classification}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Coefficient de Fiabilité</span>
                      <strong className="text-md font-extrabold text-slate-700 font-mono">98.43 %</strong>
                    </div>
                  </div>

                  {/* Defects Detected pills */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Anomalies Détectées (Segmentations de Trame) :</span>
                    
                    {aiReportResult.detectedDefects.length === 0 ? (
                      <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Aucune fissure ou détérioration structurelle détectée sur la cuve.</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {aiReportResult.detectedDefects.map((df: string, i: number) => (
                          <span key={i} className="bg-red-50 text-red-800 text-[10px] font-bold px-2.5 py-1 border border-red-150 rounded-lg flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-650 shrink-0" />
                            {df}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lifetime impact estimations */}
                  <div className="space-y-3.5 bg-slate-50/50 p-4.5 rounded-xl border border-slate-150 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Nouveau Score de Vie :</span>
                      <strong className="text-slate-800 font-mono">{aiReportResult.healthScore} %</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Durée de vie résiduelle estimée :</span>
                      <strong className="text-slate-800 font-mono">{aiReportResult.estimatedLifespanMonths} Mois</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Remplacement exigé :</span>
                      <span className="font-bold text-slate-700">
                        {aiReportResult.healthScore < 30 ? '⚠️ IMMÉDIAT (Priorité Critique)' : 'N/A (Entretien Normal)'}
                      </span>
                    </div>

                    {/* Upsell recommendation engine related to the user requested up-selling triggers */}
                    {aiReportResult.healthScore < 40 && (
                      <div className="mt-3.5 p-3.5 bg-brand-primary/10 rounded-xl border border-emerald-250 animate-pulse text-xs text-slate-700 space-y-1.5 leading-normal">
                        <div className="flex items-center gap-1 text-emerald-800 font-black">
                          <Sparkles className="h-4 w-4 text-emerald-600" />
                          <span>Opportunité d'Upsell Détectée</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Cet abonné possède un bac inférieur ou à l'agonie. AKPBF recommande de lui envoyer une offre SMS d'acquisition pour un nouveau **Bac Premium de 360L** à prix d'usine municipal de Côte d'Ivoire.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Custom Inspector Credentials Form */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase">Signature de l'Inspecteur Terrain</label>
                    <input 
                      type="text"
                      id="inspector-name-input"
                      value={customInspectorName}
                      onChange={(e) => setCustomInspectorName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 outline-hidden focus:ring-1 focus:ring-emerald-500 rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>

                  {/* Trigger Save */}
                  <button
                    type="button"
                    id="save-ai-inspection-report-btn"
                    onClick={handleSaveInspectionReport}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Valider et Enregistrer l'Inspection dans la Fiche Poubelle
                  </button>

                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2.5">
                  <Cpu className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-medium">En attente de transmission du flux de caméra...</p>
                  <p className="text-[10px] text-slate-400">Cliquez sur "Analyser la Photo par l'IA" à gauche pour générer instantanément l'analyse de vision par ordinateur.</p>
                </div>
              )}

            </div>
          </div>

        </div>
      )}

      {/* RENDER ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300 text-left">
          
          {/* Status breakdown bar chart */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Répartition d'État Visuel d'Intégrité</h3>
              <p className="text-xs text-slate-400">Répartition quantitative des bacs municipaux recensés AKPBF</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {healthStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sizing capacities metrics */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Inventaire par Modèles/Capacités</h3>
              <p className="text-xs text-slate-400">Totalité des volumes circulants des foyers civils et industriels d'AKPBF</p>
            </div>

            <div className="space-y-4">
              {capacityStats.map((stat, i) => {
                const totalBins = bins.length || 1;
                const percentage = Math.round((stat.volume / totalBins) * 100);

                return (
                  <div key={i} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600 font-medium">
                      <span>{stat.name}</span>
                      <span className="font-bold text-slate-800">{stat.volume} Bacs ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: stat.color }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 bg-emerald-50/5 p-3 rounded-lg leading-relaxed">
                <Info className="h-4.5 w-4.5 text-emerald-700 shrink-0" />
                <p>
                  Les conteneurs de **1100 Litres** sont principalement livrés aux clients commerciaux et industriels de Marcory-Zone 4, tandis que Yopougon est majoritairement équipé en bacs standard de **240 Litres**.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
