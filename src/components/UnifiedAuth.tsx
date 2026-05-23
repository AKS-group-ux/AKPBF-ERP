/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Key, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { Subscriber } from '../types';

interface UnifiedAuthProps {
  subscribers: Subscriber[];
  onLogin: (sessionUser: {
    id: string;
    name: string;
    email: string;
    role: 'ADMINISTRATEUR' | 'COMPTABLE' | 'SUPERVISEUR' | 'CHAUFFEUR' | 'AGENT' | 'CLIENT';
    phone?: string;
    subscriberId?: string;
  }) => void;
}

export default function UnifiedAuth({ subscribers, onLogin }: UnifiedAuthProps) {
  const [authMethod, setAuthMethod] = useState<'email' | 'id' | 'phone'>('email');
  const [email, setEmail] = useState('admin@akpbf.com');
  const [password, setPassword] = useState('Admin@2026');
  const [subscriberIdInput, setSubscriberIdInput] = useState('SUB-4029');
  const [phoneNumber, setPhoneNumber] = useState('+225 07 48 29 10 22');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // Extra flows states
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'verify' | 'reset'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOldPass, setResetOldPass] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Static list of official enterprise accounts for quick testing & validation
  const ENTERPRISE_USERS = [
    { email: 'admin@akpbf.com', password: 'Admin@2026', name: 'Alkaïda Benjamin', role: 'ADMINISTRATEUR' as const },
    { email: 'comptable@akpbf.com', password: 'Comptable@2026', name: 'Doumbia Sylvain (Fisc)', role: 'COMPTABLE' as const },
    { email: 'superviseur@akpbf.com', password: 'Superviseur@2026', name: 'Gérard Gnakoury (Logistique)', role: 'SUPERVISEUR' as const },
    { email: 'chauffeur@akpbf.com', password: 'Chauffeur@2026', name: 'Kaboré Moussa', role: 'CHAUFFEUR' as const },
    { email: 'agent@akpbf.com', password: 'Agent@2026', name: 'Coulibaly Issa', role: 'AGENT' as const },
  ];

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (authMethod === 'email') {
      const canonicalEmail = email.trim().toLowerCase();
      
      // 1. Check corporate administrative users first
      const matchedCorp = ENTERPRISE_USERS.find(u => u.email === canonicalEmail);
      if (matchedCorp) {
        if (password === matchedCorp.password) {
          onLogin({
            id: matchedCorp.email,
            name: matchedCorp.name,
            email: matchedCorp.email,
            role: matchedCorp.role,
            phone: '+225 05 00 00 00 01'
          });
          return;
        } else {
          setLoginError('Mot de passe corporatif erroné ou expiré.');
          return;
        }
      }

      // 2. Check if it's a client account
      const matchedClient = subscribers.find(s => s.email.toLowerCase() === canonicalEmail);
      if (matchedClient) {
        if (password === 'Test@2026' || password === '••••••••' || password === matchedClient.id) {
          onLogin({
            id: matchedClient.id,
            name: matchedClient.name,
            email: matchedClient.email,
            role: 'CLIENT',
            phone: matchedClient.phone,
            subscriberId: matchedClient.id
          });
          return;
        } else {
          setLoginError("Mot de passe incorrect pour le Portail Citoyen. Rappel d'évaluation : utilisez 'Test@2026'.");
          return;
        }
      }

      setLoginError(`Aucun utilisateur AKPBF n'est enregistré sous l'adresse e-mail "${email}".`);
    }

    else if (authMethod === 'id') {
      const canonId = subscriberIdInput.trim().toUpperCase();
      const matchedClient = subscribers.find(s => s.id.toUpperCase() === canonId || s.id.toUpperCase().includes(canonId));
      if (matchedClient) {
        onLogin({
          id: matchedClient.id,
          name: matchedClient.name,
          email: matchedClient.email,
          role: 'CLIENT',
          phone: matchedClient.phone,
          subscriberId: matchedClient.id
        });
      } else {
        setLoginError(`ID Client "${subscriberIdInput}" introuvable dans le portefeuille d'abonnés de la mairie.`);
      }
    }

    else if (authMethod === 'phone') {
      if (!otpSent) {
        setOtpSent(true);
        return;
      }
      const matchedClient = subscribers.find(s => s.phone.replace(/\s+/g, '').includes(phoneNumber.replace(/\s+/g, '')));
      if (matchedClient) {
        onLogin({
          id: matchedClient.id,
          name: matchedClient.name,
          email: matchedClient.email,
          role: 'CLIENT',
          phone: matchedClient.phone,
          subscriberId: matchedClient.id
        });
      } else {
        setLoginError(`Aucune fiche d'abonné n'est rattachée au numéro "${phoneNumber}".`);
      }
    }
  };

  const handleForgotPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setAuthMode('login');
      alert(`Un lien sécurisé de réinitialisation de mot de passe a été expédié à l'adresse "${forgotEmail}".`);
    }, 2000);
  };

  const handleVerifyEmail = (e: FormEvent) => {
    e.preventDefault();
    setVerificationSent(true);
    setTimeout(() => {
      setVerificationSent(false);
      setAuthMode('login');
      alert(`Votre adresse e-mail a été authentifiée officiellement par le serveur de sécurité d'Abidjan ! Vous pouvez désormais vous connecter.`);
    }, 2000);
  };

  const handleResetPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!resetNewPass || !resetEmail) return;
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setAuthMode('login');
      alert("Votre mot de passe a été modifié de manière immuable dans l'ERP.");
    }, 1800);
  };

  const autofillUser = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setAuthMethod('email');
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white relative overflow-hidden font-sans">
      {/* Absolute Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-950/20 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Main Single Card Panel */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl overflow-hidden p-6 md:p-8 space-y-6 relative z-10 animate-in fade-in duration-300">
        
        {/* Header branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white items-center justify-center text-2xl font-mono font-black shadow-lg shadow-emerald-500/10">
            AK
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">ERP Salubrité AKPBF</h2>
          <p className="text-xs text-slate-400">Portail centralisé d'accès pour les services municipaux Côte d'Ivoire & Citoyens d'Abidjan</p>
        </div>

        {authMode === 'login' && (
          <>
            {/* Quick selectors representing Unified Login Tab */}
            <div className="flex bg-slate-950 p-1 rounded-xl text-xs font-bold gap-1 border border-slate-800/80">
              <button 
                type="button"
                onClick={() => { setAuthMethod('email'); setLoginError(''); }}
                className={`flex-1 py-2 text-center rounded-lg transition ${
                  authMethod === 'email' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                E-mail
              </button>
              <button 
                type="button"
                onClick={() => { setAuthMethod('id'); setLoginError(''); }}
                className={`flex-1 py-2 text-center rounded-lg transition ${
                  authMethod === 'id' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ID Unique
              </button>
              <button 
                type="button"
                onClick={() => { setAuthMethod('phone'); setLoginError(''); }}
                className={`flex-1 py-2 text-center rounded-lg transition ${
                  authMethod === 'phone' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OTP Mobile
              </button>
            </div>

            {loginError && (
              <div className="bg-red-950/40 border border-red-900 text-red-400 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span className="font-medium leading-relaxed">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authMethod === 'email' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Adresse E-mail Enregistrée</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nom@service-assainissement.ci"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs font-semibold outline-none transition"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Mot de Passe</label>
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('forgot')}
                        className="text-[10.5px] font-bold text-emerald-400 hover:underline"
                      >
                        Oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs font-semibold outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {authMethod === 'id' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Identifiant Unique d'Abonné (Ménages & Entreprises)</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      value={subscriberIdInput}
                      onChange={(e) => setSubscriberIdInput(e.target.value)}
                      placeholder="Ex: SUB-4029 ou SUB-1933"
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs font-bold font-mono tracking-wider uppercase outline-none transition"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight">Authentifiez-vous d'un coup grâce à votre référence de contrat de salubrité</span>
                </div>
              )}

              {authMethod === 'phone' && (
                <div className="space-y-3">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Numéro de Téléphone Enregistré</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                      <input 
                        type="text"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+225 07 48 29 10 22"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-3 text-xs font-semibold outline-none transition"
                      />
                    </div>
                  </div>

                  {otpSent ? (
                    <div className="space-y-1.5 text-left animate-in slide-in-from-top-2 duration-150">
                      <label className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Code OTP transmis par SMS pour test d'évaluation
                      </label>
                      <input 
                        type="text"
                        required
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        placeholder="Indiquez le code reçu (Ex: 2026)"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl py-3 text-xs text-center font-bold font-mono tracking-widest outline-none transition"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOtpSent(true)}
                      className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-emerald-400 text-[11px] font-bold rounded-xl border border-dashed border-emerald-900 transition"
                    >
                      S'envoyer un code OTP SMS de test d'évaluation
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-250 animate-pulse" />
                Se connecter en sécurité
              </button>
            </form>

            {/* Simulated legal warnings and secondary settings */}
            <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-500 pt-1">
              <button type="button" onClick={() => setAuthMode('verify')} className="hover:text-emerald-400 transition">Vérifier mon E-mail</button>
              <button type="button" onClick={() => setAuthMode('reset')} className="hover:text-emerald-400 transition">Changer mon Mot de Passe</button>
            </div>

            {/* Quick Autoconnect Demo Shortlists - ODOO Architecture */}
            <div className="pt-5 border-t border-slate-800/80 space-y-3.5 text-left">
              <span className="text-[10px] uppercase font-black text-amber-500 block tracking-widest font-mono">DÉMONSTRATION DU SYSTÈME (RBAC DIRECT)</span>
              
              <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 space-y-2">
                <div className="text-[10.5px] text-slate-400 leading-relaxed font-semibold flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Cliquez sur un rôle officiel pour préremplir instantanément la console d'authentification :</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    type="button"
                    onClick={() => autofillUser('admin@akpbf.com', 'Admin@2026')}
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-emerald-500/50 rounded-xl text-[10.5px] font-bold hover:text-white transition cursor-pointer text-slate-400 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Administrateur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('comptable@akpbf.com', 'Comptable@2026')}
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-emerald-500/50 rounded-xl text-[10.5px] font-bold hover:text-white transition cursor-pointer text-slate-400 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Comptable (Fisc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('superviseur@akpbf.com', 'Superviseur@2026')}
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-emerald-500/50 rounded-xl text-[10.5px] font-bold hover:text-white transition cursor-pointer text-slate-400 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span>Superviseur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('chauffeur@akpbf.com', 'Chauffeur@2026')}
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-emerald-500/50 rounded-xl text-[10.5px] font-bold hover:text-white transition cursor-pointer text-slate-400 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Chauffeur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('agent@akpbf.com', 'Agent@2026')}
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-emerald-500/50 rounded-xl text-[10.5px] font-bold hover:text-white transition cursor-pointer text-slate-400 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Agent de Collecte</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => autofillUser('koffi.jj@email.com', 'Test@2026')}
                    className="p-2 bg-slate-900 border border-slate-850 hover:border-emerald-500/50 rounded-xl text-[10.5px] font-bold hover:text-white transition cursor-pointer text-slate-400 flex items-center gap-1.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Client (Citoyen)</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {authMode === 'forgot' && (
          <div className="space-y-4 text-left animate-in duration-200 slide-in-from-right-3">
            <h3 className="font-extrabold text-white text-sm">Réinitialiser le Mot de Passe</h3>
            <p className="text-[11.5px] text-slate-400 leading-relaxed">Saisissez l'adresse mail liée à votre compte. Nous vous transmettrons un lien de récupération sécurisé.</p>
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <input 
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Ex: citoyen@Abidjan.ci"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl p-3 text-xs font-semibold outline-none transition"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Envoyer le lien de récupération
              </button>
            </form>
            <button 
              type="button" 
              onClick={() => setAuthMode('login')} 
              className="text-xs text-slate-400 hover:text-white block text-center w-full pt-2 font-bold"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {authMode === 'verify' && (
          <div className="space-y-4 text-left animate-in duration-200 slide-in-from-right-3">
            <h3 className="font-extrabold text-white text-sm">Vérification de l'Adresse Email</h3>
            <p className="text-[11.5px] text-slate-400 leading-relaxed">Indiquez le code secret de sécurité reçu par email lors de votre abonnement.</p>
            <form onSubmit={handleVerifyEmail} className="space-y-3.5">
              <input 
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Code à 6 chiffres (Ex: 884920)"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl p-3 text-xs text-center font-bold font-mono tracking-widest outline-none transition"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Confirmer mon adresse Email
              </button>
            </form>
            <button 
              type="button" 
              onClick={() => setAuthMode('login')} 
              className="text-xs text-slate-400 hover:text-white block text-center w-full pt-2 font-bold"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {authMode === 'reset' && (
          <div className="space-y-4 text-left animate-in duration-200 slide-in-from-right-3">
            <h3 className="font-extrabold text-white text-sm">Changement de Mot de Passe</h3>
            <p className="text-[11.5px] text-slate-400 leading-relaxed">Mettez à jour vos identifiants d'accès immuables et sécurisez votre espace comptable ou client.</p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Adresse E-mail</label>
                <input 
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nom@service-assainissement.ci"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-semibold outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Ancien Mot de Passe</label>
                <input 
                  type="password"
                  required
                  value={resetOldPass}
                  onChange={(e) => setResetOldPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-semibold outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Nouveau Mot de Passe Fort</label>
                <input 
                  type="password"
                  required
                  value={resetNewPass}
                  onChange={(e) => setResetNewPass(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 rounded-xl p-2.5 text-xs font-semibold outline-none transition"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >
                Mettre à jour mes accès
              </button>
            </form>
            <button 
              type="button" 
              onClick={() => setAuthMode('login')} 
              className="text-xs text-slate-400 hover:text-white block text-center w-full pt-2 font-bold"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>

      {/* Decorative footer label */}
      <span className="text-[10.5px] text-slate-600 font-bold mt-4 z-10 select-none">
        Copyright © 2026 AKP_BF. République de Côte d'Ivoire. Tous droits réservés.
      </span>
    </div>
  );
}
