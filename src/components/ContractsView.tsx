import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Layers, 
  Check, 
  History, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  X,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { Contract, ContractTemplate, Subscriber, SubscriptionPlan, SubscriptionHistoryLog } from '../types';
import { documentService } from '../services/documentService';

interface ContractsViewProps {
  contracts: Contract[];
  templates: ContractTemplate[];
  subscribers: Subscriber[];
  plans: SubscriptionPlan[];
  onAddContract: (cnt: Contract) => void;
  onUpdateContract: (cnt: Contract) => void;
  onDeleteContract: (id: string) => void;
  onSaveTemplate: (t: ContractTemplate) => void;
  onAddHistoryLog: (log: Omit<SubscriptionHistoryLog, 'id' | 'timestamp'>) => void;
  historyLogs: SubscriptionHistoryLog[];
}

export default function ContractsView({
  contracts,
  templates,
  subscribers,
  plans,
  onAddContract,
  onUpdateContract,
  onDeleteContract,
  onSaveTemplate,
  onAddHistoryLog,
  historyLogs
}: ContractsViewProps) {
  const [activeTab, setActiveTab] = useState<'contracts' | 'templates' | 'logs'>('contracts');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [pdfPreviewDoc, setPdfPreviewDoc] = useState<{ type: 'contract' | 'invoice' | 'receipt' | 'attestation'; data: any } | null>(null);

  // New Contract form state
  const [newSubscriberId, setNewSubscriberId] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [newStartDate, setNewStartDate] = useState('2026-06-01');
  const [newEndDate, setNewEndDate] = useState('2027-05-31');
  const [newTerms, setNewTerms] = useState('Le présent contrat stipule que la mairie s\'engage à collecter régulièrement les bacs de salubrité de l\'abonné moyennant le paiement forfaitaire périodique.');
  const [newStatus, setNewStatus] = useState<Contract['status']>('draft');
  const [selectedTemplateIdForGen, setSelectedTemplateIdForGen] = useState('');

  // New Template form state
  const [templateName, setTemplateName] = useState('');
  const [templateBody, setTemplateBody] = useState('');

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.subscriberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.planName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter]);

  // Interpolate variables helper
  const interpolateContract = (templateText: string, contract: Contract, subscriber: Subscriber) => {
    return templateText
      .replace(/\{\{client_name\}\}/g, subscriber.name)
      .replace(/\{\{client_number\}\}/g, subscriber.id)
      .replace(/\{\{contract_number\}\}/g, contract.contractNumber)
      .replace(/\{\{subscription_name\}\}/g, contract.planName)
      .replace(/\{\{subscription_price\}\}/g, `${contract.amount} FCFA`)
      .replace(/\{\{start_date\}\}/g, contract.startDate)
      .replace(/\{\{end_date\}\}/g, contract.endDate)
      .replace(/\{\{company_name\}\}/g, 'AKPBF Salubrité Urbaine')
      .replace(/\{\{company_phone\}\}/g, '+225 20 00 11 22')
      .replace(/\{\{company_email\}\}/g, 'contact@salubrite.akpbf.ci');
  };

  const currentTemplateSelected = useMemo(() => {
    const defaultTemplate = templates[0] || {
      id: 'default',
      name: 'Modèle Standard',
      body: 'CONTRAT DE PRESTATION DE SERVICE SALUBRITÉ\nRéférence: {{contract_number}}\n\nEntre, d\'une part, l\'entreprise {{company_name}} représentée par son service de voiries, et d\'autre part, le Citoyen {{client_name}} (N° Abonné: {{client_number}}).\n\nL\'Abonné souscrit au forfait d\'assainissement : {{subscription_name}} pour un coût de {{subscription_price}}.\nLe contrat débute le {{start_date}} et expirera le {{end_date}}.\n\nFait à Abidjan, Côte d\'Ivoire.',
      status: 'active'
    };
    if (!selectedTemplateIdForGen) return defaultTemplate;
    return templates.find(t => t.id === selectedTemplateIdForGen) || defaultTemplate;
  }, [templates, selectedTemplateIdForGen]);

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subscribers.find(s => s.id === newSubscriberId);
    const plan = plans.find(p => p.id === newPlanId);

    if (!sub || !plan) {
      alert('Veuillez sélectionner un abonné et un forfait.');
      return;
    }

    const newNum = `CNT-2026-${String(contracts.length + 101).padStart(4, '0')}`;
    const newCnt: Contract = {
      id: `cnt_${Date.now()}`,
      contractNumber: newNum,
      subscriberId: sub.id,
      subscriberName: sub.name,
      startDate: newStartDate,
      endDate: newEndDate,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      termsAndConditions: interpolateContract(currentTemplateSelected.body, { contractNumber: newNum, planName: plan.name, startDate: newStartDate, endDate: newEndDate, amount: plan.price } as any, sub),
      status: newStatus,
      signatureDate: newStatus === 'active' || newStatus === 'signed' ? '2026-05-22' : null
    };

    onAddContract(newCnt);
    onAddHistoryLog({
      subscriberId: sub.id,
      subscriberName: sub.name,
      action: 'creation',
      newState: newStatus,
      description: `Création du nouveau contrat de salubrité ${newNum} (${plan.name}).`,
      operator: 'Administrateur ERP'
    });

    setIsContractModalOpen(false);
    resetContractForm();
  };

  const handleUpdateStatus = (contract: Contract, nextStatus: Contract['status']) => {
    const updated = { 
      ...contract, 
      status: nextStatus,
      signatureDate: (nextStatus === 'signed' || nextStatus === 'active') && !contract.signatureDate ? '2026-05-22' : contract.signatureDate
    };
    onUpdateContract(updated);
    
    onAddHistoryLog({
      subscriberId: contract.subscriberId,
      subscriberName: contract.subscriberName,
      action: 'state_change',
      oldState: contract.status,
      newState: nextStatus,
      description: `Transition d'état Odoo du contrat ${contract.contractNumber} vers le statut [${nextStatus.toUpperCase()}].`,
      operator: 'Administrateur ERP'
    });
  };

  const resetContractForm = () => {
    setNewSubscriberId('');
    setNewPlanId('');
    setNewStartDate('2026-06-01');
    setNewEndDate('2027-05-31');
    setNewStatus('draft');
    setSelectedTemplateIdForGen('');
    setNewTerms('Le présent contrat stipule que la mairie s\'engage à collecter régulièrement les bacs de salubrité de l\'abonné.');
  };

  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName || !templateBody) return;

    const t: ContractTemplate = {
      id: selectedTemplate ? selectedTemplate.id : `tpl_${Date.now()}`,
      name: templateName,
      body: templateBody,
      status: 'active'
    };

    onSaveTemplate(t);
    setIsTemplateModalOpen(false);
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateBody('');
  };

  const handleDuplicateTemplate = (tpl: ContractTemplate) => {
    const t: ContractTemplate = {
      id: `tpl_${Date.now()}`,
      name: `${tpl.name} (Copie)`,
      body: tpl.body,
      status: 'active'
    };
    onSaveTemplate(t);
  };

  const toggleTemplateStatus = (tpl: ContractTemplate) => {
    const t: ContractTemplate = {
      ...tpl,
      status: tpl.status === 'active' ? 'inactive' : 'active'
    };
    onSaveTemplate(t);
  };

  const triggerPdfView = (type: any, docData: any) => {
    setPdfPreviewDoc({ type, data: docData });
  };

  const contractLogs = useMemo(() => {
    return historyLogs.filter(h => h.description.includes('contrat') || h.action === 'creation' || h.action === 'state_change');
  }, [historyLogs]);

  return (
    <div className="space-y-6" id="contracts-view-container">
      {/* Mini ERP Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Gestion des Contrats Odoo</h2>
          <p className="text-xs text-slate-500 font-medium">Cycle de vie de l'abonnement et modèles juridiques d'enlèvement de salubrité</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => {
              setActiveTab('contracts');
              setIsContractModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nouveau Contrat
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setSelectedTemplate(null);
              setTemplateName('');
              setTemplateBody('CONTRAT DE SERVICE SALUBRITÉ AKPBF\n\nModèle de convention officielle pour {{client_name}}.\nForfait retenu : {{subscription_name}}.\nPrix : {{subscription_price}}.\n\nConditions Générales d\'Assainissement de la Ville d\'Abidjan.');
              setIsTemplateModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            Créer Modèle
          </button>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'contracts' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Portefeuille Contrats ({contracts.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'templates' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Modèles de Documents ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
            activeTab === 'logs' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Historique Audit Log ({contractLogs.length})
        </button>
      </div>

      {/* Contracts Portfolio */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text"
                placeholder="Rechercher par numéro de contrat, client ou abonnement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-xs font-medium rounded-xl transition"
              />
            </div>

            <div className="flex gap-2">
              {['all', 'draft', 'pending', 'signed', 'active', 'suspended', 'expired', 'terminated'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 text-[10.5px] font-bold rounded-xl border capitalize ${
                    statusFilter === st 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st === 'all' ? 'Tous' : 
                   st === 'draft' ? 'Brouillon' : 
                   st === 'pending' ? 'En attente' : 
                   st === 'signed' ? 'Signé' : 
                   st === 'active' ? 'Actif' : 
                   st === 'suspended' ? 'Suspendu' : 
                   st === 'expired' ? 'Expiré' : 'Résilié'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider">
                    <th className="p-4">Numéro Contrat</th>
                    <th className="p-4">Citoyen / Client</th>
                    <th className="p-4">Type Forfait</th>
                    <th className="p-4">Montant Mensuel</th>
                    <th className="p-4">Période d'Effet</th>
                    <th className="p-4">Signature</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                        Aucun contrat ne correspond aux critères de sélection.
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => {
                      const subscriber = subscribers.find(s => s.id === c.subscriberId);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-bold text-slate-800 font-mono">
                            {c.contractNumber}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-700">{c.subscriberName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{c.subscriberId}</div>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-slate-600">{c.planName}</span>
                          </td>
                          <td className="p-4 font-bold text-emerald-600 font-mono">
                            {c.amount.toLocaleString()} FCFA
                          </td>
                          <td className="p-4 text-slate-500 font-medium">
                            <div>Du {c.startDate}</div>
                            <div className="text-[10px] text-indigo-500">Au {c.endDate}</div>
                          </td>
                          <td className="p-4">
                            {c.signatureDate ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-[10px]">
                                <Check className="h-3 w-3" />
                                <span>Signé ({c.signatureDate})</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-semibold text-[10px]">Non signé</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                              c.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              c.status === 'signed' ? 'bg-indigo-100 text-indigo-800' :
                              c.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              c.status === 'suspended' ? 'bg-red-100 text-red-800' :
                              c.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {c.status === 'active' ? 'Actif' :
                               c.status === 'signed' ? 'Signé' :
                               c.status === 'pending' ? 'En attente' :
                               c.status === 'suspended' ? 'Suspendu' :
                               c.status === 'draft' ? 'Brouillon' :
                               c.status === 'expired' ? 'Expiré' : 'Résilié'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* transition flow buttons similar to Odoo workflow */}
                              {c.status === 'draft' && (
                                <button
                                  onClick={() => handleUpdateStatus(c, 'pending')}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white rounded text-[10px] font-bold transition"
                                  title="Soumettre pour validation"
                                >
                                  Soumettre
                                </button>
                              )}
                              
                              {c.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(c, 'active')}
                                  className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded text-[10px] font-bold transition"
                                  title="Activer le contrat"
                                >
                                  Valider & Activer
                                </button>
                              )}

                              {c.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateStatus(c, 'suspended')}
                                  className="px-2 py-1 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white rounded text-[10px] font-bold transition"
                                  title="Suspendre le contrat"
                                >
                                  Suspendre
                                </button>
                              )}

                              {c.status === 'suspended' && (
                                <button
                                  onClick={() => handleUpdateStatus(c, 'active')}
                                  className="px-2 py-1 bg-emerald-100 hover:bg-emerald-650 text-emerald-700 hover:text-white rounded text-[10px] font-bold transition"
                                  title="Réactiver"
                                >
                                  Réactiver
                                </button>
                              )}

                              <button
                                onClick={() => triggerPdfView('contract', c)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg hover:text-slate-800 transition"
                                title="Imprimer le PDF"
                              >
                                <Printer className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Templates Management */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                    tpl.status === 'active' ? 'bg-emerald-55 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {tpl.status === 'active' ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{tpl.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">ID modèle: {tpl.id}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-medium text-slate-500 line-clamp-4 font-mono leading-relaxed whitespace-pre-wrap">
                  {tpl.body}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      setTemplateName(tpl.name);
                      setTemplateBody(tpl.body);
                      setIsTemplateModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-50 hover:bg-slate-150 text-slate-600 hover:text-slate-800 rounded-lg transition"
                    title="Modifier"
                  >
                    <Edit className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(tpl)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-150 text-indigo-600 rounded-lg transition"
                    title="Dupliquer"
                  >
                    <Copy className="h-4.5 w-4.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleTemplateStatus(tpl)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[10.5px] transition ${
                    tpl.status === 'active' 
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {tpl.status === 'active' ? 'Désactiver' : 'Réactiver'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Trail State Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-5 w-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Contrôle d'Audit - Transitions de Contrats</h3>
          </div>
          
          <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2">
            {contractLogs.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-xs font-medium">Aucun changement d'état ou création dans l'historique.</p>
            ) : (
              contractLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs p-3 bg-slate-50 rounded-2xl border border-slate-100/65">
                  <span className="text-[10px] text-indigo-600 font-extrabold font-mono pt-0.5 shrink-0 block">{log.timestamp}</span>
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-700">
                      {log.description}
                    </div>
                    <div className="flex items-center gap-3 text-[10.5px] font-bold text-slate-500">
                      <span>Abonné: {log.subscriberName} ({log.subscriberId})</span>
                      <span>•</span>
                      <span>Opérateur: {log.operator}</span>
                      {log.oldState && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600">{log.oldState} ➔ {log.newState}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Contract Creation Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsContractModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-emerald-600" />
              Générer un Contrat d'Abonnement Odoo
            </h3>

            <form onSubmit={handleCreateContract} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Citoyen / Client de Voirie</label>
                  <select
                    required
                    value={newSubscriberId}
                    onChange={(e) => setNewSubscriberId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="">-- Sélectionner un Citoyen --</option>
                    {subscribers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id}) - {s.neighborhood}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Abonnement / Forfait Salubrité</label>
                  <select
                    required
                    value={newPlanId}
                    onChange={(e) => setNewPlanId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-semibold text-slate-800"
                  >
                    <option value="">-- Sélectionner un forfait --</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString()} FCFA ({p.frequency})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date de Prise d'Effet</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date d'Expiration du bail</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Modèle de Contrat Juridique</label>
                  <select
                    value={selectedTemplateIdForGen}
                    onChange={(e) => setSelectedTemplateIdForGen(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-semibold text-slate-700"
                  >
                    <option value="">Modèle Par Défaut</option>
                    {templates.filter(t => t.status === 'active').map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Statut Initial du Flux</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-extrabold text-slate-800"
                  >
                    <option value="draft">Brouillon (Devis Contrat)</option>
                    <option value="pending">En attente (En cours d'examen)</option>
                    <option value="active">Actif (Démarré et Approuvé)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Conditions Générales Spécifiques</label>
                  <span className="text-[9px] text-indigo-600 font-bold font-mono">Dynamique instantanée</span>
                </div>
                <textarea
                  value={newTerms}
                  onChange={(e) => setNewTerms(e.target.value)}
                  rows={4}
                  placeholder="Inscrire toutes les clauses de salubrité..."
                  className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 py-2.5 px-3 rounded-xl font-mono text-[10.5px]"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl"
                >
                  Générer & Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Creation/Modification Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 relative">
            <button
              onClick={() => setIsTemplateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-indigo-605" />
              {selectedTemplate ? 'Modifier le modèle de contrat' : 'Créer un nouveau modèle juridique'}
            </h3>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-4 text-xs font-medium">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du Modèle</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Modèle Standard Citoyens"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 py-2.5 px-3 rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Corps de texte (Supportant les tags variables)</label>
                  <span className="text-[9px] text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded-lg font-mono">Variables Odoo</span>
                </div>
                
                <textarea
                  required
                  rows={8}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  placeholder="Écrivez le modèle. Utilisez les balises pour l'injection : {{client_name}}, {{client_number}}, {{contract_number}}, {{subscription_name}}, {{subscription_price}}, {{start_date}}, {{end_date}}, {{company_name}}."
                  className="w-full bg-slate-50 border border-slate-200 outline-none focus:border-indigo-500 py-2.5 px-3 rounded-xl font-mono text-[10.5px] leading-normal"
                ></textarea>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                <span className="text-[9.5px] font-bold text-slate-600 uppercase block tracking-wider font-mono">Guide d'interpolation rapide :</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[9.5px] font-medium font-mono text-slate-500">
                  <span className="bg-indigo-50/60 p-1 rounded">{"{{client_name}}"}</span>
                  <span className="bg-indigo-50/60 p-1 rounded">{"{{client_number}}"}</span>
                  <span className="bg-indigo-50/60 p-1 rounded">{"{{contract_number}}"}</span>
                  <span className="bg-indigo-50/60 p-1 rounded">{"{{subscription_name}}"}</span>
                  <span className="bg-indigo-50/60 p-1 rounded">{"{{subscription_price}}"}</span>
                  <span className="bg-indigo-50/60 p-1 rounded">{"{{start_date}}"}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl"
                >
                  Enregistrer le modèle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Engine Glory Modal */}
      {pdfPreviewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 w-full max-w-2xl p-6 relative animate-in zoom-in-95 duration-200 flex flex-col justify-between max-h-[90vh]">
            <button
              onClick={() => setPdfPreviewDoc(null)}
              className="absolute top-4 right-4 p-1.5 bg-white hover:bg-slate-200 text-slate-550 rounded-full transition shadow-xs z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <h4 className="font-extrabold text-slate-700 text-xs uppercase font-mono tracking-wider">Aperçu du Certificat PDF Généré (Haute-Fidélité AKPBF)</h4>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      await documentService.printPdf(pdfPreviewDoc.type, pdfPreviewDoc.data.id || pdfPreviewDoc.data.contractNumber);
                    } catch (e) {
                      alert("Erreur lors de l'impression du contrat.");
                    }
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-[10.5px] transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimer
                </button>
                
                <button
                  onClick={async () => {
                    try {
                      await documentService.downloadPdf(pdfPreviewDoc.type, pdfPreviewDoc.data.id || pdfPreviewDoc.data.contractNumber);
                    } catch (e) {
                      alert("Erreur lors du téléchargement du contrat.");
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10.5px] transition flex items-center gap-1.5 shadow-md"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </button>
              </div>
            </div>

            {/* High fidelity PDF paper preview */}
            <div className="flex-1 overflow-y-auto bg-white p-8 md:p-11 rounded-2xl shadow-inner border border-slate-250 font-sans text-slate-800 text-xs relative max-w-full leading-relaxed">
              {/* Paper Background watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <div className="border-[15px] border-emerald-550 p-20 rounded-full text-[80px] font-black tracking-widest text-emerald-650 rotate-45">AKPBF</div>
              </div>

              {/* Dynamic doc content switches */}
              {pdfPreviewDoc.type === 'contract' && (
                <div className="space-y-6 relative">
                  {/* Header metadata layout */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="bg-emerald-650 text-white font-serif font-black text-sm p-1.5 rounded-lg tracking-wider">AKPBF</div>
                        <span className="font-serif font-extrabold text-sm tracking-tight text-slate-950">AKPBF SALUBRITÉ</span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium">République de Côte d'Ivoire • Union - Discipline - Travail</p>
                      <p className="text-[8.5px] text-slate-400 font-mono">Plateau, Avenue des Mairies, Immeuble d'Assainissement</p>
                    </div>
                    <div className="text-right text-[10px] space-y-1">
                      <div className="font-black text-rose-600 font-mono">N° : {pdfPreviewDoc.data.contractNumber}</div>
                      <div className="text-slate-500 font-bold">Réf Module: SUBSCRIPTION_CONTRACT</div>
                      <div className="text-slate-500 font-semibold font-mono">Date : 23 Mai 2026</div>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center py-4">
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest underline decoration-2 decoration-emerald-500">CONTRAT CADRE DE SALUBRITÉ URBAINE</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Fourniture de bac géré et enlèvement planifié des ordures ménagères</p>
                  </div>

                  {/* Identities */}
                  <div className="grid grid-cols-2 gap-7 p-4 bg-slate-50 rounded-xl border border-slate-100 text-[10.5px]">
                    <div className="space-y-1.5">
                      <div className="font-black text-slate-900 uppercase border-b border-slate-200 pb-1 flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-emerald-600" />
                        L'ENTREPRISE CONCÉDANTE
                      </div>
                      <div className="font-bold text-slate-800">AKPBF Salubrité Urbaine SAS</div>
                      <div className="text-slate-600">Direction de l'hygiène et de la voirie d'Abidjan</div>
                      <div className="text-slate-500 font-mono">Tél: +225 20 00 11 22 • contact@salubrite.akpbf.ci</div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="font-black text-slate-900 uppercase border-b border-slate-200 pb-1 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-indigo-550" />
                        L'ABONNÉ CITOYEN
                      </div>
                      <div className="font-bold text-slate-800">{pdfPreviewDoc.data.subscriberName}</div>
                      <div className="text-slate-600">ID d'Abonné ERP: {pdfPreviewDoc.data.subscriberId}</div>
                      <div className="text-slate-500">Adresse d'effet rattachée: Abidjan, Côte d'Ivoire</div>
                    </div>
                  </div>

                  {/* Conditions Details */}
                  <div className="space-y-3.5">
                    <h5 className="font-extrabold text-slate-950 border-b border-slate-200 pb-1 uppercase text-[10px]">Article Premier : Forfait & Spécificités Financières</h5>
                    <p className="leading-relaxed">
                      L'abonné citoyen s'associe au plan de gestion municipale ordonnée sous la référence 
                      <strong className="text-slate-950"> {pdfPreviewDoc.data.planName} </strong> pour un tarif forfaitaire mensuel fixe et incompressible de 
                      <strong className="text-emerald-700 font-mono"> {pdfPreviewDoc.data.amount.toLocaleString()} FCFA </strong>.
                    </p>
                    
                    <p className="text-[11px] leading-relaxed font-mono whitespace-pre-wrap p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                      {pdfPreviewDoc.data.termsAndConditions || 'La mairie s\'engage à collecter régulièrement les bacs de salubrité de l\'abonné.'}
                    </p>
                  </div>

                  {/* Execution Dates */}
                  <div className="grid grid-cols-2 gap-4 pb-4">
                    <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/60 text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600 mb-1" />
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Date de début de prestation</div>
                      <div className="text-xs font-black font-mono text-slate-900">{pdfPreviewDoc.data.startDate}</div>
                    </div>
                    <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100/60 text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-rose-550 mb-1" />
                      <div className="text-[9px] text-slate-500 font-bold uppercase">Date d'expiration légale</div>
                      <div className="text-xs font-black font-mono text-slate-900">{pdfPreviewDoc.data.endDate}</div>
                    </div>
                  </div>

                  {/* Bottom Signatures layout */}
                  <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-10">
                    <div className="text-left space-y-4">
                      <div className="text-[9px] uppercase font-black text-slate-400">Pour la Direction AKPBF</div>
                      <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-350 bg-slate-50/30 rounded-lg">
                        <span className="font-serif italic text-slate-400 text-[10.5px]">Cachet Électronique Apposé</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-700 text-center font-mono">Abidjan, Le 23 Mai 2026</div>
                    </div>

                    <div className="text-right space-y-4">
                      <div className="text-[9px] uppercase font-black text-slate-400">Signature de l'Abonné Citoyen</div>
                      <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-350 bg-slate-50/30 rounded-lg">
                        {pdfPreviewDoc.data.signatureDate ? (
                          <div className="text-left py-1 text-[10px] text-emerald-800 font-semibold px-2">
                            <div className="font-mono text-[9px] text-emerald-700">SIGNATURE SÉCURISÉE EN LIGNE</div>
                            <div className="font-bold underline text-slate-650 tracking-wide font-mono">{pdfPreviewDoc.data.subscriberName}</div>
                            <div className="text-[8.5px] font-mono text-slate-400">IP: 196.47.228.109 - {pdfPreviewDoc.data.signatureDate}</div>
                          </div>
                        ) : (
                          <span className="font-serif italic text-slate-400 text-xs">Aperçu - Non signé à ce jour</span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-slate-650 text-center">Fait en 2 exemplaires originaux</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
