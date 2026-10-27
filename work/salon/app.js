/* Velour Salon & Spa — concept by Design by Baxit. No data is ever submitted. */
(() => {
  const d = document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.documentElement.classList.add('js');

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  d.querySelectorAll('.reveal').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', (Math.max(0, sibs.indexOf(el)) % 6) * 0.1 + 's');
    io.observe(el);
  });

  const header = d.querySelector('.header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = d.querySelector('.burger'), mnav = d.getElementById('mnav');
  burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); mnav.classList.toggle('open', o); });
  mnav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); }));

  // Gentle scroll float on hero shapes
  const fl = [...d.querySelectorAll('[data-float]')];
  if (fl.length && !reduce) {
    let t = false;
    addEventListener('scroll', () => { if (t) return; t = true; requestAnimationFrame(() => { const y = Math.min(scrollY, 900); fl.forEach((el) => el.style.setProperty('--fy', -y * 0.06 * +el.dataset.float + 'px')); t = false; }); }, { passive: true });
  }

  // Service tabs
  const tabs = [...d.querySelectorAll('[role="tab"]')];
  const select = (t) => tabs.forEach((x) => { const s = x === t; x.setAttribute('aria-selected', s); x.tabIndex = s ? 0 : -1; const p = d.getElementById(x.getAttribute('aria-controls')); p.hidden = !s; p.classList.toggle('is-on', s); });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { const n = tabs[(i + k + tabs.length) % tabs.length]; select(n); n.focus(); } });
  });

  // Build-your-appointment basket
  const list = d.querySelector('[data-items]'), tMins = d.querySelector('[data-total-mins]'), tTotal = d.querySelector('[data-total]'), sum = d.querySelector('[data-summary]');
  const fmtMins = (m) => (m >= 60 ? Math.floor(m / 60) + ' h ' : '') + (m % 60 ? (m % 60) + ' min' : '').trim();
  const render = () => {
    const on = [...d.querySelectorAll('.add[aria-pressed="true"]')];
    let mins = 0, total = 0;
    list.innerHTML = on.length ? '' : '<li class="b-empty">No services yet. Tap + to add one.</li>';
    on.forEach((b) => { mins += +b.dataset.mins; total += +b.dataset.price; const li = d.createElement('li'); li.innerHTML = `<span>${b.dataset.name}</span><span>$${b.dataset.price}</span>`; list.appendChild(li); });
    tMins.textContent = mins ? fmtMins(mins) : '0 min'; tTotal.textContent = '$' + total;
    sum.innerHTML = on.length ? `${on.length} service${on.length > 1 ? 's' : ''} · ${fmtMins(mins)} · $${total}` : 'Add services from the menu above';
  };
  d.querySelectorAll('.add').forEach((b) => b.addEventListener('click', () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); render(); }));
  const first = d.querySelector('.add'); if (first) first.setAttribute('aria-pressed', 'true');
  render();

  // Booking chips
  const days = d.querySelector('[data-days]');
  if (days) { const dt = new Date(); for (let n = 0; n < 5; n++) { dt.setDate(dt.getDate() + 1); const b = d.createElement('button'); b.type = 'button'; b.className = 'day' + (n === 0 ? ' is-on' : ''); b.innerHTML = `<small>${dt.toLocaleDateString('en-US', { weekday: 'short' })}</small>${dt.getDate()}`; days.appendChild(b); } }
  d.querySelectorAll('.who, .days, .slots').forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; g.querySelectorAll('button').forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on'); }));

  // Demo modal
  const modal = d.querySelector('.demo-modal');
  const open = () => { modal.hidden = false; modal.querySelector('.btn').focus(); };
  const close = () => { modal.hidden = true; };
  d.querySelectorAll('[data-demo-form]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); open(); }));
  d.querySelectorAll('[data-demo-open]').forEach((b) => b.addEventListener('click', open));
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.dm-x')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();
