// Cloudflare Pages middleware
// 1) Markdown negotiation: `Accept: text/markdown` ile gelen isteklere sayfanın index.md sürümünü döner.
// 2) Ajan dosyaları için doğru Content-Type ve CORS.
// 3) HTML yanıtlarına markdown alternatifini gösteren Link başlığı ekler.

const TYPES = [
  [/\.md$|^\/llms(-full)?\.txt$/, 'text/markdown; charset=utf-8'],
  [/^\/\.well-known\/api-catalog$/, 'application/linkset+json'],
  [/^\/\.well-known\/.*\.json$|^\/\.well-known\/mcp$/, 'application/json'],
];

const mdPathFor = (path) => (path.endsWith('/') ? `${path}index.md` : /\.[a-z0-9]+$/i.test(path) ? null : `${path}/index.md`);

async function handle(ctx) {
  const { request, env, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;
  const accept = request.headers.get('accept') || '';

  // Markdown negotiation (yalnızca markdown, html'den önce istenirse)
  if (request.method === 'GET' && /text\/markdown/i.test(accept) && !/text\/html/i.test(accept.split('text/markdown')[0])) {
    const md = mdPathFor(path);
    if (md) {
      const res = await env.ASSETS.fetch(new URL(md, url.origin));
      if (res.ok) {
        const body = await res.text();
        return new Response(body, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Vary': 'Accept',
            'x-markdown-tokens': String(Math.ceil(body.length / 4)),
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'Link': `<${url.origin}${path}>; rel="canonical"`,
          },
        });
      }
    }
  }

  const res = await next();
  const type = TYPES.find(([re]) => re.test(path))?.[1];
  const isHtml = (res.headers.get('content-type') || '').includes('text/html');
  if (!type && !isHtml) return res;

  const out = new Response(res.body, res);
  if (type) {
    out.headers.set('Content-Type', type);
    out.headers.set('Access-Control-Allow-Origin', '*');
  }
  if (isHtml) {
    out.headers.append('Vary', 'Accept');
    const md = mdPathFor(path);
    if (md) out.headers.append('Link', `<${md}>; rel="alternate"; type="text/markdown"`);
  }
  return out;
}

// Önizleme/pages.dev adresleri indekslenmesin (kopya içerik olmasın); yalnızca egebeyigida.com indekslenir.
export async function onRequest(ctx) {
  const u = new URL(ctx.request.url);
  // www → ana domain (tek kanonik adres)
  if (u.hostname === 'www.egebeyigida.com') {
    return Response.redirect(`https://egebeyigida.com${u.pathname}${u.search}`, 301);
  }
  const res = await handle(ctx);
  if (!new URL(ctx.request.url).hostname.endsWith('.pages.dev')) return res;
  const out = new Response(res.body, res);
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return out;
}
