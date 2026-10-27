/* ============================================================
   Design by Baxit — "Bold Colour" behaviour layer (redesign-bold)
   Gives every card its own colour, springy staggered reveals,
   rainbow scroll progress, bouncy count-up stats, a playful card
   lean toward the pointer, and lazy loading of the Three.js hero.
   Works alongside theme.js (menu, reveal, forms).
   ============================================================ */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var COLOURS = ['#ffd23f', '#ff4f8b', '#1fc98a', '#9fb0ff', '#ff7a2f', '#b89bff'];

  document.documentElement.classList.add('light');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var bar = document.createElement('div');
    bar.className = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var cards = document.querySelectorAll('.card-center, .package-card, main article.rounded-2xl, .fx-box, main .rounded-2xl.border.bg-card\\/50');
    cards.forEach(function (c) {
      c.classList.add('fx-card');
      c.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'opacity' && c.classList.contains('is-visible')) c.classList.add('settled');
      });
    });

    /* Colour + stagger per grid */
    var offset = 0;
    document.querySelectorAll('.grid, .fx-grid').forEach(function (g) {
      var kids = g.querySelectorAll(':scope > .fx-card, :scope > .reveal');
      kids.forEach(function (k, i) {
        k.style.setProperty('--c', COLOURS[(i + offset) % COLOURS.length]);
        if (k.classList.contains('reveal')) { k.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'); k.style.transitionDelay = ''; }
      });
      if (kids.length) offset += 1;
    });

    var queued = false;
    function onScroll() {
      queued = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    }
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* Count-up with a little overshoot */
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
      var co = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          co.unobserve(e.target);
          var el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
          if (reduced) { el.textContent = end + suffix; return; }
          var t0 = performance.now();
          (function tick(t) {
            var p = Math.min(1, (t - t0) / 1200);
            var c1 = 1.70158, c3 = c1 + 1, ease = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
            el.textContent = Math.max(0, Math.round(end * ease)) + suffix;
            if (p < 1) requestAnimationFrame(tick); else el.textContent = end + suffix;
          })(t0);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { co.observe(c); });
    }

    if (!reduced && finePointer) {
      cards.forEach(function (card) {
        card.addEventListener('pointerenter', function () { card.classList.add('is-hot'); });
        card.addEventListener('pointerleave', function () { card.classList.remove('is-hot'); });
      });
    }

    /* Three.js hero: only with a mount, working WebGL, and no Save-Data. */
    var mount = document.querySelector('[data-hero3d]');
    if (!mount) return;
    var conn = navigator.connection || {};
    if (conn.saveData) return;
    try {
      var c = document.createElement('canvas');
      if (!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))) return;
    } catch (e) { return; }
    var s = document.createElement('script');
    s.type = 'module'; s.src = '/hero3d.js';
    document.head.appendChild(s);
  });
})();
