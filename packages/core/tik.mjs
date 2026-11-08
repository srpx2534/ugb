// packages/core/tik.mjs
//
// Tiklama sismesi: ayni anahtar (domain + slug + IP hash) dakikada en fazla
// TIK_UST kez sayilir. Anahtar IP hash'i tasidigi icin ham IP tutulmaz.
//
// Harita sinirlidir: tavan asilinca once suresi dolmus kayitlar, yetmezse en
// eski kayitlar atilir. Boylece sinirsiz bellek buyumesi olmaz.

const TIK_PENCERE_MS = 60 * 1000;
const TIK_UST = 3;
const TIK_HARITA_UST = 5000;

const sayac = new Map();

export function tikSayilirMi(anahtar) {
  const simdi = Date.now();
  const kayit = sayac.get(anahtar);

  if (!kayit || simdi > kayit.bitis) {
    if (sayac.size >= TIK_HARITA_UST) {
      for (const [k, v] of sayac) if (simdi > v.bitis) sayac.delete(k);
      while (sayac.size >= TIK_HARITA_UST) {
        const ilk = sayac.keys().next().value;
        if (ilk === undefined) break;
        sayac.delete(ilk);
      }
    }
    sayac.set(anahtar, { adet: 1, bitis: simdi + TIK_PENCERE_MS });
    return true;
  }

  if (kayit.adet >= TIK_UST) return false;
  kayit.adet += 1;
  return true;
}

export function tikDurum() {
  return { anahtar: sayac.size, tavan: TIK_HARITA_UST, ust: TIK_UST };
}