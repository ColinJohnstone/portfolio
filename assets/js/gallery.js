/* gallery.js — screenshot showcases, phone carousel, lightbox.
   Progressive enhancement: with JS off every screenshot is simply stacked on the page. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');

  const reduce = () => reduceMQ.matches;
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; };
  const inView = (node, cb, opts = { threshold: 0.35 }) => {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), opts).observe(node);
  };

  /* ====================== showcase: tabs + auto-advance ====================== */
  $$('[data-showcase]').forEach((sc, n) => {
    const screen = $('.device-screen', sc);
    const shots = $$('.shot', screen || sc);
    const tabsEl = $('.tabs', sc);
    const cap = $('.caption', sc);
    if (!screen || shots.length < 2 || !tabsEl) { if (cap && shots[0]) cap.innerHTML = shots[0].dataset.caption || ''; return; }
    const interval = parseFloat(getComputedStyle(sc).getPropertyValue('--t')) * 1000 || 6200;
    tabsEl.textContent = '';
    const pill = el('span', 'tab-pill');
    tabsEl.appendChild(pill);
    const tabs = shots.map((s, i) => {
      const b = el('button', 'tab');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `sc${n}-t${i}`;
      b.setAttribute('aria-selected', 'false'); b.tabIndex = -1;
      b.append(document.createTextNode(s.dataset.title || `Screen ${i + 1}`), el('span', 'bar'));
      b.addEventListener('click', () => { user = true; go(i); });
      tabsEl.appendChild(b);
      s.setAttribute('role', 'tabpanel'); s.setAttribute('aria-labelledby', b.id);
      return b;
    });
    let idx = 0, timer = null, user = false, visible = false, hovering = false;

    function movePill() {
      const t = tabs[idx];
      pill.style.width = t.offsetWidth + 'px';
      pill.style.height = t.offsetHeight + 'px';
      pill.style.transform = `translate(${t.offsetLeft}px,${t.offsetTop}px)`;
    }
    function schedule() {
      clearTimeout(timer);
      tabs.forEach((t) => t.classList.remove('is-timing'));
      if (user || reduce() || !visible || hovering) return;
      const t = tabs[idx];
      void t.offsetWidth;
      t.style.setProperty('--t', interval + 'ms');
      t.classList.add('is-timing');
      timer = setTimeout(() => go((idx + 1) % shots.length), interval);
    }
    function go(i) {
      idx = i;
      shots.forEach((s, k) => { s.classList.toggle('is-active', k === i); s.setAttribute('aria-hidden', String(k !== i)); });
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      if (cap) cap.innerHTML = shots[i].dataset.caption || '';
      movePill();
      schedule();
    }
    tabsEl.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k === undefined && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault(); user = true;
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (idx + k + tabs.length) % tabs.length;
      go(next); tabs[next].focus();
    });
    sc.addEventListener('pointerenter', () => { hovering = true; schedule(); });
    sc.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    inView(sc, (v) => { visible = v; schedule(); });
    addEventListener('resize', movePill, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
    go(0);
  });

  /* mini showcases (no tabs): gentle auto crossfade */
  $$('[data-showcase-mini]').forEach((screen) => {
    const shots = $$('.shot', screen);
    if (shots.length < 2) return;
    let i = 0, visible = false, hover = false;
    inView(screen, (v) => { visible = v; });
    setInterval(() => {
      if (!visible || hover || reduce()) return;
      i = (i + 1) % shots.length;
      shots.forEach((s, k) => s.classList.toggle('is-active', k === i));
    }, 4200);
    screen.addEventListener('pointerenter', () => { hover = true; });
    screen.addEventListener('pointerleave', () => { hover = false; });
  });

  /* ====================== phone carousel ====================== */
  let suppressClick = false;
  $$('[data-carousel]').forEach((c) => {
    const track = $('.car-track', c);
    const items = $$('.car-item', track);
    const dots = $('.car-dots', c);
    if (!track || !items.length) return;
    items.forEach((it, i) => dots && dots.appendChild(el('i', i === 0 ? 'on' : '')));
    const dotEls = dots ? $$('i', dots) : [];
    const step = () => Math.max(track.clientWidth * 0.8, 240);
    $('[data-prev]', c).addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reduce() ? 'auto' : 'smooth' }));
    $('[data-next]', c).addEventListener('click', () => track.scrollBy({ left: step(), behavior: reduce() ? 'auto' : 'smooth' }));
    function paint() {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bd = Infinity;
      items.forEach((it, i) => { const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
      dotEls.forEach((d, i) => d.classList.toggle('on', i === best));
    }
    track.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
    // drag to scroll with a mouse
    let down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) { track.classList.add('is-drag'); track.scrollLeft = sl - dx; }
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false; track.classList.remove('is-drag');
      if (moved > 5) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 60); }
    });
    // keyboard: arrows scroll
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step() / 2, behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step() / 2, behavior: 'smooth' }); }
    });
    paint();
  });

  /* ====================== lightbox ====================== */
  const lb = $('[data-lightbox]');
  if (!lb) return;
  const lbImg = $('.lb-fig img', lb);
  const lbCap = $('.lb-cap', lb);
  const lbCount = $('.lb-count', lb);
  const btnClose = $('.lb-close', lb), btnPrev = $('.lb-prev', lb), btnNext = $('.lb-next', lb);
  let list = [], at = 0, name = '', lastFocus = null;

  function collect(rootEl) {
    return $$('[data-lb]', rootEl).map((n) => {
      const img = $('img', n);
      return img ? { src: img.currentSrc || img.src, alt: img.alt, cap: n.dataset.caption || '' } : null;
    }).filter(Boolean);
  }
  function show(i) {
    at = (i + list.length) % list.length;
    const it = list[at];
    lbImg.style.opacity = 0;
    const next = new Image();
    next.onload = () => { lbImg.src = it.src; lbImg.alt = it.alt; requestAnimationFrame(() => { lbImg.style.opacity = 1; }); };
    next.src = it.src;
    lbCap.innerHTML = it.cap;
    lbCount.textContent = `${name} · ${at + 1} / ${list.length}`;
    const single = list.length < 2;
    btnPrev.hidden = btnNext.hidden = single;
    // warm neighbours
    [list[(at + 1) % list.length], list[(at - 1 + list.length) % list.length]].forEach((n) => { if (n) new Image().src = n.src; });
  }
  function open(rootEl, itemEl) {
    list = collect(rootEl);
    if (!list.length) return;
    name = rootEl.dataset.gallery || 'Gallery';
    const all = $$('[data-lb]', rootEl);
    const start = Math.max(0, all.indexOf(itemEl));
    lastFocus = document.activeElement;
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lbImg.style.transition = 'opacity .35s var(--ease)';
    show(start);
    btnClose.focus({ preventScroll: true });
  }
  function close() {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  document.addEventListener('click', (e) => {
    if (suppressClick) return;
    const item = e.target.closest('[data-lb]');
    if (!item || lb.contains(item)) return;
    const host = item.closest('[data-gallery]');
    if (host) open(host, item);
  });
  // make clickable screenshots reachable by keyboard
  $$('.device-screen').forEach((s) => {
    if (!$('[data-lb]', s)) return;
    s.tabIndex = 0; s.setAttribute('role', 'button'); s.setAttribute('aria-label', 'Enlarge screenshot');
    s.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const host = s.closest('[data-gallery]');
      const active = $('.shot.is-active', s) || $('[data-lb]', s);
      if (host) open(host, active);
    });
  });
  $$('.car-item[data-lb]').forEach((it) => {
    it.tabIndex = 0; it.setAttribute('role', 'button'); it.setAttribute('aria-label', 'Enlarge screenshot');
    it.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const host = it.closest('[data-gallery]'); if (host) open(host, it); }
    });
  });
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(at - 1));
  btnNext.addEventListener('click', () => show(at + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-fig')) close(); });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'Tab') { // focus trap
      const f = [btnClose, btnPrev, btnNext].filter((b) => !b.hidden);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // swipe on touch
  let tx = 0;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
