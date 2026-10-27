/* Ember & Vine — concept by Design by Baxit. No data is ever submitted. */
(() => {
  const d = document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.documentElement.classList.add('js');

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  d.querySelectorAll('.reveal').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', (Math.max(0, sibs.indexOf(el)) % 6) * 0.09 + 's');
    io.observe(el);
  });

  // Header + mobile action bar
  const header = d.querySelector('.header'), mbar = d.querySelector('.mbar');
  const hero = d.querySelector('.hero');
  const onScroll = () => {
    header.classList.toggle('scrolled', scrollY > 30);
    mbar.classList.toggle('show', scrollY > hero.offsetHeight * 0.6);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); mnav.classList.toggle('open', o); });
  mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); }));

  // Parallax (transform only, rAF-throttled)
  const px = [...d.querySelectorAll('[data-parallax]')];
  if (!reduce && px.length) {
    let ticking = false;
    const run = () => {
      px.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const k = parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${(r.top + r.height / 2 - innerHeight / 2) * -k}px, 0)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  // Ember particles (small 2D canvas, pauses when hero is off-screen)
  const cv = d.querySelector('.embers');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let w, h, dpr, parts = [], on = true;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const spawn = (y) => ({ x: Math.random() * w, y: y ?? h + 10, r: Math.random() * 1.8 + .6, vy: Math.random() * .6 + .25, vx: (Math.random() - .5) * .3, life: Math.random() * Math.PI * 2, a: Math.random() * .6 + .3 });
    size(); addEventListener('resize', size);
    const N = w < 700 ? 34 : 70;
    for (let i = 0; i < N; i++) parts.push(spawn(Math.random() * h));
    new IntersectionObserver(([e]) => { on = e.isIntersecting; if (on) requestAnimationFrame(loop); }).observe(cv);
    function loop() {
      if (!on) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.life += .03; p.y -= p.vy; p.x += p.vx + Math.sin(p.life) * .3;
        if (p.y < h * .2) Object.assign(p, spawn());
        const fade = Math.min(1, (p.y - h * .2) / (h * .4));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fillStyle = `rgba(255,${120 + (p.r * 40 | 0)},61,${p.a * fade})`;
        ctx.shadowBlur = 8; ctx.shadowColor = '#ff7a3d'; ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Menu tabs (keyboard-accessible)
  const tabs = [...d.querySelectorAll('[role="tab"]')];
  const select = (t) => {
    tabs.forEach((x) => { const s = x === t; x.setAttribute('aria-selected', s); x.tabIndex = s ? 0 : -1; const p = d.getElementById(x.getAttribute('aria-controls')); p.hidden = !s; p.classList.toggle('is-on', s); });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { const n = tabs[(i + k + tabs.length) % tabs.length]; select(n); n.focus(); } });
  });

  // Dates for the next 14 days
  d.querySelectorAll('[data-dates]').forEach((s) => {
    const dt = new Date();
    for (let i = 0; i < 14; i++) {
      const o = d.createElement('option');
      o.textContent = i === 0 ? 'Tonight' : i === 1 ? 'Tomorrow' : dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      s.appendChild(o); dt.setDate(dt.getDate() + 1);
    }
  });

  // Party-size stepper + time chips
  const out = d.querySelector('[data-guests]');
  d.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { out.value = out.textContent = Math.min(12, Math.max(1, +out.textContent + +b.dataset.step)); }));
  d.querySelectorAll('.times').forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; g.querySelectorAll('button').forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on'); }));

  // Demo modal
  const modal = d.querySelector('.demo-modal');
  const close = () => { modal.hidden = true; };
  d.querySelectorAll('[data-demo-form]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); modal.hidden = false; modal.querySelector('.btn').focus(); }));
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.dm-x')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
