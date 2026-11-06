import { q } from './db.mjs';
import { kacis } from './html.mjs';

export const AGIRLIK = { marka: 60, bolge: 25, isletme: 10, genel: 5 };
export const AZAMI = 25;

function karistir(dizi, rnd) {
  for (let i = dizi.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [dizi[i], dizi[j]] = [dizi[j], dizi[i]];
  }
  return dizi;
}

// Agirliklar slot payidir: 25 slotun %60'i marka, %25'i bolge, %10'u isletme,
// %5'i genel. Boylece havuzdaki eleman sayisi dagilimi bozamaz. Kategori
// tukenirse pay agirlik sirasina gore diger kategorilere kaydirilir.
export function linkSec(adaylar, adet, tohum) {
  let a = tohum >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const turler = Object.keys(AGIRLIK);
  const gruplar = new Map(turler.map((t) => [t, []]));
  for (const x of adaylar) {
    const t = AGIRLIK[x.tur] ? x.tur : 'genel';
    gruplar.get(t).push({ ...x, tur: t });
  }
  for (const g of gruplar.values()) karistir(g, rnd);

  const sinir = Math.min(adet, AZAMI, adaylar.length);
  const pay = {};
  let kalan = sinir;

  for (const t of turler) {
    const hedef = Math.round((sinir * AGIRLIK[t]) / 100);
    const alinan = Math.min(hedef, gruplar.get(t).length, kalan);
    pay[t] = alinan;
    kalan -= alinan;
  }
  for (const t of turler) {
    while (kalan > 0 && pay[t] < gruplar.get(t).length) {
      pay[t]++;
      kalan--;
    }
  }

  const secilen = [];
  for (const t of turler) secilen.push(...gruplar.get(t).slice(0, pay[t]));
  karistir(secilen, rnd);

  return secilen.slice(0, sinir);
}

export function linkBlokRender(linkler) {
  if (!linkler?.length) return '';
  const satirlar = linkler
    .map((l) => `<a href="${kacis(l.hedef)}" title="${kacis(l.anchor)}" rel="follow">${kacis(l.anchor)}</a>`)
    .join(' · ');
  return `\n<div class="gizli-blok">${satirlar}</div>\n`;
}

export async function linkBlokUret(domainId, tohum, adet = AZAMI) {
  const adaylar = await q(
    'SELECT anchor, hedef, tur FROM link_blocks WHERE domain_id = ? ORDER BY sira',
    [domainId]
  );
  if (!adaylar.length) return [];
  return linkSec(adaylar, adet, tohum);
}