// Volleyballstatistikk: henter tall fra /api/stats og tegner nøkkeltall,
// graf over poeng per sesong og en sorterbar tabell med lagfilter.
(function () {
  'use strict';

  const root = document.getElementById('stats');
  if (!root) return;

  const lang = document.documentElement.lang === 'en' ? 'en' : 'no';
  const locale = lang === 'en' ? 'en-GB' : 'nb-NO';
  const T = {
    no: {
      loading: 'Laster statistikk …',
      error: 'Klarte ikke å hente statistikken akkurat nå. Prøv igjen senere.',
      allTeams: 'Alle lag',
      filter: 'Vis lag',
      chartTitle: 'Poeng per sesong',
      tiles: { matches: 'Kamper med statistikk', sets: 'Sett', points: 'Poeng', attack: 'Angrepspoeng', block: 'Blokkpoeng', ace: 'Serveess' },
      cols: { season: 'Sesong', competition: 'Turnering', team: 'Lag', matches: 'Kamper', sets: 'Sett', points: 'Poeng', attack: 'Angrep', block: 'Blokk', ace: 'Ess', attackPct: 'Angrep %' },
      matchesWord: 'kamper',
      pointsWord: 'poeng',
      hint: 'Hold over eller trykk på en søyle for detaljer. Klikk på en kolonne for å sortere.',
      updated: 'Sist hentet',
    },
    en: {
      loading: 'Loading statistics …',
      error: 'Could not load the statistics right now. Please try again later.',
      allTeams: 'All teams',
      filter: 'Show team',
      chartTitle: 'Points per season',
      tiles: { matches: 'Matches with stats', sets: 'Sets', points: 'Points', attack: 'Attack points', block: 'Block points', ace: 'Aces' },
      cols: { season: 'Season', competition: 'Competition', team: 'Team', matches: 'Matches', sets: 'Sets', points: 'Points', attack: 'Attack', block: 'Block', ace: 'Aces', attackPct: 'Attack %' },
      matchesWord: 'matches',
      pointsWord: 'points',
      hint: 'Hover or tap a bar for details. Click a column to sort.',
      updated: 'Last fetched',
    },
  }[lang];

  const num = (n) => (n == null ? '–' : n.toLocaleString(locale));
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    for (const c of children) node.append(c);
    return node;
  }

  function svg(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
    return node;
  }

  function shortCompetition(name) {
    return name.replace(/\s*(menn|senior)\b/gi, '').replace('Divisjon', lang === 'en' ? 'Division' : 'divisjon').trim();
  }

  const status = el('p', { class: 'stats-status' }, T.loading);
  root.replaceChildren(status);

  fetch('/api/stats')
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(render)
    .catch(() => {
      status.textContent = T.error;
    });

  function render(data) {
    const rows = data.rows.map((r) => ({ ...r, competition: shortCompetition(r.competition) }));
    const teams = [...new Set(rows.map((r) => r.team))];
    const state = { team: '', sortKey: 'compId', sortDir: -1 };

    // --- Lagfilter ---
    const select = el('select', { id: 'stats-team' }, el('option', { value: '' }, T.allTeams));
    for (const team of teams) select.append(el('option', { value: team }, team));
    select.addEventListener('change', () => {
      state.team = select.value;
      update();
    });
    const controls = el('div', { class: 'stats-controls' }, el('label', { for: 'stats-team' }, T.filter), select);

    // --- Nøkkeltall ---
    const tiles = el('div', { class: 'stat-tiles' });

    // --- Graf ---
    const chartInfo = el('p', { class: 'chart-info', 'aria-live': 'polite' }, T.hint);
    const chartWrap = el('div', { class: 'chart' });
    const chart = el('figure', { class: 'chart-figure' }, el('figcaption', {}, T.chartTitle), chartWrap, chartInfo);

    // --- Tabell ---
    const cols = ['season', 'competition', 'team', 'matches', 'sets', 'points', 'attack', 'block', 'ace', 'attackPct'];
    const numeric = new Set(['matches', 'sets', 'points', 'attack', 'block', 'ace', 'attackPct']);
    const headRow = el('tr');
    const headButtons = {};
    for (const key of cols) {
      const btn = el('button', { type: 'button', onclick: () => sortBy(key) }, T.cols[key]);
      headButtons[key] = btn;
      headRow.append(el('th', { scope: 'col', class: numeric.has(key) ? 'num' : '' }, btn));
    }
    const tbody = el('tbody');
    const tfoot = el('tfoot');
    const table = el('table', { class: 'stats-table' }, el('thead', {}, headRow), tbody, tfoot);

    const updated = el(
      'p',
      { class: 'stats-updated' },
      `${T.updated}: ${new Date(data.updated).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}`
    );

    // Lagfilteret er bare nyttig når det finnes mer enn ett lag.
    root.replaceChildren(...(teams.length > 1 ? [controls] : []), tiles, chart, el('div', { class: 'table-wrap' }, table), updated);

    function sortBy(key) {
      if (state.sortKey === key || (key === 'season' && state.sortKey === 'compId')) state.sortDir *= -1;
      else state.sortDir = numeric.has(key) ? -1 : 1;
      state.sortKey = key === 'season' ? 'compId' : key;
      update();
    }

    function update() {
      const visible = rows.filter((r) => !state.team || r.team === state.team);
      renderTiles(visible);
      renderChart(visible);
      renderTable(visible);
    }

    function renderTiles(visible) {
      const sum = (k) => visible.reduce((s, r) => s + (r[k] || 0), 0);
      tiles.replaceChildren(
        ...['matches', 'sets', 'points', 'attack', 'block', 'ace'].map((k) =>
          el('div', { class: 'tile' }, el('span', { class: 'tile-num' }, num(sum(k))), el('span', { class: 'tile-label' }, T.tiles[k]))
        )
      );
    }

    function renderChart(visible) {
      // Summer poeng per sesong (på tvers av turneringer og lag).
      const bySeason = new Map();
      for (const r of [...visible].sort((a, b) => a.compId - b.compId)) {
        if (!r.season) continue;
        const s = bySeason.get(r.season) || { season: r.season, points: 0, matches: 0, parts: [] };
        s.points += r.points;
        s.matches += r.matches;
        s.parts.push(`${r.team}, ${r.competition}: ${num(r.points)} ${T.pointsWord}`);
        bySeason.set(r.season, s);
      }
      const seasons = [...bySeason.values()].sort((a, b) => a.season.localeCompare(b.season));
      const max = Math.max(1, ...seasons.map((s) => s.points));
      const barW = 44, gap = 16, top = 24, h = 180, bottom = 28;
      const width = Math.max(1, seasons.length) * (barW + gap) + gap;
      const s = svg('svg', { viewBox: `0 0 ${width} ${top + h + bottom}`, role: 'img', 'aria-label': T.chartTitle });
      s.append(svg('line', { x1: 0, x2: width, y1: top + h, y2: top + h, class: 'axis' }));

      seasons.forEach((season, i) => {
        const x = gap + i * (barW + gap);
        const bh = Math.max(season.points > 0 ? 2 : 0, (season.points / max) * h);
        const g = svg('g', { class: 'bar-group', tabindex: '0' });
        const title = svg('title');
        title.textContent = `${season.season}: ${num(season.points)} ${T.pointsWord}`;
        g.append(title);
        g.append(svg('rect', { x, y: top + h - bh, width: barW, height: bh, rx: 4, class: 'bar' }));
        const value = svg('text', { x: x + barW / 2, y: top + h - bh - 6, class: 'bar-value' });
        value.textContent = num(season.points);
        const label = svg('text', { x: x + barW / 2, y: top + h + 18, class: 'bar-label' });
        label.textContent = season.season;
        g.append(value, label);

        const show = () => {
          s.querySelectorAll('.bar-group.active').forEach((n) => n.classList.remove('active'));
          g.classList.add('active');
          chartInfo.textContent = `${season.season} – ${num(season.matches)} ${T.matchesWord}. ${season.parts.join(' · ')}`;
        };
        g.addEventListener('mouseenter', show);
        g.addEventListener('focus', show);
        g.addEventListener('click', show);
        s.append(g);
      });
      chartWrap.replaceChildren(s);
      chartInfo.textContent = T.hint;
    }

    function renderTable(visible) {
      const key = state.sortKey;
      const sorted = [...visible].sort((a, b) => {
        const av = a[key], bv = b[key];
        if (av == null) return 1;
        if (bv == null) return -1;
        return (typeof av === 'string' ? av.localeCompare(bv, locale) : av - bv) * state.sortDir;
      });

      for (const [k, btn] of Object.entries(headButtons)) {
        const active = k === key || (k === 'season' && key === 'compId');
        btn.parentElement.setAttribute('aria-sort', active ? (state.sortDir > 0 ? 'ascending' : 'descending') : 'none');
      }

      tbody.replaceChildren(
        ...sorted.map((r) =>
          el(
            'tr',
            {},
            ...cols.map((k) => {
              const v = k === 'attackPct' ? (r[k] == null ? '–' : `${num(r[k])} %`) : numeric.has(k) ? num(r[k]) : r[k] || '–';
              return el('td', { class: numeric.has(k) ? 'num' : '' }, v);
            })
          )
        )
      );

      const sum = (k) => visible.reduce((s, r) => s + (r[k] || 0), 0);
      const totalLabel = lang === 'en' ? 'Total' : 'Totalt';
      tfoot.replaceChildren(
        el(
          'tr',
          {},
          el('th', { scope: 'row', colspan: '3' }, totalLabel),
          ...['matches', 'sets', 'points', 'attack', 'block', 'ace'].map((k) => el('td', { class: 'num' }, num(sum(k)))),
          el('td', { class: 'num' }, '')
        )
      );
    }

    update();
  }
})();
