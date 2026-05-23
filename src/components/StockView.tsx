/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Plus, 
  Minus, 
  AlertCircle, 
  TrendingUp, 
  History, 
  Trash2, 
  Search, 
  CheckCircle2, 
  PackageCheck,
  RefreshCw
} from 'lucide-react';

// Product Interface
interface Product {
  id: string;
  name: string;
  category: 'Poubelles' | 'Sacs' | 'Équipements Équipe' | 'Pièces Camions' | 'Consommables';
  quantityInStock: number;
  minAlertQty: number;
  unitPriceFcfa: number;
  unitOfMeasure: 'Unité' | 'Carton' | 'Rouleau' | 'Kit';
}

// Transaction register logging stock movements
interface Movement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  authorizedBy: string;
  reason: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'STK-001', name: 'Bac Vert Standard 240L (Roulant)', category: 'Poubelles', quantityInStock: 85, minAlertQty: 10, unitPriceFcfa: 12500, unitOfMeasure: 'Unité' },
  { id: 'STK-002', name: 'Bac Noir Grand 360L (Renforcé)', category: 'Poubelles', quantityInStock: 45, minAlertQty: 10, unitPriceFcfa: 18500, unitOfMeasure: 'Unité' },
  { id: 'STK-003', name: 'Sacs Poubelle Épais 50L (Biodégradable)', category: 'Sacs', quantityInStock: 8, minAlertQty: 25, unitPriceFcfa: 4500, unitOfMeasure: 'Rouleau' },
  { id: 'STK-004', name: 'Gants de protection renforcés (latex/Kevlar)', category: 'Équipements Équipe', quantityInStock: 60, minAlertQty: 15, unitPriceFcfa: 2500, unitOfMeasure: 'Unité' },
  { id: 'STK-005', name: 'Bottes de sécurité haute étanchéité', category: 'Équipements Équipe', quantityInStock: 7, minAlertQty: 10, unitPriceFcfa: 7500, unitOfMeasure: 'Unité' },
  { id: 'STK-006', name: 'Plaquettes de frein Camions Renault', category: 'Pièces Camions', quantityInStock: 12, minAlertQty: 4, unitPriceFcfa: 45000, unitOfMeasure: 'Kit' },
  { id: 'STK-007', name: 'Papier thermique tickets guichet caisse', category: 'Consommables', quantityInStock: 150, minAlertQty: 30, unitPriceFcfa: 450, unitOfMeasure: 'Unité' }
];

const INITIAL_MOVEMENTS: Movement[] = [
  { id: 'MV-101', date: '2026-05-20', productId: 'STK-001', productName: 'Bac Vert Standard 240L (Roulant)', type: 'OUT', quantity: 15, authorizedBy: 'Directeur Log.', reason: 'Distribution abonnés Cocody' },
  { id: 'MV-102', date: '2026-05-18', productId: 'STK-003', productName: 'Sacs Poubelle Épais 50L (Biodégradable)', type: 'OUT', quantity: 50, authorizedBy: 'Manager Terrain', reason: 'Livraisons d\'abonnements pro Yopougon' },
  { id: 'MV-103', date: '2026-05-15', productId: 'STK-006', productName: 'Plaquettes de frein Camions Renault', type: 'IN', quantity: 6, authorizedBy: 'Mécano Chef', reason: 'Abonnement d\'urgence Sodirep Sce' },
  { id: 'MV-104', date: '2026-05-10', productId: 'STK-005', productName: 'Bottes de sécurité haute étanchéité', type: 'OUT', quantity: 12, authorizedBy: 'Responsable RH', reason: 'Équipement nouvelle recrue éboueur' }
];

export default function StockView() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [movements, setMovements] = useState<Movement[]>(INITIAL_MOVEMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'movements'>('status');

  // Interactive Form states for Stock Actions
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockActionType, setStockActionType] = useState<'IN' | 'OUT'>('IN');
  const [stockActionQty, setStockActionQty] = useState('');
  const [stockActionReason, setStockActionReason] = useState('');
  const [movementStatusMsg, setMovementStatusMsg] = useState('');

  // Search filter
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Compute low stocks metrics
  const lowStockAlertItems = useMemo(() => {
    return products.filter(p => p.quantityInStock <= p.minAlertQty);
  }, [products]);

  // FIFO Valuation (Valorisation des Stocks)
  // Simply calculates: sum(qty * price in cfa)
  const totalStockValuationFcfa = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.quantityInStock * p.unitPriceFcfa), 0);
  }, [products]);

  // Handle entry-exit transactions
  const handlePerformStockMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !stockActionQty || parseFloat(stockActionQty) <= 0) {
      setMovementStatusMsg('⚠️ Veuillez remplir correctement les champs.');
      return;
    }

    const matchedProduct = products.find(p => p.id === selectedProductId);
    if (!matchedProduct) return;

    const qtyVal = parseInt(stockActionQty);

    // Guard if Stock Out requested with insufficient units
    if (stockActionType === 'OUT' && matchedProduct.quantityInStock < qtyVal) {
      setMovementStatusMsg('❌ Erreur : Quantité en stock insuffisante pour effectuer cette livraison !');
      return;
    }

    // Process new movement log
    const newMovementLog: Movement = {
      id: `MV-${100 + movements.length + 1}`,
      date: '2026-05-22',
      productId: selectedProductId,
      productName: matchedProduct.name,
      type: stockActionType,
      quantity: qtyVal,
      authorizedBy: 'Resp. Stock AKPBF',
      reason: stockActionReason || (stockActionType === 'IN' ? 'Approvisionnement' : 'Sortie d\'exploitation')
    };

    // Reflect quantitative modification
    const updatedProducts = products.map(p => {
      if (p.id === selectedProductId) {
        const factor = stockActionType === 'IN' ? 1 : -1;
        return {
          ...p,
          quantityInStock: p.quantityInStock + (qtyVal * factor)
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setMovements([newMovementLog, ...movements]);
    setSelectedProductId('');
    setStockActionQty('');
    setStockActionReason('');
    setMovementStatusMsg(`✅ Opération réussie ! Le stock de "${matchedProduct.name}" a été mis à jour.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* PAGE TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">ERP Gestion de Stock Matériel</h2>
          <p className="text-slate-500 text-sm mt-0.5">Inventaire permanent, valorisation SYSCOHADA de la voirie active et indicateurs d'approvisionnement</p>
        </div>
      </div>

      {/* METRIC BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-emerald-300 transition duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Valorisation des Stocks (PUMP)</span>
            <h3 className="text-xl font-black text-emerald-800">{totalStockValuationFcfa.toLocaleString()} <span className="text-xs font-bold text-slate-500">FCFA</span></h3>
            <p className="text-slate-400 text-xs">Méthode du Coût Moyen Unitaire Pondéré</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-205/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Articles Référencés</span>
            <h3 className="text-xl font-black text-slate-800">{products.length} références actifs</h3>
            <p className="text-slate-400 text-xs">{products.filter(p=>p.category==='Poubelles').reduce((sum, p)=>sum+p.quantityInStock, 0)} bacs cuves prêts à livraison</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Boxes className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-205/80 shadow-xs flex items-center justify-between hover:border-rose-200 transition duration-150">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Alertes Stocks Faibles</span>
            <h3 className="text-xl font-black text-rose-700">{lowStockAlertItems.length} articles en rupture</h3>
            <p className="text-slate-400 text-xs">Quantité disponible inférieure au stock d'alerte</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* CORE STOCKS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INTERACTIVE TRANSACTION MODULE (SORTIE/ENTREE DIRECTE) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs h-fit hover:border-emerald-250 transition duration-200 text-left">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <RefreshCw className="h-4.5 w-4.5 text-emerald-600 animate-spin" />
            <h3 className="font-extrabold text-xs uppercase text-slate-800 tracking-wider">Mouvementer / Délivrer Stock</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Permet d'imputer des entrées de commandes fournisseurs ou des livraisons de bacs RFID aux éco-citoyens (Sorties d'inventaire).
          </p>

          <form onSubmit={handlePerformStockMovement} className="mt-4 space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-bold text-slate-600">Sélectionner Produit :</label>
              <select 
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="">-- Choisir un produit --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.quantityInStock} dispo)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Type de Flux :</label>
                <select 
                  value={stockActionType}
                  onChange={(e) => setStockActionType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-700 focus:outline-none"
                >
                  <option value="IN">Entrée (+ Reçus)</option>
                  <option value="OUT">Sortie (- Livraisons)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Quantité physique :</label>
                <input 
                  required
                  type="number" 
                  value={stockActionQty}
                  onChange={(e) => setStockActionQty(e.target.value)}
                  placeholder="Unités"
                  min="1"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600">Raison d’affectation / Note d’audit :</label>
              <input 
                type="text" 
                value={stockActionReason}
                onChange={(e) => setStockActionReason(e.target.value)}
                placeholder="Ex : Livraison d'enrôlement Fofana #ABO"
                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs" 
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition shadow-xs cursor-pointer text-xs"
            >
              Enregistrer l'Écriture de Stock
            </button>

            {movementStatusMsg && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10.5px] font-semibold text-slate-700 whitespace-pre-line animate-fade-in">
                {movementStatusMsg}
              </div>
            )}
          </form>
        </div>

        {/* LEDGER OF QUANTITATIVE PRODUCTS */}
        <div className="lg:col-span-2 space-y-4 text-left">
          
          <div className="flex border-b border-slate-100 pb-2 gap-1">
            <button 
              onClick={() => setActiveSubTab('status')}
              className={`px-3 py-1 font-bold text-xs rounded transition flex items-center gap-1.5 ${
                activeSubTab === 'status' ? 'bg-slate-905 text-white bg-slate-900' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <PackageCheck className="h-4 w-4" />
              État Général des Stocks
            </button>
            <button 
              onClick={() => setActiveSubTab('movements')}
              className={`px-3 py-1 font-bold text-xs rounded transition flex items-center gap-1.5 ${
                activeSubTab === 'movements' ? 'bg-slate-905 text-white bg-slate-900' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <History className="h-4 w-4" />
              Journal des Mouvements
            </button>
          </div>

          {activeSubTab === 'status' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 flex items-center bg-slate-50/50">
                <div className="relative w-full">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Filtrer par désignation..." 
                    value={searchTerm}
                    onChange={e=>setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-auto max-h-[360px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-3">Ref ID</th>
                      <th className="p-3 col-span-2">Désignation de l'Article</th>
                      <th className="p-3">Catégorie</th>
                      <th className="p-3 text-right">Stock Actuel</th>
                      <th className="p-3 text-right">PUMP Unitaire</th>
                      <th className="p-3 text-right pr-4 col-span-2">État Alerte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-zinc-650">
                    {filteredProducts.map((p) => {
                      const isLow = p.quantityInStock <= p.minAlertQty;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/40 transition">
                          <td className="p-3 font-semibold text-slate-800">{p.id}</td>
                          <td className="p-3 font-sans font-bold text-slate-900 leading-tight" colSpan={1}>{p.name}</td>
                          <td className="p-3 font-sans text-slate-500 whitespace-nowrap"><span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{p.category}</span></td>
                          <td className="p-3 text-right font-black text-slate-850">{p.quantityInStock} {p.unitOfMeasure}</td>
                          <td className="p-3 text-right font-black text-emerald-800">{p.unitPriceFcfa.toLocaleString()} FCFA</td>
                          <td className="p-3 text-right pr-4 font-sans text-xs">
                            {isLow ? (
                              <span className="bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded-md font-bold inline-block animate-pulse">⚠️ Réapprov. d'Urgence</span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold inline-block">Sain (OK)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'movements' && (
            <div className="bg-white rounded-2xl border border-slate-205 shadow-xs max-h-[380px] overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-3">Ref Mvt</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Désignation</th>
                    <th className="p-3">Sens</th>
                    <th className="p-3 text-right">Quantité</th>
                    <th className="p-3 pl-6">Justificatif / Agent d'Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-zinc-650">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/40">
                      <td className="p-3 font-semibold text-slate-800">{m.id}</td>
                      <td className="p-3 font-sans font-medium text-slate-400">{m.date}</td>
                      <td className="p-3 font-sans font-bold text-slate-850">{m.productName}</td>
                      <td className="p-3 font-sans">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                          m.type === 'IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {m.type === 'IN' ? 'ENTRÉE (+)' : 'SORTIE (-)'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-800">{m.quantity}</td>
                      <td className="p-3 pl-6 font-sans text-slate-500 font-medium">
                        <div>{m.reason}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Auteur: {m.authorizedBy}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
