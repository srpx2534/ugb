import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, slugGecerli } from '@ugb/core/config';
import { sitemap } from '@ugb/core/html';
import { decoyCoz } from '@ugb/core/decoy';
import { skinCoz } from '@ugb/core/skins';
import { siteAdi } from '@ugb/core/siteadi';
import { guncelleme, istanbulIso } from '@ugb/core/freshness';
import { articleLd } from '@ugb/core/jsonld';
import { makaleAl } from '@ugb/core/makale';
import { ampSayfa } from '@ugb/core/amp';
import { q, one } from '@ugb/core/db';
import { ev } from './views/ev.mjs';
import { menu } from './views/menu.mjs';
import { hakkinda } from './views/hakkinda.mjs';
import { saatler } from './views/saatler.mjs';
import { teslimat } from './views/teslimat.mjs';
import { galeri } from './views/galeri.mjs';
import { iletisim } from './views/iletisim.mjs';
import { reklam } from './views/reklam.mjs';

const VARLIK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../packages/core/assets');

const TUR = {
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const SAYFALAR = { menu, about: hakkinda, hours: saatler, delivery: teslimat, gallery: galeri, contact: iletisim };
const YOLLAR = {
  menu: '/pages/menu',
  about: '/pages/about',
  hours: '/pages/hours',
  delivery: '/pages/delivery',
  gallery: '/pages/gallery',
  contact: '/pages/contact',
};

const VARSAYILAN_ANA = '#6366F1';

async function markalar() {
  return q('SELECT ad, slug, teklif FROM brands WHERE aktif = 1 ORDER BY id');
}

async function makale(istek, yanit) {
  const domain = istek.domain;
  const siteId = domain.site_id ?? domain.es_site_id ?? null;
  const skin = siteId ? await skinCoz(siteId) : null;

  const ana = skin?.colors?.colors?.primary?.main ?? VARSAYILAN_ANA;
  const ad = siteAdi(siteId);

  const { baslik, aciklama, govde } = await makaleAl({
    domain,
    markalar: await markalar(),
    siteAdi: ad,
    hubUrl: env.HUB_URL,
  });

  const canonical = `https://${domain.host.replace(/^m\./, '')}/`;
  const modified = guncelleme();
  const ld = articleLd({
    baslik,
    aciklama,
    canonical,
    gorsel: `${canonical}assets/img/makale-1.svg`,
    modified: modified.iso,
    siteAdi: ad,
    yayinAdi: ad,
  });

  yanit.header('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
  yanit.header('pragma', 'no-cache');
  yanit.header('expires', '0');
  yanit.type('text/html; charset=utf-8');
  return ampSayfa({
    d: { ana, ad, rozet: 'Güncel' },
    canonical,
    baslik,
    aciklama,
    govde,
    modified,
    ld,
    favicon: skin?.favicon,
  });
}

async function reklamSayfa(istek, yanit) {
  const domain = istek.domain;
  const siteId = domain.site_id ?? domain.es_site_id ?? null;
  const skin = siteId ? await skinCoz(siteId) : null;
  const ana = skin?.colors?.colors?.primary?.main ?? VARSAYILAN_ANA;

  yanit.header('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
  yanit.type('text/html; charset=utf-8');
  return reklam({
    d: { ana, ad: siteAdi(siteId), tarih: guncelleme().gorunur },
    markalar: await markalar(),
    canonical: `https://${domain.host.replace(/^m\./, '')}/`,
  });
}

async function decoy(istek) {
  return decoyCoz(istek.domain.decoy_id ?? istek.domain.es_decoy_id ?? null);
}

function ipHash(ip) {
  return crypto.createHash('sha256').update(String(ip ?? '')).digest('hex');
}

export async function kayitlar(app) {
  app.get('/assets/*', async (istek, yanit) => {
    const istenen = istek.params['*'];
    const tam = path.resolve(VARLIK, istenen);
    if (tam !== VARLIK && !tam.startsWith(VARLIK + path.sep)) return yanit.code(404).send('yok');
    try {
      const veri = await fs.promises.readFile(tam);
      yanit.type(TUR[path.extname(tam).toLowerCase()] ?? 'application/octet-stream');
      yanit.header('cache-control', 'public, max-age=86400');
      return yanit.send(veri);
    } catch {
      return yanit.code(404).send('yok');
    }
  });

  app.get('/', async (istek, yanit) => {
    if (istek.makale) return makale(istek, yanit);
    if (istek.reklam) return reklamSayfa(istek, yanit);
    yanit.type('text/html; charset=utf-8');
    return ev(await decoy(istek), `https://${istek.hostname}/`);
  });

  app.get('/pages/:slug', async (istek, yanit) => {
    const slug = istek.params.slug.replace(/\.html$/, '');
    if (!slugGecerli(slug) || !SAYFALAR[slug]) {
      yanit.code(404).type('text/html; charset=utf-8').send('<h1>404</h1>');
      return;
    }
    if (istek.makale) return makale(istek, yanit);
    if (istek.reklam) return reklamSayfa(istek, yanit);
    yanit.type('text/html; charset=utf-8');
    return SAYFALAR[slug](await decoy(istek), `https://${istek.hostname}${YOLLAR[slug]}`);
  });

  // Tiklama burada sayilir; hub'a say=0 ile devredilir, hub tekrar saymaz.
  app.get('/l/:slug', async (istek, yanit) => {
    const { slug } = istek.params;
    if (!slugGecerli(slug)) return yanit.code(404).send('yok');

    const marka = await one('SELECT id FROM brands WHERE slug = ? AND aktif = 1', [slug]);
    if (!marka) return yanit.code(404).send('yok');

    try {
      await q(
        'INSERT INTO clicks (domain_id, brand_id, slug, ip_hash) VALUES (:d, :b, :s, :h)',
        { d: istek.domain.id, b: marka.id, s: slug, h: ipHash(istek.istemciIp) }
      );
    } catch (e) {
      // sayim basarisiz olsa da yonlendirme devam etmeli
    }

    yanit.header('cache-control', 'no-store');
    return yanit.redirect(`${env.HUB_URL}/l/${slug}?say=0`, 302);
  });

  app.get('/robots.txt', async (istek, yanit) => {
    yanit.type('text/plain; charset=utf-8');
    return [
      'User-agent: Googlebot',
      'Allow: /',
      '',
      'User-agent: AdsBot-Google',
      'Allow: /',
      '',
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: https://${istek.hostname.replace(/^m\./, '')}/sitemap.xml`,
      '',
    ].join('\n');
  });

  app.get('/sitemap.xml', async (istek, yanit) => {
    yanit.header('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
    yanit.type('application/xml; charset=utf-8');
    return sitemap(['/'], `https://${istek.hostname.replace(/^m\./, '')}`, istanbulIso(new Date()));
  });
}