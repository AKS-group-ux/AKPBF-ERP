/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Compass, 
  MapPin, 
  Truck, 
  Navigation, 
  Activity, 
  Eye, 
  Trash2, 
  Wifi, 
  Sliders, 
  RefreshCw,
  Zap,
  Gauge,
  Info
} from 'lucide-react';
import { Subscriber, CollectorAgent } from '../types';

interface GpsMapViewProps {
  subscribers: Subscriber[];
  agents: CollectorAgent[];
}

export default function GpsMapView({ subscribers, agents }: GpsMapViewProps) {
  const [selectedSector, setSelectedSector] = useState('All');
  const [activeTruckId, setActiveTruckId] = useState<string | null>(null);
  
  // Real-time moving truck offsets simulation
  const [timestamp, setTimestamp] = useState(new Date());
  const [truckSpeeds, setTruckSpeeds] = useState<{ [key: string]: number }>({});
  const [truckFuel, setTruckFuel] = useState<{ [key: string]: number }>({});
  const [truckCoordinates, setTruckCoordinates] = useState<{ [key: string]: { lat: number; lng: number } }>({});

  const sectorCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'Cocody': { lat: 5.3524, lng: -3.9875 },
    'Plateau': { lat: 5.3211, lng: -4.0198 },
    'Marcory': { lat: 5.2952, lng: -3.9781 },
    'Yopougon': { lat: 5.3344, lng: -4.0851 }
  };

  // Initialize and simulate telemetry state transitions
  useEffect(() => {
    // Initial coordinates set slightly offset
    const initialCoords: { [key: string]: { lat: number; lng: number } } = {};
    const initialSpeeds: { [key: string]: number } = {};
    const initialFuel: { [key: string]: number } = {};

    agents.forEach(a => {
      const sector = a.id === 'AGT-001' ? 'Cocody' : a.id === 'AGT-002' ? 'Plateau' : 'Marcory';
      const base = sectorCoordinates[sector];
      initialCoords[a.id] = { 
        lat: base.lat + (Math.random() - 0.5) * 0.015,
        lng: base.lng + (Math.random() - 0.5) * 0.015 
      };
      initialSpeeds[a.id] = Math.floor(30 + Math.random() * 25);
      initialFuel[a.id] = Math.floor(70 + Math.random() * 25);
    });

    setTruckCoordinates(initialCoords);
    setTruckSpeeds(initialSpeeds);
    setTruckFuel(initialFuel);

    if (agents.length > 0) {
      setActiveTruckId(agents[0].id);
    }
  }, [agents]);

  // Telemetry updates interval
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date());

      // Walk coordinates slightly to simulate motion
      setTruckCoordinates(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = {
            lat: next[id].lat + (Math.random() - 0.5) * 0.0008,
            lng: next[id].lng + (Math.random() - 0.5) * 0.0008
          };
        });
        return next;
      });

      // Fluctuate speeds and reduce fuel slowly
      setTruckSpeeds(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          const delta = Math.floor((Math.random() - 0.5) * 10);
          next[id] = Math.max(0, Math.min(80, (prev[id] || 40) + delta));
        });
        return next;
      });

      setTruckFuel(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = Math.max(5, (prev[id] || 80) - (Math.random() > 0.7 ? 1 : 0));
        });
        return next;
      });

    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const filteredSubscribers = subscribers.filter(s => {
    return selectedSector === 'All' || s.neighborhood === selectedSector;
  });

  const selectedTruckDetails = agents.find(a => a.id === activeTruckId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Carte GPS & Télémétrie Live</h2>
          <p className="text-slate-500 text-sm mt-0.5">Géolocalisation en direct de la flotte municipale et monitoring spatial des bacs connectés</p>
        </div>

        <div className="flex items-center gap-2.5">
          <select 
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-white border border-slate-200 p-2.5 text-xs font-bold rounded-xl cursor-pointer"
          >
            <option value="All">Tout Abidjan (SIG)</option>
            <option value="Cocody">Secteur Cocody</option>
            <option value="Plateau">Secteur Plateau</option>
            <option value="Marcory">Secteur Marcory</option>
            <option value="Yopougon">Secteur Yopougon</option>
          </select>

          <button 
            onClick={() => {
              alert("📡 Rapprochement GPS calibré avec les satellites de voirie municipaux.");
            }}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition"
            title="Recalibrer les GPS"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left widget: active truck telemetry info panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
              Véhicules de salubrité Live
            </h3>

            <div className="space-y-2.5">
              {agents.map((agent) => {
                const isSelected = activeTruckId === agent.id;
                const speed = truckSpeeds[agent.id] ?? 45;
                const fuel = truckFuel[agent.id] ?? 82;
                return (
                  <div 
                    key={agent.id}
                    onClick={() => setActiveTruckId(agent.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                      isSelected 
                        ? 'bg-indigo-50/40 border-indigo-400 text-slate-900' 
                        : 'bg-white border-slate-150 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                        <Truck className={`h-4.5 w-4.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{agent.name.split(' ')[0]}</span>
                      </div>
                      <span className="font-mono text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {agent.licensePlate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                      <div>Vitesse : <span className="font-mono text-slate-900">{speed} km/h</span></div>
                      <div>Carburant : <span className="font-mono text-slate-900">{fuel}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedTruckDetails && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Télémétrie active</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Équipage Chauffeur :</span>
                  <div className="font-bold text-sm text-slate-100">{selectedTruckDetails.name}</div>
                </div>
                <div>
                  <span className="text-slate-400">Modèle Tasseuse :</span>
                  <div className="font-bold font-mono text-[11px] text-slate-200">{selectedTruckDetails.activeVehicle}</div>
                </div>
                
                <div className="border-t border-slate-800 pt-3.5 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Vitesse instantanée :</span>
                    <span className="font-bold font-mono text-indigo-400">{truckSpeeds[selectedTruckDetails.id] || 45} Km/h</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Autonomie Diesel :</span>
                    <span className="font-bold font-mono text-amber-400">{truckFuel[selectedTruckDetails.id] || 78}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Poids Total Collecté :</span>
                    <span className="font-bold font-mono text-emerald-400">{selectedTruckDetails.totalCollectedKg.toLocaleString()} kg</span>
                  </div>
                  {truckCoordinates[selectedTruckDetails.id] && (
                    <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60 leading-normal">
                      SATELLITE : {truckCoordinates[selectedTruckDetails.id].lat.toFixed(5)} Lat , {truckCoordinates[selectedTruckDetails.id].lng.toFixed(5)} Lng
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center/Right: Full Screen Map telemetry board */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[480px]">
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <Compass className="h-4.5 w-4.5 text-emerald-600 animate-spin" />
                <h3 className="font-extrabold text-sm">Moniteur de Veille Géographique d'Abidjan (Démonstrateur)</h3>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono">Simul: {timestamp.toLocaleTimeString()}</span>
            </div>

            {/* GPS Screen Canvas renderer */}
            <div className="relative flex-1 bg-slate-900 overflow-hidden text-white">
              
              {/* Background Geographic coordinates lines grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-20 pointer-events-none">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-r border-b border-indigo-500/30 font-mono text-[8px] p-1 text-indigo-400">
                    {i % 4 === 0 && `${(5.3 + (i * 0.001)).toFixed(3)}N`}
                  </div>
                ))}
              </div>

              {/* Geographic road network layers */}
              <div className="absolute top-1/4 left-0 w-full h-1 bg-slate-800 opacity-60 pointer-events-none" />
              <div className="absolute top-2/3 left-0 w-full h-1.5 bg-slate-800 opacity-60 pointer-events-none" />
              <div className="absolute top-0 left-1/4 w-1.5 h-full bg-slate-800 opacity-60 pointer-events-none" />
              <div className="absolute top-0 left-3/4 w-1.5 h-full bg-slate-800 opacity-60 pointer-events-none" />

              {/* Loop and draw subscribers on map coordinates */}
              {filteredSubscribers.map((sub, idx) => {
                // Linearly project coordinates to screen view percentage
                let leftPercent = 20 + ((sub.lng + 4.15) * 600);
                let topPercent = 80 - ((sub.lat - 5.25) * 600);

                // Safe boundaries checks
                leftPercent = Math.max(10, Math.min(90, leftPercent));
                topPercent = Math.max(10, Math.min(80, topPercent));

                const isCritical = sub.currentBinLevel >= 80;

                return (
                  <div 
                    key={sub.id} 
                    className="absolute scale-90 duration-500 ease"
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  >
                    <div className="group relative flex flex-col items-center select-none">
                      {isCritical && (
                        <span className="absolute w-7 h-7 bg-rose-500/40 rounded-full animate-ping pointer-events-none" />
                      )}

                      <div className={`p-1.5 rounded-lg border shadow-md transition cursor-pointer ${
                        isCritical 
                          ? 'bg-rose-600 border-rose-500 text-white animate-bounce' 
                          : sub.currentBinLevel >= 50 
                            ? 'bg-amber-500 border-amber-400 text-white'
                            : 'bg-emerald-600 border-emerald-500 text-white'
                      }`}
                      title={`${sub.name} (Bac Rempli à: ${sub.currentBinLevel}%)`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </div>

                      {/* House detailed info overlay label */}
                      <div className="absolute top-full mt-1 bg-slate-800 text-[9px] font-semibold text-slate-100 p-1 rounded-sm z-30 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        <strong>{sub.name}</strong> • Bac : {sub.currentBinLevel}%
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loop and draw moving active trucks */}
              {agents.map((agent) => {
                const coord = truckCoordinates[agent.id];
                if (!coord) return null;

                // Linearly project coordinates to screen view percentage
                let leftPercent = 20 + ((coord.lng + 4.15) * 600);
                let topPercent = 80 - ((coord.lat - 5.25) * 600);

                leftPercent = Math.max(15, Math.min(85, leftPercent));
                topPercent = Math.max(15, Math.min(75, topPercent));

                const isSelected = activeTruckId === agent.id;

                return (
                  <div
                    key={agent.id}
                    className="absolute transition-all duration-1000 ease-out z-20"
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                  >
                    <div className="relative flex flex-col items-center">
                      <div 
                        onClick={() => setActiveTruckId(agent.id)}
                        className={`p-2 rounded-full border shadow-xl transition cursor-pointer flex items-center justify-center ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-400 text-white scale-125 ring-4 ring-indigo-500/40' 
                            : 'bg-slate-850 border-slate-700 text-indigo-400'
                        }`}
                      >
                        <Truck className="h-4.5 w-4.5" />
                      </div>

                      <span className="bg-slate-900 border border-slate-700 text-[8px] font-black uppercase text-white px-1.5 py-0.5 rounded-sm mt-1 block">
                        🚚 {agent.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Geographic Legend inside the black background canvas */}
              <div className="absolute bottom-4 right-4 bg-slate-950/95 border border-slate-800 p-3.5 rounded-xl text-[9px] space-y-2 shrink-0 z-30 font-bold max-w-sm pointer-events-none text-slate-300">
                <span className="uppercase text-slate-500 font-extrabold tracking-wider block">Légende GPS AKPBF</span>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-indigo-600 text-white"><Truck className="h-3 w-3" /></div>
                  <span>Camion benne d'équipage municipal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-600 border border-rose-500 rounded flex items-center justify-center text-white"><Trash2 className="h-2.5 w-2.5" /></div>
                  <span>Abonné actif - Alarme Vidage critique (&gt; 80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-600 border border-emerald-500 rounded flex items-center justify-center text-white"><Trash2 className="h-2.5 w-2.5" /></div>
                  <span>Abonné actif - Bac gérable (&lt; 50%)</span>
                </div>
              </div>

              {/* Status bar bottom layout informative overlay */}
              <div className="absolute top-4 left-4 bg-slate-950/95 border border-slate-800 p-2.5 rounded-lg text-[9px] font-bold z-10 flex items-center gap-2 text-slate-400">
                <Info className="h-4 w-4 text-indigo-500" />
                <span>Simulateur GPS dynamique. Les camions bougent automatiquement toutes les 3 secondes.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
