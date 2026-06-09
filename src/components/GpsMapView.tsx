/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
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
  Info,
  Search,
  CheckCircle,
  FileText,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Subscriber, CollectorAgent } from '../types';
import { usePermissions } from '../context/PermissionContext';
import { Phone, PhoneCall, Mic, Tv } from 'lucide-react';

interface GpsMapViewProps {
  subscribers: Subscriber[];
  agents: CollectorAgent[];
  onUpdateSubscriber?: (sub: Subscriber) => void;
  onUpdateAgentCollected?: (agentId: string, addedKg: number) => void;
}

export interface GpsProof {
  id: string;
  subId: string;
  subName: string;
  neighborhood: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  lat: number;
  lng: number;
  precision: number; // meters
  hash: string;
  weightCollected: number;
}

export default function GpsMapView({ 
  subscribers, 
  agents,
  onUpdateSubscriber,
  onUpdateAgentCollected 
}: GpsMapViewProps) {
  const { requestPermission, showFeedbackMessage } = usePermissions();
  const [selectedSector, setSelectedSector] = useState('All');
  const [activeTab, setActiveTab] = useState<'map' | 'optimize' | 'sla'>('map');
  const [activeTruckId, setActiveTruckId] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState(new Date());

  const handleLocateClientDevice = async () => {
    const isGranted = await requestPermission('geolocation');
    if (!isGranted) return;

    if (navigator.geolocation && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          showFeedbackMessage("Position GPS identifiée !", `Coordonnées : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, "success");
          
          const L = (window as any).L;
          if (L) {
            const markerId = 'client-device-gps';
            if (markersRef.current[markerId]) {
              mapRef.current.removeLayer(markersRef.current[markerId]);
            }
            
            const customIcon = L.divIcon({
              className: 'custom-leaflet-device-location',
              html: `<div class="relative flex items-center justify-center">
                <span class="absolute inline-flex h-6 w-6 rounded-full bg-blue-400 animate-ping opacity-60"></span>
                <span class="relative rounded-full h-4.5 w-4.5 bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                  <div class="h-1.5 w-1.5 bg-white rounded-full"></div>
                </span>
              </div>`,
              iconSize: [24, 24]
            });
            
            const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(mapRef.current);
            marker.bindPopup(`<div class="font-bold text-xs">🔴 Votre Terminal (GPS Certifié)</div><p class="text-[10px] text-slate-500">Coordonnées de l'agent connectateur : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</p>`).openPopup();
            
            markersRef.current[markerId] = marker;
            mapRef.current.setView([latitude, longitude], 14);
          }
        },
        (error) => {
          console.error("GPS live position acquisition error", error);
          showFeedbackMessage("Signal GPS Faible", "Le navigateur n'a pas pu identifier le signal satellite.", "error");
        }
      );
    }
  };

  // Leaflet Load State
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const truckMarkersRef = useRef<{ [key: string]: any }>({});
  const routePolylineRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);

  // Nominatim Address Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');

  // TSP Optimization States
  const [optimizedRoute, setOptimizedRoute] = useState<Subscriber[]>([]);
  const [totalOptimizedDist, setTotalOptimizedDist] = useState<number>(0);
  const [activeRouteAgentId, setActiveRouteAgentId] = useState('AGT-001');
  const [isRouteCalculated, setIsRouteCalculated] = useState(false);
  const [routeSentFeedback, setRouteSentFeedback] = useState('');

  // GPS Proximity Proof Simulation States
  const [isSimulatingProof, setIsSimulatingProof] = useState(false);
  const [simulationStep, setSimulationStep] = useState<string>('');
  const [proofLogs, setProofLogs] = useState<GpsProof[]>([
    {
      id: "GL-PRF-2026-00431",
      subId: "AKPBF-000001",
      subName: "Famille Sawadogo",
      neighborhood: "Karpala",
      agentId: "AGT-001",
      agentName: "Kaboré Moussa",
      timestamp: "22 Mai 2026 08:31",
      lat: 12.30820,
      lng: -1.48800,
      precision: 1.8,
      hash: "8fa297cb73dfcfb8f54ef4009e51c863aab1e8790cb901cbd77ffabcedf1120a",
      weightCollected: 45
    },
    {
      id: "GL-PRF-2026-00432",
      subId: "AKPBF-000004",
      subName: "Boulangerie Centrale Gounghin",
      neighborhood: "Gounghin",
      agentId: "AGT-002",
      agentName: "Touré Bakary",
      timestamp: "22 Mai 2026 09:12",
      lat: 12.36150,
      lng: -1.55400,
      precision: 2.3,
      hash: "3ba221bb55dacfb3f53af2008e15c862eed3a411bbcc048dd80145df0012bc0b",
      weightCollected: 120
    }
  ]);

  // Real-time telemetries
  const [truckSpeeds, setTruckSpeeds] = useState<{ [key: string]: number }>({});
  const [truckFuel, setTruckFuel] = useState<{ [key: string]: number }>({});
  const [truckCoordinates, setTruckCoordinates] = useState<{ [key: string]: { lat: number; lng: number } }>({});

  const sectorCoordinates: { [key: string]: { lat: number; lng: number } } = {
    'Karpala': { lat: 12.3082, lng: -1.4880 },
    'Somgandé': { lat: 12.4042, lng: -1.4871 },
    'Gounghin': { lat: 12.3615, lng: -1.5540 },
    'Pissy': { lat: 12.3382, lng: -1.5714 }
  };

  // Wait for dynamic Leaflet loading onto window object
  useEffect(() => {
    const checkL = setInterval(() => {
      if ((window as any).L) {
        setLeafletLoaded(true);
        clearInterval(checkL);
      }
    }, 100);
    return () => clearInterval(checkL);
  }, []);

  // Initialize and simulate telemetry state transitions
  useEffect(() => {
    const initialCoords: { [key: string]: { lat: number; lng: number } } = {};
    const initialSpeeds: { [key: string]: number } = {};
    const initialFuel: { [key: string]: number } = {};

    agents.forEach(a => {
      const sector = a.id === 'AGT-001' ? 'Karpala' : a.id === 'AGT-002' ? 'Somgandé' : 'Gounghin';
      const base = sectorCoordinates[sector] || { lat: 12.3082, lng: -1.4880 };
      initialCoords[a.id] = { 
        lat: base.lat + (Math.random() - 0.5) * 0.015,
        lng: base.lng + (Math.random() - 0.5) * 0.015 
      };
      initialSpeeds[a.id] = Math.floor(25 + Math.random() * 20);
      initialFuel[a.id] = Math.floor(75 + Math.random() * 20);
    });

    setTruckCoordinates(initialCoords);
    setTruckSpeeds(initialSpeeds);
    setTruckFuel(initialFuel);

    if (agents.length > 0) {
      setActiveTruckId(agents[0].id);
    }
  }, [agents]);

  // Telemetry updates interval walker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date());

      // Walk coordinates slightly to simulate motion
      setTruckCoordinates(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = {
            lat: next[id].lat + (Math.random() - 0.5) * 0.0006,
            lng: next[id].lng + (Math.random() - 0.5) * 0.0006
          };
        });
        return next;
      });

      // Fluctuate speeds and reduce fuel slowly
      setTruckSpeeds(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          const delta = Math.floor((Math.random() - 0.5) * 8);
          next[id] = Math.max(10, Math.min(75, (prev[id] || 35) + delta));
        });
        return next;
      });

      setTruckFuel(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = Math.max(15, (prev[id] || 80) - (Math.random() > 0.8 ? 1 : 0));
        });
        return next;
      });

    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const filteredSubscribers = subscribers.filter(s => {
    return selectedSector === 'All' || s.neighborhood === selectedSector;
  });

  const selectedTruckDetails = agents.find(a => a.id === activeTruckId);

  // Initialize central Leaflet Map Once loaded
  useEffect(() => {
    if (!leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    const container = document.getElementById('leaflet-map-gps');
    if (!container) return;

    // Remove any previous instance manually to avoid Leaflet double binding error
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map('leaflet-map-gps', {
      zoomControl: true,
      maxZoom: 18,
      minZoom: 10
    }).setView([12.3714, -1.5197], 11.5); // Focus on Ouagadougou

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | SIG AKPBF'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, activeTab]);

  // Update Subscriber Circle Markers whenever values or selection change
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Clear old subscriber layers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    // Filter subscribers safely and render them
    filteredSubscribers.forEach(sub => {
      const isCritical = sub.currentBinLevel >= 80;
      const isMedium = sub.currentBinLevel >= 50;
      const color = isCritical ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';

      const circle = L.circleMarker([sub.lat, sub.lng], {
        radius: isCritical ? 8 : 6.5,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(mapRef.current);

      circle.bindPopup(`
        <div class="p-2 font-sans space-y-1 text-slate-800">
          <div class="flex items-center gap-1.5 border-b pb-1">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
            <strong class="font-black text-sm text-slate-900">${sub.name}</strong>
          </div>
          <div class="text-[11px] leading-snug">
            <div>📍 <strong>Adresse:</strong> ${sub.address} (${sub.neighborhood})</div>
            <div>🗑️ <strong>Niveau Bac:</strong> <span class="font-bold text-slate-900">${sub.currentBinLevel}%</span></div>
            <div>📦 <strong>Modèle:</strong> ${sub.binType}</div>
            <div class="text-slate-400 font-mono text-[9px] mt-1">UUID: ${sub.id}</div>
          </div>
        </div>
      `);

      markersRef.current[sub.id] = circle;
    });

  }, [filteredSubscribers, leafletLoaded, activeTab]);

  // Synchronise Active Truck Live Geolocation markers and move them smoothly
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    agents.forEach(agent => {
      const coords = truckCoordinates[agent.id];
      if (!coords) return;

      const marker = truckMarkersRef.current[agent.id];
      if (marker) {
        marker.setLatLng([coords.lat, coords.lng]);
      } else {
        const truckIcon = L.divIcon({
          className: 'custom-leaflet-truck',
          html: `
            <div class="relative flex items-center justify-center p-1 bg-indigo-600 border-2 border-white rounded-full shadow-lg text-white" style="width: 28px; height: 28px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><rect width="16" height="13" x="2" y="6" rx="2"/><path d="M16 8h4l3 3v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h13"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="18.5" r="2.5"/></svg>
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white animate-ping"></span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const newMarker = L.marker([coords.lat, coords.lng], { icon: truckIcon }).addTo(mapRef.current);
        newMarker.bindPopup(`
          <div class="p-2 space-y-1 font-sans text-slate-800">
            <strong class="text-indigo-900 font-extrabold text-sm block">🚚 AKPBF - ${agent.name}</strong>
            <div class="text-[11px] leading-relaxed">
              <div>⚙️ <strong>Véhicule:</strong> ${agent.activeVehicle}</div>
              <div>🚛 <strong>Matricule:</strong> ${agent.licensePlate}</div>
              <div>⚖️ <strong>SLA Cumulé:</strong> ${agent.totalCollectedKg.toLocaleString()} kg</div>
            </div>
          </div>
        `);
        truckMarkersRef.current[agent.id] = newMarker;
      }
    });
  }, [truckCoordinates, agents, leafletLoaded, activeTab]);

  // Center Map on selected Truck
  const handleZoomToTruck = (agentId: string) => {
    setActiveTruckId(agentId);
    const coords = truckCoordinates[agentId];
    if (coords && mapRef.current) {
      mapRef.current.setView([coords.lat, coords.lng], 14, { animate: true });
    }
  };

  // 1. Nominatim Address Search Implementation
  const handleNominatimSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchFeedback('');
    setSearchResults([]);

    try {
      // Build search query targeting Burkina Faso
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}+Ouagadougou+Burkina+Faso&limit=5`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'akpbf-cleanup-sig-ouaga-v1' // As stored in secure environment vars
        }
      });

      if (!response.ok) {
        throw new Error("Erreur HTTP Nominatim: " + response.status);
      }

      const data = await response.json();
      setSearchResults(data);

      if (data.length === 0) {
        setSearchFeedback("❌ Aucun emplacement trouvé pour cette adresse à Ouagadougou.");
      } else {
        setSearchFeedback(`✅ ${data.length} adresses correspondantes trouvées.`);
      }
    } catch (err: any) {
      console.error("Nominatim search failed", err);
      // Fallback simulating server output if network issues occur under strict iframes
      setSearchFeedback("⚠️ Serveur Nominatim API indisponible en mode sécurisé. Remplissage par coordonnées Karpala SIG.");
      const simulatedResults = [
        {
          display_name: `${searchQuery}, Karpala, Ouagadougou, Burkina Faso`,
          lat: "12.30822",
          lon: "-1.48805",
          class: "place"
        },
        {
          display_name: `${searchQuery}, Somgandé, Ouagadougou, Burkina Faso`,
          lat: "12.40425",
          lon: "-1.48712",
          class: "place"
        }
      ];
      setSearchResults(simulatedResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (item: any) => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    const latStr = item.lat;
    const lonStr = item.lon || item.lng;
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon)) return;

    // Center map
    mapRef.current.setView([lat, lon], 14.5);

    // Remove old search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
    }

    const pinIcon = L.divIcon({
      className: 'custom-search-pin',
      html: `
        <div class="flex flex-col items-center">
          <div class="px-2.5 py-1 text-[9px] font-black bg-amber-500 border border-amber-600 rounded-lg text-slate-900 shadow-md">
            Cible GPS Nominatim
          </div>
          <div class="w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-white shadow-lg shrink-0 -mt-1 scale-110"></div>
        </div>
      `,
      iconSize: [120, 50],
      iconAnchor: [60, 42]
    });

    searchMarkerRef.current = L.marker([lat, lon], { icon: pinIcon }).addTo(mapRef.current);
    searchMarkerRef.current.bindPopup(`
      <div class="p-2 font-sans text-xs max-w-xs leading-relaxed space-y-1">
        <strong class="text-amber-800 text-sm">📍 Emplacement Nominatim</strong>
        <p class="text-slate-600">${item.display_name}</p>
        <div class="text-[9.5px] font-mono bg-slate-100 p-1 rounded">
          LAT: ${lat.toFixed(5)} | LNG: ${lon.toFixed(5)}
        </div>
        <button 
          id="copy-to-sub-btn"
          class="w-full bg-slate-900 text-white font-bold text-[9px] p-1.5 rounded hover:bg-slate-800 mt-2 cursor-pointer transition"
        >
          Copier les coordonnées SQL
        </button>
      </div>
    `).openPopup();

    setTimeout(() => {
      const btn = document.getElementById('copy-to-sub-btn');
      if (btn) {
        btn.onclick = () => {
          navigator.clipboard.writeText(`lat: ${lat}, lng: ${lon}`);
          alert(`Coordonnées GPS copiées dans le presse-papiers pour insertion PostgreSQL ! (${lat.toFixed(5)}, ${lon.toFixed(5)})`);
        };
      }
    }, 200);
  };

  // 2. Route Optimization Algorithm (TSP Nearest Neighbor Implementation)
  const calculateOptimizedTSPRoute = () => {
    const L = (window as any).L;
    if (!L) return;

    // Base Depot is Somgandé Municipal Depot
    const baseDepot = { lat: 12.3714, lng: -1.5197 };

    // Customers to visit: Any customer whose bin level is >= 50%
    const urgentCustomers = filteredSubscribers.filter(s => s.currentBinLevel >= 50);

    if (urgentCustomers.length === 0) {
      alert("Aucun bac n'est saturé ou mi-plein (niveau >= 50%) dans ce secteur pour planifier un trajet.");
      return;
    }

    // Heuristic: Nearest Neighbor Solver
    const unvisited = [...urgentCustomers];
    const computedStops: Subscriber[] = [];
    let currentGeo = baseDepot;

    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = Math.sqrt(
          Math.pow(unvisited[i].lat - currentGeo.lat, 2) +
          Math.pow(unvisited[i].lng - currentGeo.lng, 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== -1) {
        const nextNode = unvisited.splice(nearestIdx, 1)[0];
        computedStops.push(nextNode);
        currentGeo = { lat: nextNode.lat, lng: nextNode.lng };
      } else {
        break;
      }
    }

    // Distances estimation
    let runningDist = 0;
    let prev = baseDepot;
    computedStops.forEach(node => {
      // Simple Haversine approximation in KM
      const R = 6371;
      const dLat = (node.lat - prev.lat) * Math.PI / 180;
      const dLng = (node.lng - prev.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(node.lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      runningDist += R * c;
      prev = { lat: node.lat, lng: node.lng };
    });

    setOptimizedRoute(computedStops);
    setTotalOptimizedDist(parseFloat(runningDist.toFixed(2)));
    setIsRouteCalculated(true);

    // Draw optimization polyline trace on Leaflet Map
    if (mapRef.current) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }

      const polyCoordinates = [
        [baseDepot.lat, baseDepot.lng],
        ...computedStops.map(s => [s.lat, s.lng])
      ];

      routePolylineRef.current = L.polyline(polyCoordinates, {
        color: '#6366f1',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 10'
      }).addTo(mapRef.current);

      // Fit bounds
      mapRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
    }
  };

  const handleTransmitRoute = () => {
    if (optimizedRoute.length === 0) return;
    const selectedAgentName = agents.find(a => a.id === activeRouteAgentId)?.name || 'Chauffeur municipal';
    setRouteSentFeedback(`📡 Feuille de route d'assainissement optimisée transmise à l'ordinateur de bord d'agent: ${selectedAgentName} !`);
    setTimeout(() => setRouteSentFeedback(''), 4500);
  };

  // 3. Proximity Geofenced GPS Proof simulation
  const handleSimulateCertifiedProofDump = () => {
    // Pick an urgent client (bin >= 50%) or randomly if none
    const target = filteredSubscribers.find(s => s.currentBinLevel >= 50) || filteredSubscribers[0];
    
    if (!target) {
      alert("Aucun client disponible à Ouagadougou pour simuler la preuve de collecte.");
      return;
    }

    setIsSimulatingProof(true);
    setSimulationStep('GPS_DISPATCH');

    // Step 1: Dispatch Truck & Track geolocalization proximity
    setTimeout(() => {
      setSimulationStep('PROXIMITY_CHECK');
      
      // Step 2: Calculate geofence threshold
      setTimeout(() => {
        setSimulationStep('SLA_MATCH');
        
        // Step 3: Trigger physical dump and scale weight calculation
        setTimeout(() => {
          setSimulationStep('SQL_LEDGER_SYNC');
          
          // Step 4: Finalize SQL insertion & issue proof
          setTimeout(() => {
            const addedKg = Math.floor(25 + Math.random() * 50);
            const proofId = `GL-PRF-2026-${Math.floor(10000 + Math.random() * 90000)}`;
            const hashSim = `e20c6bf048ffdf${Math.floor(Math.random()*1593021).toString(16)}a9a102de87fbdeaaef80${Math.floor(Math.random()*9000).toString()}`;
            
            const newProof: GpsProof = {
              id: proofId,
              subId: target.id,
              subName: target.name,
              neighborhood: target.neighborhood,
              agentId: "AGT-001",
              agentName: "Konan Yao",
              timestamp: new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) + " (Preuve Live)",
              lat: target.lat,
              lng: target.lng,
              precision: parseFloat((1.2 + Math.random() * 1.5).toFixed(1)),
              hash: hashSim,
              weightCollected: addedKg
            };

            setProofLogs(prev => [newProof, ...prev]);

            // Database Sync: Empty the client's connected bin in Parent state!
            if (onUpdateSubscriber) {
              const updatedSub: Subscriber = {
                ...target,
                currentBinLevel: 0,
                lastCollectionDate: 'Aujourd\'hui (Certifié GPS)'
              };
              onUpdateSubscriber(updatedSub);
            }

            // Sync Driver's total weight
            if (onUpdateAgentCollected) {
              onUpdateAgentCollected("AGT-001", addedKg);
            }

            setIsSimulatingProof(false);
            setSimulationStep('');
            alert(`✅ Preuve de collecte GPS validée !\n\n• ID: ${proofId}\n• Client: ${target.name}\n• Poids: ${addedKg} kg\n• Proximité certifiée: OK (< 3m)\n• Statut: Enregistré PostgreSQL.`);
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            🛰️ Système d'Information Géographique (SIG) & Preuves GPS
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Cartographie OpenStreetMap intégrée par Leaflet, optimisation TSP des tournées de nos camions-bennes et verrouillage de preuves de collectes SLA
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2l font-semibold text-xs border border-slate-200 w-fit">
          <button 
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'map' ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🗺️ Carte Leaflet Live
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('optimize')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'optimize' ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ⚡ Route TSP
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('sla')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'sla' ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🔒 Preuver GPS (SLA)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Panel control widgets */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Geolocation target selector */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/85 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-150">
              Secteurs & Capteurs Ouagadougou
            </h3>
            
            <div className="space-y-3 font-medium">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block pl-0.5">Filtre territorial</label>
                <select 
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full bg-slate-55 border border-slate-200 p-2 text-slate-700 text-xs rounded-lg mt-1 focus:outline-none cursor-pointer"
                >
                  <option value="All">Tout Ouagadougou (SIG Global)</option>
                  <option value="Karpala">Karpala (Résidentiel)</option>
                  <option value="Somgandé">Somgandé (Industriel)</option>
                  <option value="Gounghin">Gounghin (Commercial)</option>
                  <option value="Pissy">Pissy (Populaire)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl text-[10.5px] border border-slate-150 leading-relaxed text-slate-600">
                ⭐ <strong>Statistiques Actuels :</strong>
                <div className="grid grid-cols-2 gap-2 mt-1.5 text-slate-800 font-bold">
                  <div>🏡 Clients : <span className="font-mono text-indigo-600">{filteredSubscribers.length}</span></div>
                  <div>🚨 Critiques : <span className="font-mono text-red-600">{filteredSubscribers.filter(s => s.currentBinLevel >= 80).length}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* FLOTTE LIVE VECHICULE */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/85 space-y-4 shadow-xs">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-150">
              Véhicules de salubrité Live
            </h3>

            <div className="space-y-2">
              {agents.map((agent) => {
                const isSelected = activeTruckId === agent.id;
                const speed = truckSpeeds[agent.id] ?? 38;
                const fuel = truckFuel[agent.id] ?? 88;
                return (
                  <div 
                    key={agent.id}
                    onClick={() => handleZoomToTruck(agent.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer space-y-2 text-left ${
                      isSelected 
                        ? 'bg-indigo-50/40 border-indigo-400 text-slate-900' 
                        : 'bg-slate-50/55 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-black text-xs flex items-center gap-1.5 text-slate-800">
                        <Truck className={`h-4.5 w-4.5 ${isSelected ? 'text-indigo-600 animate-bounce' : 'text-slate-400'}`} />
                        <span>{agent.name.split(' ')[0]}</span>
                      </div>
                      <span className="font-mono text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {agent.licensePlate}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-500">
                      <div>Vitesse : <span className="font-mono text-slate-900">{speed} km/h</span></div>
                      <div>Réservoir : <span className="font-mono text-slate-900">{fuel}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TELEMETRY ACTIVE CONSOLE */}
          {selectedTruckDetails && (
            <div className="bg-slate-950 text-white rounded-3xl p-5 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Télémétrie active satellite</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="space-y-2 text-xs leading-relaxed">
                <div>
                  <span className="text-slate-400">Équipage Chauffeur :</span>
                  <div className="font-black text-slate-100 text-sm">{selectedTruckDetails.name}</div>
                </div>
                <div>
                  <span className="text-slate-400">Ordinateur de Bord :</span>
                  <div className="font-mono text-[10px] text-indigo-300 font-bold">{selectedTruckDetails.activeVehicle}</div>
                </div>
                
                <div className="border-t border-slate-900 pt-2 space-y-1 hover:text-indigo-200">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Autonomie Diesel :</span>
                    <span className="font-bold font-mono text-amber-400">{truckFuel[selectedTruckDetails.id] || 78}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Pesée de preuve cumulée :</span>
                    <span className="font-bold font-mono text-emerald-400">{selectedTruckDetails.totalCollectedKg.toLocaleString()} kg</span>
                  </div>
                  {truckCoordinates[selectedTruckDetails.id] && (
                    <div className="text-[9.5px] font-mono text-slate-500 pt-1.5 border-t border-slate-900/60 leading-normal">
                      🛰️ {truckCoordinates[selectedTruckDetails.id].lat.toFixed(5)} Lat <br/>
                      📡 {truckCoordinates[selectedTruckDetails.id].lng.toFixed(5)} Lng
                    </div>
                  )}

                  {/* Operational Radio & Intercom with Permission check constraints */}
                  <div className="border-t border-slate-900 pt-3 space-y-2 mt-2">
                    <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Liaison de Sécurité AKPBF</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={async () => {
                          const allowed = await requestPermission('microphone');
                          if (allowed) {
                            showFeedbackMessage("Appel Intercom Connecté !", `Audio d'urgence établi avec ${selectedTruckDetails.name}.`, "success");
                          }
                        }}
                        className="bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/50 py-1.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition font-bold cursor-pointer"
                      >
                        <Mic className="w-3 h-3 animate-pulse text-emerald-400" />
                        <span>Radio Chauffeur</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={async () => {
                          const allowed = await requestPermission('screenShare');
                          if (allowed) {
                            showFeedbackMessage("Cast Écran Actif !", `Affichage du tableau de bord déporté du Chauffeur.`, "success");
                          }
                        }}
                        className="bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 border border-indigo-900/50 py-1.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition font-bold cursor-pointer"
                      >
                        <Tv className="w-3 h-3 text-indigo-450" />
                        <span>Cast Écran</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: MAP AND CORE SYSTEM MODS */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* MAIN LEAFLET MAP VIEW */}
          {activeTab === 'map' && (
            <div className="space-y-4">
              
              {/* Nominatim Search Box */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                <form onSubmit={handleNominatimSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-450" />
                    <input 
                      type="text" 
                      placeholder="Rechercher une adresse à Ouagadougou (ex: Karpala, Somgandé, Gounghin, Avenue de la Nation)..."
                      className="w-full bg-slate-55 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    disabled={isSearching}
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {isSearching ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                    Interroger Nominatim
                  </button>
                </form>

                {searchFeedback && (
                  <div className="mt-2 text-[10.5px] font-bold text-indigo-800 bg-indigo-50/50 p-1.5 px-3 rounded-lg border border-indigo-100 flex items-center justify-between">
                    <span>{searchFeedback}</span>
                    <button onClick={() => setSearchFeedback('')} className="text-slate-400 hover:text-slate-650">✕</button>
                  </div>
                )}

                {/* Search Results list panel */}
                {searchResults.length > 0 && (
                  <div className="mt-3 bg-white border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 shadow-xl z-50 relative">
                    {searchResults.map((it, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleSelectAddress(it)}
                        className="p-3 hover:bg-slate-50 cursor-pointer text-left transition text-xs space-y-0.5"
                      >
                        <div className="font-extrabold text-slate-800 text-[11px] block">{it.display_name}</div>
                        <div className="text-[9.5px] font-mono text-slate-400">Class: {it.class} • Lat: {parseFloat(it.lat).toFixed(5)} | Lng: {parseFloat(it.lon || it.lng).toFixed(5)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MAP DISPLAY FRAME */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col h-[520px]">
                <div className="bg-slate-900 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-extrabold text-xs uppercase tracking-widest text-slate-100">
                      Vecteur Cartographique OpenStreetMap (Leaflet GPS API)
                    </h3>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">REFRESH_SLA_SECURE_2026 : {timestamp.toLocaleTimeString()}</div>
                </div>

                <div className="relative flex-1 bg-slate-105">
                  
                  {/* Floating locate device control button on upper right */}
                  {leafletLoaded && (
                    <button
                      type="button"
                      onClick={handleLocateClientDevice}
                      className="absolute top-4 right-4 bg-slate-905 border border-slate-700/80 hover:bg-slate-800 text-slate-100 hover:text-white font-extrabold text-[10.5px] px-3.5 py-2.5 rounded-2xl cursor-pointer z-[1000] shadow-2xl flex items-center gap-1.8 transition"
                    >
                      <MapPin className="h-3.8 w-3.8 text-blue-400 animate-pulse" />
                      <span>Localiser mon Agent</span>
                    </button>
                  )}
                  
                  {/* Map Leaflet mounting target Element */}
                  <div id="leaflet-map-gps" className="w-full h-full z-0"></div>

                  {/* Fallback overlay loading card if window Leaflet isn't ready or missing */}
                  {!leafletLoaded && (
                    <div className="absolute inset-0 bg-slate-950/90 text-slate-300 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                      <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                      <strong className="text-slate-200">Recherche des modules de cartographie OpenStreetMap...</strong>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">Le module de routage cartographique Leaflet injecte dynamiquement des scripts certifiés.</p>
                    </div>
                  )}

                  {/* Legend Overlay Card */}
                  {leafletLoaded && (
                    <div className="absolute bottom-4 left-4 bg-slate-950/95 border border-slate-800 p-3.5 rounded-2xl text-[9px] font-bold z-[1000] text-slate-300 shadow-xl max-w-xs shrink-0 leading-normal space-y-2 pointer-events-none">
                      <span className="uppercase text-[8px] tracking-wider text-slate-500 b-1 border-b border-slate-800 block pb-1">LEGENDE SIG D'ASSAINISSEMENT</span>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-600 border border-white rounded-full"></span>
                        <span>Contrat saturé (&gt;= 80% urgent)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-amber-500 border border-white rounded-full"></span>
                        <span>Bac mi-plein (&gt;= 50% passage conseillé)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-emerald-500 border border-white rounded-full"></span>
                        <span>Bac gérable (~ 10%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-0.5 bg-indigo-600 rounded text-white shrink-0">
                          <Truck className="h-3 w-3" />
                        </div>
                        <span>Camion d'assainissement municipal Live</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TSP ROUTE OPTIMIZATION DETAILED PANEL */}
          {activeTab === 'optimize' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 text-left space-y-6 animate-in fade-in duration-250">
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-md font-extrabold text-slate-900">Moteur de Résolution Heuristique TSP</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Calcule l'ordre optimal de desserte géographique des clients en retard d'assainissement d'après leurs adresses PostgreSQL pour économiser le CO2 municipal.
                  </p>
                </div>
                <button 
                  onClick={calculateOptimizedTSPRoute}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black p-3 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="h-4.5 w-4.5 text-amber-300" />
                  Calculer la Feuille TSP Optimale
                </button>
              </div>

              {isRouteCalculated ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Stats card */}
                  <div className="md:col-span-1 bg-indigo-50/40 border border-indigo-250/70 rounded-2xl p-4.5 space-y-4">
                    <h4 className="font-extrabold text-xs uppercase text-indigo-800 pb-2 border-b border-indigo-100 tracking-wider">Metrique de la feuille</h4>
                    
                    <div className="space-y-3 font-semibold text-xs text-slate-650">
                      <div>🏢 Base de départ : <span className="text-slate-900 block font-bold">Dépôt Municipal de Ouagadougou (Depot)</span></div>
                      <div>🛑 Nombre d'escales calculées : <span className="font-mono text-indigo-700 font-extrabold block text-sm">{optimizedRoute.length} clients critiques</span></div>
                      <div>⚙️ Distance estimée optimisée : <span className="font-mono text-emerald-700 font-black block text-sm">{totalOptimizedDist} Km</span></div>
                      <div>⌛ Temps de parcours estimé : <span className="text-slate-900 block font-bold font-mono">~ {Math.floor(optimizedRoute.length * 15 + totalOptimizedDist * 4)} Minutes</span></div>
                    </div>

                    <div className="pt-3 border-t border-indigo-100">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Attribuer la tournée au véhicule</label>
                      <select 
                        className="w-full bg-white border border-slate-250 rounded-xl p-2 text-xs font-bold"
                        value={activeRouteAgentId}
                        onChange={(e) => setActiveRouteAgentId(e.target.value)}
                      >
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.activeVehicle.split(' ')[0]})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleTransmitRoute}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                    >
                      Transmettre l'itinéraire GPS
                    </button>

                    {routeSentFeedback && (
                      <p className="text-[10px] font-bold text-emerald-800 bg-emerald-50 rounded-lg p-2 leading-relaxed text-center border border-emerald-100 animate-bounce">
                        {routeSentFeedback}
                      </p>
                    )}
                  </div>

                  {/* Escales list */}
                  <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 max-h-96 overflow-y-auto">
                    <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-widest block">Séquençage Chronologique Optimal des Vidages</h4>
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs relative">
                        <span className="w-6 h-6 rounded-full bg-slate-600 text-white font-mono flex items-center justify-center font-bold shrink-0 text-[10px]">D</span>
                        <div className="text-left">
                          <strong className="text-slate-800 font-bold block leading-none">DÉPART DÉPÔT AKPBF (CÔTE D'IVOIRE)</strong>
                          <span className="text-[9.5px] text-slate-400 font-mono">0.0 KM • Lat: 5.35240 | Lng: -3.98750</span>
                        </div>
                      </div>

                      {optimizedRoute.map((stop, index) => {
                        const isHigh = stop.currentBinLevel >= 80;
                        return (
                          <div key={stop.id} className="flex items-center gap-3 p-3 bg-white border border-slate-150 rounded-xl text-xs relative hover:border-indigo-300 transition shadow-xs">
                            <span className={`w-6 h-6 rounded-full text-white font-mono flex items-center justify-center font-black shrink-0 text-[10.5px] ${
                              isHigh ? 'bg-red-600' : 'bg-indigo-600'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <strong className="text-slate-900 font-black truncate">{stop.name}</strong>
                                <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded ${isHigh ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                  Rempli : {stop.currentBinLevel}%
                                </span>
                              </div>
                              <span className="text-[9.5px] text-slate-500 block truncate">{stop.address} ({stop.neighborhood})</span>
                              <span className="text-[9px] text-slate-400 font-mono">POSTGRES : lat: {stop.lat.toFixed(5)} | lng: {stop.lng.toFixed(5)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl space-y-3">
                  <Compass className="h-10 w-10 text-slate-400 mx-auto animate-spin" />
                  <strong className="text-slate-700 max-w-sm block mx-auto">Lancez le calcul de tournée</strong>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Le moteur SQL analysera les coordonnées GPS de tous les clients de Ouagadougou pour optimiser le trajet en limitant les détours inutiles.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SLA VERIFICATION GPS DUMP PROOFS LOGGER */}
          {activeTab === 'sla' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 text-left space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
                <div>
                  <h3 className="text-md font-extrabold text-slate-900">Registre d'Audit & Preuves Géolocalisées (SLA)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">La décharge des conteneurs est soumise à un certificat cryptographique qui prouve la présence physique du camion poubelle à moins de 5 mètres du client.</p>
                </div>

                <button 
                  disabled={isSimulatingProof}
                  onClick={handleSimulateCertifiedProofDump}
                  className="bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs p-3 px-4 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isSimulatingProof ? "Analyse de Proximité GPS..." : "Simuler Preuve GPS de Collecte"}
                </button>
              </div>

              {/* SIMULATION MONITOR BOARD */}
              {isSimulatingProof && (
                <div className="bg-slate-950 text-emerald-450 font-mono p-5 rounded-2xl text-[11px] leading-relaxed space-y-2 border border-slate-900 shadow-md">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-900">
                    <span className="text-slate-400">🚨 DISPATCH MUNICIPAL LIVE SATELLITE SYSTEM</span>
                    <span className="h-2.5 w-2.5 bg-red-500 rounded-full animate-ping"></span>
                  </div>

                  {simulationStep === 'GPS_DISPATCH' && (
                    <p className="text-yellow-405">
                      • [COMMAND] Localisation du bac saturé le plus proche...<br/>
                      • [GPS] Client ciblé: Famille Sawadogo (Karpala SIG de Ouagadougou). <br/>
                      • [FLEET] Envoi des instructions géo-localisées au camion AGT-001 (Kaboré Moussa). <br/>
                      • [TELEMETRY] Déplacement du camion en cours... 📡
                    </p>
                  )}

                  {simulationStep === 'PROXIMITY_CHECK' && (
                    <p className="text-indigo-400">
                      • [DGPS] Rapprochement avec le terminal satellite du domicile de l'abonné...<br/>
                      • [GEOFENCING] Coordonnées Cible: 12.30820 Lat | -1.48800 Lng <br/>
                      • [GEOFENCING] Coordonnées Camion: 12.30821 Lat | -1.48799 Lng <br/>
                      • [CALCUL] Delta spatial: 1.25 Mètres d'écart calculé par l'antenne radio...
                    </p>
                  )}

                  {simulationStep === 'SLA_MATCH' && (
                    <p className="text-emerald-400 font-bold">
                      • [SIGNATURE] SLA Certifié ! Le camion est légitimement présent dans la zone de service (&lt; 5m).<br/>
                      • [PHYSICAL] Début de la collecte hydraulique... Pesée électronique de la tare de déchets...<br/>
                      • [SCALE] Détritus enregistrés : 62,5 Kg collectés avec succès dans la trémie.
                    </p>
                  )}

                  {simulationStep === 'SQL_LEDGER_SYNC' && (
                    <p className="text-slate-350 italic">
                      • [POSTGRESQL] Insertion du log de preuve SIG dans akpbf_db...<br/>
                      • [FASTAPI] Génération du hash cryptographique sha256 certifiant l'opération d'assainissement...<br/>
                      • [STATUS] Vidage du bac réinitialisé à 0% dans la base de données centrale.
                    </p>
                  )}
                  
                  <div className="flex gap-2.5 items-center justify-center pt-2.5">
                    <span className="animate-bounce">🚚</span>
                    <span className="animate-pulse">🔄</span>
                    <span className="animate-bounce">🔐</span>
                  </div>
                </div>
              )}

              {/* LIST OF RECENT GPS PROOFS */}
              <div className="space-y-4">
                <span className="text-[10.5px] uppercase font-black tracking-widest text-slate-400 block pl-0.5">Registre des Preuves Déversées</span>
                
                <div className="divide-y divide-slate-100 border rounded-2xl overflow-hidden text-xs">
                  {proofLogs.map((proof) => (
                    <div key={proof.id} className="p-4 bg-slate-50/40 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="space-y-1.5 text-left flex-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 px-2 text-[9.5px] font-black bg-emerald-100/60 border border-emerald-250 text-emerald-800 rounded font-mono">
                            {proof.id}
                          </span>
                          <strong className="text-slate-900 text-sm font-black">{proof.subName}</strong>
                          <span className="text-[10px] bg-slate-102 border px-2.5 py-0.5 rounded font-bold text-slate-500">
                            {proof.neighborhood}
                          </span>
                        </div>
                        
                        <div className="text-slate-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[10.5px] font-medium leading-tight">
                          <div>📍 Coordonnées : <span className="font-mono text-slate-800 font-bold">({proof.lat.toFixed(5)}, {proof.lng.toFixed(5)})</span></div>
                          <div>⚖️ Proximité Lock : <span className="text-emerald-700 font-black">Certifiée (&lt; {proof.precision}m)</span></div>
                          <div>🚛 Véhicule Agent : <span className="font-bold text-slate-700">{proof.agentName}</span></div>
                          <div>⚖️ Charge brute : <span className="font-mono text-slate-900 font-bold">{proof.weightCollected} kg</span></div>
                          <div>📅 Horodatage : <span className="text-slate-600 font-bold">{proof.timestamp}</span></div>
                        </div>

                        <div className="pt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span>SHA-256 POSTGRES :</span>
                          <span className="text-slate-500 truncate font-semibold block bg-slate-100 p-0.5 px-2 rounded">{proof.hash}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-center md:items-end justify-center space-y-1">
                        <span className="text-xs bg-emerald-50 text-emerald-800 font-bold p-1 px-3 border border-emerald-200 rounded-lg flex items-center gap-1">
                          🛡️ SLA VERIFIÉ
                        </span>
                        <span className="text-[10px] text-slate-400">Enregistré PostgreSQL</span>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
