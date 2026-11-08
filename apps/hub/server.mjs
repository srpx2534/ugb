import crypto from 'node:crypto';
import Fastify from 'fastify';
import {
  env,
  isProd,
  hostGecerli,
  slugGecerli,
  hostNormalize,
  ipGecerli,
  VARSAYILAN_PAROLA,
} from '@ugb/core/config';
import { log } from '@ugb/core/log';
import { q, one, ping, close, havuzDurumu } from '@ugb/core/db';
import { hostCoz, hostmapTazele } from '@ugb/core/hostmap';
import { linkBlokUret, linkBlokRender } from '@ugb/core/linkblock';
import { sitemap } from '@ugb/core/html';
import { istanbulIso } from '@ugb/core/freshness';
import { portal } from './views/portal.mjs';
import { panel } from './views/panel.mjs';

const app = Fastify({ trustProxy: env.TRUST_PROXY, logger: false });

const DENEME_SINIR = 5;
const DENEME_PENCERE_MS = 10 * 60 * 1000;
const denemeler = new Map();

// nginx $proxy_add_x_forwarded_for kullandigi icin soldaki deger istemci
// tarafindan belirlenebilir. Guvenilir olan sagdaki degerdir: onu proxy yazar.
function baslikMetni(deger) {
  if (Array.isArray(deger)) return deger[0];
  return deger;
}

function istemciIp(istek) {
  if (!env.TRUST_PROXY) return istek.ip;

  if (env.CF_ARKADA === '1') {
    const cf = baslikMetni(istek.headers['cf-connecting-ip']);
    if (ipGecerli(cf)) return String(cf).trim();
  }

  const xff = baslikMetni(istek.headers['x-forwarded-for']);
  if (xff) {
    const parcalar = String(xff).split(',');
    for (let i = parcalar.length - 1; i >= 0; i--) {
      const aday = parcalar[i].trim();
      if (ipGecerli(aday)) return aday;
    }
  }
  return istek.ip;
}

function ipHash(ip) {
  return crypto.createHash('sha256').update(String(ip ?? '')).digest('hex');
}

// sabit zamanli karsilastirma: uzunluk farki ve erken cikis sizdirmaz
function zamanliEsit(a, b) {
  const x = crypto.createHash('sha256').update(String(a ?? '')).digest();
  const y = crypto.createHash('sha256').update(String(b ?? '')).digest();
  return crypto.timingSafeEqual(x, y);
}

function yetkili(istek) {
  const h = istek.headers.authorization ?? '';
  if (!h.startsWith('Basic ')) return false;
  const cozulmus = Buffer.from(h.slice(6), 'base64').toString('utf8');
  const i = cozulmus.indexOf(':');
  if (i === -1) return false;
  return zamanliEsit(cozulmus.slice(0, i), 'admin') && zamanliEsit(cozulmus.slice(i + 1), env.ADMIN_PAROLA);
}

// yanlis denemeyi biriktirir, yeni sayaci doner
function denemeArttir(ip) {
  const simdi = Date.now();
  const k = denemeler.get(ip);
  if (!k || simdi - k.ilk > DENEME_PENCERE_MS) {
    denemeler.set(ip, { n: 1, ilk: simdi });
    return 1;
  }
  k.n++;
  return k.n;
}

function denemeSifirla(ip) {
  denemeler.delete(ip);
}

// ---------------------------------------------------------------------------
// Yonetim kapisi: TLS, IP izin listesi, CSRF
// ---------------------------------------------------------------------------

const IZINLI_IP = new Set(
  String(env.HUB_IZINLI_IP ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

function guvenliMi(istek) {
  if (istek.protocol === 'https') return true;
  const xfp = baslikMetni(istek.headers['x-forwarded-proto']);
  return String(xfp ?? '').toLowerCase() === 'https';
}

// Tarayici POST'ta her zaman Origin gonderir. Origin yoksa ve sunucudan
// sunucuya oldugu x-ugb-istek basligiyla acikca belirtilmemisse reddedilir.
function originGecerli(istek) {
  const origin = baslikMetni(istek.headers.origin);
  const referer = baslikMetni(istek.headers.referer);
  const host = istek.hostname;
  const izinli = [`https://${host}`, `http://${host}`];

  if (origin) return izinli.includes(String(origin).replace(/\/$/, ''));

  if (referer) {
    const r = String(referer);
    return izinli.some((x) => r === x || r.startsWith(x + '/'));
  }

  return baslikMetni(istek.headers['x-ugb-istek']) === '1';
}

// true donerse devam edilir, false donerse yanit zaten gonderilmistir.
function yonetimKapi(istek, yanit) {
  if (env.HUB_HTTPS_ZORLA === '1' && !guvenliMi(istek)) {
    yanit.header('cache-control', 'no-store');
    yanit.redirect(`https://${istek.hostname}${istek.url}`, 308);
    return false;
  }

  if (IZINLI_IP.size > 0 && !IZINLI_IP.has(istek.istemciIp)) {
    yanit.code(403).send('ip izinli degil');
    return false;
  }

  return true;
}

app.addHook('onRequest', async (istek, yanit) => {
  if (!hostGecerli(istek.hostname)) {
    yanit.code(400).send('gecersiz host');
    return;
  }
  // hub kendi domaini kapali olsa da yonetim icin cevap vermeli
  const domain =
    (await hostCoz(istek.hostname)) ??
    (await one(
      `SELECT id, host, role, kume_id, site_id, decoy_id, mobil, seed, aktif
       FROM domains WHERE host = ?`,
      [hostNormalize(istek.hostname)]
    ));
  if (!domain) {
    yanit.code(404).send('bilinmeyen host');
    return;
  }
  istek.domain = domain;
  istek.istemciIp = istemciIp(istek);
});

// Dogru kimlik her zaman gecer; sayac yalniz yanlislari biriktirir.
// Sinir asilinca 401 yerine 429 ve retry-after doner.
function kapi(istek, yanit) {
  if (yetkili(istek)) {
    denemeSifirla(istek.istemciIp);
    return true;
  }

  const n = denemeArttir(istek.istemciIp);

  if (n > DENEME_SINIR) {
    yanit.header('retry-after', String(Math.ceil(DENEME_PENCERE_MS / 1000)));
    yanit.code(429).send('cok fazla deneme, sonra tekrar dene');
    return false;
  }

  yanit.header('www-authenticate', 'Basic realm="ugb"').code(401).send('yetki');
  return false;
}

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
  if (!yonetimKapi(istek, yanit)) return;
  if (!kapi(istek, yanit)) return;

  const domainler = await q('SELECT id, host, role, aktif FROM domains ORDER BY id');
  const sayim = await q('SELECT domain_id, COUNT(*) AS n FROM clicks GROUP BY domain_id');
  const tiklama = Object.fromEntries(sayim.map((s) => [s.domain_id, s.n]));
  yanit.type('text/html; charset=utf-8');
  return panel({ domainler, tiklama, havuz: havuzDurumu() });
});

// elle kapatma isaretlenir; linkcheck bunu ezmez
app.post('/admin/domain/:id/durum', async (istek, yanit) => {
  if (!yonetimKapi(istek, yanit)) return;
  if (!originGecerli(istek)) {
    yanit.code(403).send('yabanci origin');
    return;
  }
  if (!kapi(istek, yanit)) return;

  await q('UPDATE domains SET aktif = 1 - aktif, elle_kapali = 1 WHERE id = ?', [Number(istek.params.id)]);
  await hostmapTazele();
  return yanit.redirect('/admin', 303);
});

app.get('/health', async () => {
  const havuz = havuzDurumu();
  return { ok: (await ping()) && !havuz.dolu, havuz };
});

app.get('/robots.txt', async (istek, yanit) => {
  yanit.type('text/plain; charset=utf-8');
  return `User-agent: *\nAllow: /\nSitemap: https://${istek.hostname}/sitemap.xml\n`;
});

app.get('/sitemap.xml', async (istek, yanit) => {
  yanit.header('cache-control', 'no-store, no-cache, must-revalidate, max-age=0');
  yanit.type('application/xml; charset=utf-8');
  return sitemap(['/'], `https://${istek.hostname}`, istanbulIso(new Date()).slice(0, 10));
});

app.setErrorHandler((h, istek, yanit) => {
  if (h.mesgul) {
    yanit.header('retry-after', String(h.retryAfter ?? 2));
    log.warn('db mesgul', { yol: istek.url, sebep: h.sebep });
    yanit.code(503).send('mesgul, sonra tekrar dene');
    return;
  }
  log.error('hub hatasi', { yol: istek.url, hata: h.message });
  yanit.code(h.statusCode ?? 500).send('hata');
});

if (isProd && env.ADMIN_PAROLA === VARSAYILAN_PAROLA) {
  log.warn('ADMIN_PAROLA varsayilan degerde', { cozum: '.env icinde degistir' });
}

if (isProd && env.HUB_HTTPS_ZORLA === '1') {
  log.info('yonetim HTTPS zorunlu', { izinliIp: IZINLI_IP.size || 'sinirsiz' });
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