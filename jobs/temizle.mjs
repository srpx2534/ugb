// crawl_log icin CRAWL_LOG_SAKLAMA_GUN, tiklama icin 180 gun.
// Kilit: coklu app sunucusunda cift calismayi engeller.

import { q, withLock, close } from '../packages/core/db.mjs';
import { env } from '../packages/core/config.mjs';
import { log } from '../packages/core/log.mjs';

const TIKLAMA_GUN = 180;

try {
  await withLock('temizle', 600, async () => {
    const a = await q('DELETE FROM crawl_log WHERE created_at < NOW() - INTERVAL ? DAY LIMIT 200000', [
      env.CRAWL_LOG_SAKLAMA_GUN,
    ]);
    const b = await q('DELETE FROM clicks WHERE created_at < NOW() - INTERVAL ? DAY', [TIKLAMA_GUN]);
    log.info('budandi', { crawl: a.affectedRows, tiklama: b.affectedRows, crawlGun: env.CRAWL_LOG_SAKLAMA_GUN });
  });
} catch (e) {
  log.error('temizle hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}