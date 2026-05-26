/**
 * theme-applier.js
 * Logique JavaScript pure pour appliquer le thème GitHub et gérer la persistance.
 */

const STORAGE_KEY = 'akpbf_erp_theme';

/**
 * Determine the active theme based on user storage, system settings, or default.
 * @returns {'light' | 'dark'}
 */
export function detectTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  // Media query check
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * Apply the designated theme to the <html> document root.
 * @param {'light' | 'dark'} theme 
 */
export function applyTheme(theme) {
  const root = window.document.documentElement;
  
  // Apply data-theme attribute
  root.setAttribute('data-theme', theme);
  
  // Synchronously sync with Tailwind dark classes for full compatibility
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Save preference
  localStorage.setItem(STORAGE_KEY, theme);
}

/**
 * Toggle between light and dark themes.
 * @returns {'light' | 'dark'} Newly applied theme
 */
export function toggleTheme() {
  const current = detectTheme();
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  return next;
}

// Bind to window global space for raw HTML/JS script execution
if (typeof window !== 'undefined') {
  window.detectTheme = detectTheme;
  window.applyTheme = applyTheme;
  window.setTheme = applyTheme;
  window.toggleTheme = toggleTheme;
  
  // Auto init immediately
  applyTheme(detectTheme());
}
