import { q } from './db.mjs';

const cache = new Map();

export async function skinCoz(siteId) {
  if (!siteId) return null;
  if (cache.has(siteId)) return cache.get(siteId);

  const s = (await q('SELECT site_id, colors, favicon FROM skins WHERE site_id = ?', [siteId]))[0] ?? null;
  if (s) {
    try { s.colors = JSON.parse(s.colors); } catch { s.colors = null; }
    cache.set(siteId, s);
  }
  return s;
}

export function skinTemizle() {
  cache.clear();
}