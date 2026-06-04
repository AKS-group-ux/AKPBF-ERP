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
  const [reference, setReference] = useState('');
  const [price, setPrice] = useState(3000);
  const [frequency, setFrequency] = useState<'Mensuel' | 'Trimestriel' | 'Semestriel' | 'Annuel' | 'Personnalisé'>('Mensuel');
  const [durationMonths, setDurationMonths] = useState(12);
  const [collectionFrequency, setCollectionFrequency] = useState('2 fois par semaine');
  const [maxCollectionsCount, setMaxCollectionsCount] = useState(8);
  const [description, setDescription] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('Valable pour les déchets ménagers uniquement.');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
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
      reference: reference || `REF-${name.substring(0, 3).toUpperCase()}-${price}`,
      price: Number(price),
      frequency,
      durationMonths,
      collectionFrequency,
      maxCollectionsCount,
      description,
      termsAndConditions,
      status,
      allowedVolume
    };

    onAddPlan(newPlan);
    resetForm();
  };

  const handleEditInit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setReference(plan.reference || '');
    setPrice(plan.price);
    setFrequency(plan.frequency || 'Mensuel');
    setDurationMonths(plan.durationMonths || 12);
    setCollectionFrequency(plan.collectionFrequency || '2 fois par semaine');
    setMaxCollectionsCount(plan.maxCollectionsCount || 8);
    setDescription(plan.description);
    setTermsAndConditions(plan.termsAndConditions || 'Valable pour les déchets ménagers uniquement.');
    setStatus(plan.status || 'active');
    setAllowedVolume(plan.allowedVolume);
    setIsAddOpen(true);
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !name || !description) return;

    const updatedPlan: SubscriptionPlan = {
      ...editingPlan,
      name,
      reference: reference || editingPlan.reference || `REF-${name.substring(0, 3).toUpperCase()}-${price}`,
      price: Number(price),
      frequency,
      durationMonths,
      collectionFrequency,
      maxCollectionsCount,
      description,
      termsAndConditions,
      status,
      allowedVolume
    };

    onUpdatePlan(updatedPlan);
    resetForm();
  };

  const resetForm = () => {
    setIsAddOpen(false);
    setEditingPlan(null);
    setName('');
    setReference('');
    setPrice(3500);
    setFrequency('Mensuel');
    setDurationMonths(12);
    setCollectionFrequency('2 fois par semaine');
    setMaxCollectionsCount(8);
    setDescription('');
    setTermsAndConditions('Valable pour les déchets ménagers uniquement.');
    setStatus('active');
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
          const isPlanActive = plan.status !== 'inactive';
          return (
            <div 
              key={plan.id}
              className={`bg-white rounded-2xl border ${isPlanActive ? 'border-slate-200' : 'border-slate-200 opacity-60'} shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition duration-200`}
            >
              <div className="absolute top-0 right-0 flex items-center">
                {plan.price > 10000 && (
                  <span className="bg-indigo-600 text-white font-black text-[8px] uppercase px-2 py-1 tracking-wider shadow-sm">
                    Grand Compte
                  </span>
                )}
                <span className={`px-2 py-1 text-[8px] font-bold text-white uppercase ${isPlanActive ? 'bg-emerald-600' : 'bg-slate-500'}`}>
                  {isPlanActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-indigo-700 uppercase bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded font-mono">
                    {plan.reference || plan.id.toUpperCase()}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-2 leading-tight">{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-1.5 pb-2 border-b border-slate-100">
                  <span className="text-3xl font-black price-text !text-slate-950 dark:!text-white tracking-tight">{plan.price.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">FCFA / {plan.frequency}</span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed min-h-[50px]">{plan.description}</p>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                    <span>Durée du contrat :</span>
                    <span className="font-bold text-slate-800">{plan.durationMonths || 12} mois</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                    <span>Fréquence Collecte :</span>
                    <span className="font-bold text-slate-800">{plan.collectionFrequency || '2 fois / sem'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                    <span>Passages mensuels max :</span>
                    <span className="font-bold text-slate-800">{plan.maxCollectionsCount || 8} levées</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                    <span>Seuil volume poubelle :</span>
                    <span className="font-bold text-slate-800">{plan.allowedVolume}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                    <span>Foyers rattachés :</span>
                    <span className="font-bold text-indigo-600">{subscribersCount}</span>
                  </div>
                </div>

                {plan.termsAndConditions && (
                  <div className="p-2 bg-slate-50 rounded-lg text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                    <span className="font-bold block uppercase tracking-wide text-[8px] text-slate-400 mb-0.5">Conditions Générales :</span>
                    {plan.termsAndConditions}
                  </div>
                )}
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

            <form onSubmit={editingPlan ? handleUpdate : handleCreate} className="p-5 space-y-3.5 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Nom du Forfait *</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Forfait Social"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Référence Unique</label>
                  <input 
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex: REF-SOC-2500"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Redevance (FCFA) *</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Fréquence de Facturation</label>
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Mensuel">Mensuel</option>
                    <option value="Trimestriel">Trimestriel</option>
                    <option value="Semestriel">Semestriel</option>
                    <option value="Annuel">Annuel</option>
                    <option value="Personnalisé">Personnalisé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Durée (Mois)</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Collecte/Semaine</label>
                  <input 
                    type="text"
                    required
                    value={collectionFrequency}
                    onChange={(e) => setCollectionFrequency(e.target.value)}
                    placeholder="Ex: 2 fois"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Max Passages/Mois</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={maxCollectionsCount}
                    onChange={(e) => setMaxCollectionsCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Volume Seuil Poubelle</label>
                  <input 
                    type="text"
                    required
                    value={allowedVolume}
                    onChange={(e) => setAllowedVolume(e.target.value)}
                    placeholder="Ex: 240 Litres"
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-500">Statut Forfait</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="active">Actif (Visible)</option>
                    <option value="inactive">Inactif (Désactivé)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Description Commerciale *</label>
                <textarea 
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails des prestations d'enlèvement d'ordures..."
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-500">Conditions Générales de Vente (CGV)</label>
                <textarea 
                  rows={2}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  placeholder="Ex: Délais de carence, types de déchets non pris en charge..."
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
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
