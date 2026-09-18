// Kampoversikt: leser /data/kamper.json og tegner nøkkeltall, graf over
// kamper per sesong (Eliteserien og 1. divisjon) og en tabell med nivåfilter.
(function () {
  'use strict';

  const root = document.getElementById('matches');
  if (!root) return;

  const lang = document.documentElement.lang === 'en' ? 'en' : 'no';
  const locale = lang === 'en' ? 'en-GB' : 'nb-NO';
  const T = {
    no: {
      loading: 'Laster kamper …',
      error: 'Klarte ikke å laste kampoversikten.',
      filter: 'Vis nivå',
      all: 'Alle nivåer',
      levels: { elite: 'Eliteserien', div1: '1. divisjon' },
      cats: { league: 'serie', playoff: 'sluttspill', cup: 'cup', europe: 'Europacup', nordic: 'nordisk klubbmesterskap', ranking: 'ranking', other: 'andre' },
      tiles: { total: 'Kamper totalt', elite: 'Eliteserien', div1: '1. divisjon', europe: 'Europacup', seasons: 'Sesonger' },
      chartTitle: 'Kamper per sesong',
      cols: { season: 'Sesong', level: 'Nivå', team: 'Lag', matches: 'Kamper', details: 'Fordeling' },
      total: 'Totalt',
      matchesWord: 'kamper',
      hint: 'Hold over eller trykk på en søyle for detaljer.',
    },
    en: {
      loading: 'Loading matches …',
      error: 'Could not load the match overview.',
      filter: 'Show level',
      all: 'All levels',
      levels: { elite: 'Top division', div1: '1st division' },
      cats: { league: 'league', playoff: 'playoffs', cup: 'cup', europe: 'European cup', nordic: 'Nordic club championship', ranking: 'ranking', other: 'other' },
      tiles: { total: 'Total matches', elite: 'Top division', div1: '1st division', europe: 'European cup', seasons: 'Seasons' },
      chartTitle: 'Matches per season',
      cols: { season: 'Season', level: 'Level', team: 'Team', matches: 'Matches', details: 'Breakdown' },
      total: 'Total',
      matchesWord: 'matches',
      hint: 'Hover or tap a bar for details.',
    },
  }[lang];

  const num = (n) => n.toLocaleString(locale);
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LEVELS = ['elite', 'div1'];

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') node.className = v;
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

  const total = (r) => Object.values(r.counts).reduce((s, n) => s + n, 0);
  const details = (r) => Object.entries(r.counts).map(([k, n]) => `${n} ${T.cats[k]}`).join(', ');

  const status = el('p', { class: 'stats-status' }, T.loading);
  root.replaceChildren(status);

  fetch('/data/kamper.json')
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(render)
    .catch(() => {
      status.textContent = T.error;
    });

  function render(data) {
    const rows = data.rows.map((r) => ({ ...r, matches: total(r) }));
    let level = '';

    const select = el('select', { id: 'matches-level' }, el('option', { value: '' }, T.all));
    for (const l of LEVELS) select.append(el('option', { value: l }, T.levels[l]));
    select.addEventListener('change', () => {
      level = select.value;
      update();
    });
    const controls = el('div', { class: 'stats-controls' }, el('label', { for: 'matches-level' }, T.filter), select);

    const tiles = el('div', { class: 'stat-tiles' });
    const legend = el(
      'div',
      { class: 'chart-legend' },
      ...LEVELS.map((l) => el('span', {}, el('span', { class: `swatch swatch-${l}` }), T.levels[l]))
    );
    const chartWrap = el('div', { class: 'chart' });
    const chartInfo = el('p', { class: 'chart-info', 'aria-live': 'polite' }, T.hint);
    const chart = el('figure', { class: 'chart-figure' }, el('figcaption', {}, T.chartTitle), legend, chartWrap, chartInfo);

    const headRow = el('tr', {}, ...['season', 'level', 'team', 'matches', 'details'].map((k) => el('th', { scope: 'col', class: k === 'matches' ? 'num' : '' }, T.cols[k])));
    const tbody = el('tbody');
    const tfoot = el('tfoot');
    const table = el('table', { class: 'stats-table' }, el('thead', {}, headRow), tbody, tfoot);

    root.replaceChildren(controls, tiles, chart, el('div', { class: 'table-wrap' }, table));

    function update() {
      const visible = rows.filter((r) => !level || r.level === level);
      renderTiles(visible);
      renderChart(visible);
      renderTable(visible);
    }

    function renderTiles(visible) {
      const sum = (f) => visible.filter(f).reduce((s, r) => s + r.matches, 0);
      const values = {
        total: sum(() => true),
        elite: sum((r) => r.level === 'elite'),
        div1: sum((r) => r.level === 'div1'),
        europe: visible.reduce((s, r) => s + (r.counts.europe || 0), 0),
        seasons: new Set(visible.map((r) => r.season)).size,
      };
      tiles.replaceChildren(
        ...Object.keys(values).map((k) =>
          el('div', { class: 'tile' }, el('span', { class: 'tile-num' }, num(values[k])), el('span', { class: 'tile-label' }, T.tiles[k]))
        )
      );
    }

    function renderChart(visible) {
      const seasons = [...new Set(visible.map((r) => r.season))].sort();
      const bySeason = seasons.map((season) => {
        const parts = visible.filter((r) => r.season === season);
        return { season, parts, matches: parts.reduce((s, r) => s + r.matches, 0) };
      });
      const max = Math.max(1, ...bySeason.map((s) => s.matches));
      const barW = 40, gap = 14, top = 24, h = 180, bottom = 28;
      const width = Math.max(1, seasons.length) * (barW + gap) + gap;
      const s = svg('svg', { viewBox: `0 0 ${width} ${top + h + bottom}`, role: 'img', 'aria-label': T.chartTitle });
      s.append(svg('line', { x1: 0, x2: width, y1: top + h, y2: top + h, class: 'axis' }));

      bySeason.forEach((season, i) => {
        const x = gap + i * (barW + gap);
        const g = svg('g', { class: 'bar-group', tabindex: '0' });
        const title = svg('title');
        title.textContent = `${season.season}: ${num(season.matches)} ${T.matchesWord}`;
        g.append(title);

        // Stablede søyler: Eliteserien nederst, 1. divisjon over.
        let y = top + h;
        for (const l of LEVELS) {
          const n = season.parts.filter((r) => r.level === l).reduce((sum, r) => sum + r.matches, 0);
          if (!n) continue;
          const bh = (n / max) * h;
          y -= bh;
          g.append(svg('rect', { x, y, width: barW, height: bh, class: `bar bar-${l}` }));
        }
        const value = svg('text', { x: x + barW / 2, y: y - 6, class: 'bar-value' });
        value.textContent = num(season.matches);
        const label = svg('text', { x: x + barW / 2, y: top + h + 18, class: 'bar-label' });
        label.textContent = season.season;
        g.append(value, label);

        const show = () => {
          s.querySelectorAll('.bar-group.active').forEach((n) => n.classList.remove('active'));
          g.classList.add('active');
          const lines = season.parts.map((r) => `${r.team} (${T.levels[r.level]}): ${details(r)}`);
          chartInfo.textContent = `${season.season} – ${num(season.matches)} ${T.matchesWord}. ${lines.join(' · ')}`;
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
      const sorted = [...visible].sort((a, b) => b.season.localeCompare(a.season) || LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level));
      tbody.replaceChildren(
        ...sorted.map((r) =>
          el(
            'tr',
            {},
            el('td', {}, r.season),
            el('td', {}, T.levels[r.level]),
            el('td', {}, r.team),
            el('td', { class: 'num' }, num(r.matches)),
            el('td', { class: 'details' }, details(r))
          )
        )
      );
      tfoot.replaceChildren(
        el(
          'tr',
          {},
          el('th', { scope: 'row', colspan: '3' }, T.total),
          el('td', { class: 'num' }, num(visible.reduce((s, r) => s + r.matches, 0))),
          el('td', {}, '')
        )
      );
    }

    update();
  }
})();
