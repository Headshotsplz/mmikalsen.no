// Faste farger per klubb i grafene (lys og mørk modus).
const COLORS: Record<string, { fill: string; bg: string }> = {
  Førde: { fill: 'fill-brand dark:fill-sky-300', bg: 'bg-brand dark:bg-sky-300' },
  OSI: { fill: 'fill-brand-muted dark:fill-slate-400', bg: 'bg-brand-muted dark:bg-slate-400' },
  NTNUI: { fill: 'fill-ntnui dark:fill-emerald-400', bg: 'bg-ntnui dark:bg-emerald-400' },
};

const FALLBACK = { fill: 'fill-slate-400', bg: 'bg-slate-400' };

export const clubColor = (club: string) => COLORS[club] ?? FALLBACK;
