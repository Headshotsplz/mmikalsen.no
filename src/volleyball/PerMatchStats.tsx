import { useState } from 'react';
import BarChart from '../components/BarChart';
import Collapsible from '../components/Collapsible';
import Select, { Toolbar } from '../components/Select';
import SortableTable, { type Column } from '../components/SortableTable';
import StatTiles from '../components/StatTiles';
import { Muted } from '../components/Section';
import { formatDate, formatNumber, localeOf, sum } from '../lib/format';
import { useJson } from '../lib/useJson';
import type { Dict } from '../i18n';
import type { Lang, TeamMatch, TeamMatchesFile } from '../types';

// Per kamp: NTNUI 2 (public/data/ntnui-matches.json, oppdateres av GitHub Actions).
export default function PerMatchStats({ lang, t }: { lang: Lang; t: Dict }) {
  const data = useJson<TeamMatchesFile>('/data/ntnui-matches.json');
  const [season, setSeason] = useState<string | null>(null);
  const p = t.perMatch;

  if (data.status === 'loading') return <Muted>{t.loading}</Muted>;
  if (data.status === 'error') return <Muted>{t.error}</Muted>;

  // Bare kamper Markus faktisk spilte (var på banen i minst ett sett).
  const all = data.data.matches.filter((m) => m.played);
  const seasons = [...new Set(all.map((m) => m.season))].sort();
  const current = season ?? seasons[seasons.length - 1] ?? '';
  const played = all.filter((m) => !current || m.season === current);

  const points = sum(played, (m) => m.stats?.points ?? 0);
  const maxPoints = Math.max(0, ...played.map((m) => m.stats?.points ?? 0));
  const best = played.filter((m) => (m.stats?.points ?? 0) === maxPoints && maxPoints > 0);
  const n = (v: number | null) => formatNumber(lang, v);
  const won = (m: TeamMatch) => m.setsFor > m.setsAgainst;
  const date = (m: TeamMatch) => formatDate(lang, m.date);
  const result = (m: TeamMatch) => `${m.setsFor}–${m.setsAgainst} ${won(m) ? p.win.toLowerCase() : p.loss.toLowerCase()}`;

  const columns: Column<TeamMatch>[] = [
    { key: 'date', label: p.cols.date, value: (m) => m.date, render: date },
    {
      key: 'opponent',
      label: p.cols.opponent,
      value: (m) => m.opponent,
      render: (m) => (
        <a href={m.source} rel="noopener" title={p.source} className="hover:underline">
          {m.opponent}
        </a>
      ),
    },
    {
      key: 'result',
      label: p.cols.result,
      value: (m) => m.setsFor - m.setsAgainst,
      render: (m) => (
        <span className={won(m) ? 'font-semibold text-ntnui dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
          {m.setsFor}–{m.setsAgainst}
        </span>
      ),
    },
    { key: 'points', label: p.cols.points, numeric: true, value: (m) => m.stats?.points ?? null },
    { key: 'attack', label: p.cols.attack, numeric: true, value: (m) => m.stats?.attack ?? null },
    { key: 'block', label: p.cols.block, numeric: true, value: (m) => m.stats?.block ?? null },
    { key: 'ace', label: p.cols.ace, numeric: true, value: (m) => m.stats?.ace ?? null },
  ];

  return (
    <>
      <Toolbar>
        <Select
          label={p.season}
          value={current}
          onChange={(v) => setSeason(v)}
          options={[...seasons.map((s) => ({ value: s, label: s })).reverse(), { value: '', label: p.allSeasons }]}
        />
      </Toolbar>

      <StatTiles
        tiles={[
          { value: n(played.length), label: p.tiles.played },
          { value: n(points), label: p.tiles.points },
          { value: played.length ? (points / played.length).toLocaleString(localeOf(lang), { maximumFractionDigits: 1 }) : '–', label: p.tiles.average },
          {
            value: best.length ? n(maxPoints) : '–',
            label: p.tiles.best,
            sub: best.map((m) => `${p.vs} ${m.opponent}, ${formatDate(lang, m.date, false)}`).join(' · '),
          },
        ]}
      />

      <BarChart
        caption={p.chart}
        hint={t.hint}
        note={`★ = ${p.best.toLowerCase()}`}
        legend={[
          { label: p.win, className: 'bg-ntnui dark:bg-emerald-400' },
          { label: p.loss, className: 'bg-brand-muted dark:bg-slate-500' },
        ]}
        bars={[...played]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((m) => {
            const s = m.stats;
            const pts = s?.points ?? 0;
            return {
              key: m.id,
              label: formatDate(lang, m.date, false),
              total: pts,
              highlight: best.includes(m),
              title: `${date(m)} ${p.vs} ${m.opponent}: ${pts} ${p.pointsWord}`,
              segments: [{ value: pts, className: won(m) ? 'fill-ntnui dark:fill-emerald-400' : 'fill-brand-muted dark:fill-slate-500' }],
              detail: `${date(m)} ${p.vs} ${m.opponent} (${result(m)}): ${pts} ${p.pointsWord} – ${s?.attack ?? 0} ${p.cols.attack.toLowerCase()}, ${s?.block ?? 0} ${p.cols.block.toLowerCase()}, ${s?.ace ?? 0} ${p.cols.ace.toLowerCase()}`,
            };
          })}
      />

      <Collapsible summary={p.showTable}>
        <SortableTable
          rows={played}
          columns={columns}
          rowKey={(m) => m.id}
          initialSort={{ key: 'date', dir: -1 }}
          locale={localeOf(lang)}
          rowClassName={(m) => (best.includes(m) ? 'bg-amber-50 dark:bg-amber-950/40' : '')}
        />
      </Collapsible>
    </>
  );
}
