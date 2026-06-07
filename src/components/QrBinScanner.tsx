/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  User, 
  Trash2, 
  History, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Play, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Activity, 
  RefreshCw,
  PlusCircle,
  VideoOff,
  Search,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Subscriber, CollectionProof } from '../types';
import { usePermissions } from '../context/PermissionContext';

// Matching Bins shape
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
  healthScore: number;
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

interface QrBinScannerProps {
  bins: Bin[];
  subscribers: Subscriber[];
  onUpdateBin?: (updatedBin: Bin) => void;
  onUpdateSubscriber?: (sub: Subscriber) => void;
  onAddCollectionProof?: (proof: CollectionProof) => void;
}

export default function QrBinScanner({ 
  bins, 
  subscribers, 
  onUpdateBin,
  onUpdateSubscriber,
  onAddCollectionProof
}: QrBinScannerProps) {
  const { requestPermission } = usePermissions();
  const [selectedScannedBin, setSelectedScannedBin] = useState<Bin | null>(bins[0] || null);
  const [activeSubDetails, setActiveSubDetails] = useState<Subscriber | null>(null);

  // QR States
  const [scannedCode, setScannedCode] = useState<string>('AKPBF-QR-1000');
  const [isRealWebcamActive, setIsRealWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string>('');
  const [scanLaserActive, setScanLaserActive] = useState<boolean>(false);
  const [manualCodeQuery, setManualCodeQuery] = useState<string>('');

  // Live action states
  const [isRecordingInspection, setIsRecordingInspection] = useState<boolean>(false);
  const [inspectorName, setInspectorName] = useState<string>('Agent Kouassi (Camion B04)');
  const [defectNotes, setDefectNotes] = useState<string>('Parfait état de scellement robotique.');
  const [selectedInspectScore, setSelectedInspectScore] = useState<number>(95);
  const [selectedInspectState, setSelectedInspectState] = useState<'Excellent' | 'Bon' | 'Moyen' | 'Mauvais' | 'Critique'>('Excellent');
  const [inspectSucessMsg, setInspectSucessMsg] = useState<string>('');
  const [collectionFeedback, setCollectionFeedback] = useState<string>('');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  // Sync subscriber details whenever selected bin changes
  useEffect(() => {
    if (selectedScannedBin) {
      const sub = subscribers.find(s => s.id === selectedScannedBin.subscriberId);
      setActiveSubDetails(sub || null);
    } else {
      setActiveSubDetails(null);
    }
  }, [selectedScannedBin, subscribers]);

  // Clean up html5-qrcode instance on toggle or unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const startCameraScanner = async () => {
    setWebcamError('');
    
    // Explicit browser permission request beforehand
    const isGranted = await requestPermission('camera');
    if (!isGranted) {
      setWebcamError(
        "⚠️ L'accès à la caméra a été explicitement bloqué ou refusé par l'utilisateur. Le mode SIMULATEUR interactif muni de codes de Ouagadougou reste pleinement actif."
      );
      return;
    }

    setIsRealWebcamActive(true);
    setScanLaserActive(true);

    // Wait a brief timeout for DOM element mounting
    setTimeout(async () => {
      try {
        const scannerElement = document.getElementById('qr-scanner-webcam-mount');
        if (!scannerElement) {
          throw new Error("Élément de montage camera manquant.");
        }

        const html5Qrcode = new Html5Qrcode('qr-scanner-webcam-mount');
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' }, // Rear camera preferred on mobile
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            // Successfully read QR code
            handleProcessScannedText(decodedText);
          },
          () => {
            // Verbose logging of frame mismatch - benign
          }
        );
      } catch (err: any) {
        console.error("Camera scanner launch failure", err);
        setWebcamError(
          "⚠️ Impossible d'activer la caméra. Les iFrames restreignent parfois ces permissions ou aucune webcam n'est connectée. Le mode SIMULATEUR interactif reste disponible ci-dessous."
        );
        setIsRealWebcamActive(false);
        setScanLaserActive(false);
      }
    }, 300);
  };

  const stopCameraScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error("Error stopping qr reader", err);
      }
      html5QrcodeRef.current = null;
    }
    setIsRealWebcamActive(false);
    setScanLaserActive(false);
  };

  const handleProcessScannedText = (decodedText: string) => {
    setScannedCode(decodedText);
    
    // Play subtle synthetic beep audio if support allows
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 Note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      // Ignored
    }

    // Try finding in current items
    const matched = bins.find(
      b => b.qrCode.toLowerCase() === decodedText.toLowerCase() || 
           b.id.toLowerCase() === decodedText.toLowerCase()
    );

    if (matched) {
      setSelectedScannedBin(matched);
      setCollectionFeedback(`🎯 Code QR ${decodedText} identifié avec succès !`);
    } else {
      setCollectionFeedback(`⚠️ Code ${decodedText} scanné mais non répertorié.`);
    }

    setTimeout(() => {
      setCollectionFeedback('');
    }, 4500);

    // Auto close camera after single valid scan for client portal flow
    stopCameraScanner();
  };

  const simulateQuickScan = (qrValue: string) => {
    setScanLaserActive(true);
    setScannedCode(qrValue);

    setTimeout(() => {
      handleProcessScannedText(qrValue);
      setScanLaserActive(false);
    }, 1200);
  };

  const handleSearchCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeQuery.trim()) return;
    simulateQuickScan(manualCodeQuery);
  };

  const handleApplySimulatedCollection = () => {
    if (!selectedScannedBin) return;

    // Trigger state clearing (simulate tipping bin details to 0%)
    if (onUpdateSubscriber && activeSubDetails) {
      const refreshed: Subscriber = {
        ...activeSubDetails,
        currentBinLevel: 0,
        lastCollectionDate: 'À l\'instant (Confirmé QR)'
      };
      onUpdateSubscriber(refreshed);
    }

    if (onAddCollectionProof && activeSubDetails) {
      const now = new Date();
      const planLabel = activeSubDetails.planId === 'plan_premium' ? 'Contrat Premium (3 passages)' : 'Contrat Économique (1 passage)';
      const proof: CollectionProof = {
        id: `PRF-${Math.floor(1000 + Math.random() * 9000)}`,
        collectionDate: now.toISOString().split('T')[0],
        collectionTime: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        clientId: activeSubDetails.id,
        clientName: activeSubDetails.name,
        contractRef: `CNT-2026-${activeSubDetails.id.replace('AKPBF-', '').replace('SUB-', '')}`,
        planName: planLabel,
        agentName: inspectorName,
        vehiclePlate: 'BF-226-B42',
        status: 'À l\'instant (Confirmé QR)',
        comments: `Collecte régulière validée par RFID / Scanner QR. Conteneur: ${selectedScannedBin.capacity}. Poids estimé: 14.5 kg.`,
        // Future passages extensibility
        photoBeforeUrl: 'https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60',
        photoAfterUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=500&auto=format&fit=crop&q=60',
        gpsLatitude: 12.3711 + (Math.random() - 0.5) * 0.02,
        gpsLongitude: -1.5312 + (Math.random() - 0.5) * 0.02,
        clientSignature: `E-SIG-STAMP-${Math.floor(100000 + Math.random() * 900000)}`,
        qrCodeVal: selectedScannedBin.qrCode
      };
      onAddCollectionProof(proof);
    }

    setCollectionFeedback(`✅ Collecte Enregistrée et Preuve de Service Générée ! Bac ${selectedScannedBin.id} vidangé.`);
    setTimeout(() => setCollectionFeedback(''), 5000);
  };

  const handleNewInspectionAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScannedBin) return;

    const newInspect = {
      date: new Date().toISOString().split('T')[0],
      inspector: inspectorName,
      defectsDetected: selectedInspectScore < 70 ? ['Usure mécanique du tiroir', 'Légère corrosion du couvercle'] : [],
      score: selectedInspectScore,
      notes: defectNotes,
      state: selectedInspectState
    };

    const newPhoto = {
      date: new Date().toISOString().split('T')[0],
      url: 'https://images.unsplash.com/photo-1591193686104-fddba4d0e4d8?w=500&auto=format&fit=crop&q=60',
      note: `Inspection QR Locale - ${inspectorName}`,
      classification: selectedInspectState
    };

    const updatedBin: Bin = {
      ...selectedScannedBin,
      status: selectedInspectState as any,
      healthScore: selectedInspectScore,
      inspections: [newInspect, ...selectedScannedBin.inspections],
      photoHistory: [newPhoto, ...selectedScannedBin.photoHistory]
    };

    if (onUpdateBin) {
      onUpdateBin(updatedBin);
    }

    setSelectedScannedBin(updatedBin);
    setIsRecordingInspection(false);
    setInspectSucessMsg('✓ Nouvelle fiche d\'inspection ajoutée avec succès !');
    setTimeout(() => setInspectSucessMsg(''), 4500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      
      {/* LEFT COLUMN: LIVE SCANNER OR INTERACTIVE RADAR FEED */}
      <div className="lg:col-span-7 space-y-5 text-left">
        
        {/* UPPER STATUS SUMMARY */}
        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-5 shadow-md flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-400 uppercase tracking-widest pl-0.5">
              <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
              <span>Outil Chauffeur Mobile & Collecte Routière</span>
            </div>
            <h3 className="text-sm font-black text-slate-100">Lecteur RFID / Scanner de Code QR Intelligent</h3>
            <p className="text-[11px] text-slate-400">Scannez le QR imprimé sur le flanc du bac avec le capteur ou utilisez le simulateur tactile ci-dessous.</p>
          </div>
          <span className="font-mono text-emerald-400 font-black text-xs bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-900">
            {bins.length} QR Référencés
          </span>
        </div>

        {/* 1. MAIN DISPLAY FEED: CAMERA VIEW OR LASER GRID SIMULATOR */}
        <div className="bg-white border border-slate-205 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="h-4.5 w-4.5 text-indigo-600" />
              Capteur en Temps Réel
            </h4>

            {isRealWebcamActive ? (
              <button 
                onClick={stopCameraScanner}
                className="bg-red-50 text-red-700 font-extrabold text-[11px] py-1.5 px-3 rounded-xl hover:bg-red-100 transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <VideoOff className="h-3.5 w-3.5" />
                Désactiver Caméra
              </button>
            ) : (
              <button 
                onClick={startCameraScanner}
                className="bg-indigo-600 text-white font-extrabold text-[11px] py-1.5 px-3.5 rounded-xl hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Camera className="h-3.5 w-3.5" />
                Scanner avec la Webcam
              </button>
            )}
          </div>

          {/* ACTIVE LIVE GRID RENDER FOR CAMERA */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center text-slate-300">
            
            {/* Native HTML5-QR webcam mounting div target */}
            {isRealWebcamActive && (
              <div 
                id="qr-scanner-webcam-mount" 
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            )}

            {/* Simulated Radar Overlay if we have standard frame scanning */}
            {!isRealWebcamActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4 text-center">
                <div className="relative w-40 h-40 border border-indigo-500/30 rounded-3xl flex items-center justify-center bg-slate-900/60 shadow-lg">
                  {/* Glowing bounding box corners */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>

                  <QrCode className={`h-20 w-20 text-slate-300 ${scanLaserActive ? 'animate-pulse scale-90' : 'scale-100'} transition duration-500`} />
                  
                  {/* Bouncing Scanning Laser */}
                  {scanLaserActive && (
                    <div className="absolute inset-x-2 bg-emerald-400 h-0.5 animate-bounce shadow-[0_0_12px_rgba(52,211,153,1)] z-20"></div>
                  )}
                </div>

                <div className="space-y-1 max-w-sm">
                  <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase">MODÈLE DÉTECTION : AKPBF-QRCODE-SCANNER</span>
                  <p className="text-[11px] text-slate-400">Prêt pour capture de code ... Scannez l'un des codes abonnés répertoriés ci-dessous pour lancer l'audit direct.</p>
                </div>
              </div>
            )}

            {/* Upper Telemetry indicators (Retro HUD layout) */}
            <div className="absolute top-3 inset-x-3 flex justify-between items-center text-[9px] font-mono font-bold bg-black/40 p-2 rounded-xl border border-white/10 z-20 text-indigo-300">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                LIVE STREAM [{scannedCode || 'PRET'}]
              </span>
              <span>ISO 1200 • RESOLUTION 120DPI</span>
            </div>

            {/* Bottom HUD indicators */}
            <div className="absolute bottom-3 inset-x-3 flex justify-between items-center text-[9px] font-mono font-bold bg-black/40 p-2 rounded-xl border border-white/10 z-20 text-slate-400">
              <span>LAT : +12.37110 | LNG : -1.53120</span>
              <span>PROXIMITÉ : <span className="text-emerald-400">SLA VALIDE</span></span>
            </div>
          </div>

          {/* Feedback log messages */}
          {collectionFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-xs font-bold text-center animate-bounce">
              {collectionFeedback}
            </div>
          )}

          {webcamError && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-[10.5px] leading-relaxed text-left">
              {webcamError}
            </div>
          )}

          {/* 2. MANUAL OR SIMULATED INTERACTIVE CONTROLS */}
          <div className="bg-slate-55 border border-slate-150 p-4 rounded-2xl md:flex md:items-center md:justify-between gap-4">
            
            <form onSubmit={handleSearchCode} className="flex gap-2 flex-1">
              <input 
                type="text"
                placeholder="Entrer un ID (ex: AKPBF-QR-1002)..."
                className="bg-white border border-slate-205 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 flex-1 outline-hidden"
                value={manualCodeQuery}
                onChange={(e) => setManualCodeQuery(e.target.value)}
              />
              <button
                type="submit"
                className="bg-slate-900 text-white font-extrabold text-xs py-1.5 px-3.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Scan Manuel
              </button>
            </form>

            <div className="text-[11px] font-bold text-slate-500 pl-1 mt-2 md:mt-0">
              💡 <span className="text-slate-700">Scan Simulator :</span> Cliquez sur un abonné ci-dessous pour simuler la photo-numérisation de son code.
            </div>
          </div>

        </div>

        {/* 3. LIST OF SCANABLE REGISTERED QRCODES */}
        <div className="bg-white border border-slate-205 rounded-3xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            📋 Liste des codes QR imprimés sur les Bacs et Abonnés
          </h4>
          <p className="text-[11px] text-slate-400">Identifiants officiels d'assainissement stockés dans PostgreSQL. Cliquez sur "Simuler" pour injecter le code dans le lecteur.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {bins.slice(0, 10).map((b) => {
              const isSelected = selectedScannedBin?.id === b.id;
              const subMatches = subscribers.find(s => s.id === b.subscriberId);
              const isFull = (subMatches?.currentBinLevel ?? 0) >= 80;
              return (
                <div 
                  key={b.id}
                  className={`p-3 rounded-2xl border transition text-left flex items-center justify-between gap-2 ${
                    isSelected 
                      ? 'border-indigo-400 bg-indigo-50/10' 
                      : 'border-slate-150 hover:border-slate-250 bg-slate-50/40'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-[11px] text-slate-800 truncate">{b.subscriberName}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{b.qrCode} ({b.capacity})</div>
                    <div className="flex gap-1.5 items-center mt-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${isFull ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></span>
                      <span className="text-[9.5px] font-bold text-slate-500">Niveau : <span className="text-slate-800">{subMatches?.currentBinLevel ?? 0}%</span></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => simulateQuickScan(b.qrCode)}
                    disabled={scanLaserActive}
                    className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold text-[9px] py-1.5 px-2.5 rounded-xl cursor-pointer transition uppercase"
                  >
                    Simuler Scan
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: PULL-UP INSPECTIONS AND HISTORY DETAILS */}
      <div className="lg:col-span-5 text-left space-y-5">
        
        {selectedScannedBin ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* CARTE D'AUDIT TECHNIQUE IDENTIFIÉ */}
            <div className="bg-white border border-slate-205 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 rounded px-1.5 py-0.5 font-mono">
                    ID BAC : {selectedScannedBin.id}
                  </span>
                  <h3 className="font-black text-slate-900 text-base mt-1 flex items-center gap-1">
                    🎯 Fiche d'Assainissement
                  </h3>
                  <div className="text-slate-400 text-[10.5px] font-mono">
                    Code QR : <span className="font-extrabold text-slate-700">{selectedScannedBin.qrCode}</span>
                  </div>
                </div>

                <div className={`p-1.5 rounded-xl text-center text-[10px] font-black ${
                  selectedScannedBin.status === 'Excellent' || selectedScannedBin.status === 'Bon'
                    ? 'bg-emerald-50 text-emerald-800' 
                    : selectedScannedBin.status === 'Moyen'
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-rose-50 text-rose-850 animate-pulse'
                }`}>
                  Condition : {selectedScannedBin.status}
                </div>
              </div>

              {/* DETAILS METADATA */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] leading-relaxed">
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Abonné propriétaire</span>
                  <strong className="text-slate-800 font-extrabold block text-xs">{selectedScannedBin.subscriberName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Secteur d'affectation</span>
                  <strong className="text-slate-800 font-black block text-xs">📍 {selectedScannedBin.neighborhood}</strong>
                </div>
                <div className="border-t border-slate-200/60 pt-2.5">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Caractéristiques matériel</span>
                  <span className="text-slate-700 font-bold">{selectedScannedBin.capacity} • {selectedScannedBin.color}</span>
                </div>
                <div className="border-t border-slate-200/60 pt-2.5">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Niveau Remplissage Actuel</span>
                  <span className={`font-black text-xs ${
                    (activeSubDetails?.currentBinLevel ?? 0) >= 80 ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {activeSubDetails?.currentBinLevel ?? 0}% {(activeSubDetails?.currentBinLevel ?? 0) >= 80 ? '(Saturé !)' : ''}
                  </span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleApplySimulatedCollection}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  Valider Vidage (Collecte)
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecordingInspection(!isRecordingInspection)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="h-4 w-4 shrink-0 text-slate-400" />
                  Rédiger Inspection
                </button>
              </div>

              {inspectSucessMsg && (
                <div className="text-[10.5px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 text-center rounded-xl p-2.5">
                  {inspectSucessMsg}
                </div>
              )}

              {/* EXPANDABLE NEW INSPECTION IN-LINE FORM */}
              {isRecordingInspection && (
                <form onSubmit={handleNewInspectionAdd} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block border-b pb-1">Ajouter une inspection RFID / QR</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Contrôleur Chauffeur</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs font-bold"
                        value={inspectorName}
                        onChange={(e) => setInspectorName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block">Score physique (0-100)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        required
                        className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs font-mono font-bold"
                        value={selectedInspectScore}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSelectedInspectScore(val);
                          setSelectedInspectState(val >= 85 ? 'Excellent' : val >= 70 ? 'Bon' : val >= 50 ? 'Moyen' : val >= 30 ? 'Mauvais' : 'Critique');
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Note technique de salubrité</label>
                    <textarea 
                      className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs font-semibold h-14"
                      value={defectNotes}
                      onChange={(e) => setDefectNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button 
                      type="button"
                      onClick={() => setIsRecordingInspection(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-black cursor-pointer shadow-sm"
                    >
                      Enregistrer dans SQL
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* HISTORIQUE PULL-UP DES INSPECTIONS COMPLETES */}
            <div className="bg-white border border-slate-205 rounded-3xl p-5 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-4 w-4 text-emerald-600" />
                Historique de Surveillance & Rapports
              </h4>

              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                {selectedScannedBin.inspections.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-4">Aucune vérification enregistrée sur ce conteneur.</p>
                ) : (
                  selectedScannedBin.inspections.map((ins, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] leading-relaxed relative hover:border-indigo-250 transition text-left space-y-2">
                      
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-slate-850 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{ins.inspector}</span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                          {ins.date}
                        </span>
                      </div>

                      <div className="text-slate-600">
                        {ins.notes}
                      </div>

                      {ins.defectsDetected.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ins.defectsDetected.map((df, dfIdx) => (
                            <span key={dfIdx} className="text-[8.5px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-100 px-1.5 rounded">
                              🚨 {df}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-1.5">
                        <span className="text-slate-400 font-bold">État final d'audit :</span>
                        <span className={`font-black ${
                          ins.score >= 80 ? 'text-emerald-700' : ins.score >= 50 ? 'text-amber-700' : 'text-red-700'
                        }`}>
                          {ins.state} ({ins.score}/100)
                        </span>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-3xl space-y-3 shrink-0">
            <QrCode className="h-10 w-10 text-slate-350 mx-auto animate-pulse" />
            <strong className="text-slate-700 text-xs block">Aucun bac scanné</strong>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Veuillez scanner ou simuler un scan de code QR ou RFID abonné pour charger instantanément les informations d'inspection sur cet écran.</p>
          </div>
        )}

      </div>

    </div>
  );
}
