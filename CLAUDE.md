# EgebeyiGıda - Proje Rehberi

## Proje Özeti
B2B toptan gıda tedarikçisi sitesi. İstanbul ve İzmir'de otel, restoran ve profesyonel mutfaklara ürün tedarik eden **Ege Beyi Gıda ve Tarım Ürünleri**. Amaç: SEO + GEO (yapay zekâ asistanlarında görünürlük) + WhatsApp'a lead.

## Teknoloji
- Bağımlılıksız Node (v22) statik site üreticisi: `scripts/build.mjs` → `dist/`
- Görseller: macOS `sips` + `cwebp` (Homebrew). Build bu yüzden macOS'ta yapılır, Cloudflare'de değil.
- Hosting: **Cloudflare Pages** (direct upload, `npm run deploy`). Pages Functions: `functions/`
- Fontlar self-host (Fraunces + Instrument Sans), harici istek yok.

## Komutlar
- `npm run build` — dist/ üretir
- `npm run dev` — build + wrangler ile yerel önizleme (functions dahil) http://127.0.0.1:8788
- `npm run deploy` — build + Cloudflare Pages'e yükleme + IndexNow bildirimi
- `npm run indexnow` — sitemap'teki URL'leri IndexNow'a bildirir (anahtar: `.indexnow-key`, dosyası `src/public/<key>.txt`)

## Yayın Durumu
- 2026-10-09'dan beri egebeyigida.com **Cloudflare Pages**'te (proje: `egebeyigida`). DNS: `@` ve `www` → CNAME `egebeyigida.pages.dev` (Proxied). Eski DNS yedeği yerelde `arsiv/dns-yedek-2026-10-09.md` (gitignore'da, public repoya girmez).
- www → apex ve *.pages.dev noindex `functions/_middleware.js` içinde.
- WordPress hâlâ Hostinger'da duruyor (yedek); mail Hostinger'da. Hosting ödenmiş, iptal gündemde değil.

## Dosya Yapısı
```
src/data/site.mjs       # Firma bilgisi (NAP), saatler, adresler, waLink()  ← GBP ile birebir aynı olmalı
src/data/catalog.mjs    # 7 kategori (tier 1/2/3) + 65 ürün, compare/highlights (TEK İÇERİK KAYNAĞI)
src/data/content.mjs    # SSS, şehir sayfaları (istanbul/izmir), 6 rehber
src/images/stock|marka/ # Lisanslı stok görseller + credits-*.json, kırpılmış marka kavanozları
src/assets/css|js       # site.css, site.js (menü, reveal, WebMCP)
src/public/             # Olduğu gibi kopyalanır: fonts, favicon, manifest, _routes.json
scripts/build.mjs       # Sayfalar, schema, md sürümleri, sitemap, robots, llms.txt, .well-known, _headers, _redirects
scripts/lib/            # html.mjs (layout/bileşenler), images.mjs (görsel hattı)
functions/_middleware.js# Markdown negotiation (Accept: text/markdown), içerik tipleri, Link başlıkları
functions/mcp.js        # MCP sunucusu (/mcp): search_products, get_product, get_contact, create_order_link
legacy/wp-content/      # Eski WordPress görselleri — AYNI yollarla yayınlanır (Google Görseller için)
legacy/image-catalog.json # Tüm görsellerin konu/kalite/filigran kataloğu
images/, pics/          # Kaynak görseller (build bunlardan webp üretir)
arsiv/prototip-2026-02/ # Eski statik prototip (yayında değil)
```

## Ürün Önceliği (müşterinin isteği)
1. **Ana odak:** Avokado ve Enginar (`tier: 1`) — ana sayfa odak blokları, karşılaştırma tabloları, rehberler, menüde ilk sırada.
2. **İkinci odak:** Egzotik & tropikal meyveler (`tier: 2`).
3. **Yan ürünler:** Ege otları, deniz börülcesi, hazır meze, turşu (`tier: 3`) — kompakt gösterilir, çok detaya girilmez (sezon takvimi vb. yok).

## Önemli Kurallar
- **URL'ler kutsal:** Eski WP adresleri (`/avokado/`, `/izgara-enginar/`, `/ege-otlari/`, `/deniz-borulcesi-ve-kaya-korugu/`, `/dogal-butik-tursu-cesitleri/`, `/hazir-kullanim-urunleri/`, `/hakkimizda/`, `/urunlerimiz/`, `/iletisim/`) aynen korunur. Ürün slug'ı değiştirilecekse `_redirects`'e 301 eklenmeli.
- **Referans listesi (pics/Referanslarımız.pdf) sitede hiçbir şekilde kullanılmaz** — ne logo, ne isim, ne sayı. Gizli; .gitignore'da.
- Fiyat yayınlanmaz. Her CTA = WhatsApp hazır mesaj, `waLink()` otomatik "Merhaba, egebeyigida.com'dan ulaşıyorum." ile başlatır. Ref kodu YOK; mesaj sade ve genel ("X için fiyat ve katalog bilgisi").
- Adres olarak SADECE İstanbul (Kâğıthane) gösterilir. İzmir yalnızca metinde "teslimat İstanbul ve İzmir geneli" olarak geçer — İzmir adresi/şube yok. Semt listesi yok; detay WhatsApp'tan.
- Kuruluş yılı kullanılmaz.
- Bilinmeyen bilgi uydurulmaz; `TODO(arkadaşa sor)` ile işaretlenir.
- Görseller: yer tutucu YOK. Kaynak sırası: arkadaşın kendi fotoğrafları > `src/images/stock/` (Unsplash / Wikimedia; kaynaklar `credits-*.json`'da kayıt amaçlı tutulur, sitede atıf sayfası YOK, kullanıcı kararı) > `src/images/marka/` (Ristoris/Alessia/Viru kırpılmış kavanozlar). Filigranlı/üçüncü taraf (greenada, iStock, Köy Yakası, Urla Yeşil) asla.
- Her ürün/kategori/rehber görselinin `alt` metni fotoğrafta gerçekte ne olduğunu tarif eder (`alt`, `photoAlt`, `imgAlt`).
- Görsel dosya adları SEO için açıklayıcıdır (`toptan-hass-avokado-960.webp`); içerik hash'i `?v=` olarak URL'ye eklenir, `/img/*` immutable önbelleklidir.
- Unsplash araması curl ile 401 verir; tarayıcıda unsplash.com sekmesinden `/napi/search/photos` ile yapılır, indirme `unsplash.com/photos/<id>/download`.
- E-posta Hostinger'da: DNS'te MX/SPF kayıtlarına dokunma.
- Yeni ürün: `catalog.mjs`'e ekle → `npm run build` → sayfa, schema, sitemap, llms.txt, API otomatik güncellenir.

## Yazım Dili (kullanıcının onayladığı ton, 2026-10-09)
- Profesyonel B2B / HoReCa dili: "mutfak operasyonu", "fire", "kalibre", "mise en place", "sevkiyat", "soğuk zincir", "porsiyon/gramaj standardı" gibi sektör terimleri serbest.
- Maddeler "**Etiket:** açıklama" formatında (örn. "Kullanıma Göre Olgunluk Seçimi: ..."). Başlıklar Title Case, açıklayıcı ve anahtar kelimeli ("Profesyonel Mutfaklara Yıl Boyu Toptan Avokado").
- Small/Medium/Large ve RTE/Firm terimleri kullanılır.
- Referans metin: kullanıcının yazdığı ana sayfa kopyası (build.mjs ANA SAYFA bloğu ve catalog.mjs avokado/enginar/egzotik alanları). Yeni metinler bu tonla yazılır.
- Kaçınılacaklar: kesik/fiilsiz slogan cümleleri ("Menü değişmez."), "2 ana ürün / 1 mesaj" gibi sayı oyunları, uzun tire (—). "Tedariği" değil "Tedariki" (TDK).
- Teslimat ifadesi: "İstanbul ve İzmir geneline her gün soğuk zincir teslimat". İstanbul: Avrupa ve Anadolu Yakası. "Haftanın 6 günü" ifadesi KULLANILMAZ (Pazar servisi belirsiz). İzmir: Çeşme, Alaçatı, Urla ve merkez hattı (adres yok).

## Tasarım
- Renkler logodan: kahve `#43241A`, zeytin `#ABAD3A`, zemin krem `#FAF6EE`. WhatsApp yeşili `#157A43` sadece WA butonlarında.
- BEM-benzeri sınıflar, CSS değişkenleri `src/assets/css/site.css` başında. Breakpoint'ler 760/860/980px.

## İş Bilgileri
- Adres (sadece bu gösterilir): Hürriyet Mh. İzzet Paşa Cd. No: 6-B Kâğıthane/İstanbul · Teslimat: İstanbul ve İzmir geneli
- Tel/WhatsApp: 0552 500 15 11 · info@egebeyigida.com · @egebeyigida
- Çalışma saati sitede GÖSTERİLMEZ (kullanıcı kararı). Teslim günü sayısı belirtilmez.

## Git
- `dist/`, `.cache/`, `.wrangler/` ignore'da. Remote kurulu.
