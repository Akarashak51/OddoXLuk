/* Inline SVG icons and illustrations. Everything uses CSS variables, so every drawing re-colours with the theme. */
const P = {
  dashboard: 'M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-12h8V3h-8z',
  loop: 'M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
  invoice: 'M6 2h9l5 5v15H6zm8 1.5V8h4.5M9 13h8M9 17h8',
  card: 'M2 6h20v12H2zm0 4h20M6 15h4',
  users: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zm9 4v10M3 7l9 4 9-4',
  plans: 'M4 5h16v4H4zm0 6h16v4H4zm0 6h10v2H4z',
  template: 'M5 3h14v18H5zm3 5h8M8 12h8M8 16h5',
  tax: 'M19 5L5 19M7 7h.01M17 17h.01',
  discount: 'M20 12l-8 8-9-9V3h8zM7.5 7.5h.01',
  team: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 21a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 6.8M19 14.5a7 7 0 0 1 3 6.5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  logout: 'M9 21H4V3h5M16 17l5-5-5-5M21 12H9',
  calendar: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  key: 'M14 10a5 5 0 1 0-3.9 4.9L12 17h2v2h2v2h3v-3l-5.1-5.1',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z',
  book: 'M4 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6M20 4v15h-6',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01',
  menu: 'M4 6h16M4 12h16M4 18h16',
  home: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z',
  pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  palette: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.7-2.5H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
  down: 'M6 9l6 6 6-6',
};
export const icon = (n, s = 18, w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || n}"/></svg>`;

/* ---------- illustrations ---------- */
const B = 'stroke:var(--brand)', O = 'stroke:var(--orange)', K = 'stroke:var(--ink)';
const FB = 'fill:var(--brand)', FO = 'fill:var(--orange)', FL = 'fill:var(--orange-l)', FC = 'fill:var(--card)', FBL = 'fill:var(--brand-l)', FG = 'fill:var(--green)';

export const step1 = `<svg width="92" height="92" viewBox="0 0 96 96" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M14 30l30-16h30a8 8 0 0 1 8 8v30L52 82a8 8 0 0 1-11 0L14 55a8 8 0 0 1 0-11z" style="${FL};${B}"/><circle cx="64" cy="31" r="5" style="${FC};${B}"/>
  <path d="M34 55h20M44 45v20" style="${K}"/><path d="M71 71a13 13 0 1 1 3 8" style="${O}"/><path d="M76 85l-2-6 6-1" style="${O}"/></svg>`;
export const step2 = `<svg width="92" height="92" viewBox="0 0 96 96" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M22 10h38l16 16v60H22z" style="${FC};${K}"/><path d="M60 10v16h16" style="${FL};${K}"/><path d="M32 40h34M32 52h34M32 64h18" style="${B}"/>
  <circle cx="68" cy="70" r="15" style="${FB};stroke:var(--card)"/><path d="M61 70l5 5 9-10" style="stroke:#fff"/></svg>`;
export const step3 = `<svg width="92" height="92" viewBox="0 0 96 96" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect x="12" y="18" width="72" height="64" rx="10" style="${FC};${K}"/><path d="M12 38h72M32 10v14M64 10v14" style="${K}"/>
  <circle cx="48" cy="60" r="14" style="${FBL};${B}"/><path d="M44 53l12 7-12 7z" style="${FB};${B}"/></svg>`;
export const step4 = `<svg width="92" height="92" viewBox="0 0 96 96" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M16 10h46l14 14v62H16z" style="${FC};${K}"/><path d="M26 34h30M26 46h22" style="${B}"/>
  <circle cx="64" cy="66" r="19" style="${FO};stroke:var(--card)"/><text x="64" y="73" text-anchor="middle" font-size="22" font-weight="800" style="fill:#1a1210;stroke:none;font-family:system-ui">₹</text>
  <circle cx="26" cy="72" r="9" style="${FG};stroke:var(--card)"/><path d="M22 72l3 3 5-6" style="stroke:#fff"/></svg>`;

/* Audience illustrations */
export const artFinance = `<svg viewBox="0 0 280 210" width="100%" style="max-width:300px" aria-hidden="true"><rect x="8" y="10" width="264" height="190" rx="16" style="${FC};stroke:var(--line2)" stroke-width="2"/>
  <g stroke-width="0">${[40, 70, 52, 96, 78, 124].map((h, i) => `<rect x="${34 + i * 38}" y="${170 - h}" width="22" height="${h}" rx="5" style="fill:var(--${i % 2 ? 'brand' : 'orange'})"/>`).join('')}</g>
  <path d="M30 60c30-22 50 10 80-6s60-28 90-8 40 6 52-6" fill="none" style="${K}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8"/><circle cx="252" cy="40" r="6" style="${FB}"/>
  <rect x="30" y="26" width="70" height="10" rx="5" style="fill:var(--line2)"/></svg>`;
export const artStaff = `<svg viewBox="0 0 280 210" width="100%" style="max-width:300px" aria-hidden="true"><rect x="8" y="10" width="264" height="190" rx="16" style="${FC};stroke:var(--line2)" stroke-width="2"/>
  ${[0, 1, 2, 3].map(i => `<g><rect x="26" y="${30 + i * 40}" width="228" height="30" rx="9" style="fill:var(--card2);stroke:var(--line)"/><circle cx="46" cy="${45 + i * 40}" r="8" style="fill:var(--${i % 2 ? 'orange' : 'brand'})"/><rect x="64" y="${40 + i * 40}" width="${90 - i * 8}" height="8" rx="4" style="fill:var(--line2)"/><rect x="196" y="${38 + i * 40}" width="46" height="14" rx="7" style="fill:var(--${i === 2 ? 'orange-l' : i === 0 ? 'green-l' : 'brand-l'})"/></g>`).join('')}</svg>`;
export const artCustomer = `<svg viewBox="0 0 280 210" width="100%" style="max-width:300px" aria-hidden="true"><rect x="8" y="10" width="264" height="190" rx="16" style="${FC};stroke:var(--line2)" stroke-width="2"/>
  <circle cx="52" cy="52" r="20" style="${FB}"/><text x="52" y="60" text-anchor="middle" font-size="22" font-weight="800" style="fill:#fff;font-family:system-ui">M</text><rect x="84" y="40" width="96" height="10" rx="5" style="fill:var(--line2)"/><rect x="84" y="58" width="60" height="8" rx="4" style="fill:var(--line)"/>
  <rect x="26" y="92" width="106" height="92" rx="12" style="fill:var(--brand-l)"/><rect x="40" y="108" width="50" height="8" rx="4" style="fill:var(--line2)"/><text x="40" y="150" font-size="24" font-weight="800" style="fill:var(--ink);font-family:system-ui">₹2,400</text><rect x="40" y="162" width="62" height="12" rx="6" style="fill:var(--orange)"/>
  <rect x="148" y="92" width="106" height="92" rx="12" style="fill:var(--orange-l)"/><rect x="162" y="108" width="50" height="8" rx="4" style="fill:var(--line2)"/><circle cx="170" cy="150" r="14" style="${FG}"/><path d="M164 150l4 4 8-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="162" y="168" width="62" height="8" rx="4" style="fill:var(--line2)"/></svg>`;
