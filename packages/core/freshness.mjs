export const YAYIN = '2023-03-05T12:41:00+03:00';
export const YAYIN_MS = Date.parse(YAYIN);

const p = (n) => String(n).padStart(2, '0');

export function istanbulIso(tarih) {
  const k = new Date(tarih.getTime() + 3 * 3600_000);
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())}T${p(k.getUTCHours())}:${p(k.getUTCMinutes())}:${p(k.getUTCSeconds())}+03:00`;
}

export function istanbulGorunur(tarih) {
  const k = new Date(tarih.getTime() + 3 * 3600_000);
  return `${p(k.getUTCDate())}.${p(k.getUTCMonth() + 1)}.${k.getUTCFullYear()} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}

export function guncelleme() {
  const dakika = 5 + Math.floor(Math.random() * 41);
  let zaman = Date.now() - dakika * 60_000;
  if (zaman < YAYIN_MS) zaman = YAYIN_MS;
  const tarih = new Date(zaman);
  return {
    iso: istanbulIso(tarih),
    gorunur: istanbulGorunur(tarih),
    goreli: `${dakika} dakika önce`,
  };
}