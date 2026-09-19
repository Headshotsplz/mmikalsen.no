// Sesongen 2026/27 for NTNUI 2 i 1. divisjon menn.
//
// Henter fra to kilder og lagrer i public/data/ntnui-2627.json:
//  - VolleyLive / NIF terminliste (kamper.volleyball.no): kampoppsett, resultater,
//    settresultater og tabell.
//  - NVBF / Data Project: statistikk per spiller i hver kamp (poeng, angrep, blokk, ess),
//    så snart NVBF legger ut sesongen der.
//
// Kjøres hver natt av GitHub Actions:  node scripts/update-ntnui-2627.mjs

import { readFile, writeFile } from 'node:fs/promises';

const TA_API = 'https://sf48-terminlister-prod-app.azurewebsites.net/ta/';
const NVBF = 'https://nvbf-web.dataproject.com';
const TOURNAMENT_ID = 449582; // 1. divisjon - Menn, sesong 2026/27
const TEAM_TA = 'NTNUI - M 2'; // lagnavn i VolleyLive
const TEAM_NVBF = 'NTNUI 2'; // lagnavn hos Data Project
const SEASON = '26/27';
const OUT = new URL('../public/data/ntnui-2627.json', import.meta.url);

const fetchText = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};
const fetchJson = async (path) => JSON.parse(await fetchText(TA_API + path));

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .trim();

const num = (v) => {
  const x = parseInt(String(v ?? '').replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(x) ? x : 0;
};

// "TIF Viking - M 2" -> "TIF Viking 2", "KFUM Volda - M 1" -> "KFUM Volda",
// "BK Tromsø -Volleyball - M 2" -> "BK Tromsø 2"
const cleanTeam = (name) =>
  name
    .replace(/\s*-\s*Volleyball\b/i, '')
    .replace(/\bVolleyballklubb\b/, 'VBK')
    .replace(/\s*-\s*M\s*1$/, '')
    .replace(/\s*-\s*M\s*(\d+)$/, ' $1')
    .trim();

// ---------- VolleyLive: kamper, sett og tabell ----------

async function loadFixtures(cache, nameById) {
  const data = await fetchJson(`TournamentMatches/?tournamentId=${TOURNAMENT_ID}`);
  // Bruk de korte lagnavnene fra tabellen (f.eks. "OSI"), ellers ryddet kampnavn.
  const teamName = (id, name) => nameById.get(id) ?? cleanTeam(name);
  const all = data.matches ?? data;
  const ours = all.filter((m) => m.hometeam === TEAM_TA || m.awayteam === TEAM_TA);
  const teamId = ours[0] ? (ours[0].hometeam === TEAM_TA ? ours[0].hometeamId : ours[0].awayteamId) : null;

  const matches = [];
  for (const m of ours) {
    const home = m.hometeam === TEAM_TA;
    const time = String(m.matchStartTime ?? '').padStart(4, '0');
    const result = m.matchResult;
    const finished = Boolean(result);
    const id = String(m.matchId);

    // Settresultater hentes én gang per ferdigspilt kamp.
    let sets = cache.get(id)?.sets ?? null;
    if (finished && !sets) {
      const inc = await fetchJson(`MatchIncidents?matchId=${id}`);
      sets = (inc.matchPeriodResults ?? [])
        .filter((p) => p.homeGoals + p.awayGoals > 0)
        .map((p) => (home ? [p.homeGoals, p.awayGoals] : [p.awayGoals, p.homeGoals]));
    }

    matches.push({
      id,
      date: `${m.matchDate.slice(0, 10)}T${time.slice(0, 2)}:${time.slice(2)}`,
      round: m.roundName,
      venue: m.activityAreaName,
      home,
      opponent: home ? teamName(m.awayteamId, m.awayteam) : teamName(m.hometeamId, m.hometeam),
      setsFor: finished ? (home ? result.homeGoals : result.awayGoals) : null,
      setsAgainst: finished ? (home ? result.awayGoals : result.homeGoals) : null,
      finished,
      sets: finished ? sets : null,
    });
  }
  matches.sort((a, b) => a.date.localeCompare(b.date));
  return { matches, teamId };
}

const loadStandings = () => fetchJson(`TournamentStandings/?tournamentId=${TOURNAMENT_ID}`);

function toTable(rows, teamId) {
  return rows
    .map((r) => ({
      position: r.position,
      team: cleanTeam(r.orgName ?? ''),
      played: r.totalMatches ?? r.matches ?? 0,
      won: r.victories ?? 0,
      lost: r.losses ?? 0,
      setsFor: r.goalsScored ?? 0,
      setsAgainst: r.goalsConceeded ?? 0,
      points: r.totalPoints ?? 0,
      us: r.orgId === teamId,
    }))
    .sort((a, b) => a.position - b.position);
}

// ---------- Data Project: spillerstatistikk ----------

const pick = (block, ...fields) => {
  for (const field of fields) {
    const m = block.match(new RegExp(`_${field}"[^>]*>([\\s\\S]*?)</span>`));
    if (m && decode(m[1])) return decode(m[1]);
  }
  return '';
};

// Turneringer for sesongen hos Data Project der NTNUI 2 spiller (f.eks. "1. Divisjon menn 26/27").
async function findStatsCompetitions() {
  const home = await fetchText(`${NVBF}/MainHome.aspx`);
  const comps = [];
  for (const [, id, name] of home.matchAll(/CompetitionHome\.aspx\?ID=(\d+)"[^>]*>\s*([^<]{3,80}?)\s*</g)) {
    if (!name.includes(SEASON) || /kvinner/i.test(name) || !/divisjon/i.test(name) || comps.some((c) => c.id === id)) continue;
    const compHome = await fetchText(`${NVBF}/CompetitionHome.aspx?ID=${id}`);
    const phases = [...new Set([...compHome.matchAll(new RegExp(`ID=${id}&(?:amp;)?PID=(\\d+)`, 'g'))].map((m) => m[1]))].filter((p) => p !== '0');
    comps.push({ id, phases });
  }
  return comps;
}

// "28.09.2025 - 13:00" -> "2025-09-28"
const dayOf = (s) => {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

// Kampsiden har én tabell per lag: første er hjemmelaget, andre bortelaget.
async function fetchTeamStats(url, home) {
  const html = await fetchText(url);
  const tables = [...html.matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)]
    .map(([, body]) =>
      [...body.matchAll(/<tr class="rg(?:Alt)?Row"[^>]*>([\s\S]*?)<\/tr>/g)].map(([, row]) =>
        Object.fromEntries([...row.matchAll(/<span id="(\w+)">(?:<b>)?([^<]*)/g)].map(([, k, v]) => [k, decode(v)]))
      )
    )
    .filter((rows) => rows.some((r) => r.PlayerName));
  const rows = tables[home ? 0 : 1];
  if (!rows) return null;
  const players = rows
    .map((c) => ({
      number: num(c.PlayerNumber),
      name: c.PlayerName.replace(/\s*\(L\)$/, ''),
      sets: ['Set1', 'Set2', 'Set3', 'Set4', 'Set5'].filter((k) => (c[k] || '').trim() !== '').length,
      points: num(c.PointsTot),
      attack: num(c.SpikeWin),
      block: num(c.BlockWin),
      ace: num(c.ServeAce),
    }))
    .filter((p) => p.sets > 0);
  return players.length ? players : null;
}

// Spillerstatistikk per kampdato, for ferdigspilte kamper som ikke allerede har det.
async function loadPlayerStats(needDays) {
  const byDay = new Map();
  if (needDays.size === 0) return byDay;
  for (const comp of await findStatsCompetitions()) {
    for (const phase of comp.phases) {
      const html = await fetchText(`${NVBF}/CompetitionMatches.aspx?ID=${comp.id}&PID=${phase}`);
      for (const b of html.split(/RADLIST_Matches_ctrl\d+_MatchRow"/).slice(1)) {
        const mID = (b.match(/MatchStatistics\.aspx\?mID=(\d+)/) || [])[1];
        const homeTeam = pick(b, 'LBL_HomeTeamName', 'Label2');
        const awayTeam = pick(b, 'LBL_GuestTeamName', 'Label4');
        const day = dayOf(pick(b, 'LB_DataOra'));
        if (!mID || !needDays.has(day) || (homeTeam !== TEAM_NVBF && awayTeam !== TEAM_NVBF)) continue;
        const url = `${NVBF}/MatchStatistics.aspx?mID=${mID}&ID=${comp.id}&PID=${phase}&type=LegList`;
        const players = await fetchTeamStats(url, homeTeam === TEAM_NVBF);
        if (players) byDay.set(day, { players, statsUrl: url.replace('&type=LegList', '') });
      }
    }
  }
  return byDay;
}

// ---------- Sett sammen ----------

async function main() {
  let existing = { matches: [] };
  try {
    existing = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {}
  const cache = new Map(existing.matches.map((m) => [m.id, m]));

  const standings = await loadStandings();
  const nameById = new Map(standings.map((r) => [r.orgId, cleanTeam(r.orgName ?? '')]));
  const { matches, teamId } = await loadFixtures(cache, nameById);
  const table = teamId ? toTable(standings, teamId) : [];

  // Behold spillerstatistikk vi allerede har, og hent for nye ferdigspilte kamper.
  for (const m of matches) {
    const old = cache.get(m.id);
    m.players = old?.players ?? null;
    m.statsUrl = old?.statsUrl ?? null;
  }
  const needDays = new Set(matches.filter((m) => m.finished && !m.players).map((m) => m.date.slice(0, 10)));
  const stats = await loadPlayerStats(needDays);
  for (const m of matches) {
    const s = !m.players && stats.get(m.date.slice(0, 10));
    if (s) Object.assign(m, s);
  }

  const data = { season: SEASON, team: TEAM_NVBF, tournament: '1. divisjon', table, matches };
  const { updated: _, ...before } = existing;
  if (JSON.stringify(before) === JSON.stringify(data)) {
    console.log('Ingen endringer.');
    return;
  }
  await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), ...data }, null, 2) + '\n');
  console.log(
    `Lagret ${matches.length} kamper (${matches.filter((m) => m.finished).length} spilt, ${matches.filter((m) => m.players).length} med spillerstatistikk), tabell med ${table.length} lag.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
