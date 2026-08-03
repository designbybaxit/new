/* ============================================================
   "How We Build Your Website" — scrollytelling engine
   Progress is a continuous function of scroll position (p, 0→1),
   never a one-shot trigger — scrolling up reverses every animation.
   ============================================================ */
(function () {
  'use strict';

  var build = document.getElementById('build');
  if (!build) return;

  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- math ---- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  if (reduced) return; /* static CSS fallback handles this — no pinning, no scrubbing */

  /* theme.css sets html { scroll-behavior: smooth } site-wide for anchor links.
     That fights Lenis's own scroll control on this page — both try to own the
     scroll position, which is what produces a stutter-then-snap feel. Disable
     the native behavior here only; other pages are unaffected. */
  document.documentElement.style.scrollBehavior = 'auto';

  /* ---- inertial scroll ---- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
  }

  /* ---- SVG stroke-draw helper ---- */
  function prepDraw(el) {
    if (!el) return null;
    var len;
    try { len = el.getTotalLength(); } catch (e) { len = 200; }
    if (!len || !isFinite(len)) len = 200;
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    el._len = len;
    return el;
  }
  function draw(el, t) { if (el) el.style.strokeDashoffset = el._len * (1 - t); }

  var dFrame = prepDraw(document.getElementById('frame'));
  var dDivider = prepDraw(document.getElementById('chromeDivider'));
  var dAddress = prepDraw(document.getElementById('addressbar'));
  var dHeader = prepDraw(document.getElementById('wHeader'));
  var dHero = prepDraw(document.getElementById('wHero'));
  var dCard1 = prepDraw(document.getElementById('wCard1'));
  var dCard2 = prepDraw(document.getElementById('wCard2'));
  var dCard3 = prepDraw(document.getElementById('wCard3'));
  var dGuide1 = prepDraw(document.getElementById('gGuide1'));
  var dGuide2 = prepDraw(document.getElementById('gGuide2'));
  var dBracket = prepDraw(document.getElementById('codeBracket'));
  var dSpark = prepDraw(document.getElementById('sparkline'));

  var dots = [].slice.call(document.querySelectorAll('.buildDot'));
  var textlines = [].slice.call(document.querySelectorAll('.textline'));
  var cursorWrap = document.getElementById('cursorWrap');
  var blocksGroup = document.getElementById('blocksGroup');
  var fHeader = document.getElementById('fHeader');
  var fHero = document.getElementById('fHero');
  var fCard1 = document.getElementById('fCard1');
  var fCard2 = document.getElementById('fCard2');
  var fCard3 = document.getElementById('fCard3');
  var mobile = document.getElementById('mobile');
  var tablet = document.getElementById('tablet');
  var pulse = document.getElementById('pulse');
  var pulseGlow = document.getElementById('pulseGlow');

  function setFill(el, t) { if (el) el.style.fillOpacity = t.toFixed(3); }
  function setOpacity(el, t) { if (el) el.style.opacity = t.toFixed(3); }

  /* ---- phases ---- */
  var PHASES = [
    { n: '01', label: 'Consultation' },
    { n: '02', label: 'Discovery & Strategy' },
    { n: '03', label: 'Design' },
    { n: '04', label: 'Build' },
    { n: '05', label: 'Launch & Grow' }
  ];
  var N = PHASES.length;
  var panels = [].slice.call(document.querySelectorAll('.phasePanel'));
  var railFill = document.getElementById('buildProgress');
  var phasePill = document.getElementById('buildPhasePill');
  var cue = document.getElementById('buildCue');
  var current = -1;

  function render() {
    var rect = build.getBoundingClientRect();
    var span = build.offsetHeight - window.innerHeight;
    var p = span > 0 ? clamp(-rect.top / span, 0, 1) : 0;

    railFill.style.width = (p * 100).toFixed(2) + '%';

    var idx = clamp(Math.floor(p * N), 0, N - 1);
    if (idx !== current) {
      current = idx;
      phasePill.textContent = PHASES[idx].n + ' / 0' + N + ' — ' + PHASES[idx].label;
      cue.textContent = idx < N - 1 ? 'Scroll to see Phase ' + (idx + 2) : 'Keep scrolling';
    }

    /* copy crossfade, scrubbed */
    for (var i = 0; i < N; i++) {
      var local = (p - i / N) * N;
      var o, ty;
      if (local < 0) { o = 0; ty = 40; }
      else if (local > 1) { o = 0; ty = -40; }
      else {
        var inT = seg(local, 0, 0.22);
        var outT = seg(local, 0.80, 1);
        o = inT * (1 - outT);
        ty = (1 - inT) * 40 - outT * 40;
      }
      panels[i].style.opacity = o.toFixed(3);
      panels[i].style.transform = 'translateY(' + ty.toFixed(1) + 'px)';
      panels[i].classList.toggle('is-live', o > 0.5);
    }

    /* ---- Phase 1 (0.00–0.20): browser frame draws, cursor blinks ---- */
    draw(dFrame, easeOut(seg(p, 0.01, 0.14)));
    draw(dDivider, easeOut(seg(p, 0.05, 0.15)));
    draw(dAddress, easeOut(seg(p, 0.04, 0.13)));
    dots.forEach(function (el, i) {
      var d = i * 0.02;
      setOpacity(el, easeOut(seg(p, 0.07 + d, 0.12 + d)));
    });
    var cin = seg(p, 0.14, 0.18);
    var cout = seg(p, 0.20, 0.245);
    setOpacity(cursorWrap, Math.max(0, cin - cout));

    /* ---- Phase 2 (0.20–0.40): wireframe blocks draw in, cascading ---- */
    draw(dHeader, easeOut(seg(p, 0.21, 0.27)));
    draw(dHero, easeOut(seg(p, 0.24, 0.30)));
    draw(dCard1, easeOut(seg(p, 0.28, 0.33)));
    draw(dCard2, easeOut(seg(p, 0.30, 0.35)));
    draw(dCard3, easeOut(seg(p, 0.32, 0.37)));

    /* ---- Phase 3 (0.40–0.60): blocks fill, copy drops in ---- */
    setFill(fHeader, easeOut(seg(p, 0.41, 0.46)));
    setFill(fHero, easeOut(seg(p, 0.43, 0.48)));
    setFill(fCard1, easeOut(seg(p, 0.46, 0.51)));
    setFill(fCard2, easeOut(seg(p, 0.48, 0.53)));
    setFill(fCard3, easeOut(seg(p, 0.50, 0.55)));
    textlines.forEach(function (el, i) {
      var d = i / textlines.length;
      setOpacity(el, easeOut(seg(p, 0.47 + d * 0.09, 0.53 + d * 0.09)));
    });

    /* ---- Phase 4 (0.60–0.80): grid guides, code brackets, snap to grid ---- */
    var snap = easeIO(seg(p, 0.60, 0.70));
    if (blocksGroup) blocksGroup.style.transform = 'translateY(' + (4 * (1 - snap)).toFixed(2) + 'px)';
    draw(dGuide1, easeOut(seg(p, 0.60, 0.68)));
    draw(dGuide2, easeOut(seg(p, 0.64, 0.71)));
    draw(dBracket, easeOut(seg(p, 0.70, 0.78)));

    /* ---- Phase 5 (0.80–1.00): responsive fan-out, launch pulse ---- */
    var mT = easeOut(seg(p, 0.80, 0.87));
    setOpacity(mobile, mT);
    if (mobile) mobile.style.transform = 'translate(' + (14 * (1 - mT)).toFixed(1) + 'px,0)';
    var tT = easeOut(seg(p, 0.84, 0.91));
    setOpacity(tablet, tT);
    if (tablet) tablet.style.transform = 'translate(' + (18 * (1 - tT)).toFixed(1) + 'px,0)';
    draw(dSpark, easeOut(seg(p, 0.86, 0.94)));
    var live = seg(p, 0.92, 0.98);
    setOpacity(pulse, live);
    setOpacity(pulseGlow, live * 0.5);
  }

  function raf(t) {
    if (lenis) lenis.raf(t);
    render();
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  addEventListener('resize', render);

  /* ---- jump links (phase pill row is display:none on touch, this covers desktop clicks if ever added) ---- */
  document.querySelectorAll('[data-build-jump]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = parseInt(btn.getAttribute('data-build-jump'), 10);
      var span = build.offsetHeight - window.innerHeight;
      var target = build.offsetTop + span * ((i + 0.45) / N);
      if (lenis) lenis.scrollTo(target, { duration: 1.4 });
      else scrollTo({ top: target, behavior: 'smooth' });
    });
  });
})();
