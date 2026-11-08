import crypto from 'node:crypto';
import { q, one, tx } from './db.mjs';
import { makaleUret, besGram, ortusmeOrani } from './article.mjs';
import { log } from './log.mjs';

const ESIK = 0.45;
const DENEME = 3;

async function kumeGramlari(kumeId, domainId) {
  const satirlar = await q(
    `SELECT a.domain_id, g.gram
     FROM article_grams g
     JOIN articles a ON a.id = g.article_id
     JOIN domains d ON d.id = a.domain_id
     WHERE d.kume_id = ? AND a.domain_id <> ?`,
    [kumeId, domainId]
  );

  const harita = new Map();
  for (const s of satirlar) {
    if (!harita.has(s.domain_id)) harita.set(s.domain_id, new Set());
    harita.get(s.domain_id).add(s.gram);
  }
  return harita;
}

function ozet(baslik, govde) {
  return crypto.createHash('sha256').update(baslik + govde).digest('hex');
}

async function gramlariYaz(c, articleId, gramlar) {
  for (const g of gramlar) {
    await c.execute('INSERT IGNORE INTO article_grams (article_id, gram) VALUES (:a, :g)', {
      a: articleId,
      g,
    });
  }
}

// Tek transaction: satir + gramlar birlikte yazilir. Ayni domain icin yaris
// varsa kaybeden taraf kazananin satirini okur ve gramlari tekrar yazmaz.
async function sakla(domainId, seed, uretilen) {
  const gramlar = besGram(uretilen.govde);
  const hash = ozet(uretilen.baslik, uretilen.govde);

  return tx(async (c) => {
    const [sonuc] = await c.execute(
      `INSERT INTO articles (domain_id, slug, seed, baslik, aciklama, govde, content_hash)
       VALUES (:d, :s, :seed, :b, :a, :g, :h)
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
      {
        d: domainId,
        s: 'index',
        seed,
        b: uretilen.baslik,
        a: uretilen.aciklama,
        g: uretilen.govde,
        h: hash,
      }
    );

    // affectedRows 1 = gercekten eklendi. 0 = yarisi kaybettik (degisiklik yok).
    if (sonuc.affectedRows === 1) {
      await gramlariYaz(c, sonuc.insertId, gramlar);
      return { yeni: true, id: sonuc.insertId };
    }

    const [satirlar] = await c.execute(
      "SELECT id, seed, baslik, aciklama, govde FROM articles WHERE domain_id = ? AND slug = 'index'",
      [domainId]
    );

    return { yeni: false, id: sonuc.insertId, satir: satirlar[0] ?? null };
  });
}

async function onar(kayit, { domain, markalar, siteAdi, hubUrl }) {
  const uretilen = makaleUret({
    tohum: kayit.seed ?? domain.seed ?? 1,
    markalar,
    siteAdi,
    hubUrl,
  });

  const gramlar = besGram(uretilen.govde);

  await tx(async (c) => {
    await c.execute(
      'UPDATE articles SET baslik = :b, aciklama = :a, govde = :g, content_hash = :h, lastmod = CURRENT_TIMESTAMP WHERE id = :id',
      {
        b: uretilen.baslik,
        a: uretilen.aciklama,
        g: uretilen.govde,
        h: ozet(uretilen.baslik, uretilen.govde),
        id: kayit.id,
      }
    );
    await c.execute('DELETE FROM article_grams WHERE article_id = ?', [kayit.id]);
    await gramlariYaz(c, kayit.id, gramlar);
  });

  log.info('makale onarildi', { host: domain.host });
  return { baslik: uretilen.baslik, aciklama: uretilen.aciklama, govde: uretilen.govde };
}

export async function makaleAl({ domain, markalar, siteAdi, hubUrl }) {
  const mevcut = await one(
    'SELECT id, seed, baslik, aciklama, govde FROM articles WHERE domain_id = ? AND slug = ? AND yayinda = 1',
    [domain.id, 'index']
  );

  if (mevcut) {
    if (!mevcut.aciklama) return onar(mevcut, { domain, markalar, siteAdi, hubUrl });
    return { baslik: mevcut.baslik, aciklama: mevcut.aciklama, govde: mevcut.govde };
  }

  const temel = domain.seed ?? domain.es_seed ?? 1;
  const kumeId = domain.kume_id ?? null;
  const digerleri = kumeId ? await kumeGramlari(kumeId, domain.id) : new Map();

  let secilen = null;
  let enIyi = 1;

  for (let i = 0; i < DENEME; i++) {
    const seed = temel + i;
    const uretilen = makaleUret({ tohum: seed, markalar, siteAdi, hubUrl });
    const gramlar = besGram(uretilen.govde);

    let enYuksek = 0;
    for (const set of digerleri.values()) {
      const oran = ortusmeOrani(gramlar, set);
      if (oran > enYuksek) enYuksek = oran;
    }

    if (!secilen || enYuksek < enIyi) {
      secilen = { seed, uretilen, oran: enYuksek };
      enIyi = enYuksek;
    }
    if (enYuksek <= ESIK) break;
  }

  if (enIyi > ESIK) {
    log.warn('ortusme esigi asildi', { host: domain.host, oran: enIyi.toFixed(3) });
  }

  const sonuc = await sakla(domain.id, secilen.seed, secilen.uretilen);

  if (!sonuc.yeni) {
    const satir = sonuc.satir;

    if (satir?.aciklama) {
      log.info('yaris kaybedildi, mevcut makale kullanildi', { host: domain.host });
      return { baslik: satir.baslik, aciklama: satir.aciklama, govde: satir.govde };
    }

    // Eski/bozuk satirsa onarilir
    if (satir) return onar(satir, { domain, markalar, siteAdi, hubUrl });
  }

  log.info('makale uretildi', { host: domain.host, seed: secilen.seed, oran: enIyi.toFixed(3) });

  return {
    baslik: secilen.uretilen.baslik,
    aciklama: secilen.uretilen.aciklama,
    govde: secilen.uretilen.govde,
  };
}