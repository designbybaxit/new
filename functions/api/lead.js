/* Cloudflare Pages Function: POST /api/lead
   Env vars: RESEND_API_KEY, LEAD_TO_EMAIL, FROM_EMAIL.
   Without RESEND_API_KEY (or if Resend fails) the lead is forwarded to FormSubmit. */

const FORMSUBMIT_INBOX = 'designbybaxit@gmail.com';
const INDUSTRIES = ['home-services', 'salon', 'restaurant', 'clinic', 'real-estate', 'law-firm'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTAL_ADDRESS = '[POSTAL ADDRESS PLACEHOLDER — add a mailing address before launch]';

const clean = (v, max = 500) => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const back = (origin, path) => Response.redirect(new URL(path, origin).toString(), 303);

export async function onRequestPost({ request, env }) {
  const origin = new URL(request.url).origin;
  let form;
  try { form = await request.formData(); } catch { return back(origin, '/'); }

  const industry = INDUSTRIES.includes(form.get('industry')) ? form.get('industry') : 'other';
  const retry = industry === 'other' ? '/' : `/mockup/${industry}/`;

  // Honeypot: bots fill the hidden field. Pretend success, send nothing.
  if (clean(form.get('company_url'))) return back(origin, `/thanks/?industry=${industry}`);

  const lead = {
    business: clean(form.get('business'), 120),
    email: clean(form.get('email'), 160),
    website: clean(form.get('website'), 200),
    goal: clean(form.get('goal'), 1000),
    industry,
    utm_source: clean(form.get('utm_source'), 100),
    utm_campaign: clean(form.get('utm_campaign'), 100),
    utm_content: clean(form.get('utm_content'), 100),
    page: clean(request.headers.get('referer'), 300),
  };

  const links = (lead.goal.match(/https?:\/\/|www\./gi) || []).length;
  if (!lead.business || !EMAIL_RE.test(lead.email) || !lead.goal || links > 2) {
    return back(origin, `${retry}?error=1#get-mockup`);
  }

  let sent = false;
  if (env.RESEND_API_KEY) {
    try { sent = await sendResend(env, lead); } catch { sent = false; }
  }
  let fs = '';
  if (!sent) {
    try { fs = await sendFormSubmit(lead, origin); sent = fs === 'ok'; } catch (e) { fs = 'exception'; }
  }
  if (!sent) {
    // Last resort: the lead stays readable in Cloudflare Pages > Functions > Real-time logs.
    // FormSubmit often rate-limits Cloudflare's shared egress IPs (HTTP 429), so hand the
    // lead to the visitor's browser and let it post to FormSubmit directly instead.
    console.error('LEAD_SERVER_DELIVERY_FAILED', fs, JSON.stringify(lead));
    return browserRelay(lead, origin);
  }
  return back(origin, `/thanks/?industry=${industry}`);
}

export const onRequestGet = ({ request }) => back(new URL(request.url).origin, '/');

function rows(lead) {
  return [
    ['Business', lead.business], ['Email', lead.email], ['Current website', lead.website || '—'],
    ['Industry', lead.industry], ['Main goal', lead.goal], ['utm_source', lead.utm_source || '—'],
    ['utm_campaign', lead.utm_campaign || '—'], ['utm_content', lead.utm_content || '—'], ['Page', lead.page || '—'],
  ];
}

async function resend(env, body) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.ok;
}

async function sendResend(env, lead) {
  const from = env.FROM_EMAIL || 'Design by Baxit <hello@designbybaxit.com>';
  const to = env.LEAD_TO_EMAIL || FORMSUBMIT_INBOX;
  const table = rows(lead).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('');

  const notified = await resend(env, {
    from, to: [to], reply_to: lead.email,
    subject: `New mockup lead: ${lead.business} (${lead.industry})`,
    html: `<h2>New free-mockup lead</h2><table>${table}</table>`,
    text: rows(lead).map(([k, v]) => `${k}: ${v}`).join('\n'),
  });
  if (!notified) return false;

  // Auto-reply. A failure here should not lose the lead (notification already sent).
  const first = esc(lead.business);
  await resend(env, {
    from, to: [lead.email], reply_to: to,
    subject: 'Your free website mockup is on the way',
    html: `<p>Hi ${first} team,</p>
<p>Thanks for asking for a free website mockup. I've got your details and I'm on it.</p>
<p>You'll get your mockup by email within <b>2 to 3 business days</b>. There's nothing to pay and nothing you need to do in the meantime. If you want to add anything (photos, a logo, sites you like), just reply to this email.</p>
<p>Abdul Basit<br>Design by Baxit · <a href="https://designbybaxit.com">designbybaxit.com</a></p>
<hr><p style="font-size:12px;color:#666">You're receiving this because you requested a mockup at designbybaxit.com.<br>Design by Baxit, ${POSTAL_ADDRESS}<br>Don't want more emails? Reply with "unsubscribe" and you won't hear from us again.</p>`,
    text: `Hi ${lead.business} team,\n\nThanks for asking for a free website mockup. I've got your details and I'm on it.\n\nYou'll get your mockup by email within 2 to 3 business days. Nothing to pay. Reply to this email to add anything (photos, logo, sites you like).\n\nAbdul Basit\nDesign by Baxit · https://designbybaxit.com\n\n--\nYou're receiving this because you requested a mockup at designbybaxit.com.\nDesign by Baxit, ${POSTAL_ADDRESS}\nDon't want more emails? Reply "unsubscribe".`,
  });
  return true;
}

async function sendFormSubmit(lead, origin) {
  const payload = Object.fromEntries(rows(lead));
  payload._subject = `New mockup lead: ${lead.business} (${lead.industry})`;
  payload._replyto = lead.email;
  payload._template = 'table';
  payload._captcha = 'false';
  const r = await fetch(`https://formsubmit.co/ajax/${FORMSUBMIT_INBOX}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: origin, Referer: `${origin}/` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) return `http-${r.status}`;
  const j = await r.json().catch(() => ({}));
  // FormSubmit answers success:"true"/"false". First use from a new domain returns an
  // activation notice (an email with an "Activate Form" link) and does NOT deliver the lead.
  if (String(j.success) === 'true') return 'ok';
  return /activat/i.test(j.message || '') ? 'needs-activation' : 'rejected';
}

function browserRelay(lead, origin) {
  const fields = { ...Object.fromEntries(rows(lead)),
    _subject: `New mockup lead: ${lead.business} (${lead.industry})`, _replyto: lead.email,
    _template: 'table', _captcha: 'false', _next: `${origin}/thanks/?industry=${lead.industry}` };
  const inputs = Object.entries(fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(String(v))}">`).join('');
  const page = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Sending…</title></head>
<body style="font-family:system-ui,sans-serif;background:#fff6e9;color:#17141f;padding:40px;text-align:center">
<form id="r" method="POST" action="https://formsubmit.co/${FORMSUBMIT_INBOX}">${inputs}<p>Sending your request…</p><noscript><button type="submit">Tap to finish sending</button></noscript></form>
<script>document.getElementById('r').submit()</script></body></html>`;
  return new Response(page, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
