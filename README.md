# Design by Baxit — Website

Marketing site for **Design by Baxit** (spelled B-A-X-I-T), the studio of
**Abdul Basit**, a web developer with 8+ years building sites on Elementor and
WordPress, Shopify, Squarespace, and Wix.

The studio serves international clients, mainly in the United States. Three
service lines: web development, graphic design, and small-business automation.
A complete package can run from a logo, through a website, to a simple
automation. Quotes are agreed on WhatsApp.

Static HTML, no build step required to serve the site, no framework. Open the
folder on any web server and it runs.

---

## Pages

| File | Public URL | Purpose |
|------|------------|---------|
| `index.html` | `/` | Home — services, packages (starting prices in USD), how a project starts |
| `about.html` | `/about` | Abdul Basit, platforms, how the work is approached |
| `consultation.html` | `/consultation` | Free quote — WhatsApp first, short email form as backup, FAQ |
| `contact.html` | `/contact` | WhatsApp, email, hours (PKT, flexible for US meetings), backup form |
| `404.html` | (Cloudflare Pages) | Not-found page. Not listed in the sitemap |

There is no portfolio page. Do not add one until Abdul supplies real work.

Internal links use the `.html` file names so a local static server can resolve
them. Canonical URLs, Open Graph URLs, structured data, and `sitemap.xml` use
the clean paths Cloudflare Pages serves (no `.html`).

## Shared assets

| File | Purpose |
|------|---------|
| `tailwind.css` | Precompiled Tailwind plus the contents of `theme.css`. This is what pages load |
| `tailwind-input.css` | Source for that compile. Re-run the CLI if you add classes or edit `theme.css` |
| `theme.css` | Design tokens, component styles, motion, WhatsApp button |
| `theme.js` | Theme toggle, scroll reveal, hero interaction, form handling, anti-spam |
| `favicon.svg` | AB monogram — also the header and footer mark |
| `abdul-basit.jpg` | Founder photo used on the About page |
| `og-image.png` | Social share image |
| `sitemap.xml` | Clean URLs, `lastmod` updated with content changes |
| `llms.txt` | Plain-language summary for answer engines |
| `_headers` | Cloudflare Pages cache rules |

---

## Design system

A neutral, zero-saturation palette in the shadcn/ui token style, exposed as CSS
custom properties in `theme.css` and compiled into Tailwind utilities in
`tailwind.css`. That means `bg-background`, `text-muted-foreground`,
`border-border` and friends all work as normal Tailwind classes.

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

Tailwind is **not** loaded from a CDN. `tailwind.css` is committed. If you add
a class that is not already in that file, recompile and commit the output
(Tailwind CLI v4.3.3, matching the banner in `tailwind.css`):

```bash
npx --yes @tailwindcss/cli@4.3.3 -i tailwind-input.css -o tailwind.css --minify
```

There is still no build step in production. Cloudflare Pages publishes the
files as they are.

---

## Motion

Every animation moves only `transform` or `opacity`, so the compositor handles it
and nothing triggers layout or per-frame repaint.

- **Hero cursor grid glow** — a brighter copy of the grid, masked to a circle
  that follows the pointer via `--mx` / `--my`.
- **Headline word lift** — each word is individually hoverable and rises 4px.
- **Nav underline** — `scaleX` sweep, deliberately *not* an animated `width`.
- **Scroll reveal**, **header scroll state**, **hamburger → X morph**, **back-to-top**.

Pointer effects are gated behind `(hover: hover) and (pointer: fine)` so touch
devices get nothing and never end up with stuck `:hover` states. Everything is
disabled under `prefers-reduced-motion`.

Reveal-hiding is scoped to a `.js` class added at runtime, so if JavaScript fails
the page renders fully visible instead of blank.

---

## WhatsApp

Primary call to action. Number **+92 332 1975505**, click-to-chat
`https://wa.me/923321975505`.

Every page has a floating button. The hero, each service, and each package card
link to WhatsApp with a pre-filled message that names the page or the package.
The email forms on `/consultation` and `/contact` are the backup.

---

## Forms

Both forms post to [FormSubmit.co](https://formsubmit.co) and are delivered to
**designbybaxit@gmail.com**. The endpoint is built at runtime in `theme.js` rather
than sitting in a `form action`, so scrapers that harvest form targets find nothing.

> **Already activated.** FormSubmit's one-time email confirmation has been
> completed. Changing the destination address requires activating the new one.

Fields, on both forms: name, email, WhatsApp number (optional), service,
budget in USD, message. There is no gender field.

### Validation

Declared per field with `data-rule`, handled centrally in `theme.js`:

| Rule | Behaviour |
|------|-----------|
| `required` | Must not be empty |
| `email` | Any well-formed address, personal or business domain |
| `phone` | If a value is present, 7–15 digits after stripping punctuation |

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

Then open <http://localhost:8000>. Links such as `/about.html` resolve.
Clean URLs such as `/about` do not, unless the server rewrites them the way
Cloudflare Pages does.

---

## Deploying

The live site is **Cloudflare Pages**, deployed from the `main` branch. The
project root is the site root. There is **no build command** and no framework
preset — Pages publishes the HTML, CSS, and images as committed.

Pretty URLs are part of Pages: `about.html` is also served at `/about` (and
likewise for the other pages). Canonical links and `sitemap.xml` use those
clean URLs. `404.html` is the not-found page Pages serves automatically.

`_headers` sets cache lifetimes. HTML is revalidated immediately. `tailwind.css`
and `theme.js` cache for a day because their filenames are not hashed.

### www → apex

A `_redirects` file **cannot** send `www.designbybaxit.com` to
`designbybaxit.com`. Pages redirects are path-only, on the same host. Set the
host redirect in Cloudflare:

1. DNS: `www` as a proxied CNAME to the Pages hostname (or to the apex, if the
   zone already flattens it).
2. Redirect Rule (or Bulk Redirect): if hostname equals `www.designbybaxit.com`,
   301 to `https://designbybaxit.com` plus the original path and query.

Do not add a fake www rule to `_redirects`. It will not run.

Serving over https is what makes the forms functional. WhatsApp links work
either way.

---

## Making changes

| Change | Where |
|--------|-------|
| Colours, spacing, radius | `:root` and `.light` in `theme.css`, then recompile `tailwind.css` |
| New Tailwind classes | HTML, then recompile `tailwind.css` and commit it |
| WhatsApp number or pre-filled text | The `wa.me` links in each page. Keep the message specific to the page or package |
| Starting prices | `#packages` on `index.html`, the short cards on `consultation.html`, structured data, `llms.txt` |
| Delivery address | `INBOX` in `theme.js` — **needs re-activation** |
| Bot thresholds | `MIN_FILL_SECONDS`, `COOLDOWN_MS`, `MAX_LINKS` in `theme.js` |
| Contact details | `contact.html` |
| Logo mark | `favicon.svg`, plus the `AB` span in each header and footer |
| Sitemap dates | `lastmod` in `sitemap.xml` when public copy changes |

### Prices

Abdul set the relaunch starting prices (the studio has no public portfolio yet):

- Starter — from $499 (logo and a one-page site)
- Business — from $1,200 (logo, brand kit, 4–5 page site, WhatsApp setup)
- Complete Launch — from $2,500 (Business, plus automation setup, launch graphics, and 1 month of support after launch)

Add-ons start from $99. The rest are about 0.35 of the previous add-on prices, rounded, and never below $99. The page says the real quote is confirmed on WhatsApp. Update the packages section, the quote-page cards, both budget selects, the JSON-LD `minPrice` values, and `llms.txt` together if the numbers change.

---

## Redesign: "Bold Colour" (branch `redesign-bold`, preview only)

One of three alternative styles (the others are `redesign-3d`, dark neon, and
`redesign-light`, clean and light). Same pages, same copy, same prices.
Still static, still no build step. Preview: https://redesign-bold.new-ck7.pages.dev

| File | Purpose |
|------|---------|
| `fx.css` | Cream + ink base with a bright multi-colour palette (overrides the tokens), chunky Bricolage Grotesque type, sticker-style accent words, cards and buttons with thick ink borders and hard offset shadows, springy reveals, hover wobbles/jelly icons, tilted marquee band, colour stat tiles, care plans, portfolio placeholders, reduced-motion rules |
| `fx.js` | Gives each card its own colour, rainbow scroll progress, staggered springy reveals, count-up stats with overshoot, lazy-loads `hero3d.js` only when WebGL is available and Save-Data is off |
| `hero3d.js` | Three.js (r160 from jsDelivr, ES module) hero: glossy candy blobs that wobble (GPU vertex displacement), donut, star, squiggle and a bouncing ball. Spring toward the pointer with overshoot, hovered pieces jiggle and swell, click/tap the hero to make them all bounce. Pauses off-screen / hidden tab, one still frame under `prefers-reduced-motion` |

- If WebGL is unavailable, the CSS `.fx-orb` (a morphing blob and bouncing ball drawn in CSS) stays as a fallback.
- The rotating "Free quote on WhatsApp" sticker in the home hero (`.fx-spin-badge`) links to WhatsApp; hidden below 1024px.
- Light only in this design (the theme toggle is hidden).
- `#work` on the home page is **placeholder only** — replace the three `.work-card` blocks with real projects (`data-placeholder` marks them).
- `#care` lists the monthly care plans ($99/mo for 2 edit hours, $149/mo for 4 edit hours).
- Fonts: Bricolage Grotesque and DM Sans from Google Fonts (`display=swap`).

---

## Contact

**Abdul Basit** — Founder & Web Developer, Design by Baxit
· [WhatsApp +92 332 1975505](https://wa.me/923321975505)
· [designbybaxit@gmail.com](mailto:designbybaxit@gmail.com)
