/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Info,
  Trash2,
  FileCheck,
  Award,
  ChevronDown,
  Search,
  Compass,
  Map,
  Navigation
} from 'lucide-react';
import { Subscriber, SubscriptionPlan } from '../types';

interface RegisterPageProps {
  plans: SubscriptionPlan[];
  onAddSubscriber: (newSub: Subscriber) => Promise<any> | any;
  onAddNotificationLogs?: (notif: any) => void;
}

export default function RegisterPage({ plans, onAddSubscriber, onAddNotificationLogs }: RegisterPageProps) {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+225 ');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('Cocody');
  const [planId, setPlanId] = useState(plans[0]?.id || 'plan-standard-mensuel');
  const [binType, setBinType] = useState<'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L'>('Standard 240L');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Flow states
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registeredId, setRegisteredId] = useState<string | null>(null);

  // Geolocation & Interactive Map states
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const registerMapRef = useRef<any>(null);
  const registerMarkerRef = useRef<any>(null);

  // Load Leaflet dynamic assets injection
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    // Leaflet styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Leaflet JS CDN bundle
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Update Address and coordinates dynamically on click or drag
  const updateMarkerCoordsAndAddress = async (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'fr' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Fill temporary search address box or physical input
          const cleanAddr = data.address?.road || data.address?.suburb || data.address?.neighbourhood 
            ? `${data.address.road || ''} ${data.address.suburb || data.address.neighbourhood || ''}, Abidjan` 
            : data.display_name;
          setMapSearchQuery(cleanAddr.trim());
        }
      }
    } catch (err) {
      console.error("Reverse geocoding address helper error", err);
    }
  };

  // Autodetect citizen current device slot coordinate
  const handleAutodetectDeviceGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedCoords({ lat, lng });
          updateMarkerCoordsAndAddress(lat, lng);
          if (registerMapRef.current && registerMarkerRef.current) {
            registerMapRef.current.setView([lat, lng], 15);
            registerMarkerRef.current.setLatLng([lat, lng]);
          }
        },
        (error) => {
          console.error("Autodetect failed", error);
          setError("Impossible d'accéder au service de géolocalisation de votre téléphone. Veuillez sélectionner l'emplacement sur la carte.");
        }
      );
    }
  };

  // Query location search database (Nominatim OpenStreetMap)
  const handleAddressSearchInMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setIsSearchingAddress(true);
    try {
      const queryStr = encodeURIComponent(mapSearchQuery.trim() + ", Abidjan, Côte d'Ivoire");
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryStr}&limit=5`, {
        headers: { 'Accept-Language': 'fr' }
      });
      if (res.ok) {
        const data = await res.json();
        setMapSearchResults(data);
      }
    } catch (err) {
      console.error("Address search lookup error", err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Selected from Nominatim Search Dropdown
  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSelectedCoords({ lat, lng });
    setMapSearchQuery(item.display_name);
    setMapSearchResults([]);

    if (registerMapRef.current && registerMarkerRef.current) {
      registerMapRef.current.setView([lat, lng], 16);
      registerMarkerRef.current.setLatLng([lat, lng]);
    }
  };

  // Instancy on leaflet modal binding
  useEffect(() => {
    if (!isMapModalOpen || !leafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    const timer = setTimeout(() => {
      const container = document.getElementById('register-selector-map');
      if (!container) return;

      if (registerMapRef.current) {
        registerMapRef.current.remove();
        registerMapRef.current = null;
      }

      // Default to Cocody/Abidjan core or selected
      const initLat = selectedCoords?.lat || 5.3489;
      const initLng = selectedCoords?.lng || -3.9995;

      const mapInstance = L.map('register-selector-map', {
        zoomControl: true,
        maxZoom: 18,
        minZoom: 9
      }).setView([initLat, initLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      const markerInstance = L.marker([initLat, initLng], {
        draggable: true
      }).addTo(mapInstance);

      registerMapRef.current = mapInstance;
      registerMarkerRef.current = markerInstance;

      markerInstance.on('dragend', () => {
        const pos = markerInstance.getLatLng();
        updateMarkerCoordsAndAddress(pos.lat, pos.lng);
      });

      mapInstance.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerInstance.setLatLng([lat, lng]);
        updateMarkerCoordsAndAddress(lat, lng);
      });

      // trigger initial label reverse geocoding on open
      if (!selectedCoords) {
        setSelectedCoords({ lat: initLat, lng: initLng });
        updateMarkerCoordsAndAddress(initLat, initLng);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isMapModalOpen, leafletLoaded]);

  // Form submit handler
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError("S'il vous plaît, complétez l'intégralité des champs requis.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("L'adresse e-mail saisie n'est pas au format valide (ex: citoyen@Abidjan.ci).");
      return;
    }

    const cleanPh = phone.replace(/[\s\-\+]/g, '');
    if (cleanPh.length < 8) {
      setError("Le numéro de téléphone est trop court ou invalide.");
      return;
    }

    if (!acceptTerms) {
      setError("Vous devez expressément approuver les Conditions Générales d'Utilisation d'assainissement municipal.");
      return;
    }

    setLoading(true);

    try {
      const generatedId = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
      const selectedPlan = plans.find(p => p.id === planId) || plans[0];

      const newSub: Subscriber = {
        id: generatedId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        neighborhood: neighborhood,
        lat: selectedCoords ? selectedCoords.lat : 5.3489 + (Math.random() - 0.5) * 0.04,
        lng: selectedCoords ? selectedCoords.lng : -3.9995 + (Math.random() - 0.5) * 0.04,
        planId: planId,
        status: 'pending_validation',
        binType: binType,
        lastCollectionDate: 'Jamais',
        currentBinLevel: 0,
        paymentStatus: 'unpaid',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        collectionsRealized: 0,
        unpaidDays: 0
      };

      // Add to main state
      await onAddSubscriber(newSub);

      // Log notification entry
      if (onAddNotificationLogs) {
        onAddNotificationLogs({
          id: `MSG-${Math.floor(1000 + Math.random() * 9000)}-Q`,
          recipientName: name.trim(),
          recipientContact: phone.trim(),
          type: 'sms',
          templateName: 'Bienvenue d\'Abidjan',
          content: `Félicitations ${name}! Votre inscription municipale AKPBF sous la formule ${selectedPlan.name} est validée. ID client provisoire: ${generatedId}. Point GPS : ${newSub.lat.toFixed(5)}, ${newSub.lng.toFixed(5)}.`,
          sentAt: new Date().toISOString(),
          status: 'sent'
        });
      }

      setRegisteredId(generatedId);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Une erreur technique est survenue durant l'enregistrement de votre abonnement.");
      setLoading(false);
    }
  };

  return (
    <div id="standalone-register-page" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans leading-normal overflow-hidden select-none">
      
      {/* Decorative starry background highlights */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="flex justify-center flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-emerald-505 bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <span className="text-[10.5px] uppercase font-black text-emerald-400 tracking-widest font-mono">INSCRIPTIONS OFFICIELLES</span>
          <h2 className="mt-2 text-center text-2xl font-black text-white tracking-tight">
            Abonnement de Collecte & d'Assainissement
          </h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Adhésion citoyenne numérique gérée par la plateforme technologique AKPBF Abidjan.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900/60 backdrop-blur-md py-8 px-6 sm:px-10 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6">
          
          {registeredId ? (
            /* SUCCESS PANEL SCREEN */
            <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                <Check className="h-8 w-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Souscription Enregistrée !</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Votre dossier citoyen a été indexé avec succès dans le registre d'Abidjan. Un agent municipal validera votre raccordement sous 24h.
                </p>
              </div>

              {/* Citizen ID Certificate */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-805/80 space-y-3 max-w-xs mx-auto">
                <span className="text-[9px] uppercase font-black tracking-widest font-mono text-indigo-400 block">ID CLIENT PROVISOIRE INDÉLÉBILE</span>
                <span className="text-2xl font-black font-mono text-emerald-400 tracking-wider block">{registeredId}</span>
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  Saisissez cet identifiant ou votre adresse mail sur la page de connexion pour accéder au suivi d’assainissement.
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Aller à la page de Connexion
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM FIELDS */
            <form onSubmit={handleRegisterSubmit} className="space-y-5 text-left">
              {error && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 text-xs p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
                  <Info className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Nom Complet du Citoyen / Foyer</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(null); }}
                      placeholder="Mamadou Coulibaly"
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-650 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none transition"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Adresse E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      placeholder="m.coulibaly@gmail.com"
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-650 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Telephone */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Téléphone d'Abidjan (+225)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input 
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setError(null); }}
                      placeholder="+225 07 48 29 10 22"
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-650 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none transition"
                    />
                  </div>
                </div>

                {/* Neighborhood select */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Quartier / Zone desservie</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <select
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-3 text-xs font-semibold outline-none cursor-pointer transition appearance-none animate-none"
                    >
                      <option value="Cocody">Cocody</option>
                      <option value="Plateau">Plateau</option>
                      <option value="Marcory">Marcory</option>
                      <option value="Yopougon">Yopougon</option>
                      <option value="Abobo">Abobo</option>
                      <option value="Treichville">Treichville</option>
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center sm:flex-row flex-col gap-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Adresse Géographique (Lot, Pavillon, Rue)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMapModalOpen(true)}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50 cursor-pointer"
                    >
                      <Map className="h-3 w-3" />
                      <span>Sélectionner sur la carte</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAutodetectDeviceGps}
                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 transition flex items-center gap-1 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-900/50 cursor-pointer"
                    >
                      <Compass className="h-3 w-3" />
                      <span>GPS Actuel</span>
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input 
                    type="text"
                    required
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setError(null); }}
                    placeholder="Lot 403, Rue de la Pépinière, Face Pharmacie de la Cité"
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-655 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold outline-none transition"
                  />
                </div>

                {/* Coordinates GPS live preview HUD */}
                {selectedCoords && (
                  <div className="mt-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2 md:p-3 flex items-center justify-between text-[11px] font-mono select-none animate-fadeIn">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Secteur :</span>
                      <span className="text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/30">Lat: {selectedCoords.lat.toFixed(5)}</span>
                      <span className="text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/30">Lng: {selectedCoords.lng.toFixed(5)}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 italic max-w-[150px] md:max-w-[220px] truncate">{address || 'Non spécifié'}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subscription Plans Card Picker */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Frais & Formule Souhaitée</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-350 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-extrabold outline-none cursor-pointer transition appearance-none"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price.toLocaleString()} FCFA/mois)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Waste Volume/Bin layout selection */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Module de Bac d'Assainissement</label>
                  <select
                    value={binType}
                    onChange={(e) => setBinType(e.target.value as 'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L')}
                    className="w-full bg-slate-950/80 border border-slate-800 text-slate-350 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs font-extrabold outline-none cursor-pointer transition appearance-none"
                  >
                    <option value="Standard 240L">Standard 240 Litres (Foyers)</option>
                    <option value="Bac Grand 360L">Grand Modèle 360 Litres (Moyennes structures)</option>
                    <option value="Conteneur 1100L">Conteneur Collectif 1100 Litres (Résidences/Cliniques)</option>
                  </select>
                </div>
              </div>

              {/* Conditions Generales d'Utilisation Checkbox */}
              <div className="pt-2 border-t border-slate-800/60">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-[10.5px] leading-relaxed font-semibold text-slate-400">
                  <input 
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-800 text-emerald-600 focus:ring-emerald-555 outline-none bg-slate-950 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    J'approuve formellement les <strong>Conditions Générales d’Utilisation (CGU)</strong> d’AKPBF S.A, et autorise le traitement de mes coordonnées pour l'exécution réglementaire du raccordement de voirie et de facturation municipale d'Abidjan.
                  </span>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none tracking-wide transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Validation réglementaire en cours...</span>
                ) : (
                  <>
                    <FileCheck className="h-4.5 w-4.5" />
                    <span>Créer mon abonnement municipal</span>
                  </>
                )}
              </button>

              {/* Bidirectional return login page */}
              <div className="pt-3 border-t border-slate-805/80 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs font-bold text-slate-450 hover:text-white transition inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>J'ai déjà un compte ? Me connecter</span>
                </button>
              </div>
            </form>
          )}

          {/* GEOLOCATION INTERACTIVE MAP MODAL SUB-VIEW OVERLAY */}
          {isMapModalOpen && (
            <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fadeIn">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden shadow-2xl">
                
                {/* Header of Modal */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-lg border border-emerald-900/60">
                      <Map className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">Positionnement Cartographique du Client</h3>
                      <p className="text-[10px] text-slate-400">Glissez le marqueur ou cliquez sur le plan pour cibler les coordonnées de raccordement municipaux d'Abidjan.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMapModalOpen(false);
                      setMapSearchResults([]);
                    }}
                    className="text-xs font-black px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                  >
                    Fermer (Échap)
                  </button>
                </div>

                {/* Sub-Header: Search bar with lookup Nominatim API */}
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 relative z-30">
                  <form onSubmit={handleAddressSearchInMap} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        placeholder="Rechercher une adresse, une rue ou un repère à Abidjan (ex: Rue des Jardins, Deux Plateaux)..."
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold outline-none transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearchingAddress}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      {isSearchingAddress ? (
                        <span>Recherche...</span>
                      ) : (
                        <>
                          <Navigation className="h-3.5 w-3.5 shrink-0" />
                          <span>Rechercher</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Search suggestions custom floating drop overlay */}
                  {mapSearchResults.length > 0 && (
                    <div className="absolute left-4 right-4 mt-1.5 bg-slate-900 border border-slate-805 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-800 z-50">
                      {mapSearchResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSearchResult(item)}
                          className="p-2.5 text-xs text-slate-300 hover:bg-emerald-950/20 hover:text-emerald-300 cursor-pointer transition flex items-start gap-2 text-left"
                        >
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                          <div>
                            <p className="font-bold">{item.name || 'Adresse trouvée'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{item.display_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Leaflet map layout div or loading notice */}
                <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
                  {!leafletLoaded && (
                    <div className="text-center space-y-2 p-6">
                      <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-xs text-slate-400">Chargement de la base cartographique OpenStreetMap...</p>
                    </div>
                  )}
                  
                  {/* Real leaflet rendering container */}
                  <div
                    id="register-selector-map"
                    className="absolute inset-0 z-10 bg-slate-950"
                    style={{ visibility: leafletLoaded ? 'visible' : 'hidden' }}
                  ></div>
                </div>

                {/* Footer validation HUD */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex flex-col md:flex-row items-center justify-between gap-3 relative z-20">
                  <div className="text-left text-xs bg-slate-950/50 py-2 px-3 rounded-xl border border-slate-800/80 flex items-center gap-2.5 w-full md:w-auto">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <div className="font-bold flex gap-2">
                        <span className="text-slate-450 uppercase text-[9px] tracking-wider font-extrabold shrink-0 mt-0.5">Point GPS :</span>
                        <span className="text-slate-200">Lat: {selectedCoords?.lat ? selectedCoords.lat.toFixed(6) : '--'}</span>
                        <span className="text-slate-200">Lng: {selectedCoords?.lng ? selectedCoords.lng.toFixed(6) : '--'}</span>
                      </div>
                      <p className="text-[10px] text-slate-450 truncate max-w-[280px] md:max-w-md">{mapSearchQuery || 'Glissez le marqueur pour rafraîchir l\'adresse'}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={handleAutodetectDeviceGps}
                      className="flex-1 md:flex-none uppercase tracking-wider text-[10px] font-black bg-slate-850 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>GPS Mobile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCoords) {
                          if (mapSearchQuery) {
                            setAddress(mapSearchQuery);
                          } else {
                            setAddress(`Zone ${neighborhood} (GPS Certifié)`);
                          }
                        }
                        setIsMapModalOpen(false);
                      }}
                      className="flex-1 md:flex-none uppercase tracking-wider text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Valider cette position</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
