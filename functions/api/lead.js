/* Cloudflare Pages Function: POST /api/lead
   Env vars: RESEND_API_KEY (secret, required for Resend), LEAD_TO_EMAIL, FROM_EMAIL (optional).
   With RESEND_API_KEY: emails the lead notification to designbybaxit@gmail.com and an instant
   plain-text thank-you to the lead (reply-to designbybaxit@gmail.com), then redirects to /thanks/.
   Without RESEND_API_KEY (or if the Resend notification fails) the lead is forwarded to FormSubmit. */

const FORMSUBMIT_INBOX = 'designbybaxit@gmail.com';
const INDUSTRIES = ['home-services', 'salon', 'restaurant', 'clinic', 'real-estate', 'law-firm'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REPLY_TO = 'designbybaxit@gmail.com';
// CAN-SPAM: replace with a real mailing address (street address or PO box) before launch.
const POSTAL_ADDRESS = '[POSTAL ADDRESS PLACEHOLDER — add a mailing address before launch]';

const clean = (v, max = 500) => String(v || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const back = (origin, path) => Response.redirect(new URL(path, origin).toString(), 303);

export async function onRequestPost({ request, env, waitUntil }) {
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
    try { sent = await sendResend(env, lead, { waitUntil }); } catch (e) { console.error('RESEND_EXCEPTION', String(e)); sent = false; }
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
  if (!r.ok) {
    // Logged without the key. 403 "domain is not verified" means Resend domain setup is unfinished.
    const detail = await r.text().catch(() => '');
    console.error('RESEND_SEND_FAILED', r.status, detail.slice(0, 300));
  }
  return r.ok;
}

async function sendResend(env, lead, ctx) {
  // Notification and auto-reply both come from an address on the Resend-verified domain.
  const from = env.FROM_EMAIL || 'Abdul at Design by Baxit <hello@designbybaxit.com>';
  const to = env.LEAD_TO_EMAIL || FORMSUBMIT_INBOX;
  const table = rows(lead).map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('');

  const notified = await resend(env, {
    from, to: [to], reply_to: lead.email,
    subject: `New mockup lead: ${lead.business} (${lead.industry})`,
    html: `<h2>New free-mockup lead</h2><table>${table}</table>`,
    text: rows(lead).map(([k, v]) => `${k}: ${v}`).join('\n'),
  });
  if (!notified) return false;

  // Instant plain-text thank-you to the lead. Runs after the redirect is returned
  // (waitUntil), and a failure here never loses the lead: the notification is already sent.
  const reply = resend(env, {
    from, to: [lead.email], reply_to: REPLY_TO,
    subject: 'Thanks! Your free homepage mockup is on the way',
    text: thankYouText(lead),
  }).catch(() => false);
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(reply); else await reply;
  return true;
}

function thankYouText(lead) {
  return [
    `Hi ${lead.business} team,`,
    '',
    'Thanks for requesting a free homepage mockup from Design by Baxit. I have your details and I am on it.',
    '',
    'Your mockup will arrive by email in 2 to 3 business days.',
    '',
    'If you have a logo and brand colours, just reply to this email with them and I will use them in your mockup. No logo yet? No problem, I will design around your business name.',
    '',
    'Thanks,',
    'Abdul',
    'Design by Baxit',
    'https://designbybaxit.com',
    '',
    '--',
    'You are receiving this one-time email because you requested a free mockup at designbybaxit.com.',
    `Design by Baxit, ${POSTAL_ADDRESS}`,
    'To stop hearing from us, reply with "unsubscribe" and we will not email you again.',
  ].join('\n');
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
