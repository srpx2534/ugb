import crypto from 'node:crypto';
import Fastify from 'fastify';
import { env, isProd, hostGecerli, slugGecerli, VARSAYILAN_PAROLA } from '@ugb/core/config';
import { log } from '@ugb/core/log';
import { q, one, ping, close } from '@ugb/core/db';
import { hostCoz, hostmapTazele } from '@ugb/core/hostmap';
import { linkBlokUret, linkBlokRender } from '@ugb/core/linkblock';
import { istanbulIso } from '@ugb/core/freshness';
import { portal } from './views/portal.mjs';
import { panel } from './views/panel.mjs';

const app = Fastify({ trustProxy: env.TRUST_PROXY, logger: false });

function istemciIp(istek) {
  if (env.TRUST_PROXY) {
    const cf = istek.headers['cf-connecting-ip'];
    if (cf) return cf;
    const xff = istek.headers['x-forwarded-for'];
    if (xff) return xff.split(',')[0].trim();
  }
  return istek.ip;
}

function ipHash(ip) {
  return crypto.createHash('sha256').update(String(ip ?? '')).digest('hex');
}

function yetkili(istek) {
  const h = istek.headers.authorization ?? '';
  if (!h.startsWith('Basic ')) return false;
  const [k, p] = Buffer.from(h.slice(6), 'base64').toString('utf8').split(':');
  return k === 'admin' && p === env.ADMIN_PAROLA;
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
  istek.domain = domain;
  istek.istemciIp = istemciIp(istek);
});

app.get('/', async (istek, yanit) => {
  const markalar = await q('SELECT ad, slug, teklif FROM brands WHERE aktif = 1 ORDER BY id');
  const linkler = await linkBlokUret(istek.domain.id, istek.domain.seed ?? 1);
  yanit.type('text/html; charset=utf-8');
  return portal({ markalar, blok: linkBlokRender(linkler) });
});

app.get('/api', async () => {
  const markalar = await q('SELECT ad, slug, teklif FROM brands WHERE aktif = 1 ORDER BY id');
  return { adet: markalar.length, markalar };
});

// Zincirin ilk bacagi sayar. carrier/spoke ?say=0 ile devreder, burada tekrar sayilmaz.
app.get('/l/:slug', async (istek, yanit) => {
  const { slug } = istek.params;
  if (!slugGecerli(slug)) return yanit.code(404).send('yok');

  const marka = await one('SELECT id, ad, url FROM brands WHERE slug = ? AND aktif = 1', [slug]);
  if (!marka) return yanit.code(404).send('yok');

  if (istek.query.say !== '0') {
    try {
      await q(
        'INSERT INTO clicks (domain_id, brand_id, slug, ip_hash) VALUES (:d, :b, :s, :h)',
        { d: istek.domain.id, b: marka.id, s: slug, h: ipHash(istek.istemciIp) }
      );
    } catch (e) {
      log.error('click', { hata: e.message });
    }
  }

  if (!marka.url) {
    yanit.type('text/html; charset=utf-8');
    return `<!doctype html><meta charset="utf-8"><title>${marka.ad}</title><body style="font:16px system-ui;padding:40px"><h1>${marka.ad}</h1><p>Hedef adres henüz tanımlı değil.</p></body>`;
  }

  yanit.header('cache-control', 'no-store');
  return yanit.redirect(marka.url, 302);
});

app.get('/admin', async (istek, yanit) => {
  if (!yetkili(istek)) {
    yanit.header('www-authenticate', 'Basic realm="ugb"').code(401).send('yetki');
    return;
  }
  const domainler = await q('SELECT id, host, role, aktif FROM domains ORDER BY id');
  const sayim = await q('SELECT domain_id, COUNT(*) AS n FROM clicks GROUP BY domain_id');
  const tiklama = Object.fromEntries(sayim.map((s) => [s.domain_id, s.n]));
  yanit.type('text/html; charset=utf-8');
  return panel({ domainler, tiklama });
});

// elle kapatma isaretlenir; linkcheck bunu ezmez
app.post('/admin/domain/:id/durum', async (istek, yanit) => {
  if (!yetkili(istek)) {
    yanit.header('www-authenticate', 'Basic realm="ugb"').code(401).send('yetki');
    return;
  }
  await q('UPDATE domains SET aktif = 1 - aktif, elle_kapali = 1 WHERE id = ?', [Number(istek.params.id)]);
  await hostmapTazele();
  return yanit.redirect('/admin', 303);
});

app.get('/health', async () => ({ ok: await ping() }));

app.get('/robots.txt', async (istek, yanit) => {
  yanit.type('text/plain; charset=utf-8');
  return `User-agent: *\nAllow: /\nSitemap: https://${istek.hostname}/sitemap.xml\n`;
});

app.get('/sitemap.xml', async (istek, yanit) => {
  yanit.type('application/xml; charset=utf-8');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://${istek.hostname}/</loc><lastmod>${istanbulIso(new Date())}</lastmod></url>\n</urlset>\n`;
});

app.setErrorHandler((hata, istek, yanit) => {
  log.error('hub hatasi', { yol: istek.url, hata: hata.message });
  yanit.code(hata.statusCode ?? 500).send('hata');
});

if (isProd && env.ADMIN_PAROLA === VARSAYILAN_PAROLA) {
  log.warn('ADMIN_PAROLA varsayilan degerde', { cozum: '.env icinde degistir' });
}

await hostmapTazele().catch((e) => log.warn('hostmap', { hata: e.message }));
await app.listen({ port: env.PORT, host: '0.0.0.0' });
log.info('hub ayakta', { port: env.PORT });

for (const s of ['SIGINT', 'SIGTERM']) {
  process.on(s, async () => {
    await app.close();
    await close();
    process.exit(0);
  });
}