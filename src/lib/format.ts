import type { Lang } from '../types';

export const localeOf = (lang: Lang) => (lang === 'en' ? 'en-GB' : 'nb-NO');

export const formatNumber = (lang: Lang, n: number | null | undefined) =>
  n == null ? '–' : n.toLocaleString(localeOf(lang));

export const formatPercent = (lang: Lang, n: number | null | undefined) =>
  n == null ? '–' : `${n.toLocaleString(localeOf(lang), { maximumFractionDigits: 0 })} %`;

export const formatDate = (lang: Lang, iso: string, withYear = true) =>
  new Date(iso).toLocaleDateString(localeOf(lang), withYear ? { day: '2-digit', month: '2-digit', year: 'numeric' } : { day: '2-digit', month: '2-digit' });

export const formatDateTime = (lang: Lang, iso: string) =>
  new Date(iso).toLocaleString(localeOf(lang), { dateStyle: 'medium', timeStyle: 'short' });

// "Førde VBK 2" -> "Førde", "OSI 2" -> "OSI", "NTNUI 2" -> "NTNUI"
export const clubOf = (team: string) => team.replace(/\s+2$/, '').replace(/\s+(VBK|Volleyballklubb)$/i, '');

export const sum = <T,>(items: T[], pick: (item: T) => number) => items.reduce((total, item) => total + pick(item), 0);
