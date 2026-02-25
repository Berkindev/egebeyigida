# EgebeyiGıda - Proje Rehberi

## Proje Özeti
B2B toptan gıda tedarikçisi web sitesi. İstanbul ve İzmir'de otel, restoran ve profesyonel mutfaklara taze ürün tedarik eden **Ege Beyi Gıda ve Tarım Ürünleri**'nin kurumsal sitesi.

## Teknoloji
- **Saf HTML5 + CSS3 + Vanilla JS** (framework yok, build tool yok)
- Google Fonts (Inter, Playfair Display)
- Inline SVG ikonlar
- Apache sunucu (.htaccess ile yönlendirmeler)

## Dosya Yapısı
```
├── index.html              # Ana sayfa (tüm bölümler tek sayfada)
├── styles.css              # Paylaşılan stil dosyası (CSS değişkenleri ile)
├── script.js               # Vanilla JS (hamburger menü, scroll animasyonları)
├── icerik.md               # İÇERİK KAYNAĞI - tüm ürün bilgileri burada
├── .htaccess               # Eski URL yönlendirmeleri (301)
├── robots.txt              # SEO
├── sitemap.xml             # 7 URL (ana sayfa + 6 ürün sayfası)
├── images/                 # 60+ görsel
│   ├── Kapak Fotoğrafları/ # Kategori kapak görselleri (PNG)
│   ├── product-*.jpeg      # Ürün fotoğrafları
│   └── *-branded.jpeg      # Markalı versiyonlar
└── urunler/                # Ürün detay sayfaları
    ├── avokado.html
    ├── enginar.html
    ├── ege-otlari.html
    ├── egzotik-meyveler.html
    ├── hazir-kullanim.html
    └── tursu.html
```

## Önemli Kurallar

### İçerik Kaynağı
- `icerik.md` tüm ürün bilgilerinin tek kaynağıdır (53 ürün, 6 kategori)
- Yeni ürün/değişiklik önce icerik.md'de güncellenmeli, sonra HTML'e yansıtılmalı

### CSS Yapısı
- **BEM-benzeri isimlendirme:** `.header__logo`, `.product-card__title`
- **CSS değişkenleri:** Renkler, fontlar, gölgeler, spacing, geçişler
- Ana renkler: `--color-primary` (#6B8C73 adaçayı yeşili), `--color-accent` (#D4935A amber)
- Breakpoints: 768px (mobil), 992px (tablet)

### HTML Yapısı
- Semantik HTML5 (header, main, section, nav, footer)
- Schema.org JSON-LD (LocalBusiness)
- Kapsamlı meta etiketleri (OG, Twitter Card, geo-targeting)
- Ürün sayfaları `../` ile ana dizine referans verir

### JavaScript
- Intersection Observer ile scroll animasyonları
- Mobil hamburger menü
- Harici kütüphane kullanılmıyor

## SEO
- Canonical URL: https://egebeyigida.com
- Dil: tr_TR
- Sitemap: haftalık güncelleme sıklığı
- Yapılandırılmış veri: LocalBusiness schema

## İş Bilgileri
- **Adres:** Hürriyet Mh. İzzet Paşa Cd. No: 6-B Kâğıthane/İstanbul
- **Telefon:** 0552 500 15 11
- **E-posta:** info@egebeyigida.com
- **Instagram:** @egebeyigida
- **Çalışma saatleri:** Pzt-Cmt 06:00-20:00
- **Hizmet bölgeleri:** İstanbul & İzmir

## Bilinen Sorunlar
1. ~26 ürün görseli eksik/placeholder (icerik.md'de işaretli)
2. Ürün sayfalarında navigasyon ana sayfadan farklı ("Neden Biz" linki eksik)
3. Görsel yollarında URL encoding tutarsızlığı (Kapak Fotoğrafları klasörü)
4. Ürün sayfalarında hamburger menü tam çalışmayabilir

## Git
- `.gitignore`: .DS_Store ve .claude/ dizini hariç tutuluyor
- Remote: kurulu (git push kullanılabilir)
