/* Harbor & Oak Realty — concept by Design by Baxit. No data is ever submitted. */
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

  const header = d.querySelector('.header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); mnav.classList.toggle('open', o); });
  mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); }));

  // Hero parallax
  const px = d.querySelector('[data-parallax]');
  if (px && !reduce) {
    let t = false;
    const run = () => { const r = px.parentElement.getBoundingClientRect(); if (r.bottom > 0) px.style.transform = `translate3d(0, ${-r.top * parseFloat(px.dataset.parallax)}px, 0)`; t = false; };
    addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(run); } }, { passive: true });
  }

  // Count-up
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    const fmt = (v) => (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf;
    if (reduce) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / 1600), k = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * k); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  d.querySelectorAll('[data-count]').forEach((el) => cio.observe(el));

  // Listing filter
  const chips = [...d.querySelectorAll('[data-filter]')], cards = [...d.querySelectorAll('.listing')];
  const filter = (f) => {
    chips.forEach((c) => { const on = c.dataset.filter === f; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on); });
    cards.forEach((c) => { const show = f === 'all' || c.dataset.tags.split(' ').includes(f); c.classList.toggle('out', !show); if (show && !reduce) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } c.classList.add('in'); });
  };
  chips.forEach((c) => c.addEventListener('click', () => filter(c.dataset.filter)));
  d.querySelectorAll('.fav').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true')));

  // Search: Buy/Rent filter the listings, Sell jumps to the valuation. Nothing is sent.
  let mode = 'sale';
  const search = d.querySelector('[data-search]');
  search.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; search.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('is-on', x === b)); }));
  search.addEventListener('submit', (e) => {
    e.preventDefault();
    if (mode === 'sell') { d.getElementById('sell').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
    filter(mode); d.getElementById('listings').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  // Mortgage calculator
  const calc = d.querySelector('[data-calc]');
  if (calc) {
    let term = 30;
    const $ = (k) => calc.querySelector(`[data-i="${k}"]`), o = (k) => calc.querySelector(`[data-o="${k}"]`);
    const money = (v) => '$' + Math.round(v).toLocaleString('en-US');
    const upd = () => {
      const price = +$('price').value, down = +$('down').value, rate = +$('rate').value;
      const loan = price * (1 - down / 100), r = rate / 100 / 12, n = term * 12;
      const m = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
      o('price').textContent = money(price); o('down').textContent = down + '% · ' + money(price * down / 100);
      o('rate').textContent = rate.toFixed(2) + '%'; o('monthly').textContent = money(m); o('loan').textContent = money(loan);
      calc.querySelectorAll('input[type=range]').forEach((i) => i.style.setProperty('--p', ((i.value - i.min) / (i.max - i.min)) * 100 + '%'));
    };
    calc.addEventListener('input', upd);
    calc.querySelectorAll('[data-term]').forEach((b) => b.addEventListener('click', () => { term = +b.dataset.term; calc.querySelectorAll('[data-term]').forEach((x) => x.classList.toggle('is-on', x === b)); upd(); }));
    upd();
  }

  // Demo modal
  const modal = d.querySelector('.demo-modal');
  const close = () => { modal.hidden = true; };
  d.querySelectorAll('[data-demo-form]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); modal.hidden = false; modal.querySelector('.btn').focus(); }));
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.dm-x')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
