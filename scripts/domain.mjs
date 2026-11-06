// Domain yonetimi. Kullanim:
//   node scripts/domain.mjs ekle <host> <carrier|hub|spoke> [kume] [mobil]
//   node scripts/domain.mjs cikar <host>
//   node scripts/domain.mjs listele

import { q, one, close } from '../packages/core/db.mjs';
import { hostGecerli, hostNormalize } from '../packages/core/config.mjs';
import { log } from '../packages/core/log.mjs';

const [komut, hostHam, rol, kumeHam, mobilHam] = process.argv.slice(2);
const host = hostHam ? hostNormalize(hostHam) : null;

// kume icinde bos site_id (skin) bulur
async function bosSiteId(kumeId) {
  const dolu = new Set(
    (await q('SELECT site_id FROM domains WHERE kume_id = ? AND site_id IS NOT NULL', [kumeId])).map((s) => s.site_id)
  );
  for (let i = 1; i <= 21; i++) if (!dolu.has(i)) return i;
  return null;
}

// kullanilmayan decoy kimligini bulur
async function bosDecoy() {
  const dolu = new Set(
    (await q('SELECT decoy_id FROM domains WHERE decoy_id IS NOT NULL')).map((s) => s.decoy_id)
  );
  const hepsi = await q('SELECT id FROM decoys WHERE aktif = 1 ORDER BY id');
  return hepsi.map((h) => h.id).find((id) => !dolu.has(id)) ?? null;
}

try {
  if (komut === 'ekle') {
    if (!host || !hostGecerli(host)) throw new Error('gecersiz host');
    if (!['carrier', 'hub', 'spoke'].includes(rol)) throw new Error('rol carrier|hub|spoke olmali');

    let kumeId = null;
    if (kumeHam) {
      const k = await one('SELECT id FROM clusters WHERE kod = ?', [kumeHam]);
      if (!k) throw new Error(`kume yok: ${kumeHam}`);
      kumeId = k.id;
    }

    const mobil = mobilHam === '1' ? 1 : 0;
    let siteId = null;
    let decoyId = null;

    if (!mobil && kumeId) {
      siteId = await bosSiteId(kumeId);
      if (!siteId) throw new Error('kume icinde bos skin kalmadi');
      const skin = await one('SELECT site_id FROM skins WHERE site_id = ?', [siteId]);
      if (!skin) throw new Error(`skin yok: site_id ${siteId}, once "npm run skins" calistir`);
      if (rol === 'carrier') {
        decoyId = await bosDecoy();
        if (!decoyId) throw new Error('bos decoy kalmadi, decoys tablosuna yeni kimlik ekle');
      }
    }

    const seed = Math.floor(Math.random() * 900000) + 1000;
    await q(
      `INSERT INTO domains (host, role, kume_id, mobil, site_id, decoy_id, seed)
       VALUES (:h, :r, :k, :m, :s, :d, :seed)
       ON DUPLICATE KEY UPDATE role = VALUES(role), kume_id = VALUES(kume_id), mobil = VALUES(mobil), aktif = 1`,
      { h: host, r: rol, k: kumeId, m: mobil, s: siteId, d: decoyId, seed }
    );
    log.info('domain eklendi', { host, rol, kume: kumeHam ?? null, site_id: siteId, decoy_id: decoyId });
    console.log(`\nnginx server_name listesine ekle: ${host}`);
    if (siteId) console.log(`skin: ${siteId}${decoyId ? `, decoy: ${decoyId}` : ''}`);
  } else if (komut === 'cikar') {
    if (!host) throw new Error('host gerekli');
    await q('UPDATE domains SET aktif = 0, elle_kapali = 1 WHERE host = ?', [host]);
    log.info('domain pasife alindi', { host });
  } else if (komut === 'listele') {
    const satirlar = await q(
      'SELECT id, host, role, kume_id, mobil, site_id, decoy_id, aktif FROM domains ORDER BY id'
    );
    console.table(satirlar);
  } else {
    console.log('kullanim:');
    console.log('  node scripts/domain.mjs ekle <host> <carrier|hub|spoke> [kume] [mobil]');
    console.log('  node scripts/domain.mjs cikar <host>');
    console.log('  node scripts/domain.mjs listele');
  }
} catch (e) {
  log.error('domain hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}