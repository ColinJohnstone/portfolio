/* ui.js — theme, header, reveals, counters, hero grid, scroll-spy and timeline filters.
   Vanilla, no dependencies.
   Without JS the page is fully readable (see the html:not(.js) rules in the CSS). */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = () => reduceMQ.matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- theme ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const SUN = '#i-sun', MOON = '#i-moon';
  function paintTheme(t) {
    const meta = $('meta[name=theme-color]');
    if (meta) meta.content = t === 'dark' ? '#0a0b0a' : '#f5f5f2';
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      const use = $('use', themeBtn);
      if (use) use.setAttribute('href', t === 'dark' ? SUN : MOON);
    }
  }
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) { /* private mode */ }
    paintTheme(t);
  }
  paintTheme(root.getAttribute('data-theme') || 'light');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (document.startViewTransition && !reduce()) document.startViewTransition(() => setTheme(next));
      else setTheme(next);
    });
  }

  /* ---------- mobile menu ---------- */
  const menu = $('[data-mobile-menu]');
  const menuBtn = $('[data-menu]');
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    document.body.style.overflow = open ? 'hidden' : '';
    if (open && header) header.classList.remove('is-hidden');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
    matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && setMenu(false));
  }

  /* ---------- header + progress ---------- */
  const header = $('[data-header]');
  const progress = $('.progress');
  let lastY = window.scrollY, ticking = false;
  function onScroll() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-solid', y > 16);
      const menuOpen = menu && menu.classList.contains('is-open');
      header.classList.toggle('is-hidden', !menuOpen && y > 480 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    if (progress) {
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty('--p', h > 0 ? clamp(y / h, 0, 1).toFixed(4) : 0);
    }
    lastY = y;
    spy();
    timelineProgress();
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(onScroll), { passive: true });

  /* ---------- headline split: words slide up from a mask ---------- */
  function splitWords(el) {
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            const wi = document.createElement('span');
            wi.className = 'wi'; wi.style.setProperty('--i', i++); wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    walk(el);
  }
  $$('[data-split]').forEach(splitWords);

  /* ---------- reveal on view ---------- */
  const targets = $$('.reveal,.reveal-clip,[data-split],.podium,.bars,.race,.stat,.tl-item,.timeline');
  const countIn = (el) => $$('[data-count]', el).forEach(count);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in'); io.unobserve(en.target); countIn(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
    setTimeout(() => targets.forEach((t) => t.classList.add('in')), 6000); // safety net
  } else targets.forEach((t) => { t.classList.add('in'); countIn(t); });

  /* ---------- counters ---------- */
  const ease = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  function fmt(v, el) {
    const dec = +el.dataset.decimals || 0;
    if (el.dataset.format === 'k') return Math.round(v / 1000) + 'k';
    return v.toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function count(el) {
    const end = parseFloat(el.dataset.count);
    if (isNaN(end)) return;
    if (reduce()) { el.textContent = fmt(end, el); return; }
    const t0 = performance.now(), dur = 1800;
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = fmt(end * ease(p), el);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(end, el);
    };
    requestAnimationFrame(step);
  }

  /* ---------- hero: a hairline grid that brightens where the pointer is ---------- */
  const hero = $('[data-hero]');
  const grid = hero && $('.hero-grid', hero);
  if (hero && grid && fine.matches && !reduce()) {
    let tx = null, ty = null, cx = null, cy = null, raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      grid.style.setProperty('--gx', cx.toFixed(1) + 'px');
      grid.style.setProperty('--gy', cy.toFixed(1) + 'px');
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(tick) : 0;
    };
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (cx === null) { cx = tx; cy = ty; }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---------- nav scroll-spy (home) ---------- */
  const links = $$('[data-nav] a');
  const spyMap = [['security', '#security'], ['piping', '#piping'], ['projects', '#projects']]
    .map(([k, s]) => [k, $(s)]).filter(([, el]) => el);
  function spy() {
    if (!spyMap.length) return;
    const mid = innerHeight * 0.4;
    let key = null;
    spyMap.forEach(([k, el]) => { if (el.getBoundingClientRect().top < mid) key = k; });
    const last = $('#projects');
    if (last && last.getBoundingClientRect().bottom < mid) key = null;
    links.forEach((l) => l.classList.toggle('is-active', !!key && l.dataset.spy === key));
  }

  /* ---------- timeline ---------- */
  const tl = $('.timeline');
  function timelineProgress() {
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    tl.style.setProperty('--tl', clamp((innerHeight * 0.62 - r.top) / r.height, 0, 1).toFixed(4));
  }
  $$('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let n = 0;
      $$('.tl-item').forEach((it) => {
        const show = f === 'all' || it.dataset.cat === f;
        it.hidden = !show;
        if (show) { it.classList.remove('in'); setTimeout(() => it.classList.add('in'), 40 + n++ * 70); }
      });
      timelineProgress();
    });
  });

  $$('[data-top]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' }); }));
  onScroll();
})();
