/* Two themes: "light" (dark white) and "dark" (dark red). Stored per browser; falls back to the OS setting. */
import { raw } from './ui.js';
const KEY = 'bl_theme';
export const getTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
export function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* private mode: theme still applies for this visit */ }
  document.querySelectorAll('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#170708' : '#c1291d');
}
export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');

const S = '<svg class="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const M = '<svg class="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 13.2A8.5 8.5 0 1 1 10.8 3a6.7 6.7 0 0 0 10.2 10.2z"/></svg>';
export const themeBtn = raw(`<button type="button" class="icon-btn theme-ico" data-theme-toggle aria-label="Switch between the light and dark red themes" title="Switch theme">${S}${M}</button>`);

document.addEventListener('click', e => {
  if (e.target.closest('[data-theme-toggle]')) toggleTheme();
  const s = e.target.closest('[data-theme-set]'); if (s) setTheme(s.dataset.themeSet);
});
