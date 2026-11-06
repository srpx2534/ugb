// Ayni kumede uretilen makaleler arasindaki 5-gram ortusmesini raporlar.

import { q, close } from '../packages/core/db.mjs';
import { env } from '../packages/core/config.mjs';
import { makaleUret, besGram, ortusmeOrani } from '../packages/core/article.mjs';
import { log } from '../packages/core/log.mjs';

const ESIK = 0.45;

try {
  const markalar = await q('SELECT ad, slug, teklif FROM brands WHERE aktif = 1');
  const domainler = await q("SELECT id, host, kume_id, seed FROM domains WHERE role = 'carrier' AND mobil = 0");

  const gruplar = new Map();
  for (const d of domainler) {
    const k = d.kume_id ?? 0;
    if (!gruplar.has(k)) gruplar.set(k, []);
    gruplar.get(k).push(d);
  }

  let ihlal = 0;
  for (const [kume, liste] of gruplar) {
    if (liste.length < 2) continue;

    const uretilen = liste.map((d) => ({
      host: d.host,
      gram: besGram(makaleUret({
        tohum: d.seed ?? 1,
        markalar,
        siteAdi: d.host,
        hubUrl: env.HUB_URL,
      }).govde),
    }));

    for (let i = 0; i < uretilen.length; i++) {
      for (let j = i + 1; j < uretilen.length; j++) {
        const oran = ortusmeOrani(uretilen[i].gram, uretilen[j].gram);
        const cift = `${uretilen[i].host} <-> ${uretilen[j].host}`;
        if (oran > ESIK) {
          ihlal++;
          log.error('ortusme yuksek', { kume, cift, oran: oran.toFixed(3) });
        } else {
          log.info('ortusme', { kume, cift, oran: oran.toFixed(3) });
        }
      }
    }
  }

  log.info(ihlal ? `${ihlal} ihlal` : 'temiz');
  if (ihlal) process.exitCode = 1;
} catch (e) {
  log.error('dupes hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}