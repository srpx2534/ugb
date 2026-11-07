import Fastify from 'fastify';
import { env, isProd, hostGecerli, ipGecerli } from '@ugb/core/config';
import { log } from '@ugb/core/log';
import { q, ping, close } from '@ugb/core/db';
import { hostCoz, hostmapTazele } from '@ugb/core/hostmap';
import { botMu } from '@ugb/core/bot';
import { mobilMi } from '@ugb/core/device';
import { decoyCoz } from '@ugb/core/decoy';
import { kayitlar } from './routes.mjs';
import { hata } from './views/hata.mjs';

const app = Fastify({ trustProxy: env.TRUST_PROXY, logger: false });

function istemciIp(istek) {
  if (env.TRUST_PROXY) {
    const cfHam = istek.headers['cf-connecting-ip'];
    if (ipGecerli(cfHam)) return String(cfHam).trim();
    const xff = istek.headers['x-forwarded-for'];
    if (xff) {
      const ilk = String(xff).split(',')[0].trim();
      if (ipGecerli(ilk)) return ilk;
    }
  }
  return istek.ip;
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
  istek.mobil = mobilMi(istek.headers['user-agent']) || istek.headers['sec-ch-ua-mobile'] === '?1';
  istek.makale = istek.bot;
  // m. host tek basina reklam sebebi degil: masaustunde decoy gorunur
  istek.reklam = !istek.bot && istek.mobil;
});

app.addHook('onResponse', async (istek, yanit) => {
  if (!istek.domain) return;
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
  };
});

app.register(kayitlar);

app.setErrorHandler(async (h, istek, yanit) => {
  log.error('istek hatasi', { yol: istek.url, hata: h.message });
  const kod = h.statusCode ?? 500;
  if (!istek.domain || kod === 400) {
    yanit.code(kod).type('text/html; charset=utf-8').send(`<h1>${kod}</h1>`);
    return;
  }
  try {
    const d = await decoyCoz(istek.domain.decoy_id ?? istek.domain.es_decoy_id ?? null);
    yanit.code(kod).type('text/html; charset=utf-8').header('cache-control', 'no-store');
    yanit.send(hata(d, `https://${String(istek.hostname).replace(/^m\./, '')}${istek.url}`, kod));
  } catch {
    yanit.code(kod).type('text/html; charset=utf-8').send(`<h1>${kod}</h1>`);
  }
});

await hostmapTazele().catch((e) => log.warn('hostmap ilk yukleme', { hata: e.message }));

await app.listen({ port: env.PORT, host: '0.0.0.0' });
log.info('carrier ayakta', { port: env.PORT });

for (const sinyal of ['SIGINT', 'SIGTERM']) {
  process.on(sinyal, async () => {
    await app.close();
    await close();
    process.exit(0);
  });
}