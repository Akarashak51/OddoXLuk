/* Terms, Privacy and Cookies content. One source, used by the standalone pages AND the pop-ups on the login / sign-up forms. */
import { html, raw, $, esc } from '../ui.js';

const EFFECTIVE = '31 October 2026';

export const DOCS = {
  terms: {
    title: 'Terms of Service', short: 'Terms & Conditions', lead: 'The rules for using Brightloop. Plain language, no surprises.',
    sections: [
      ['accept', 'Accepting these terms', ['By creating an account or signing in to Brightloop you agree to these Terms and to our Privacy Policy. If you use Brightloop on behalf of a company, you confirm you are allowed to accept these Terms for it.']],
      ['account', 'Your account', ['You must give accurate details when you sign up and keep your password private. Passwords must be longer than 8 characters and include an upper-case letter, a lower-case letter and a special character.', 'You are responsible for everything done through your account. Tell us promptly if you think someone else has used it.']],
      ['roles', 'Roles and access', ['Brightloop has three kinds of user: administrators, staff and customers. Only an administrator can add staff members or manage products, plans, taxes and discounts. Customers can only see their own subscriptions, invoices and billing details.']],
      ['use', 'Acceptable use', [{ ul: ['Do not try to access data that belongs to another customer or organisation.', 'Do not probe, overload or interfere with the service, or attempt to bypass its permission checks.', 'Do not use Brightloop to send unlawful, misleading or abusive content.', 'Do not upload malicious code.'] }]],
      ['billing', 'Invoices, taxes and payments', ['Brightloop generates invoices from subscriptions and applies the taxes and discounts configured by your administrator. You are responsible for checking that these settings are right for your business and for your local tax rules.', 'Payments are recorded by staff against an invoice. Brightloop does not move money on your behalf.']],
      ['data', 'Your data', ['You own the business data you put into Brightloop, such as customers, plans, subscriptions and invoices. You give us permission to store and process it only to run the service for you. See the Privacy Policy for details.']],
      ['avail', 'Availability and changes', ['We work to keep Brightloop available but cannot promise it will always be uninterrupted or error-free. We may improve, change or retire features, and we will update these Terms when we do — the date at the top shows the latest version.']],
      ['liability', 'Liability', ['To the extent the law allows, Brightloop is provided “as is”, and we are not liable for indirect or consequential loss, such as lost profit or lost data. Nothing in these Terms limits liability that cannot be limited by law.']],
      ['end', 'Ending your account', ['You can stop using Brightloop at any time. We may suspend or close accounts that break these Terms or put the service or other users at risk.']],
      ['contact', 'Questions', ['If anything here is unclear, use the Contact page and choose the topic that fits.']],
    ],
  },
  privacy: {
    title: 'Privacy Policy', short: 'Privacy Policy', lead: 'What we collect, why we collect it, and the control you have.',
    sections: [
      ['collect', 'What we collect', [{ ul: ['Account details: your name, email address, company, phone and billing address.', 'Billing records: subscriptions, invoices, payments and related notes your organisation creates.', 'Messages you send through the Contact form.', 'A session token and a theme preference, stored in your own browser (see Cookies & storage).'] }]],
      ['why', 'Why we use it', ['We use this information to sign you in, show you the right data for your role, generate invoices, record payments, send password-reset emails and reply to your messages. We do not use it for advertising and we do not sell it.']],
      ['passwords', 'Passwords', ['Passwords are stored only as salted hashes, never in plain text. Password-reset links are signed, expire after one hour and work once.']],
      ['sharing', 'Who can see your data', ['Administrators and staff of your organisation can see customer and billing records. Customers can see only their own records. We do not share personal data with third parties for their own purposes. Brightloop includes no third-party analytics or advertising trackers.']],
      ['retention', 'How long we keep it', ['We keep account and billing records for as long as your account is active and for as long as your organisation needs them for accounting. You can ask us to delete or correct personal details, subject to records we must keep by law.']],
      ['rights', 'Your choices', [{ ul: ['Edit your name and billing details at any time from your Profile.', 'Change your password from your Profile.', 'Ask for a copy, correction or deletion of your personal data through the Contact page.', 'Switch themes or sign out whenever you like — signing out removes your session from the browser.'] }]],
      ['security', 'Security', ['Access is checked on every request, customers are limited to their own records, and sessions expire automatically. See the Security page for more.']],
      ['changes', 'Changes to this policy', ['If we change this policy in a meaningful way we will update the date at the top of the page.']],
    ],
  },
  cookies: {
    title: 'Cookies & browser storage', short: 'Cookies & storage', lead: 'Brightloop does not use tracking cookies. Here is the little it does store.',
    sections: [
      ['none', 'No tracking', ['Brightloop sets no advertising or analytics cookies, and loads no third-party scripts, fonts or trackers.']],
      ['storage', 'What is stored in your browser', [{ ul: ['bl_token — your signed-in session. It expires automatically and is removed when you sign out.', 'bl_theme — whether you chose the dark-white (light) or dark-red theme, so the site looks the same next visit.'] }]],
      ['control', 'Your control', ['You can clear this storage at any time in your browser settings. If you do, you will simply be signed out and the theme will reset.']],
    ],
  },
};

const block = b => typeof b === 'string' ? html`<p>${b}</p>` : html`<ul>${b.ul.map(li => html`<li>${li}</li>`)}</ul>`;
export const legalBody = (kind) => {
  const d = DOCS[kind];
  return html`<div class="prose"><span class="meta">Effective ${EFFECTIVE}</span>${d.sections.map(([id, t, bs], i) => html`<h2 id="s-${id}">${i + 1}. ${t}</h2>${bs.map(block)}`)}</div>`;
};
export const toc = (kind) => html`<nav class="toc" aria-label="On this page">${DOCS[kind].sections.map(([id, t]) => html`<a href="#/${kind}" data-goto="s-${id}">${t}</a>`)}</nav>`;

/* Pop-up reader used on the login / sign-up forms. onAccept() ticks the consent box. */
export function openLegal(kind, onAccept) {
  const d = DOCS[kind];
  const el = document.createElement('div'); el.className = 'overlay';
  el.innerHTML = `<div class="modal lg legal-modal" role="dialog" aria-modal="true" aria-label="${esc(d.title)}"><header><h3>${esc(d.title)}</h3><button class="x" data-close aria-label="Close">×</button></header>
    <div class="mb"><p class="muted" style="margin-bottom:14px">${esc(d.lead)}</p>${legalBody(kind).s}</div>
    <footer><a href="#/${kind}" data-close style="margin-right:auto;align-self:center" target="_blank" rel="noopener">Open full page ↗</a><button type="button" class="btn" data-close>Close</button><button type="button" class="btn primary" data-accept>I have read and agree</button></footer></div>`;
  document.body.append(el);
  const close = () => { el.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  el.addEventListener('click', e => {
    if (e.target.closest('[data-accept]')) { onAccept?.(); close(); }
    else if (e.target === el || (e.target.closest('[data-close]') && !e.target.closest('a'))) close();
  });
  $('[data-accept]', el).focus();
}
