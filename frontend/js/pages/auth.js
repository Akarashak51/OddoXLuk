import { api, token } from '../api.js';
import { field, html, raw, setHTML, toast, showErrors, clientValidate, formData, $, $$, LOGO } from '../ui.js';
import { themeBtn } from '../theme.js';
import { icon } from '../art.js';
import { openLegal } from './legal.js';

const RULES = [['More than 8 characters', p => p.length > 8], ['An uppercase letter', p => /[A-Z]/.test(p)], ['A lowercase letter', p => /[a-z]/.test(p)], ['A special character', p => /[^A-Za-z0-9]/.test(p)]];
export const pwChecklist = () => html`<ul class="pw" data-pw>${RULES.map(([t]) => html`<li>○ ${t}</li>`)}</ul>`;
export function bindChecklist(form, root = form) {
  const i = form.elements.password || form.elements.new_password, list = $$('[data-pw] li', root);
  if (!i || !list.length) return;
  i.addEventListener('input', () => RULES.forEach(([t, f], n) => { const ok = f(i.value); list[n].className = ok ? 'ok' : ''; list[n].textContent = (ok ? '✓ ' : '○ ') + t; }));
}

/* The consent box: you cannot sign in or sign up until Terms and Privacy are accepted. The links open a reader pop-up. */
const consent = () => html`<div class="f" data-f="terms" style="margin-bottom:14px"><div class="consent"><input type="checkbox" id="f_terms" name="terms" required>
  <label for="f_terms">I agree to the <a href="#/terms" data-legal="terms">Terms &amp; Conditions</a> and the <a href="#/privacy" data-legal="privacy">Privacy Policy</a>.</label></div><div class="err" data-err="terms"></div></div>`;

function layout(app, title, sub, inner, footer) {
  setHTML(app, html`<div class="auth"><section class="hero"><div><a class="brand" href="#/">${raw(LOGO)}Brightloop</a>
    <svg class="ring" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke="#ffb27a" stroke-width="2.4" stroke-dasharray="58 12" stroke-linecap="round"/><circle cx="16" cy="16" r="1.8" fill="#fff"/></svg>
    <h1>Every renewal, billed on time.</h1><p>Plans, subscriptions, invoices and payments in one place — so revenue stops depending on who remembers.</p></div>
    <ul><li>Invoices generated from subscriptions, never typed</li><li>Taxes and discounts applied automatically</li><li>Always know what is paid, owed and overdue</li></ul></section>
    <section class="formside"><div class="auth-top"><a class="back" href="#/">${raw(icon('home', 16))} Back to home</a>${themeBtn}</div>
    <div class="wrap"><div class="box"><h2>${title}</h2><p class="muted" style="margin:0 0 22px">${sub}</p><form novalidate>${inner}</form>${footer}</div></div></section></div>`);
  window.scrollTo(0, 0);
  return $('form', app);
}
function wire(form, fn, ctx) {
  form.onsubmit = async e => {
    e.preventDefault();
    const errs = clientValidate(form);
    if (errs.terms) errs.terms = 'Please accept the Terms and Privacy Policy to continue';
    if (showErrors(form, errs)) return;
    const b = $('.btn.primary', form); b.disabled = true;
    try { await fn(formData(form), form); } catch (err) { showErrors(form, err.errors); toast(err.message, 'err'); } finally { b.disabled = false; }
  };
  // Terms / Privacy open in a pop-up; "I have read and agree" ticks the box for you.
  const root = form.closest('.box') || form;
  root.addEventListener('click', e => {
    const l = e.target.closest('[data-legal]'); if (!l) return;
    e.preventDefault();
    openLegal(l.dataset.legal, () => { const c = form.elements.terms; if (c) { c.checked = true; c.closest('.f')?.classList.remove('bad'); const er = form.querySelector('[data-err="terms"]'); if (er) er.textContent = ''; } });
  });
}
const done = (ctx, r) => { token.set(r.token); ctx.session.user = r.user; ctx.go(r.user.role === 'customer' ? '/subscriptions' : '/dashboard'); };
const full = 'width:100%;justify-content:center';

const DEMOS = { admin: ['admin@brightloop.com', 'Admin@12345'], staff: ['staff@brightloop.com', 'Staff@12345'], customer: ['customer@example.com', 'Customer@123'] };

export function login(app, ctx) {
  const f = layout(app, 'Sign in', 'Welcome back. Enter your details to continue.',
    html`${field({ name: 'email', label: 'Email', type: 'email', required: true, attrs: 'autocomplete="username"' })}${field({ name: 'password', label: 'Password', type: 'password', required: true, attrs: 'autocomplete="current-password"' })}
    ${consent()}<button class="btn primary lg block">Sign in</button><p class="right" style="margin:12px 0 0"><a href="#/forgot">Forgot password?</a></p>`,
    html`<p class="muted mt">New to Brightloop? <a href="#/signup">Create an account</a></p>
    <div class="demo"><b>Demo logins</b> — tap to fill the form<div class="chips"><button type="button" data-fill="admin">Admin</button><button type="button" data-fill="staff">Staff</button><button type="button" data-fill="customer">Customer</button></div></div>`);
  wire(f, async d => done(ctx, await api.post('/auth/login', { email: d.email, password: d.password })), ctx);
  $$('[data-fill]', app).forEach(b => b.onclick = () => { const [e, p] = DEMOS[b.dataset.fill]; f.elements.email.value = e; f.elements.password.value = p; f.elements.terms.focus(); });
}
export function signup(app, ctx) {
  const f = layout(app, 'Create your account', 'Manage your subscriptions and invoices online.',
    html`${field({ name: 'name', label: 'Full name', required: true, attrs: 'maxlength="80" autocomplete="name"' })}${field({ name: 'company', label: 'Company', attrs: 'maxlength="120"' })}
    ${field({ name: 'email', label: 'Email', type: 'email', required: true, attrs: 'autocomplete="username"' })}${field({ name: 'password', label: 'Password', type: 'password', required: true, attrs: 'autocomplete="new-password"' })}${pwChecklist()}
    <div style="height:14px"></div>${consent()}<button class="btn primary lg block">Create account</button>`,
    html`<p class="muted mt">Already registered? <a href="#/login">Sign in</a></p>`);
  bindChecklist(f);
  wire(f, async d => { const { terms, ...rest } = d; done(ctx, await api.post('/auth/signup', { ...rest, accepted_terms: terms === true })); }, ctx);
}
export function forgot(app) {
  const f = layout(app, 'Reset your password', 'We will email a reset link to your registered address.',
    html`${field({ name: 'email', label: 'Email', type: 'email', required: true })}<button class="btn primary lg block">Send reset link</button><div data-out></div>`,
    html`<p class="muted mt"><a href="#/login">Back to sign in</a></p>`);
  wire(f, async d => {
    const r = await api.post('/auth/forgot-password', d);
    setHTML($('[data-out]', f), html`<div class="demo">${r.message}${r.dev_reset_link ? html`<br><b>Dev mode:</b> email is logged to the server console, so here is the link: <a href="${r.dev_reset_link}">open reset page</a>` : ''}</div>`);
  });
}
export function reset(app, ctx) {
  const f = layout(app, 'Choose a new password', 'Pick something you have not used before.',
    html`${field({ name: 'password', label: 'New password', type: 'password', required: true, attrs: 'autocomplete="new-password"' })}${pwChecklist()}<div style="height:14px"></div><button class="btn primary lg block">Update password</button>`,
    html`<p class="muted mt"><a href="#/login">Back to sign in</a></p>`);
  bindChecklist(f);
  wire(f, async d => { await api.post('/auth/reset-password', { token: ctx.query.token, password: d.password }); toast('Password updated. Please sign in.'); ctx.go('/login'); });
}
