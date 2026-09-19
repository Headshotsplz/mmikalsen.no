export type Lang = 'no' | 'en';

// public/data/kamper.json – Markus sin egen kampliste
export type MatchCategory = 'league' | 'playoff' | 'cup' | 'europe' | 'nordic' | 'ranking' | 'other';
export type Title = 'leagueGold' | 'cupGold' | 'playoffGold';
export interface SeasonMatches {
  season: string;
  level: 'elite' | 'div1';
  team: string;
  counts: Partial<Record<MatchCategory, number>>;
  titles?: Title[];
}
export interface MatchesFile {
  rows: SeasonMatches[];
}

// /api/stats – sesongstatistikk fra NVBF
export interface SeasonStats {
  compId: number;
  competition: string;
  season: string;
  team: string;
  matches: number;
  sets: number;
  points: number;
  attack: number;
  block: number;
  ace: number;
  attackPct: number | null;
}
export interface StatsResponse {
  updated: string;
  source: string;
  rows: SeasonStats[];
}

// public/data/ntnui-matches.json – statistikk per kamp for NTNUI 2
export interface PlayerMatchStats {
  points: number;
  attack: number;
  attackAttempts: number;
  attackErrors: number;
  attackBlocked: number;
  block: number;
  ace: number;
  serves: number;
  serveErrors: number;
  receptions: number;
  sets: number;
}
export interface TeamMatch {
  id: string;
  date: string;
  season: string;
  competition: string;
  home: boolean;
  opponent: string;
  setsFor: number;
  setsAgainst: number;
  played: boolean;
  stats: PlayerMatchStats | null;
  source: string;
}
// public/data/ntnui-2627.json – NTNUI 2 i 1. divisjon 2026/27
export interface SeasonPlayerLine {
  number: number;
  name: string;
  sets: number;
  points: number;
  attack: number;
  block: number;
  ace: number;
}
export interface SeasonFixture {
  id: string;
  date: string;
  round: string;
  venue: string;
  home: boolean;
  opponent: string;
  setsFor: number | null;
  setsAgainst: number | null;
  finished: boolean;
  sets: [number, number][] | null; // poeng per sett, [NTNUI, motstander]
  players: SeasonPlayerLine[] | null;
  statsUrl: string | null;
}
export interface TableRow {
  position: number;
  team: string;
  played: number;
  won: number;
  lost: number;
  setsFor: number;
  setsAgainst: number;
  points: number;
  us: boolean;
}
export interface CurrentSeasonFile {
  updated: string;
  season: string;
  team: string;
  tournament: string;
  table: TableRow[];
  matches: SeasonFixture[];
}

export interface TeamMatchesFile {
  updated: string;
  team: string;
  matches: TeamMatch[];
}
