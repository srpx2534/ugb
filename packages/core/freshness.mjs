// packages/core/freshness.mjs
//
// Tazelik damgasi. Aralik GUNCELLEME_MIN_DK / GUNCELLEME_MAX_DK env'inden,
// saat dilimi SITE_SAAT_DILIMI'nden gelir; burada sabit deger yoktur.
// config.mjs tarafindaki tek kaynak kullanilir ki iki uygulama ayni kurali izlesin.

import { env, guncellemeDakika, zamanDamgasi } from './config.mjs';

export const YAYIN = '2023-03-05T12:41:00+03:00';
export const YAYIN_MS = Date.parse(YAYIN);

const p = (n) => String(n).padStart(2, '0');

// Geriye uyum: eski ad korunur, artik site saat dilimini kullanir.
export const istanbulIso = zamanDamgasi;

export function istanbulGorunur(tarih) {
  const parca = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: env.SITE_SAAT_DILIMI,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .formatToParts(tarih)
      .filter((x) => x.type !== 'literal')
      .map((x) => [x.type, x.value])
  );

  const saat = parca.hour === '24' ? '00' : parca.hour;
  return `${p(parca.day)}.${p(parca.month)}.${parca.year} ${saat}:${p(parca.minute)}`;
}

export function guncelleme() {
  const dakika = guncellemeDakika();
  let zaman = Date.now() - dakika * 60_000;
  if (zaman < YAYIN_MS) zaman = YAYIN_MS;

  const tarih = new Date(zaman);
  return {
    iso: zamanDamgasi(tarih),
    gorunur: istanbulGorunur(tarih),
    goreli: `${dakika} dakika önce`,
  };
}