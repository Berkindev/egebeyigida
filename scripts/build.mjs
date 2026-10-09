// Egebeyi Gıda statik site üreticisi. Kullanım: node scripts/build.mjs
// Çıktı: dist/ (Cloudflare Pages bu klasörü yayınlar). Bağımlılık yok.
import { rmSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { site, waLink } from '../src/data/site.mjs';
import { categories, products, productsByCat, catBySlug } from '../src/data/catalog.mjs';
import { faqs, cities, guides } from '../src/data/content.mjs';
import { processImage } from './lib/images.mjs';
import { layout, esc, icon, waBtn, pic, placeholder, crumbs, faqBlock } from './lib/html.mjs';

const DIST = 'dist';
const TODAY = new Date().toISOString().slice(0, 10);
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// ── Statik dosyalar ─────────────────────────────────────────
cpSync('src/public', DIST, { recursive: true });
cpSync('legacy/wp-content', join(DIST, 'wp-content'), { recursive: true }); // eski görsel URL'leri korunur
mkdirSync(join(DIST, 'assets'), { recursive: true });
const css = readFileSync('src/assets/css/site.css', 'utf8');
const js = readFileSync('src/assets/js/site.js', 'utf8');
const V = createHash('sha1').update(css + js).digest('hex').slice(0, 8);
writeFileSync(join(DIST, 'assets/site.css'), css);
writeFileSync(join(DIST, 'assets/site.js'), js);

// ── Görseller ───────────────────────────────────────────────
const IMG = {};
const img = (src, name) => (src ? (IMG[name] ??= processImage(src, name, DIST)) : null);
const LOGO = processImage('legacy/wp-content/uploads/2023/06/cropped-EgeBeyiLOGO-01.png', 'egebeyi-gida-logo', DIST);
cpSync(join(DIST, 'img', LOGO.variants[0].file), join(DIST, 'img/logo.webp'));
const STOCK = 'src/images/stock/';
const stock = (f) => (existsSync(STOCK + f) ? STOCK + f : null);
const HERO = {
  a: img('images/avokado-agaci.jpeg', 'avokado-bahcesi'),
  b: img(stock('hass-avokado-2.jpg') || 'pics/Hass Avocado.webp', 'ikiye-kesilmis-hass-avokado'),
  c: img(stock('enginar-kalbi.jpg') || 'images/enginar-fine-dining.jpeg', 'sapli-enginar-kalbi-tabak'),
  crates: img('pics/7710ad573522dc2a5bb627628231a0ad.jpg', 'yerli-avokado-kasalar'),
  domates: img('images/marine-domates-gercek.jpeg', 'marine-kuru-domates-tepsi'),
};
const FOCUS = {
  avokado: img(stock('avokado-dilim.jpg') || 'pics/7710ad573522dc2a5bb627628231a0ad.jpg', 'dilimlenmis-avokado'),
  enginar: img(stock('enginar-tabak.jpg') || 'images/enginar-fine-dining.jpeg', 'firinda-enginar-tabak'),
};
cpSync(join(DIST, HERO.crates.ogFile), join(DIST, 'img/og-default.jpg'));
for (const c of categories) { c.cover = img(c.img, `${c.slug}-egebeyi-gida`); c.image = img(c.photo || c.img, `toptan-${c.slug}`); }
for (const p of products) p.image = img(p.img, `toptan-${p.slug}`);

// ── Yardımcılar ─────────────────────────────────────────────
const pages = []; // { path, html, md, lastmod, images[] }
const abs = (p) => site.url + p;
function emit(path, html, md, extra = {}) {
  const file = path.endsWith('/') ? join(DIST, path, 'index.html') : join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  if (md) writeFileSync(path.endsWith('/') ? join(DIST, path, 'index.md') : file.replace(/\.html$/, '.md'), md);
  pages.push({ path, md, ...extra });
}
const productMsg = (p) => `${p.name} için fiyat ve katalog bilgisi alabilir miyim?`;
const clip = (s, n = 158) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:—-]\s*$/, '') + '…');
const ref = (s) => 'WEB-' + s.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 24);

// ── Schema.org ──────────────────────────────────────────────
const ORG_ID = `${site.url}/#org`;
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.name,
  legalName: site.legalName,
  alternateName: ['Egebeyi', 'Ege Beyi Gıda', 'EgebeyiGıda'],
  url: site.url,
  logo: abs('/img/logo.webp'),
  description: site.description,
  email: site.email,
  telephone: site.phone,
  sameAs: [site.instagram],
  areaServed: site.serviceAreas.map((n) => ({ '@type': 'City', name: n })),
  knowsAbout: ['Toptan avokado', 'Hass avokado', 'Enginar kalbi', 'Ege otları', 'Deniz börülcesi', 'Kaya koruğu', 'Egzotik meyve', 'Butik turşu', 'HoReCa tedarik'],
  contactPoint: { '@type': 'ContactPoint', telephone: site.phone, contactType: 'sales', areaServed: 'TR', availableLanguage: ['tr'] },
  subOrganization: site.locations.map((l) => ({ '@id': `${site.url}/#${l.id}` })),
};
const locSchema = (l) => ({
  '@context': 'https://schema.org',
  '@type': 'WholesaleStore',
  '@id': `${site.url}/#${l.id}`,
  name: `${site.name} — ${l.label}`,
  parentOrganization: { '@id': ORG_ID },
  url: site.url + `/${l.id}/`,
  image: abs(HERO.crates.og),
  logo: abs('/img/logo.webp'),
  telephone: site.phone,
  email: site.email,
  priceRange: '₺₺',
  address: { '@type': 'PostalAddress', streetAddress: l.street, addressLocality: l.district, addressRegion: l.region, postalCode: l.postalCode, addressCountry: 'TR' },
  geo: { '@type': 'GeoCoordinates', latitude: l.geo.lat, longitude: l.geo.lng },
  hasMap: l.maps,
  areaServed: { '@type': 'City', name: l.city },
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Toptan ürün kataloğu', itemListElement: categories.map((c) => ({ '@type': 'OfferCatalog', name: c.name, url: abs(`/${c.slug}/`) })) },
});
const websiteSchema = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${site.url}/#website`, url: site.url, name: site.name, inLanguage: 'tr-TR', publisher: { '@id': ORG_ID } };
const breadcrumbSchema = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([href, name], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(href) })) });
const faqSchema = (list) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });

// ── Bileşenler ──────────────────────────────────────────────
const pcard = (p) => `<article class="pcard reveal">
  <a class="pcard__link" href="/${p.slug}/">
    <div class="pcard__img">${pic(p.image, p.alt || p.name, { sizes: '(max-width: 560px) 50vw, 260px' })}</div>
    <div class="pcard__body"><h3>${esc(p.name)}</h3><p>${esc(p.short)}</p></div>
  </a>
  <a class="btn btn--ghost btn--sm pcard__cta" href="${esc(waLink(productMsg(p), ref(p.slug)))}" target="_blank" rel="noopener" data-wa="${ref(p.slug)}">${icon.wa}<span>Fiyat Al</span></a>
</article>`;

const catCard = (c) => `<a class="cat reveal" href="/${c.slug}/">
  <div class="cat__img">${pic(c.image, c.photoAlt || c.name, { sizes: '(max-width: 600px) 100vw, 380px' })}</div>
  <div class="cat__body"><h3>${esc(c.name)}</h3><p>${esc(c.lead.split('. ')[0].replace(/\.$/, ''))}.</p>
  <span class="cat__count"><span>${productsByCat(c.slug).length} ürün</span>${icon.arrow.replace('<svg', '<svg width="18" height="18"')}</span></div>
</a>`;

const ctaBand = (title, text, msg, r) => `<section class="section"><div class="wrap"><div class="cta-band reveal">
  <div><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
  <div class="btn-row">${waBtn('WhatsApp’tan Yazın', msg, r)}<a class="btn btn--ghost" href="tel:${site.phone}">${icon.phone}<span>${site.phoneDisplay}</span></a></div>
</div></div></section>`;

const HQ = site.locations[0];
const locCards = () => `<div class="locs">
<div class="loc reveal"><span class="eyebrow">İstanbul</span><h3>İstanbul Dağıtım & Merkez Depo</h3>
  <address>${esc(HQ.street)}<br>${esc(HQ.district)} / İstanbul</address>
  <p class="muted">Avrupa ve Anadolu Yakası’ndaki tüm otel, restoran ve catering işletmelerine periyodik soğuk zincir teslimat.</p>
  <div class="btn-row"><a class="btn btn--dark btn--sm" href="/istanbul/">İstanbul Teslimat</a><a class="btn btn--ghost btn--sm" href="${esc(HQ.maps)}" target="_blank" rel="noopener">${icon.pin}<span>Haritada Aç</span></a></div></div>
<div class="loc reveal"><span class="eyebrow">İzmir</span><h3>İzmir Dağıtım Ağı</h3>
  <p class="muted">Çeşme, Alaçatı, Urla ve İzmir merkez hattındaki işletmelere düzenli toptan sevkiyat.</p>
  <div class="btn-row"><a class="btn btn--dark btn--sm" href="/izmir/">İzmir Teslimat</a></div></div>
</div>`;

// Odak ürün bloğu (ana sayfa): görsel + başlık + "Etiket: açıklama" maddeleri + çeşit listesi
const focusBlock = (c, image, { imageAlt, rev = false, items = 3 }) => {
  const list = productsByCat(c.slug);
  return `<section class="section focus${rev ? ' focus--rev' : ''}"><div class="wrap focus__grid">
  <figure class="focus__media reveal">${pic(image, imageAlt || c.photoAlt || c.name, { sizes: '(max-width: 860px) 100vw, 600px' })}</figure>
  <div class="reveal">
    <span class="eyebrow">${esc(c.homeEyebrow || c.name)}</span>
    <h2>${esc(c.homeH2 || c.h1)}</h2>
    <p class="lead">${esc(c.lead)}</p>
    <ul class="focus__list">${(c.highlights || []).slice(0, items).map(([t, d]) => `<li><strong>${esc(t)}:</strong> ${esc(d)}</li>`).join('')}</ul>
    ${c.listLabel ? `<p class="focus__vars"><span>${esc(c.listLabel)}:</span> ${list.map((p) => `<a href="/${p.slug}/">${esc(p.name.replace(/ \(.*\)$/, ''))}</a>`).join(' • ')}</p>` : ''}
    <div class="btn-row">${waBtn(c.ctaWa || 'Fiyat Alın', `${c.name} için güncel fiyat ve katalog bilgisi alabilir miyim?`, ref(c.slug))}<a class="btn btn--dark" href="/${c.slug}/">${esc(c.ctaPage || `${c.name} Çeşitleri`)}</a></div>
  </div>
</div></section>`;
};

const compareTable = (c) => (c.compare ? `<div class="compare-wrap reveal"><table class="compare"><caption>${esc(c.compare.caption)}</caption>
<thead><tr>${c.compare.cols.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
<tbody>${c.compare.rows.map(([slug, ...cells]) => { const p = products.find((x) => x.slug === slug); return `<tr><th scope="row"><a href="/${slug}/">${esc(p ? p.name : slug)}</a></th>${cells.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>` : '');
const mdCompare = (c) => (c.compare ? `## ${c.compare.caption}\n| ${c.compare.cols.join(' | ')} |\n|${c.compare.cols.map(() => '---').join('|')}|\n${c.compare.rows.map(([slug, ...cells]) => `| ${products.find((x) => x.slug === slug)?.name || slug} | ${cells.join(' | ')} |`).join('\n')}\n\n` : '');
const highlights = (c) => (c.highlights ? `<div class="hl">${c.highlights.map(([t, d], i) => `<div class="hl__item reveal"><span class="hl__n">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>` : '');

// Markdown yardımcıları (ajanlar ve llms-full.txt için)
const mdContact = `\n---\n**Sipariş ve fiyat:** WhatsApp ${site.phoneDisplay} (https://wa.me/${site.whatsapp}) · E-posta ${site.email}\n**Teslimat:** İstanbul ve İzmir geneli\n**Adres (İstanbul depo):** ${HQ.street}, ${HQ.district}/İstanbul\n`;
const mdTable = (rows) => (rows.length ? `| Özellik | Bilgi |\n|---|---|\n${rows.map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n` : '');

// ════════════════════════════════════════════════════════════
// ANA SAYFA — odak: avokado + enginar; 2. odak: egzotik; yan ürünler kompakt
// ════════════════════════════════════════════════════════════
{
  const cat = (slug) => categories.find((c) => c.slug === slug);
  const tier2 = categories.filter((c) => c.tier === 2);
  const tier3 = categories.filter((c) => c.tier === 3);
  const exotic = tier2.flatMap((c) => productsByCat(c.slug)).filter((p) => p.image).slice(0, 8);
  const homeFaqs = faqs.slice(0, 6);
  const miniCat = (c) => `<a class="mini reveal" href="/${c.slug}/"><div class="mini__img">${pic(c.image, c.photoAlt || c.name, { sizes: '120px' })}</div><div><h3>${esc(c.homeLabel || c.name)}</h3><p>${esc(c.homeItems || '')}</p></div></a>`;
  const ex = cat('egzotik-meyveler');
  const body = `
<section class="hero"><div class="wrap">
  <div>
    <span class="eyebrow">Toptan Avokado & Enginar</span>
    <h1>İstanbul ve İzmir’de Otel ve Restoranlar İçin <em>Toptan Avokado & Enginar</em> Tedariki</h1>
    <p class="lead">Mutfak operasyonlarınıza hız ve standart kazandırıyoruz. İthal Hass ve yerli avokado çeşitlerinden ayıklanmış saplı enginar kalbi, çanak ve ızgara enginara kadar en taze mahsulleri soğuk zincir güvencesiyle her gün işletmenize teslim ediyoruz.</p>
    <div class="btn-row">${waBtn('WhatsApp’tan Güncel Fiyat & Katalog İsteyin', 'Avokado ve enginar ürünleriniz için güncel fiyat ve katalog bilgisi alabilir miyim?', 'WEB-HERO')}</div>
    <ul class="hero__points">
      <li><strong>Hass & Yerli Avokado:</strong> Reçetenize uygun olgunluk derecesinde</li>
      <li><strong>Hazır Enginar:</strong> Ayıklanmış kalpler, firesiz tabaklar</li>
      <li><strong>Kesintisiz Lojistik:</strong> İstanbul ve İzmir içi günlük soğuk zincir sevkiyat</li>
    </ul>
  </div>
  <div class="mosaic">
    <figure>${pic(HERO.a, 'Avokado bahçesinde dalda yerli avokadolar', { sizes: '(max-width: 860px) 60vw, 340px', eager: true })}<figcaption>Yerli avokado</figcaption></figure>
    <figure>${pic(HERO.b, 'İkiye kesilmiş Hass avokado', { sizes: '(max-width: 860px) 40vw, 260px', eager: true })}<figcaption>Hass</figcaption></figure>
    <figure>${pic(HERO.c, 'Beyaz tabakta saplı Roma tipi enginar kalpleri', { sizes: '(max-width: 860px) 40vw, 260px' })}<figcaption>Saplı enginar kalbi</figcaption></figure>
  </div>
</div></section>

${focusBlock(cat('avokado'), FOCUS.avokado, { imageAlt: 'Tahta üzerinde ikiye kesilmiş ve dilimlenmiş avokado' })}
${focusBlock(cat('enginar'), FOCUS.enginar, { imageAlt: 'Beyaz tabakta fırınlanmış enginar', rev: true })}

<section class="section section--cream"><div class="wrap focus__grid">
  <figure class="focus__media reveal">${pic(ex.image, ex.photoAlt, { sizes: '(max-width: 860px) 100vw, 600px' })}</figure>
  <div class="reveal">
    <span class="eyebrow">${esc(ex.homeEyebrow)}</span>
    <h2>${esc(ex.homeH2)}</h2>
    <p class="lead">${esc(ex.lead)}</p>
    <ul class="focus__list">${ex.highlights.map(([t, d]) => `<li><strong>${esc(t)}:</strong> ${esc(d)}</li>`).join('')}</ul>
    <div class="btn-row">${waBtn(ex.ctaWa, 'Egzotik meyve ve yeşillik kataloğunuzu alabilir miyim?', 'WEB-EGZOTIK')}<a class="btn btn--dark" href="/egzotik-meyveler/">Egzotik Meyveleri İnceleyin</a></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section__head"><div><span class="eyebrow">Yan Ürün Grupları</span><h2>Meze & Şarküteri</h2></div><p>Meyve ve sebze siparişlerinize şef reçeteli tamamlayıcı ürünlerimizi de ekleyebilirsiniz.</p></div>
  <div class="minis">${tier3.map(miniCat).join('')}</div>
</div></section>

<section class="section section--brown"><div class="wrap">
  <div class="section__head"><div><span class="eyebrow">Çalışma & Sevkiyat Modeli</span><h2>Nasıl Sipariş Verilir?</h2></div><p>Mutfak operasyonlarının hızını biliyoruz; bürokrasi olmadan WhatsApp üzerinden siparişinizi tamamlıyoruz.</p></div>
  <ol class="steps">
    <li class="reveal"><h3>Listenizi İletin</h3><p>İhtiyacınız olan ürünleri, kalibre/olgunluk talebinizi ve teslimat adresinizi WhatsApp hattımıza yazın.</p></li>
    <li class="reveal"><h3>Fiyat & Termin Onayı</h3><p>Güncel borsa/hal fiyatlandırması ve sevkiyat planlaması dakikalar içinde tarafınıza iletilsin.</p></li>
    <li class="reveal"><h3>Mutfak Kapısında Teslimat</h3><p>Ürünleriniz İstanbul veya İzmir adresinize frigofirik (soğuk zincir) araçlarımızla teslim edilsin.</p></li>
  </ol>
  <div style="margin-top:40px">${waBtn(`Hemen Sipariş Oluşturun: ${site.phoneDisplay}`, 'Sipariş oluşturmak istiyorum.', 'WEB-ADIMLAR')}</div>
</div></section>

<section class="section section--cream"><div class="wrap">
  <div class="section__head"><div><span class="eyebrow">Sevkiyat & Lojistik Ağı</span><h2>İstanbul ve İzmir’de Günlük Soğuk Zincir Teslimat</h2></div></div>
  ${locCards()}
</div></section>

<section class="section"><div class="wrap split split--top">
  <div><span class="eyebrow">SSS</span><h2>Sıkça Sorulan Sorular</h2><p class="muted">Sorunuzun yanıtını bulamadıysanız WhatsApp hattımızdan bize ulaşabilirsiniz.</p><a class="btn btn--ghost" href="/sss/">Tüm Sorular</a></div>
  ${faqBlock(homeFaqs)}
</div></section>

${ctaBand('Güncel Fiyat Listesi & Katalog', 'Taze ürün fiyatları borsa/hal koşullarına göre güncellenir. Güncel listeyi WhatsApp hattımızdan iletelim.', 'Güncel fiyat listenizi ve ürün kataloğunuzu alabilir miyim?', 'WEB-KATALOG')}`;

  const md = `# ${site.name} — ${site.slogan}\n\n${site.description}\n\n## Ana ürünler\n${['avokado', 'enginar'].map((s) => { const c = cat(s); return `### [${c.h1}](${abs(`/${c.slug}/`)})\n${c.lead}\n${productsByCat(s).map((p) => `- [${p.name}](${abs(`/${p.slug}/`)}): ${p.short}`).join('\n')}`; }).join('\n\n')}\n\n## İkinci uzmanlık: egzotik ve tropikal meyveler\n${tier2.map((c) => `- [${c.name}](${abs(`/${c.slug}/`)}): ${c.lead}`).join('\n')}\n\n## Yan ürünler\n${tier3.map((c) => `- [${c.name}](${abs(`/${c.slug}/`)})`).join('\n')}\n\n## Sık sorulan sorular\n${faqs.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}\n${mdContact}`;
  emit('/', layout({ path: '/', v: V, title: `Toptan Avokado & Enginar | İstanbul, İzmir | ${site.name}`, description: "İstanbul ve İzmir'de otel ve restoranlara toptan Hass ve yerli avokado, ayıklanmış saplı enginar kalbi, çanak ve ızgara enginar. Günlük soğuk zincir teslimat.", og: FOCUS.avokado?.og || HERO.crates.og, body, schema: [orgSchema, websiteSchema, ...site.locations.map(locSchema), faqSchema(homeFaqs)] }), md, { priority: '1.0', images: [HERO.a, FOCUS.avokado, FOCUS.enginar].filter(Boolean).map((i) => i.og) });
}

// ════════════════════════════════════════════════════════════
// ÜRÜNLERİMİZ (hub)
// ════════════════════════════════════════════════════════════
{
  const body = `${crumbs([['/', 'Ana sayfa'], ['/urunlerimiz/', 'Ürünlerimiz']])}
<section class="phead"><div class="wrap"><span class="eyebrow">Toptan Ürün Kataloğu</span><h1>Ürünlerimiz</h1><p class="lead">Ana uzmanlık alanımız avokado ve enginar tedariki. Egzotik meyveler, Ege otları, pratik meze çözümleri ve gurme turşularla profesyonel mutfağınızın tüm ihtiyaçlarını tek sevkiyatta karşılıyoruz.</p><div class="btn-row">${waBtn('Güncel Katalog İsteyin', 'Merhaba, güncel fiyat listenizi ve ürün kataloğunuzu alabilir miyim?', 'WEB-URUNLER')}</div></div></section>
${categories.map((c, i) => `${i === 0 ? '<div class="wrap tier-head"><span class="eyebrow">Ana Ürün Grupları</span></div>' : c.tier === 2 && categories[i - 1].tier !== 2 ? '<div class="wrap tier-head"><span class="eyebrow">Egzotik Meyveler & Özel Mutfak Ürünleri</span></div>' : c.tier === 3 && categories[i - 1].tier !== 3 ? '<div class="wrap tier-head"><span class="eyebrow">Yan Ürün Grupları</span></div>' : ''}<section class="section" style="padding-top:24px" id="${c.slug}"><div class="wrap">
  <div class="section__head"><div><span class="eyebrow">${productsByCat(c.slug).length} ürün</span><h2><a href="/${c.slug}/" style="text-decoration:none">${esc(c.name)}</a></h2></div><a class="btn btn--ghost btn--sm" href="/${c.slug}/">Tümünü İnceleyin</a></div>
  <div class="products">${productsByCat(c.slug).map(pcard).join('')}</div>
</div></section>`).join('')}
${ctaBand('Aradığınız Ürün Listede Yok mu?', 'Menünüz için özel bir ürün arıyorsanız WhatsApp hattımızdan iletin; tedarik imkânını değerlendirelim.', 'Merhaba, listenizde olmayan bir ürün arıyorum: ', 'WEB-OZEL-URUN')}`;
  const md = `# Ürünlerimiz — ${site.name}\n\n${categories.map((c) => `## ${c.name}\n${productsByCat(c.slug).map((p) => `- [${p.name}](${abs(`/${p.slug}/`)}): ${p.short}`).join('\n')}`).join('\n\n')}\n${mdContact}`;
  emit('/urunlerimiz/', layout({ path: '/urunlerimiz/', v: V, title: 'Toptan Ürün Kataloğu — Avokado, Enginar, Egzotik Meyve', description: `${products.length} ürünlük toptan katalog: avokado, enginar kalbi, Ege otları, deniz börülcesi, egzotik meyve, hazır meze ve butik turşu. İstanbul ve İzmir'e teslimat.`, body, schema: [breadcrumbSchema([['/', 'Ana sayfa'], ['/urunlerimiz/', 'Ürünlerimiz']]), { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Ürün kataloğu', itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/${p.slug}/`), name: p.name })) }] }), md, { priority: '0.9' });
}

// ════════════════════════════════════════════════════════════
// KATEGORİ SAYFALARI
// ════════════════════════════════════════════════════════════
for (const c of categories) {
  const list = productsByCat(c.slug);
  const path = `/${c.slug}/`;
  const bc = [['/', 'Ana sayfa'], ['/urunlerimiz/', 'Ürünlerimiz'], [path, c.name]];
  const catFaqs = [
    { q: `İstanbul'da toptan ${c.name.toLowerCase()} nereden alınır?`, a: `Ege Beyi Gıda olarak İstanbul Kâğıthane depomuzdan otel, restoran ve kafelere toptan ${c.name.toLowerCase()} tedarik ediyoruz. Çeşitler: ${list.map((p) => p.name).join(', ')}. Güncel fiyat için WhatsApp: ${site.phoneDisplay}.` },
    { q: `İzmir'e ${c.name.toLowerCase()} teslimatı yapılıyor mu?`, a: `Evet. İzmir dağıtım ağımızla Çeşme, Alaçatı, Urla ve İzmir merkez hattındaki işletmelere düzenli soğuk zincir sevkiyat yapıyoruz.` },
    { q: 'Fiyatlar neden sitede yayınlanmıyor?', a: 'Taze ürün fiyatları borsa/hal koşullarına, sezona ve kura göre sık güncellenir. Güncel fiyat listesi WhatsApp hattımızdan iletilir.' },
  ];
  const body = `${crumbs(bc)}
<section class="phead phead--split"><div class="wrap">
  <div><span class="eyebrow">İstanbul ve İzmir’e günlük soğuk zincir teslimat</span><h1>${esc(c.h1)}</h1><p class="lead">${esc(c.lead)}</p>
  <div class="btn-row">${waBtn('Güncel Fiyat Alın', `${c.name} için güncel fiyat ve katalog bilgisi alabilir miyim?`, ref(c.slug))}<a class="btn btn--ghost" href="#urunler">Çeşitleri İnceleyin</a></div></div>
  <figure>${pic(c.image, c.photoAlt || c.name, { sizes: '(max-width: 860px) 100vw, 520px', eager: true })}</figure>
</div></section>
<section class="section section--cream" style="padding-top:56px;padding-bottom:56px"><div class="wrap split split--top">
  <div class="prose">${c.body.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
  <table class="facts"><tbody>${c.facts.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
</div></section>
<section class="section" id="urunler"><div class="wrap">
  <div class="section__head"><div><span class="eyebrow">${list.length} çeşit</span><h2>${esc(c.name)} Çeşitleri</h2></div></div>
  <div class="products">${list.map(pcard).join('')}</div>
</div></section>
${c.highlights ? `<section class="section section--brown"><div class="wrap"><div class="section__head"><div><span class="eyebrow">Neden Ege Beyi Gıda</span><h2>${esc(c.name)} Tedarik Standartlarımız</h2></div></div>${highlights(c)}</div></section>` : ''}
${c.compare ? `<section class="section"><div class="wrap"><div class="section__head"><div><span class="eyebrow">Çeşit Karşılaştırması</span><h2>${esc(c.name)} Çeşitleri ve Kullanım Alanları</h2></div><p>Menünüze ve reçetenize uygun çeşidi seçmeniz için doku, hazırlık ve kullanım alanı karşılaştırması.</p></div>${compareTable(c)}${guides.filter((g) => g.related.includes(c.slug)).length ? `<p class="note">Rehberler: ${guides.filter((g) => g.related.includes(c.slug)).map((g) => `<a href="/rehber/${g.slug}/">${esc(g.h1)}</a>`).join(' · ')}</p>` : ''}</div></section>` : ''}
<section class="section section--cream"><div class="wrap split split--top"><div><span class="eyebrow">SSS</span><h2>${esc(c.name)} Hakkında Sıkça Sorulanlar</h2></div>${faqBlock(catFaqs)}</div></section>
${ctaBand(`${c.name} Fiyat Listesini İsteyin`, 'Güncel fiyat listesi ve sevkiyat planı WhatsApp hattımızdan iletilir.', `${c.name} için güncel fiyat listenizi alabilir miyim?`, ref(c.slug + '-alt'))}`;
  const md = `# ${c.h1}\n\n${c.lead}\n\n${c.body.join('\n\n')}\n\n${mdTable(c.facts)}\n${c.highlights ? c.highlights.map(([t, d]) => `- **${t}:** ${d}`).join('\n') + '\n\n' : ''}${mdCompare(c)}## Ürünler\n${list.map((p) => `- [${p.name}](${abs(`/${p.slug}/`)}): ${p.short}`).join('\n')}\n\n## Sorular\n${catFaqs.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}\n${mdContact}`;
  emit(path, layout({ path, v: V, title: c.title, description: clip(c.description), og: c.cover?.og, body, schema: [breadcrumbSchema(bc), { '@context': 'https://schema.org', '@type': 'CollectionPage', name: c.h1, url: abs(path), description: c.description, isPartOf: { '@id': `${site.url}/#website` }, mainEntity: { '@type': 'ItemList', itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/${p.slug}/`), name: p.name })) } }, faqSchema(catFaqs)] }), md, { priority: '0.9', images: [c.cover?.og, c.image?.og].filter(Boolean) });
}

// ════════════════════════════════════════════════════════════
// ÜRÜN SAYFALARI
// ════════════════════════════════════════════════════════════
for (const p of products) {
  const c = catBySlug(p.cat);
  const path = `/${p.slug}/`;
  const bc = [['/', 'Ana sayfa'], [`/${c.slug}/`, c.name], [path, p.name]];
  const r = ref(p.slug);
  const facts = [['Kategori', c.name], ...p.specs, ['Teslimat', 'İstanbul ve İzmir geneline her gün, soğuk zincir'], ['Sipariş', 'WhatsApp ' + site.phoneDisplay]];
  const pFaqs = [
    { q: `İstanbul'da toptan ${p.name} nereden alınır?`, a: `Ege Beyi Gıda, İstanbul ve İzmir'deki otel, restoran ve kafelere toptan ${p.name} tedarik eder. Güncel fiyat ve sevkiyat bilgisi için WhatsApp: ${site.phoneDisplay}.` },
    { q: `${p.name} siparişi nasıl verilir?`, a: `Bu sayfadaki “Güncel Fiyat Alın” butonuyla WhatsApp sipariş hattımıza bağlanabilirsiniz. Miktar, kalibre/olgunluk talebinizi ve teslimat adresinizi iletmeniz yeterlidir.` },
  ];
  const related = productsByCat(p.cat).filter((x) => x.slug !== p.slug).slice(0, 4);
  const guide = guides.find((g) => g.related.includes(p.slug) || g.related.includes(p.cat));
  const body = `${crumbs(bc)}
<div class="wrap"><div class="product">
  <figure class="product__media">${pic(p.image, p.alt || p.name, { sizes: '(max-width: 860px) 100vw, 560px', eager: true })}</figure>
  <div>
    <a class="eyebrow" href="/${c.slug}/" style="text-decoration:none">${esc(c.name)}</a>
    <h1>${esc(p.name)}</h1>
    ${p.aka?.length ? `<p class="product__aka">Diğer adları: ${esc(p.aka.join(', '))}</p>` : ''}
    <p class="lead">${esc(p.short)}</p>
    <div class="product__cta">
      <p>Fiyatlar borsa/hal koşullarına göre güncellenir; güncel fiyat ve sevkiyat planı WhatsApp hattımızdan iletilir.</p>
      ${waBtn('Güncel Fiyat Alın', productMsg(p), r)}
      <a class="btn btn--ghost" href="${esc(waLink(`${p.name} için deneme siparişi verebilir miyim?`, r + '-NUMUNE'))}" target="_blank" rel="noopener" data-wa="${r}-NUMUNE">Deneme Siparişi Planlayın</a>
    </div>
    <table class="facts"><tbody>${facts.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
    <h2 style="font-size:1.5rem">Ürün Bilgisi</h2>
    <p>${esc(p.body)}</p>
    <h3>Kullanım Alanları</h3>
    <ul class="chips">${p.uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
    <h3>Servis Önerisi</h3>
    <p>${esc(p.serve)}</p>
    ${guide ? `<p class="note">Rehber: <a href="/rehber/${guide.slug}/">${esc(guide.h1)}</a></p>` : ''}
    <h3 style="margin-top:28px">Sorular</h3>
    ${faqBlock(pFaqs)}
  </div>
</div></div>
${related.length ? `<section class="section section--cream"><div class="wrap"><div class="section__head"><div><span class="eyebrow">Benzer Ürünler</span><h2>Diğer ${esc(c.name)} Çeşitleri</h2></div><a class="btn btn--ghost btn--sm" href="/${c.slug}/">Tümünü gör</a></div><div class="products">${related.map(pcard).join('')}</div></div></section>` : ''}
${ctaBand(`${p.name} İçin Güncel Fiyat`, 'Güncel fiyat ve sevkiyat planı WhatsApp hattımızdan iletilir.', productMsg(p), r + '-ALT')}`;
  // Fiyat yayınlanmadığı için schema.org/Product kullanılmıyor (Google Product için fiyat/yorum/puan zorunlu tutuyor).
  // Ürün sayfası ItemPage; ana varlık, firmanın sunduğu toptan tedarik hizmeti (Service).
  const productSchema = {
    '@context': 'https://schema.org', '@type': 'ItemPage', '@id': abs(path) + '#page', url: abs(path), name: p.name, inLanguage: 'tr-TR',
    description: p.short, isPartOf: { '@id': `${site.url}/#website` },
    primaryImageOfPage: p.image ? { '@type': 'ImageObject', url: abs(p.image.og), caption: p.alt || p.name } : undefined,
    mainEntity: {
      '@type': 'Service', '@id': abs(path) + '#service', name: `Toptan ${p.name} Tedariki`, alternateName: p.aka,
      serviceType: 'Toptan gıda tedariki', category: c.name, description: `${p.short} ${p.body}`,
      provider: { '@id': ORG_ID }, areaServed: site.serviceAreas.map((n) => ({ '@type': 'City', name: n })),
      audience: { '@type': 'BusinessAudience', audienceType: 'Otel, restoran, kafe ve catering işletmeleri' },
      image: p.image ? abs(p.image.og) : undefined, url: abs(path),
    },
  };
  const md = `# ${p.name}\n\nKategori: [${c.name}](${abs(`/${c.slug}/`)})${p.aka?.length ? `\nDiğer adları: ${p.aka.join(', ')}` : ''}\n\n${p.short}\n\n${p.body}\n\n${mdTable(facts)}\n**Kullanım alanları:** ${p.uses.join(', ')}\n\n**Servis önerisi:** ${p.serve}\n\n**WhatsApp'tan fiyat sor:** ${waLink(productMsg(p), r)}\n\n## Sorular\n${pFaqs.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}\n${mdContact}`;
  emit(path, layout({ path, v: V, ogType: 'product', title: (`Toptan ${p.name} — İstanbul & İzmir`.length <= 46 ? `Toptan ${p.name} — İstanbul & İzmir` : `Toptan ${p.name}`), description: clip(`${p.short} İstanbul ve İzmir'e günlük soğuk zincir teslimat.`), og: p.image?.og, body, schema: [breadcrumbSchema(bc), productSchema, faqSchema(pFaqs)] }), md, { priority: '0.8', images: [p.image?.og].filter(Boolean) });
}

// ════════════════════════════════════════════════════════════
// ŞEHİR SAYFALARI
// ════════════════════════════════════════════════════════════
for (const city of cities) {
  const da = city.slug === 'izmir' ? 'İzmir’de' : 'İstanbul’da';
  const daki = city.slug === 'izmir' ? 'İzmir’deki' : 'İstanbul’daki';
  const path = `/${city.slug}/`;
  const bc = [['/', 'Ana sayfa'], [path, `${city.city} teslimat`]];
  const cityFaqs = faqs.filter((f) => f.q.includes(city.city)).concat(faqs.filter((f) => /sipariş|saat/i.test(f.q)).slice(0, 2));
  const body = `${crumbs(bc)}
<section class="phead"><div class="wrap split">
  <div><span class="eyebrow">${esc(city.city)} · Toptan tedarik</span><h1>${esc(city.h1)}</h1><p class="lead">${esc(city.lead)}</p>
  <div class="btn-row">${waBtn('Güncel Fiyat Alın', `${daki} işletmemiz için fiyat ve katalog bilgisi alabilir miyim?`, ref(city.slug))}</div></div>
  ${city.slug === 'istanbul' ? `<div class="loc"><span class="eyebrow">Depo</span><h3>İstanbul</h3><address>${esc(HQ.street)}<br>${esc(HQ.district)} / İstanbul</address><p><a href="tel:${site.phone}">${site.phoneDisplay}</a></p><a class="btn btn--ghost btn--sm" href="${esc(HQ.maps)}" target="_blank" rel="noopener">${icon.pin}<span>Haritada aç</span></a></div>` : `<div class="loc"><span class="eyebrow">Teslimat</span><h3>İzmir geneli</h3><p><a href="tel:${site.phone}">${site.phoneDisplay}</a></p></div>`}
</div></section>
<section class="section section--cream"><div class="wrap split split--top">
  <div class="prose">${city.body.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
  <div><h2 style="font-size:1.6rem">${da} Tedarik Ettiğimiz Ürünler</h2><ul>${categories.map((c) => `<li><a href="/${c.slug}/">${esc(c.name)}</a>: ${esc(productsByCat(c.slug).slice(0, 4).map((p) => p.name).join(', '))}…</li>`).join('')}</ul></div>
</div></section>
<section class="section"><div class="wrap split split--top"><div><span class="eyebrow">Sorular</span><h2>${esc(city.city)} teslimatı</h2></div>${faqBlock(cityFaqs)}</div></section>
${ctaBand('Fiyat Listesi İsteyin', 'İşletmenizin adını ve ihtiyaç listenizi iletin; güncel fiyat ve sevkiyat planını paylaşalım.', `${daki} işletmemiz için fiyat listenizi alabilir miyiz?`, ref(city.slug + '-alt'))}`;
  const md = `# ${city.h1}\n\n${city.lead}\n\n${city.body.join('\n\n')}\n\n## Ürünler\n${categories.map((c) => `- [${c.name}](${abs(`/${c.slug}/`)})`).join('\n')}\n${mdContact}`;
  emit(path, layout({ path, v: V, title: city.title, description: clip(city.description), body, schema: [breadcrumbSchema(bc), city.slug === 'istanbul' ? locSchema(HQ) : { '@context': 'https://schema.org', '@type': 'Service', name: `${city.city} toptan avokado ve enginar tedariki`, provider: { '@id': ORG_ID }, areaServed: { '@type': 'City', name: city.city }, serviceType: 'Toptan gıda tedariki' }, faqSchema(cityFaqs)] }), md, { priority: '0.8' });
}

// ════════════════════════════════════════════════════════════
// HAKKIMIZDA / İLETİŞİM / SSS
// ════════════════════════════════════════════════════════════
{
  const path = '/hakkimizda/';
  const bc = [['/', 'Ana sayfa'], [path, 'Hakkımızda']];
  const body = `${crumbs(bc)}
<section class="phead"><div class="wrap split">
  <div><span class="eyebrow">Hakkımızda</span><h1>Ege Beyi Gıda ve Tarım Ürünleri</h1>
  <p class="lead">İstanbul ve İzmir’deki otel, restoran, kafe ve catering işletmelerine toptan avokado ve enginar tedarik eden, profesyonel mutfaklara odaklı bir gıda tedarik firmasıyız.</p></div>
  <figure>${pic(HERO.crates, 'Depoda kasalarda yerli avokado', { sizes: '(max-width: 860px) 100vw, 520px', eager: true })}</figure>
</div></section>
<section class="section section--cream"><div class="wrap split split--top">
  <div class="prose">
    <h2 class="mt0">Uzmanlık Alanımız</h2>
    <p>Ana uzmanlık alanımız avokado ve enginar tedariki. Hass, Fuerte ve yerli avokado çeşitlerini RTE ve Firm olgunlukta, Small, Medium ve Large kalibre seçenekleriyle; saplı enginar kalbi, ızgara, çanak ve baby enginarı ayıklanmış ve kullanıma hazır olarak sevk ediyoruz. Egzotik meyveler, Ege otları, deniz börülcesi, pratik meze çözümleri ve gurme turşularla mutfağınızın tamamlayıcı ihtiyaçlarını da aynı sevkiyatta karşılıyoruz.</p>
    <p>Kâğıthane’deki depomuzdan İstanbul ve İzmir geneline soğuk zincir teslimat yapıyoruz.</p>
    <h2>Çalışma Modelimiz</h2>
    <p>Siparişleri bürokrasi olmadan WhatsApp hattımız üzerinden alıyoruz. Avokado siparişlerinde servis takviminizi dikkate alarak ürünleri RTE ve Firm olarak sınıflandırıyor, fireyi en aza indirecek şekilde sevk ediyoruz. Tüm ürünler İstanbul ve İzmir içinde soğuk zincir araçlarla teslim edilir.</p>
    <p>Taze ürün fiyatları borsa/hal koşullarına göre güncellendiği için fiyat listemizi WhatsApp hattımızdan paylaşıyoruz.</p>
  </div>
  <div>
    <h2 class="mt0" style="font-size:1.6rem">Hizmet Verdiğimiz İşletmeler</h2>
    <ul class="chips">${site.customerTypes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <h2 style="font-size:1.6rem;margin-top:28px">Ürün Gruplarımız</h2>
    <ul>${categories.map((c) => `<li><a href="/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul>
  </div>
</div></section>
<section class="section"><div class="wrap">${locCards()}</div></section>
${ctaBand('Tedarik Görüşmesi', 'Mevcut ihtiyaç listenizi iletin; ürün, kalibre ve fiyat önerimizi paylaşalım.', 'İşletmemiz için fiyat listenizi alabilir miyiz?', 'WEB-HAKKIMIZDA')}`;
  const md = `# Hakkımızda — ${site.legalName}\n\n${site.description}\n\n**Hizmet verilen işletmeler:** ${site.customerTypes.join(', ')}\n${mdContact}`;
  emit(path, layout({ path, v: V, title: 'Hakkımızda | Toptan Avokado ve Enginar', description: clip(`${site.legalName}: İstanbul ve İzmir'deki otel, restoran ve kafelere toptan avokado ve enginar tedarik eden, profesyonel mutfaklara odaklı gıda firması.`), body, schema: [breadcrumbSchema(bc), { '@context': 'https://schema.org', '@type': 'AboutPage', url: abs(path), about: { '@id': ORG_ID } }, orgSchema] }), md, { priority: '0.7' });
}
{
  const path = '/iletisim/';
  const bc = [['/', 'Ana sayfa'], [path, 'İletişim']];
  const body = `${crumbs(bc)}
<section class="phead"><div class="wrap"><span class="eyebrow">İletişim</span><h1>İletişim</h1><p class="lead">Sipariş ve fiyat talepleriniz için WhatsApp sipariş hattımıza ihtiyaç listenizi, kalibre/olgunluk talebinizi ve teslimat adresinizi iletmeniz yeterlidir.</p>
<div class="btn-row">${waBtn('WhatsApp: ' + site.phoneDisplay, 'Merhaba, sipariş vermek / fiyat almak istiyorum.', 'WEB-ILETISIM')}<a class="btn btn--ghost" href="tel:${site.phone}">${icon.phone}<span>Ara</span></a><a class="btn btn--ghost" href="mailto:${site.email}">${site.email}</a></div></div></section>
<section class="section section--cream"><div class="wrap">${locCards()}
<table class="facts" style="margin-top:32px;max-width:640px"><tbody>
<tr><th scope="row">Telefon / WhatsApp</th><td><a href="tel:${site.phone}">${site.phoneDisplay}</a></td></tr>
<tr><th scope="row">E-posta</th><td><a href="mailto:${site.email}">${site.email}</a></td></tr>
<tr><th scope="row">Instagram</th><td><a href="${site.instagram}" rel="noopener">${site.instagramHandle}</a></td></tr>
</tbody></table></div></section>`;
  const md = `# İletişim — ${site.name}\n${mdContact}`;
  emit(path, layout({ path, v: V, title: 'İletişim | WhatsApp Sipariş Hattı', description: `WhatsApp ${site.phoneDisplay}. Depo: Kâğıthane, İstanbul. İstanbul ve İzmir'e günlük teslimat.`, body, schema: [breadcrumbSchema(bc), { '@context': 'https://schema.org', '@type': 'ContactPage', url: abs(path), about: { '@id': ORG_ID } }, ...site.locations.map(locSchema)] }), md, { priority: '0.7' });
}
{
  const path = '/sss/';
  const bc = [['/', 'Ana sayfa'], [path, 'Sık sorulan sorular']];
  const body = `${crumbs(bc)}
<section class="phead"><div class="wrap"><span class="eyebrow">SSS</span><h1>Sık sorulan sorular</h1><p class="lead">Sipariş, sevkiyat, ürün çeşitleri ve fiyatlandırma hakkında sıkça sorulan sorular.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap" style="max-width:860px">${faqBlock(faqs)}</div></section>
${ctaBand('Başka Bir Sorunuz mu Var?', 'WhatsApp hattımızdan bize ulaşabilirsiniz.', 'Merhaba, bir sorum var: ', 'WEB-SSS')}`;
  const md = `# Sık sorulan sorular — ${site.name}\n\n${faqs.map((f) => `## ${f.q}\n${f.a}`).join('\n\n')}\n${mdContact}`;
  emit(path, layout({ path, v: V, title: 'Sık Sorulan Sorular | Sipariş ve Teslimat', description: 'Toptan avokado ve enginar siparişi nasıl verilir, nereye teslimat yapılır, fiyat listesi nasıl alınır? Egebeyi Gıda sık sorulan sorular.', body, schema: [breadcrumbSchema(bc), faqSchema(faqs)] }), md, { priority: '0.7' });
}

// ════════════════════════════════════════════════════════════
// REHBER
// ════════════════════════════════════════════════════════════
{
  const path = '/rehber/';
  const bc = [['/', 'Ana sayfa'], [path, 'Rehber']];
  const body = `${crumbs(bc)}
<section class="phead"><div class="wrap"><span class="eyebrow">Rehber</span><h1>Profesyonel Mutfaklar İçin Rehber</h1><p class="lead">Avokado ve enginar çeşitleri, kalibre ve olgunluk seçimi, hazırlık ve saklama hakkında pratik bilgiler.</p></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="cats">${guides.map((g) => `<a class="cat reveal" href="/rehber/${g.slug}/">${g.img && stock(g.img) ? `<div class="cat__img">${pic(img(stock(g.img), g.slug), g.imgAlt || g.h1, { sizes: '(max-width: 600px) 100vw, 380px' })}</div>` : ''}<div class="cat__body"><span class="eyebrow">Rehber</span><h3>${esc(g.h1)}</h3><p>${esc(g.description)}</p><span class="cat__count"><span>Oku</span>${icon.arrow.replace('<svg', '<svg width="18" height="18"')}</span></div></a>`).join('')}</div></div></section>`;
  const md = `# Rehber — ${site.name}\n\n${guides.map((g) => `- [${g.h1}](${abs(`/rehber/${g.slug}/`)}): ${g.description}`).join('\n')}\n`;
  emit(path, layout({ path, v: V, title: 'Rehber | Avokado ve Enginar Hakkında', description: 'Avokado ve enginar çeşitleri, seçimi, temizlenmesi ve saklanması hakkında restoranlar için pratik yazılar.', body, schema: [breadcrumbSchema(bc)] }), md, { priority: '0.6' });
}
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
for (const g of guides) {
  const path = `/rehber/${g.slug}/`;
  const bc = [['/', 'Ana sayfa'], ['/rehber/', 'Rehber'], [path, g.h1]];
  const rel = g.related.map((s) => products.find((p) => p.slug === s) || null).filter(Boolean);
  const gImg = g.img && stock(g.img) ? img(stock(g.img), g.slug) : null;
  const season = g.season ? `<div class="season-wrap"><table class="season"><caption class="sr-only">Sezon takvimi</caption><thead><tr><th scope="col">Ürün</th>${MONTHS.map((m) => `<th scope="col">${m}</th>`).join('')}</tr></thead><tbody>${g.season.map(([n, s, months]) => `<tr><th scope="row"><a href="/${s}/">${esc(n)}</a></th>${MONTHS.map((m, i) => (months.includes(i + 1) ? `<td class="on"><span class="sr-only">${m}: var</span></td>` : '<td></td>')).join('')}</tr>`).join('')}</tbody></table></div>${g.note ? `<p class="note">${esc(g.note)}</p>` : ''}` : '';
  const body = `${crumbs(bc)}
<article class="wrap" style="padding-bottom:40px">
  <header class="phead" style="padding-bottom:12px"><span class="eyebrow">Rehber</span><h1 style="max-width:22ch">${esc(g.h1)}</h1><p class="lead">${esc(g.lead)}</p><p class="muted" style="font-size:.9rem">${esc(site.name)}, ${TODAY}</p></header>
  ${gImg ? `<figure class="guide__img">${pic(gImg, g.imgAlt || g.h1, { sizes: '(max-width: 860px) 100vw, 1100px', eager: true })}</figure>` : ''}
  <div class="prose">
    ${season}
    ${g.sections.map(([h, items]) => `<h2>${esc(h)}</h2>${items.length > 1 ? `<ul>${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : `<p>${esc(items[0])}</p>`}`).join('')}
  </div>
</article>
${rel.length ? `<section class="section section--cream"><div class="wrap"><div class="section__head"><div><span class="eyebrow">İlgili Ürünler</span><h2>Bu Rehberdeki Ürünler</h2></div></div><div class="products">${rel.map(pcard).join('')}</div></div></section>` : ''}
${ctaBand('Güncel Fiyat Listesi', 'Güncel fiyat listemizi ve kataloğumuzu WhatsApp hattımızdan iletelim.', 'Güncel fiyat listenizi alabilir miyim?', ref('rehber-' + g.slug))}`;
  const md = `# ${g.h1}\n\n${g.lead}\n\n${g.season ? `## Sezon takvimi\n| Ürün | Aylar |\n|---|---|\n${g.season.map(([n, , m]) => `| ${n} | ${m.map((x) => MONTHS[x - 1]).join(', ')} |`).join('\n')}\n\n${g.note || ''}\n\n` : ''}${g.sections.map(([h, items]) => `## ${h}\n${items.map((t) => (items.length > 1 ? `- ${t}` : t)).join('\n')}`).join('\n\n')}\n${mdContact}`;
  emit(path, layout({ path, v: V, ogType: 'article', title: g.title, description: clip(g.description), og: gImg?.og, body, schema: [breadcrumbSchema(bc), { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.description, inLanguage: 'tr-TR', datePublished: '2026-10-08', dateModified: TODAY, author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID }, mainEntityOfPage: abs(path) }] }), md, { priority: '0.6' });
}

// ── 404 ─────────────────────────────────────────────────────
writeFileSync(join(DIST, '404.html'), layout({ path: '/404.html', v: V, noindex: true, title: 'Sayfa bulunamadı', description: 'Aradığınız sayfa taşınmış olabilir.', body: `<section class="phead"><div class="wrap"><span class="eyebrow">404</span><h1>Sayfa bulunamadı</h1><p class="lead">Sitemizi yeniledik, aradığınız sayfa taşınmış olabilir. Ürünlerimize bakabilir ya da WhatsApp’tan sorabilirsiniz.</p><div class="btn-row"><a class="btn btn--dark" href="/urunlerimiz/">Ürünlere git</a>${waBtn('WhatsApp’tan sor', 'Merhaba, sitenizde bir ürün arıyordum: ', 'WEB-404')}</div></div></section>` }));

// ════════════════════════════════════════════════════════════
// SEO / GEO DOSYALARI
// ════════════════════════════════════════════════════════════
const indexable = pages.filter((p) => !p.noSitemap);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${indexable.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${TODAY}</lastmod><priority>${p.priority}</priority>${(p.images || []).map((i) => `<image:image><image:loc>${abs(i)}</image:loc></image:image>`).join('')}</url>`).join('\n')}
</urlset>
`);

// llms.txt — https://llmstxt.org
const llms = `# ${site.name} (${site.legalName})

> ${site.description}

Önemli bilgiler:
- Toptancı ve dağıtıcı (B2B). Müşteriler: ${site.customerTypes.join(', ')}.
- Hizmet bölgesi: İstanbul ve İzmir geneli. Depo adresi: ${HQ.street}, ${HQ.district}/İstanbul.
- Ana ürünler: avokado (Hass, Fuerte, yerli çeşitler) ve enginar (saplı Roma tipi enginar kalbi, ızgara, çanak, baby). İkinci uzmanlık: egzotik ve tropikal meyveler.
- Sipariş ve fiyat: yalnızca WhatsApp ${site.phoneDisplay} (https://wa.me/${site.whatsapp}). Fiyatlar haftalık değişir ve sitede yayınlanmaz.
- Teslimat: İstanbul ve İzmir geneline soğuk zincir.
- E-posta: ${site.email} · Instagram: ${site.instagramHandle}

Her sayfanın Markdown sürümü, URL'nin sonuna \`index.md\` eklenerek ya da \`Accept: text/markdown\` başlığıyla alınabilir.

## Ürün kategorileri
${categories.map((c) => `- [${c.h1}](${abs(`/${c.slug}/index.md`)}): ${c.lead}`).join('\n')}

## Ürünler
${products.map((p) => `- [${p.name}](${abs(`/${p.slug}/index.md`)}): ${p.short}`).join('\n')}

## Hizmet bölgeleri
${cities.map((c) => `- [${c.h1}](${abs(`/${c.slug}/index.md`)})`).join('\n')}

## Rehberler
${guides.map((g) => `- [${g.h1}](${abs(`/rehber/${g.slug}/index.md`)}): ${g.description}`).join('\n')}

## Kurumsal
- [Hakkımızda](${abs('/hakkimizda/index.md')})
- [İletişim](${abs('/iletisim/index.md')})
- [Sık sorulan sorular](${abs('/sss/index.md')})

## Makine okunur
- [Ürün kataloğu JSON](${abs('/api/urunler.json')}): tüm ürünler, kategoriler ve WhatsApp sipariş linkleri
- [OpenAPI](${abs('/openapi.json')})
- [MCP sunucusu](${abs('/mcp')}): ürün arama ve WhatsApp sipariş linki araçları

## Optional
- [Tüm içerik tek dosyada](${abs('/llms-full.txt')})
`;
writeFileSync(join(DIST, 'llms.txt'), llms);
writeFileSync(join(DIST, 'llms-full.txt'), `# ${site.name} — tüm içerik\n\n` + pages.filter((p) => p.md).map((p) => `<!-- ${abs(p.path)} -->\n${p.md}`).join('\n\n---\n\n'));

// robots.txt — arama ve yapay zekâ botlarına açık; Content Signals ile tercih beyanı
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'Bingbot', 'YandexBot', 'DuckAssistBot', 'meta-externalagent', 'MistralAI-User', 'CCBot'];
writeFileSync(join(DIST, 'robots.txt'), `# ${site.name} — ${site.url}
# Content Signals: https://contentsignals.org
# search: arama sonuçlarında gösterim · ai-input: yapay zekâ cevaplarında kullanım (RAG/grounding) · ai-train: model eğitimi
# Amacımız arama motorlarında ve yapay zekâ asistanlarında bulunmak; bu yüzden hepsine izin veriyoruz.

User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /cdn-cgi/

${AI_BOTS.map((b) => `User-agent: ${b}`).join('\n')}
Allow: /

Sitemap: ${site.url}/sitemap.xml
`);

// Makine okunur katalog
const api = {
  $schema: abs('/api/urunler.schema.json'),
  updated: TODAY,
  company: { name: site.name, legalName: site.legalName, url: site.url, phone: site.phone, whatsapp: `https://wa.me/${site.whatsapp}`, email: site.email, serviceAreas: site.serviceAreas, locations: site.locations.map(({ id, label, street, district, city }) => ({ id, label, address: `${street}, ${district}/${city}` })) },
  pricing: 'Fiyatlar haftalık değişir ve yayınlanmaz; WhatsApp üzerinden istenir.',
  categories: categories.map((c) => ({ slug: c.slug, name: c.name, url: abs(`/${c.slug}/`), description: c.lead })),
  products: products.map((p) => ({ slug: p.slug, name: p.name, category: p.cat, alternateNames: p.aka, summary: p.short, description: p.body, uses: p.uses, specs: Object.fromEntries(p.specs), url: abs(`/${p.slug}/`), markdown: abs(`/${p.slug}/index.md`), image: p.image ? abs(p.image.og) : null, whatsappOrderUrl: waLink(productMsg(p), ref(p.slug) + '-AI') })),
};
mkdirSync(join(DIST, 'api'), { recursive: true });
writeFileSync(join(DIST, 'api/urunler.json'), JSON.stringify(api, null, 2));
writeFileSync(join(DIST, 'openapi.json'), JSON.stringify({
  openapi: '3.1.0',
  info: { title: `${site.name} ürün kataloğu`, version: '1.0.0', description: 'Salt okunur toptan ürün kataloğu. Sipariş WhatsApp üzerinden verilir; her ürün kaydında hazır mesajlı whatsappOrderUrl bulunur.', contact: { name: site.name, email: site.email, url: site.url } },
  servers: [{ url: site.url }],
  paths: {
    '/api/urunler.json': { get: { operationId: 'getCatalog', summary: 'Tüm kategori ve ürünleri getir', responses: { 200: { description: 'Katalog', content: { 'application/json': { schema: { type: 'object' } } } } } } },
    '/mcp': { post: { operationId: 'mcp', summary: 'MCP (Streamable HTTP, JSON-RPC 2.0) uç noktası', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'JSON-RPC yanıtı' } } } },
  },
}, null, 2));

// .well-known — ajan keşif dosyaları
const WK = join(DIST, '.well-known');
mkdirSync(join(WK, 'mcp'), { recursive: true });
mkdirSync(join(WK, 'agent-skills/egebeyi-siparis'), { recursive: true });
writeFileSync(join(WK, 'api-catalog'), JSON.stringify({ linkset: [{ anchor: abs('/api/urunler.json'), 'service-desc': [{ href: abs('/openapi.json'), type: 'application/openapi+json' }], 'service-doc': [{ href: abs('/llms.txt'), type: 'text/markdown' }], status: [{ href: abs('/api/urunler.json'), type: 'application/json' }] }] }, null, 2));
const mcpCard = { $schema: 'https://modelcontextprotocol.io/schemas/server-card/v1.json', serverInfo: { name: 'egebeyi-gida', title: `${site.name} ürün kataloğu`, version: '1.0.0' }, description: 'Egebeyi Gıda toptan ürünlerini arama, ürün detayı alma ve WhatsApp sipariş linki üretme araçları. Kimlik doğrulama gerekmez.', transport: { type: 'streamable-http', url: abs('/mcp') }, capabilities: { tools: { listChanged: false } }, tools: [{ name: 'search_products' }, { name: 'get_product' }, { name: 'get_contact' }, { name: 'create_order_link' }], authentication: { required: false } };
writeFileSync(join(WK, 'mcp/server-card.json'), JSON.stringify(mcpCard, null, 2));
writeFileSync(join(WK, 'mcp.json'), JSON.stringify(mcpCard, null, 2));
const skill = `---
name: egebeyi-siparis
description: Egebeyi Gıda'dan (İstanbul & İzmir toptan avokado, enginar, Ege otları, egzotik meyve, meze, turşu) ürün bulma ve WhatsApp üzerinden sipariş/fiyat talebi hazırlama.
---

# Egebeyi Gıda'dan toptan ürün tedariki

Bu firma B2B toptancıdır (otel, restoran, kafe, catering). Fiyatlar yayınlanmaz; sipariş ve fiyat WhatsApp ile istenir.

## Adımlar
1. Ürünleri ${abs('/api/urunler.json')} adresinden ya da MCP sunucusundan (${abs('/mcp')}, araç: \`search_products\`) bulun.
2. Kullanıcının ihtiyacını netleştirin: ürün, miktar, teslimat şehri (İstanbul veya İzmir), adres, kullanım günü. Avokado için olgunluk (RTE/Firm) ve kalibre sorun.
3. Ürünün \`whatsappOrderUrl\` alanını kullanın ya da \`create_order_link\` aracıyla miktar ve notları içeren hazır mesajlı link üretin.
4. Linki kullanıcıya verin; mesajı kullanıcı kendisi gönderir. Sizin adınıza sipariş verilmez.

## İletişim
WhatsApp ${site.phoneDisplay} · ${site.email}
`;
writeFileSync(join(WK, 'agent-skills/egebeyi-siparis/SKILL.md'), skill);
writeFileSync(join(WK, 'agent-skills/index.json'), JSON.stringify({ $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json', skills: [{ name: 'egebeyi-siparis', type: 'skill-md', description: 'Egebeyi Gıda toptan ürünlerini bulma ve WhatsApp sipariş linki hazırlama.', url: abs('/.well-known/agent-skills/egebeyi-siparis/SKILL.md'), digest: 'sha256:' + createHash('sha256').update(skill).digest('hex') }] }, null, 2));
writeFileSync(join(WK, 'ai-catalog.json'), JSON.stringify({ specVersion: '1.0', host: { name: site.name, url: site.url, description: site.description }, entries: [
  { id: 'urn:air:egebeyigida.com:mcp:katalog', displayName: `${site.name} MCP sunucusu`, type: 'application/mcp+json', url: abs('/.well-known/mcp/server-card.json'), representativeQueries: ['İstanbul toptan avokado tedarikçisi', 'İzmir restoranlara deniz börülcesi', 'toptan enginar kalbi Ristoris', 'şevketi bostan nereden alınır'] },
  { id: 'urn:air:egebeyigida.com:api:urunler', displayName: 'Ürün kataloğu (OpenAPI)', type: 'application/openapi+json', url: abs('/openapi.json'), representativeQueries: ['toptan egzotik meyve listesi', 'hazır meze ürünleri toptan', 'butik turşu çeşitleri toptan'] },
  { id: 'urn:air:egebeyigida.com:docs:llms', displayName: 'llms.txt', type: 'text/markdown', url: abs('/llms.txt'), representativeQueries: ['Egebeyi Gıda nedir', 'Egebeyi Gıda iletişim', 'Egebeyi Gıda çalışma saatleri'] },
  { id: 'urn:air:egebeyigida.com:skill:siparis', displayName: 'Sipariş skill', type: 'text/markdown', url: abs('/.well-known/agent-skills/egebeyi-siparis/SKILL.md'), representativeQueries: ['Egebeyi Gıda sipariş nasıl verilir', 'toptan avokado siparişi ver'] },
] }, null, 2));

// Cloudflare Pages: başlıklar ve yönlendirmeler
writeFileSync(join(DIST, '_headers'), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Link: </llms.txt>; rel="describedby"; type="text/markdown", </sitemap.xml>; rel="sitemap", </.well-known/api-catalog>; rel="api-catalog", </.well-known/mcp/server-card.json>; rel="mcp-server-card"

/img/*
  Cache-Control: public, max-age=31536000, immutable
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/wp-content/*
  Cache-Control: public, max-age=2592000

/api/*
  Access-Control-Allow-Origin: *
/openapi.json
  Access-Control-Allow-Origin: *
# İçerik tipleri (.md, llms.txt, .well-known) functions/_middleware.js içinde ayarlanır
`);
writeFileSync(join(DIST, '_redirects'), `# Eski WordPress adresleri (korunan URL'ler zaten aynı yolda yayında)
/konserveler-ve-ithal-urunler/ /enginar/ 301
/konserveler-ve-ithal-urunler /enginar/ 301
/tursu/ /dogal-butik-tursu-cesitleri/ 301
/2023/06/12/hello-world/ / 301
/category/* / 301
/author/* /hakkimizda/ 301
/feed/ / 301
/comments/feed/ / 301
/wp-sitemap.xml /sitemap.xml 301
/wp-sitemap-* /sitemap.xml 301
/sitemap_index.xml /sitemap.xml 301
/wp-admin/* / 301
/wp-login.php / 301
/index.php / 301
# Önceki statik prototip (yayına alınmadı ama paylaşılmış olabilir)
/urunler/avokado.html /avokado/ 301
/urunler/enginar.html /enginar/ 301
/urunler/ege-otlari.html /ege-otlari/ 301
/urunler/egzotik-meyveler.html /egzotik-meyveler/ 301
/urunler/hazir-kullanim.html /hazir-kullanim-urunleri/ 301
/urunler/tursu.html /dogal-butik-tursu-cesitleri/ 301
/index.html / 301
`);

console.log(`✓ ${pages.length} sayfa, ${Object.keys(IMG).length} görsel → ${DIST}/ (v${V})`);
