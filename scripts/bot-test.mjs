// Kapi UA testleri. Tek komut: BASE=http://127.0.0.1:3001 HOST=m.hedefa.com npm run bot-test
// Sunucu ayakta olmali, .env icinde BOT_UA_GECER=1 ve TRUST_PROXY=true bulunmali.

import http from 'node:http';

const HOST = process.env.HOST ?? 'm.hedefa.com';
const BASE = process.env.BASE ?? 'http://127.0.0.1:3001';
const { hostname, port } = new URL(BASE);

const GOOGLE_UA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.129 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const MOBIL_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const MASA_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Google CIDR icinden sahte istemci IP'si: yerel testte loopback yerine bunu kullaniyoruz
const GOOGLE_IP = '66.249.66.1';

let hata = 0;

function kontrol(ad, kosul, ek = '') {
  if (kosul) console.log(`  ok   ${ad}`);
  else { hata++; console.log(`  HATA ${ad}${ek ? ` — ${ek}` : ''}`); }
}

function iste(yol, basliklar = {}) {
  return new Promise((coz, reddet) => {
    const i = http.request(
      { hostname, port, path: yol, method: 'GET', headers: { host: HOST, ...basliklar } },
      (y) => {
        let g = '';
        y.setEncoding('utf8');
        y.on('data', (p) => { g += p; });
        y.on('end', () => coz({ durum: y.statusCode, govde: g }));
      },
    );
    i.on('error', reddet);
    i.setTimeout(10000, () => i.destroy(new Error('zaman asimi')));
    i.end();
  });
}

try {
  const sag = await iste('/health');
  if (sag.durum !== 200) throw new Error(`/health ${sag.durum}`);

  console.log('on kontrol:');
  const xffsiz = await iste('/', { 'user-agent': GOOGLE_UA });
  kontrol('XFF olmadan googlebot reklam gorur', xffsiz.govde.includes('href="/l/'));

  console.log('googlebot:');
  const g = await iste('/', { 'user-agent': GOOGLE_UA, 'x-forwarded-for': GOOGLE_IP });
  kontrol('makale dondu (paragraf var)', (g.govde.match(/<p>/g) ?? []).length > 0);
  kontrol('/l/ linki yok', !g.govde.includes('href="/l/'));
  kontrol('canonical m. degil', /canonical" href="https:\/\//.test(g.govde) && !/canonical" href="https:\/\/m\./.test(g.govde));
  kontrol('index, follow', g.govde.includes('content="index, follow'));

  console.log('mobil tarayici:');
  const m = await iste('/', { 'user-agent': MOBIL_UA, 'sec-ch-ua-mobile': '?1', 'x-forwarded-for': '88.88.88.88' });
  kontrol('reklam dondu (/l/ linki var)', m.govde.includes('href="/l/'));
  kontrol('paragraf yok', (m.govde.match(/<p>/g) ?? []).length === 0);

  console.log('masaustu tarayici:');
  const d = await iste('/', { 'user-agent': MASA_UA, 'x-forwarded-for': '88.88.88.88' });
  kontrol('decoy dondu (lang=en)', d.govde.includes('lang="en'));
  kontrol('/l/ linki yok', !d.govde.includes('href="/l/'));

  console.log('canonical tutarliligi:');
  const y404 = await iste('/olmayan-yol', { 'x-forwarded-for': GOOGLE_IP });
  kontrol('404 canonical m. degil', !y404.govde.includes('https://m.'));
  const rb = await iste('/robots.txt');
  kontrol('robots sitemap m. degil', !rb.govde.includes('https://m.'));
  const prot1 = await iste('/pages/constructor');
  kontrol('/pages/constructor 404', prot1.durum === 404, String(prot1.durum));
  const prot2 = await iste('/pages/toString');
  kontrol('/pages/toString 404', prot2.durum === 404, String(prot2.durum));
  const prot3 = await iste('/pages/menu');
  kontrol('/pages/menu 200', prot3.durum === 200, String(prot3.durum));

  console.log(hata ? `\n${hata} hata` : '\ntum bot kontrolleri gecti');
  process.exitCode = hata ? 1 : 0;
} catch (e) {
  console.error(`hata: ${e.message}`);
  process.exitCode = 1;
}