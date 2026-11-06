// Makale govdesine gizli link blogu verisi uretir: carrier, hub, spoke.
// Mobil tasiyicilar haric (onlar reklam sayfasi gosterir, makale yok).
// Marka hedefleri brands tablosundan gelir ve hub uzerinden sayilir.
// Secim agirligi core/linkblock.mjs icindeki linkSec ile tekilleştirilmiştir.

import { q, tx, close } from '../packages/core/db.mjs';
import { env } from '../packages/core/config.mjs';
import { linkSec, AZAMI } from '../packages/core/linkblock.mjs';
import { log } from '../packages/core/log.mjs';

const DIS_HEDEFLER = [
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

async function havuz() {
  const markalar = await q('SELECT ad, slug FROM brands WHERE aktif = 1 ORDER BY id');
  const hedefler = markalar.map((m) => ({
    anchor: `${m.ad} deneme bonusu`,
    hedef: `${env.HUB_URL}/l/${m.slug}`,
    tur: 'marka',
  }));

  for (const [ad, hedef, tur] of DIS_HEDEFLER) {
    const rnd = rndUret(tohum(ad));
    hedefler.push({
      anchor: `${ad} ${ANCHOR[tur][Math.floor(rnd() * ANCHOR[tur].length)]}`,
      hedef,
      tur,
    });
  }
  return hedefler;
}

async function uret(domainId, seed) {
  const adaylar = await havuz();
  const secilen = linkSec(adaylar, AZAMI, seed);

  await tx(async (c) => {
    await c.execute('DELETE FROM link_blocks WHERE domain_id = ?', [domainId]);
    let sira = 1;
    for (const s of secilen) {
      await c.execute(
        'INSERT INTO link_blocks (domain_id, sira, anchor, hedef, tur) VALUES (:d, :s, :a, :h, :t)',
        { d: domainId, s: sira++, a: s.anchor.slice(0, 190), h: s.hedef.slice(0, 500), t: s.tur }
      );
    }
  });

  return secilen.length;
}

try {
  const hedefler = await q(
    "SELECT id, host, seed FROM domains WHERE role IN ('carrier','hub','spoke') AND aktif = 1 AND mobil = 0"
  );
  if (!hedefler.length) log.warn('linkblock: hedef domain yok');

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