/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  User, 
  Truck, 
  Sliders, 
  Phone, 
  Lock, 
  Compass, 
  TrendingUp, 
  Award 
} from 'lucide-react';
import { CollectorAgent } from '../types';

interface AgentsViewProps {
  agents: CollectorAgent[];
  onAddAgent: (newAgent: CollectorAgent) => void;
  onDeleteAgent: (id: string) => void;
}

export default function AgentsView({ agents, onAddAgent, onDeleteAgent }: AgentsViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [activeVehicle, setActiveVehicle] = useState('Benne Tasseuse Renault D16');

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !licensePlate) return;

    const newAgent: CollectorAgent = {
      id: `AGT-${Math.floor(100 + Math.random() * 900)}`,
      name,
      phone,
      licensePlate,
      status: 'idle',
      assignedRouteId: null,
      activeVehicle,
      totalCollectedKg: 0
    };

    onAddAgent(newAgent);
    setIsAddOpen(false);
    
    setName('');
    setPhone('');
    setLicensePlate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-850 tracking-tight">Gestion des Agents & Équipages de Collecte</h2>
          <p className="text-slate-500 text-sm mt-0.5">Suivi d'activité des chauffeurs, gestion du parc roulant lourd et performance d'enlèvement</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="self-start sm:self-center flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-indigo-100 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Enregistrer un Équipage
        </button>
      </div>

      {/* Aggregate indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-lg">
            <User className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Effectif Équipage</span>
            <div className="text-lg font-black text-slate-800">{agents.length} Chauffeurs</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Parc Roulant Mobilisé</span>
            <div className="text-lg font-black text-slate-800">{agents.filter(a=>a.status === 'on_tour').length} en tournée / {agents.length} véhicules</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Volume Total Ramassé</span>
            <div className="text-lg font-black text-slate-800">
              {agents.reduce((sum, a) => sum + a.totalCollectedKg, 0).toLocaleString()} Kg
            </div>
          </div>
        </div>
      </div>

      {/* Agent details grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 shadow-xs relative overflow-hidden group hover:border-indigo-200 transition duration-150">
            {/* Top info and deletion */}
            <div className="flex justify-between items-start">
              <div className="flex gap-2.5 items-center">
                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-bold font-mono">
                  {agent.name.split(' ').map(s=>s[0]).join('')}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-650 transition">{agent.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono font-bold block">{agent.id}</span>
                </div>
              </div>
              
              <button 
                onClick={() => onDeleteAgent(agent.id)}
                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition duration-150 active:scale-95"
                title="Résilier"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Vehicle & Plate specifications */}
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Engin affecté :</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-indigo-500" />
                  {agent.activeVehicle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Plaque d'Immat. :</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded text-[10px]">{agent.licensePlate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Poids Net ramassé :</span>
                <span className="font-semibold text-slate-800">{agent.totalCollectedKg.toLocaleString()} Kg</span>
              </div>
            </div>

            {/* Tel & Route assignment status */}
            <div className="flex items-center justify-between text-xs pt-1">
              <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg font-bold transition">
                <Phone className="h-3.5 w-3.5" />
                Téléphoner
              </a>

              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                agent.status === 'on_tour' ? 'bg-emerald-100 text-emerald-800' :
                agent.status === 'idle' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {agent.status === 'on_tour' ? '● En Tournée' : '● Disponible'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: NEW AGENT ENROLLMENT FORM */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-indigo-650 p-4 font-bold text-white flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-5 w-5" />
                <span>Enregistrer un Camionneur / Agent</span>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-indigo-200 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wild block">Nom complet de l'Agent *</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Dembélé Alassane"
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wild block">Ligne Mobile (Dépêches) *</label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +225 01 02 03 04 05"
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wild block">Plaque d'Immatriculation de l'Engin *</label>
                <input 
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="Ex: CI-9922-EF"
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wild block">Type d'Engin Spécialisé *</label>
                <select 
                  value={activeVehicle}
                  onChange={(e) => setActiveVehicle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-xs rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="Benne Tasseuse Renault D16">Benne Tasseuse Renault D16 (Modéré)</option>
                  <option value="Compacteur Iveco Stralis">Compacteur Iveco Stralis (Grand Volume)</option>
                  <option value="Benne Tasseuse Scania P250">Benne Tasseuse Scania P250 (Renforcé)</option>
                  <option value="Camion Benne Léger Toyota">Camion Benne Léger Toyota (Ruelles)</option>
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
                  Confirmer l'embauche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
