# Design by Baxit — Website

Marketing site for **Design by Baxit**, a brand design and growth marketing studio
founded by Abdul Basit.

Four static pages, no build step, no framework. Open the folder on any web server
and it runs.

**Tagline:** *less noise, more growth*

---

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — hero, stats, six services, three-step process, CTA |
| `about.html` | Founder story, studio principles, approach |
| `consultation.html` | Free consultation — what's included, how the session runs, booking form, FAQ |
| `contact.html` | Contact details and enquiry form |

## Shared assets

| File | Purpose |
|------|---------|
| `theme.css` | Design tokens, component styles, all motion |
| `theme.js` | Tailwind token bridge, theme toggle, scroll reveal, hero interaction, form handling |
| `favicon.svg` | AB monogram — also the header and footer mark |
| `abdul-basit.jpg` | Founder photo used on the About page |

---

## Design system

A neutral, zero-saturation palette in the shadcn/ui token style, exposed as CSS
custom properties in `theme.css` and bridged into Tailwind utilities in `theme.js`.
That means `bg-background`, `text-muted-foreground`, `border-border` and friends all
work as normal Tailwind classes.

| Token | Dark (default) | Light |
|-------|----------------|-------|
| `--background` | `0 0% 3.9%` | `0 0% 100%` |
| `--foreground` | `0 0% 98%` | `0 0% 3.9%` |
| `--card` | `0 0% 9%` | `0 0% 100%` |
| `--primary` | `0 0% 89.8%` | `0 0% 9%` |
| `--muted-foreground` | `0 0% 63%` | `0 0% 45.1%` |
| `--border` | `0 0% 15.5%` | `0 0% 89.8%` |
| `--radius` | `0.625rem` | — |

**Typography.** Bold system sans with tight tracking for headings, plus the
signature move: a *serif italic* accent word inside each headline (`.accent`).

**Theme toggle.** Dark by default. Light mode is the `.light` class on `<html>`,
persisted to `localStorage` under `dbb-theme` and applied before first paint so
there's no flash.

Tailwind is loaded from the CDN, which is fine for a site this size. If it ever
grows, switch to a build step so unused utilities are stripped.

---

## Motion

Every animation moves only `transform` or `opacity`, so the compositor handles it
and nothing triggers layout or per-frame repaint.

- **Hero cursor spotlight** — a soft light tracking the mouse. A fixed-size element
  moved with `translate3d`, never a re-rendered gradient. Hero geometry is measured
  once on pointer-enter and cached, so there are no layout reads per frame.
- **Grid parallax** — the background grid drifts up to 5px against the cursor.
- **Headline word lift** — each word is individually hoverable and rises 4px.
- **Nav underline** — `scaleX` sweep, deliberately *not* an animated `width`.
- **Scroll reveal**, **header scroll state**, **hamburger → X morph**, **back-to-top**.

Pointer effects are gated behind `(hover: hover) and (pointer: fine)` so touch
devices get nothing and never end up with stuck `:hover` states. Everything is
disabled under `prefers-reduced-motion`.

Reveal-hiding is scoped to a `.js` class added at runtime, so if JavaScript fails
the page renders fully visible instead of blank.

---

## Forms

Both forms post to [FormSubmit.co](https://formsubmit.co) and are delivered to
**designbybaxit@gmail.com**. The endpoint is built at runtime in `theme.js` rather
than sitting in a `form action`, so scrapers that harvest form targets find nothing.

> **Already activated.** FormSubmit's one-time email confirmation has been
> completed. Changing the destination address requires activating the new one.

### Validation

Declared per field with `data-rule`, handled centrally in `theme.js`:

| Rule | Behaviour |
|------|-----------|
| `required` | Must not be empty |
| `email` | Any well-formed address, personal or business domain |
| `phone` | 7–15 digits after stripping punctuation |

### Bot protection

Four independent gates, all client-side, all before any network request:

1. **Honeypot** — a `_honey` field positioned off-screen, `tabindex="-1"` and
   `aria-hidden`. Unreachable by mouse, keyboard or screen reader; bots fill it.
   Trips → success is shown, nothing is sent.
2. **Time trap** — submissions faster than **4 seconds** are rejected.
3. **Link stuffing** — more than **2 URLs** in the message body is rejected.
4. **Cooldown** — **45 seconds** minimum between submissions per browser.

Tuning constants live at the top of the form section in `theme.js`:
`MIN_FILL_SECONDS`, `COOLDOWN_MS`, `MAX_LINKS`.

If a send fails, the visitor's input is preserved and the cooldown is not consumed,
so they can retry immediately.

---

## Running it locally

**The forms will not work from `file://`.** FormSubmit rejects requests without a
proper `Origin`/`Referer` header and responds:

> Make sure you open this page through a web server, FormSubmit will not work in
> pages browsed as HTML files.

So don't double-click `index.html` — serve it:

```bash
cd "path/to/this/folder"
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

---

## Deploying

The repo root contains `index.html`, so GitHub Pages serves it with no
configuration:

**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**

Live within a minute or two. Netlify and Vercel work equally well — drag the folder
in, no build command needed.

Serving over https is what makes the forms functional.

---

## Making changes

| Change | Where |
|--------|-------|
| Colours, spacing, radius | `:root` and `.light` in `theme.css` |
| Spotlight intensity | `.hero .spotlight` gradient alpha (`0.10`) in `theme.css` |
| Hero eyebrow emoji | The `.eyebrow-emoji` span in each page's hero |
| Delivery address | `INBOX` in `theme.js` — **needs re-activation** |
| Bot thresholds | `MIN_FILL_SECONDS`, `COOLDOWN_MS`, `MAX_LINKS` in `theme.js` |
| Contact details | `contact.html` — the four cards below the hero |
| Logo mark | `favicon.svg`, plus the `AB` span in each header and footer |

### Known placeholder

The **Availability** card on `contact.html` reads *"Mon–Fri, 9am – 6pm. Weekend
calls by arrangement."* Those hours are a placeholder and carry no timezone —
worth setting to real hours in PKT.

---

## Contact

**Abdul Basit** — Founder
· [designbybaxit@gmail.com](mailto:designbybaxit@gmail.com)
· [+92 332 1975505](tel:+923321975505)
