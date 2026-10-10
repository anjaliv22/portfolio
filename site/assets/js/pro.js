/* Pro mode: renders data.js into a sidebar + detail layout, with #hash links for each section. */
(() => {
  'use strict';
  const D = window.PORTFOLIO, P = D.person;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (id) => document.getElementById(id);

  const pages = [
    { id: 'about', group: 'Overview', label: 'About me', year: '' },
    ...D.experience.map((e) => ({ id: e.id, group: 'Experience', label: e.org === 'Martinrea International' ? `Martinrea · ${e.id === 'martinrea1' ? 'Vision App' : 'Vision Eng'}` : e.org, year: e.year, e })),
    ...D.projects.map((p) => ({ id: p.id, group: 'Projects', label: p.short, year: p.kind === 'Hardware' ? 'HW' : 'SW', p })),
  ];

  $('name').textContent = P.name;
  $('role').textContent = `${P.role} · ${P.school} · Class of ${P.classOf}`;

  let lastGroup = '';
  $('sideList').innerHTML = pages.map((pg) => {
    const head = pg.group !== lastGroup ? `<p class="side-title">${pg.group.toUpperCase()}</p>` : '';
    lastGroup = pg.group;
    return `${head}<a class="side-item" href="#${pg.id}" data-id="${pg.id}"><span>${esc(pg.label)}</span><span>${esc(pg.year)}</span></a>`;
  }).join('');
  $('sideLinks').innerHTML = [
    P.resumeUrl && `<a href="${esc(P.resumeUrl)}" target="_blank" rel="noopener">Résumé ↗</a>`,
    `<a href="${esc(P.github)}" target="_blank" rel="noopener">GitHub ↗</a>`,
    `<a href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>`,
  ].filter(Boolean).join('');

  const chips = (list) => `<div class="chips">${list.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`;

  function render(id) {
    const idx = Math.max(0, pages.findIndex((p) => p.id === id));
    const pg = pages[idx];
    let html = '';
    if (pg.e) {
      const e = pg.e;
      html = `<p class="meta">${esc(e.dates)} · ${esc(e.location)}</p>
        <h1>${esc(e.headline)}</h1>
        <p class="sub">${esc(e.role)} · ${esc(e.org)}</p>
        <p class="intro">${esc(e.intro)}</p>
        ${e.stats.length ? `<div class="stats">${e.stats.map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>` : ''}
        <h2 class="sec">SELECTED CONTRIBUTIONS</h2>
        <div class="rows">${e.contributions.map((c) => `<div class="row"><h2>${esc(c.title)}</h2><p>${esc(c.body)}</p></div>`).join('')}</div>
        ${chips(e.tools)}`;
    } else if (pg.p) {
      const p = pg.p;
      html = `<p class="meta">${esc(p.kind)} project · ${esc(p.date)}</p>
        <h1>${esc(p.name)}</h1>
        <p class="intro">${esc(p.tagline)}</p>
        <h2 class="sec">WHAT I BUILT</h2>
        <ul class="points">${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        ${chips(p.tools)}
        ${p.link ? `<a class="link" href="${esc(p.link)}" target="_blank" rel="noopener">See it on GitHub ↗</a>` : ''}`;
    } else {
      html = `<p class="meta">${esc(P.school)} · Class of ${P.classOf}</p>
        <h1>Firmware, computer vision, and the software in between.</h1>
        <p class="intro">I'm ${esc(P.name.split(' ')[0])}, a Computer Engineering student in the Mechatronics Option. I've built web scrapers, backend services, factory vision systems and motor-control firmware. Pick a role or project on the left to read more.</p>
        <dl class="facts">
          <dt>Education</dt><dd>BASc in Computer Engineering, Mechatronics Option, ${esc(P.school)}, Class of ${P.classOf}</dd>
          <dt>Coursework</dt><dd>${esc(P.coursework.join(', '))}</dd>
          ${Object.entries(P.skills).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v.join(', '))}</dd>`).join('')}
          <dt>Contact</dt><dd>${esc(P.email)}<br><a class="link" href="${esc(P.github)}" target="_blank" rel="noopener">GitHub ↗</a> · <a class="link" href="${esc(P.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a></dd>
        </dl>`;
    }
    $('detail').innerHTML = html;
    document.querySelectorAll('.side-item').forEach((a) => (a.dataset.id === pg.id ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    const prev = pages[idx - 1], next = pages[idx + 1];
    const setNav = (a, target, text) => {
      if (target) { a.href = '#' + target.id; a.textContent = text; a.removeAttribute('aria-disabled'); }
      else { a.removeAttribute('href'); a.textContent = ''; a.setAttribute('aria-disabled', 'true'); }
    };
    setNav($('prevBtn'), prev, prev && `← ${prev.label}`);
    setNav($('nextBtn'), next, next && `Next: ${next.label} →`);
    $('pos').textContent = `${idx + 1} of ${pages.length}`;
    document.title = idx === 0 ? `${P.name} · Portfolio` : `${pg.label} · ${P.name}`;
  }

  function route(focus) {
    render(location.hash.slice(1) || 'about');
    window.scrollTo(0, 0);
    if (focus) $('detail').focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', () => route(true));
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight' && $('nextBtn').getAttribute('href')) location.hash = $('nextBtn').getAttribute('href');
    if (e.key === 'ArrowLeft' && $('prevBtn').getAttribute('href')) location.hash = $('prevBtn').getAttribute('href');
  });
  route(false);
})();
