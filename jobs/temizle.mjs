// 90 gunden eski crawl_log, 180 gunden eski tiklama kayitlarini budar.
// Kilit: coklu app sunucusunda cift calismayi engeller.

import { q, withLock, close } from '../packages/core/db.mjs';
import { log } from '../packages/core/log.mjs';

try {
  await withLock('temizle', 600, async () => {
    const a = await q('DELETE FROM crawl_log WHERE created_at < NOW() - INTERVAL 90 DAY');
    const b = await q('DELETE FROM clicks WHERE created_at < NOW() - INTERVAL 180 DAY');
    log.info('budandi', { crawl: a.affectedRows, tiklama: b.affectedRows });
  });
} catch (e) {
  log.error('temizle hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}