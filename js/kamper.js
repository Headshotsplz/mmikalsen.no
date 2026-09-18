// Kampoversikt: leser /data/kamper.json og tegner nøkkeltall, graf over
// kamper per sesong og en tabell. Lagene slås sammen per klubb
// (f.eks. Førde VBK + Førde VBK 2 = Førde).
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
      filter: 'Vis klubb',
      all: 'Alle klubber',
      levels: { elite: 'Eliteserien', div1: '1. divisjon' },
      cats: { league: 'serie', playoff: 'sluttspill', cup: 'cup', europe: 'Europacup', nordic: 'nordisk klubbmesterskap', ranking: 'ranking', other: 'andre' },
      totalTile: 'Kamper totalt',
      europeTile: 'Europacup',
      chartTitle: 'Kamper per sesong',
      cols: { season: 'Sesong', club: 'Klubb', matches: 'Kamper', details: 'Fordeling' },
      total: 'Totalt',
      matchesWord: 'kamper',
      hint: 'Hold over eller trykk på en søyle for detaljer.',
    },
    en: {
      loading: 'Loading matches …',
      error: 'Could not load the match overview.',
      filter: 'Show club',
      all: 'All clubs',
      levels: { elite: 'Top division', div1: '1st division' },
      cats: { league: 'league', playoff: 'playoffs', cup: 'cup', europe: 'European cup', nordic: 'Nordic club championship', ranking: 'ranking', other: 'other' },
      totalTile: 'Total matches',
      europeTile: 'European cup',
      chartTitle: 'Matches per season',
      cols: { season: 'Season', club: 'Club', matches: 'Matches', details: 'Breakdown' },
      total: 'Total',
      matchesWord: 'matches',
      hint: 'Hover or tap a bar for details.',
    },
  }[lang];

  const num = (n) => n.toLocaleString(locale);
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // "Førde VBK 2" -> "Førde", "OSI 2" -> "OSI", "NTNUI 2" -> "NTNUI"
  const clubOf = (team) => team.replace(/\s+2$/, '').replace(/\s+(VBK|Volleyballklubb)$/i, '');

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

  const countsText = (counts) => Object.entries(counts).map(([k, n]) => `${n} ${T.cats[k]}`).join(', ');

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
    // Én rad per sesong og klubb, med nivåene (Eliteserien / 1. divisjon) som fordeling.
    const grouped = new Map();
    for (const r of data.rows) {
      const club = clubOf(r.team);
      const key = `${r.season}|${club}`;
      const g = grouped.get(key) || { season: r.season, club, matches: 0, europe: 0, parts: [] };
      const n = Object.values(r.counts).reduce((s, x) => s + x, 0);
      g.matches += n;
      g.europe += r.counts.europe || 0;
      g.parts.push(`${T.levels[r.level]}: ${countsText(r.counts)}`);
      grouped.set(key, g);
    }
    const rows = [...grouped.values()];
    const clubs = [...new Set(rows.sort((a, b) => a.season.localeCompare(b.season)).map((r) => r.club))];
    let club = '';

    const select = el('select', { id: 'matches-club' }, el('option', { value: '' }, T.all));
    for (const c of clubs) select.append(el('option', { value: c }, c));
    select.addEventListener('change', () => {
      club = select.value;
      update();
    });
    const controls = el('div', { class: 'stats-controls' }, el('label', { for: 'matches-club' }, T.filter), select);

    const tiles = el('div', { class: 'stat-tiles' });
    const legend = el(
      'div',
      { class: 'chart-legend' },
      ...clubs.map((c, i) => el('span', {}, el('span', { class: `swatch swatch-club-${i}` }), c))
    );
    const chartWrap = el('div', { class: 'chart chart-stacked' });
    const chartInfo = el('p', { class: 'chart-info', 'aria-live': 'polite' }, T.hint);
    const chart = el('figure', { class: 'chart-figure' }, el('figcaption', {}, T.chartTitle), legend, chartWrap, chartInfo);

    const headRow = el('tr', {}, ...['season', 'club', 'matches', 'details'].map((k) => el('th', { scope: 'col', class: k === 'matches' ? 'num' : '' }, T.cols[k])));
    const tbody = el('tbody');
    const tfoot = el('tfoot');
    const table = el('table', { class: 'stats-table' }, el('thead', {}, headRow), tbody, tfoot);

    root.replaceChildren(controls, tiles, chart, el('div', { class: 'table-wrap' }, table));

    function update() {
      const visible = rows.filter((r) => !club || r.club === club);
      renderTiles(visible);
      renderChart(visible);
      renderTable(visible);
    }

    function renderTiles(visible) {
      const sum = (list) => list.reduce((s, r) => s + r.matches, 0);
      const tile = (value, label) => el('div', { class: 'tile' }, el('span', { class: 'tile-num' }, num(value)), el('span', { class: 'tile-label' }, label));
      tiles.replaceChildren(
        tile(sum(visible), T.totalTile),
        ...clubs.filter((c) => !club || c === club).map((c) => tile(sum(visible.filter((r) => r.club === c)), c)),
        tile(visible.reduce((s, r) => s + r.europe, 0), T.europeTile)
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

        // Stablede søyler, én farge per klubb.
        let y = top + h;
        clubs.forEach((c, ci) => {
          const n = season.parts.filter((r) => r.club === c).reduce((sum, r) => sum + r.matches, 0);
          if (!n) return;
          const bh = (n / max) * h;
          y -= bh;
          g.append(svg('rect', { x, y, width: barW, height: bh, class: `bar bar-club-${ci}` }));
        });
        const value = svg('text', { x: x + barW / 2, y: y - 6, class: 'bar-value' });
        value.textContent = num(season.matches);
        const label = svg('text', { x: x + barW / 2, y: top + h + 18, class: 'bar-label' });
        label.textContent = season.season;
        g.append(value, label);

        const show = () => {
          s.querySelectorAll('.bar-group.active').forEach((n) => n.classList.remove('active'));
          g.classList.add('active');
          const lines = season.parts.map((r) => `${r.club} – ${r.parts.join('; ')}`);
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
      const sorted = [...visible].sort((a, b) => b.season.localeCompare(a.season) || clubs.indexOf(a.club) - clubs.indexOf(b.club));
      tbody.replaceChildren(
        ...sorted.map((r) =>
          el(
            'tr',
            {},
            el('td', {}, r.season),
            el('td', {}, r.club),
            el('td', { class: 'num' }, num(r.matches)),
            el('td', { class: 'details' }, r.parts.join('; '))
          )
        )
      );
      tfoot.replaceChildren(
        el(
          'tr',
          {},
          el('th', { scope: 'row', colspan: '2' }, T.total),
          el('td', { class: 'num' }, num(visible.reduce((s, r) => s + r.matches, 0))),
          el('td', {}, '')
        )
      );
    }

    update();
  }
})();
