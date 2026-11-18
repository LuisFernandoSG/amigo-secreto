/**
 * Sistema de Iconografía Vectorial SVG Personalizada
 * Reemplaza los emojis genéricos del sistema por iconos vectoriales limpios y medallones ilustrados.
 */

const UI_ICONS = {
  pineTree: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-7 9h4l-4 7h14l-4-7h4L12 3z"/><path d="M12 19v3"/></svg>`,
  gift: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></svg>`,
  star: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  sparkles: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/></svg>`,
  users: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  message: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>`,
  settings: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="21" y2="21"/><line x1="4" x2="20" y1="14" y2="14"/><line x1="4" x2="20" y1="7" y2="7"/><circle cx="14" cy="14" r="2"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="21" r="2"/></svg>`,
  plus: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  link: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  external: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>`,
  copy: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
  share: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  calendar: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  mapPin: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  tag: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,
  lock: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  unlock: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  shuffle: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>`,
  refresh: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  trash: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  check: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  volumeOn: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  volumeOff: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>`,
  music: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  user: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  logOut: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
  chevronDown: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
  close: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  shield: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>`,
  shirt: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`,
  download: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
  mail: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  crown: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`,
  ticket: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
  edit: `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
};

// Avatares vectoriales ilustrados (Sin emojis genéricos)
const AVATARS = {
  santa: {
    label: 'Gorro Noel',
    bg: '#fef2f2',
    color: '#b91c1c',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="M7 24c0-8 5-15 13-15 5 0 8 3 9 7l-3 2c-1-2-3-3-6-3-5 0-8 4-8 9H7z" fill="#b91c1c"/><rect x="5" y="23" width="22" height="5" rx="2.5" fill="#fff" stroke="#b91c1c" stroke-width="2"/><circle cx="29" cy="17" r="3.5" fill="#fff" stroke="#b91c1c" stroke-width="2"/></svg>`,
  },
  reindeer: {
    label: 'Reno Nórdico',
    bg: '#fef3c7',
    color: '#92400e',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="M11 8v6m0-3H8m3 0h3M25 8v6m0-3h-3m3 0h3" stroke="#92400e" stroke-width="2.2" stroke-linecap="round"/><circle cx="18" cy="21" r="7" fill="#d97706" fill-opacity="0.2" stroke="#92400e" stroke-width="2"/><circle cx="18" cy="23" r="2.5" fill="#b91c1c"/></svg>`,
  },
  tree: {
    label: 'Pino Invernal',
    bg: '#e8f3ee',
    color: '#164e35',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="M18 6 9 18h5l-4 9h16l-4-9h5L18 6Z" fill="#164e35" fill-opacity="0.18" stroke="#164e35" stroke-width="2" stroke-linejoin="round"/><path d="M18 27v4" stroke="#164e35" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
  star: {
    label: 'Estrella Polar',
    bg: '#fef9c3',
    color: '#b45309',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="m18 6 3.2 7.3L29 14.5l-5.6 5.2 1.5 7.6L18 23.6l-6.9 3.7 1.5-7.6-5.6-5.2 7.8-1.2L18 6z" fill="#f59e0b" fill-opacity="0.25" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/></svg>`,
  },
  mrs_claus: {
    label: 'Corona Acebo',
    bg: '#ecfdf5',
    color: '#047857',
    svg: `<svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="9" stroke="#047857" stroke-width="2.5" stroke-dasharray="4 2"/><circle cx="18" cy="9" r="2.5" fill="#b91c1c"/><circle cx="15" cy="10" r="2" fill="#b91c1c"/><circle cx="21" cy="10" r="2" fill="#b91c1c"/></svg>`,
  },
  elf: {
    label: 'Campana Oro',
    bg: '#fffbeb',
    color: '#b45309',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="M18 8a7 7 0 0 0-7 7v5l-2 3h18l-2-3v-5a7 7 0 0 0-7-7Z" fill="#f59e0b" fill-opacity="0.2" stroke="#b45309" stroke-width="2"/><circle cx="18" cy="26" r="2.2" fill="#b45309"/></svg>`,
  },
  snowman: {
    label: 'Copo Cristal',
    bg: '#f0f9ff',
    color: '#0369a1',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="M18 7v22M7 18h22m-17.8-7.8 15.6 15.6m0-15.6L10.2 25.8" stroke="#0369a1" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  gingerbread: {
    label: 'Taza Cacao',
    bg: '#fdf4ff',
    color: '#86198f',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="M10 14h12v8a6 6 0 0 1-12 0v-8Z" fill="#86198f" fill-opacity="0.15" stroke="#86198f" stroke-width="2"/><path d="M22 16h2.5a2.5 2.5 0 0 1 0 5H22" stroke="#86198f" stroke-width="2"/><path d="M14 10c0-1.5 1.5-1.5 1.5-3M18 10c0-1.5 1.5-1.5 1.5-3" stroke="#86198f" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  angel: {
    label: 'Vela Cálida',
    bg: '#fff7ed',
    color: '#c2410c',
    svg: `<svg viewBox="0 0 36 36" fill="none"><rect x="14" y="16" width="8" height="12" rx="1.5" fill="#c2410c" fill-opacity="0.15" stroke="#c2410c" stroke-width="2"/><path d="M18 8c2 2.5 2 5 0 6-2-1-2-3.5 0-6Z" fill="#f59e0b" stroke="#c2410c" stroke-width="1.8"/><path d="M11 28h14" stroke="#c2410c" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  penguin: {
    label: 'Regalo Real',
    bg: '#fef2f2',
    color: '#991b1b',
    svg: `<svg viewBox="0 0 36 36" fill="none"><rect x="9" y="14" width="18" height="14" rx="2" fill="#991b1b" fill-opacity="0.15" stroke="#991b1b" stroke-width="2"/><path d="M18 14v14M9 20h18" stroke="#991b1b" stroke-width="2"/><path d="M18 14c-3-4-6-1-3 0m3 0c3-4 6-1 3 0" stroke="#991b1b" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  nutcracker: {
    label: 'Esfera Fiesta',
    bg: '#f5f3ff',
    color: '#5b21b6',
    svg: `<svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="20" r="8" fill="#5b21b6" fill-opacity="0.15" stroke="#5b21b6" stroke-width="2"/><rect x="15.5" y="9" width="5" height="3" rx="1" stroke="#5b21b6" stroke-width="1.8"/><path d="M11 19c3 2 5 2 7 0s4-2 7 0" stroke="#5b21b6" stroke-width="1.8"/></svg>`,
  },
  polar_bear: {
    label: 'Corazón Invierno',
    bg: '#fff1f2',
    color: '#be123c',
    svg: `<svg viewBox="0 0 36 36" fill="none"><path d="M18 27s-8-5.2-8-11a4.8 4.8 0 0 1 8-3.5A4.8 4.8 0 0 1 26 16c0 5.8-8 11-8 11Z" fill="#be123c" fill-opacity="0.16" stroke="#be123c" stroke-width="2" stroke-linejoin="round"/></svg>`,
  },
};

function renderAvatarBadge(key, size = 'md') {
  const item = AVATARS[key] || AVATARS.santa;
  return `
    <span class="custom-avatar custom-avatar-${size}" style="background:${item.bg}; color:${item.color};" title="${item.label}">
      ${item.svg}
    </span>
  `;
}

window.UI_ICONS = UI_ICONS;
window.AVATARS = AVATARS;
window.renderAvatarBadge = renderAvatarBadge;
