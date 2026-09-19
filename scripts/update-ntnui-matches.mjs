// Henter Markus sin statistikk per kamp for NTNUI 2 fra NVBF (Data Project)
// og lagrer den i public/data/ntnui-matches.json.
//
// Kampsidene hos NVBF er store (~2 MB), så skriptet henter bare kamper som
// ikke allerede ligger i fila. Kjøres automatisk av GitHub Actions hver natt:
//   node scripts/update-ntnui-matches.mjs

import { readFile, writeFile } from 'node:fs/promises';

const BASE = 'https://nvbf-web.dataproject.com';
const PLAYER_ID = '803';
const PLAYER_NAME = /^Mikalsen Markus\b/;
const TEAM = 'NTNUI 2';
const OUT = new URL('../public/data/ntnui-matches.json', import.meta.url);

const get = async (url, options) => {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
};

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .trim();

// Turneringer der Markus har spilt for NTNUI 2, med fase-ID for kamplista.
async function findCompetitions() {
  const home = await (await get(`${BASE}/MainHome.aspx`)).text();
  const comps = new Map();
  for (const [, id, name] of home.matchAll(/CompetitionHome\.aspx\?ID=(\d+)"[^>]*>\s*([^<]{3,80}?)\s*</g)) {
    if (!/kvinner/i.test(name) && !comps.has(id)) comps.set(id, decode(name));
  }

  const found = [];
  for (const [id, name] of comps) {
    const res = await get(`${BASE}/Statistics_AllPlayers.aspx/GetDataById`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ compId: id, phaseId: '0', playerSearchById: PLAYER_ID }),
    });
    const player = ((await res.json()).d || [])[0];
    if (!player || player.Team !== TEAM || player.PlayedMatches === 0) continue;

    const compHome = await (await get(`${BASE}/CompetitionHome.aspx?ID=${id}`)).text();
    const phases = [...new Set([...compHome.matchAll(new RegExp(`ID=${id}&(?:amp;)?PID=(\\d+)`, 'g'))].map((m) => m[1]))];
    found.push({ id, name, season: (name.match(/\d{2}\/\d{2}/) || [''])[0], phases });
  }
  return found;
}

// Alle ferdigspilte kamper for NTNUI 2 i en turnering/fase.
async function findMatches(comp, phase) {
  const html = await (await get(`${BASE}/CompetitionMatches.aspx?ID=${comp.id}&PID=${phase}`)).text();
  // Vinnerlaget og settene er av og til pakket inn i <b>, så vi fjerner tagger.
  const pick = (block, ...fields) => {
    for (const field of fields) {
      const m = block.match(new RegExp(`_${field}"[^>]*>([\\s\\S]*?)</span>`));
      const value = m ? decode(m[1].replace(/<[^>]+>/g, '')) : '';
      if (value) return value;
    }
    return '';
  };
  // NVBF bruker to ulike oppsett for kampradene (Label2/Label4 eller LBL_*TeamName).
  return html
    .split(/RADLIST_Matches_ctrl\d+_MatchRow"/)
    .slice(1)
    .map((b) => ({
      mID: (b.match(/MatchStatistics\.aspx\?mID=(\d+)/) || [])[1],
      date: pick(b, 'LB_DataOra'),
      venue: pick(b, 'LB_Palasport'),
      home: pick(b, 'LBL_HomeTeamName', 'Label2'),
      away: pick(b, 'LBL_GuestTeamName', 'Label4'),
      setsHome: Number(pick(b, 'LB_SetCasa')),
      setsAway: Number(pick(b, 'LB_SetOspiti')),
    }))
    .filter((m) => m.mID && (m.home === TEAM || m.away === TEAM) && m.setsHome + m.setsAway > 0)
    .map((m) => ({ ...m, compId: comp.id, phase, season: comp.season, competition: comp.name.replace(/\s*\d{2}\/\d{2}$/, '') }));
}

// Markus sin rad i kampstatistikken (første tabell = hele kampen).
async function fetchPlayerRow(match) {
  const html = await (
    await get(`${BASE}/MatchStatistics.aspx?mID=${match.mID}&ID=${match.compId}&PID=${match.phase}&type=LegList`)
  ).text();
  for (const [, row] of html.matchAll(/<tr class="rg(?:Alt)?Row"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = Object.fromEntries([...row.matchAll(/<span id="(\w+)">(?:<b>)?([^<]*)/g)].map(([, k, v]) => [k, decode(v)]));
    if (PLAYER_NAME.test(cells.PlayerName || '')) return cells;
  }
  return null;
}

const n = (v) => {
  const x = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(x) ? x : 0;
};

function toStats(cells) {
  const attackAttempts = n(cells.SpikeTot);
  return {
    points: n(cells.PointsTot),
    attack: n(cells.SpikeWin),
    attackAttempts,
    attackErrors: n(cells.SpikeErr),
    attackBlocked: n(cells.SpikeHP),
    block: n(cells.BlockWin),
    ace: n(cells.ServeAce),
    serves: n(cells.ServeTot),
    serveErrors: n(cells.ServeErr),
    receptions: n(cells.RecTot),
    // Sett der han var på banen (NVBF markerer sett med rotasjonsnummer)
    sets: ['Set1', 'Set2', 'Set3', 'Set4', 'Set5'].filter((k) => (cells[k] || '').trim() !== '').length,
  };
}

// "28.09.2025 - 13:00" -> "2025-09-28T13:00"
function isoDate(s) {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2}):(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}` : s;
}

async function main() {
  let existing = { matches: [] };
  try {
    existing = JSON.parse(await readFile(OUT, 'utf8'));
  } catch {}
  const known = new Map(existing.matches.map((m) => [m.id, m]));

  const comps = await findCompetitions();
  console.log('Turneringer:', comps.map((c) => `${c.name} (${c.phases.join(',')})`).join('; '));

  let added = 0;
  for (const comp of comps) {
    for (const phase of comp.phases) {
      for (const m of await findMatches(comp, phase)) {
        if (known.has(m.mID)) continue;
        const cells = await fetchPlayerRow(m);
        // På laglista uten å ha vært på banen i noe sett regnes ikke som spilt.
        const stats = cells ? toStats(cells) : null;
        const played = Boolean(stats && stats.sets > 0);
        const ntnuiHome = m.home === TEAM;
        known.set(m.mID, {
          id: m.mID,
          date: isoDate(m.date),
          season: m.season,
          competition: m.competition,
          home: ntnuiHome,
          opponent: ntnuiHome ? m.away : m.home,
          setsFor: ntnuiHome ? m.setsHome : m.setsAway,
          setsAgainst: ntnuiHome ? m.setsAway : m.setsHome,
          played,
          stats: played ? stats : null,
          source: `${BASE}/MatchStatistics.aspx?mID=${m.mID}&ID=${m.compId}&PID=${m.phase}`,
        });
        added++;
        console.log(`${m.date} ${m.home}–${m.away}: ${played ? `${stats.points} poeng` : 'spilte ikke'}`);
      }
    }
  }

  const matches = [...known.values()].sort((a, b) => a.date.localeCompare(b.date));
  if (added === 0 && existing.updated) {
    console.log('Ingen nye kamper.');
    return;
  }
  await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), player: 'Markus Mikalsen', team: TEAM, matches }, null, 2) + '\n');
  console.log(`Lagret ${matches.length} kamper (${added} nye).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
