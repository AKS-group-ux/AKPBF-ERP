import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  const isLight = theme === 'light';
  
  return (
    <button
      type="button"
      id="theme-switcher-toggle"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[var(--bg-secondary)] hover:bg-[var(--border-muted)] text-[var(--fg-primary)] border border-[var(--border-primary)] text-xs font-medium transition-all duration-100 cursor-pointer shadow-sm active:opacity-90"
      title={isLight ? 'Activer le Mode Sombre' : 'Activer le Mode Clair'}
    >
      {isLight ? (
        <>
          <Moon className="h-3.5 w-3.5 text-[var(--fg-secondary)]" />
          <span>Sombre</span>
        </>
      ) : (
        <>
          <Sun className="h-3.5 w-3.5 text-[#d29922]" />
          <span>Clair</span>
        </>
      )}
    </button>
  );
}
