// Egebeyi Gıda — menü, görünürlük animasyonu, WhatsApp tıklama ölçümü, WebMCP araçları.
(() => {
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    const set = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
      nav.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add('is-in'));

  // WhatsApp tıklamaları: Cloudflare Web Analytics / Zaraz varsa olay olarak gönderilir.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-wa]');
    if (!a) return;
    const ref = a.dataset.wa;
    try { window.zaraz?.track?.('whatsapp_click', { ref, page: location.pathname }); } catch {}
    try { window.gtag?.('event', 'whatsapp_click', { ref, page: location.pathname }); } catch {}
  });

  // WebMCP: tarayıcıdaki yapay zekâ ajanlarına site araçlarını açar (destekleyen tarayıcılarda).
  const mc = navigator.modelContext || document.modelContext;
  if (mc?.registerTool) {
    const PHONE = '905525001511';
    let catalog;
    const load = async () => (catalog ??= await (await fetch('/api/urunler.json')).json());
    const norm = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');
    const tools = [
      {
        name: 'search_products',
        description: 'Egebeyi Gıda toptan ürün kataloğunda ara (avokado, enginar, Ege otları, egzotik meyve, meze, turşu).',
        inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Ürün adı veya kullanım (ör. "guacamole", "deniz börülcesi")' } }, required: ['query'] },
        async execute({ query }) {
          const c = await load(); const q = norm(query);
          const hits = c.products.filter((p) => norm([p.name, p.summary, ...(p.alternateNames || []), ...(p.uses || [])].join(' ')).includes(q)).slice(0, 10);
          return { content: [{ type: 'text', text: JSON.stringify(hits.map(({ name, summary, url, whatsappOrderUrl }) => ({ name, summary, url, whatsappOrderUrl }))) }] };
        },
      },
      {
        name: 'create_order_link',
        description: 'Ürün, miktar ve teslimat şehri için hazır mesajlı WhatsApp sipariş linki üret. Mesajı kullanıcı gönderir.',
        inputSchema: { type: 'object', properties: { product: { type: 'string' }, quantity: { type: 'string' }, city: { type: 'string', enum: ['İstanbul', 'İzmir'] }, note: { type: 'string' } }, required: ['product'] },
        async execute({ product, quantity, city, note }) {
          const text = `Merhaba, egebeyigida.com'dan ulaşıyorum. ${product}${quantity ? ` (${quantity})` : ''} için fiyat ve katalog bilgisi alabilir miyim?${city ? ` Teslimat: ${city}.` : ''}${note ? ` Not: ${note}` : ''}`;
          return { content: [{ type: 'text', text: `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}` }] };
        },
      },
    ];
    tools.forEach((t) => { try { mc.registerTool(t); } catch {} });
  }
})();
