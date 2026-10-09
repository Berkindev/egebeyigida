// Minimal MCP sunucusu (Streamable HTTP, JSON-RPC 2.0, durumsuz). Kimlik doğrulama yok; salt okunur.
// Araçlar: search_products, get_product, get_contact, create_order_link
const PROTOCOL = '2025-06-18';
const PHONE = '905525001511';

const norm = (s = '') => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');
const text = (obj) => ({ content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }] });
const waUrl = (msg) => `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;

const TOOLS = [
  { name: 'search_products', description: 'Egebeyi Gıda toptan ürün kataloğunda ara. Ürün adı, diğer adı veya kullanım alanıyla (ör. "guacamole", "rakı sofrası") arama yapılabilir.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string', description: 'Opsiyonel kategori slug: avokado, enginar, ege-otlari, deniz-borulcesi-ve-kaya-korugu, egzotik-meyveler, hazir-kullanim-urunleri, dogal-butik-tursu-cesitleri' } }, required: ['query'] },
    annotations: { readOnlyHint: true } },
  { name: 'get_product', description: 'Ürün slug ile tüm ürün detayını getir.', inputSchema: { type: 'object', properties: { slug: { type: 'string' } }, required: ['slug'] }, annotations: { readOnlyHint: true } },
  { name: 'get_contact', description: 'Firma iletişim bilgileri, adresler, çalışma saatleri ve hizmet bölgeleri.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  { name: 'create_order_link', description: 'Ürün ve miktar için hazır mesajlı WhatsApp sipariş/fiyat talebi linki üretir. Mesajı kullanıcı kendisi gönderir.',
    inputSchema: { type: 'object', properties: { product: { type: 'string' }, quantity: { type: 'string' }, city: { type: 'string', enum: ['İstanbul', 'İzmir'] }, business: { type: 'string', description: 'İşletme adı' }, note: { type: 'string' } }, required: ['product'] },
    annotations: { readOnlyHint: true } },
];

async function call(name, args, catalog) {
  switch (name) {
    case 'search_products': {
      const q = norm(args.query);
      const hits = catalog.products
        .filter((p) => !args.category || p.category === args.category)
        .filter((p) => norm([p.name, p.summary, p.description, ...(p.alternateNames || []), ...(p.uses || [])].join(' ')).includes(q))
        .slice(0, 15)
        .map(({ slug, name, summary, url, whatsappOrderUrl }) => ({ slug, name, summary, url, whatsappOrderUrl }));
      return text(hits.length ? hits : `Sonuç yok. Kategoriler: ${catalog.categories.map((c) => c.slug).join(', ')}`);
    }
    case 'get_product': {
      const p = catalog.products.find((x) => x.slug === args.slug);
      return p ? text(p) : { ...text(`Ürün bulunamadı: ${args.slug}`), isError: true };
    }
    case 'get_contact':
      return text({ ...catalog.company, pricing: catalog.pricing });
    case 'create_order_link': {
      const msg = `Merhaba, egebeyigida.com'dan ulaşıyorum${args.business ? ` (${args.business})` : ''}. ${args.product}${args.quantity ? ` (${args.quantity})` : ''} için fiyat ve katalog bilgisi alabilir miyim?${args.city ? ` Teslimat: ${args.city}.` : ''}${args.note ? ` Not: ${args.note}` : ''}`;
      return text({ whatsappUrl: waUrl(msg), message: msg });
    }
    default:
      return null;
  }
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version' } });
  if (request.method === 'GET') return json({ name: 'egebeyi-gida', transport: 'streamable-http', info: 'POST JSON-RPC 2.0 istekleri gönderin. Kart: /.well-known/mcp/server-card.json' });
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let msg;
  try { msg = await request.json(); } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400); }
  const batch = Array.isArray(msg) ? msg : [msg];
  const catalog = await (await env.ASSETS.fetch(new URL('/api/urunler.json', request.url))).json();

  const out = [];
  for (const m of batch) {
    if (m.id === undefined) continue; // bildirimler (notifications/initialized vb.)
    const reply = (result) => out.push({ jsonrpc: '2.0', id: m.id, result });
    const fail = (code, message) => out.push({ jsonrpc: '2.0', id: m.id, error: { code, message } });
    switch (m.method) {
      case 'initialize':
        reply({ protocolVersion: m.params?.protocolVersion || PROTOCOL, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'egebeyi-gida', title: 'Egebeyi Gıda ürün kataloğu', version: '1.0.0' }, instructions: 'Toptan (B2B) gıda tedarikçisi, İstanbul ve İzmir. Fiyatlar yayınlanmaz; create_order_link ile WhatsApp üzerinden fiyat/sipariş talebi linki üretin.' });
        break;
      case 'ping': reply({}); break;
      case 'tools/list': reply({ tools: TOOLS }); break;
      case 'tools/call': {
        const r = await call(m.params?.name, m.params?.arguments || {}, catalog);
        r ? reply(r) : fail(-32602, `Bilinmeyen araç: ${m.params?.name}`);
        break;
      }
      default: fail(-32601, `Method not found: ${m.method}`);
    }
  }
  if (!out.length) return new Response(null, { status: 202, headers: { 'Access-Control-Allow-Origin': '*' } });
  return json(Array.isArray(msg) ? out : out[0]);
}
