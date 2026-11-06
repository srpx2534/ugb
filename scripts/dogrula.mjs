// Kullanim: BASE=http://127.0.0.1:3001 HOST=hedefa.com node scripts/dogrula.mjs
// fetch() Node 26'da ozel Host basligini yok sayar; bu yuzden http.request kullanilir.

import http from 'node:http';
import { URL } from 'node:url';

const BASE = process.env.BASE ?? 'http://127.0.0.1:3001';
const HOST = process.env.HOST ?? 'hedefa.com';
const SLUG = process.env.SLUG ?? 'ultrabet';

const BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const MOBIL = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const MASA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const YASAK = ['haberbosna.com', 'undergroundburgers.com', 'bunny.net', 'unsplash.com', 'translate.goog', 'merkezemoji.com'];

let hata = 0;

function dene(ad, kosul, ek = '') {
  if (kosul) console.log(`  ok   ${ad}`);
  else { hata++; console.log(`  HATA ${ad}${ek ? ` — ${ek}` : ''}`); }
}

function al(yol, ua, ek = {}) {
  const url = new URL(BASE + yol);
  return new Promise((coz, reddet) => {
    const istek = http.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'GET',
        headers: { host: HOST, 'user-agent': ua, 'accept-encoding': 'identity', ...ek },
      },
      (yanit) => {
        let govde = '';
        yanit.setEncoding('utf8');
        yanit.on('data', (p) => { govde += p; });
        yanit.on('end', () =>
          coz({ durum: yanit.statusCode, govde, basliklar: new Headers(yanit.headers) })
        );
      }
    );
    istek.on('error', reddet);
    istek.setTimeout(15000, () => istek.destroy(new Error('zaman asimi')));
    istek.end();
  });
}

const BOTB = { 'x-ugb-bot': '1' };

console.log('on kontrol:');
const saglik = await al('/health', MASA);
dene('sunucu ayakta', saglik.durum === 200, String(saglik.durum));
if (saglik.durum !== 200) {
  console.log(`\n${HOST} icin /health ${saglik.durum}. Host kayitli degil ya da sunucu kapali.`);
  process.exit(1);
}
let saglikVeri = {};
try { saglikVeri = JSON.parse(saglik.govde); } catch { /* yoksay */ }
dene('host cozuldu', !!saglikVeri.host, saglikVeri.host ?? 'yok');

console.log('makale (bot):');
const m = await al('/', BOT, BOTB);

dene('200', m.durum === 200, String(m.durum));
dene('amp isareti', m.govde.includes('<html ⚡'));
dene('amp-custom', m.govde.includes('amp-custom'));
dene('amp-img', (m.govde.match(/<amp-img/g) ?? []).length >= 3);
dene('canonical host', m.govde.includes(`rel="canonical" href="https://${HOST}/"`));
dene('hreflang tr', m.govde.includes('hreflang="tr"'));
dene('hreflang tr-TR', m.govde.includes('hreflang="tr-TR"'));
dene('noarchive', m.govde.includes('noarchive'));
dene('lang tr', m.govde.includes('lang="tr"'));
dene('json-ld Article', m.govde.includes('"@type":"Article"'));
dene('inLanguage', m.govde.includes('"inLanguage":"tr-TR"'));
dene('datePublished sabit', m.govde.includes('"datePublished":"2023-03-05T12:41:00+03:00"'));
dene('no-store', (m.basliklar.get('cache-control') ?? '').includes('no-store'));

const dm = m.govde.match(/"dateModified":"([^"]+)"/)?.[1];
dene('dateModified var', !!dm, dm ?? 'yok');
if (dm) {
  dene('Istanbul ofseti', dm.endsWith('+03:00'), dm);
  dene('gelecekte degil', Date.parse(dm) <= Date.now() + 1000, dm);
  dene('yayindan kucuk degil', Date.parse(dm) >= Date.parse('2023-03-05T12:41:00+03:00'), dm);
}
for (const y of YASAK) dene(`yasakli yok: ${y}`, !m.govde.includes(y));

const m2 = await al('/', BOT, BOTB);
const dm2 = m2.govde.match(/"dateModified":"([^"]+)"/)?.[1];
dene('iki istekte tarih farkli', !!dm && !!dm2 && dm !== dm2, `${dm} / ${dm2}`);

console.log('reklam sayfasi (mobil):');
const r = await al('/', MOBIL);
dene('200', r.durum === 200);
dene('amp degil', !r.govde.includes('<html ⚡'));
dene('canonical', r.govde.includes('rel="canonical"'));
dene('marka linki', r.govde.includes('href="/l/'));

console.log('decoy (masaustu):');
const d = await al('/', MASA);
dene('200', d.durum === 200);
dene('lang en', d.govde.includes('lang="en"'));
dene('script yok', !d.govde.includes('<script'));

console.log('yonlendirici:');
const l = await al(`/l/${SLUG}`, MOBIL);
dene('302', l.durum === 302, String(l.durum));
dene('hub hedefi', (l.basliklar.get('location') ?? '').includes(`/l/${SLUG}?say=0`), l.basliklar.get('location') ?? '');

console.log('robots:');
const rb = await al('/robots.txt', MASA);
dene('Googlebot blogu', rb.govde.includes('User-agent: Googlebot'));

console.log('sitemap:');
const s = await al('/sitemap.xml', MASA);
dene('tek url', (s.govde.match(/<url>/g) ?? []).length === 1);
dene('lastmod', s.govde.includes('<lastmod>'));
dene('changefreq', s.govde.includes('<changefreq>daily</changefreq>'));
dene('priority', s.govde.includes('<priority>1.0</priority>'));

console.log(hata ? `\n${hata} hata` : '\ntum kontroller gecti');
process.exitCode = hata ? 1 : 0;