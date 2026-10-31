/* Profile: who you are, your details, what your role can do, password and appearance. Works for every role. */
import { api } from '../api.js';
import { icon } from '../art.js';
import { getTheme } from '../theme.js';
import { clientValidate, fdate, field, formData, html, inr, raw, setHTML, showErrors, skeleton, toast, $, $$ } from '../ui.js';
import { pwChecklist, bindChecklist } from './auth.js';

const PERMS = {
  admin: ['Full access to every section of Brightloop', 'Manage products, plans, taxes, discounts and quotation templates', 'Add and deactivate staff members', 'Run billing, confirm invoices and record payments'],
  staff: ['Create subscriptions and move them through their lifecycle', 'Confirm, send and print invoices', 'Record payments and look after customers', 'Read-only access to products, plans, taxes and discounts'],
  customer: ['See your own subscriptions and invoices', 'Browse the plans on offer', 'Keep your billing details up to date', 'Your data is private — other customers can never see it'],
};
const head = (ic, t, d) => html`<div class="card-h"><div class="ico">${raw(icon(ic, 19))}</div><div><h3>${t}</h3><p>${d}</p></div></div>`;
const tile = (l, v, s) => html`<div class="card kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;

export async function profile(root, ctx) {
  setHTML(root, html`<div class="page">${skeleton()}</div>`);
  const a = await api.get('/me/account'), st = a.stats, c = a.customer, isCust = a.role === 'customer';
  const tiles = isCust
    ? [tile('Active subscriptions', st.active_subscriptions ?? 0, `${st.total_subscriptions ?? 0} in total`), tile('Open invoices', st.open_invoices ?? 0, 'Waiting for payment'), tile('Balance due', inr(st.balance_due), 'Across open invoices'), tile('Paid so far', inr(st.total_paid), 'All time')]
    : [tile('Subscriptions created', st.subscriptions_created ?? 0, 'By you'), tile('Payments recorded', st.payments_recorded ?? 0, 'By you'), tile('Amount recorded', inr(st.amount_recorded), 'All time'), tile('Your role', a.role[0].toUpperCase() + a.role.slice(1), a.role === 'admin' ? 'Full access' : 'Day-to-day access')];
  const dark = getTheme() === 'dark';

  setHTML(root, html`<div class="page">
    <div class="card flush"><div class="p-cover"></div>
      <div class="p-head"><div class="avatar xl" data-who-avatar>${a.name[0].toUpperCase()}</div>
        <div class="p-id"><h1><span data-who-name>${a.name}</span> <span class="badge b-${a.role}">${a.role}</span></h1>
          <div class="p-meta"><span>${raw(icon('mail', 15))}${a.email}</span>${c?.company ? html`<span>${raw(icon('box', 15))}${c.company}</span>` : ''}<span>${raw(icon('calendar', 15))}Member since ${fdate(a.created_at.slice(0, 10))}</span><span class="badge b-active">Active</span></div></div>
        <button class="btn" data-signout>${raw(icon('logout', 16))} Sign out</button></div></div>

    <div class="grid g4 mt">${tiles}</div>

    <div class="grid g2 mt">
      <form class="card" id="pf" novalidate>${head('edit', isCust ? 'Personal & billing details' : 'Personal details', isCust ? 'These details appear on your invoices.' : 'Your name as it appears to your team.')}
        <div class="cols2">${field({ name: 'name', label: 'Full name', required: true, value: a.name, attrs: 'maxlength="80" autocomplete="name"' })}
        <div class="f"><label for="pf_email">Email</label><input id="pf_email" value="${a.email}" disabled><span class="hint">Your sign-in email can’t be changed here.</span></div>
        ${isCust ? html`${field({ name: 'company', label: 'Company', value: c?.company || '', attrs: 'maxlength="120"' })}${field({ name: 'phone', label: 'Phone', type: 'tel', value: c?.phone || '', attrs: 'maxlength="30" autocomplete="tel"' })}` : ''}</div>
        ${isCust ? field({ name: 'address', label: 'Billing address', type: 'textarea', value: c?.address || '', attrs: 'maxlength="300"' }) : ''}
        <div class="row"><button class="btn primary">Save changes</button><span class="muted" style="font-size:13px">Changes apply immediately.</span></div></form>

      <div class="card">${head('shield', 'Your access', `What a ${a.role} can do in Brightloop.`)}
        <ul class="perm">${PERMS[a.role].map(p => html`<li>${p}</li>`)}</ul>
        <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
        <dl class="kv"><dt>Account type</dt><dd style="text-transform:capitalize">${a.role}</dd><dt>Account ID</dt><dd>#${a.id}</dd><dt>Created</dt><dd>${fdate(a.created_at.slice(0, 10))}</dd><dt>Session</dt><dd>Expires automatically</dd></dl></div>
    </div>

    <div class="grid g2e mt">
      <form class="card" id="pw" novalidate>${head('key', 'Password & security', 'Use a strong password you don’t use anywhere else.')}
        <input type="text" name="username" value="${a.email}" autocomplete="username" hidden>
        ${field({ name: 'current_password', label: 'Current password', type: 'password', required: true, attrs: 'autocomplete="current-password"' })}
        ${field({ name: 'new_password', label: 'New password', type: 'password', required: true, attrs: 'autocomplete="new-password"' })}${pwChecklist()}
        <div style="height:14px"></div>${field({ name: 'confirm_password', label: 'Confirm new password', type: 'password', required: true, attrs: 'autocomplete="new-password"' })}
        <button class="btn primary">Change password</button></form>

      <div class="card">${head('palette', 'Appearance', 'Choose how Brightloop looks. Saved on this device.')}
        <div class="theme-pick">
          <button type="button" class="tp" data-theme-set="light" aria-pressed="${String(!dark)}"><div class="sw" style="background:#e7e1d8"><i style="background:#c1291d"></i><i style="background:#f4f0e9"></i></div><b>Dark white</b><span>Warm, calm, easy in daylight</span></button>
          <button type="button" class="tp" data-theme-set="dark" aria-pressed="${String(dark)}"><div class="sw" style="background:#170708"><i style="background:#cf3324"></i><i style="background:#2a1013"></i></div><b>Dark red</b><span>Deep and low-glare for evenings</span></button></div>
        <p class="muted" style="font-size:13px;margin-top:14px">Tip: the sun/moon button at the top of every page switches themes instantly.</p>
        <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
        <div class="card-h" style="margin:0"><div class="ico">${raw(icon('logout', 19))}</div><div class="grow"><h3>Sign out</h3><p>End this session on this device.</p></div><button class="btn danger" data-signout>Sign out</button></div></div>
    </div></div>`);

  root.onclick = e => { if (e.target.closest('[data-signout]')) ctx.signOut(); };

  const pf = $('#pf', root);
  pf.onsubmit = async e => {
    e.preventDefault(); if (showErrors(pf, clientValidate(pf))) return;
    const b = $('.btn.primary', pf); b.disabled = true;
    try {
      const r = await api.put('/me/account', formData(pf));
      ctx.user.name = r.name;
      $$('[data-who-name]').forEach(n => { n.textContent = r.name; }); $$('[data-who-avatar]').forEach(n => { n.textContent = r.name[0].toUpperCase(); });
      toast('Profile saved');
    } catch (err) { showErrors(pf, err.errors); toast(err.message, 'err'); } finally { b.disabled = false; }
  };

  const pw = $('#pw', root);
  bindChecklist(pw, pw);
  pw.onsubmit = async e => {
    e.preventDefault();
    const errs = clientValidate(pw), d = formData(pw);
    if (!errs.confirm_password && d.confirm_password !== d.new_password) errs.confirm_password = 'The two passwords do not match';
    if (showErrors(pw, errs)) return;
    const b = $('.btn.primary', pw); b.disabled = true;
    try {
      await api.post('/me/password', { current_password: d.current_password, new_password: d.new_password });
      pw.reset(); $$('[data-pw] li', pw).forEach(li => { li.className = ''; li.textContent = '○ ' + li.textContent.slice(2); });
      toast('Password changed');
    } catch (err) { showErrors(pw, err.errors); toast(err.message, 'err'); } finally { b.disabled = false; }
  };
}
