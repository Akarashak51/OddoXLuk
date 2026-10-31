/* Public website: home page, about, contact, security and the legal pages — all with a shared header and footer. */
import { api } from '../api.js';
import { html, raw, setHTML, $, $$, LOGO, field, formData, showErrors, clientValidate, toast } from '../ui.js';
import { themeBtn } from '../theme.js';
import { icon, step1, step2, step3, step4, artFinance, artStaff, artCustomer } from '../art.js';
import { DOCS, legalBody, toc } from './legal.js';

export const LANDING = { '/': '', '/features': 'features', '/how-it-works': 'how-it-works', '/pricing': 'pricing', '/faq': 'faq' };
const YEAR = 2026;

/* ---------- header + footer ---------- */
const header = ctx => html`<header class="pub-head"><div class="pub-head-in">
  <a class="brand" href="#/" aria-label="Brightloop home">${raw(LOGO)}Brightloop</a>
  <nav class="pub-nav" id="pubnav" aria-label="Main">
    <a href="#/features">Features</a><a href="#/how-it-works">How it works</a><a href="#/pricing">Plans</a><a href="#/faq">FAQ</a><a href="#/about">About</a><a href="#/contact">Contact</a>
  </nav>
  <div class="pub-act">${themeBtn}${ctx.session.user
    ? html`<a class="btn primary" href="#/dashboard">Open dashboard ${raw(icon('arrow', 16))}</a>`
    : html`<a class="btn ghost" href="#/login">Log in</a><a class="btn primary" href="#/signup">Get started</a>`}
    <button type="button" class="icon-btn burger" id="pubburger" aria-label="Menu" aria-expanded="false">${raw(icon('menu'))}</button></div>
</div></header>`;

const footer = () => html`<footer class="pub-foot"><div class="foot-in"><div class="foot-g">
  <div><a class="brand" href="#/">${raw(LOGO)}Brightloop</a><p class="d">Plans, subscriptions, invoices and payments in one calm place — so every renewal is billed on time.</p></div>
  <div><h4>Product</h4><ul><li><a href="#/features">Features</a></li><li><a href="#/how-it-works">How it works</a></li><li><a href="#/pricing">Example plans</a></li><li><a href="#/faq">FAQ</a></li></ul></div>
  <div><h4>Company</h4><ul><li><a href="#/about">About</a></li><li><a href="#/contact">Contact us</a></li><li><a href="#/security">Security</a></li></ul></div>
  <div><h4>Legal</h4><ul><li><a href="#/terms">Terms of Service</a></li><li><a href="#/privacy">Privacy Policy</a></li><li><a href="#/cookies">Cookies &amp; storage</a></li></ul></div>
  <div><h4>Account</h4><ul><li><a href="#/signup">Create account</a></li><li><a href="#/login">Log in</a></li><li><a href="#/forgot">Forgot password</a></li></ul></div>
</div><div class="foot-b"><span>© ${YEAR} Brightloop. All rights reserved.</span><nav aria-label="Legal"><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a><a href="#/cookies">Cookies</a><a href="#/contact">Contact</a></nav><button type="button" class="totop" data-top>↑ Back to top</button></div></div></footer>`;

/* ---------- shared behaviour: reveal, counters, tabs, menu ---------- */
function fx(root) {
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.dataset.count != null) count(e.target);
  }), { threshold: .15 }) : null;
  $$('.rv,[data-count]', root).forEach(el => io ? io.observe(el) : (el.classList.add('in'), el.dataset.count != null && (el.textContent = el.dataset.count)));
}
function count(el) {
  const to = +el.dataset.count, t0 = performance.now(), dur = 1300;
  const tick = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function wire(root) {
  root.onclick = e => {
    if (e.target.closest('#pubburger')) { const n = $('#pubnav'), o = n.classList.toggle('open'); $('#pubburger').setAttribute('aria-expanded', o); return; }
    if (e.target.closest('#pubnav a')) $('#pubnav')?.classList.remove('open');
    const g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); document.getElementById(g.dataset.goto)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (e.target.closest('[data-top]')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const tab = e.target.closest('[data-aud]');
    if (tab) {
      $$('[data-aud]', root).forEach(b => b.setAttribute('aria-selected', String(b === tab)));
      $$('.aud-p', root).forEach(p => p.classList.toggle('on', p.id === 'aud-' + tab.dataset.aud));
    }
  };
}
export function mount(app, ctx, inner, section) {
  setHTML(app, html`<div class="pub">${header(ctx)}<main id="pub-main">${inner}</main>${footer()}</div>`);
  wire(app); fx(app);
  const t = section && document.getElementById(section);
  t ? t.scrollIntoView({ block: 'start' }) : window.scrollTo(0, 0);
}
export const scrollToSection = id => id ? document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : window.scrollTo({ top: 0, behavior: 'smooth' });

/* ---------- landing page ---------- */
const FEATURES = [
  ['loop', 'Plans & pricing', 'Daily to yearly cycles, minimum quantities, availability dates, and per-plan rules for pausing, renewing and closing.'],
  ['template', 'Subscription lifecycle', 'Draft → Quotation → Confirmed → Active → Closed, with quotation templates that expire on schedule.'],
  ['invoice', 'Automatic invoicing', 'Invoices are generated from subscriptions. A database rule makes double billing impossible, and missed cycles are caught up.'],
  ['discount', 'Taxes & discounts', 'Fixed or percentage discounts with minimums, dates and usage limits. Taxes come from the product or plan.'],
  ['card', 'Payments', 'Record cash, card, bank transfer, UPI or cheque against an invoice. Part-payments work; over-payment is blocked.'],
  ['chart', 'Finance dashboard', 'Active subscriptions, recurring revenue, collected, owed and overdue — filterable by date, with a 6-month trend.'],
  ['shield', 'Roles & permissions', 'Admin, staff and customer roles. Only an admin can add staff, and every route checks permission.'],
  ['users', 'Customer portal', 'Customers see only their own subscriptions and invoices, and keep their billing details current.'],
];
const STEPS = [
  [step1, 'Define your plans', 'Set the price, cycle and rules once. Add products with variants like brand.'],
  [step2, 'Send a quotation', 'Start from a template, send it to the customer, then confirm it.'],
  [step3, 'Activate', 'The subscription goes live and its next invoice date is scheduled for you.'],
  [step4, 'Bill & collect', 'Invoices appear automatically. Record payments and watch overdue ones.'],
];
const AUD = [
  ['fin', 'Finance & admins', 'Own the numbers', artFinance, 'See what is paid, owed and overdue — instantly.', ['Revenue, recurring revenue and overdue amounts on one screen', 'Own the catalogue: products, plans, taxes and discounts', 'Add and deactivate staff members']],
  ['staff', 'Staff', 'Run the day-to-day', artStaff, 'Create, send and bill without retyping anything.', ['Build subscriptions from quotation templates', 'Confirm, send and print invoices', 'Record payments against the right invoice']],
  ['cust', 'Customers', 'Self-serve portal', artCustomer, 'Your customers always know where they stand.', ['See their own subscriptions and invoices', 'Check what is due and when', 'Keep their billing details up to date']],
];
const PLANS = [
  ['Weekly Trial', '₹0', 'week', ['Auto-closes when it ends', 'No tax on a free plan', 'A safe way to try things'], false],
  ['Monthly Business', '₹300', 'month', ['Pause when needed', 'Close early if the customer leaves', 'Renew with one click'], true],
  ['Yearly Enterprise', '₹2,500', 'year', ['Minimum 5 seats', 'Auto-closes at term end', 'Renewal allowed'], false],
];
const FAQ = [
  ['What is Brightloop?', 'A subscription-management system: you define plans, create subscriptions, and Brightloop generates invoices and tracks payments, so recurring revenue does not depend on someone remembering.'],
  ['Who can use it?', 'There are three roles. Admins manage everything, including staff, products, plans, taxes and discounts. Staff handle subscriptions, invoices and payments. Customers use a portal limited to their own records.'],
  ['How does automatic invoicing work?', 'A billing run looks for active subscriptions whose next invoice date has arrived and creates the invoice, with taxes and eligible discounts applied. Run it from the Invoices page, or schedule the daily billing job.'],
  ['Can the same period be billed twice?', 'No. Each subscription can have only one invoice per billing period — the database enforces it — and a run that finds nothing new simply creates nothing.'],
  ['Can customers pay online?', 'Not yet. Payments are recorded by staff against an invoice (cash, card, bank transfer, UPI or cheque). Online payment is on the roadmap.'],
  ['How do I try it?', 'Open the Log in page: the demo admin, staff and customer logins are listed there with one-click fill. Or create your own customer account in a few seconds.'],
  ['Which themes are there?', 'Two: a warm dark-white light theme and a dark-red theme. Use the sun/moon button in the header — your choice is remembered.'],
];

export function landing(app, ctx, path) {
  mount(app, ctx, html`
  <section class="hero2"><span class="blob b1"></span><span class="blob b2"></span><div class="hero2-in">
    <div><span class="pill"><i>Live demo</i> Try it with the demo logins</span>
      <h1>Every renewal, <span class="grad">billed on time.</span></h1>
      <p class="lead">Brightloop brings plans, subscriptions, invoices and payments into one calm workspace — so revenue stops depending on who remembers.</p>
      <div class="cta"><a class="btn primary lg" href="#/signup">Get started free ${raw(icon('arrow', 18))}</a><a class="btn lg" href="#/how-it-works">See how it works</a></div>
      <div class="note"><span>Invoices generated, never typed</span><span>Taxes &amp; discounts automatic</span><span>Demo accounts included</span></div></div>
    <div class="mock" aria-hidden="true"><div class="win"><div class="win-bar"><i></i><i></i><i></i><span>brightloop · dashboard</span></div><div class="win-body">
      <div class="mk-nav"><b>Dashboard</b><b>Subscriptions</b><b>Invoices</b><b>Payments</b><b>Customers</b></div>
      <div class="mk-kpis"><div class="mk-k"><small>ACTIVE</small><b>8</b></div><div class="mk-k"><small>COLLECTED</small><b>₹4.8L</b></div><div class="mk-k"><small>OVERDUE</small><b style="color:var(--brand)">₹32k</b></div></div>
      <div class="mk-chart">${[38, 52, 44, 66, 58, 80, 72, 96].map((h, i) => html`<i style="height:${h}%;animation-delay:${i * .09}s"></i>`)}</div>
      <div class="mk-rows"><div class="mk-r"><span>INV-0042 · Nova Retail</span><span class="badge b-paid">paid</span></div><div class="mk-r"><span>INV-0043 · Awadh Foods</span><span class="badge b-overdue">overdue</span></div></div>
      <p class="muted" style="font-size:11px;text-align:center;margin-top:10px">Illustrative sample data</p></div></div>
      <div class="float f2"><span class="ok">${raw(icon('check', 16, 2.6))}</span><div>Invoice paid<small>Nova Retail · ₹1,062</small></div></div>
      <div class="float f1"><span class="wa">${raw(icon('clock', 16, 2.2))}</span><div>Renewal due<small>in 3 days · auto-billed</small></div></div></div>
  </div></section>

  <div class="marq" aria-hidden="true"><div class="marq-t">${[0, 1].map(() => ['Plans', 'Subscriptions', 'Quotations', 'Invoices', 'Payments', 'Taxes', 'Discounts', 'Reports', 'Customer portal'].map(t => html`<span>${t}</span>`))}</div></div>

  <section class="sec"><div class="sec-in"><div class="stats">
    <div class="stat rv"><b><span data-count="4">0</span></b><span>Billing cycles<br>daily · weekly · monthly · yearly</span></div>
    <div class="stat rv d1"><b><span data-count="3">0</span></b><span>Roles<br>admin · staff · customer portal</span></div>
    <div class="stat rv d2"><b><span data-count="0">0</span></b><span>Invoices billed twice<br>enforced by the database</span></div>
    <div class="stat rv d3"><b><span data-count="23">0</span><small style="font-size:.4em"> ms</small></b><span>Dashboard load<br>with 5,000 subscriptions</span></div></div>
    <p class="fine">Measured on a local machine with 5,000 subscriptions and 15,000 invoices.</p></div></section>

  <section class="sec alt" id="features"><div class="sec-in"><div class="sec-h c rv"><span class="eyebrow">Features</span><h2>Everything recurring revenue needs, <span class="grad">nothing it doesn't</span></h2><p>From the first quotation to the last payment, each step is connected to the next.</p></div>
    <div class="feat-grid">${FEATURES.map(([ic, t, d], i) => html`<article class="feat rv d${i % 4}"><div class="ico">${raw(icon(ic, 22))}</div><h3>${t}</h3><p>${d}</p></article>`)}</div></div></section>

  <section class="sec" id="how-it-works"><div class="sec-in"><div class="sec-h c rv"><span class="eyebrow">How it works</span><h2>From plan to paid in <span class="grad">four steps</span></h2><p>No spreadsheets, no copy-paste, no forgotten renewals.</p></div>
    <div class="flow">${STEPS.map(([art, t, d], i) => html`<div class="flow-s rv d${i}"><div class="art">${raw(art)}<span class="n">${i + 1}</span></div><h3>${t}</h3><p>${d}</p></div>`)}</div>
    <div class="life rv"><h3>Every subscription follows the same clear path</h3><div class="life-r"><span>Draft</span><em>→</em><span>Quotation</span><em>→</em><span>Confirmed</span><em>→</em><span>Active</span><em>→</em><span>Closed</span></div></div></div></section>

  <section class="sec alt"><div class="sec-in"><div class="sec-h c rv"><span class="eyebrow">Made for your whole team</span><h2>One system, <span class="grad">three views</span></h2><p>Everyone sees what they need — and only what they should.</p></div>
    <div class="aud rv"><div class="aud-t" role="tablist">${AUD.map(([id, t, s], i) => html`<button type="button" role="tab" data-aud="${id}" aria-selected="${String(i === 0)}"><b>${t}</b><span>${s}</span></button>`)}</div>
      <div>${AUD.map(([id, t, s, art, h, li], i) => html`<div class="aud-p ${i === 0 ? 'on' : ''}" id="aud-${id}"><div><span class="eyebrow">${t}</span><h3>${h}</h3><ul>${li.map(x => html`<li>${x}</li>`)}</ul></div><div class="aud-art">${raw(art)}</div></div>`)}</div></div></div></section>

  <section class="sec" id="pricing"><div class="sec-in"><div class="sec-h c rv"><span class="eyebrow">Example plans</span><h2>Model any plan <span class="grad">in minutes</span></h2><p>These three come with the demo catalogue. Create your own with any price, cycle and rules.</p></div>
    <div class="plans3">${PLANS.map(([n, p, per, li, hot], i) => html`<article class="pl rv d${i} ${hot ? 'hot' : ''}">${hot ? html`<span class="tag">Most flexible</span>` : ''}<h3>${n}</h3><div class="pr">${p}<small> / ${per}</small></div><ul>${li.map(x => html`<li>${x}</li>`)}</ul><a class="btn ${hot ? 'primary' : ''} block" href="#/login">Try it in the demo</a></article>`)}</div></div></section>

  <section class="sec alt"><div class="sec-in"><div class="sec-h c rv"><span class="eyebrow">Built to be trusted</span><h2>Careful with money <span class="grad">and with data</span></h2></div>
    <div class="trust">${[['lock', 'Passwords stay private', 'Stored only as salted hashes. Reset links are signed, expire in an hour and work once.'], ['shield', 'Access checked every time', 'Every request verifies who you are and what your role allows. Customers can only reach their own records.'], ['bolt', 'Billing you can re-run', 'Running billing twice never creates duplicates, and missed cycles are caught up automatically.']].map(([ic, t, d], i) => html`<div class="tr rv d${i}"><div class="ico">${raw(icon(ic, 22))}</div><div><h3>${t}</h3><p>${d}</p></div></div>`)}</div>
    <p class="fine"><a href="#/security">Read more about security →</a></p></div></section>

  <section class="sec" id="faq"><div class="sec-in"><div class="sec-h c rv"><span class="eyebrow">FAQ</span><h2>Questions, <span class="grad">answered</span></h2></div>
    <div class="faq rv">${FAQ.map(([q, a], i) => html`<details ${raw(i === 0 ? 'open' : '')}><summary>${q}</summary><p>${a}</p></details>`)}</div>
    <p class="fine">Still curious? <a href="#/contact">Ask us directly</a>.</p></div></section>

  <div class="cta-wrap"><section class="cta-band rv"><h2>Ready to stop chasing renewals?</h2><p>Create a free account in seconds, or explore the demo as an admin, staff member or customer.</p>
    <div class="row" style="justify-content:center"><a class="btn lg" href="#/signup">Create free account</a><a class="btn lg ghost2" href="#/login">Try the demo</a></div></section></div>`, ctx, LANDING[path]);
}

/* ---------- document-style pages ---------- */
function docPage(app, ctx, kind) {
  const d = DOCS[kind];
  mount(app, ctx, html`<section class="page-hero"><span class="eyebrow">Legal</span><h1>${d.title}</h1><p>${d.lead}</p></section><div class="doc">${toc(kind)}${legalBody(kind)}</div>`);
}
export const terms = (a, c) => docPage(a, c, 'terms');
export const privacy = (a, c) => docPage(a, c, 'privacy');
export const cookies = (a, c) => docPage(a, c, 'cookies');

export function about(app, ctx) {
  mount(app, ctx, html`<section class="page-hero"><span class="eyebrow">About</span><h1>Billing that <span class="grad">keeps its promises</span></h1><p>Brightloop exists so that a renewal never slips through the cracks — and nobody has to retype an invoice.</p></section>
  <section class="sec" style="padding-top:40px"><div class="sec-in"><div class="about-g">${[['loop', 'What it does', 'Brightloop manages the whole recurring-revenue loop: products and plans, quotations, subscriptions, invoices, payments and reporting.'], ['users', 'Who it is for', 'Small finance and operations teams who bill customers on a schedule and want one source of truth they can trust.'], ['bolt', 'How it is built', 'A Python and Flask API on SQLite, with a fast, dependency-free single-page front end. No build step, no external CDN.']].map(([ic, t, d], i) => html`<article class="feat rv d${i}"><div class="ico">${raw(icon(ic, 22))}</div><h3>${t}</h3><p>${d}</p></article>`)}</div>
    <div class="sec-h rv" style="margin-top:70px"><span class="eyebrow">Our story</span><h2>Started as a <span class="grad">hackathon entry</span></h2><p>Brightloop began as a submission to the Odoo × FLUX Lucknow Hackathon ’26 (Subscription Management System). The idea was simple: make the boring parts of billing — dates, taxes, discounts, duplicates — impossible to get wrong.</p></div>
    <div class="vals">${[['Correct by construction', 'Rules live in code and in the database, not in someone’s memory.'], ['Clear to everyone', 'Each role sees a screen that makes sense for its job.'], ['Honest about limits', 'We say what is not built yet instead of hiding it.'], ['Small and fast', 'Lists load in milliseconds, with no heavy framework in the way.']].map(([t, d], i) => html`<div class="ci rv d${i % 2}"><div class="ico">${raw(icon('check', 20, 2.4))}</div><div><h3>${t}</h3><p>${d}</p></div></div>`)}</div>
    <div class="row rv" style="justify-content:center;margin-top:50px"><a class="btn primary lg" href="#/signup">Create an account</a><a class="btn lg" href="#/contact">Talk to us</a></div></div></section>`, ctx);
}

export function security(app, ctx) {
  const items = [['lock', 'Strong passwords', 'Passwords must be longer than 8 characters with an upper-case letter, a lower-case letter and a special character — with a live checklist while you type.'], ['key', 'Hashed, never stored', 'Passwords are kept only as salted hashes. Nobody, including us, can read them back.'], ['clock', 'Expiring sessions', 'Sign-in tokens are signed and expire automatically. Signing out removes the token from your browser.'], ['mail', 'Safe password resets', 'Reset links are signed, valid for one hour and can be used once. Asking for a link never reveals whether an email is registered.'], ['shield', 'Role-based access', 'Every route checks your role. Only admins add staff; customers can only ever reach their own subscriptions and invoices.'], ['bolt', 'Hardened responses', 'API replies are never cached, and pages are sent with anti-sniffing and anti-framing headers. Database queries are parameterised.']];
  mount(app, ctx, html`<section class="page-hero"><span class="eyebrow">Security</span><h1>Built to be <span class="grad">trusted with money</span></h1><p>The protections that are in the product today.</p></section>
  <section class="sec" style="padding-top:40px"><div class="sec-in"><div class="feat-grid" style="grid-template-columns:repeat(3,1fr)">${items.map(([ic, t, d], i) => html`<article class="feat rv d${i % 3}"><div class="ico">${raw(icon(ic, 22))}</div><h3>${t}</h3><p>${d}</p></article>`)}</div>
    <div class="ci rv" style="margin-top:30px;max-width:760px;margin-inline:auto"><div class="ico">${raw(icon('help', 20))}</div><div><h3>Found a vulnerability?</h3><p>Please tell us privately through the <a href="#/contact">Contact page</a> using the “Security” topic, before sharing it anywhere else.</p></div></div></div></section>`, ctx);
}

export function contact(app, ctx) {
  mount(app, ctx, html`<section class="page-hero"><span class="eyebrow">Contact</span><h1>Let’s <span class="grad">talk</span></h1><p>Questions, feedback or a security report — pick a topic and send us a note.</p></section>
  <div class="contact"><form class="card rv" id="cf" novalidate><div class="card-h"><div class="ico">${raw(icon('mail', 20))}</div><div><h3>Send a message</h3><p>All fields are required.</p></div></div>
    <div class="cols2">${field({ name: 'name', label: 'Your name', required: true, value: ctx.session.user?.name || '', attrs: 'maxlength="80" autocomplete="name"' })}${field({ name: 'email', label: 'Email', type: 'email', required: true, value: ctx.session.user?.email || '', attrs: 'autocomplete="email"' })}</div>
    ${field({ name: 'topic', label: 'Topic', type: 'select', options: [['general', 'General question'], ['sales', 'Sales'], ['support', 'Support'], ['billing', 'Billing'], ['security', 'Security report']] })}
    ${field({ name: 'message', label: 'Message', type: 'textarea', required: true, attrs: 'maxlength="2000" placeholder="How can we help?"' })}
    <button class="btn primary lg">Send message ${raw(icon('arrow', 18))}</button><div id="cf-out"></div></form>
    <aside class="cinfo">${[['help', 'Support', 'Stuck on something? Choose “Support” and describe what you were doing.'], ['sparkle', 'Sales & plans', 'Want to talk through plans, roles or a rollout? Choose “Sales”.'], ['shield', 'Security', 'Report issues privately with the “Security” topic.']].map(([ic, t, d], i) => html`<div class="ci rv d${i}"><div class="ico">${raw(icon(ic, 20))}</div><div><h3>${t}</h3><p>${d}</p></div></div>`)}
      <div class="ci rv d3" style="background:var(--brand-l)"><div class="ico" style="background:var(--card)">${raw(icon('eye', 20))}</div><div><h3>Rather look around first?</h3><p>Open the <a href="#/login">live demo</a> with the one-click demo logins.</p></div></div></aside></div>`, ctx);
  const f = $('#cf');
  f.onsubmit = async e => {
    e.preventDefault();
    if (showErrors(f, clientValidate(f))) return;
    const b = $('.btn.primary', f); b.disabled = true;
    try {
      const r = await api.post('/contact', formData(f));
      setHTML(f, html`<div class="empty"><div class="avatar xl" style="margin:0 auto 14px;background:linear-gradient(135deg,var(--green),var(--orange))">${raw(icon('check', 44, 2.6))}</div><b>Message sent</b>${r.message}<div class="row" style="justify-content:center;margin-top:18px"><a class="btn primary" href="#/">Back to home</a></div></div>`);
    } catch (err) { showErrors(f, err.errors); toast(err.message, 'err'); b.disabled = false; }
  };
}

export function notFound(app, ctx) {
  mount(app, ctx, html`<section class="page-hero" style="padding-block:110px"><span class="eyebrow">404</span><h1>We couldn’t find that page</h1><p>The link may be old or mistyped.</p><div class="row" style="justify-content:center;margin-top:26px"><a class="btn primary lg" href="#/">Go to the home page</a><a class="btn lg" href="#/contact">Contact us</a></div></section>`, ctx);
}
