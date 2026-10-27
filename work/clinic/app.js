/* Lumen Dental Studio — concept by Design by Baxit. No data is ever submitted. */
(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('js');

  // Scroll reveal with gentle stagger per parent
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  d.querySelectorAll('.reveal, .steps li').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', (Math.max(0, sibs.indexOf(el)) % 6) * 0.08 + 's');
    io.observe(el);
  });

  // Header state
  const header = d.querySelector('.header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile menu
  const burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); mnav.classList.toggle('open', open);
  });
  mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); }));

  // Count-up stats
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    const fmt = (v) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * k); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  d.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  // Hero tilt + parallax chips (pointer devices only)
  const vis = d.querySelector('[data-tilt]');
  if (vis && fine && !reduce) {
    const img = vis.querySelector('.hero-img'), chips = vis.querySelectorAll('[data-depth]');
    d.querySelector('.hero').addEventListener('pointermove', (ev) => {
      const r = vis.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      img.style.setProperty('--ry', x * 8 + 'deg'); img.style.setProperty('--rx', -y * 8 + 'deg');
      chips.forEach((c) => { const k = +c.dataset.depth; c.style.setProperty('--px', -x * k + 'px'); c.style.setProperty('--py', -y * k + 'px'); });
    });
    d.querySelector('.hero').addEventListener('pointerleave', () => {
      img.style.setProperty('--ry', '0deg'); img.style.setProperty('--rx', '0deg');
      chips.forEach((c) => { c.style.setProperty('--px', '0px'); c.style.setProperty('--py', '0px'); });
    });
  }

  // Booking widget: next 5 weekdays, selectable chips
  const days = d.querySelector('[data-days]');
  if (days) {
    const dt = new Date(); let n = 0;
    while (n < 5) {
      dt.setDate(dt.getDate() + 1);
      if (dt.getDay() === 0) continue;
      const b = d.createElement('button'); b.type = 'button'; b.className = 'day' + (n === 0 ? ' is-on' : '');
      b.innerHTML = `<small>${dt.toLocaleDateString('en-US', { weekday: 'short' })}</small>${dt.getDate()}`;
      days.appendChild(b); n++;
    }
  }
  d.querySelectorAll('.days, .slots').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    g.querySelectorAll('button').forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on');
  }));

  // Demo modal: forms never submit anywhere
  const modal = d.querySelector('.demo-modal');
  const open = () => { modal.hidden = false; modal.querySelector('.btn').focus(); };
  const close = () => { modal.hidden = true; };
  d.querySelectorAll('[data-demo-form]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); open(); }));
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.dm-x')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
