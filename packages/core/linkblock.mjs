import { q } from './db.mjs';

export const AGIRLIK = { marka: 60, bolge: 25, isletme: 10, genel: 5 };
export const AZAMI = 25;

export function linkSec(adaylar, adet, tohum) {
  let a = tohum >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const havuz = [...adaylar];
  for (let i = havuz.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [havuz[i], havuz[j]] = [havuz[j], havuz[i]];
  }
  return havuz.slice(0, Math.min(adet, AZAMI));
}

export function linkBlokRender(linkler) {
  if (!linkler?.length) return '';
  const satirlar = linkler
    .map((l) => `<a href="${l.hedef}" title="${l.anchor}" rel="dofollow">${l.anchor}</a>`)
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