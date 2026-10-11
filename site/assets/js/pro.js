/* Pro mode: renders data.js into one scrolling page with sticky side tabs and block-stack tech stacks. */
(() => {
  'use strict';
  const D = window.PORTFOLIO, P = D.person;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const berry = (cls = 'berry') => `<svg class="${cls}" aria-hidden="true"><use href="#berry"/></svg>`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- blocks ----------
  const PALETTES = [
    { front: '#F4CDD4', top: '#FAE3E7', side: '#E2ABB7', text: '#6B2C3A' }, // rose
    { front: '#D3E3CC', top: '#E8F1E3', side: '#B2C9A9', text: '#2F4A2E' }, // sage
    { front: '#FFFFFF', top: '#FBF4F2', side: '#EBDCDA', text: '#4A3A3D' }, // white
    { front: '#EFA2AC', top: '#F6C3CA', side: '#D9828E', text: '#5A1E2B' }, // strawberry
    { front: '#E3EDDC', top: '#F1F6ED', side: '#C6D7BD', text: '#355234' }, // pale sage
  ];
  const EDGE = '#7C6A6E';
  // One isometric block: front face with the label, a top face and a right side face.
  function blockShape(label, pal, { h = 34, d = 12, size = 13.5, minW = 92 } = {}) {
    const w = Math.max(minW, Math.round(label.length * size * 0.56 + 30));
    const svg = `<polygon points="0,${d} ${d},0 ${w + d},0 ${w},${d}" fill="${pal.top}" stroke="${EDGE}" stroke-width="1.1" stroke-linejoin="round"/>
      <polygon points="${w},${d} ${w + d},0 ${w + d},${h} ${w},${h + d}" fill="${pal.side}" stroke="${EDGE}" stroke-width="1.1" stroke-linejoin="round"/>
      <rect x="0" y="${d}" width="${w}" height="${h}" fill="${pal.front}" stroke="${EDGE}" stroke-width="1.1"/>
      <text x="${w / 2}" y="${d + h / 2 + size * 0.36}" text-anchor="middle" font-size="${size}" fill="${pal.text}">${esc(label)}</text>`;
    return { w: w + d, h: h + d, svg };
  }
  function block(label, pal, opts, style = '') {
    const b = blockShape(label, pal, opts);
    return `<svg class="block" width="${b.w + 2}" height="${b.h + 2}" viewBox="-1 -1 ${b.w + 2} ${b.h + 2}" style="${style}" role="img" aria-label="${esc(label)}">${b.svg}</svg>`;
  }
  const OFFSETS = [0, 9, -7, 12, -4, 8, -10];
  const stack = (tools, start = 0) => `<div class="blocks">${tools.map((t, i) => block(t, PALETTES[(start + i) % PALETTES.length], {}, `--x:${OFFSETS[i % OFFSETS.length]}px`)).join('')}</div><div class="plate" aria-hidden="true"></div>`;
  const shelf = (items, start = 0, small = false) => `<div class="shelf-row">${items.map((t, i) => block(t, PALETTES[(start + i) % PALETTES.length], small ? { h: 26, d: 8, size: 12.5, minW: 54 } : { h: 30, d: 10, size: 13, minW: 60 })).join('')}</div>`;

  // ---------- icons ----------
  const ICON = {
    github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.48 2.48 0 1 1-4.96 0 2.48 2.48 0 0 1 4.96 0zM.5 8h4v15h-4zm7.5 0h3.8v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.13V23h-4v-7.1c0-1.7-.03-3.88-2.37-3.88-2.37 0-2.73 1.85-2.73 3.76V23h-4z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.6V17h16V7.6l-8 5.2zM5.6 7 12 11.2 18.4 7z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l6 6v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm7 1.5V9h5.5zM8 13h8v1.6H8zm0 4h8v1.6H8z"/></svg>',
  };

  // ---------- nav ----------
  const first = P.name.split(' ')[0];
  $('brandName').textContent = P.name;
  const jobs = [...D.experience].reverse(); // newest first, like the resume
  const shortOrg = (e) => (e.org.startsWith('Martinrea') ? `Martinrea · ${e.id === 'martinrea1' ? 'Vision App' : 'Vision Eng'}` : e.org);
  $('expSubList').innerHTML = jobs.map((e) => `<li><a href="#exp-${e.id}" data-job="${e.id}">${esc(shortOrg(e))}</a></li>`).join('');
  $('navLinks').innerHTML = [
    `<a class="icon-link" href="mailto:${esc(P.email)}" aria-label="Email ${esc(P.email)}">${ICON.mail}</a>`,
    `<a class="icon-link" href="${esc(P.github)}" target="_blank" rel="noopener" aria-label="GitHub">${ICON.github}</a>`,
    `<a class="icon-link" href="${esc(P.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${ICON.linkedin}</a>`,
    P.resumeUrl && `<a class="icon-link" href="${esc(P.resumeUrl)}" target="_blank" rel="noopener" aria-label="Résumé">${ICON.doc}</a>`,
  ].filter(Boolean).join('');

  // ---------- about ----------
  const heroArt = (() => {
    const b1 = blockShape('firmware', PALETTES[0], { h: 40, d: 14, size: 16, minW: 140 });
    const b2 = blockShape('vision', PALETTES[1], { h: 40, d: 14, size: 16, minW: 124 });
    const b3 = blockShape('full-stack', PALETTES[2], { h: 40, d: 14, size: 16, minW: 132 });
    const berryAt = (x, y, s, r = 0) => `<use href="#berry" width="${32 * s}" height="${36 * s}" x="${x}" y="${y}" transform="rotate(${r} ${x + 16 * s} ${y + 18 * s})"/>`;
    return `<svg viewBox="0 0 400 400" role="img" aria-label="A little stack of three blocks labelled firmware, vision and full-stack, with strawberries">
      <circle cx="210" cy="200" r="170" fill="#F8E5E8"/>
      <circle cx="300" cy="300" r="70" fill="#E7F0E3"/>
      <g fill="#F2C6CE"><circle cx="70" cy="90" r="5"/><circle cx="340" cy="90" r="4"/><circle cx="60" cy="300" r="3.5"/></g>
      <path d="M330 60 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill="#E9AEBA"/>
      <path d="M86 236 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#A9C3A2"/>
      <ellipse cx="200" cy="300" rx="110" ry="12" fill="#B5506A" opacity=".12"/>
      <g transform="translate(${200 - b1.w / 2} ${300 - b1.h})">${b1.svg}</g>
      <g transform="translate(${208 - b2.w / 2} ${300 - b1.h - b2.h + 14})">${b2.svg}</g>
      <g transform="translate(${194 - b3.w / 2} ${300 - b1.h - b2.h - b3.h + 28})">${b3.svg}</g>
      ${berryAt(282, 248, 1.6, 12)}${berryAt(80, 262, 1.25, -14)}${berryAt(300, 140, 1.1, 20)}
    </svg>`;
  })();
  $('about').innerHTML = `
    <div>
      <p class="eyebrow">${berry()} Computer Engineering · ${esc(P.school)} · ${P.classOf}</p>
      <h1 id="aboutTitle">Hi, I'm <em>${esc(first)}</em>.</h1>
      <p class="lead">I build where software meets hardware: motor-control firmware, computer vision on factory floors, and the full-stack tools around them. I'm a Computer Engineering student in the Mechatronics Option at the ${esc(P.school)}.</p>
      <div class="pills">${P.specialties.map((s) => `<span class="pill">${esc(s)}</span>`).join('')}</div>
      <div class="actions">
        <a class="btn primary" href="mailto:${esc(P.email)}">${ICON.mail} Email me</a>
        <button class="btn" type="button" id="copyEmail">Copy email</button>
        <a class="btn" href="${esc(P.github)}" target="_blank" rel="noopener">${ICON.github} GitHub</a>
        <a class="btn" href="${esc(P.linkedin)}" target="_blank" rel="noopener">${ICON.linkedin} LinkedIn</a>
        ${P.resumeUrl ? `<a class="btn" href="${esc(P.resumeUrl)}" target="_blank" rel="noopener">${ICON.doc} Résumé</a>` : ''}
      </div>
      <p class="copy-note" id="copyNote" aria-live="polite"></p>
      <a class="fun-link" href="garden.html">${berry()} Want the playful version? <b>Take a walk through my garden</b> →</a>
    </div>
    <div class="hero-art">${heroArt}</div>`;
  $('copyEmail').addEventListener('click', () => {
    const note = $('copyNote');
    const done = () => { note.textContent = `Copied ${P.email}`; setTimeout(() => (note.textContent = ''), 2500); };
    if (navigator.clipboard) navigator.clipboard.writeText(P.email).then(done, () => (note.textContent = P.email));
    else note.textContent = P.email;
  });

  // ---------- skills & education ----------
  $('skills').innerHTML = `
    <p class="eyebrow">${berry()} Skills &amp; education</p>
    <h2 class="sec-title" id="skillsTitle">The building blocks</h2>
    <p class="sec-lead">Where I study and the tools I reach for, from registers to React.</p>
    <div class="skills-grid">
      <article class="card edu">
        <p class="label">Education</p>
        <h3 class="school">${esc(P.school)}</h3>
        <p class="degree">BASc in Computer Engineering, Mechatronics Option</p>
        <p class="class">Class of ${P.classOf}</p>
        <p class="label">Relevant coursework</p>
        <div class="chips">${P.coursework.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
      </article>
      <article class="card">
        <p class="label">Technical skills</p>
        <div class="shelves">${Object.entries(P.skills).map(([k, v], gi) => `<div class="shelf"><p class="label">${esc(k)}</p>${shelf(v, gi * 2)}</div>`).join('')}</div>
      </article>
    </div>`;

  // ---------- experience ----------
  $('experience').innerHTML = `
    <p class="eyebrow">${berry()} Experience</p>
    <h2 class="sec-title" id="expTitle">Where I've worked</h2>
    <p class="sec-lead">Five roles across data, web, computer vision and firmware. Each one comes with its tech stack, stacked.</p>
    <div class="jobs">${jobs.map((e, i) => `
      <article class="card job" id="exp-${e.id}" aria-labelledby="job-${e.id}">
        <div>
          <div class="job-head">
            <div>
              <h3 class="job-title" id="job-${e.id}">${esc(e.role)}</h3>
              <p class="job-org"><b>${esc(e.org)}</b> · ${esc(e.dates)}</p>
            </div>
            <span class="job-loc">${esc(e.location)}</span>
          </div>
          <p class="tagline">${berry()} ${esc(e.headline)}</p>
          <ul class="bullets">${(e.bullets || e.contributions.map((c) => c.body)).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        </div>
        <aside class="stack" aria-label="Tech stack">
          <p class="label">Tech stack</p>
          ${stack(e.tools, i)}
        </aside>
      </article>`).join('')}
    </div>`;

  // ---------- projects ----------
  $('projects').innerHTML = `
    <p class="eyebrow">${berry()} Projects</p>
    <h2 class="sec-title" id="projTitle">Things I built on my own</h2>
    <p class="sec-lead">Kernels, FPGAs, simulators and sensors.</p>
    <div class="proj-grid">${D.projects.map((p, i) => `
      <article class="card proj">
        <div class="proj-top"><span class="kind ${p.kind === 'Software' ? 'sw' : ''}">${esc(p.kind)}</span><span>${esc(p.date)}</span></div>
        <h3>${esc(p.name)}</h3>
        <p class="tag">${esc(p.tagline)}</p>
        <ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        ${shelf(p.tools, i, true)}
        ${p.link ? `<a class="more" href="${esc(p.link)}" target="_blank" rel="noopener">See it on GitHub ↗</a>` : ''}
      </article>`).join('')}
    </div>`;

  $('foot').innerHTML = `<span>${berry()} © ${new Date().getFullYear()} ${esc(P.name)}</span>
    <span><a href="mailto:${esc(P.email)}">${esc(P.email)}</a> · <a href="garden.html">Visit the garden</a></span>`;

  // ---------- scroll spy ----------
  const tabs = [...document.querySelectorAll('.tab')];
  const subs = [...document.querySelectorAll('#expSubList a')];
  const sections = tabs.map((t) => $(t.dataset.sec));
  const jobEls = jobs.map((e) => $('exp-' + e.id));
  function spy() {
    const line = window.innerHeight * 0.35;
    let cur = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= line) cur = s;
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = sections[sections.length - 1];
    tabs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.sec === cur.id)));
    let job = null;
    if (cur.id === 'experience') for (const j of jobEls) if (j.getBoundingClientRect().top <= line) job = j;
    subs.forEach((a) => a.setAttribute('aria-current', String(!!job && a.dataset.job === job.id.slice(4))));
  }
  let ticking = false;
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { spy(); ticking = false; }); } }, { passive: true });
  window.addEventListener('resize', spy);
  spy();

  // ---------- blocks drop into place when a stack scrolls into view ----------
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target;
        const blocks = [...el.querySelectorAll('.block')];
        blocks.forEach((b, i) => { b.style.transitionDelay = `${i * 90}ms`; });
        el.classList.remove('pending');
        setTimeout(() => blocks.forEach((b) => (b.style.transitionDelay = '')), blocks.length * 90 + 400);
        io.unobserve(el);
      }
    }, { threshold: 0.35 });
    document.querySelectorAll('.stack').forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pending'); io.observe(el); }
    });
  }
})();
