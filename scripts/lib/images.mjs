// Görsel hattı: kaynak görselden webp türevleri (480/960) ve 1200x630 OG görseli üretir.
// Bağımlılıksız: macOS `sips` + `cwebp`. Çıktılar .cache/img altında önbelleklenir.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, copyFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';

const CACHE = '.cache/img';
const WIDTHS = [480, 960];
const meta = new Map();

function dims(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  return { w: +out.match(/pixelWidth: (\d+)/)[1], h: +out.match(/pixelHeight: (\d+)/)[1] };
}
const fresh = (out, src) => existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs;

// Kaynağı webp'ye çevirmeden önce cwebp'nin okuyabileceği bir PNG ara dosyaya alır (avif/webp/jpeg hepsi için güvenli).
function toPng(src, out) {
  if (!fresh(out, src)) execFileSync('sips', ['-s', 'format', 'png', src, '--out', out], { stdio: 'ignore' });
  return out;
}

/** Bir kaynak görsel için türevleri üretir ve dist'e kopyalar. name = çıktı dosya adı kökü (slug). */
export function processImage(src, name, distDir) {
  const key = name;
  if (meta.has(key)) return meta.get(key);
  mkdirSync(CACHE, { recursive: true });
  // Dosya adı SEO için açıklayıcı kalır; içerik hash'i ?v= olarak URL'ye eklenir (immutable önbellek güvenli).
  const hash = createHash('sha1').update(readFileSync(src)).digest('hex').slice(0, 8);
  const png = toPng(src, join(CACHE, `${name}-${hash}.src.png`));
  const { w, h } = dims(png);
  const variants = [];
  for (const target of WIDTHS) {
    const tw = Math.min(target, w);
    if (variants.length && variants.at(-1).w === tw) continue; // kaynak küçükse tekrar üretme
    const file = `${name}-${tw}.webp`;
    const out = join(CACHE, `${hash}-${file}`);
    if (!fresh(out, png)) execFileSync('cwebp', ['-quiet', '-q', '78', '-m', '6', '-resize', String(tw), '0', png, '-o', out]);
    variants.push({ w: tw, h: Math.round((h * tw) / w), file, cached: out, url: `/img/${file}?v=${hash}` });
  }
  // OG: 1200x630 merkezden kırpılmış JPEG
  const og = join(CACHE, `${hash}-${name}-og.jpg`);
  if (!fresh(og, png)) {
    const scale = Math.max(1200 / w, 630 / h);
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '68', '-z', String(Math.ceil(h * scale)), String(Math.ceil(w * scale)), png, '--out', og], { stdio: 'ignore' });
    execFileSync('sips', ['-c', '630', '1200', og], { stdio: 'ignore' });
  }
  const outDir = join(distDir, 'img');
  mkdirSync(outDir, { recursive: true });
  for (const v of variants) copyFileSync(v.cached, join(outDir, v.file));
  copyFileSync(og, join(outDir, `${name}-og.jpg`));
  const info = { variants, w, h, og: `/img/${name}-og.jpg?v=${hash}`, ogFile: `img/${name}-og.jpg`, ratio: w / h };
  meta.set(key, info);
  return info;
}

export const ensureDir = (p) => mkdirSync(dirname(p), { recursive: true });
