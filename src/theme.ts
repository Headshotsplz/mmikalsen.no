export type Theme = 'system' | 'light' | 'dark';

const KEY = 'theme';

export function getStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // localStorage kan være blokkert (privat modus o.l.) – da følger vi systemet.
  }
  return 'system';
}

export function storeTheme(theme: Theme) {
  try {
    if (theme === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Ignorer – temaet gjelder da bare til siden lastes på nytt.
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme !== 'system') root.classList.add(theme);
}
