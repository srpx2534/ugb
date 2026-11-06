// 12 saatlik mikro tazeleme. Icerik degismediyse lastmod ilerlemez.

import crypto from 'node:crypto';
import { q, one, ins, withLock, close } from '../packages/core/db.mjs';
import { env } from '../packages/core/config.mjs';
import { makaleUret, besGram } from '../packages/core/article.mjs';
import { siteAdi } from '../packages/core/siteadi.mjs';
import { log } from '../packages/core/log.mjs';

const PARTI = 4;

function ozet(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

try {
  const domainler = await q(
    "SELECT id, host, site_id, seed FROM domains WHERE role IN ('carrier','spoke') AND aktif = 1 AND mobil = 0 ORDER BY RAND() LIMIT ?",
    [PARTI]
  );

  for (const d of domainler) {
    await withLock(`refresh:${d.id}`, 30, async () => {
      const markalar = await q('SELECT ad, slug, teklif FROM brands WHERE aktif = 1');
      const { baslik, aciklama, govde } = makaleUret({
        tohum: d.seed ?? 1,
        markalar,
        siteAdi: siteAdi(d.site_id),
        hubUrl: env.HUB_URL,
      });
      const hash = ozet(baslik + govde);

      const mevcut = await one('SELECT id, content_hash FROM articles WHERE domain_id = ? AND slug = ?', [d.id, 'index']);

      if (mevcut && mevcut.content_hash === hash) {
        log.info('degisiklik yok', { host: d.host });
        return;
      }

      let articleId;
      if (mevcut) {
        await q(
          'UPDATE articles SET baslik = :b, aciklama = :a, govde = :g, content_hash = :h, lastmod = CURRENT_TIMESTAMP WHERE id = :id',
          { b: baslik, a: aciklama, g: govde, h: hash, id: mevcut.id }
        );
        await q('DELETE FROM article_grams WHERE article_id = ?', [mevcut.id]);
        await q('INSERT INTO article_versions (article_id, content_hash, govde) VALUES (:a, :h, :g)', {
          a: mevcut.id, h: hash, g: govde,
        });
        articleId = mevcut.id;
      } else {
        articleId = await ins(
          'INSERT INTO articles (domain_id, slug, seed, baslik, aciklama, govde, content_hash) VALUES (:d, :s, :seed, :b, :a, :g, :h)',
          { d: d.id, s: 'index', seed: d.seed ?? 1, b: baslik, a: aciklama, g: govde, h: hash }
        );
      }

      for (const g of besGram(govde)) {
        await q('INSERT IGNORE INTO article_grams (article_id, gram) VALUES (:a, :g)', { a: articleId, g });
      }

      log.info('guncellendi', { host: d.host });
    });
  }

  log.info('bitti');
} catch (e) {
  log.error('refresh hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}