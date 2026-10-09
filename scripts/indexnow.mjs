// Sitemap'teki tüm URL'leri IndexNow'a bildirir (Bing, Yandex vb.). Kullanım: npm run indexnow (deploy sonrası)
import { readFileSync } from 'node:fs';
const key = readFileSync('.indexnow-key', 'utf8').trim();
const urlList = [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>(https:\/\/egebeyigida\.com\/[^<]*)<\/loc>/g)].map((m) => m[1]);
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'egebeyigida.com', key, keyLocation: `https://egebeyigida.com/${key}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} URL → HTTP ${res.status}`);
