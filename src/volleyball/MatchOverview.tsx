import { useState } from 'react';
import BarChart from '../components/BarChart';
import Select, { Toolbar } from '../components/Select';
import SortableTable, { type Column } from '../components/SortableTable';
import StatTiles from '../components/StatTiles';
import { Muted } from '../components/Section';
import { clubOf, formatNumber, localeOf, sum } from '../lib/format';
import { useJson } from '../lib/useJson';
import type { Dict } from '../i18n';
import type { Lang, MatchesFile, Title } from '../types';
import { clubColor } from './clubColors';

interface ClubSeason {
  season: string;
  club: string;
  matches: number;
  europe: number;
  titles: Title[];
}

// Alle kamper fra Markus sin egen liste (public/data/kamper.json), samlet per klubb.
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
    const g = grouped.get(key) ?? { season: row.season, club: c, matches: 0, europe: 0, titles: [] };
    g.matches += sum(Object.values(row.counts), (n) => n ?? 0);
    g.europe += row.counts.europe ?? 0;
    g.titles.push(...(row.titles ?? []));
    grouped.set(key, g);
  }
  const rows = [...grouped.values()].sort((a, b) => a.season.localeCompare(b.season));
  const clubs = [...new Set(rows.map((r) => r.club))];
  const visible = rows.filter((r) => !club || r.club === club);
  const seasons = [...new Set(visible.map((r) => r.season))];
  const europe = sum(visible, (r) => r.europe);

  const columns: Column<ClubSeason>[] = [
    { key: 'season', label: m.cols.season, value: (r) => r.season },
    { key: 'club', label: m.cols.club, value: (r) => r.club },
    { key: 'matches', label: m.cols.matches, numeric: true, value: (r) => r.matches },
    {
      key: 'titles',
      label: m.cols.titles,
      value: (r) => (r.titles.length ? -r.titles.length : null),
      wrap: true,
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.titles.map((title) => (
            <span
              key={title}
              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200"
            >
              {m.titles[title]}
            </span>
          ))}
        </div>
      ),
    },
  ];

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
          // Én boks per klubb bare når alle klubber vises, og Europacup bare hvis det finnes kamper.
          ...(club ? [] : clubs).map((c) => ({ value: formatNumber(lang, sum(visible.filter((r) => r.club === c), (r) => r.matches)), label: c })),
          ...(europe > 0 ? [{ value: formatNumber(lang, europe), label: m.europe }] : []),
        ]}
      />

      <BarChart
        caption={m.chart}
        hint={t.hint}
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

      <SortableTable
        rows={visible}
        columns={columns}
        rowKey={(r) => `${r.season}|${r.club}`}
        initialSort={{ key: 'season', dir: -1 }}
        locale={localeOf(lang)}
        footer={
          <tr>
            <th colSpan={2}>{t.total}</th>
            <td className="text-right tabular-nums">{formatNumber(lang, sum(visible, (r) => r.matches))}</td>
            <td />
          </tr>
        }
      />
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {t.sortHint} ★ = {m.titleWord}.
      </p>
    </>
  );
}
