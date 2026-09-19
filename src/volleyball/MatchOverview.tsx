import { useState } from 'react';
import BarChart from '../components/BarChart';
import Select, { Toolbar } from '../components/Select';
import StatTiles from '../components/StatTiles';
import { Muted } from '../components/Section';
import { clubOf, formatNumber, sum } from '../lib/format';
import { useJson } from '../lib/useJson';
import type { Dict } from '../i18n';
import type { Lang, MatchesFile, Title } from '../types';
import { clubColor } from './clubColors';

interface ClubSeason {
  season: string;
  club: string;
  matches: number;
  titles: Title[];
}

// Karriere: alle kamper fra Markus sin egen liste (public/data/kamper.json), samlet per klubb.
export default function MatchOverview({ lang, t }: { lang: Lang; t: Dict }) {
  const data = useJson<MatchesFile>('/data/kamper.json');
  const [club, setClub] = useState('');
  const m = t.matches;

  if (data.status === 'loading') return <Muted>{t.loading}</Muted>;
  if (data.status === 'error') return <Muted>{t.error}</Muted>;

  const grouped = new Map<string, ClubSeason>();
  for (const row of data.data.rows) {
    const c = clubOf(row.team);
    const key = `${row.season}|${c}`;
    const g = grouped.get(key) ?? { season: row.season, club: c, matches: 0, titles: [] };
    g.matches += sum(Object.values(row.counts), (n) => n ?? 0);
    g.titles.push(...(row.titles ?? []));
    grouped.set(key, g);
  }
  const rows = [...grouped.values()].sort((a, b) => a.season.localeCompare(b.season));
  const clubs = [...new Set(rows.map((r) => r.club))];
  const visible = rows.filter((r) => !club || r.club === club);
  const seasons = [...new Set(visible.map((r) => r.season))];

  // Titler samlet: "🏆 NM-gull i cupen – 18/19, 19/20, 20/21"
  const titleSeasons = new Map<Title, string[]>();
  for (const r of visible) for (const title of r.titles) titleSeasons.set(title, [...(titleSeasons.get(title) ?? []), r.season]);

  return (
    <>
      <Toolbar>
        <Select
          label={m.filter}
          value={club}
          onChange={setClub}
          options={[{ value: '', label: m.all }, ...clubs.map((c) => ({ value: c, label: c }))]}
        />
      </Toolbar>

      <StatTiles
        tiles={[
          { value: formatNumber(lang, sum(visible, (r) => r.matches)), label: m.total },
          // Én boks per klubb bare når alle klubber vises.
          ...(club ? [] : clubs).map((c) => ({ value: formatNumber(lang, sum(visible.filter((r) => r.club === c), (r) => r.matches)), label: c })),
        ]}
      />

      {titleSeasons.size > 0 && (
        <ul className="mb-5 flex flex-wrap gap-2">
          {[...titleSeasons].map(([title, list]) => (
            <li
              key={title}
              className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
            >
              <span className="font-bold">{m.titles[title]}</span> {list.join(', ')}
            </li>
          ))}
        </ul>
      )}

      <BarChart
        caption={m.chart}
        hint={t.hint}
        note={`★ = ${m.titleWord}`}
        legend={clubs.map((c) => ({ label: c, className: clubColor(c).bg }))}
        bars={seasons.map((season) => {
          const parts = visible.filter((r) => r.season === season);
          const total = sum(parts, (r) => r.matches);
          return {
            key: season,
            label: season,
            total,
            title: `${season}: ${total} ${m.matchesWord}`,
            segments: clubs.map((c) => ({ value: sum(parts.filter((r) => r.club === c), (r) => r.matches), className: clubColor(c).fill })),
            highlight: parts.some((p) => p.titles.length > 0),
            detail: `${season} – ${total} ${m.matchesWord}. ${parts
              .map((p) => [p.club, ...p.titles.map((title) => m.titles[title])].join(': '))
              .join(' · ')}`,
          };
        })}
      />
    </>
  );
}
