// Henter Markus sin statistikk fra NVBF (Data Project) og returnerer den som JSON.
// Nettlesere kan ikke hente direkte fra Data Project (ingen CORS), så siden
// kaller denne funksjonen i stedet. Svaret mellomlagres hos Vercel i 12 timer.

const BASE = 'https://nvbf-web.dataproject.com';
const PLAYER_ID = '803';

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
}

// Alle herreturneringer som ligger på NVBF sin Data Project-side.
async function getCompetitions() {
  const html = await (await fetchWithTimeout(`${BASE}/MainHome.aspx`)).text();
  const comps = new Map();
  for (const m of html.matchAll(/CompetitionHome\.aspx\?ID=(\d+)"[^>]*>\s*([^<]{3,80}?)\s*</g)) {
    const [, id, name] = m;
    if (!/kvinner/i.test(name) && !comps.has(id)) comps.set(id, name.trim());
  }
  return comps;
}

async function getPlayerStats(compId) {
  const res = await fetchWithTimeout(`${BASE}/Statistics_AllPlayers.aspx/GetDataById`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    // phaseId 0 = alle faser (seriespill + sluttspill)
    body: JSON.stringify({ compId, phaseId: '0', playerSearchById: PLAYER_ID }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.d || [])[0] || null;
}

// Andel angrep som ga poeng. Null når spilleren ikke hadde noen angrep.
function attackPercent(p) {
  const attempts = p.SpikeErr + p.SpikeWin + p.SpikeMinus + p.SpikePlus + p.SpikeHP + p.SpikeEx;
  return attempts > 0 ? Math.round((p.SpikeWin / attempts) * 100) : null;
}

module.exports = async (req, res) => {
  try {
    const comps = await getCompetitions();
    const results = await Promise.allSettled(
      [...comps].map(async ([id, name]) => ({ id, name, p: await getPlayerStats(id) }))
    );

    const rows = results
      .filter((r) => r.status === 'fulfilled' && r.value.p && r.value.p.PlayedMatches > 0)
      .map(({ value: { id, name, p } }) => ({
        compId: Number(id),
        competition: name.replace(/\s*\d{2}\/\d{2}$/, ''),
        season: (name.match(/\d{2}\/\d{2}/) || [''])[0],
        team: p.Team,
        matches: p.PlayedMatches,
        sets: p.PlayedSets,
        points: p.PointsTot_ForAllPlayerStats,
        attack: p.SpikeWin,
        block: p.BlockWin,
        ace: p.ServeWin,
        attackPct: attackPercent(p),
      }))
      .sort((a, b) => a.compId - b.compId);

    res.setHeader('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
    res.status(200).json({
      updated: new Date().toISOString(),
      source: `${BASE}/`,
      rows,
    });
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'Kunne ikke hente statistikk fra NVBF.' });
  }
};
