/* Northpoint Home Services — concept by Design by Baxit. No data is ever submitted. */
(() => {
  const d = document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  d.documentElement.classList.add('js');

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  d.querySelectorAll('.reveal').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', (Math.max(0, sibs.indexOf(el)) % 6) * 0.08 + 's');
    io.observe(el);
  });

  const header = d.querySelector('.header');
  const mbar = d.querySelector('.mbar'), hero = d.querySelector('.hero');
  const onScroll = () => { header.classList.toggle('scrolled', scrollY > 40); mbar.classList.toggle('show', scrollY > hero.offsetHeight * 0.7); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); mnav.classList.toggle('open', o); });
  mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); }));

  // 3D tilt on service cards (pointer devices only)
  if (fine && !reduce) d.querySelectorAll('[data-tilt]').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.setProperty('--ry', x * 10 + 'deg'); c.style.setProperty('--rx', -y * 10 + 'deg');
    });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); });
  });

  // Count-up
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = to.toLocaleString('en-US') + suf; return; }
    const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1600), k = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(to * k).toLocaleString('en-US') + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  d.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  // Live-looking ETA ticker in hero
  const eta = d.querySelector('[data-eta]');
  if (eta && !reduce) { let v = 42; setInterval(() => { v = v <= 18 ? 42 : v - 1; eta.textContent = v; }, 2500); }

  // Two-step quote widget
  const q = d.querySelector('[data-quote]');
  if (q) {
    const steps = q.querySelectorAll('.qc-step'), n = q.querySelector('[data-step-n]'), prog = q.querySelector('[data-progress]');
    const go = (i) => { steps.forEach((s, j) => { s.hidden = j !== i; }); n.textContent = i + 1; prog.style.width = (i + 1) * 50 + '%'; };
    q.querySelector('[data-next]').addEventListener('click', () => {
      const zip = q.querySelector('[name="zip"]');
      if (!/^\d{5}$/.test(zip.value.trim())) { zip.classList.remove('err'); void zip.offsetWidth; zip.classList.add('err'); zip.focus(); zip.placeholder = 'Enter a 5-digit ZIP'; return; }
      zip.classList.remove('err');
      const sel = q.querySelector('[name="svc"]:checked');
      q.querySelector('[data-svc]').textContent = sel.value;
      q.querySelector('[data-range]').textContent = sel.dataset.range;
      go(1);
    });
    q.querySelector('[data-back]').addEventListener('click', () => go(0));
    q.querySelector('.windows').addEventListener('click', (e) => { const b = e.target.closest('.win'); if (!b) return; q.querySelectorAll('.win').forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on'); });
    q.addEventListener('submit', (e) => { e.preventDefault(); openModal(); });
  }

  const modal = d.querySelector('.demo-modal');
  function openModal() { modal.hidden = false; modal.querySelector('.btn').focus(); }
  const close = () => { modal.hidden = true; };
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.dm-x')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
