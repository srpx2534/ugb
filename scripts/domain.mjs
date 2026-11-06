// Domain yonetimi. Kullanim:
//   node scripts/domain.mjs ekle <host> <carrier|hub|spoke> [kume] [mobil]
//   node scripts/domain.mjs cikar <host>
//   node scripts/domain.mjs listele

import { q, one, close } from '../packages/core/db.mjs';
import { hostGecerli, hostNormalize } from '../packages/core/config.mjs';
import { log } from '../packages/core/log.mjs';

const [komut, hostHam, rol, kumeHam, mobilHam] = process.argv.slice(2);
const host = hostHam ? hostNormalize(hostHam) : null;

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

    const seed = Math.floor(Math.random() * 900000) + 1000;
    await q(
      `INSERT INTO domains (host, role, kume_id, mobil, seed)
       VALUES (:h, :r, :k, :m, :s)
       ON DUPLICATE KEY UPDATE role = VALUES(role), kume_id = VALUES(kume_id), mobil = VALUES(mobil), aktif = 1`,
      { h: host, r: rol, k: kumeId, m: mobilHam === '1' ? 1 : 0, s: seed }
    );
    log.info('domain eklendi', { host, rol, kume: kumeHam ?? null });
    console.log(`\nnginx server_name listesine ekle: ${host}`);
  } else if (komut === 'cikar') {
    if (!host) throw new Error('host gerekli');
    await q('UPDATE domains SET aktif = 0 WHERE host = ?', [host]);
    log.info('domain pasife alindi', { host });
  } else if (komut === 'listele') {
    const satirlar = await q(
      'SELECT id, host, role, kume_id, mobil, site_id, aktif FROM domains ORDER BY id'
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