// Marka hedeflerini dogrular.
// Basarili hedef dogrulanmis sayilir. Dogrulanmis hedef sonradan duserse pasife alinir.
// Hic dogrulanmamis hedef pasife alinmaz, yer tutucu olarak listede kalir.
// elle_kapali = 1 ise aktif alani linkcheck tarafindan degistirilmez.

import { q, close } from '../packages/core/db.mjs';
import { log } from '../packages/core/log.mjs';

const ZAMAN_ASIMI = 12000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const CANLI = new Set([200, 201, 204, 301, 302, 303, 307, 308, 403, 405, 429]);

async function dene(url) {
  for (const yontem of ['HEAD', 'GET']) {
    try {
      const y = await fetch(url, {
        method: yontem,
        redirect: 'follow',
        signal: AbortSignal.timeout(ZAMAN_ASIMI),
        headers: {
          'user-agent': UA,
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'tr-TR,tr;q=0.9',
          ...(yontem === 'GET' ? { range: 'bytes=0-2048' } : {}),
        },
      });
      if (CANLI.has(y.status)) return y.status;
      if (yontem === 'GET') return y.status;
    } catch { /* sonraki yontem */ }
  }
  return 0;
}

try {
  const markalar = await q('SELECT id, ad, url, dogrulandi, elle_kapali FROM brands WHERE url IS NOT NULL');

  let olu = 0;
  for (const m of markalar) {
    const durum = await dene(m.url);

    if (durum === 0) {
      if (m.dogrulandi && !m.elle_kapali) {
        await q('UPDATE brands SET aktif = 0, son_kontrol = NOW() WHERE id = ?', [m.id]);
        olu++;
        log.warn('dogrulanmis hedef dustu', { ad: m.ad, url: m.url });
      } else {
        await q('UPDATE brands SET son_kontrol = NOW() WHERE id = ?', [m.id]);
        log.warn('hedef dogrulanamadi (pasif tutulmadi)', { ad: m.ad, url: m.url, elle_kapali: !!m.elle_kapali });
      }
    } else {
      await q(
        'UPDATE brands SET dogrulandi = 1, son_kontrol = NOW(), aktif = IF(elle_kapali = 1, 0, 1) WHERE id = ?',
        [m.id]
      );
      log.info('hedef saglam', { ad: m.ad, durum });
    }

    await new Promise((r) => setTimeout(r, 700));
  }

  log.info('bitti', { kontrol: markalar.length, dusen: olu });
} catch (e) {
  log.error('linkcheck hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}