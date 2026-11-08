// Uc uygulamanin ortak kontrolleri + yalniz carrier'da kapi dallari.
// Kullanim: CARRIER=hedefa.com HUB=hedefb.com SPOKE=hedefc.com node scripts/dogrula2.mjs

import http from 'node:http';

const CARRIER = process.env.CARRIER ?? 'hedefa.com';
const HUB = process.env.HUB ?? 'hedefb.com';
const SPOKE = process.env.SPOKE ?? 'hedefc.com';

const PORTLAR = { carrier: 3001, hub: 3002, spoke: 3003 };

const BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const MOBIL = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const MASA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let hata = 0;

function dene(ad, kosul, ek = '') {
  if (kosul) console.log(`  ok   ${ad}`);
  else { hata++; console.log(`  HATA ${ad}${ek ? ` — ${ek}` : ''}`); }
}

function al(rol, host, yol, ua, ek = {}) {
  return new Promise((coz, reddet) => {
    const i = http.request(
      {
        hostname: '127.0.0.1',
        port: PORTLAR[rol],
        path: yol,
        method: 'GET',
        headers: { host, 'user-agent': ua, 'accept-encoding': 'identity', ...ek },
      },
      (y) => {
        let g = '';
        y.setEncoding('utf8');
        y.on('data', (p) => { g += p; });
        y.on('end', () => coz({ durum: y.statusCode, govde: g, basliklar: new Headers(y.headers) }));
      }
    );
    i.on('error', reddet);
    i.setTimeout(15000, () => i.destroy(new Error('zaman asimi')));
    i.end();
  });
}

const UYGULAMALAR = [
  ['carrier', CARRIER],
  ['hub', HUB],
  ['spoke', SPOKE],
];

for (const [rol, host] of UYGULAMALAR) {
  console.log(`${rol} (${host}):`);

  const saglik = await al(rol, host, '/health', MASA);
  dene('health 200', saglik.durum === 200, String(saglik.durum));

  const sm = await al(rol, host, '/sitemap.xml', MASA);
  dene('sitemap 200', sm.durum === 200, String(sm.durum));
  dene('tek url', (sm.govde.match(/<url>/g) ?? []).length === 1);
  dene('lastmod', sm.govde.includes('<lastmod>'));
  dene('changefreq', sm.govde.includes('<changefreq>'));
  dene('priority', sm.govde.includes('<priority>'));
  dene('loc host', sm.govde.includes(`<loc>https://${host}/</loc>`), host);

  const rb = await al(rol, host, '/robots.txt', MASA);
  dene('robots sitemap satiri', rb.govde.includes(`Sitemap: https://${host}/sitemap.xml`));

  const yok = await al(rol, host, '/yok-boyle-sayfa-xyz', MASA);
  dene('bilinmeyen yol 404', yok.durum === 404, String(yok.durum));
}

console.log('carrier kapi:');
const decoy = await al('carrier', CARRIER, '/', MASA);
dene('masaustu decoy', decoy.durum === 200 && decoy.govde.includes('lang="en"'), String(decoy.durum));
dene('decoy script yok', !decoy.govde.includes('<script'));
dene('decoy canonical host', decoy.govde.includes(`rel="canonical" href="https://${CARRIER}/"`));

const reklam = await al('carrier', CARRIER, '/', MOBIL);
dene('mobil reklam', reklam.durum === 200 && !reklam.govde.includes('<html ⚡'));

const makale = await al('carrier', CARRIER, '/', BOT, { 'x-ugb-bot': '1' });
dene('bot makale', makale.durum === 200 && makale.govde.includes('<html ⚡'));

const mMobil = await al('carrier', `m.${CARRIER}`, '/', MOBIL);
dene('m. + mobil reklam', mMobil.durum === 200 && !mMobil.govde.includes('<html ⚡'));

const mBot = await al('carrier', `m.${CARRIER}`, '/', BOT, { 'x-ugb-bot': '1' });
dene('m. + bot makale', mBot.durum === 200 && mBot.govde.includes('<html ⚡'));
dene('m. + bot canonical m. degil', mBot.govde.includes(`rel="canonical" href="https://${CARRIER}/"`));

const mMasa = await al('carrier', `m.${CARRIER}`, '/', MASA);
dene('m. + masaustu decoy', mMasa.durum === 200 && mMasa.govde.includes('lang="en"'), String(mMasa.durum));
dene('m. + masaustu reklam degil', !mMasa.govde.includes('href="/l/'));
dene('m. + masaustu canonical m. degil', mMasa.govde.includes(`rel="canonical" href="https://${CARRIER}/"`));

console.log('hub yonlendirici:');
const l = await al('hub', HUB, '/l/ultrabet?say=0', MASA);
dene('302', l.durum === 302, String(l.durum));
// HUB_URL dev'de http olabilir; uretimde https beklenir ama sema zorlanmaz
dene('marka adresi', /^https?:\/\//.test(l.basliklar.get('location') ?? ''), l.basliklar.get('location') ?? '');

console.log(hata ? `\n${hata} hata` : '\ntum kontroller gecti');
process.exitCode = hata ? 1 : 0;