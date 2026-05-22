/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  Plus, 
  Layers, 
  Trash2, 
  CheckCircle2, 
  Coins, 
  Edit3, 
  Sparkles, 
  TrendingUp, 
  Gauge,
  Package,
  CalendarCheck
} from 'lucide-react';
import { SubscriptionPlan, Subscriber } from '../types';

interface SubscriptionPlansViewProps {
  plans: SubscriptionPlan[];
  subscribers: Subscriber[];
  onAddPlan: (plan: SubscriptionPlan) => void;
  onUpdatePlan: (plan: SubscriptionPlan) => void;
  onDeletePlan: (id: string) => void;
}

export default function SubscriptionPlansView({
  plans,
  subscribers,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan
}: SubscriptionPlansViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(3000);
  const [frequency, setFrequency] = useState('Mensuel');
  const [description, setDescription] = useState('');
  const [allowedVolume, setAllowedVolume] = useState('500 Litres/Mois');

  const getSubscribersCountForPlan = (planId: string) => {
    return subscribers.filter(s => s.planId === planId).length;
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !description || !allowedVolume) return;

    const newPlan: SubscriptionPlan = {
      id: `plan_${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      price: Number(price),
      frequency,
      description,
      allowedVolume
    };

    onAddPlan(newPlan);
    resetForm();
  };

  const handleEditInit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setPrice(plan.price);
    setFrequency(plan.frequency);
    setDescription(plan.description);
    setAllowedVolume(plan.allowedVolume);
    setIsAddOpen(true);
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !name || !description) return;

    const updatedPlan: SubscriptionPlan = {
      ...editingPlan,
      name,
      price: Number(price),
      frequency,
      description,
      allowedVolume
    };

    onUpdatePlan(updatedPlan);
    resetForm();
  };

  const resetForm = () => {
    setIsAddOpen(false);
    setEditingPlan(null);
    setName('');
    setPrice(3500);
    setFrequency('Mensuel');
    setDescription('');
    setAllowedVolume('500 Litres/Mois');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Grilles & Abonnements SaaS</h2>
          <p className="text-slate-500 text-sm mt-0.5">Configuration des forfaits d'enlèvement d'ordures, redevances récurrentes et volumes autorisés</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="self-start sm:self-center flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Créer un Forfait d'Assainissement
        </button>
      </div>

      {/* Analytical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-emerald-300 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Forfaits Actifs</span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{plans.length}</h3>
            <p className="text-slate-400 text-xs font-semibold">Gérés par la commune</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-indigo-300 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Abonnement Populaire</span>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Standard Municipal</h3>
            <p className="text-indigo-600 text-xs font-bold flex items-center gap-1 mt-0.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {subscribers.filter(s => s.planId === 'plan_eco').length} abonnés actifs
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Recette Théorique Mensuelle</span>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {plans.reduce((sum, p) => sum + (p.price * getSubscribersCountForPlan(p.id)), 0).toLocaleString()} <span className="text-xs text-slate-500 font-bold">FCFA</span>
            </h3>
            <p className="text-slate-400 text-xs font-semibold">Assiette fiscale potentielle</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Coins className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const subscribersCount = getSubscribersCountForPlan(plan.id);
          return (
            <div 
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-355 transition duration-200"
            >
              {plan.price > 10000 && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white font-black text-[9px] uppercase px-3.5 py-1 rounded-bl-xl tracking-wider shadow-sm">
                  Grand Compte
                </div>
              )}

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-indigo-600/95 uppercase bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 rounded-md font-mono">{plan.id}</span>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-2">{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-1.5 pb-2 border-b border-slate-100">
                  <span className="text-3xl font-black text-slate-950 tracking-tight">{plan.price.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">FCFA / {plan.frequency}</span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed min-h-[50px]">{plan.description}</p>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl text-slate-600/95 font-medium border border-slate-100">
                    <Package className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Seuil de vidage : <strong>{plan.allowedVolume}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl text-slate-600/95 font-medium border border-slate-100">
                    <CalendarCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>Foyers inscrits : <strong>{subscribersCount}</strong></span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button 
                  onClick={() => handleEditInit(plan)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 py-1 px-2 hover:bg-indigo-50/80 rounded"
                >
                  <Edit3 className="h-4 w-4" />
                  Modifier
                </button>
                <button 
                  onClick={() => onDeletePlan(plan.id)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 py-1 px-2 hover:bg-rose-50 rounded"
                  disabled={subscribersCount > 0}
                  title={subscribersCount > 0 ? "Impossible de supprimer un forfait lié à des abonnés" : "Supprimer"}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Create/Edit Plan */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="bg-indigo-650 p-4.5 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm uppercase tracking-wider">{editingPlan ? "Modifier le Forfait" : "Ajouter un Forfait d'Assainissement"}</h3>
              <button onClick={resetForm} className="text-indigo-200 hover:text-white transition cursor-pointer">✕</button>
            </div>

            <form onSubmit={editingPlan ? handleUpdate : handleCreate} className="p-6 space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Nom du Forfait *</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Forfait Social Standard"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Redevance (FCFA) *</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Périodicité</label>
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Mensuel">Mensuel</option>
                    <option value="Hebdomadaire">Hebdomadaire</option>
                    <option value="Trimestriel">Trimestriel</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Volume Autorisé / Limite d'Enlèvement *</label>
                <input 
                  type="text"
                  required
                  value={allowedVolume}
                  onChange={(e) => setAllowedVolume(e.target.value)}
                  placeholder="Ex: 500 Litres/Mois"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Description des Services Inclus *</label>
                <textarea 
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails du ramassage, fréquence de désinfection, etc..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg transition"
                >
                  {editingPlan ? "Enregistrer" : "Créer le Forfait"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
