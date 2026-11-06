import Fastify from 'fastify';
import { env, isProd, hostGecerli } from '@ugb/core/config';
import { log } from '@ugb/core/log';
import { q, ping, close } from '@ugb/core/db';
import { hostCoz, hostmapTazele } from '@ugb/core/hostmap';
import { botMu } from '@ugb/core/bot';
import { mobilMi } from '@ugb/core/device';
import { kayitlar } from './routes.mjs';

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
    : await botMu({ ip: istek.istemciIp, ua: istek.headers['user-agent'], basliklar: istek.headers });
  istek.mobil = mobilMi(istek.headers['user-agent']);
  istek.makale = istek.bot;
  istek.reklam = !istek.bot && (istek.mobil || domain.mobil === 1);
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

app.setErrorHandler((hata, istek, yanit) => {
  log.error('istek hatasi', { yol: istek.url, hata: hata.message });
  yanit.code(hata.statusCode ?? 500).type('text/html; charset=utf-8').send('<h1>500</h1>');
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