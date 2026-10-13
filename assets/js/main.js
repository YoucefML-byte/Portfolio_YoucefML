/* =============================================================
   Portfolio — rendu du contenu depuis SITE_DATA + interactions
============================================================= */
(function () {
  'use strict';

  const data = window.SITE_DATA || (typeof SITE_DATA !== 'undefined' ? SITE_DATA : null);
  if (!data) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const CATEGORIES = {
    data: 'Data & IA',
    bdd: 'Bases de données',
    algo: 'Algorithmique',
    dev: 'Développement',
    ux: 'UX / Ergonomie'
  };

  // Échappe le texte injecté dans le HTML
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const tagsHTML = (tags) => (tags && tags.length)
    ? `<ul class="tags" aria-label="Technologies">${tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
    : '';

  /* ---------- Année ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Expérience ---------- */
  const expList = $('#experienceList');
  if (expList && data.experience) {
    expList.innerHTML = data.experience.map((e) => `
      <article class="exp-card">
        <div class="exp-side">
          <p class="exp-role">${esc(e.role)}</p>
          <p class="exp-period">${esc(e.period)}</p>
        </div>
        <div class="exp-main">
          <h3>${esc(e.org)}</h3>
          <p class="exp-summary">${esc(e.summary)}</p>
          ${e.points ? `<ul class="exp-points">${e.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
          <div class="exp-foot">
            ${tagsHTML(e.tags)}
            ${e.link ? `<a class="btn btn-primary btn-sm" href="${esc(e.link.url)}" target="_blank" rel="noopener">${esc(e.link.label)}
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>` : ''}
          </div>
        </div>
      </article>`).join('');
  }

  /* ---------- Projets ---------- */
  const projects = (data.projects || []).slice().sort((a, b) => (b.featured === true) - (a.featured === true));
  const grid = $('#projectsGrid');
  if (grid) {
    grid.innerHTML = projects.map((p) => `
      <article class="project${p.featured ? ' project--featured' : ''}" data-category="${esc(p.category)}">
        <div class="project-meta">
          <span class="project-cat">${esc(CATEGORIES[p.category] || 'Projet')}</span>
          ${p.period ? `<span class="project-period">${esc(p.period)}</span>` : ''}
        </div>
        <h3>${esc(p.title)}</h3>
        <p class="project-summary">${esc(p.summary || p.description)}</p>
        ${p.highlight ? `<p class="project-highlight"><b>${esc(p.highlight.value)}</b><span>${esc(p.highlight.label)}</span></p>` : ''}
        ${tagsHTML(p.tags)}
        ${p.points && p.points.length ? `
        <details>
          <summary>Détails du projet <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></summary>
          <ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </details>` : ''}
        ${p.url && p.url !== '#' ? `<a class="report-cta" href="${esc(p.url)}" target="_blank" rel="noopener">Voir le projet →</a>` : ''}
      </article>`).join('');
  }

  /* ---------- Filtres ---------- */
  const filters = $('#projectFilters');
  const status = $('#filterStatus');
  if (filters && grid) {
    const counts = projects.reduce((acc, p) => (acc[p.category] = (acc[p.category] || 0) + 1, acc), {});
    const keys = Object.keys(CATEGORIES).filter((k) => counts[k]);
    filters.innerHTML = [
      `<button type="button" class="filter" data-filter="all" aria-pressed="true">Tous <span class="count">${projects.length}</span></button>`,
      ...keys.map((k) => `<button type="button" class="filter" data-filter="${k}" aria-pressed="false">${esc(CATEGORIES[k])} <span class="count">${counts[k]}</span></button>`)
    ].join('');

    filters.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.filter');
      if (!btn) return;
      const f = btn.dataset.filter;
      $$('.filter', filters).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      $$('.project', grid).forEach((card) => {
        const match = f === 'all' || card.dataset.category === f;
        card.hidden = !match;
        if (match) shown++;
      });
      if (status) status.textContent = `${shown} projet${shown > 1 ? 's' : ''} affiché${shown > 1 ? 's' : ''}`;
    });
  }

  /* ---------- Tableau de bord du hero (données réelles du portfolio) ---------- */
  const kpiProjects = $('#kpiProjects');
  if (kpiProjects) kpiProjects.textContent = projects.length;
  const kpiTech = $('#kpiTech');
  if (kpiTech) {
    const tech = new Set();
    [...projects, ...(data.experience || [])].forEach((p) => (p.tags || []).forEach((t) => tech.add(t.toLowerCase())));
    $$('#competences .chips li').filter((li) => !li.closest('[data-kpi-exclude]')).forEach((li) => tech.add(li.textContent.trim().toLowerCase()));
    kpiTech.textContent = tech.size;
  }
  const bars = $('#domainBars');
  if (bars) {
    const counts = projects.reduce((acc, p) => (acc[p.category] = (acc[p.category] || 0) + 1, acc), {});
    // Ordre fixe : les domaines « data » d'abord, mis en valeur
    const core = ['data', 'bdd'];
    const rows = Object.keys(CATEGORIES).filter((k) => counts[k]).map((k) => [k, counts[k]]);
    const max = Math.max(...rows.map((r) => r[1]), 1);
    bars.innerHTML = rows.map(([k, n], i) => `
      <li${core.includes(k) ? ' class="is-core"' : ''}>
        <span class="bar-label">${esc(CATEGORIES[k] || k)}</span>
        <span class="bar-track"><span class="bar-fill" style="--w:${(n / max) * 100}%; --i:${i}"></span></span>
        <span class="bar-value">${n}</span>
      </li>`).join('');
  }

  /* ---------- Power BI ---------- */
  const hub = $('#powerbiHubBtn');
  if (hub && data.powerbiHub) hub.href = data.powerbiHub;
  const pbiGrid = $('#powerbiGrid');
  if (pbiGrid && data.powerbiReports && data.powerbiReports.length) {
    pbiGrid.innerHTML = data.powerbiReports.map((r) => `
      <a class="report" href="${esc(r.url || data.powerbiHub)}" target="_blank" rel="noopener">
        ${r.image ? `<img src="${esc(r.image)}" alt="" loading="lazy" decoding="async" width="640" height="360">` : ''}
        <div class="report-body">
          <h3>${esc(r.title)}</h3>
          <p>${esc(r.description)}</p>
          ${tagsHTML(r.tags)}
          <span class="report-cta">Ouvrir le rapport →</span>
        </div>
      </a>`).join('');
  }

  /* ---------- CV ---------- */
  const setHref = (id, url) => { const el = $(id); if (el && url) el.href = url; };
  if (data.cv) {
    setHref('#cvFrDownload', data.cv.fr);
    setHref('#cvFrView', data.cv.fr);
    setHref('#cvEnDownload', data.cv.en);
    setHref('#cvEnView', data.cv.en);
  }

  /* ---------- Contact ---------- */
  const email = data.contact && data.contact.email;
  if (email) {
    setHref('#contactEmail', 'mailto:' + email);
    const t = $('#contactEmailText');
    if (t) t.textContent = email;
  }
  if (data.contact && data.contact.linkedin) {
    setHref('#contactLinkedin', data.contact.linkedin);
    setHref('#heroLinkedin', data.contact.linkedin);
  }
  const copyBtn = $('#copyEmail');
  const copyLabel = $('#copyEmailLabel');
  if (copyBtn && email) {
    let timer;
    copyBtn.addEventListener('click', async () => {
      let ok = false;
      try {
        await navigator.clipboard.writeText(email);
        ok = true;
      } catch (_) {
        ok = false;
      }
      copyLabel.textContent = ok ? 'Adresse copiée ✓' : email;
      clearTimeout(timer);
      timer = setTimeout(() => { copyLabel.textContent = "Copier l'adresse"; }, 2500);
    });
  }

  /* ---------- Navigation mobile ---------- */
  const toggle = $('#navToggle');
  const menu = $('#navMenu');
  const mq = window.matchMedia('(max-width: 1000px)');
  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Fermer le menu' : 'Menu';
  };
  if (toggle && menu) {
    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (mq.matches && menu.classList.contains('is-open') && !e.target.closest('.nav')) setOpen(false);
    });
    mq.addEventListener('change', () => setOpen(false));
  }

  /* ---------- En-tête : ombre une fois la page défilée ---------- */
  const header = $('#siteHeader');
  const hero = $('#accueil');
  if (header && hero && 'IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
    hero.prepend(sentinel);
    new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
  }

  /* ---------- Scrollspy : lien actif dans la navigation ---------- */
  const navLinks = $$('#navLinks a');
  const setCurrent = (current) => navLinks.forEach((l) => {
    if (l === current) l.setAttribute('aria-current', 'true');
    else l.removeAttribute('aria-current');
  });
  if (CSS.supports && CSS.supports('scroll-target-group: auto')) {
    const sync = () => setCurrent(header && header.classList.contains('is-scrolled') ? $('#navLinks a:target-current') : null);
    sync();
    document.addEventListener('scrollend', sync);
  } else if ('IntersectionObserver' in window) {
    const byId = new Map(navLinks.map((l) => [l.getAttribute('href').slice(1), l]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = byId.get(entry.target.id) || null;
        navLinks.forEach((l) => l.classList.toggle(':target-current', l === link));
        setCurrent(link);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    $$('main > section[id]').forEach((s) => io.observe(s));
  }
})();
