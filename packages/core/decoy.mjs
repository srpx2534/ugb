import { one } from './db.mjs';
import { log } from './log.mjs';

const VARSAYILAN = {
  isim: 'Rittenhouse Grill',
  tur: 'Kebap & Grill',
  adres: '21258 E Rittenhouse Rd',
  sehir: 'Queen Creek',
  bolge: 'AZ',
  posta: '85142',
  tel: '(480) 555-0134',
  eposta: 'info@rittenhousegrill.example',
  hakkinda:
    'Family owned since 2016. Charcoal-grilled sis kebab, adana and lahmacun, cooked to order. Parking on site, two minutes from Rittenhouse Road.',
  saatler: {
    Monday: '11:00 - 21:00',
    Tuesday: '11:00 - 21:00',
    Wednesday: '11:00 - 21:00',
    Thursday: '11:00 - 21:00',
    Friday: '11:00 - 22:00',
    Saturday: '11:00 - 22:00',
    Sunday: '12:00 - 20:00',
  },
  menu: [
    { ad: 'Adana Kebab', fiyat: '$18' },
    { ad: 'Sis Kebab', fiyat: '$19' },
    { ad: 'Lahmacun', fiyat: '$6' },
    { ad: 'Iskender', fiyat: '$21' },
    { ad: 'Lentil Soup', fiyat: '$5' },
    { ad: 'Baklava', fiyat: '$7' },
  ],
  fotolar: 6,
};

const TTL_MS = 60_000;
const OLUMSUZ_TTL_MS = 30_000;
const UYARI_ARALIK_MS = 5 * 60 * 1000;

const cache = new Map();
const olumsuz = new Map();
const uyari = new Map();

function uyar(anahtar, mesaj, ek = {}) {
  const son = uyari.get(anahtar) ?? 0;
  if (Date.now() - son < UYARI_ARALIK_MS) return;
  uyari.set(anahtar, Date.now());
  log.warn(mesaj, ek);
}

function birlestir(d) {
  return {
    ...VARSAYILAN,
    ...d,
    saatler: { ...VARSAYILAN.saatler, ...(d.saatler ?? {}) },
    menu: Array.isArray(d.menu) && d.menu.length ? d.menu : VARSAYILAN.menu,
    fotolar: Number(d.fotolar ?? VARSAYILAN.fotolar),
  };
}

function jsonCoz(deger, varsayilan) {
  if (deger == null) return varsayilan;
  if (typeof deger !== 'string') return deger;
  try { return JSON.parse(deger); } catch { return varsayilan; }
}

export async function decoyCoz(decoyId) {
  if (!decoyId) {
    uyar('yok', 'decoy_id tanimli degil, varsayilan kimlik kullaniliyor');
    return birlestir({});
  }

  const simdi = Date.now();
  const kayit = cache.get(decoyId);
  if (kayit && simdi - kayit.zaman < TTL_MS) return birlestir(kayit.veri);

  const olumsuzZaman = olumsuz.get(decoyId);
  if (olumsuzZaman && simdi - olumsuzZaman < OLUMSUZ_TTL_MS) return birlestir({});

  const satir = await one(
    `SELECT isim, tur, adres, sehir, bolge, posta, tel, eposta, hakkinda, saatler, menu, fotolar
     FROM decoys WHERE id = ? AND aktif = 1`,
    [decoyId]
  );

  if (!satir) {
    olumsuz.set(decoyId, simdi);
    uyar(`id:${decoyId}`, 'decoy bulunamadi ya da pasif, varsayilan kimlik kullaniliyor', { decoy_id: decoyId });
    return birlestir({});
  }

  satir.saatler = jsonCoz(satir.saatler, {});
  satir.menu = jsonCoz(satir.menu, []);

  cache.set(decoyId, { veri: satir, zaman: simdi });
  return birlestir(satir);
}

export function decoyTemizle() {
  cache.clear();
  olumsuz.clear();
  uyari.clear();
}

export function svgYerine(metin, sira) {
  const renkler = ['#8c3b26', '#a9552f', '#6f3320', '#b4693f'];
  const zemin = renkler[sira % renkler.length];
  return `<svg viewBox="0 0 400 300" role="img" aria-label="${metin}"><rect width="400" height="300" fill="${zemin}"/><text x="200" y="155" text-anchor="middle" fill="#f4efe6" font-family="Georgia, serif" font-size="20">${metin}</text></svg>`;
}