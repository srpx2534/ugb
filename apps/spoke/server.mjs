import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import { env, hostGecerli, slugGecerli, kokUrlHost } from '@ugb/core/config';
import { istemciIp, ipHash } from '@ugb/core/ip';
import { tikSayilirMi } from '@ugb/core/tik';
import { log } from '@ugb/core/log';
import { q, one, ping, close, havuzDurumu } from '@ugb/core/db';
import { hostCoz, hostmapTazele } from '@ugb/core/hostmap';
import { skinCoz } from '@ugb/core/skins';
import { siteAdi } from '@ugb/core/siteadi';
import { guncelleme, istanbulIso } from '@ugb/core/freshness';
import { articleLd } from '@ugb/core/jsonld';
import { makaleAl } from '@ugb/core/makale';
import { ampSayfa } from '@ugb/core/amp';
import { linkBlokUret, linkBlokRender } from '@ugb/core/linkblock';
import { sitemap } from '@ugb/core/html';

const app = Fastify({ trustProxy: env.TRUST_PROXY, logger: false });

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

// Varlik kokunun gercek yolu dakikada bir tazelenir; her istekte syscall yapilmaz.
const KOK_TTL_MS = 60000;
let kokOnbellek = { deger: VARLIK, zaman: 0 };

async function kokDizin() {
  if (Date.now() - kokOnbellek.zaman < KOK_TTL_MS) return kokOnbellek.deger;
  let d = VARLIK;
  try { d = await fs.promises.realpath(VARLIK); } catch { d = VARLIK; }
  kokOnbellek = { deger: d, zaman: Date.now() };
  return d;
}

async function sonDegisim(domainId) {
  const satir = await one(
    "SELECT DATE_FORMAT(lastmod, '%Y-%m-%d') AS gun FROM articles WHERE domain_id = ? AND slug = 'index'",
    [domainId]
  );
  return satir?.gun ?? istanbulIso(new Date()).slice(0, 10);
}

app.addHook('onRequest', async (istek, yanit) => {
  if (!hostGecerli(istek.hostname)) {
    yanit.code(400).send('gecersiz host');
    return;
  }
  const domain = await hostCoz(istek.hostname);
  if (!domain) {
    yanit.code(404).send('bilinmeyen host');
    return;
  }

  yanit.header('x-content-type-options', 'nosniff');
  yanit.header('referrer-policy', 'strict-origin-when-cross-origin');
  yanit.header('x-frame-options', 'SAMEORIGIN');

  istek.domain = domain;
  istek.istemciIp = istemciIp(istek);
});

// Kok dizin disina cikilamaz: hem nokta nokta hem symlink icin gercek yol bakilir.
app.get('/assets/*', async (istek, yanit) => {
  const istenen = istek.params['*'];
  const tam = path.resolve(VARLIK, istenen);
  if (tam !== VARLIK && !tam.startsWith(VARLIK + path.sep)) return yanit.code(404).send('yok');

  const kok = await kokDizin();

  let gercek;
  try { gercek = await fs.promises.realpath(tam); } catch { return yanit.code(404).send('yok'); }
  if (gercek !== kok && !gercek.startsWith(kok + path.sep)) return yanit.code(404).send('yok');

  try {
    const veri = await fs.promises.readFile(gercek);
    yanit.type(TUR[path.extname(gercek).toLowerCase()] ?? 'application/octet-stream');
    yanit.header('cache-control', 'public, max-age=86400');
    return yanit.send(veri);
  } catch {
    return yanit.code(404).send('yok');
  }
});

app.get('/', async (istek, yanit) => {
  const d = istek.domain;
  const siteId = d.site_id ?? d.es_site_id ?? null;
  const skin = siteId ? await skinCoz(siteId) : null;
  const ana = skin?.colors?.colors?.primary?.main ?? '#6366F1';
  const ad = siteAdi(siteId);

  const markalar = await q('SELECT ad, slug, teklif FROM brands WHERE aktif = 1 ORDER BY id');
  const { baslik, aciklama, govde } = await makaleAl({
    domain: d,
    markalar,
    siteAdi: ad,
    hubUrl: '',
  });

  const linkler = await linkBlokUret(d.id, d.seed ?? d.es_seed ?? 1);
  const blok = linkBlokRender(linkler);

  // Canonical kok host'tan: www. ve m. soyulur (carrier ile ayni kural).
  const canonical = `https://${kokUrlHost(d.host)}/`;
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
  yanit.header('last-modified', new Date(modified.iso).toUTCString());
  yanit.type('text/html; charset=utf-8');
  return ampSayfa({
    d: { ana, ad, rozet: 'Güncel' },
    canonical,
    baslik,
    aciklama,
    govde: `${govde}${blok}`,
    modified,
    ld,
    favicon: skin?.favicon,
  });
});

// Tiklama burada sayilir; hub'a say=0 ile devredilir, hub tekrar saymaz.
// Sinir carrier ve hub ile ayni: ayni IP ayni slug icin dakikada en fazla 3.
app.get('/l/:slug', async (istek, yanit) => {
  const { slug } = istek.params;
  if (!slugGecerli(slug)) return yanit.code(404).send('yok');

  const marka = await one('SELECT id FROM brands WHERE slug = ? AND aktif = 1', [slug]);
  if (!marka) return yanit.code(404).send('yok');

  const hash = ipHash(istek.istemciIp);

  if (tikSayilirMi(`${istek.domain.id}:${slug}:${hash}`)) {
    try {
      await q(
        'INSERT INTO clicks (domain_id, brand_id, slug, ip_hash) VALUES (:d, :b, :s, :h)',
        { d: istek.domain.id, b: marka.id, s: slug, h: hash }
      );
    } catch (e) {
      log.error('click', { hata: e.message });
    }
  }

  yanit.header('cache-control', 'no-store');
  return yanit.redirect(`${env.HUB_URL}/l/${slug}?say=0`, 302);
});

// Havuz doygunlukta da saglikli sayilmasin (carrier ve hub ile ayni kural).
app.get('/health', async () => {
  const havuz = havuzDurumu();
  return { ok: (await ping()) && !havuz.dolu, havuz };
});

app.get('/robots.txt', async (istek, yanit) => {
  yanit.type('text/plain; charset=utf-8');
  return [
    'User-agent: Googlebot',
    'Allow: /',
    'Disallow: /l/',
    '',
    'User-agent: AdsBot-Google',
    'Allow: /',
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /l/',
    '',
    `Sitemap: https://${istek.hostname}/sitemap.xml`,
    '',
  ].join('\n');
});

app.get('/sitemap.xml', async (istek, yanit) => {
  yanit.header('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
  yanit.type('application/xml; charset=utf-8');
  return sitemap(['/'], `https://${istek.hostname}`, await sonDegisim(istek.domain.id));
});

app.setErrorHandler((h, istek, yanit) => {
  if (h.mesgul) {
    yanit.header('retry-after', String(h.retryAfter ?? 2));
    yanit.header('cache-control', 'no-store');
    log.warn('db mesgul', { yol: istek.url, sebep: h.sebep });
    yanit.code(503).send('mesgul, sonra tekrar dene');
    return;
  }
  yanit.header('cache-control', 'no-store');
  log.error('spoke hatasi', { yol: istek.url, hata: h.message });
  yanit.code(h.statusCode ?? 500).send('hata');
});

await hostmapTazele().catch((e) => log.warn('hostmap', { hata: e.message }));
await app.listen({ port: env.PORT, host: env.DINLEME_HOST });
log.info('spoke ayakta', { port: env.PORT, host: env.DINLEME_HOST });

for (const s of ['SIGINT', 'SIGTERM']) {
  process.on(s, async () => {
    await app.close();
    await close();
    process.exit(0);
  });
}