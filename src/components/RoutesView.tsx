/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  Truck, 
  MapPin, 
  Play, 
  Loader2, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  User, 
  Plus, 
  X,
  Map 
} from 'lucide-react';
import { Route, Subscriber, CollectorAgent } from '../types';

interface RoutesViewProps {
  routes: Route[];
  subscribers: Subscriber[];
  agents: CollectorAgent[];
  onAddRoute: (newRoute: Route) => void;
  onUpdateRoute: (updatedRoute: Route) => void;
  onUpdateSubscriberBin: (id: string, level: number) => void;
  onUpdateAgentCollected: (id: string, addedKg: number) => void;
}

export default function RoutesView({
  routes,
  subscribers,
  agents,
  onAddRoute,
  onUpdateRoute,
  onUpdateSubscriberBin,
  onUpdateAgentCollected
}: RoutesViewProps) {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [simStops, setSimStops] = useState<Subscriber[]>([]);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Modal for new route
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteSector, setNewRouteSector] = useState('Cocody');
  const [newRouteAgentId, setNewRouteAgentId] = useState('');

  // Auto-selection of a route to highlight upon loading
  useEffect(() => {
    if (routes.length > 0 && !selectedRoute) {
      setSelectedRoute(routes[0]);
    }
  }, [routes, selectedRoute]);

  const activeStops = selectedRoute 
    ? subscribers.filter(s => s.neighborhood === selectedRoute.sector && s.status === 'active')
    : [];

  // Launch simulated collection sequence
  const startSimulation = () => {
    if (!selectedRoute) return;
    
    // Set active route status
    const updatedRoute: Route = { ...selectedRoute, status: 'active', completedStopsCount: 0 };
    onUpdateRoute(updatedRoute);
    setSelectedRoute(updatedRoute);

    setIsSimulating(true);
    setSimulationStep(0);
    setSimStops(activeStops);
    setLogMessages([
      `🚚 Démarrage de la simulation pour : ${selectedRoute.name}`,
      `📡 Camion compacteur connecté au central municipal AKPBF`,
      `🗺️ Itinéraire optimisé calculé via moteur SIG. ${activeStops.length} points d'arrêt.`
    ]);
  };

  // Run the physics/simulation intervals
  useEffect(() => {
    if (!isSimulating || simStops.length === 0) return;

    const totalSteps = simStops.length;
    if (simulationStep >= totalSteps) {
      // Simulation finished
      setIsSimulating(false);
      
      if (selectedRoute) {
        const updatedRoute: Route = { 
          ...selectedRoute, 
          status: 'completed', 
          completedStopsCount: totalSteps 
        };
        onUpdateRoute(updatedRoute);
        setSelectedRoute(updatedRoute);

        // Update active agent collected weight statistics
        if (selectedRoute.agentId) {
          const estimatedWeightCollected = totalSteps * 450 + Math.floor(Math.random() * 200); 
          onUpdateAgentCollected(selectedRoute.agentId, estimatedWeightCollected);
        }

        setLogMessages(prev => [
          ...prev,
          `🏁 TOURNÉE ACCOMPLIE AVEC SUCCÈS !`,
          `♻️ Dépot de déchetterie validé et pesé.`,
          `📢 SMS/Email automatiques envoyés aux abonnés collectés.`
        ]);
      }
      return;
    }

    const timer = setTimeout(() => {
      const activeStop = simStops[simulationStep];
      
      // Empty his bin in local state
      onUpdateSubscriberBin(activeStop.id, 0);

      // Add log
      setLogMessages(prev => [
        ...prev,
        `📍 Arrêt [${simulationStep + 1}/${totalSteps}] : Résidence ${activeStop.name} à ${activeStop.address}`,
        `  ├ Bac ${activeStop.binType} vidé (Niveau réduit de ${activeStop.currentBinLevel}% à 0%)`,
        `  └ Statut validé • Enregistreur RFID émargé`
      ]);

      // Update completed stops count
      if (selectedRoute) {
        onUpdateRoute({
          ...selectedRoute,
          completedStopsCount: simulationStep + 1
        });
      }

      setSimulationStep(prev => prev + 1);
    }, 4000); // 4 seconds per stop

    return () => clearTimeout(timer);
  }, [isSimulating, simulationStep, simStops]);

  // Handle route creation
  const handleCreateRoute = (e: FormEvent) => {
    e.preventDefault();
    if (!newRouteName) return;

    const assignedAgent = agents.find(a => a.id === newRouteAgentId);
    
    // Count stops
    const stopsCount = subscribers.filter(s => s.neighborhood === newRouteSector && s.status === 'active').length;

    const newRte: Route = {
      id: `RTE-${Math.floor(10 + Math.random() * 90)}`,
      name: newRouteName,
      sector: newRouteSector,
      agentId: newRouteAgentId || null,
      agentName: assignedAgent ? assignedAgent.name : null,
      status: 'draft',
      stopsCount,
      completedStopsCount: 0
    };

    onAddRoute(newRte);
    setSelectedRoute(newRte);
    setIsAddOpen(false);
    setNewRouteName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">SIG ─ Planification de Tournées de Collecte</h2>
          <p className="text-slate-500 text-sm mt-0.5">Optimisation géographique des passages de camions et géolocalisation des ordures</p>
        </div>
        <button 
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-center bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Planifier Nouvelle Tournée
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Route registry list & assignment details */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Navigation className="h-4.5 w-4.5 text-emerald-600" />
              Raccords de Tournées Actives
            </h3>

            <div className="space-y-2.5">
              {routes.map(rte => {
                const isActive = selectedRoute?.id === rte.id;
                return (
                  <div 
                    key={rte.id}
                    onClick={() => !isSimulating && setSelectedRoute(rte)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                      isActive 
                        ? 'bg-emerald-50/40 border-emerald-400 text-emerald-950 shadow-xs' 
                        : 'bg-white border-slate-200/60 hover:bg-slate-50/70 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${isActive ? 'bg-emerald-200/60 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>{rte.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          rte.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          rte.status === 'active' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {rte.status === 'completed' ? 'Achevée' : rte.status === 'active' ? 'En Cours' : 'À planifier'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-2.5">{rte.name}</h4>
                      <div className="flex gap-4 text-[10px] text-slate-400 mt-1">
                        <span>Secteur: <strong>{rte.sector}</strong></span>
                        <span>Stops: <strong>{rte.stopsCount}</strong></span>
                      </div>
                    </div>

                    <div className="border-t border-slate-150/40 pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Chauffeur :</span>
                      <span className="font-semibold text-slate-800">{rte.agentName || 'Non Assigné'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active stats panel of details */}
          {selectedRoute && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3.5 shadow-md">
              <h4 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider">Données Opérationnelles</h4>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-semibold">Territoire Métropolitain :</span>
                  <span className="font-bold">{selectedRoute.sector}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-semibold">Équipage Mobilisé :</span>
                  <span className="font-bold text-slate-200">{selectedRoute.agentName || 'Non affecté'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-semibold">Points d'Arrêts (Bacs) :</span>
                  <span className="font-bold font-mono text-emerald-300">{activeStops.length} foyers</span>
                </div>
                {selectedRoute.status === 'active' && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between font-bold text-[10px] text-amber-400">
                      <span>Progression Collecte en cours :</span>
                      <span>{Math.round((simulationStep / activeStops.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden font-bold">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${(simulationStep / activeStops.length) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {selectedRoute.status !== 'active' && activeStops.length > 0 && !isSimulating && (
                <button 
                  type="button"
                  onClick={startSimulation}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 transition text-white px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Démarrer le Camion de Collecte
                </button>
              )}

              {isSimulating && (
                <div className="bg-slate-800 p-2.5 rounded-xl text-[11px] text-amber-300 flex items-center justify-center gap-2 font-bold select-none">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  Collecte en cours d'avancement...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center/Right: Interactive GIS Map and logs board */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* GIS Interactive Simulator Canvas Map */}
          <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-xs flex flex-col hover:shadow-md transition duration-200">
            <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <Map className="h-4.5 w-4.5 text-indigo-500" />
                <h3 className="font-extrabold text-sm">Console SIG Interactive d'Abidjan (AKPBF Sim)</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Territoire Actif : <strong>{selectedRoute?.sector || 'Aucun'}</strong></span>
            </div>

            {/* Simulated Geographic Canvas Map Render */}
            <div className="relative h-[280px] bg-slate-100 overflow-hidden select-none">
              
              {/* Background Roads Grid Representation */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-40">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-indigo-200/50" />
                ))}
              </div>

              {/* Fake main roads */}
              <div className="absolute top-1/2 left-0 w-full h-4 bg-slate-50 opacity-90 border-y border-slate-300 pointer-events-none transform -translate-y-1/2 flex items-center justify-center">
                <span className="text-[8px] tracking-widest text-slate-400 font-bold uppercase">Boulevard de la Salubrité</span>
              </div>
              <div className="absolute top-0 left-1/3 w-4 h-full bg-slate-50 opacity-90 border-x border-slate-300 pointer-events-none flex items-center justify-center">
                <span className="text-[8px] tracking-widest text-slate-400 font-bold uppercase transform -rotate-90 whitespace-nowrap">Avenue des Bacs</span>
              </div>
              <div className="absolute top-0 left-2/3 w-4 h-full bg-slate-50 opacity-90 border-x border-slate-300 pointer-events-none flex items-center justify-center">
                <span className="text-[8px] tracking-widest text-slate-400 font-bold uppercase transform -rotate-90 whitespace-nowrap">Avenue des Cocotiers</span>
              </div>

              {/* Houses and subscribers nodes positions inside this block sector */}
              {activeStops.map((stop, index) => {
                // Determine layout coordinates dynamically
                // Map lat/lng linearly to fits the canvas boxes nicely
                let normX = 100 + ((stop.lng + 4.1) * 3500);
                let normY = 220 - ((stop.lat - 5.28) * 3500);

                // Bound check values to prevent overflowing out of canvas container coordinates
                if (normX < 40) normX = 40 + (index * 60);
                if (normX > 480) normX = 480 - (index * 40);
                if (normY < 40) normY = 40 + (index * 50);
                if (normY > 240) normY = 240 - (index * 30);

                // Is the garbage truck currently dealing with this index?
                const isUnderCollection = isSimulating && simulationStep === index;
                const isAlreadyCollected = isSimulating && simulationStep > index;

                return (
                  <div 
                    key={stop.id}
                    className="absolute transition-all duration-500 ease-out"
                    style={{ left: `${normX}px`, top: `${normY}px` }}
                  >
                    <div className="relative group flex flex-col items-center">
                      
                      {/* Range Circle alert indicator */}
                      {stop.currentBinLevel >= 80 && !isAlreadyCollected && (
                        <div className="absolute w-12 h-12 bg-rose-500/20 rounded-full animate-ping pointer-events-none" />
                      )}

                      {/* Bin Status Node color marker */}
                      <div className={`p-1.5 rounded-lg border shadow-sm transition duration-300 flex items-center justify-center ${
                        isAlreadyCollected ? 'bg-emerald-500 text-white border-emerald-600 scale-90' :
                        isUnderCollection ? 'bg-amber-400 text-slate-900 border-amber-600 scale-110 rotate-12 ring-2 ring-amber-500' :
                        stop.currentBinLevel >= 80 ? 'bg-rose-50 text-rose-800 border-rose-300' : 
                        stop.currentBinLevel >= 50 ? 'bg-amber-5 text-amber-800 border-amber-300' : 
                        'bg-indigo-5 text-indigo-800 border-indigo-200'
                      }`}>
                        <MapPin className="h-4.5 w-4.5" />
                      </div>

                      {/* Tooltip detail block */}
                      <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[9px] p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-30 shadow-md">
                        <span className="font-bold">{stop.name}</span>
                        <div className="mt-0.5">Bac: {stop.currentBinLevel}% chargé • {stop.binType}</div>
                      </div>

                      {/* Mini indicator labels block */}
                      <span className="text-[8px] bg-slate-800/80 text-white font-bold px-1 rounded-sm mt-1 block">
                        {stop.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Collector Truck moving Simulation Overlay */}
              {isSimulating && simStops[simulationStep] && (
                <div 
                  className="absolute p-2 bg-slate-900 rounded-full text-amber-400 border border-slate-700 shadow-lg z-20 transition-all duration-1000 ease-out flex items-center justify-center"
                  style={{
                    // Travel truck target slightly close to active step destination coordinates
                    left: `${
                      100 + ((simStops[simulationStep].lng + 4.1) * 3500) < 40 ? 50 : 25 + (100 + ((simStops[simulationStep].lng + 4.1) * 3500))
                    }px`,
                    top: `${
                      220 - ((simStops[simulationStep].lat - 5.28) * 3500) < 40 ? 50 : 220 - ((simStops[simulationStep].lat - 5.28) * 3500)
                    }px`
                  }}
                >
                  <Truck className="h-6 w-6 animate-bounce" />
                </div>
              )}

              {/* Sector description layout overlay legend */}
              <div className="absolute bottom-3 left-3 bg-white/90 border border-slate-200/80 p-2 rounded-lg text-[9px] text-slate-600 space-y-1.5 shrink-0 z-10 font-bold backdrop-blur-xs">
                <span className="uppercase text-slate-400 font-extrabold tracking-wider">Légende Capteurs SIG</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span>Trait d'arrêt Vidé / Nettoyé</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                  <span>Bac Critique Exigible (&gt; 80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  <span>Poubelle ménagère Standard (gérable)</span>
                </div>
              </div>
            </div>

            {/* Simulated Live Logs terminal panel */}
            <div className="bg-slate-950 text-slate-300 p-4 font-mono text-[10.5px] h-[160px] overflow-y-auto space-y-1.5 border-t border-slate-900">
              <span className="text-amber-400 font-semibold uppercase text-[9px] tracking-wider block border-b border-slate-900 pb-1">Logs Opérationnels de la Tournée</span>
              
              {logMessages.length === 0 ? (
                <span className="text-slate-500 block italic py-2">Prêt. Lancez une simulation pour observer la prise de capteur logistique...</span>
              ) : (
                logMessages.map((msg, i) => (
                  <div key={i} className="leading-relaxed whitespace-pre-line">{msg}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NEW TOUR PLANNER FORM */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-indigo-650 p-4.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                <h3 className="font-bold">Créer une Tournée de Collecte</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-indigo-200 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Intitulé Logistique de la Tournée *</label>
                <input 
                  type="text"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                  placeholder="Ex: Tournée Matinale Plateau-Centre"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-700 text-xs rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Secteur Géographique (Ville) *</label>
                <select 
                  value={newRouteSector}
                  onChange={(e) => setNewRouteSector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-700 text-xs rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="Cocody">Cocody</option>
                  <option value="Plateau">Plateau</option>
                  <option value="Marcory">Marcory</option>
                  <option value="Yopougon">Yopougon</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Affecter un Agent de Collecte d'Équipage</label>
                <select 
                  value={newRouteAgentId}
                  onChange={(e) => setNewRouteAgentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-700 text-xs rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choisir un agent disponible --</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.activeVehicle.split(' ')[0]})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 text-xs">
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition"
                >
                  Créer et Rattacher SIG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
