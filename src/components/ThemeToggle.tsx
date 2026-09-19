import { useState } from 'react';
import { applyTheme, getStoredTheme, storeTheme, type Theme } from '../theme';
import type { Dict } from '../i18n';

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };

// Bytter mellom system → lyst → mørkt.
export default function ThemeToggle({ t }: { t: Dict['theme'] }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const toggle = () => {
    const next = NEXT[theme];
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={t[theme]}
      aria-label={t[theme]}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/90 ring-1 ring-white/40 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
    >
      {theme === 'light' && <SunIcon />}
      {theme === 'dark' && <MoonIcon />}
      {theme === 'system' && <SystemIcon />}
    </button>
  );
}

const iconProps = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const;

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
