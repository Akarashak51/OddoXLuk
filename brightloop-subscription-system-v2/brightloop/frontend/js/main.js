import { api, token } from './api.js';
import { $, $$, html, raw, setHTML, toast, LOGO } from './ui.js';
import { icon } from './art.js';
import { themeBtn } from './theme.js';
import * as auth from './pages/auth.js';
import * as pub from './pages/public.js';
import { dashboard } from './pages/dashboard.js';
import { profile } from './pages/profile.js';
import { subscriptionList, subscriptionForm, subscriptionDetail } from './pages/subscriptions.js';
import { invoiceList, invoiceDetail, paymentList } from './pages/invoices.js';
import * as cat from './pages/catalog.js';
import * as people from './pages/people.js';

const ADMIN = ['admin'], INTERNAL = ['admin', 'staff'], ALL = ['admin', 'staff', 'customer'];
const ROUTES = [
  [/^\/dashboard$/, INTERNAL, dashboard],
  [/^\/subscriptions$/, ALL, subscriptionList],
  [/^\/subscriptions\/new$/, INTERNAL, subscriptionForm],
  [/^\/subscriptions\/(\d+)\/edit$/, INTERNAL, subscriptionForm],
  [/^\/subscriptions\/(\d+)$/, ALL, subscriptionDetail],
  [/^\/invoices$/, ALL, invoiceList],
  [/^\/invoices\/(\d+)$/, ALL, invoiceDetail],
  [/^\/payments$/, INTERNAL, paymentList],
  [/^\/customers$/, INTERNAL, people.customers],
  [/^\/products$/, INTERNAL, cat.products],
  [/^\/plans$/, ALL, cat.plans],
  [/^\/templates$/, INTERNAL, cat.templates],
  [/^\/taxes$/, INTERNAL, cat.taxes],
  [/^\/discounts$/, INTERNAL, cat.discounts],
  [/^\/team$/, ADMIN, people.team],
  [/^\/profile$/, ALL, profile],
];
/* Public pages (no login needed). The four landing paths all show the home page and scroll to their section. */
const PUBLIC = { '/': pub.landing, '/features': pub.landing, '/how-it-works': pub.landing, '/pricing': pub.landing, '/faq': pub.landing,
  '/about': pub.about, '/contact': pub.contact, '/security': pub.security, '/terms': pub.terms, '/privacy': pub.privacy, '/cookies': pub.cookies };

/* Section navigation shown at the top centre of the app. [label, href, icon] */
const NAV = {
  internal: [
    ['Overview', [['Dashboard', '/dashboard', 'dashboard']]],
    ['Sales', [['Subscriptions', '/subscriptions', 'loop'], ['Invoices', '/invoices', 'invoice'], ['Payments', '/payments', 'card'], ['Customers', '/customers', 'users']]],
    ['Catalog', [['Products', '/products', 'box'], ['Plans', '/plans', 'plans'], ['Templates', '/templates', 'template'], ['Taxes', '/taxes', 'tax'], ['Discounts', '/discounts', 'discount']]],
    ['Admin', [['Team', '/team', 'team']], 'admin'],
    ['Account', [['Profile', '/profile', 'user']]],
  ],
  customer: [['My account', [['My subscriptions', '/subscriptions', 'loop'], ['My invoices', '/invoices', 'invoice'], ['Plans', '/plans', 'plans'], ['Profile', '/profile', 'user']]]],
};

export const session = { user: null };
const app = $('#app');
let mounted = '';   // what is currently on screen: 'shell:<userId>' | 'landing' | ''

const parse = () => { const [p, q] = (location.hash.slice(1) || '/').split('?'); return { path: p || '/', query: Object.fromEntries(new URLSearchParams(q || '')) }; };
export const go = p => { location.hash = '#' + p; };
export function signOut() { token.clear(); session.user = null; mounted = ''; go('/'); }
const homeFor = u => u.role === 'customer' ? '/subscriptions' : '/dashboard';

function shell(user) {
  const groups = (user.role === 'customer' ? NAV.customer : NAV.internal).filter(g => !g[2] || g[2] === user.role);
  setHTML(app, html`<div class="app"><header class="appbar"><div class="appbar-row">
      <a class="brand" href="#${homeFor(user)}">${raw(LOGO)}Brightloop</a><div class="grow"></div>${themeBtn}
      <div class="usermenu"><button type="button" id="um" aria-haspopup="true" aria-expanded="false" aria-label="Account menu"><span class="avatar" data-who-avatar>${user.name[0].toUpperCase()}</span>
        <span class="who-t"><b data-who-name>${user.name}</b><span>${user.role}</span></span>${raw(icon('down', 16))}</button>
        <div class="menu" id="menu" role="menu"><a href="#/profile" role="menuitem">${raw(icon('user', 17))} My profile</a><a href="#/contact" role="menuitem">${raw(icon('help', 17))} Help &amp; contact</a><a href="#/security" role="menuitem">${raw(icon('shield', 17))} Security</a><hr>
          <button type="button" id="out" role="menuitem">${raw(icon('logout', 17))} Sign out</button></div></div></div>
    <nav class="secnav" aria-label="Sections">${groups.map(([title, items]) => html`<div class="sg"><span class="sg-t">${title}</span><div class="sg-i">${items.map(([label, href, ic]) => html`<a href="#${href}" data-nav="${href}">${raw(icon(ic, 16))}${label}</a>`)}</div></div>`)}</nav></header>
    <main class="main" id="view"></main>
    <footer class="appfoot"><div class="appfoot-in"><span>© 2026 Brightloop · Subscription billing that never misses a renewal</span>
      <nav aria-label="Footer"><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a><a href="#/cookies">Cookies</a><a href="#/security">Security</a><a href="#/about">About</a><a href="#/contact">Contact</a><a href="#/faq">FAQ</a></nav></div></footer></div>`);
  const menu = $('#menu'), um = $('#um');
  const setMenu = o => { menu.classList.toggle('open', o); um.setAttribute('aria-expanded', String(o)); };
  um.onclick = e => { e.stopPropagation(); setMenu(!menu.classList.contains('open')); };
  menu.onclick = e => { if (e.target.closest('a')) setMenu(false); };
  $('#out').onclick = signOut;
  mounted = 'shell:' + user.id;
}
document.addEventListener('click', e => { if (!e.target.closest('.usermenu')) $('#menu')?.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#menu')?.classList.remove('open'); });

async function render() {
  const { path, query } = parse();
  if (!session.user && token.get()) { try { session.user = (await api.get('/auth/me')).user; } catch { token.clear(); } }
  const ctx = { query, go, session, signOut };

  const authPage = { '/login': auth.login, '/signup': auth.signup, '/forgot': auth.forgot, '/reset': auth.reset }[path];
  if (authPage) { mounted = ''; return authPage(app, ctx); }

  const home = session.user && homeFor(session.user);
  if (path === '/' && session.user) return go(home);
  const publicPage = PUBLIC[path];
  if (publicPage) {
    if (publicPage === pub.landing && mounted === 'landing') return pub.scrollToSection(pub.LANDING[path]);   // already on the home page: just glide
    mounted = publicPage === pub.landing ? 'landing' : '';
    return publicPage(app, ctx, path);
  }

  const match = ROUTES.map(([re, roles, fn]) => [path.match(re), roles, fn]).find(([m]) => m);
  if (!session.user) { if (match) return go('/login'); mounted = ''; return pub.notFound(app, ctx); }

  if (mounted !== 'shell:' + session.user.id || !$('#view')) shell(session.user);
  if (!match) return setHTML($('#view'), html`<div class="page"><div class="card empty"><b>Page not found</b><a href="#${home}">Go to ${session.user.role === 'customer' ? 'your subscriptions' : 'the dashboard'}</a></div></div>`);
  const [m, roles, fn] = match;
  if (!roles.includes(session.user.role)) { toast('You do not have access to that page', 'err'); return go(home); }
  $$('[data-nav]').forEach(a => { const on = path === a.dataset.nav || path.startsWith(a.dataset.nav + '/'); a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  $('.secnav a.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  const view = $('#view'); window.scrollTo(0, 0);
  try { await fn(view, { params: m.slice(1), query, user: session.user, go, signOut }); }
  catch (e) { setHTML(view, html`<div class="page"><div class="card empty"><b>Something went wrong</b>${e.message}</div></div>`); }
}
window.addEventListener('hashchange', render);
render();
