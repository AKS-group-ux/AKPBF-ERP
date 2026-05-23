/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Send, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Edit, 
  Eye, 
  FileText 
} from 'lucide-react';
import { NotificationLog } from '../types';

interface NotificationsViewProps {
  logs: NotificationLog[];
}

export default function NotificationsView({ logs }: NotificationsViewProps) {
  // Mobile preview simulation
  const [selectedTemplateName, setSelectedTemplateName] = useState('Dépêche Passage');
  const [editedSmsText, setEditedSmsText] = useState(
    "AKPBF ALERTE : Notre camion passera demain matin à partir de 6h00 dans votre secteur Yopougon. Veuillez sortir votre bac standard de 240L ce soir."
  );

  const [searchTerm, setSearchTerm] = useState('');

  // Handle template switch presets
  const selectTemplatePreset = (name: string, text: string) => {
    setSelectedTemplateName(name);
    setEditedSmsText(text);
  };

  const filteredLogs = logs.filter(log => {
    return (
      log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipientContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-850 tracking-tight">E-Dépêches & Notifications Citoyennes</h2>
          <p className="text-slate-500 text-sm mt-0.5">Alerte de collecte des bacs, relance d'impayés fiscaux et communication municipale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column: Template configuration and live mobile mockup */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-850 text-sm">Éditeur de Gabarits de Relance Municipaux</h3>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => selectTemplatePreset(
                  'Dépêche Passage', 
                  'AKPBF ALERTE : Notre camion passera demain matin à partir de 6h00 dans votre secteur Yopougon. Veuillez sortir votre bac standard de 240L ce soir.'
                )}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  selectedTemplateName === 'Dépêche Passage' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                    : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Veille de collecte (SMS)
              </button>
              <button 
                onClick={() => selectTemplatePreset(
                  'Validation Recette', 
                  'AKPBF : Votre paiement de 3500 FCFA pour l\'abonnement de Mai 2026 a été reçu avec succès. Merci pour votre contribution à la propreté d\'Abidjan !'
                )}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  selectedTemplateName === 'Validation Recette' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                    : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Reçu de Caisse (SMS)
              </button>
              <button 
                onClick={() => selectTemplatePreset(
                  'Mise en demeure', 
                  'ALERTE CONTENTIEUX AKPBF : Sauf erreur, votre facture mensuelle de voirie reste impayée. Risque de suspension du ramassage sous 48h.'
                )}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  selectedTemplateName === 'Mise en demeure' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                    : 'bg-white border-slate-150 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Injonction de payer (SMS)
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">Texte de la relance (Modifiable)</label>
              <textarea 
                rows={3}
                value={editedSmsText}
                onChange={(e) => setEditedSmsText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium leading-relaxed"
                placeholder="Écrivez le message de notification ici..."
              />
              <span className="text-[10px] text-slate-400 font-mono block text-right">{editedSmsText.length} caractères • {Math.ceil(editedSmsText.length / 160)} SMS</span>
            </div>
          </div>

          {/* History logs table registry */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-800 text-sm">Registre d'Envoi des Dépêches</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Rechercher destinataire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-100 border-none pl-9 pr-3 py-1.5 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-auto max-h-[280px]">
              <table className="w-full text-left font-sans text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50/70 border-b border-slate-100 font-bold text-slate-500 uppercase text-[9px]">
                  <tr>
                    <th className="p-3">Destinataire</th>
                    <th className="p-3">Numéro / Canal</th>
                    <th className="p-3">Type / Gabarit</th>
                    <th className="p-3">Date d'Envoi</th>
                    <th className="p-3 text-center">Acheminement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-55/30 transition">
                      <td className="p-3 font-bold text-slate-800">{log.recipientName}</td>
                      <td className="p-3 font-mono text-[10.5px] text-slate-500">{log.recipientContact}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {log.type === 'sms' ? <Smartphone className="h-3 w-3 text-indigo-500" /> : <Mail className="h-3 w-3 text-sky-500" />}
                          <span>{log.templateName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[10px]">{log.sentAt}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.status === 'sent' ? 'Délivré' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Smartphone Live Preview Mockup container */}
        <div className="lg:col-span-1 flex justify-center">
          <div className="w-[260px] h-[500px] bg-slate-950 rounded-[40px] px-3 py-4 border-[6px] border-slate-800 shadow-2xl relative flex flex-col overflow-hidden text-xs">
            {/* Top speaker notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-950 rounded-full z-20 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-800 rounded" />
            </div>

            {/* Inner Phone Layout */}
            <div className="flex-1 bg-zinc-900 rounded-[30px] overflow-hidden flex flex-col p-3 relative text-white space-y-3 pt-6">
              
              {/* StatusBar Mock */}
              <div className="flex justify-between items-center text-[8px] text-slate-400 font-medium px-1">
                <span>08:45</span>
                <div className="flex gap-1.5 items-center">
                  <span>5G</span>
                  <div className="w-3.5 h-1.5 bg-white rounded-xs" />
                </div>
              </div>

              {/* Chat Title bar */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center font-black text-[9px]">
                  AK
                </div>
                <div>
                  <h4 className="font-extrabold text-[9px]">AKPBF VILLE</h4>
                  <span className="text-[7px] text-emerald-400 block font-bold">Service Municipal de Salubrité</span>
                </div>
              </div>

              {/* Chat Container window content */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pt-2">
                {/* Simulated timestamp */}
                <span className="block text-center text-[7px] text-zinc-500 uppercase tracking-widest font-black">Aujourd'hui</span>

                {/* Message Bubble */}
                <div className="bg-zinc-800 rounded-2xl rounded-tl-xs p-2.5 max-w-[85%] text-left text-[9px] text-slate-200 leading-normal border border-zinc-700">
                  {editedSmsText || "Écrivez quelque chose dans l'éditeur pour prévisualiser la télédépêche..."}
                  <span className="block text-[7px] text-right text-indigo-400 font-bold mt-1.5">08:45 ✓ Lu</span>
                </div>
              </div>

              {/* Smartphone layout keyboard replica */}
              <div className="border-t border-zinc-850 pt-1.5 flex gap-1 items-center">
                <div className="bg-zinc-800 text-[8px] p-2 rounded-full text-slate-500 flex-1">
                  Répondre en tant que citoyen...
                </div>
                <div className="p-1.5 bg-indigo-600 rounded-full shrink-0">
                  <Send className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
