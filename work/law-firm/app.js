/* Whitmore & Hale — concept by Design by Baxit. No data is ever submitted. */
(() => {
  const d = document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.documentElement.classList.add('js');

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  d.querySelectorAll('.reveal').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', (Math.max(0, sibs.indexOf(el)) % 6) * 0.08 + 's');
    io.observe(el);
  });

  const header = d.querySelector('.header'), mbar = d.querySelector('.mbar'), hero = d.querySelector('.hero');
  const onScroll = () => { header.classList.toggle('scrolled', scrollY > 40); mbar.classList.toggle('show', scrollY > hero.offsetHeight * 0.8); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); mnav.classList.toggle('open', o); });
  mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); }));

  // Parallax columns behind the hero
  const px = d.querySelector('[data-parallax]');
  if (px && !reduce) {
    let t = false;
    addEventListener('scroll', () => { if (t) return; t = true; requestAnimationFrame(() => { if (scrollY < innerHeight * 1.5) px.style.transform = `translate3d(0, ${scrollY * parseFloat(px.dataset.parallax)}px, 0)`; t = false; }); }, { passive: true });
  }

  // Count-up for results ($ prefix, M/K suffix)
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const fmt = (v) => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1800), k = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * k); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.5 });
  d.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  // Demo modal
  const modal = d.querySelector('.demo-modal');
  const close = () => { modal.hidden = true; };
  d.querySelectorAll('[data-demo-form]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); modal.hidden = false; modal.querySelector('.btn').focus(); }));
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.dm-x')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
