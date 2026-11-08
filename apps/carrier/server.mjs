import Fastify from 'fastify';
import { env, isProd, hostGecerli, ipGecerli, kokUrlHost } from '@ugb/core/config';
import { log } from '@ugb/core/log';
import { q, ping, close, havuzDurumu } from '@ugb/core/db';
import { hostCoz, hostmapTazele } from '@ugb/core/hostmap';
import { botMu } from '@ugb/core/bot';
import { mobilMi } from '@ugb/core/device';
import { decoyCoz } from '@ugb/core/decoy';
import { kayitlar } from './routes.mjs';
import { hata } from './views/hata.mjs';

// Tek atlama guvenilir: nginx. Cok atlamali kurulumda XFF'in sag tarafi dogrudur.
const app = Fastify({ trustProxy: env.TRUST_PROXY ? 1 : false, logger: false });

const KAYITSIZ_YOLLAR = new Set(['/health', '/favicon.ico', '/robots.txt', '/sitemap.xml']);

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

// ?m=1 mobil surumu zorlar, ?m=0 masaustu surumu zorlar.
// iPadOS ve in-app tarayicilar masaustu UA gonderdigi icin gerekli.
function mobilZorla(istek) {
  const i = istek.url.indexOf('?');
  if (i === -1) return null;
  const q2 = new URLSearchParams(istek.url.slice(i + 1));
  const v = q2.get('m');
  if (v === '1' || v === 'true') return true;
  if (v === '0' || v === 'false') return false;
  return null;
}

app.addHook('onRequest', async (istek, yanit) => {
  const host = istek.hostname;
  if (!hostGecerli(host)) {
    yanit.code(400).type('text/html; charset=utf-8').send('<h1>400</h1>');
    return;
  }

  const domain = await hostCoz(host);
  if (!domain) {
    yanit.code(404).type('text/html; charset=utf-8').send('<h1>404</h1>');
    return;
  }

  yanit.header('x-content-type-options', 'nosniff');
  yanit.header('referrer-policy', 'strict-origin-when-cross-origin');
  yanit.header('x-frame-options', 'SAMEORIGIN');

  istek.domain = domain;
  istek.istemciIp = istemciIp(istek);
  istek.bot = env.BOT_ZORLA === '1' || (!isProd && istek.headers['x-ugb-bot'] === '1')
    ? true
    : await botMu({
        ip: istek.istemciIp,
        ua: istek.headers['user-agent'],
        basliklar: istek.headers,
        gevsek: env.BOT_UA_GECER === '1',
      });

  const zorla = mobilZorla(istek);
  istek.mobil = zorla ?? (mobilMi(istek.headers['user-agent']) || istek.headers['sec-ch-ua-mobile'] === '?1');
  istek.makale = istek.bot;
  // m. host tek basina reklam sebebi degil: masaustunde decoy gorunur
  istek.reklam = !istek.bot && istek.mobil;
});

app.addHook('onResponse', async (istek, yanit) => {
  if (!istek.domain) return;
  const yol = istek.url.split('?')[0].replace(/\/+$/, '') || '/';
  if (KAYITSIZ_YOLLAR.has(yol) || yol === '/assets' || yol.startsWith('/assets/')) return;
  try {
    await q(
      `INSERT INTO crawl_log (domain_id, ip, ua, yol, durum, bot, mobil)
       VALUES (:domain_id, :ip, :ua, :yol, :durum, :bot, :mobil)`,
      {
        domain_id: istek.domain.id,
        ip: istek.istemciIp ?? '0.0.0.0',
        ua: String(istek.headers['user-agent'] ?? '').slice(0, 255),
        yol: istek.url.slice(0, 255),
        durum: yanit.statusCode,
        bot: istek.bot ? 1 : 0,
        mobil: istek.mobil ? 1 : 0,
      }
    );
  } catch (e) {
    // kayit basarisiz olsa da yanit coktan gitti; gecici hatayi yut
    log.error('crawl_log', { hata: e.message, host: istek.hostname });
  }
});

app.get('/health', async (istek) => {
  let db = false;
  try { db = await ping(); } catch { db = false; }
  return {
    ok: db,
    host: istek.hostname,
    site: istek.domain?.site_id ?? null,
    decoy: istek.domain?.decoy_id ?? istek.domain?.es_decoy_id ?? null,
    bot: istek.bot ?? false,
    mobil: istek.mobil ?? false,
    makale: istek.makale ?? false,
    reklam: istek.reklam ?? false,
    havuz: havuzDurumu(),
  };
});

app.register(kayitlar);

app.setErrorHandler(async (h, istek, yanit) => {
  if (h.mesgul) {
    yanit.header('retry-after', String(h.retryAfter ?? 2));
    yanit.header('cache-control', 'no-store');
    yanit.code(503).type('text/html; charset=utf-8');
    log.warn('db mesgul', { yol: istek.url, sebep: h.sebep });

    let yol;
    try { yol = encodeURI(istek.url); } catch { yol = istek.url; }

    try {
      const d = await decoyCoz(istek.domain?.decoy_id ?? istek.domain?.es_decoy_id ?? null);
      return yanit.send(hata(d, `https://${kokUrlHost(istek.hostname)}${yol}`, 503));
    } catch {
      return yanit.send('<h1>503</h1>');
    }
  }

  log.error('istek hatasi', { yol: istek.url, hata: h.message });
  const kod = h.statusCode ?? 500;
  if (!istek.domain || kod === 400) {
    yanit.code(kod).type('text/html; charset=utf-8').send(`<h1>${kod}</h1>`);
    return;
  }
  try {
    const d = await decoyCoz(istek.domain.decoy_id ?? istek.domain.es_decoy_id ?? null);
    let yol;
    try { yol = encodeURI(istek.url); } catch { yol = istek.url; }
    yanit.code(kod).type('text/html; charset=utf-8').header('cache-control', 'no-store');
    yanit.send(hata(d, `https://${kokUrlHost(istek.hostname)}${yol}`, kod));
  } catch {
    yanit.code(kod).type('text/html; charset=utf-8').send(`<h1>${kod}</h1>`);
  }
});

await hostmapTazele().catch((e) => log.warn('hostmap ilk yukleme', { hata: e.message }));

if (isProd && !env.TRUST_PROXY) {
  log.warn('TRUST_PROXY kapali: nginx arkasinda bot tespiti 127.0.0.1 gorur', { cozum: '.env icinde TRUST_PROXY=true' });
}

await app.listen({ port: env.PORT, host: '0.0.0.0' });
log.info('carrier ayakta', { port: env.PORT });

for (const sinyal of ['SIGINT', 'SIGTERM']) {
  process.on(sinyal, async () => {
    await app.close();
    await close();
    process.exit(0);
  });
}