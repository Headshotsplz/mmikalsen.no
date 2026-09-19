import { useState } from 'react';
import BarChart from '../components/BarChart';
import Collapsible from '../components/Collapsible';
import Select, { Toolbar } from '../components/Select';
import SortableTable, { type Column } from '../components/SortableTable';
import StatTiles from '../components/StatTiles';
import { Muted } from '../components/Section';
import { clubOf, formatDateTime, formatNumber, localeOf, sum } from '../lib/format';
import { useJson } from '../lib/useJson';
import type { Dict } from '../i18n';
import type { Lang, SeasonStats as Row, StatsResponse } from '../types';
import { clubColor } from './clubColors';

// Sesonger: statistikk fra NVBF via serverfunksjonen /api/stats.
export default function SeasonStats({ lang, t }: { lang: Lang; t: Dict }) {
  const data = useJson<StatsResponse>('/api/stats');
  const [club, setClub] = useState('');
  const s = t.stats;

  if (data.status === 'loading') return <Muted>{t.loading}</Muted>;
  if (data.status === 'error') return <Muted>{t.error}</Muted>;

  const rows = data.data.rows.map((r) => ({ ...r, team: clubOf(r.team) }));
  const clubs = [...new Set(rows.map((r) => r.team))];
  const visible = rows.filter((r) => !club || r.team === club);
  const total = (pick: (r: Row) => number) => sum(visible, pick);
  const seasons = [...new Set(visible.map((r) => r.season).filter(Boolean))].sort();
  const n = (v: number | null) => formatNumber(lang, v);

  const columns: Column<Row>[] = [
    { key: 'season', label: s.cols.season, value: (r) => r.compId, render: (r) => r.season || '–' },
    { key: 'team', label: s.cols.team, value: (r) => r.team },
    { key: 'matches', label: s.cols.matches, numeric: true, value: (r) => r.matches },
    { key: 'points', label: s.cols.points, numeric: true, value: (r) => r.points },
    { key: 'attack', label: s.cols.attack, numeric: true, value: (r) => r.attack },
    { key: 'block', label: s.cols.block, numeric: true, value: (r) => r.block },
    { key: 'ace', label: s.cols.ace, numeric: true, value: (r) => r.ace },
  ];

  return (
    <>
      {clubs.length > 1 && (
        <Toolbar>
          <Select
            label={s.filter}
            value={club}
            onChange={setClub}
            options={[{ value: '', label: s.all }, ...clubs.map((c) => ({ value: c, label: c }))]}
          />
        </Toolbar>
      )}

      <StatTiles
        tiles={[
          { value: n(total((r) => r.matches)), label: s.tiles.matches },
          { value: n(total((r) => r.points)), label: s.tiles.points },
          { value: n(total((r) => r.attack)), label: s.tiles.attack },
          { value: n(total((r) => r.block)), label: s.tiles.block },
          { value: n(total((r) => r.ace)), label: s.tiles.ace },
        ]}
      />

      <BarChart
        caption={s.chart}
        hint={t.hint}
        legend={clubs.length > 1 ? clubs.map((c) => ({ label: c, className: clubColor(c).bg })) : undefined}
        bars={seasons.map((season) => {
          const parts = visible.filter((r) => r.season === season);
          const points = sum(parts, (r) => r.points);
          return {
            key: season,
            label: season,
            total: points,
            title: `${season}: ${points} ${s.pointsWord}`,
            segments: parts.map((p) => ({ value: p.points, className: clubColor(p.team).fill })),
            detail: `${season} – ${parts
              .map((p) => `${p.team}: ${n(p.points)} ${s.pointsWord}, ${n(p.matches)} ${t.matches.matchesWord}`)
              .join(' · ')}`,
          };
        })}
      />

      <Collapsible summary={s.showTable}>
        <SortableTable
          rows={visible}
          columns={columns}
          rowKey={(r) => String(r.compId)}
          initialSort={{ key: 'season', dir: -1 }}
          locale={localeOf(lang)}
          footer={
            <tr>
              <th colSpan={2}>{t.total}</th>
              {(['matches', 'points', 'attack', 'block', 'ace'] as const).map((k) => (
                <td key={k} className="text-right tabular-nums">
                  {n(total((r) => r[k]))}
                </td>
              ))}
            </tr>
          }
        />
      </Collapsible>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {s.source}:{' '}
        <a href={data.data.source} rel="noopener" className="underline">
          NVBF
        </a>{' '}
        · {s.updated.toLowerCase()} {formatDateTime(lang, data.data.updated)}
      </p>
    </>
  );
}
