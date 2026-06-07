import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackView?: React.ReactNode;
}

export default function ProtectedRoute({ children, allowedRoles, fallbackView }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div id="auth-loading-screen" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 font-sans">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute font-mono text-xs text-emerald-400 font-black animate-pulse">AK</div>
        </div>
        <p className="mt-4 text-xs font-bold text-slate-400 tracking-widest uppercase">Téléchargement sécurisé de la session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (fallbackView) return <>{fallbackView}</>;
    return (
      <div id="unauthorized-redirect-container" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-center mx-auto text-amber-400 animate-bounce">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black text-white">Session expirée ou non autorisée</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pour des raisons de conformité et de protection des données abonnés de Ouagadougou, vous devez vous authentifier de manière immuable avant de consulter ce volet ERP.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition cursor-pointer"
          >
            S'authentifier sur le portail sécurisé
          </button>
        </div>
      </div>
    );
  }

  // If roles checklist is provided, verify RBAC compliance
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div id="rbac-access-denied-container" className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-lg space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-3xl flex items-center justify-center mx-auto text-red-600 dark:text-red-400 animate-pulse">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Accès Restreint (Permissions Insuffisantes)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Votre habilitation actuelle (<span className="font-mono text-red-500 dark:text-red-400 font-bold bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">{user.role}</span>) ne possède pas les privilèges requis pour administrer ou visualiser cette section opérationnelle.
            </p>
          </div>
          
          <div className="h-px bg-slate-150 dark:bg-slate-800" />

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Retourner en arrière
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex-1 py-3 bg-red-600/10 hover:bg-red-650/20 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-red-200/20 cursor-pointer animate-none"
            >
              <LogOut className="h-4 w-4" />
              Changer de compte
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
