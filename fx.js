/* ============================================================
   Design by Baxit — "Neon 3D" behaviour layer (redesign-3d)
   Card tilt + glow, custom cursor, scroll progress, counters,
   staggered reveals, and lazy loading of the Three.js hero.
   Works alongside theme.js (which still owns menu, reveal, forms).
   ============================================================ */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* Ambient aurora + progress bar */
    var aurora = document.createElement('div');
    aurora.className = 'fx-aurora'; aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML = '<i></i><i></i><i></i>';
    document.body.prepend(aurora);
    var bar = document.createElement('div');
    bar.className = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    /* Cards become glass + tilt targets */
    var cards = document.querySelectorAll('.card-center, .package-card, main article.rounded-2xl, .fx-box, main .rounded-2xl.border.bg-card\\/50');
    cards.forEach(function (c) {
      c.classList.add('fx-card');
      c.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'opacity' && c.classList.contains('is-visible')) c.classList.add('settled');
      });
    });
    document.querySelectorAll('.package-card.is-featured').forEach(function (c) {
      var ring = document.createElement('span'); ring.className = 'fx-ring'; ring.setAttribute('aria-hidden', 'true');
      c.prepend(ring);
    });

    /* Stagger reveals inside grids */
    document.querySelectorAll('.grid, .fx-grid').forEach(function (g) {
      var kids = g.querySelectorAll(':scope > .reveal');
      kids.forEach(function (k, i) { k.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'); k.style.transitionDelay = ''; });
    });

    /* Scroll progress */
    var queued = false;
    function onScroll() {
      queued = false;
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    }
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    /* Count-up numbers */
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
            var p = Math.min(1, (t - t0) / 1400), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
            el.textContent = v + suffix;
            if (p < 1) requestAnimationFrame(tick);
          })(t0);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { co.observe(c); });
    }

    if (!reduced && finePointer) {
      /* Tilt + glow tracking */
      cards.forEach(function (card) {
        var rect = null;
        card.addEventListener('pointerenter', function () { rect = card.getBoundingClientRect(); card.classList.add('is-hot'); });
        card.addEventListener('pointermove', function (e) {
          if (!rect) rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
          card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
          card.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
        });
        card.addEventListener('pointerleave', function () {
          rect = null; card.classList.remove('is-hot');
          card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
        });
      });

      /* Magnetic primary buttons */
      document.querySelectorAll('main a.bg-primary').forEach(function (b) {
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.15).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.25 - 2).toFixed(1) + 'px)';
        });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });

      /* Custom cursor */
      var dot = document.createElement('div'), ring = document.createElement('div');
      dot.className = 'fx-cursor'; ring.className = 'fx-cursor-ring';
      dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
      document.body.append(dot, ring);
      var mx = -100, my = -100, rx = -100, ry = -100, running = false;
      function loop() {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
        if (Math.abs(mx - rx) + Math.abs(my - ry) > 0.2) requestAnimationFrame(loop); else running = false;
      }
      addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        mx = e.clientX; my = e.clientY;
        document.documentElement.classList.add('fx-cursor-on');
        var t = e.target.closest && e.target.closest('a, button, select, input, textarea, label');
        ring.classList.toggle('is-link', !!t);
        if (!running) { running = true; requestAnimationFrame(loop); }
      }, { passive: true });
      document.addEventListener('pointerleave', function () { document.documentElement.classList.remove('fx-cursor-on'); });
    }

    /* Three.js hero: only if there's a mount, WebGL works, and the
       visitor hasn't asked to save data. Loaded as a module on demand. */
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
