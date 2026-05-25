import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Settings, 
  LogOut, 
  X, 
  Check, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  BellRing, 
  Globe 
} from 'lucide-react';
import { UserRole } from '../types';

interface UserProfileMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    subscriberId?: string;
  };
  onLogout: () => void;
  subscriberDetails?: any; // If CLIENT, pass Subscriber object for Profile View
}

export default function UserProfileMenu({ user, onLogout, subscriberDetails }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'password' | 'preferences' | null>(null);

  // States for password simulation
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // States for Preferences
  const [prefSms, setPrefSms] = useState(true);
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefAlerts, setPrefAlerts] = useState(true);
  const [prefLang, setPrefLang] = useState('fr');
  const [prefTheme, setPrefTheme] = useState('light');
  const [prefSaved, setPrefSaved] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('akpbf_user_preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.sms !== undefined) setPrefSms(parsed.sms);
        if (parsed.email !== undefined) setPrefEmail(parsed.email);
        if (parsed.alerts !== undefined) setPrefAlerts(parsed.alerts);
        if (parsed.lang !== undefined) setPrefLang(parsed.lang);
        if (parsed.theme !== undefined) setPrefTheme(parsed.theme);
      } catch (e) {
        console.error('Error parsing saved preferences', e);
      }
    }
  }, [activeModal]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs = {
      sms: prefSms,
      email: prefEmail,
      alerts: prefAlerts,
      lang: prefLang,
      theme: prefTheme,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('akpbf_user_preferences', JSON.stringify(prefs));
    setPrefSaved(true);
    setTimeout(() => {
      setPrefSaved(false);
      setActiveModal(null);
    }, 1200);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError('Tous les champs sont obligatoires.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    // Success simulation
    setPassSuccess('Votre mot de passe a été modifié avec succès (Simulé).');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    // Log token validation event
    console.log(`Password changed successfully for user inside JWT scope: ${user.email}`);

    setTimeout(() => {
      setPassSuccess('');
      setActiveModal(null);
    }, 1500);
  };

  const handleLogoutAction = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" id="user-profile-menu-container">
      {/* Dropdown initiator button */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 p-1.5 px-3 rounded-2xl transition duration-150 active:scale-95 text-slate-700 dark:text-slate-300"
        id="user-profile-menu-button"
      >
        <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold font-mono text-xs uppercase shadow-sm">
          {user.name.substring(0, 2)}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-black truncate max-w-[120px]">{user.name}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono tracking-tighter uppercase">{user.role}</div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Invisible clickaway backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Header user overview */}
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider font-mono">Session Connectée</span>
              <span className="text-xs font-extrabold text-slate-850 dark:text-white block truncate">{user.name}</span>
              <span className="text-[10px] text-slate-500 truncate block mt-0.5">{user.email}</span>
            </div>

            <div className="p-1.5 space-y-1">
              <button
                type="button"
                onClick={() => { setActiveModal('profile'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition text-left"
              >
                <User className="h-4 w-4 text-emerald-600 shrink-0" />
                Voir mon Profil
              </button>

              <button
                type="button"
                onClick={() => { setActiveModal('password'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition text-left"
              >
                <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                Modifier le Mot de Passe
              </button>

              <button
                type="button"
                onClick={() => { setActiveModal('preferences'); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition text-left"
              >
                <Settings className="h-4 w-4 text-sky-500 shrink-0" />
                Préférences Utilisateur
              </button>
            </div>

            <div className="p-1.5 pt-2 border-t border-slate-100 dark:border-slate-805">
              <button
                type="button"
                onClick={handleLogoutAction}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition text-left"
              >
                <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                Déconnexion Sécurisée
              </button>
            </div>
          </div>
        </>
      )}

      {/* 1. Modal: Voir le profil */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight leading-none">Profil Utilisateur</h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">INFORMATIONS ENREGISTRÉES À LA MAIRIE</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center font-black font-mono text-lg shadow-md">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-none">{user.name}</h4>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 rounded-md text-[9px] font-black uppercase mt-1.5">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Rôle : {user.role}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                  <span className="text-slate-400 font-bold">Identifiant système</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-teal-400">{user.id}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                  <span className="text-slate-400 font-bold">Adresse E-mail</span>
                  <span className="font-medium">{user.email}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                  <span className="text-slate-400 font-bold">Téléphone</span>
                  <span className="font-mono">{user.phone || 'Non configuré'}</span>
                </div>

                {user.role === 'CLIENT' && subscriberDetails && (
                  <>
                    <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-400 font-bold">Quartier municipal</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{subscriberDetails.neighborhood}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-400 font-bold">Adresse complète</span>
                      <span className="truncate max-w-[200px]">{subscriberDetails.address}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                      <span className="text-slate-400 font-bold">Statut de l'abonnement</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                        subscriberDetails.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700' : 'bg-red-100 dark:bg-red-950 text-red-700'
                      }`}>
                        {subscriberDetails.status}
                      </span>
                    </div>
                  </>
                )}

                {user.role !== 'CLIENT' && (
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800/50">
                    <span className="text-slate-400 font-bold">Type d'habilitation</span>
                    <span className="text-amber-500 font-extrabold uppercase">Agent Assermenté</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border-t border-slate-100 dark:border-slate-800 text-right">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Modifier le mot de passe */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleChangePassword}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight leading-none">Modifier le Mot de Passe</h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">SÉCURISATION DE LA CLÉ D'ACCÈS</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              {passSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {passError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <X className="h-4.5 w-4.5 text-red-500" />
                  <span>{passError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Mot de passe actuel</label>
                <input 
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-xl p-3 text-xs font-semibold outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Nouveau mot de passe</label>
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-xl p-3 text-xs font-semibold outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">Confirmer le nouveau mot de passe</label>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Réécrire le mot de passe"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-950 dark:text-slate-100 rounded-xl p-3 text-xs font-semibold outline-none transition focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-250 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
              >
                Mettre à jour
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Modal: Préférences Utilisateur */}
      {activeModal === 'preferences' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form 
            onSubmit={handleSavePreferences}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-sky-400" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight leading-none">Préférences Utilisateur</h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">CONFIGURER VOS ALERTES ET COMMMUNICATIONS</span>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left font-sans">
              {prefSaved && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Préférences enregistrées avec succès !</span>
                </div>
              )}

              {/* Preferences Checkbox groups (Bento design) */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/65">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white block">Alertes SMS en Côte d'Ivoire</span>
                    <span className="text-[10px] text-slate-400 block leading-none">Avis d'approche de camion de ramassage</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={prefSms}
                    onChange={(e) => setPrefSms(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-slate-350 bg-white"
                  />
                </div>

                <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/65">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white block">E-mails de facturation mensuelle</span>
                    <span className="text-[10px] text-slate-400 block leading-none">Envoi automatique des redevances d'état</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={prefEmail}
                    onChange={(e) => setPrefEmail(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-slate-350 bg-white"
                  />
                </div>

                <div className="flex justify-between items-start bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/65">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white block">Alerte de poubelle saturée</span>
                    <span className="text-[10px] text-slate-400 block leading-none">Notifications en cas de niveau supérieur à 85%</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={prefAlerts}
                    onChange={(e) => setPrefAlerts(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded-sm border-slate-350 bg-white"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    Langue du logiciel
                  </span>
                  <select
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-xl p-2.5 text-xs font-semibold outline-none"
                  >
                    <option value="fr">Français (Abidjan, UEMOA)</option>
                    <option value="en">English (International)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-250 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
