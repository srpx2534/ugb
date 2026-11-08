import { q } from './db.mjs';

const TTL_MS = 60_000;
// Olumsuz sonuc kisa tutulur: jobs/skins sonrasi yeni skin 60 sn beklemesin.
const OLUMSUZ_TTL_MS = 30_000;
const cache = new Map();

// skins.json icindeki favicon degeri yol tasimayabilir; amp/favicon tek bicim kullanir.
function faviconDuzelt(f) {
  if (!f) return null;
  return String(f).startsWith('/') ? String(f) : `/assets/favicon/${String(f).replace(/^\/+/, '')}`;
}

export async function skinCoz(siteId) {
  if (!siteId) return null;

  const simdi = Date.now();
  const kayit = cache.get(siteId);
  if (kayit && simdi - kayit.zaman < kayit.ttl) return kayit.veri;

  const s = (await q('SELECT site_id, colors, favicon FROM skins WHERE site_id = ?', [siteId]))[0] ?? null;

  let veri = null;
  if (s) {
    try { s.colors = JSON.parse(s.colors); } catch { s.colors = null; }
    s.favicon = faviconDuzelt(s.favicon);
    veri = s;
  }

  cache.set(siteId, { veri, zaman: simdi, ttl: veri ? TTL_MS : OLUMSUZ_TTL_MS });
  return veri;
}

export function skinTemizle() {
  cache.clear();
}