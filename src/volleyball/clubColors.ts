// Faste farger per klubb i grafene (lys og mørk modus).
const COLORS: Record<string, { fill: string; bg: string }> = {
  Førde: { fill: 'fill-blue-600 dark:fill-blue-400', bg: 'bg-blue-600 dark:bg-blue-400' },
  OSI: { fill: 'fill-red-600 dark:fill-red-400', bg: 'bg-red-600 dark:bg-red-400' },
  NTNUI: { fill: 'fill-ntnui dark:fill-emerald-400', bg: 'bg-ntnui dark:bg-emerald-400' },
};

const FALLBACK = { fill: 'fill-slate-400', bg: 'bg-slate-400' };

export const clubColor = (club: string) => COLORS[club] ?? FALLBACK;
