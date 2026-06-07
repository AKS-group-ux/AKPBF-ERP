/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Wrench, 
  ShieldAlert, 
  AlertTriangle, 
  Calendar, 
  Activity, 
  Plus, 
  Fuel, 
  CheckCircle2, 
  Gauge, 
  UserPlus,
  RefreshCw
} from 'lucide-react';

interface Vehicle {
  id: string;
  licensePlate: string;
  brandModel: string;
  driverName: string;
  mileageKm: number;
  lastServiceMileage: number;
  insuranceExpiryDate: string;
  maintenanceInspectionDate: string;
  avgFuelConsumptionLitres: number;
  status: 'active' | 'maintenance' | 'out_of_service';
}

const INITIAL_VEHICLES: Vehicle[] = [];

interface MaintenanceItem {
  id: string;
  vehicleId: string;
  date: string;
  type: 'Vidange' | 'Freins' | 'Pneumatiques' | 'Moteur' | 'Autres';
  costFcfa: number;
  mechanicName: string;
  status: 'completed' | 'scheduled';
}

const INITIAL_MAINTENANCE_LOG: MaintenanceItem[] = [];

export default function FleetView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [maintenanceLog, setMaintenanceLog] = useState<MaintenanceItem[]>(INITIAL_MAINTENANCE_LOG);
  
  // Interactive Update State for Mileage
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [addedMileage, setAddedMileage] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [updateStatusMsg, setUpdateStatusMsg] = useState('');

  // Form to add a new vehicle
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [vehPlate, setVehPlate] = useState('');
  const [vehBrand, setVehBrand] = useState('');
  const [vehDriver, setVehDriver] = useState('');
  const [vehMileage, setVehMileage] = useState('');
  const [vehCons, setVehCons] = useState('25');

  // Compute vehicles status
  const alertsList = useMemo(() => {
    const list: string[] = [];
    const today = new Date('2026-05-22');

    vehicles.forEach(v => {
      // 1. Vidange Alert (if mileage since last service is >= 10,000 km)
      if (v.mileageKm - v.lastServiceMileage >= 10000) {
        list.push(`⚠️ Vidange requise d'urgence pour le Camion Colecteur ${v.id} (Plaque: ${v.licensePlate}). Écart: ${v.mileageKm - v.lastServiceMileage} Km.`);
      }

      // 2. Insurance Expiry
      const insuranceDate = new Date(v.insuranceExpiryDate);
      if (insuranceDate < today) {
        list.push(`🚨 Assurance EXPIRÉE pour le Camion ${v.id} (Date limite: ${v.insuranceExpiryDate}). Circulation interdite !`);
      } else {
        const timeDiff = insuranceDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysDiff <= 30) {
          list.push(`⚠️ Échéance d'assurance proche pour le Camion ${v.id} (Expire dans ${daysDiff} jours).`);
        }
      }

      // 3. Technical Inspection Expiry
      const inspectionDate = new Date(v.maintenanceInspectionDate);
      if (inspectionDate < today) {
        list.push(`🚨 Contrôle Technique EXPIRÉ pour le Camion ${v.id} (Dépassement de la date du ${v.maintenanceInspectionDate}).`);
      } else {
        const timeDiff = inspectionDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysDiff <= 15) {
          list.push(`⚠️ Contrôle Technique obligatoire d'ici ${daysDiff} jours pour le Camion ${v.id}.`);
        }
      }
    });

    return list;
  }, [vehicles]);

  // Update odometer log
  const handleUpdateOdometer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !addedMileage) {
      setUpdateStatusMsg('⚠️ Veuillez remplir correctement les données d\'odomètre.');
      return;
    }

    const val = parseInt(addedMileage);
    if (isNaN(val) || val <= 0) return;

    setVehicles(prev => prev.map(v => {
      if (v.id === selectedVehicleId) {
        return {
          ...v,
          mileageKm: v.mileageKm + val,
          driverName: selectedDriver ? selectedDriver : v.driverName
        };
      }
      return v;
    }));

    setAddedMileage('');
    setSelectedDriver('');
    setUpdateStatusMsg(`Odomètre mis à jour avec succès (+${val} Km).`);
  };

  // Create Vehicle
  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehPlate || !vehBrand) return;

    const newVeh: Vehicle = {
      id: `CAM-40${vehicles.length + 2}`,
      licensePlate: vehPlate,
      brandModel: vehBrand,
      driverName: vehDriver || 'Non assigné',
      mileageKm: parseFloat(vehMileage) || 12000,
      lastServiceMileage: parseFloat(vehMileage) || 12000,
      insuranceExpiryDate: '2026-12-10',
      maintenanceInspectionDate: '2026-11-20',
      avgFuelConsumptionLitres: parseFloat(vehCons) || 24,
      status: 'active'
    };

    setVehicles([...vehicles, newVeh]);
    setVehPlate('');
    setVehBrand('');
    setVehDriver('');
    setVehMileage('');
    setIsAddVehicleOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">ERP Flotte d'Engins & Maintenance</h2>
          <p className="text-slate-500 text-sm mt-0.5">Surveillance de l'état d'étanchéité, consommation de gazole et alertes de contrôle d'assurances</p>
        </div>

        <button
          onClick={() => setIsAddVehicleOpen(true)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter un Véhicule</span>
        </button>
      </div>

      {/* METRIC GRAPHICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 text-left">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Véhicules Actifs</span>
            <h3 className="text-xl font-black text-emerald-800">{vehicles.filter(v=>v.status==='active').length} / {vehicles.length}</h3>
            <p className="text-slate-400 text-xs">Mise en service opérationnelle</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <Truck className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Moyenne Gazole</span>
            <h3 className="text-xl font-black text-slate-800">25.3 <span className="text-xs font-bold text-slate-400">L / 100 Km</span></h3>
            <p className="text-slate-400 text-xs">Indice de rentabilité énergétique</p>
          </div>
          <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
            <Fuel className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Camions en cabine</span>
            <h3 className="text-xl font-black text-amber-600">{vehicles.filter(v=>v.status==='maintenance').length} en révision</h3>
            <p className="text-slate-400 text-xs">Atelier de réparation mécanique</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Wrench className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alertes Flotte</span>
            <h3 className="text-xl font-black text-rose-700">{alertsList.length} anomalies</h3>
            <p className="text-slate-400 text-xs">Infractions ou révision dues</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* DETAILED FLEET WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        
        {/* AUTOMATED ALERTS LISTING */}
        <div className="bg-white rounded-2xl p-5 border border-slate-205/80 shadow-xs h-fit hover:border-rose-200 transition duration-150">
          <div className="flex items-center gap-1.5 pb-2 border-b border-rose-50">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600 animate-bounce" />
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">Télémétrie d'Alerte Automatique</h3>
          </div>
          
          <div className="mt-3.5 space-y-2.5">
            {alertsList.map((al, idx) => (
              <div key={idx} className="p-3 bg-rose-50 text-rose-950 font-sans text-[11px] leading-relaxed rounded-xl border border-rose-100 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{al}</span>
              </div>
            ))}
            {alertsList.length === 0 && (
              <div className="p-4 text-center bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
                ✓ Aucune infraction d'assurance ou de visite technique constatée.
              </div>
            )}
          </div>

          {/* interactive form: ODOMETER UPDATE */}
          <form onSubmit={handleUpdateOdometer} className="mt-6 pt-4 border-t border-slate-100 space-y-4 text-xs font-sans">
            <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5"><Gauge className="h-4.5 w-4.5 text-indigo-650" /> Reporter Retours de Tournée</h4>
            
            <div className="space-y-1">
              <label className="font-bold text-slate-600">Sélectionner Véhicule :</label>
              <select required value={selectedVehicleId} onChange={e=>setSelectedVehicleId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-705">
                <option value="">-- Choisir Camion --</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} ─ {v.brandModel}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Kilomètres roulés :</label>
                <input required type="number" placeholder="Ex: 450" value={addedMileage} onChange={e=>setAddedMileage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Nouveau Chauffeur :</label>
                <input type="text" placeholder="Ex: Moussa" value={selectedDriver} onChange={e=>setSelectedDriver(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 text-xs" />
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition text-xs cursor-pointer">
              Valider Rapport
            </button>
            {updateStatusMsg && <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold rounded text-[10.5px] mt-1 text-center">{updateStatusMsg}</div>}
          </form>
        </div>

        {/* LIST OF VEHICLES */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest">Registre Général de la Flotte Lourde</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-400 font-sans font-semibold border border-dashed border-slate-200 rounded-xl">
                  Aucun véhicule de la flotte d'assainissement enregistré.
                </div>
              ) : (
                vehicles.map(v => {
                  const isServiceDue = v.mileageKm - v.lastServiceMileage >= 10000;
                  return (
                    <div key={v.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-350 transition space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-slate-800 block text-sm">{v.brandModel}</strong>
                            <span className="text-[10px] font-mono bg-indigo-50/50 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block">{v.id} • Plaque: {v.licensePlate}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                            v.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            v.status === 'maintenance' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-rose-50 text-rose-700 border border-rose-105'
                          }`}>
                            {v.status === 'active' ? 'Opérationnel' : v.status === 'maintenance' ? 'Révision' : 'Arrêt'}
                          </span>
                        </div>

                        <div className="text-xs space-y-1 text-slate-500">
                          <div>Odomètre : <strong className="text-slate-800 font-mono">{v.mileageKm.toLocaleString()} Km</strong></div>
                          <div>Chauffeur Assigné : <strong className="text-indigo-605">{v.driverName}</strong></div>
                          <div>Consommation : <strong className="text-slate-700 font-mono">{v.avgFuelConsumptionLitres} L / 100 Km</strong></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-bold">Prochaine intervention :</span>
                        {isServiceDue ? (
                          <span className="text-rose-700 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded animate-pulse">⚠️ Vidange Requise !</span>
                        ) : (
                          <span className="text-slate-500 font-semibold">{v.maintenanceInspectionDate}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* HISTORIC MAINTENANCE TIMELINE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5"><Wrench className="h-4.5 w-4.5 text-slate-405" /> Carnet de Suivi d’Atelier Mécanique</h3>
            
            <div className="divide-y divide-slate-100 text-xs">
              {maintenanceLog.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-sans font-semibold">
                  Aucun mouvement de maintenance ou de suivi d'atelier enregistré.
                </div>
              ) : (
                maintenanceLog.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 font-sans text-slate-650">
                    <div className="text-left font-sans">
                      <span className="font-mono text-[10px] text-indigo-700 font-bold mr-2">{log.id}</span>
                      <strong className="text-slate-800">{log.type} ─ Camion {log.vehicleId}</strong>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">Mécanicien: {log.mechanicName} • Date: {log.date}</div>
                    </div>
                    <strong className="font-mono text-xs font-black text-emerald-800">{log.costFcfa.toLocaleString()} FCFA</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: ADD VEHICLE */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateVehicle} className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 text-left">
            <div className="bg-emerald-600 p-4 text-white font-extrabold text-xs uppercase tracking-widest">
              Ajouter un Camion-Benne Tasseuse
            </div>
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Plaque d'Immatriculation :</label>
                  <input required type="text" value={vehPlate} onChange={e=>setVehPlate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Ex: CI-01-4412" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Chauffeur assigné :</label>
                  <input type="text" value={vehDriver} onChange={e=>setVehDriver(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Ex: Koffi Marc" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Marque & Modèle constructeur :</label>
                <input required type="text" value={vehBrand} onChange={e=>setVehBrand(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Renault Trucks D wide compacteur" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Kilométrage Actuel :</label>
                  <input required type="number" value={vehMileage} onChange={e=>setVehMileage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Ex: 145000" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Consommation moyenne (L/100) :</label>
                  <input required type="number" value={vehCons} onChange={e=>setVehCons(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" placeholder="Ex: 24" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition hover:bg-emerald-700 cursor-pointer">Enregistrer</button>
                <button type="button" onClick={()=>setIsAddVehicleOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold transition hover:bg-slate-200 cursor-pointer">Annuler</button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
