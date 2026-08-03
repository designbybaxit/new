/* ============================================================
   Design by Baxit — Tailwind token bridge + site behaviour
   ============================================================ */

tailwind.config = {
  darkMode: 'class',
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1200px' } },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        serif: 'var(--font-serif)'
      }
    }
  }
};

/* ---- Theme preference (applied before paint to avoid a flash) ---- */
(function () {
  document.documentElement.classList.add('js');
  try {
    if (localStorage.getItem('dbb-theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) { /* storage blocked — stay on the dark default */ }
})();

function revealAll() {
  document.querySelectorAll('.reveal').forEach(function (el) {
    el.classList.add('is-visible');
  });
}

var revealObserver = null;
var observerHasFired = false;

function initReveal() {
  if (!('IntersectionObserver' in window)) { revealAll(); return; }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          observerHasFired = true;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  }

  /* Safe to re-run: already-revealed nodes are skipped, and re-observing
     a node the observer already tracks is a no-op. */
  document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
    revealObserver.observe(el);
  });
}

function initPage() {
  /* ---- Theme toggle ---- */
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      var isLight = document.documentElement.classList.toggle('light');
      try { localStorage.setItem('dbb-theme', isLight ? 'light' : 'dark'); } catch (e) {}
    });
  });

  /* ---- Mobile menu ---- */
  var menuBtn = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  if (menuBtn && menu && !menuBtn.dataset.bound) {
    menuBtn.dataset.bound = '1';
    menuBtn.addEventListener('click', function () {
      var closed = menu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!closed));
    });
  }

  initReveal();
  initHero();
  initChrome();

  /* ---- Forms ---- */
  document.querySelectorAll('form[data-validate]').forEach(function (form) {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    setupForm(form);
  });
}

document.addEventListener('DOMContentLoaded', initPage);
window.addEventListener('load', initPage);

/* ============================================================
   Site chrome — header scroll state and back-to-top

   One passive scroll listener drives both, throttled into a single
   rAF so a fast scroll can't queue up redundant class writes.
   ============================================================ */
function initChrome() {
  var header = document.querySelector('.site-header');
  var toTop = document.querySelector('[data-back-to-top]');
  if (!header && !toTop) return;
  if (document.body.dataset.chromeBound) return;
  document.body.dataset.chromeBound = '1';

  var queued = false;

  function update() {
    queued = false;
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
  }

  window.addEventListener('scroll', function () {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();

  if (toTop) {
    toTop.addEventListener('click', function () {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }
}

/* ============================================================
   Hero interaction

   Splits the headline into hoverable words and drives the cursor
   spotlight. The pointer handler does no layout reads — the hero's
   geometry is measured once on enter and invalidated on resize or
   scroll — and writes are batched into a single rAF frame.
   ============================================================ */

/* Wraps each word of the headline in its own span so words can lift
   individually. Existing elements (the serif accent) are preserved and
   simply made hoverable rather than being torn apart. */
function wrapHeadlineWords(heading) {
  if (!heading || heading.dataset.wrapped) return;
  heading.dataset.wrapped = '1';

  Array.prototype.slice.call(heading.childNodes).forEach(function (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
          return;
        }
        var span = document.createElement('span');
        span.className = 'hero-word';
        span.textContent = part;
        frag.appendChild(span);
      });
      heading.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add('hero-word');
    }
  });
}

function initHero() {
  var heroes = document.querySelectorAll('.hero');
  if (!heroes.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  Array.prototype.forEach.call(heroes, function (hero) {
    wrapHeadlineWords(hero.querySelector('h1'));

    /* Word lift is pure CSS and costs nothing; the pointer-tracked
       layer is skipped entirely on touch and reduced-motion. */
    if (reduced || !finePointer) return;

    var spot = hero.querySelector('.spotlight');
    if (!spot || hero.dataset.heroBound) return;
    hero.dataset.heroBound = '1';

    var grid = hero.querySelector('.grid-bg');
    var rect = null;
    var x = 0, y = 0;
    var queued = false;

    function draw() {
      queued = false;
      spot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (grid && rect) {
        var dx = (x / rect.width - 0.5) * -10;
        var dy = (y / rect.height - 0.5) * -10;
        grid.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
      }
    }

    hero.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse') return;
      rect = hero.getBoundingClientRect();
      hero.classList.add('is-live');
    });

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (!rect) rect = hero.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
      if (!queued) {
        queued = true;
        requestAnimationFrame(draw);
      }
    });

    hero.addEventListener('pointerleave', function () {
      hero.classList.remove('is-live');
      if (grid) grid.style.transform = '';
    });

    /* Cached geometry goes stale when the page moves under the cursor. */
    var invalidate = function () { rect = null; };
    window.addEventListener('resize', invalidate);
    window.addEventListener('scroll', invalidate, { passive: true });
  });
}

/* Last-resort guarantee: if the observer never reports (e.g. the DOM was
   swapped out from under it), show everything rather than leave the page blank. */
window.setTimeout(function () {
  if (!observerHasFired) revealAll();
}, 1800);

/* Accepts any well-formed address — personal or business domain. */
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ============================================================
   Delivery — FormSubmit.co (AJAX endpoint, returns JSON)

   The address is assembled at runtime rather than written as a
   literal, so the inbox never appears as a harvestable string in
   the page source. The endpoint is likewise never in the form's
   `action` attribute — scrapers that collect form actions find
   nothing to POST to.
   ============================================================ */
var INBOX = ['designbybaxit', 'gmail.com'].join('@');
var FORM_ENDPOINT = 'https://formsubmit.co/ajax/' + INBOX;

/* ---- Bot defences (see README notes in the summary) ---- */
var MIN_FILL_SECONDS = 4;      /* humans never complete these forms faster */
var COOLDOWN_MS = 45000;       /* per-browser gap between two submissions */
var MAX_LINKS = 2;             /* link-stuffing is the classic spam signature */

function countLinks(text) {
  var m = String(text).match(/https?:\/\/|www\.|\[url|<a\s/gi);
  return m ? m.length : 0;
}

function cooldownRemaining() {
  try {
    var last = parseInt(localStorage.getItem('dbb-last-submit') || '0', 10);
    var elapsed = Date.now() - last;
    return elapsed < COOLDOWN_MS ? Math.ceil((COOLDOWN_MS - elapsed) / 1000) : 0;
  } catch (e) { return 0; }
}

function markSubmitted() {
  try { localStorage.setItem('dbb-last-submit', String(Date.now())); } catch (e) {}
}

function setupForm(form) {
  var success = form.querySelector('[data-success]');
  var failure = form.querySelector('[data-formerror]');
  var button = form.querySelector('button[type=submit]');
  var buttonLabel = button ? button.innerHTML : '';

  /* Timestamp the moment the form became interactive — the time trap
     compares against this. */
  form.dataset.readyAt = String(Date.now());

  function fieldWrap(el) { return el.closest('[data-field]') || el.parentElement; }

  function showBanner(el, message) {
    if (!el) return;
    if (message) el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideBanners() {
    if (success) success.classList.add('hidden');
    if (failure) failure.classList.add('hidden');
  }

  function setBusy(isBusy) {
    if (!button) return;
    button.disabled = isBusy;
    button.classList.toggle('is-busy', isBusy);
    button.innerHTML = isBusy ? 'Sending…' : buttonLabel;
  }

  function setError(el, message) {
    var msg = fieldWrap(el).querySelector('[data-error]');
    el.classList.add('invalid');
    el.setAttribute('aria-invalid', 'true');
    if (msg) { msg.textContent = message; msg.classList.remove('hidden'); }
  }

  function clearError(el) {
    var msg = fieldWrap(el).querySelector('[data-error]');
    el.classList.remove('invalid');
    el.removeAttribute('aria-invalid');
    if (msg) { msg.textContent = ''; msg.classList.add('hidden'); }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideBanners();

    var fields = Array.prototype.slice.call(
      form.querySelectorAll('input[data-rule], select[data-rule], textarea[data-rule]')
    );
    fields.forEach(clearError);

    var firstBad = null;

    fields.forEach(function (el) {
      var rules = (el.dataset.rule || '').split('|');
      var value = (el.value || '').trim();
      var label = el.dataset.label || 'This field';
      var problem = null;

      if (rules.indexOf('required') !== -1 && !value) {
        problem = el.tagName === 'SELECT'
          ? 'Please choose an option.'
          : 'Please enter your ' + label.toLowerCase() + '.';
      } else if (value && rules.indexOf('email') !== -1 && !EMAIL_RE.test(value)) {
        problem = 'Please enter a valid email address.';
      } else if (value && rules.indexOf('phone') !== -1) {
        var digits = value.replace(/[^0-9]/g, '');
        if (digits.length < 7 || digits.length > 15) problem = 'Please enter a valid phone number.';
      }

      if (problem) {
        setError(el, problem);
        if (!firstBad) firstBad = el;
      }
    });

    if (firstBad) {
      firstBad.focus();
      return;
    }

    /* ---------- Bot gate 1: honeypot ----------
       An off-screen field no human ever sees. Bots fill every input
       they find, so any value here means it isn't a person. We report
       success so the bot moves on, but nothing is sent. */
    var honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value.trim() !== '') {
      showBanner(success);
      form.reset();
      return;
    }

    /* ---------- Bot gate 2: time trap ----------
       Scripted submissions fire near-instantly; a person filling six
       fields cannot. */
    var seconds = (Date.now() - parseInt(form.dataset.readyAt || '0', 10)) / 1000;
    if (seconds < MIN_FILL_SECONDS) {
      showBanner(failure, 'That was submitted a little too quickly. Please take a moment and try again.');
      return;
    }

    /* ---------- Bot gate 3: link stuffing ---------- */
    var longText = form.querySelector('textarea');
    if (longText && countLinks(longText.value) > MAX_LINKS) {
      showBanner(failure, 'Your message contains too many links. Please remove some and try again.');
      return;
    }

    /* ---------- Bot gate 4: per-browser cooldown ---------- */
    var wait = cooldownRemaining();
    if (wait > 0) {
      showBanner(failure, 'You have just sent a message. Please wait ' + wait + ' seconds before sending another.');
      return;
    }

    /* ---------- Send ---------- */
    var payload = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === '_honey' || el.type === 'submit') return;
      payload[el.name] = el.value;
    });

    payload._subject = form.dataset.subject || 'New website enquiry — Design by Baxit';
    payload._template = 'table';
    payload._captcha = 'false';
    if (payload.email) payload._replyto = payload.email;

    setBusy(true);

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.message || 'Request failed');
          return data;
        });
      })
      .then(function () {
        markSubmitted();
        showBanner(success);
        form.reset();
        form.dataset.readyAt = String(Date.now());
      })
      .catch(function () {
        showBanner(
          failure,
          'Sorry — we could not send that just now. Please email us directly at ' + INBOX + '.'
        );
      })
      .then(function () { setBusy(false); });
  });
}
