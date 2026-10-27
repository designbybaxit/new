/* ============================================================
   Design by Baxit — "Clean Light" behaviour layer (redesign-light)
   Soft card lift + spotlight, gentle tilt, scroll progress,
   count-up stats, staggered reveals, and lazy loading of the
   Three.js hero. Works alongside theme.js (menu, reveal, forms).
   ============================================================ */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* This design is light only: clear any stored dark/light preference class juggling. */
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

    document.querySelectorAll('.grid, .fx-grid').forEach(function (g) {
      g.querySelectorAll(':scope > .reveal').forEach(function (k, i) {
        k.style.setProperty('--d', (i * 0.1).toFixed(2) + 's'); k.style.transitionDelay = '';
      });
    });

    var queued = false;
    function onScroll() {
      queued = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    }
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

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
            var p = Math.min(1, (t - t0) / 1600), v = Math.round(end * (1 - Math.pow(1 - p, 4)));
            el.textContent = v + suffix;
            if (p < 1) requestAnimationFrame(tick);
          })(t0);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { co.observe(c); });
    }

    if (!reduced && finePointer) {
      /* Refined lift: a very small tilt and a soft spotlight */
      cards.forEach(function (card) {
        var rect = null;
        card.addEventListener('pointerenter', function () { rect = card.getBoundingClientRect(); card.classList.add('is-hot'); });
        card.addEventListener('pointermove', function (e) {
          if (!rect) rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
          card.style.setProperty('--ry', ((x - 0.5) * 3).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 2.4).toFixed(2) + 'deg');
        });
        card.addEventListener('pointerleave', function () {
          rect = null; card.classList.remove('is-hot');
          card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
        });
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
