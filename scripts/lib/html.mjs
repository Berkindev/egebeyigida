// Ortak HTML parçaları: layout, header/footer, kartlar, ikonlar.
import { site, waLink } from '../../src/data/site.mjs';
import { categories } from '../../src/data/catalog.mjs';

export const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const icon = {
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01Zm-7.01 15.24a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
};

export const waBtn = (label, msg, ref, cls = '') =>
  `<a class="btn btn--wa ${cls}" href="${esc(waLink(msg, ref))}" target="_blank" rel="noopener" data-wa="${esc(ref)}">${icon.wa}<span>${esc(label)}</span></a>`;

/** Responsive <picture>. img = processImage() çıktısı. */
export function pic(img, alt, { sizes = '100vw', eager = false, cls = '' } = {}) {
  if (!img) return '';
  const srcset = img.variants.map((v) => `${v.url} ${v.w}w`).join(', ');
  const mid = img.variants[Math.min(1, img.variants.length - 1)];
  return `<img class="${cls}" src="${mid.url}" srcset="${srcset}" sizes="${sizes}" width="${mid.w}" height="${mid.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

export const placeholder = (name) => `<div class="pcard__ph" role="img" aria-label="${esc(name)} — görsel yakında">${esc(name)}</div>`;

const NAV = [
  ['/avokado/', 'Avokado'],
  ['/enginar/', 'Enginar'],
  ['/egzotik-meyveler/', 'Egzotik Meyve'],
  ['/urunlerimiz/', 'Tüm Ürünler'],
  ['/rehber/', 'Rehber'],
  ['/hakkimizda/', 'Hakkımızda'],
  ['/iletisim/', 'İletişim'],
];

function header(path) {
  const items = NAV.map(([href, label]) => `<li><a href="${href}"${path === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<a class="skip" href="#icerik">İçeriğe geç</a>
<div class="top"><div class="wrap top__one">İstanbul ve İzmir geneline her gün soğuk zincir teslimat</div></div>
<header class="header"><div class="wrap">
  <a class="logo" href="/" aria-label="${esc(site.name)} ana sayfa"><img src="/img/logo.webp" width="240" height="101" alt="${esc(site.legalName)}"></a>
  <button class="burger" aria-expanded="false" aria-controls="nav" aria-label="Menüyü aç"><span></span></button>
  <nav class="nav" id="nav" aria-label="Ana menü"><ul>${items}</ul>
    <div class="nav__cta">${waBtn('WhatsApp’tan yazın', 'Ürünleriniz için fiyat ve katalog bilgisi alabilir miyim?', 'WEB-MENU')}</div>
  </nav>
  <div class="header__cta">${waBtn('Fiyat & Katalog', 'Ürünleriniz için güncel fiyat ve katalog bilgisi alabilir miyim?', 'WEB-HEADER', 'btn--sm')}</div>
</div></header>`;
}

function footer() {
  const cats = categories.map((c) => `<li><a href="/${c.slug}/">${esc(c.name)}</a></li>`).join('');
  const l = site.locations[0];
  const locs = `<address>${esc(l.street)}<br>${esc(l.district)} / İstanbul</address><p>İstanbul ve İzmir geneline her gün soğuk zincir teslimat</p>`;
  return `<footer class="footer"><div class="wrap">
  <div class="footer__grid">
    <div class="footer__brand"><img src="/img/logo.webp" width="240" height="101" alt="" loading="lazy"><p>İstanbul ve İzmir’deki otel, restoran ve kafelere toptan avokado ve enginar tedariki.</p></div>
    <div><h2>Ürünler</h2><ul>${cats}</ul></div>
    <div><h2>Kurumsal</h2><ul><li><a href="/hakkimizda/">Hakkımızda</a></li><li><a href="/istanbul/">İstanbul</a></li><li><a href="/izmir/">İzmir</a></li><li><a href="/rehber/">Rehber</a></li><li><a href="/sss/">Sık sorulan sorular</a></li><li><a href="/iletisim/">İletişim</a></li></ul></div>
    <div><h2>İletişim</h2>${locs}<ul><li><a href="tel:${site.phone}">${site.phoneDisplay}</a></li><li><a href="mailto:${site.email}">${site.email}</a></li><li><a href="${site.instagram}" rel="noopener">Instagram ${site.instagramHandle}</a></li></ul></div>
  </div>
  <div class="footer__bottom"><span>© ${new Date().getFullYear()} ${esc(site.legalName)}</span></div>
</div></footer>
<a class="fab" href="${esc(waLink('Ürünleriniz için fiyat ve katalog bilgisi alabilir miyim?', 'WEB-FAB'))}" target="_blank" rel="noopener" data-wa="WEB-FAB">${icon.wa}<span>WhatsApp</span></a>
<div class="mbar"><a class="btn btn--ghost" href="tel:${site.phone}">${icon.phone}<span>Ara</span></a>${waBtn('WhatsApp', 'Ürünleriniz için fiyat ve katalog bilgisi alabilir miyim?', 'WEB-MOBIL')}</div>`;
}

/**
 * Tam sayfa. p: { path, title, description, body, schema[], og, ogType, noindex, mdPath }
 */
export function layout(p) {
  const url = site.url + p.path;
  const title = p.path === '/' || `${p.title} | ${site.name}`.length > 62 ? p.title : `${p.title} | ${site.name}`;
  const og = site.url + (p.og || '/img/og-default.jpg');
  const schema = (p.schema || []).filter(Boolean);
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
${p.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
<link rel="alternate" type="text/markdown" href="${p.path.endsWith('/') ? p.path + 'index.md' : p.path.replace(/\.html$/, '.md')}" title="Markdown">
<meta name="theme-color" content="#43241A">
<meta name="geo.region" content="TR-34">
<meta name="geo.placename" content="İstanbul; İzmir">
<meta property="og:locale" content="tr_TR">
<meta property="og:type" content="${p.ogType || 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/instrument-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css?v=${p.v}">
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body>
${header(p.path)}
<main id="icerik">
${p.body}
</main>
${footer()}
<script src="/assets/site.js?v=${p.v}" defer></script>
</body>
</html>`;
}

export function crumbs(items) {
  return `<nav class="crumbs wrap" aria-label="Sayfa yolu"><ol>${items.map(([href, label], i) => `<li>${i < items.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}</li>`).join('')}</ol></nav>`;
}

export function faqBlock(list) {
  return `<div class="faq">${list.map((f) => `<details><summary>${esc(f.q)}</summary><div><p>${esc(f.a)}</p></div></details>`).join('')}</div>`;
}
