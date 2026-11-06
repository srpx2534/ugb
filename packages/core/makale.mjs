import crypto from 'node:crypto';
import { q, one, ins } from './db.mjs';
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

async function sakla(domainId, seed, uretilen) {
  const gramlar = besGram(uretilen.govde);
  const id = await ins(
    'INSERT INTO articles (domain_id, slug, seed, baslik, aciklama, govde, content_hash) VALUES (:d, :s, :seed, :b, :a, :g, :h)',
    {
      d: domainId,
      s: 'index',
      seed,
      b: uretilen.baslik,
      a: uretilen.aciklama,
      g: uretilen.govde,
      h: ozet(uretilen.baslik, uretilen.govde),
    }
  );
  for (const g of gramlar) {
    await q('INSERT IGNORE INTO article_grams (article_id, gram) VALUES (:a, :g)', { a: id, g });
  }
  return id;
}

async function onar(kayit, { domain, markalar, siteAdi, hubUrl }) {
  const uretilen = makaleUret({
    tohum: kayit.seed ?? domain.seed ?? 1,
    markalar,
    siteAdi,
    hubUrl,
  });

  await q(
    'UPDATE articles SET baslik = :b, aciklama = :a, govde = :g, content_hash = :h WHERE id = :id',
    {
      b: uretilen.baslik,
      a: uretilen.aciklama,
      g: uretilen.govde,
      h: ozet(uretilen.baslik, uretilen.govde),
      id: kayit.id,
    }
  );

  await q('DELETE FROM article_grams WHERE article_id = ?', [kayit.id]);
  for (const g of besGram(uretilen.govde)) {
    await q('INSERT IGNORE INTO article_grams (article_id, gram) VALUES (:a, :g)', { a: kayit.id, g });
  }

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

  await sakla(domain.id, secilen.seed, secilen.uretilen);
  log.info('makale uretildi', { host: domain.host, seed: secilen.seed, oran: enIyi.toFixed(3) });

  return {
    baslik: secilen.uretilen.baslik,
    aciklama: secilen.uretilen.aciklama,
    govde: secilen.uretilen.govde,
  };
}