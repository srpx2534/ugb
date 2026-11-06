// Hub yonetim kapisi testleri. Tek komut: node scripts/kapi-test.mjs
// Parola .env icindeki ADMIN_PAROLA'dan okunur. Sunucu 3002'de ayakta olmali.

import 'dotenv/config';
import http from 'node:http';
import mysql from 'mysql2/promise';

const HOST = process.env.HOST ?? 'hedefb.com';
const PORT = Number(process.env.HUB_PORT ?? 3002);
const PAROLA = process.env.ADMIN_PAROLA;
const YANLIS = 'yanlisparola';

if (!PAROLA) {
  console.error('ADMIN_PAROLA .env icinde yok');
  process.exit(1);
}

let hata = 0;

function dene(ad, kosul, ek = '') {
  if (kosul) console.log(`  ok   ${ad}`);
  else { hata++; console.log(`  HATA ${ad}${ek ? ` — ${ek}` : ''}`); }
}

function istek(yol, { kullanici = null, parola = null, yontem = 'GET', basliklar = {} } = {}) {
  return new Promise((coz, reddet) => {
    const bas = { host: HOST, 'user-agent': 'kapi-test', ...basliklar };
    if (kullanici !== null) {
      bas.authorization = 'Basic ' + Buffer.from(`${kullanici}:${parola ?? ''}`).toString('base64');
    }
    const i = http.request({ hostname: '127.0.0.1', port: PORT, path: yol, method: yontem, headers: bas }, (y) => {
      let g = '';
      y.setEncoding('utf8');
      y.on('data', (p) => { g += p; });
      y.on('end', () => coz({ durum: y.statusCode, govde: g, basliklar: new Headers(y.headers) }));
    });
    i.on('error', reddet);
    i.setTimeout(10000, () => i.destroy(new Error('zaman asimi')));
    i.end();
  });
}

const bag = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const durum = async () => {
  const [s] = await bag.query('SELECT aktif FROM domains WHERE id = 3');
  return s[0]?.aktif;
};

try {
  console.log('kimlik:');
  const yok = await istek('/admin');
  dene('kimliksiz 401', yok.durum === 401, String(yok.durum));
  dene('www-authenticate basligi', !!yok.basliklar.get('www-authenticate'));

  const dogru = await istek('/admin', { kullanici: 'admin', parola: PAROLA });
  dene('dogru parola 200', dogru.durum === 200, String(dogru.durum));

  console.log('origin:');
  const yabanci = await istek('/admin/domain/3/durum', {
    kullanici: 'admin', parola: PAROLA, yontem: 'POST', basliklar: { origin: 'https://kotu-site.com' },
  });
  dene('yabanci origin 403', yabanci.durum === 403, String(yabanci.durum));

  const originsiz = await istek('/admin/domain/3/durum', { kullanici: 'admin', parola: PAROLA, yontem: 'POST' });
  dene('origin yok 303', originsiz.durum === 303, String(originsiz.durum));

  const ayni = await istek('/admin/domain/3/durum', {
    kullanici: 'admin', parola: PAROLA, yontem: 'POST', basliklar: { origin: `http://${HOST}` },
  });
  dene('ayni origin 303', ayni.durum === 303, String(ayni.durum));

  const referer = await istek('/admin/domain/3/durum', {
    kullanici: 'admin', parola: PAROLA, yontem: 'POST', basliklar: { referer: `http://${HOST}/admin` },
  });
  dene('ayni referer 303', referer.durum === 303, String(referer.durum));

  console.log('deneme siniri:');
  for (let i = 1; i <= 5; i++) {
    const y = await istek('/admin', { kullanici: 'admin', parola: YANLIS });
    dene(`${i}. yanlis 401`, y.durum === 401, String(y.durum));
  }

  const kilit = await istek('/admin', { kullanici: 'admin', parola: YANLIS });
  dene('6. yanlis 429', kilit.durum === 429, String(kilit.durum));
  dene('retry-after basligi', !!kilit.basliklar.get('retry-after'), kilit.basliklar.get('retry-after') ?? 'yok');

  const kilitliDogru = await istek('/admin', { kullanici: 'admin', parola: PAROLA });
  dene('kilitliyken dogru parola 200', kilitliDogru.durum === 200, String(kilitliDogru.durum));

  console.log('durum:');
  if (await durum() !== 1) {
    const ac = await istek('/admin/domain/3/durum', {
      kullanici: 'admin', parola: PAROLA, yontem: 'POST', basliklar: { origin: `http://${HOST}` },
    });
    dene('domain 3 geri acildi', ac.durum === 303 && (await durum()) === 1, String(ac.durum));
  } else {
    dene('domain 3 acik', true);
  }

  console.log(hata ? `\n${hata} hata` : '\ntum kapi kontrolleri gecti');
  process.exitCode = hata ? 1 : 0;
} catch (e) {
  console.error(`hata: ${e.message}`);
  process.exitCode = 1;
} finally {
  await bag.end();
}