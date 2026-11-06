import { q } from './db.mjs';
import { env, hostNormalize } from './config.mjs';
import { log } from './log.mjs';

const OLUMSUZ_TTL_MS = 15000;

let cache = new Map();
let olumsuz = new Map();
let yuklendi = 0;
let devam = null;

async function tazele() {
  const satirlar = await q(
    `SELECT id, host, role, kume_id, site_id, decoy_id, mobil, brand_id, seed
     FROM domains WHERE aktif = 1`
  );

  const yeni = new Map();
  for (const s of satirlar) yeni.set(s.host, s);

  // m.X, X'in skenini, decoy'unu ve tohumunu devralir
  for (const s of satirlar) {
    if (!s.mobil) continue;
    const es = yeni.get(s.host.replace(/^m\./, ''));
    const kayit = yeni.get(s.host);
    if (!es || !kayit) continue;
    kayit.es_site_id = es.site_id;
    kayit.es_decoy_id = es.decoy_id;
    kayit.es_seed = es.seed;
  }

  cache = yeni;
  olumsuz.clear();
  yuklendi = Date.now();
}

function arkaPlandaTazele() {
  if (devam) return;
  devam = tazele()
    .catch((e) => log.error('hostmap tazeleme', { hata: e.message }))
    .finally(() => { devam = null; });
}

export async function hostCoz(host) {
  const anahtar = hostNormalize(host);
  if (!anahtar) return null;

  if (Date.now() - yuklendi > env.HOSTMAP_TTL_MS) arkaPlandaTazele();

  const kayit = cache.get(anahtar);
  if (kayit) return kayit;

  const olumsuzZaman = olumsuz.get(anahtar);
  if (olumsuzZaman && Date.now() - olumsuzZaman < OLUMSUZ_TTL_MS) return null;

  if (!cache.size) {
    await (devam ?? tazele());
    const gec = cache.get(anahtar);
    if (gec) return gec;
  }

  olumsuz.set(anahtar, Date.now());
  return null;
}

export async function hostmapTazele() {
  await tazele();
  return cache.size;
}

export function hostmapTemizle() {
  cache = new Map();
  olumsuz = new Map();
  yuklendi = 0;
}