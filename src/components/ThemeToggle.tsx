import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  return (
    <button
      type="button"
      id="theme-switcher-toggle"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 text-xs font-black transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
      title={theme === 'light' ? 'Activer le Mode Sombre' : 'Activer le Mode Clair'}
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-3.5 w-3.5 text-slate-600 transition-transform duration-300 hover:rotate-12" />
          <span className="font-bold">🌙 Mode sombre</span>
        </>
      ) : (
        <>
          <Sun className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
          <span className="text-slate-200 font-bold">☀️ Mode clair</span>
        </>
      )}
    </button>
  );
}
