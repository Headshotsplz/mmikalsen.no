import Collapsible from '../components/Collapsible';
import SortableTable, { type Column } from '../components/SortableTable';
import StatTiles from '../components/StatTiles';
import { Muted } from '../components/Section';
import { formatDate, localeOf, sum } from '../lib/format';
import { useJson } from '../lib/useJson';
import type { Dict } from '../i18n';
import type { CurrentSeasonFile, Lang, SeasonFixture, SeasonPlayerLine, TableRow } from '../types';

interface Leader {
  name: string;
  number: number;
  matches: number;
  points: number;
  attack: number;
  block: number;
  ace: number;
}

const isMarkus = (name: string) => /^Mikalsen Markus\b/.test(name);
const highlight = (name: string) => (isMarkus(name) ? 'bg-amber-50 font-semibold dark:bg-amber-950/40' : '');

// Sesongen 2026/27 for NTNUI 2 i 1. divisjon (public/data/ntnui-2627.json, oppdateres hver natt).
export default function CurrentSeason({ lang, t }: { lang: Lang; t: Dict }) {
  const data = useJson<CurrentSeasonFile>('/data/ntnui-2627.json');
  const c = t.current;

  if (data.status === 'loading') return <Muted>{t.loading}</Muted>;
  if (data.status === 'error') return <Muted>{t.error}</Muted>;

  const { matches, table } = data.data;
  const locale = localeOf(lang);
  const played = matches.filter((m) => m.finished);
  const upcoming = matches.filter((m) => !m.finished);
  const wins = played.filter((m) => (m.setsFor ?? 0) > (m.setsAgainst ?? 0)).length;
  const us = table.find((r) => r.us);
  const dateTime = (m: SeasonFixture) =>
    new Date(m.date).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Toppliste summert over kamper med spillerstatistikk.
  const byPlayer = new Map<string, Leader>();
  for (const m of played) {
    for (const p of m.players ?? []) {
      const key = `${p.name}|${p.number}`;
      const s = byPlayer.get(key) ?? { name: p.name, number: p.number, matches: 0, points: 0, attack: 0, block: 0, ace: 0 };
      s.matches += 1;
      s.points += p.points;
      s.attack += p.attack;
      s.block += p.block;
      s.ace += p.ace;
      byPlayer.set(key, s);
    }
  }
  const leaders = [...byPlayer.values()];

  const leaderColumns: Column<Leader>[] = [
    { key: 'name', label: c.cols.player, value: (p) => p.name },
    { key: 'matches', label: c.cols.matches, numeric: true, value: (p) => p.matches },
    { key: 'points', label: c.cols.points, numeric: true, value: (p) => p.points },
    {
      key: 'average',
      label: c.cols.average,
      numeric: true,
      value: (p) => p.points / p.matches,
      render: (p) => (p.points / p.matches).toLocaleString(locale, { maximumFractionDigits: 1 }),
    },
    { key: 'attack', label: c.cols.attack, numeric: true, value: (p) => p.attack },
    { key: 'block', label: c.cols.block, numeric: true, value: (p) => p.block },
    { key: 'ace', label: c.cols.ace, numeric: true, value: (p) => p.ace },
  ];

  const playerColumns: Column<SeasonPlayerLine>[] = [
    { key: 'name', label: c.cols.player, value: (p) => p.name },
    { key: 'points', label: c.cols.points, numeric: true, value: (p) => p.points },
    { key: 'attack', label: c.cols.attack, numeric: true, value: (p) => p.attack },
    { key: 'block', label: c.cols.block, numeric: true, value: (p) => p.block },
    { key: 'ace', label: c.cols.ace, numeric: true, value: (p) => p.ace },
    { key: 'sets', label: c.cols.sets, numeric: true, value: (p) => p.sets },
  ];

  const tableColumns: Column<TableRow>[] = [
    { key: 'position', label: '#', numeric: true, value: (r) => r.position },
    { key: 'team', label: c.cols.team, value: (r) => r.team },
    { key: 'played', label: c.cols.matchesShort, numeric: true, value: (r) => r.played },
    { key: 'won', label: c.cols.won, numeric: true, value: (r) => r.won },
    { key: 'lost', label: c.cols.lost, numeric: true, value: (r) => r.lost },
    { key: 'sets', label: c.cols.sets, numeric: true, value: (r) => r.setsFor - r.setsAgainst, render: (r) => `${r.setsFor}–${r.setsAgainst}` },
    { key: 'points', label: c.cols.tablePoints, numeric: true, value: (r) => r.points },
  ];

  return (
    <>
      {played.length > 0 ? (
        <StatTiles
          tiles={[
            { value: String(played.length), label: c.tiles.played },
            { value: `${wins}–${played.length - wins}`, label: c.tiles.record },
            { value: `${sum(played, (m) => m.setsFor ?? 0)}–${sum(played, (m) => m.setsAgainst ?? 0)}`, label: c.tiles.sets },
            ...(us ? [{ value: `${us.position}.`, label: c.tiles.position, sub: `${us.points} ${c.pointsWord}` }] : []),
          ]}
        />
      ) : (
        upcoming[0] && <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{c.notStarted(formatDate(lang, upcoming[0].date))}</p>
      )}

      {upcoming[0] && (
        <div className="mb-5 rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{c.next}</span>
          <div className="font-semibold">
            NTNUI 2 {c.vs} {upcoming[0].opponent}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {dateTime(upcoming[0])} · {upcoming[0].venue} ({upcoming[0].home ? c.homeLong : c.awayLong})
          </div>
        </div>
      )}

      {leaders.length > 0 && (
        <>
          <h3 className="mb-2 font-semibold text-brand dark:text-slate-100">{c.leaders}</h3>
          <SortableTable
            rows={leaders}
            columns={leaderColumns}
            rowKey={(p) => `${p.name}|${p.number}`}
            initialSort={{ key: 'points', dir: -1 }}
            locale={locale}
            rowClassName={(p) => highlight(p.name)}
          />
        </>
      )}

      {played.length > 0 && (
        <>
          <h3 className="mt-6 mb-2 font-semibold text-brand dark:text-slate-100">{c.results}</h3>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {[...played].reverse().map((m) => {
              const won = (m.setsFor ?? 0) > (m.setsAgainst ?? 0);
              const top = m.players ? [...m.players].sort((a, b) => b.points - a.points)[0] : null;
              return (
                <li key={m.id} className="py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(lang, m.date, false)}</span>{' '}
                      <span className="font-semibold">
                        {c.vs} {m.opponent}
                      </span>{' '}
                      <span className="text-xs text-slate-500 dark:text-slate-400">({m.home ? c.home : c.away})</span>
                    </span>
                    <span className={won ? 'font-bold text-ntnui dark:text-emerald-400' : 'font-bold text-slate-500 dark:text-slate-400'}>
                      {m.setsFor}–{m.setsAgainst} {won ? c.win : c.loss}
                    </span>
                  </div>
                  {m.sets && m.sets.length > 0 && (
                    <div className="text-xs text-slate-500 tabular-nums dark:text-slate-400">{m.sets.map(([a, b]) => `${a}–${b}`).join(', ')}</div>
                  )}
                  {m.players ? (
                    <Collapsible summary={`${c.showPlayers}${top ? ` · ${c.top}: ${top.name} (${top.points})` : ''}`}>
                      <SortableTable
                        rows={m.players}
                        columns={playerColumns}
                        rowKey={(p) => `${p.number}|${p.name}`}
                        initialSort={{ key: 'points', dir: -1 }}
                        locale={locale}
                        rowClassName={(p) => highlight(p.name)}
                      />
                      {m.statsUrl && (
                        <a href={m.statsUrl} rel="noopener" className="mt-2 inline-block text-xs text-slate-500 underline dark:text-slate-400">
                          {c.source}
                        </a>
                      )}
                    </Collapsible>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.noPlayerStats}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {upcoming.length > 1 && (
        <Collapsible summary={c.showFixtures(upcoming.length)}>
          <ul className="divide-y divide-slate-200 text-sm dark:divide-slate-700">
            {upcoming.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-x-4 py-1.5">
                <span>
                  <span className="font-semibold">
                    {c.vs} {m.opponent}
                  </span>{' '}
                  <span className="text-xs text-slate-500 dark:text-slate-400">({m.home ? c.home : c.away})</span>
                </span>
                <span className="text-slate-600 tabular-nums dark:text-slate-300">{dateTime(m)}</span>
              </li>
            ))}
          </ul>
        </Collapsible>
      )}

      {table.length > 0 && (
        <Collapsible summary={c.showTable}>
          <SortableTable
            rows={table}
            columns={tableColumns}
            rowKey={(r) => r.team}
            initialSort={{ key: 'position', dir: 1 }}
            sortable={false}
            locale={locale}
            rowClassName={(r) => (r.us ? 'bg-emerald-50 font-semibold dark:bg-emerald-950/40' : '')}
          />
        </Collapsible>
      )}

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {c.sources}:{' '}
        <a href="https://kamper.volleyball.no/" rel="noopener" className="underline">
          VolleyLive
        </a>{' '}
        ·{' '}
        <a href="https://nvbf-web.dataproject.com/" rel="noopener" className="underline">
          NVBF
        </a>
      </p>
    </>
  );
}
