import { q } from './db.mjs';

const TTL_MS = 60_000;
const cache = new Map();

export async function skinCoz(siteId) {
  if (!siteId) return null;

  const simdi = Date.now();
  const kayit = cache.get(siteId);
  if (kayit && simdi - kayit.zaman < TTL_MS) return kayit.veri;

  const s = (await q('SELECT site_id, colors, favicon FROM skins WHERE site_id = ?', [siteId]))[0] ?? null;

  let veri = null;
  if (s) {
    try { s.colors = JSON.parse(s.colors); } catch { s.colors = null; }
    veri = s;
  }

  // olumsuz sonuc da onbelleklenir: olmayan site_id her istekte DB'ye gitmez
  cache.set(siteId, { veri, zaman: simdi });
  return veri;
}

export function skinTemizle() {
  cache.clear();
}