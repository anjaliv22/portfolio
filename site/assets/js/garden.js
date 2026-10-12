/*
  The garden (Fun mode).
  - Draws a watercolour-style scene in SVG (or uses your own painting, see data.js `art`).
  - Bunnies hop around their patch of lawn. Each bunny is one work experience.
  - Peonies are projects, the gardener is the About page, the library holds every project.
  - "Run model inference" plays a scripted detect -> classify -> segment pass and then tracks
    the bunnies live. Nothing here is a real model; the work it points to is.
*/
(() => {
  'use strict';

  const D = window.PORTFOLIO;
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1440, H = 900, HORIZON = 345;
  const svg = document.getElementById('scene');
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  // ---------- small helpers ----------
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };

  // perspective: how big things are at a given ground height, and where the path edges sit
  const depth = (y) => 0.25 + ((y - HORIZON) / 555) * 1.6;
  const pathL = (y) => 545 - ((y - HORIZON) / 555) * 145;
  const pathR = (y) => 575 + ((y - HORIZON) / 555) * 145;

  // ---------- palettes ----------
  const PEONY = {
    coral: ['#F29A86', '#F08C77', '#F5A994', '#EE8670', '#F7B8A6', '#FBD1C4'],
    blush: ['#F6C2CF', '#F3B5C5', '#F9D0DB', '#EFA9BB', '#FBDCE4', '#FFEFF3'],
    magenta: ['#C9437F', '#BD3874', '#D45A8E', '#B3306B', '#DE76A2', '#EC9DBE'],
    white: ['#F4EFE6', '#EDE6DA', '#FAF7F1', '#E6DDCD', '#FFFDF8', '#F6E3A6'],
    lilac: ['#CDB2E3', '#C3A5DD', '#D9C3EA', '#B897D6', '#E4D3F0', '#F1E8F8'],
  };
  const PEONY_DOT = { coral: '#F08C77', blush: '#F3B5C5', magenta: '#BD3874', white: '#E6DDCD', lilac: '#C3A5DD' };
  const HYD = {
    blue: ['#8FB3E3', '#A9C6EE', '#B9D0F2', '#7FA4DA', '#7C9FD8', '#9DB9E8', '#93B2E4', '#C7D9F5'],
    lilac: ['#B9A3DE', '#CDBCEB', '#D9CCF0', '#A58DD2', '#A893D4', '#C3B0E6', '#B49FDD', '#E2D8F4'],
    pink: ['#EBB1C6', '#F2C6D6', '#F6D4E0', '#E09DB6', '#E3A2BA', '#EDBACD', '#E8AAC1', '#F9E0E9'],
  };
  const hydColor = (ph, shade) => {
    const t = clamp((ph - 5) / 2.5, 0, 1);
    return t < 0.5 ? mix(HYD.blue[shade], HYD.lilac[shade], t * 2) : mix(HYD.lilac[shade], HYD.pink[shade], (t - 0.5) * 2);
  };
  const LEAF = ['#5E8B55', '#527E4A', '#6A9A5C', '#4F7B47', '#729E62'];

  // ---------- static background ----------
  svg.innerHTML = `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9E1EE"/><stop offset="1" stop-color="#F5EBD6"/></linearGradient>
    <linearGradient id="lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5CF94"/><stop offset=".5" stop-color="#9BC07C"/><stop offset="1" stop-color="#7FA866"/></linearGradient>
    <linearGradient id="pathG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EFE2C6"/><stop offset="1" stop-color="#D7BF96"/></linearGradient>
    <radialGradient id="vignette" cx=".42" cy=".45" r=".75"><stop offset=".6" stop-color="#3A2E1F" stop-opacity="0"/><stop offset="1" stop-color="#3A2E1F" stop-opacity=".22"/></radialGradient>
    <radialGradient id="doorGlow" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#FFE7A3"/><stop offset="1" stop-color="#F0B95A"/></radialGradient>
    <filter id="wc" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6"/><feGaussianBlur stdDeviation=".6"/></filter>
    <filter id="wcSoft" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="12"/><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="11"/><feColorMatrix type="saturate" values="0"/></filter>
    <symbol id="lavender" overflow="visible"><g stroke="#6F8F5E" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M-14 0 Q -16 -30 -20 -56"/><path d="M-5 0 Q -6 -34 -6 -64"/><path d="M5 0 Q 6 -32 9 -60"/><path d="M14 0 Q 17 -28 22 -50"/></g><g fill="#9B86C9"><ellipse cx="-20" cy="-52" rx="4" ry="9"/><ellipse cx="-6" cy="-60" rx="4" ry="10"/><ellipse cx="9" cy="-56" rx="4" ry="9"/><ellipse cx="22" cy="-46" rx="4" ry="8"/></g><g fill="#B3A2DA"><ellipse cx="-19" cy="-44" rx="3" ry="5"/><ellipse cx="-6" cy="-50" rx="3" ry="5"/><ellipse cx="9" cy="-47" rx="3" ry="5"/></g></symbol>
    <symbol id="foxglove" overflow="visible"><path d="M0 0 V -80" stroke="#5E8B55" stroke-width="3"/><g fill="#E9A3C3"><ellipse cx="-5" cy="-30" rx="6" ry="8"/><ellipse cx="5" cy="-40" rx="6" ry="8"/><ellipse cx="-5" cy="-50" rx="5.5" ry="7"/><ellipse cx="5" cy="-60" rx="5" ry="6.5"/><ellipse cx="-3" cy="-70" rx="4" ry="5"/></g><g fill="#D883AB"><circle cx="-5" cy="-28" r="2"/><circle cx="5" cy="-38" r="2"/><circle cx="-5" cy="-48" r="1.8"/></g><ellipse cx="-14" cy="-6" rx="14" ry="6" fill="#5E8B55"/><ellipse cx="14" cy="-6" rx="14" ry="6" fill="#527E4A"/></symbol>
    <symbol id="daisies" overflow="visible"><g stroke="#6A9A5C" stroke-width="1.6"><path d="M-16 0 V -6 M0 0 V -12 M16 0 V -4 M8 4 V 4 M-8 5 V 5"/></g><g fill="#FFFDF6"><circle cx="-16" cy="-6" r="6"/><circle cx="0" cy="-12" r="6.5"/><circle cx="16" cy="-4" r="6"/><circle cx="8" cy="4" r="5"/><circle cx="-8" cy="5" r="5"/></g><g fill="#F2C14E"><circle cx="-16" cy="-6" r="2.2"/><circle cx="0" cy="-12" r="2.4"/><circle cx="16" cy="-4" r="2.2"/><circle cx="8" cy="4" r="2"/><circle cx="-8" cy="5" r="2"/></g></symbol>
    <symbol id="fern" overflow="visible"><g fill="#4F7B47"><ellipse cx="-22" cy="-14" rx="24" ry="6" transform="rotate(-30 -22 -14)"/><ellipse cx="22" cy="-14" rx="24" ry="6" transform="rotate(30 22 -14)"/><ellipse cx="-10" cy="-24" rx="22" ry="5.5" transform="rotate(-65 -10 -24)"/><ellipse cx="10" cy="-24" rx="22" ry="5.5" transform="rotate(65 10 -24)"/><ellipse cx="0" cy="-28" rx="5.5" ry="24"/></g><g fill="#6A9A5C"><ellipse cx="-18" cy="-12" rx="16" ry="3"  transform="rotate(-30 -18 -12)"/><ellipse cx="18" cy="-12" rx="16" ry="3" transform="rotate(30 18 -12)"/></g></symbol>
    <symbol id="tuft" overflow="visible"><g stroke="#6F9A5A" stroke-width="1.6" stroke-linecap="round" fill="none"><path d="M-6 0 Q -8 -8 -12 -14"/><path d="M-2 0 Q -2 -10 -3 -18"/><path d="M2 0 Q 3 -9 6 -16"/><path d="M6 0 Q 9 -6 13 -11"/></g></symbol>
    <symbol id="allium" overflow="visible"><path d="M0 0 Q 2 -40 0 -76" stroke="#6A9A5C" stroke-width="2.4" fill="none"/><circle cx="0" cy="-82" r="12" fill="#A88BD8"/><g fill="#C7B3EC"><circle cx="-5" cy="-86" r="2.2"/><circle cx="4" cy="-84" r="2.2"/><circle cx="0" cy="-78" r="2.2"/><circle cx="-6" cy="-78" r="2"/><circle cx="6" cy="-77" r="2"/></g><ellipse cx="-8" cy="-4" rx="10" ry="4" fill="#5E8B55"/></symbol>
  </defs>
  <g id="bg">
    <rect width="1440" height="380" fill="url(#sky)"/>
    <g class="clouds" filter="url(#wcSoft)" fill="#FFFFFF" opacity=".75"><ellipse cx="220" cy="110" rx="110" ry="26"/><ellipse cx="270" cy="92" rx="60" ry="24"/><ellipse cx="860" cy="70" rx="120" ry="24"/><ellipse cx="920" cy="56" rx="60" ry="20"/><ellipse cx="1260" cy="130" rx="90" ry="20"/></g>
    <path d="M0 330 Q 280 270 600 318 T 1440 296 V 400 H 0 Z" fill="#B9CFAA" filter="url(#wcSoft)"/>
    <g filter="url(#wcSoft)">
      ${[[60, 318, 40, '#7FA36E'], [130, 306, 46, '#8DB07A'], [210, 322, 36, '#6E9460'], [290, 310, 44, '#86AA74'], [370, 326, 34, '#7FA36E'], [440, 318, 30, '#93B582'], [680, 318, 32, '#86AA74'], [750, 308, 42, '#6E9460'], [830, 320, 36, '#8DB07A'], [910, 304, 48, '#7FA36E'], [1000, 320, 38, '#93B582'], [1090, 308, 46, '#6E9460'], [1180, 322, 36, '#86AA74'], [1270, 306, 48, '#7FA36E'], [1370, 318, 42, '#8DB07A']].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}
    </g>
    <g filter="url(#wc)">
      <path d="M488 276 L 560 226 L 632 276 Z" fill="#8C6D58"/>
      <rect x="500" y="272" width="120" height="74" fill="#E7D9C2"/>
      <path d="M500 290 h120 M500 308 h120 M500 326 h120" stroke="#D3C2A6" stroke-width="1.5"/>
      <path d="M546 346 V 314 A 14 14 0 0 1 574 314 V 346 Z" fill="url(#doorGlow)"/>
      <path d="M512 306 V 294 A 8 8 0 0 1 528 294 V 306 Z" fill="#F7D98E"/><path d="M592 306 V 294 A 8 8 0 0 1 608 294 V 306 Z" fill="#F7D98E"/>
      <g fill="#6F9A5E"><circle cx="502" cy="282" r="9"/><circle cx="498" cy="298" r="10"/><circle cx="504" cy="316" r="9"/><circle cx="500" cy="334" r="10"/><circle cx="514" cy="276" r="7"/><circle cx="618" cy="300" r="8"/><circle cx="622" cy="318" r="9"/><circle cx="616" cy="336" r="8"/></g>
      <rect x="538" y="258" width="44" height="10" rx="2" fill="#F5EEDF"/>
    </g>
    <text x="560" y="266" text-anchor="middle" font-family="Newsreader, serif" font-size="8" font-weight="600" fill="#6B4E3A" letter-spacing="1.5">LIBRARY</text>
    <rect y="340" width="1440" height="560" fill="url(#lawn)" filter="url(#wcSoft)"/>
    <polygon points="545,345 575,345 720,900 400,900" fill="url(#pathG)" filter="url(#wc)"/>
    <g fill="#CDB487" opacity=".55" filter="url(#wc)"><ellipse cx="556" cy="420" rx="10" ry="3"/><ellipse cx="568" cy="520" rx="18" ry="5"/><ellipse cx="540" cy="640" rx="26" ry="7"/><ellipse cx="582" cy="770" rx="36" ry="9"/></g>
  </g>
  <g id="tufts"></g>
  <g id="plants" filter="url(#wc)"></g>
  <g id="gardener"></g>
  <g id="bunnies"></g>
  <g id="butterflies"></g>
  <g id="hits"></g>
  <g id="dets" pointer-events="none"><g id="masks"></g><g id="boxes"></g></g>
  <rect id="scan" pointer-events="none" x="0" y="0" width="1440" height="3" fill="#7CF3C8" opacity="0"/>
  <rect width="1440" height="900" fill="url(#vignette)" pointer-events="none"/>
  <rect width="1440" height="900" filter="url(#paper)" opacity=".10" style="mix-blend-mode:multiply" pointer-events="none"/>`;

  const L = (id) => document.getElementById(id);
  const layers = { tufts: L('tufts'), plants: L('plants'), gardener: L('gardener'), bunnies: L('bunnies'), butterflies: L('butterflies'), hits: L('hits'), masks: L('masks'), boxes: L('boxes') };

  if (D.art.background) {
    el('image', { href: D.art.background, x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'xMidYMid slice' }, L('bg'));
  }

  // ---------- plant drawing ----------
  function peonyMarkup(pal) {
    return `<ellipse cx="-24" cy="6" rx="20" ry="9" fill="#5A8650" transform="rotate(-22 -24 6)"/><ellipse cx="24" cy="8" rx="20" ry="9" fill="#4F7B47" transform="rotate(20 24 8)"/><path d="M0 8 V -8" stroke="#4F7B47" stroke-width="3"/>
      <g transform="translate(0 -20)"><ellipse cx="-16" cy="2" rx="16" ry="12" fill="${pal[0]}"/><ellipse cx="16" cy="2" rx="16" ry="12" fill="${pal[1]}"/><ellipse cx="0" cy="-10" rx="18" ry="13" fill="${pal[2]}"/><ellipse cx="0" cy="8" rx="20" ry="11" fill="${pal[3]}"/><circle cx="0" cy="-1" r="12" fill="${pal[4]}"/><circle cx="-3" cy="-4" r="6" fill="${pal[5]}"/></g>`;
  }
  const hydrangeas = [];
  function drawHydrangea(g, phOffset, big = 1) {
    el('ellipse', { cx: -26, cy: 16, rx: 22, ry: 11, fill: '#5E8B55', transform: 'rotate(-18 -26 16)' }, g);
    el('ellipse', { cx: 26, cy: 18, rx: 22, ry: 11, fill: '#527E4A', transform: 'rotate(16 26 18)' }, g);
    if (big > 1) el('ellipse', { cx: 0, cy: 22, rx: 30, ry: 10, fill: '#4F7B47' }, g);
    const head = el('g', { opacity: 0.93 }, g);
    const spots = [[0, -8, 30], [-16, -14, 10], [2, -24, 10], [18, -12, 10], [-6, 4, 10], [14, 6, 9], [-22, 2, 8], [-4, -10, 8]];
    const circles = spots.map(([cx, cy, r], i) => el('circle', { cx, cy, r, 'data-shade': i }, head));
    hydrangeas.push({ circles, phOffset });
  }
  function drawRose(g, r) {
    el('ellipse', { cx: 0, cy: -14, rx: 30, ry: 18, fill: LEAF[Math.floor(r * 5)] }, g);
    el('ellipse', { cx: -14, cy: -8, rx: 16, ry: 10, fill: '#527E4A' }, g);
    const cols = [['#D9606B', '#B8434F'], ['#F2A0A8', '#D97A85'], ['#F6C29A', '#E39C6E']][Math.floor(r * 3)];
    [[-12, -22], [8, -26], [16, -12], [-2, -10]].forEach(([x, y], i) => {
      if (i === 3 && r < 0.5) return;
      el('circle', { cx: x, cy: y, r: 7, fill: cols[0] }, g);
      el('path', { d: `M${x - 3} ${y} a3 3 0 1 1 3 3`, fill: 'none', stroke: cols[1], 'stroke-width': 1.4 }, g);
    });
  }
  function drawShrub(g, r) {
    const c1 = LEAF[Math.floor(r * 5)], c2 = LEAF[(Math.floor(r * 5) + 2) % 5];
    [[-22, -18, 22], [6, -26, 26], [26, -14, 18], [-4, -10, 20]].forEach(([x, y, rad], i) => el('circle', { cx: x, cy: y, r: rad, fill: i % 2 ? c1 : c2 }, g));
    el('circle', { cx: 2, cy: -34, r: 9, fill: '#8DB97A', opacity: 0.7 }, g);
  }

  // ---------- layout of the garden ----------
  const PEONY_SPOTS = [
    { x: 230, y: 560, s: 0.85 }, { x: 960, y: 660, s: 1.15 }, { x: 110, y: 700, s: 1.2 }, { x: 980, y: 470, s: 0.6 }, { x: 330, y: 800, s: 1.4 },
  ];
  const BUNNY_HOMES = {
    graze: { x: [300, 425], y: [612, 684] },
    honest: { x: [835, 1000], y: [760, 842] },
    martinrea1: { x: [404, 490], y: [452, 500] },
    martinrea2: { x: [632, 724], y: [438, 482] },
    electrium: { x: [138, 262], y: [770, 846] },
  };
  const GARDENER = { x: 770, y: 650 };
  const DECOYS = [
    { id: 'rock', x: 452, y: 604, as: 'bunny', conf: 0.31, note: 'a rock' },
    { id: 'mushroom', x: 1046, y: 566, as: 'peony', conf: 0.24, note: 'a mushroom' },
  ];
  const WATERED = { x: 872, y: 602, s: 0.95 };

  const peonies = D.projects.map((p, i) => ({ p, i, ...PEONY_SPOTS[i % PEONY_SPOTS.length] }));

  function blocked(x, y, s) {
    if (x > pathL(y) - 16 * s && x < pathR(y) + 16 * s) return true;
    if (y < 362) return true;
    for (const pe of peonies) if (Math.hypot(x - pe.x, (y - pe.y) * 1.4) < 40 * pe.s + 16 * s) return true;
    if (x > 715 && x < 905 && y > 420 && y < 676) return true;
    for (const k in BUNNY_HOMES) {
      const h = BUNNY_HOMES[k], pad = 34 * s;
      if (x > h.x[0] - pad && x < h.x[1] + pad && y > h.y[0] - 12 && y < h.y[1] + 30 * s) return true;
    }
    for (const d of DECOYS) if (Math.hypot(x - d.x, y - d.y) < 34 * s) return true;
    if (Math.hypot(x - WATERED.x, y - WATERED.y) < 44) return true;
    return false;
  }

  const items = [];
  (function generate() {
    const r = rng(20261010);
    const kinds = [['hydrangea', 25], ['lavender', 15], ['daisies', 12], ['foxglove', 9], ['rose', 12], ['shrub', 10], ['fern', 9], ['allium', 8]];
    const total = kinds.reduce((a, k) => a + k[1], 0);
    const pick = () => { let v = r() * total; for (const [k, w] of kinds) { if ((v -= w) < 0) return k; } return 'shrub'; };
    let tries = 0;
    while (items.length < 190 && tries < 9000) {
      tries++;
      const y = 364 + r() * 560;
      const x = -50 + r() * 1540;
      const s = depth(y) * (0.85 + r() * 0.3);
      if (blocked(x, y, s)) continue;
      items.push({ kind: pick(), x, y, s, v: r() });
    }
    // lawn texture
    for (let i = 0; i < 140; i++) {
      const y = 380 + r() * 520, x = r() * W, s = depth(y);
      if (x > pathL(y) - 4 && x < pathR(y) + 4) continue;
      el('use', { href: '#tuft', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})` }, layers.tufts);
    }
  })();
  items.push({ kind: 'hydrangea', ...WATERED, v: 0.2, watered: true });
  DECOYS.forEach((d) => items.push({ kind: d.id, x: d.x, y: d.y, s: depth(d.y), v: 0.5 }));
  peonies.forEach((pe) => items.push({ kind: 'peony', x: pe.x, y: pe.y, s: pe.s, peony: pe }));
  items.sort((a, b) => a.y - b.y);

  const hydDetections = [];
  for (const it of items) {
    const g = el('g', { transform: `translate(${it.x.toFixed(1)} ${it.y.toFixed(1)}) scale(${it.s.toFixed(3)})` }, layers.plants);
    switch (it.kind) {
      case 'hydrangea': drawHydrangea(g, (it.v - 0.5) * 1.2, it.watered ? 2 : 1); if (it.watered || (hydDetections.length < 3 && it.y > 470 && it.y < 760 && it.x > 0 && it.x < 1060 && it.v > 0.6)) hydDetections.push(it); break;
      case 'lavender': case 'foxglove': case 'daisies': case 'fern': case 'allium': el('use', { href: '#' + it.kind }, g); break;
      case 'rose': drawRose(g, it.v); break;
      case 'shrub': drawShrub(g, it.v); break;
      case 'rock': g.innerHTML = '<ellipse cx="0" cy="-2" rx="20" ry="5" fill="#5F7F4C" opacity=".35"/><path d="M-18 0 Q -20 -16 -4 -20 Q 14 -22 18 -6 Q 20 0 -18 0 Z" fill="#A8A296"/><path d="M-8 -14 Q 2 -18 10 -12" stroke="#C9C3B6" stroke-width="3" fill="none"/>'; break;
      case 'mushroom': g.innerHTML = '<rect x="-4" y="-16" width="8" height="16" rx="3" fill="#F3EAD8"/><path d="M-16 -14 Q 0 -34 16 -14 Z" fill="#D9605A"/><circle cx="-6" cy="-20" r="2.4" fill="#FFF"/><circle cx="5" cy="-23" r="2" fill="#FFF"/><circle cx="9" cy="-17" r="1.6" fill="#FFF"/>'; break;
      case 'peony': {
        const art = D.art.peonies[it.peony.p.id];
        if (art) el('image', { href: art.src, x: -art.w / 2, y: -art.h, width: art.w, height: art.h }, g);
        else g.innerHTML = peonyMarkup(PEONY[it.peony.p.color] || PEONY.coral);
        it.peony.g = g;
        break;
      }
    }
  }

  // soil pH recolours every hydrangea
  let soilPH = 5.5;
  function paintHydrangeas() {
    for (const h of hydrangeas) {
      const ph = soilPH + h.phOffset;
      h.circles.forEach((c) => c.setAttribute('fill', hydColor(ph, +c.dataset.shade)));
    }
  }
  paintHydrangeas();

  // ---------- the gardener (you) ----------
  const gardenerMarkup = `
    <g fill="#17110F"><circle cx="-12" cy="-182" r="10"/><circle cx="2" cy="-192" r="11"/><circle cx="15" cy="-186" r="9"/><circle cx="-18" cy="-168" r="10"/><circle cx="-20" cy="-152" r="10"/><circle cx="-18" cy="-136" r="9"/><circle cx="-12" cy="-124" r="8"/><circle cx="-6" cy="-160" r="10"/><circle cx="-4" cy="-142" r="9"/></g>
    <path d="M-18 -95 L 18 -95 L 16 -2 L 4 -2 L 0 -52 L -4 -2 L -16 -2 Z" fill="#5C7FA8"/>
    <ellipse cx="-10" cy="0" rx="10" ry="5" fill="#6B4A35"/><ellipse cx="10" cy="0" rx="10" ry="5" fill="#6B4A35"/>
    <path d="M-20 -150 Q 0 -158 20 -150 L 18 -94 L -18 -94 Z" fill="#F3E9DA"/>
    <rect x="-13" y="-128" width="26" height="34" rx="3" fill="#5C7FA8"/><path d="M-12 -128 L -16 -150 M12 -128 L 16 -150" stroke="#5C7FA8" stroke-width="4"/>
    <g class="arm"><path d="M16 -146 Q 30 -134 44 -122" fill="none" stroke="#7A4E35" stroke-width="9" stroke-linecap="round"/>
    <path d="M-16 -146 Q -14 -122 26 -114" fill="none" stroke="#7A4E35" stroke-width="9" stroke-linecap="round"/>
    <path d="M40 -128 L 70 -128 L 66 -102 L 44 -102 Z" fill="#8FB3A6"/><path d="M68 -122 L 98 -134" stroke="#8FB3A6" stroke-width="5" stroke-linecap="round"/><path d="M46 -128 Q 56 -146 66 -128" fill="none" stroke="#7A9E90" stroke-width="3.5"/>
    <circle cx="44" cy="-122" r="6" fill="#B9D7A8"/><circle cx="27" cy="-114" r="6" fill="#B9D7A8"/></g>
    <rect x="-4" y="-160" width="10" height="10" fill="#7A4E35"/>
    <ellipse cx="3" cy="-174" rx="15" ry="17" fill="#7A4E35"/>
    <g fill="#17110F"><circle cx="-8" cy="-190" r="8"/><circle cx="4" cy="-194" r="8"/><circle cx="14" cy="-190" r="6"/><circle cx="-13" cy="-178" r="7"/></g>
    <g fill="none" stroke="#211813" stroke-width="1.6"><circle cx="8" cy="-175" r="4.6"/><circle cx="18.5" cy="-175" r="4.2"/><path d="M12.6 -175 h 1.8 M3.4 -176 l -6 -1"/></g>
    <path d="M10 -164 q 4 3 8 0" fill="none" stroke="#4A2C1E" stroke-width="1.4" stroke-linecap="round"/>`;
  {
    const g = el('g', { transform: `translate(${GARDENER.x} ${GARDENER.y})` }, layers.gardener);
    if (D.art.gardener) {
      const a = D.art.gardener;
      el('image', { href: a.src, x: -a.w / 2, y: -a.h, width: a.w, height: a.h }, g);
    } else {
      const inner = el('g', { filter: 'url(#wc)' }, g);
      inner.innerHTML = gardenerMarkup;
      el('path', { class: 'water', d: 'M98 -134 Q 120 -126 126 -96', fill: 'none', stroke: '#9FD3F0', 'stroke-width': 3, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' }, g);
    }
  }

  // ---------- bunnies ----------
  const FUR = { graze: '#A88B70', honest: '#B9A28A', martinrea1: '#8E735C', martinrea2: '#C4B3A0', electrium: '#9C8068' };
  const PROPS = {
    laptop: '<rect x="30" y="-22" width="22" height="14" rx="2" fill="#E7C9D3"/><rect x="33" y="-19" width="16" height="8" fill="#FFF4F7"/><rect x="28" y="-9" width="26" height="4" rx="1.5" fill="#CDB0BB"/>',
    clipboard: '<rect x="32" y="-36" width="16" height="22" rx="2" fill="#F3EAD8"/><rect x="36" y="-38" width="8" height="4" rx="1" fill="#8C6D58"/><path d="M35 -22 l3 -4 l3 2 l4 -6" fill="none" stroke="#C9575F" stroke-width="1.6"/>',
    magnifier: '<circle cx="40" cy="-30" r="8" fill="#E8F4FA" fill-opacity=".6" stroke="#7A5C3E" stroke-width="3"/><path d="M46 -24 l 9 9" stroke="#7A5C3E" stroke-width="4" stroke-linecap="round"/>',
    camera: '<rect x="32" y="-34" width="20" height="13" rx="2" fill="#4A4A55"/><rect x="36" y="-37" width="6" height="3" fill="#4A4A55"/><circle cx="42" cy="-27.5" r="4" fill="#9CC3E6"/>',
    wrench: '<path d="M30 -10 L 46 -28" stroke="#8D99A6" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="-31" r="4.5" fill="none" stroke="#8D99A6" stroke-width="3"/>',
  };
  function bunnyMarkup(id, prop) {
    const f = FUR[id] || '#A88B70', f2 = mix(f, '#FFFFFF', 0.28), f3 = mix(f, '#000000', 0.12);
    return `<circle cx="-24" cy="-24" r="8" fill="#FBF7EF"/><ellipse cx="0" cy="-22" rx="26" ry="20" fill="${f}"/><ellipse cx="4" cy="-16" rx="15" ry="11" fill="${f2}"/><ellipse cx="-12" cy="-6" rx="12" ry="5" fill="${f3}"/>
      <g class="ears"><ellipse cx="14" cy="-70" rx="5.5" ry="17" fill="${f}" transform="rotate(-10 14 -70)"/><ellipse cx="25" cy="-68" rx="5.5" ry="16" fill="${f2}" transform="rotate(12 25 -68)"/><ellipse cx="14" cy="-70" rx="2.6" ry="12" fill="#E8B9AE" transform="rotate(-10 14 -70)"/><ellipse cx="25" cy="-68" rx="2.6" ry="11" fill="#E8B9AE" transform="rotate(12 25 -68)"/></g>
      <g class="head"><circle cx="20" cy="-44" r="14" fill="${f2}"/><circle cx="26" cy="-46" r="2.2" fill="#2E2219"/><circle cx="26.7" cy="-46.8" r=".7" fill="#FFFFFF"/><ellipse cx="33" cy="-40" rx="2.4" ry="1.8" fill="#D98E8E"/><ellipse cx="22" cy="-38" rx="5" ry="3.5" fill="${mix(f2, '#FFFFFF', 0.3)}"/></g>
      ${PROPS[prop] || ''}`;
  }

  const bunnies = D.experience.map((exp, i) => {
    const home = BUNNY_HOMES[exp.id] || Object.values(BUNNY_HOMES)[i % 5];
    const r = rng(i * 97 + 13);
    const x = lerp(home.x[0], home.x[1], r()), y = lerp(home.y[0], home.y[1], r());
    const g = el('g', {}, layers.bunnies);
    const shadow = el('ellipse', { cx: 0, cy: -3, rx: 28, ry: 5, fill: '#4F6B3F', opacity: 0.3 }, g);
    const lift = el('g', {}, g);
    const flip = el('g', {}, lift);
    const art = D.art.bunnies[exp.id];
    if (art) el('image', { href: art.src, x: -art.w / 2, y: -art.h, width: art.w, height: art.h }, flip);
    else flip.innerHTML = bunnyMarkup(exp.id, exp.prop);
    return {
      exp, i, home, r, g, shadow, lift, flip, ears: flip.querySelector('.ears'), head: flip.querySelector('.head'),
      x, y, dir: r() < 0.5 ? 1 : -1, state: 'rest', nextAt: performance.now() + 400 + r() * 2200,
      hopsLeft: 0, from: null, to: null, t0: 0, dur: 430, liftY: 0, twitchAt: performance.now() + r() * 3000, twitchUntil: 0, nibbleUntil: 0, paused: false,
    };
  });
  const bunnyScale = (b) => depth(b.y) * 0.9;
  function bunnyBox(b) {
    const s = bunnyScale(b);
    const [l, rgt] = b.dir > 0 ? [-34, 58] : [-58, 34];
    return { x: b.x + l * s, y: b.y - b.liftY - 90 * s, w: (rgt - l) * s, h: 90 * s + b.liftY };
  }
  function startHop(b, now) {
    const s = bunnyScale(b);
    let tx, ty, tries = 0;
    do {
      tx = lerp(b.home.x[0], b.home.x[1], b.r());
      ty = lerp(b.home.y[0], b.home.y[1], b.r());
      tries++;
    } while (Math.hypot(tx - b.x, ty - b.y) < 22 && tries < 8);
    const dx = tx - b.x, dy = ty - b.y, dist = Math.hypot(dx, dy), step = Math.min(dist, 40 * s + 10);
    b.from = { x: b.x, y: b.y };
    b.to = { x: b.x + (dx / dist) * step, y: b.y + (dy / dist) * step };
    if (Math.abs(dx) > 2) b.dir = dx > 0 ? 1 : -1;
    b.t0 = now; b.dur = 380 + b.r() * 120; b.state = 'hop';
  }
  function updateBunny(b, now) {
    if (!b.paused && !reduced()) {
      if (b.state === 'rest' && now >= b.nextAt) { b.hopsLeft = 1 + Math.floor(b.r() * 3); startHop(b, now); }
      if (b.state === 'hop') {
        const k = clamp((now - b.t0) / b.dur, 0, 1);
        b.x = lerp(b.from.x, b.to.x, k); b.y = lerp(b.from.y, b.to.y, k);
        b.liftY = Math.sin(Math.PI * k) * 16 * bunnyScale(b);
        if (k >= 1) {
          b.liftY = 0;
          if (--b.hopsLeft > 0) startHop(b, now);
          else { b.state = 'rest'; b.nextAt = now + 900 + b.r() * 2800; if (b.r() < 0.5) b.nibbleUntil = now + 900; }
        }
      }
      if (now > b.twitchAt) { b.twitchUntil = now + 170; b.twitchAt = now + 1400 + b.r() * 4200; }
    } else {
      b.liftY = 0;
    }
    const s = bunnyScale(b);
    const squash = b.state === 'hop' ? 1 + 0.07 * Math.sin(2 * Math.PI * clamp((now - b.t0) / b.dur, 0, 1)) : 1;
    b.g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`);
    b.shadow.setAttribute('transform', `scale(${s.toFixed(3)} ${s.toFixed(3)})`);
    b.shadow.setAttribute('opacity', (0.3 - b.liftY / (90 * s)).toFixed(2));
    b.lift.setAttribute('transform', `translate(0 ${(-b.liftY).toFixed(1)})`);
    b.flip.setAttribute('transform', `scale(${(b.dir * s).toFixed(3)} ${(s * squash).toFixed(3)})`);
    if (b.ears) b.ears.setAttribute('transform', now < b.twitchUntil ? 'rotate(-9 20 -56)' : '');
    if (b.head) b.head.setAttribute('transform', now < b.nibbleUntil && !b.paused ? `translate(0 ${(2 + Math.sin(now / 60) * 1.5).toFixed(1)})` : '');
  }

  // ---------- butterflies ----------
  const butterflies = [
    { cx: 640, cy: 430, ax: 60, ay: 26, sp: 0.00045, ph: 0, c: ['#F6D776', '#F2CB5C'] },
    { cx: 300, cy: 470, ax: 80, ay: 30, sp: 0.00038, ph: 2, c: ['#BFD8F6', '#A9C6EE'] },
  ].map((b) => {
    const g = el('g', {}, layers.butterflies);
    b.l = el('ellipse', { cx: -5, cy: 0, rx: 7, ry: 5, fill: b.c[0], transform: 'rotate(-20 -5 0)' }, g);
    b.r = el('ellipse', { cx: 5, cy: 0, rx: 7, ry: 5, fill: b.c[1], transform: 'rotate(20 5 0)' }, g);
    el('rect', { x: -1, y: -5, width: 2, height: 10, rx: 1, fill: '#5A4636' }, g);
    b.g = g; b.x = b.cx; b.y = b.cy; b.s = depth(b.cy) * 0.9;
    return b;
  });
  function updateButterflies(now) {
    for (const b of butterflies) {
      const t = reduced() ? b.ph : now * b.sp + b.ph;
      b.x = b.cx + Math.sin(t * 2) * b.ax;
      b.y = b.cy + Math.sin(t * 3.1) * b.ay;
      const flap = reduced() ? 1 : 0.45 + Math.abs(Math.sin(now / 90)) * 0.55;
      b.g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) scale(${(b.s * flap).toFixed(3)} ${b.s.toFixed(3)})`);
    }
  }

  // ---------- detections ----------
  const SHORT = { graze: 'Graze AI', honest: 'Honest', martinrea1: 'Martinrea I', martinrea2: 'Martinrea II', electrium: 'Electrium' };
  const COLORS = { bunny: '#FF6A4D', peony: '#E0218A', person: '#1E9C8C', building: '#E8A33D', bg: '#FFFFFF' };
  const BUNNY_CONF = [0.97, 0.96, 0.91, 0.93, 0.98], PEONY_CONF = [0.93, 0.94, 0.92, 0.9, 0.95];

  const dets = [];
  bunnies.forEach((b, i) => dets.push({
    key: 'bunny-' + b.exp.id, kind: 'bunny', ref: b, conf: BUNNY_CONF[i % 5], color: COLORS.bunny,
    label: () => `bunny · ${SHORT[b.exp.id] || b.exp.org} · ${fmt(det(i).live)}`,
    box: () => bunnyBox(b),
    mask: () => { const s = bunnyScale(b); return { t: 'ellipse', cx: b.x + 6 * s * b.dir, cy: b.y - b.liftY - 34 * s, rx: 32 * s, ry: 34 * s }; },
  }));
  peonies.forEach((pe, i) => dets.push({
    key: 'peony-' + pe.p.id, kind: 'peony', ref: pe, conf: PEONY_CONF[i % 5], color: COLORS.peony,
    label: () => `peony · ${pe.p.short} · ${fmt(det(bunnies.length + i).live)}`,
    box: () => ({ x: pe.x - 38 * pe.s, y: pe.y - 56 * pe.s, w: 76 * pe.s, h: 66 * pe.s }),
    mask: () => ({ t: 'circle', cx: pe.x, cy: pe.y - 20 * pe.s, r: 26 * pe.s }),
  }));
  dets.push({ key: 'person', kind: 'person', conf: 0.99, color: COLORS.person, label: () => 'person · Anjali · 0.99',
    box: () => ({ x: GARDENER.x - 30, y: GARDENER.y - 206, w: 160, h: 212 }),
    mask: () => ({ t: 'rect', x: GARDENER.x - 24, y: GARDENER.y - 202, w: 100, h: 204, rx: 30 }) });
  dets.push({ key: 'library', kind: 'building', conf: 0.95, color: COLORS.building, label: () => 'building · library · 0.95',
    box: () => ({ x: 488, y: 226, w: 144, h: 122 }), mask: () => ({ t: 'rect', x: 498, y: 236, w: 124, h: 110, rx: 4 }) });
  hydDetections.forEach((h, i) => dets.push({ key: 'hyd-' + i, kind: 'bg', conf: [0.88, 0.84, 0.79, 0.86][i % 4], color: COLORS.bg,
    label: () => `hydrangea ${fmt(0.88 - i * 0.03)}`, box: () => ({ x: h.x - 34 * h.s, y: h.y - 40 * h.s, w: 68 * h.s, h: 66 * h.s }) }));
  butterflies.forEach((b, i) => dets.push({ key: 'fly-' + i, kind: 'bg', conf: [0.44, 0.41][i], color: COLORS.bg,
    label: () => `butterfly ${[0.44, 0.41][i]}`, box: () => ({ x: b.x - 13 * b.s, y: b.y - 9 * b.s, w: 26 * b.s, h: 18 * b.s }) }));
  DECOYS.forEach((d) => { const s = depth(d.y); dets.push({ key: 'decoy-' + d.id, kind: 'decoy', decoy: d, conf: d.conf, color: d.as === 'bunny' ? COLORS.bunny : COLORS.peony,
    label: () => `${d.as} ${d.conf.toFixed(2)}?`, box: () => ({ x: d.x - 22 * s, y: d.y - 30 * s, w: 44 * s, h: 32 * s }) }); });
  function det(i) { return dets[i]; }
  const fmt = (v) => v.toFixed(2);
  dets.forEach((d) => { d.live = d.conf; });

  // SVG elements for each detection, created once
  dets.forEach((d) => {
    const isBg = d.kind === 'bg';
    d.rect = el('rect', { fill: 'none', stroke: d.color, 'stroke-width': isBg ? 1 : 2, 'stroke-dasharray': isBg || d.kind === 'decoy' ? '4 3' : '', 'vector-effect': 'non-scaling-stroke', opacity: 0 }, layers.boxes);
    d.tag = el('g', { opacity: 0 }, layers.boxes);
    d.tagBg = el('rect', { height: 16, fill: isBg ? 'none' : d.color }, d.tag);
    d.tagText = el('text', { x: 5, y: 11.5, 'font-family': 'JetBrains Mono, monospace', 'font-size': 10.5, 'font-weight': 700, fill: isBg ? '#FFFFFF' : (d.kind === 'building' ? '#1E2622' : '#FFFFFF') }, d.tag);
    if (isBg) d.tagText.setAttribute('style', 'paint-order:stroke;stroke:#1E2622;stroke-width:2.5px;stroke-opacity:.5');
    if (d.mask) d.maskEl = el(d.mask().t, { fill: d.color, opacity: 0 }, layers.masks);
  });

  // ---------- interactive hit areas ----------
  function addHit(kind, ref, label, onBox) {
    const g = el('g', { class: 'hit', tabindex: 0, role: 'button', 'aria-label': label, 'data-kind': kind }, layers.hits);
    const r = el('rect', { fill: '#FFFFFF', 'fill-opacity': 0, rx: 8 }, g);
    const ring = el('rect', { class: 'focus-ring', rx: 8 }, g);
    const h = { g, r, ring, kind, ref, onBox };
    g.addEventListener('pointerenter', () => hoverOn(h));
    g.addEventListener('pointerleave', () => hoverOff(h));
    g.addEventListener('focus', () => hoverOn(h));
    g.addEventListener('blur', () => hoverOff(h));
    g.addEventListener('click', () => activate(h));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(h); } });
    return h;
  }
  const hits = [];
  bunnies.forEach((b) => hits.push(addHit('bunny', b, `${b.exp.org}, ${b.exp.role}. Open model results`, () => bunnyBox(b))));
  peonies.forEach((pe) => hits.push(addHit('peony', pe, `${pe.p.name}. Run inference on this peony`, () => ({ x: pe.x - 40 * pe.s, y: pe.y - 58 * pe.s, w: 80 * pe.s, h: 70 * pe.s }))));
  hits.push(addHit('person', null, 'Anjali, the gardener. Open the model card about me', () => ({ x: GARDENER.x - 30, y: GARDENER.y - 206, w: 160, h: 212 })));
  hits.push(addHit('library', null, 'The library. Browse every project', () => ({ x: 488, y: 226, w: 144, h: 122 })));
  function placeHits() {
    for (const h of hits) {
      const b = h.onBox(), pad = 6;
      for (const r of [h.r, h.ring]) { r.setAttribute('x', b.x - pad); r.setAttribute('y', b.y - pad); r.setAttribute('width', b.w + pad * 2); r.setAttribute('height', b.h + pad * 2); }
    }
  }

  // ---------- inference state ----------
  const state = { running: false, t0: 0, threshold: 0.5, masks: true, hoverKey: null, focusKey: null, focusUntil: 0, frame: 1200, fps: 30, lastFrame: 0, latency: 21, stageShown: '' };
  const STAGE = { detect: 900, classify: 1500, segment: 2100 };
  const runBtn = L('runBtn'), runLabel = L('runLabel'), runIcon = L('runIcon'), stagesEl = L('stages');
  const live = L('live'), liveText = L('liveText'), scan = L('scan');
  const panelBody = L('panelBody'), objCount = L('objCount');

  function keyFor(h) {
    if (h.kind === 'bunny') return 'bunny-' + h.ref.exp.id;
    if (h.kind === 'peony') return 'peony-' + h.ref.p.id;
    return h.kind === 'person' ? 'person' : 'library';
  }

  function startInference() {
    state.running = true;
    state.t0 = reduced() ? performance.now() - STAGE.segment - 10 : performance.now();
    state.stageShown = '';
    runBtn.classList.add('on');
    runLabel.textContent = 'Stop inference';
    runIcon.setAttribute('d', 'M5 5 H15 V15 H5 Z');
    live.classList.add('on');
    renderPanelRunning();
  }
  function stopInference() {
    state.running = false;
    runBtn.classList.remove('on');
    runLabel.textContent = 'Run model inference';
    runIcon.setAttribute('d', 'M6 4 L16 10 L6 16 Z');
    live.classList.remove('on');
    liveText.textContent = 'MODEL IDLE · CAM 01';
    stagesEl.querySelectorAll('li').forEach((li) => li.classList.remove('done', 'active'));
    scan.setAttribute('opacity', 0);
    renderPanelIdle();
  }
  runBtn.addEventListener('click', () => (state.running ? stopInference() : startInference()));

  function visible(d) { return d.conf >= state.threshold; }

  // right edge of the garden that isn't covered by the results panel, in scene units
  let sceneRight = W;
  function measureScene() {
    const m = svg.getScreenCTM();
    if (!m) return;
    const panelEl = document.getElementById('panel');
    const covered = window.innerWidth > 900 ? panelEl.getBoundingClientRect().left : window.innerWidth;
    sceneRight = new DOMPoint(covered - 8, 0).matrixTransform(m.inverse()).x;
  }
  window.addEventListener('resize', measureScene);

  function drawDetections(now) {
    const t = state.running ? now - state.t0 : -1;
    const scanY = state.running ? lerp(HORIZON - 30, H, clamp(t / STAGE.detect, 0, 1)) : -1;
    if (state.running && t < STAGE.detect) { scan.setAttribute('opacity', 0.85); scan.setAttribute('y', scanY.toFixed(1)); } else scan.setAttribute('opacity', 0);
    // pipeline chips
    if (state.running) {
      const stage = t < STAGE.detect ? 'detect' : t < STAGE.classify ? 'classify' : t < STAGE.segment ? 'segment' : 'done';
      if (stage !== state.stageShown) {
        state.stageShown = stage;
        const order = ['detect', 'classify', 'segment'];
        stagesEl.querySelectorAll('li').forEach((li) => {
          const idx = order.indexOf(li.dataset.stage), cur = order.indexOf(stage);
          li.classList.toggle('done', stage === 'done' || idx < cur);
          li.classList.toggle('active', idx === cur);
        });
        if (stage === 'done') renderPanelRunning();
      }
    }
    for (const d of dets) {
      const b = d.box();
      const focused = state.focusKey === d.key && now < state.focusUntil;
      const isHover = state.hoverKey === d.key;
      let show = false, labelOn = false, maskOn = false;
      if (state.running && visible(d)) {
        show = t >= STAGE.detect || b.y + b.h / 2 < scanY;
        labelOn = t >= STAGE.detect;
        maskOn = state.masks && t >= STAGE.classify && d.kind !== 'bg' && d.kind !== 'decoy';
      }
      if (focused) { show = true; labelOn = true; maskOn = state.masks; }
      d.rect.setAttribute('x', b.x.toFixed(1)); d.rect.setAttribute('y', b.y.toFixed(1));
      d.rect.setAttribute('width', Math.max(4, b.w).toFixed(1)); d.rect.setAttribute('height', Math.max(4, b.h).toFixed(1));
      d.rect.setAttribute('opacity', show ? 1 : 0);
      d.rect.setAttribute('stroke-width', (isHover || focused) && d.kind !== 'bg' ? 3.5 : d.kind === 'bg' ? 1 : 2);
      const txt = d.label();
      if (d.tagText.textContent !== txt) { d.tagText.textContent = txt; d.tagBg.setAttribute('width', txt.length * 6.4 + 10); }
      const tagW = txt.length * 6.4 + 10, tagX = b.x + tagW > sceneRight ? b.x + b.w - tagW : b.x;
      d.tag.setAttribute('transform', `translate(${tagX.toFixed(1)} ${(b.y - 17).toFixed(1)})`);
      d.tag.setAttribute('opacity', show && labelOn ? 1 : 0);
      if (d.maskEl) {
        const m = d.mask();
        for (const k of ['cx', 'cy', 'rx', 'ry', 'r', 'x', 'y', 'rx']) if (m[k] !== undefined) d.maskEl.setAttribute(k, (+m[k]).toFixed(1));
        if (m.t === 'rect') { d.maskEl.setAttribute('width', m.w); d.maskEl.setAttribute('height', m.h); }
        d.maskEl.setAttribute('opacity', show && maskOn ? (isHover ? 0.34 : 0.22) : 0);
      }
    }
  }

  // ---------- results panel ----------
  const ICON_SW = (c, round) => `<span class="sw" style="background:${c};${round ? 'border-radius:50%;' : ''}"></span>`;
  function renderPanelIdle() {
    objCount.textContent = 'idle';
    panelBody.innerHTML = `<div class="idle">
      <p>The model is idle. Press <b>Run model inference</b> to see what is growing in this garden.</p>
      <button class="run" type="button" data-run><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4 L16 10 L6 16 Z"></path></svg><span>Run model inference</span></button>
      <p class="small">Or just click anything in the garden. Prefer a plain page? <a href="index.html">Switch to Pro mode</a>.</p>
    </div>`;
    updateSummary();
  }
  function renderPanelRunning() {
    const t = performance.now() - state.t0;
    if (t < STAGE.segment) {
      objCount.textContent = 'running…';
      panelBody.innerHTML = '<div class="idle"><p>Scanning the garden…</p><p class="small">detect → classify → segment</p></div>';
      return;
    }
    const shown = dets.filter((d) => visible(d) && d.kind !== 'bg');
    objCount.textContent = `${dets.filter(visible).length} objects`;
    const rows = [];
    const bunnyRows = bunnies.map((b, i) => ({ d: dets[i], b })).filter((r) => visible(r.d));
    if (bunnyRows.length) {
      rows.push(`<h3 class="group-title">WORK · BUNNY × ${bunnyRows.length}</h3>`);
      bunnyRows.forEach(({ d, b }) => rows.push(`<button class="row" type="button" data-open="bunny" data-i="${b.i}" data-key="${d.key}" style="animation-delay:${rows.length * 40}ms">${ICON_SW(COLORS.bunny)}<span class="cf">${fmt(d.conf)}</span><span class="nm">${b.exp.org.startsWith('Martinrea') ? 'Martinrea · ' + (b.exp.id === 'martinrea1' ? 'Vision App' : 'Vision Eng') : esc(b.exp.org)}</span><span class="yr">${esc(b.exp.year)}</span></button>`));
    }
    const peonyRows = peonies.map((pe, i) => ({ d: dets[bunnies.length + i], pe })).filter((r) => visible(r.d));
    if (peonyRows.length) {
      rows.push(`<h3 class="group-title">PROJECTS · PEONY × ${peonyRows.length}</h3>`);
      peonyRows.forEach(({ d, pe }) => rows.push(`<button class="row" type="button" data-open="peony" data-i="${pe.i}" data-key="${d.key}" style="animation-delay:${rows.length * 40}ms">${ICON_SW(PEONY_DOT[pe.p.color] || COLORS.peony, true)}<span class="cf">${fmt(d.conf)}</span><span class="nm">${esc(pe.p.name)}</span><span class="yr">${pe.p.kind === 'Hardware' ? 'HW' : 'SW'}</span></button>`));
    }
    rows.push('<h3 class="group-title">ALSO SPOTTED</h3>');
    rows.push(`<button class="row" type="button" data-open="person" data-key="person">${ICON_SW(COLORS.person)}<span class="cf">0.99</span><span class="nm">person · <b>Anjali</b>, say hi</span><span class="yr"></span></button>`);
    rows.push(`<button class="row" type="button" data-open="library" data-key="library">${ICON_SW(COLORS.building)}<span class="cf">0.95</span><span class="nm">building · <b>the library</b></span><span class="yr"></span></button>`);
    const decoys = dets.filter((d) => d.kind === 'decoy' && visible(d));
    if (decoys.length) {
      rows.push('<h3 class="group-title">LOW CONFIDENCE</h3>');
      decoys.forEach((d) => rows.push(`<div class="row" style="cursor:default">${ICON_SW(d.color)}<span class="cf">${fmt(d.conf)}</span><span class="nm">"${d.decoy.as}" (it's ${d.decoy.note})</span><span class="yr"></span></div>`));
    }
    panelBody.innerHTML = rows.join('');
    if (!shown.length) panelBody.innerHTML = '<div class="idle"><p>Nothing clears this confidence threshold. Try lowering it in Model settings.</p></div>';
  }
  panelBody.addEventListener('click', (e) => {
    if (e.target.closest('[data-run]')) return startInference();
    const row = e.target.closest('[data-open]');
    if (row) openFrom(row.dataset.open, +row.dataset.i);
  });
  panelBody.addEventListener('pointerover', (e) => {
    const row = e.target.closest('[data-key]');
    setHover(row ? row.dataset.key : null);
  });
  panelBody.addEventListener('pointerleave', () => setHover(null));

  function setHover(key) {
    state.hoverKey = key;
    bunnies.forEach((b) => { b.paused = key === 'bunny-' + b.exp.id; });
    panelBody.querySelectorAll('.row').forEach((r) => r.classList.toggle('hl', r.dataset.key === key));
  }

  // settings
  const confIn = L('conf'), confOut = L('confOut'), masksIn = L('masks'), phIn = L('ph'), phOut = L('phOut');
  function updateSummary() {
    L('settingsSummary').textContent = `conf ≥ ${state.threshold.toFixed(2)} · masks ${state.masks ? 'on' : 'off'} · pH ${soilPH.toFixed(1)}`;
  }
  confIn.addEventListener('input', () => { state.threshold = +confIn.value; confOut.textContent = state.threshold.toFixed(2); updateSummary(); if (state.running) renderPanelRunning(); });
  masksIn.addEventListener('change', () => { state.masks = masksIn.checked; updateSummary(); });
  phIn.addEventListener('input', () => { soilPH = +phIn.value; phOut.textContent = soilPH.toFixed(1); paintHydrangeas(); updateSummary(); });

  // mobile panel toggle
  const panel = L('panel'), panelToggle = L('panelToggle');
  panelToggle.addEventListener('click', () => {
    const open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    panelToggle.setAttribute('aria-expanded', String(open));
    panelToggle.textContent = open ? 'Close results' : 'Model results';
  });

  // ---------- hover card ----------
  const card = L('hovercard');
  function screenBox(b) {
    const m = svg.getScreenCTM(), stage = L('stage').getBoundingClientRect();
    const p1 = new DOMPoint(b.x, b.y).matrixTransform(m), p2 = new DOMPoint(b.x + b.w, b.y + b.h).matrixTransform(m);
    return { left: p1.x - stage.left, top: p1.y - stage.top, right: p2.x - stage.left, bottom: p2.y - stage.top, sw: stage.width, sh: stage.height };
  }
  function hoverOn(h) {
    setHover(keyFor(h));
    const d = dets.find((x) => x.key === keyFor(h));
    const on = state.running;
    let k, t, desc, go, c, cInk;
    if (h.kind === 'bunny') {
      const e = h.ref.exp;
      k = on ? `detection · bunny · conf ${fmt(d.conf)}` : 'something is hopping here…';
      t = `${e.org} · ${e.year}`; desc = e.headline; go = 'Click to view model results →'; c = COLORS.bunny; cInk = 'var(--bunny-ink)';
    } else if (h.kind === 'peony') {
      const p = h.ref.p;
      k = on ? `detection · peony · conf ${fmt(d.conf)}` : `peony · ${p.kind.toLowerCase()} project`;
      t = p.name; desc = p.tagline; go = 'Click to run inference →'; c = COLORS.peony; cInk = 'var(--peony-ink)';
    } else if (h.kind === 'person') {
      k = on ? 'detection · person · conf 0.99' : 'the gardener';
      t = 'Anjali, that\'s me'; desc = 'Say hi and read my model card.'; go = 'Click to say hi →'; c = COLORS.person; cInk = 'var(--person-ink)';
    } else {
      k = on ? 'detection · building · conf 0.95' : 'at the end of the path';
      t = 'The library'; desc = 'Every project I have built, one book each.'; go = 'Click to go inside →'; c = COLORS.building; cInk = 'var(--building-ink)';
    }
    card.style.setProperty('--c', c); card.style.setProperty('--c-ink', cInk);
    card.innerHTML = `<span class="k">${esc(k)}</span><span class="t">${esc(t)}</span><span class="d">${esc(desc)}</span><span class="go">${go}</span>`;
    const sb = screenBox(h.onBox());
    card.hidden = false;
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let left = sb.right + 12, top = sb.top - 10;
    if (left + cw > sb.sw - (window.innerWidth > 900 ? 360 : 12)) left = sb.left - cw - 12;
    left = clamp(left, 12, sb.sw - cw - 12); top = clamp(top, 12, sb.sh - ch - 12);
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }
  function hoverOff() { setHover(null); card.hidden = true; }

  // ---------- activation ----------
  function flash(key, ms = 650) { state.focusKey = key; state.focusUntil = performance.now() + ms; }
  function activate(h) {
    if (performance.now() - dragEndedAt < 120) return;
    card.hidden = true;
    if (h.kind === 'bunny') { flash(keyFor(h)); setTimeout(() => openExperience(h.ref.i), state.running || reduced() ? 0 : 450); }
    else if (h.kind === 'peony') inspectPeony(h.ref.i);
    else if (h.kind === 'person') { flash('person'); setTimeout(openAbout, state.running || reduced() ? 0 : 350); }
    else openLibrary();
  }
  function openFrom(kind, i) {
    if (kind === 'bunny') openExperience(i);
    else if (kind === 'peony') inspectPeony(i);
    else if (kind === 'person') openAbout();
    else openLibrary();
  }

  // camera: the full garden on wide screens; on tall phone screens, a window you can drag sideways
  let vb = { x: 0, y: 0, w: W, h: H }, homeVB = { ...vb };
  const applyVB = () => svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
  const panMode = () => window.innerWidth / window.innerHeight < 0.9;
  function computeHome() {
    if (panMode()) {
      const w = Math.min(W, H * (window.innerWidth / window.innerHeight));
      homeVB = { x: clamp(640 - w / 2, 0, W - w), y: 0, w, h: H };
    } else homeVB = { x: 0, y: 0, w: W, h: H };
    if (overlay.hidden) { vb = { ...homeVB }; applyVB(); }
    measureScene();
  }
  window.addEventListener('resize', computeHome);
  let drag = null, dragEndedAt = 0;
  svg.addEventListener('pointerdown', (e) => { if (panMode()) drag = { x: e.clientX, vx: vb.x, moved: false }; });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6) drag.moved = true;
    if (drag.moved) { vb.x = clamp(drag.vx - dx * (vb.w / window.innerWidth), 0, W - vb.w); homeVB.x = vb.x; applyVB(); card.hidden = true; }
  });
  window.addEventListener('pointerup', () => { if (drag && drag.moved) dragEndedAt = performance.now(); drag = null; });
  function zoomTo(target, ms, done) {
    const from = { ...vb };
    if (reduced()) { vb = target; svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); return done && done(); }
    const t0 = performance.now();
    (function step(now) {
      const k = ease(clamp((now - t0) / ms, 0, 1));
      vb = { x: lerp(from.x, target.x, k), y: lerp(from.y, target.y, k), w: lerp(from.w, target.w, k), h: lerp(from.h, target.h, k) };
      svg.setAttribute('viewBox', `${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  }
  const zoomHome = () => zoomTo({ ...homeVB }, 500);
  function inspectPeony(i) {
    const pe = peonies[i];
    const w = homeVB.w * 0.4, h = w * (homeVB.h / homeVB.w);
    flash('peony-' + pe.p.id, 1600);
    zoomTo({ x: clamp(pe.x - w / 2, 0, W - w), y: clamp(pe.y - 20 * pe.s - h / 2, 0, H - h), w, h }, 650, () => setTimeout(() => openProject(i, { onClose: zoomHome }), reduced() ? 0 : 450));
  }

  // ---------- windows ----------
  const overlay = L('overlay'), win = L('window');
  let lastFocus = null, onCloseCb = null;
  function openWindow(html, { onClose } = {}) {
    if (overlay.hidden) lastFocus = document.activeElement;
    onCloseCb = onClose || null;
    win.innerHTML = html;
    overlay.hidden = false;
    const close = win.querySelector('[data-close]');
    if (close) close.focus();
    win.querySelector('.win-body') && (win.querySelector('.win-body').scrollTop = 0);
  }
  function closeWindow() {
    overlay.hidden = true;
    win.innerHTML = '';
    const cb = onCloseCb; onCloseCb = null;
    if (cb) cb();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWindow(); });
  document.addEventListener('keydown', (e) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') closeWindow();
    if (e.key === 'Tab') {
      const f = [...win.querySelectorAll('button, a[href], [tabindex="0"]')].filter((x) => !x.disabled);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  const bar = (file) => `<div class="win-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="file">${esc(file)}</span><button class="close" type="button" data-close>Close · Esc</button></div>`;
  const json = (obj) => '{\n' + Object.entries(obj).map(([k, v]) => `  <span class="k">"${esc(k)}"</span>: ${typeof v === 'number' ? `<span class="n">${v}</span>` : `<span class="s">"${esc(v)}"</span>`}`).join(',\n') + '\n}';
  const markLast = (s) => { const m = esc(s).match(/^(.*?)(\S+ \S+?)([.!?]?)$/); return m ? `${m[1]}<mark>${m[2]}</mark>${m[3]}` : esc(s); };
  const chips = (list) => `<div class="chips">${list.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;

  function cropSvg(inner, box, color, label, maskEl) {
    return `<svg viewBox="${box.vb}" aria-hidden="true"><rect x="-200" y="-200" width="400" height="400" fill="#A9C98A"/>
      <g fill="none" stroke="#7FA866" stroke-width="2" stroke-linecap="round"><path d="M-60 -6 q -2 -8 -6 -14 M-40 2 q 0 -10 -2 -16 M44 -2 q 3 -9 6 -15 M60 4 q 2 -8 5 -12"/></g>
      ${maskEl}<g filter="url(#wcCrop)">${inner}</g>
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="none" stroke="${color}" stroke-width="2.5"/>
      <rect x="${box.x}" y="${box.y - 14}" width="${label.length * 5.6 + 8}" height="14" fill="${color}"/>
      <text x="${box.x + 4}" y="${box.y - 3.5}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="700" fill="#FFFFFF">${esc(label)}</text>
      <defs><filter id="wcCrop"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter></defs></svg>`;
  }

  function openExperience(i) {
    const n = D.experience.length;
    i = (i + n) % n;
    const e = D.experience[i], d = dets[i];
    const art = D.art.bunnies[e.id];
    const inner = art ? `<image href="${esc(art.src)}" x="${-art.w / 2}" y="${-art.h}" width="${art.w}" height="${art.h}"/>` : bunnyMarkup(e.id, e.prop);
    const crop = cropSvg(inner, { vb: '-70 -112 140 140', x: -38, y: -94, w: 98, h: 96 }, COLORS.bunny, `bunny · ${fmt(d.conf)}`,
      `<ellipse cx="8" cy="-36" rx="34" ry="36" fill="${COLORS.bunny}" opacity=".18"/>`);
    const html = `${bar(`model_results / bunny_${String(i + 1).padStart(2, '0')}.json`)}
      <div class="win-body">
        <section class="det-col" aria-label="Detection">
          <div class="crop">${crop}</div>
          <pre class="json">${json({ class: 'bunny', track_id: i + 1, confidence: d.conf, org: e.org, role: e.role, dates: e.dates, location: e.location })}</pre>
        </section>
        <article class="story">
          <p class="meta">${esc(e.dates)} · ${esc(e.location)}</p>
          <h2 id="winTitle">${markLast(e.headline)}</h2>
          <p class="role">${esc(e.role)} · ${esc(e.org)}</p>
          <p class="intro">${esc(e.intro)}</p>
          ${e.stats.length ? `<div class="stats">${e.stats.map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>` : ''}
          <h3 class="sec">WHAT I BUILT</h3>
          <div>${e.contributions.map((c) => `<div class="contrib"><h3>${esc(c.title)}</h3><p>${esc(c.body)}</p></div>`).join('')}</div>
          ${chips(e.tools)}
        </article>
      </div>
      <div class="win-foot">
        <button class="btn" type="button" data-step="-1">← ${esc(SHORT[D.experience[(i - 1 + n) % n].id] || 'Previous')}</button>
        <span class="pos">bunny ${i + 1} of ${n}</span>
        <button class="btn primary" type="button" data-step="1">${esc(SHORT[D.experience[(i + 1) % n].id] || 'Next')} →</button>
      </div>`;
    openWindow(html);
    win.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => openExperience(i + +b.dataset.step)));
    win.querySelector('[data-close]').addEventListener('click', closeWindow);
  }

  function openProject(i, opts = {}) {
    const n = D.projects.length;
    i = (i + n) % n;
    const p = D.projects[i], d = dets[bunnies.length + i];
    const art = D.art.peonies[p.id];
    const inner = art ? `<image href="${esc(art.src)}" x="${-art.w / 2}" y="${-art.h}" width="${art.w}" height="${art.h}"/>` : peonyMarkup(PEONY[p.color] || PEONY.coral);
    const crop = cropSvg(`<g transform="scale(1.6) translate(0 18)">${inner}</g>`, { vb: '-70 -95 140 140', x: -62, y: -78, w: 124, h: 108 }, COLORS.peony, `peony · ${fmt(d.conf)}`,
      `<circle cx="0" cy="-3" r="42" fill="${COLORS.peony}" opacity=".16"/>`);
    const html = `${bar(`inference / peony_${p.id}.json`)}
      <div class="win-body">
        <section class="det-col" aria-label="Inference result">
          <div class="crop">${crop}</div>
          <pre class="json">${json({ class: 'peony', variety: p.color, project: p.name, type: p.kind.toLowerCase(), date: p.date, confidence: d.conf })}</pre>
        </section>
        <article class="story">
          <p class="meta">${esc(p.kind)} project · ${esc(p.date)}</p>
          <h2 id="winTitle">${esc(p.name)}</h2>
          <p class="intro"><i>${esc(p.tagline)}</i></p>
          <h3 class="sec">WHAT I BUILT</h3>
          <ul class="points">${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          ${chips(p.tools)}
        </article>
      </div>
      <div class="win-foot">
        ${opts.fromLibrary ? '<button class="btn" type="button" data-lib>← Back to the library</button>' : `<button class="btn" type="button" data-step="-1">← ${esc(D.projects[(i - 1 + n) % n].short)}</button>`}
        <span class="pos">peony ${i + 1} of ${n}</span>
        <button class="btn primary" type="button" data-step="1">${esc(D.projects[(i + 1) % n].short)} →</button>
      </div>`;
    openWindow(html, { onClose: opts.onClose });
    win.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => openProject(i + +b.dataset.step, opts)));
    const lib = win.querySelector('[data-lib]');
    if (lib) lib.addEventListener('click', () => { onCloseCb = null; openLibrary(); });
    win.querySelector('[data-close]').addEventListener('click', closeWindow);
  }

  function openAbout() {
    const P = D.person;
    const crop = cropSvg(`<g transform="translate(-30 10) scale(.6)">${gardenerMarkup}</g>`, { vb: '-70 -120 140 140', x: -52, y: -116, w: 94, h: 130 }, COLORS.person, 'person · 0.99', '');
    const rows = [
      ['Model', 'Anjali v2028'],
      ['Trained at', `${P.school}. BASc in Computer Engineering, Mechatronics Option, Class of ${P.classOf}.`],
      ['Specialties', P.specialties.join(', ')],
      ['Coursework', P.coursework.join(', ')],
      ...Object.entries(P.skills).map(([k, v]) => [k, v.join(', ')]),
    ];
    if (P.funFact) rows.push(['Fun fact', P.funFact]);
    const html = `${bar('MODEL_CARD.md')}
      <div class="win-body">
        <section class="det-col" aria-label="Detection"><div class="crop">${crop}</div>
          <pre class="json">${json({ class: 'person', name: P.name, confidence: 0.99, status: 'watering the hydrangeas' })}</pre></section>
        <article class="story">
          <p class="meta">model card</p>
          <h2 id="winTitle">Hi, I'm ${esc(P.name.split(' ')[0])}.</h2>
          <p class="intro">I study Computer Engineering at the ${esc(P.school)}, and I like work where software meets hardware: firmware that drives motors, vision systems on factory floors, and the full-stack tools around them.</p>
          <dl class="card-table">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}
            <dt>Contact</dt><dd><span id="emailText">${esc(P.email)}</span><button class="copy" type="button" data-copy>Copy</button><br>
            <a href="${esc(P.github)}" target="_blank" rel="noopener">GitHub ↗</a> · <a href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>${P.resumeUrl ? ` · <a href="${esc(P.resumeUrl)}" target="_blank" rel="noopener">Résumé ↗</a>` : ''}</dd>
          </dl>
        </article>
      </div>
      <div class="win-foot"><a class="btn" href="index.html">Read the Pro version</a><span class="pos"></span><button class="btn primary" type="button" data-garden>Back to the garden</button></div>`;
    openWindow(html);
    win.querySelector('[data-close]').addEventListener('click', closeWindow);
    win.querySelector('[data-garden]').addEventListener('click', closeWindow);
    win.querySelector('[data-copy]').addEventListener('click', (ev) => {
      const btn = ev.currentTarget;
      const done = () => { btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = 'Copy'), 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(P.email).then(done, () => selectText());
      else selectText();
      function selectText() { const r = document.createRange(); r.selectNodeContents(L('emailText')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    });
  }

  function openLibrary() {
    const html = `${bar('the_library /')}
      <div class="win-body" style="grid-template-columns:1fr">
        <div class="shelf-wrap">
          <div><p class="meta">the library</p><h2 id="winTitle" style="margin:4px 0 0;font-size:clamp(28px,3vw,40px);font-weight:500">Every project, one book each.</h2></div>
          <div class="shelf" role="list">${D.projects.map((p, i) => {
            const pal = PEONY[p.color] || PEONY.coral, dark = p.color === 'magenta';
            return `<button class="book" type="button" role="listitem" data-book="${i}" style="height:${250 - (i % 3) * 22}px;background:${pal[1]};color:${dark ? '#FFFFFF' : '#23302A'}"><span>${esc(p.short)}<small>${esc(p.kind)} · ${esc(p.date.split(' ').pop())}</small></span></button>`;
          }).join('')}</div>
          <p class="small">Pick a book to open it. The peonies in the garden open the same projects.</p>
        </div>
      </div>
      <div class="win-foot"><span class="pos">${D.projects.length} books</span><button class="btn primary" type="button" data-garden>Back to the garden</button></div>`;
    openWindow(html);
    win.querySelector('[data-close]').addEventListener('click', closeWindow);
    win.querySelector('[data-garden]').addEventListener('click', closeWindow);
    win.querySelectorAll('[data-book]').forEach((b) => b.addEventListener('click', () => openProject(+b.dataset.book, { fromLibrary: true })));
  }

  // ---------- main loop ----------
  function tick(now) {
    bunnies.forEach((b) => updateBunny(b, now));
    updateButterflies(now);
    placeHits();
    if (state.running || now < state.focusUntil) drawDetections(now);
    else if (state.lastDrawn !== false) { drawDetections(now); }
    state.lastDrawn = state.running || now < state.focusUntil;
    if (state.running) {
      const dt = now - (state.lastFrame || now);
      state.lastFrame = now;
      if (dt > 0) state.fps = lerp(state.fps, 1000 / dt, 0.05);
      state.frame++;
      if (state.frame % 8 === 0) {
        state.latency = 18 + Math.random() * 6;
        dets.forEach((d) => { if (d.kind === 'bunny' || d.kind === 'peony') d.live = clamp(d.conf + (Math.random() - 0.5) * 0.02, 0, 0.99); });
        liveText.textContent = `LIVE INFERENCE · frame ${String(state.frame).padStart(5, '0')} · 30 FPS · ${state.latency.toFixed(0)} ms · garden-det v3`;
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- boot ----------
  L('name').textContent = D.person.name;
  L('tagline').textContent = D.person.tagline;
  renderPanelIdle();
  computeHome();
  requestAnimationFrame(tick);
})();
