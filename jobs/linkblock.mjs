// hub ve spoke icin display:none link blogu verisi uretir.
// Hedefler simdilik sabit havuz; 855'lik gercek korpus gelince degisecek.

import { q, close } from '../packages/core/db.mjs';
import { log } from '../packages/core/log.mjs';

const HEDEFLER = [
  ['Joe Pizza', 'https://www.joespizzanyc.com/', 'isletme'],
  ['Katz Deli', 'https://katzsdelicatessen.com/', 'isletme'],
  ['Grimaldi Pizzeria', 'https://www.grimaldis.com/', 'isletme'],
  ['Lombardi Pizza', 'https://www.firstpizza.com/', 'isletme'],
  ['Brooklyn Bolge Rehberi', 'https://www.brooklyn-usa.org/', 'bolge'],
  ['Queens Bolge Rehberi', 'https://www.queensbp.org/', 'bolge'],
  ['Arizona Bolge Rehberi', 'https://az.gov/', 'bolge'],
  ['Phoenix Sehir Rehberi', 'https://www.phoenix.gov/', 'bolge'],
  ['Mesa Sehir Rehberi', 'https://www.mesaaz.gov/', 'bolge'],
  ['Tucson Sehir Rehberi', 'https://www.tucsonaz.gov/', 'bolge'],
  ['Scottsdale Rehberi', 'https://www.scottsdaleaz.gov/', 'bolge'],
  ['Gilbert Rehberi', 'https://www.gilbertaz.gov/', 'bolge'],
  ['Chandler Rehberi', 'https://www.chandleraz.gov/', 'bolge'],
  ['Tempe Rehberi', 'https://www.tempe.gov/', 'bolge'],
  ['Glendale Rehberi', 'https://www.glendaleaz.com/', 'bolge'],
  ['Peoria Rehberi', 'https://www.peoriaaz.gov/', 'bolge'],
  ['Surprise Rehberi', 'https://www.surpriseaz.gov/', 'bolge'],
  ['Yelp Isletme Rehberi', 'https://www.yelp.com/', 'genel'],
  ['Tripadvisor Restoran', 'https://www.tripadvisor.com/', 'genel'],
  ['OpenTable', 'https://www.opentable.com/', 'genel'],
  ['DoorDash', 'https://www.doordash.com/', 'genel'],
  ['Uber Eats', 'https://www.ubereats.com/', 'genel'],
  ['Grubhub', 'https://www.grubhub.com/', 'genel'],
  ['Restoran Menu Arsivi', 'https://www.menuism.com/', 'genel'],
  ['Yerel Isletme Rehberi', 'https://www.local.com/', 'genel'],
];

const ANCHOR = {
  marka: ['deneme bonusu', 'deneme bonusu veren siteler', 'bonus sitesi', 'deneme bonusu 2026'],
  bolge: ['bolge rehberi', 'sehir rehberi', 'yerel rehber', 'cevre rehberi'],
  isletme: ['isletme sayfasi', 'isletme rehberi', 'isletme profili'],
  genel: ['detayli bilgi', 'guncel liste', 'kaynak sayfa'],
};

function tohum(s) {
  let a = 0;
  for (const k of s) a = (a * 31 + k.charCodeAt(0)) >>> 0;
  return a;
}

function rndUret(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AGIRLIK = { marka: 60, bolge: 25, isletme: 10, genel: 5 };
const AZAMI = 25;

function turSec(rnd) {
  const toplam = Object.values(AGIRLIK).reduce((a, b) => a + b, 0);
  let x = rnd() * toplam;
  for (const [tur, agirlik] of Object.entries(AGIRLIK)) {
    x -= agirlik;
    if (x <= 0) return tur;
  }
  return 'genel';
}

async function uret(domainId, seed) {
  const rnd = rndUret(seed);
  const secilen = [];
  const havuz = [...HEDEFLER];

  while (secilen.length < AZAMI && havuz.length) {
    const i = Math.floor(rnd() * havuz.length);
    const [ad, hedef] = havuz.splice(i, 1)[0];
    const tur = turSec(rnd);
    const anchor = tur === 'marka' ? `${ad} deneme bonusu` : `${ad} ${ANCHOR[tur][Math.floor(rnd() * ANCHOR[tur].length)]}`;
    secilen.push({ anchor, hedef, tur });
  }

  await q('DELETE FROM link_blocks WHERE domain_id = ?', [domainId]);
  let sira = 1;
  for (const s of secilen) {
    await q(
      'INSERT INTO link_blocks (domain_id, sira, anchor, hedef, tur) VALUES (:d, :s, :a, :h, :t)',
      { d: domainId, s: sira++, a: s.anchor.slice(0, 190), h: s.hedef, t: s.tur }
    );
  }
  return secilen.length;
}

try {
  const hedefler = await q("SELECT id, host, seed FROM domains WHERE role IN ('hub','spoke') AND aktif = 1");
  if (!hedefler.length) {
    log.warn('linkblock: hub veya spoke yok');
  }
  for (const d of hedefler) {
    const n = await uret(d.id, tohum(d.host) ^ (d.seed ?? 0));
    log.info('linkblock yazildi', { host: d.host, adet: n });
  }
  log.info('bitti');
} catch (e) {
  log.error('linkblock hatasi', { hata: e.message });
  process.exitCode = 1;
} finally {
  await close();
}