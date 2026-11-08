// Kaynak veriyi ice alir.
//   node jobs/skins.mjs        -> db/skins.json varsa ondan, ag istegi yok
//   node jobs/skins.mjs --cek  -> kaynaktan cekip snapshot'i yeniler
//
// favicon yolu her zaman yerel uretimden turetilir (jobs/assets.mjs N.svg yazar).
// Snapshot'taki ad yalnizca "favicon var" kanitidir; yol tasimasi beklenmez.

import fs from 'node:fs/promises';
import path from 'node:path';
import { q, tx, close } from '../packages/core/db.mjs';
import { log } from '../packages/core/log.mjs';

const KAYNAK = 'https://mama.atarhaber.com/apiyeni/data.php?site_id=';
const SNAPSHOT = path.join(process.cwd(), 'db', 'skins.json');
const ADET = 21;
const DENEME = 3;
const ZAMAN_ASIMI = 20000;

async function cek(siteId) {
  for (let i = 1; i <= DENEME; i++) {
    try {
      const y = await fetch(KAYNAK + siteId, { signal: AbortSignal.timeout(ZAMAN_ASIMI) });
      if (!y.ok) throw new Error(`HTTP ${y.status}`);
      return await y.json();
    } catch (e) {
      log.warn('cekme basarisiz', { siteId, deneme: i, hata: e.message });
      if (i === DENEME) throw e;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

function ayikla(ham, siteId) {
  const s = ham?.site;
  if (!s || Number(s.id) !== siteId) throw new Error(`site ${siteId} donmedi`);

  let colors;
  try { colors = typeof s.colors === 'string' ? JSON.parse(s.colors) : s.colors; }
  catch { throw new Error(`site ${siteId} colors bozuk`); }

  const ana = colors?.colors?.primary?.main;
  if (!/^#[0-9A-Fa-f]{6}$/.test(String(ana ?? ''))) throw new Error(`site ${siteId} primary.main yok`);

  // yalnizca varlik kaniti: dosya adi bos olmasin
  const favicon = String(s.favicon ?? '').trim().replace(/^.*\//, '');
  if (!favicon) throw new Error(`site ${siteId} favicon yok`);

  return { site_id: siteId, colors, renk: ana.toUpperCase(), favicon, eski_renk: s.renk ?? null };
}

async function cekHepsi() {
  const kayitlar = [];
  for (let i = 1; i <= ADET; i++) {
    const k = ayikla(await cek(i), i);
    kayitlar.push(k);
    log.info('alindi', { siteId: i, renk: k.renk });
    await new Promise((r) => setTimeout(r, 400));
  }
  await fs.writeFile(SNAPSHOT, JSON.stringify(kayitlar, null, 2) + '\n', 'utf8');
  log.info('snapshot yenilendi', { yol: SNAPSHOT });
  return kayitlar;
}

async function snapshotOku() {
  const ham = await fs.readFile(SNAPSHOT, 'utf8');
  const kayitlar = JSON.parse(ham);
  if (!Array.isArray(kayitlar) || kayitlar.length !== ADET) throw new Error('snapshot eksik');
  return kayitlar;
}

// Tek kaynak: assets job'inin urettigi dosya adi
function faviconYolu(siteId) {
  return `/assets/favicon/${siteId}.svg`;
}

async function yaz(kayitlar) {
  await tx(async (c) => {
    for (const k of kayitlar) {
      await c.execute(
        `INSERT INTO skins (site_id, colors, favicon)
         VALUES (:site_id, :colors, :favicon)
         ON DUPLICATE KEY UPDATE colors = VALUES(colors), favicon = VALUES(favicon)`,
        { site_id: k.site_id, colors: JSON.stringify(k.colors), favicon: faviconYolu(k.site_id) }
      );
    }
  });
}

async function dagit() {
  const kumeler = await q(
    'SELECT DISTINCT kume_id FROM domains WHERE kume_id IS NOT NULL AND role = ? AND mobil = 0',
    ['carrier']
  );

  const renkHarita = new Map();
  for (const s of await q('SELECT site_id, renk FROM skins')) renkHarita.set(s.site_id, s.renk);

  for (const { kume_id } of kumeler) {
    const boslar = await q(
      'SELECT id FROM domains WHERE kume_id = ? AND role = ? AND mobil = 0 AND site_id IS NULL ORDER BY id',
      [kume_id, 'carrier']
    );
    if (!boslar.length) continue;

    const dolu = await q('SELECT site_id FROM domains WHERE kume_id = ? AND site_id IS NOT NULL', [kume_id]);
    const kullanilanSite = new Set(dolu.map((d) => d.site_id));
    const kullanilanRenk = new Set(dolu.map((d) => renkHarita.get(d.site_id)).filter(Boolean));

    const serbest = [];
    for (let i = 1; i <= ADET; i++) if (!kullanilanSite.has(i)) serbest.push(i);

    if (serbest.length < boslar.length) throw new Error(`kume ${kume_id}: yeterli bos skin yok`);

    const oncelikli = serbest.filter((s) => !kullanilanRenk.has(renkHarita.get(s)));
    const yedek = serbest.filter((s) => kullanilanRenk.has(renkHarita.get(s)));
    const havuz = [...oncelikli, ...yedek];

    for (const d of boslar) {
      const site = havuz.shift();
      await q('UPDATE domains SET site_id = ? WHERE id = ?', [site, d.id]);
      kullanilanRenk.add(renkHarita.get(site));
      log.info('skin atandi', { domain_id: d.id, site_id: site, renk: renkHarita.get(site), kume_id });
    }

    if (boslar.length > oncelikli.length) {
      log.warn('renk tekrari kacinilmadi', { kume_id, eksik: boslar.length - oncelikli.length });
    }
  }
}

try {
  const kaynaktan = process.argv.includes('--cek');
  const kayitlar = kaynaktan ? await cekHepsi() : await snapshotOku();
  await yaz(kayitlar);
  await dagit();
  log.info('bitti', { kaynak: kaynaktan ? 'kaynak' : 'snapshot' });
  log.info('favicon dosyalari icin: npm run assets');
} catch (e) {
  log.error('skins hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}