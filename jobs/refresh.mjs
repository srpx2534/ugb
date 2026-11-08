// 12 saatlik mikro tazeleme. Icerik degismediyse lastmod ilerlemez.
// Kuyruk: hic dokunulmamis domain once, sonra en eski refresh_at.
// Spoke makalesinde linkler goreli kalir (/l/:slug) ve spoke sayar; carrier'da hub'a mutlak gider.
//
// Yazim tek transaction: satir once FOR UPDATE ile kilitlenir, boylece istek
// yolundaki INSERT ... ON DUPLICATE ile siraya girer. Govde guncellenip gramlar
// silinirse ve ortada hata olursa artik yarim kalmaz.

import crypto from 'node:crypto';
import { q, withLock, tx, close } from '../packages/core/db.mjs';
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
    `SELECT d.id, d.host, d.role, d.site_id, d.seed
     FROM domains d
     WHERE d.role IN ('carrier','spoke') AND d.aktif = 1 AND d.mobil = 0
     ORDER BY d.refresh_at IS NOT NULL, d.refresh_at ASC, d.id ASC
     LIMIT ?`,
    [PARTI]
  );

  for (const d of domainler) {
    await withLock(`refresh:${d.id}`, 30, async () => {
      const markalar = await q('SELECT ad, slug, teklif FROM brands WHERE aktif = 1');
      const { baslik, aciklama, govde } = makaleUret({
        tohum: d.seed ?? 1,
        markalar,
        siteAdi: siteAdi(d.site_id),
        hubUrl: d.role === 'spoke' ? '' : env.HUB_URL,
      });
      const hash = ozet(baslik + govde);
      const gramlar = besGram(govde);

      const sonuc = await tx(async (c) => {
        const [satirlar] = await c.execute(
          "SELECT id, content_hash FROM articles WHERE domain_id = ? AND slug = 'index' FOR UPDATE",
          [d.id]
        );
        const mevcut = satirlar[0] ?? null;

        if (mevcut && mevcut.content_hash === hash) {
          await c.execute('UPDATE domains SET refresh_at = NOW() WHERE id = ?', [d.id]);
          return 'ayni';
        }

        let articleId;

        if (mevcut) {
          articleId = mevcut.id;
          await c.execute(
            'UPDATE articles SET baslik = :b, aciklama = :a, govde = :g, content_hash = :h, lastmod = CURRENT_TIMESTAMP WHERE id = :id',
            { b: baslik, a: aciklama, g: govde, h: hash, id: articleId }
          );
          await c.execute('DELETE FROM article_grams WHERE article_id = ?', [articleId]);
          await c.execute(
            'INSERT INTO article_versions (article_id, content_hash, govde) VALUES (:a, :h, :g)',
            { a: articleId, h: hash, g: govde }
          );
        } else {
          const [s] = await c.execute(
            'INSERT INTO articles (domain_id, slug, seed, baslik, aciklama, govde, content_hash) VALUES (:d, :s, :seed, :b, :a, :g, :h)',
            { d: d.id, s: 'index', seed: d.seed ?? 1, b: baslik, a: aciklama, g: govde, h: hash }
          );
          articleId = s.insertId;
        }

        for (const g of gramlar) {
          await c.execute('INSERT IGNORE INTO article_grams (article_id, gram) VALUES (:a, :g)', {
            a: articleId,
            g,
          });
        }

        await c.execute('UPDATE domains SET refresh_at = NOW() WHERE id = ?', [d.id]);
        return mevcut ? 'guncellendi' : 'eklendi';
      });

      if (sonuc === 'ayni') {
        log.info('degisiklik yok', { host: d.host });
        return;
      }

      log.info(sonuc, { host: d.host, rol: d.role });
    });
  }

  log.info('bitti');
} catch (e) {
  log.error('refresh hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}