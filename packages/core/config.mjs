// packages/core/config.mjs
//
// Tum ayarlar ortam degiskenlerinden okunur. Dosyada sabit domain, port veya
// sir degeri yoktur.
//   ADMIN_PAROLA (min 12), HASH_TUZU (min 16), HUB_URL, HUB_HOST her ortamda
//   zorunludur. PORT uretimde zorunludur.
//
// PORT ic (dinleme) portudur: uygulamalar ic portlarda durur, disariya 80'i
// nginx acar. HUB_URL public adrestir, bu yuzden port tasimaz.
//
// Port cozumleme sirasi: PORT > uygulamaya ozel degisken (CARRIER_PORT /
// HUB_PORT / SPOKE_PORT) > dev-test icin 3000. Uygulama, calisma dizininden
// cozulur; uretimde PORT'u pm2 verdigi icin esleme devreye girmez.
//
// Oncelik: sistem ortami > cwd/.env > kok/.env.local > kok/.env
// Sistem ortami (pm2/systemd) hicbir dosya tarafindan ezilmez.

import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const HATA_ON_EKI = '[config]';
const BU_DOSYA = fileURLToPath(import.meta.url);
const PROJE_KOKU = resolve(dirname(BU_DOSYA), '..', '..');

// ---------------------------------------------------------------------------
// .env yukleyici
// Bagimlilik eklememek icin minimal. Korunan anahtarlar (acilista sistemde
// tanimli olanlar) hicbir zaman dosyadan yazilmaz.
// ---------------------------------------------------------------------------

const KORUMALI = new Set(Object.keys(process.env));

const envDosyasiOku = (yol, { ustuneYaz = false } = {}) => {
  if (!existsSync(yol)) return;

  for (const satir of readFileSync(yol, 'utf8').split(/\r?\n/)) {
    const temiz = satir.trim();
    if (temiz === '' || temiz.startsWith('#')) continue;

    const esitlik = temiz.indexOf('=');
    if (esitlik < 1) continue;

    const anahtar = temiz.slice(0, esitlik).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(anahtar)) continue;
    if (KORUMALI.has(anahtar)) continue;
    if (!ustuneYaz && process.env[anahtar] !== undefined) continue;

    let deger = temiz.slice(esitlik + 1).trim();

    const tirnakli =
      deger.length >= 2 &&
      ((deger.startsWith('"') && deger.endsWith('"')) ||
        (deger.startsWith("'") && deger.endsWith("'")));

    if (tirnakli) {
      deger = deger.slice(1, -1);
    } else {
      const yorum = deger.indexOf(' #');
      if (yorum > -1) deger = deger.slice(0, yorum).trim();
    }

    process.env[anahtar] = deger;
  }
};

envDosyasiOku(resolve(PROJE_KOKU, '.env'));
envDosyasiOku(resolve(PROJE_KOKU, '.env.local'), { ustuneYaz: true });

const CALISMA_DIZINI = process.cwd();
if (CALISMA_DIZINI !== PROJE_KOKU) {
  envDosyasiOku(resolve(CALISMA_DIZINI, '.env'), { ustuneYaz: true });
}

// ---------------------------------------------------------------------------
// Okuma yardimcilari
// ---------------------------------------------------------------------------

const hamDeger = (ad) => {
  const deger = process.env[ad];
  return typeof deger === 'string' ? deger.trim() : '';
};

const zorunlu = (ad) => {
  const deger = hamDeger(ad);
  if (deger === '') {
    throw new Error(`${HATA_ON_EKI} ${ad} tanimli degil. Sabit varsayilan yok, .env doldurulmali.`);
  }
  return deger;
};

const secenek = (ad, izinli, varsayilan) => {
  const ham = hamDeger(ad).toLowerCase();
  if (ham === '') return varsayilan;
  if (!izinli.includes(ham)) {
    throw new Error(`${HATA_ON_EKI} ${ad} su degerlerden biri olmali: ${izinli.join(', ')}.`);
  }
  return ham;
};

const saatDilimi = (ad, varsayilan) => {
  const deger = hamDeger(ad) || varsayilan;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: deger }).format(new Date());
  } catch {
    throw new Error(`${HATA_ON_EKI} ${ad} gecersiz saat dilimi: ${deger}`);
  }
  return deger;
};

// Public adres: zorunlu, protokol http/https olmali, varsayilan port (80/443)
// yaziliysa kirpilir. Boylece linklerde ":80" gibi gereksiz ek cikmaz.
const publicAdres = (ad) => {
  const ham = zorunlu(ad);

  let u;
  try {
    u = new URL(ham);
  } catch {
    throw new Error(`${HATA_ON_EKI} ${ad} gecerli bir URL degil: ${ham}`);
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(`${HATA_ON_EKI} ${ad} http veya https ile baslamali.`);
  }

  if (u.port === '80' || u.port === '443') u.port = '';

  return u.toString().replace(/\/$/, '');
};

// ---------------------------------------------------------------------------
// Ortam
// ---------------------------------------------------------------------------

const ORTAM = secenek('NODE_ENV', ['dev', 'test', 'prod'], 'dev');
const URETIM_MI = ORTAM === 'prod';
const TEST_MI = ORTAM === 'test';

// ---------------------------------------------------------------------------
// Port
// Uretimde PORT zorunludur (pm2 verir). Dev ve test'te, dogrudan
// `node server.mjs` ile calisirken uygulamaya ozel degisken kullanilir;
// boylece uc uygulama ayni 3000'e cikmaz.
// ---------------------------------------------------------------------------

const UYGULAMA = basename(process.cwd());

const UYGULAMA_PORT_ANAHTARI =
  { carrier: 'CARRIER_PORT', hub: 'HUB_PORT', spoke: 'SPOKE_PORT' }[UYGULAMA] ?? null;

const portCoz = () => {
  const dogrudan = hamDeger('PORT');
  const yedek = UYGULAMA_PORT_ANAHTARI ? hamDeger(UYGULAMA_PORT_ANAHTARI) : '';
  const ham = dogrudan !== '' ? dogrudan : yedek;
  const kaynak = dogrudan !== '' ? 'PORT' : UYGULAMA_PORT_ANAHTARI ?? 'PORT';

  if (ham === '') {
    if (URETIM_MI) {
      throw new Error(`${HATA_ON_EKI} PORT tanimli degil. Uretimde pm2/systemd vermeli.`);
    }
    return 3000;
  }

  const sayi = Number(ham);
  if (!Number.isInteger(sayi) || sayi < 1 || sayi > 65535) {
    throw new Error(`${HATA_ON_EKI} ${kaynak} 1-65535 arasi tam sayi olmali (gelen: ${ham}).`);
  }
  return sayi;
};

const PORT = portCoz();

// ---------------------------------------------------------------------------
// Sema
// Sirlar ve public adres burada zorunlu: .default() yok.
// ---------------------------------------------------------------------------

const bayrak = (varsayilan) => z.enum(['0', '1']).default(varsayilan);

const Sema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  SITE_ID: z.coerce.number().int().min(1).max(999).default(1),

  DB_HOST: z.string().min(1).max(190),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().regex(/^[a-z0-9_]{1,64}$/, 'kucuk harf, rakam, alt cizgi'),
  DB_USER: z.string().min(1).max(64),
  DB_PASS: z.string().min(16),
  DB_POOL: z.coerce.number().int().min(1).max(50).default(10),
  DB_QUEUE_LIMIT: z.coerce.number().int().min(1).max(500).default(40),
  DB_BAGLANTI_ZAMAN_ASIMI_MS: z.coerce.number().int().min(500).max(30000).default(3000),
  DB_SORGU_ZAMAN_ASIMI_MS: z.coerce.number().int().min(250).max(30000).default(3000),
  DB_ISLEM_ZAMAN_ASIMI_MS: z.coerce.number().int().min(500).max(60000).default(8000),
  DB_RETRY_AFTER_SN: z.coerce.number().int().min(1).max(60).default(2),

  CRAWL_LOG: bayrak('1'),
  CRAWL_LOG_ORNEK: z.coerce.number().int().min(1).max(100).default(5),
  CRAWL_LOG_TOPLU: z.coerce.number().int().min(50).max(1000).default(200),
  CRAWL_LOG_ARALIK_MS: z.coerce.number().int().min(250).max(10000).default(1000),
  CRAWL_LOG_KUYRUK: z.coerce.number().int().min(200).max(20000).default(3000),
  CRAWL_LOG_SAKLAMA_GUN: z.coerce.number().int().min(1).max(90).default(14),

  HOSTMAP_TTL_MS: z.coerce.number().int().min(5000).max(600000).default(60000),
  TRUST_PROXY: z
    .string()
    .default('false')
    .transform((v) => ['1', 'true', 'evet', 'yes'].includes(v.toLowerCase())),
  CF_ARKADA: bayrak('0'),
  BOT_ZORLA: bayrak('0'),
  BOT_UA_GECER: bayrak('1'),

  HASH_TUZU: z.string().min(16).max(190),
  LOG_SEVIYE: z.enum(['info', 'warn', 'error']).default('info'),

  HUB_URL: z.string().min(8),
  HUB_HOST: z.string().min(3),
  ADMIN_PAROLA: z.string().min(12).max(190),
  DIKEY: z.enum(['bonus', 'canli-mac']).default('bonus'),

  HUB_HTTPS_ZORLA: bayrak(URETIM_MI ? '1' : '0'),
  HUB_IZINLI_IP: z.string().default(''),
  HUB_API_KORU: bayrak('1'),

  // nginx ayni makinede oldugu icin varsayilan geri besleme adresi.
  // Uzak proxy arkasinda ya da konteynerde 0.0.0.0 gerekirse env'den verilir.
  DINLEME_HOST: z.string().min(3).max(190).default('127.0.0.1'),

  SITE_SAAT_DILIMI: z.string().default(saatDilimi('SITE_SAAT_DILIMI', 'Europe/Istanbul')),
  GUNCELLEME_MIN_DK: z.coerce.number().int().min(0).max(1440).default(5),
  GUNCELLEME_MAX_DK: z.coerce.number().int().min(0).max(1440).default(45),
  CEREZ_GUVENLI: bayrak(URETIM_MI ? '1' : '0'),
});

const sonuc = Sema.safeParse({ ...process.env, HUB_URL: publicAdres('HUB_URL') });

if (!sonuc.success) {
  console.error('env hatasi:');

  // zod 4'te path bos dizi olabilir; etiket yine okunur kalsin.
  const sorunlar = Array.isArray(sonuc.error?.issues) ? sonuc.error.issues : [];

  if (sorunlar.length === 0) {
    console.error(`  ${sonuc.error?.message ?? 'bilinmeyen hata'}`);
  } else {
    for (const i of sorunlar) {
      const yol = Array.isArray(i.path) && i.path.length > 0 ? i.path.join('.') : '(kok)';
      console.error(`  ${yol}: ${i.message}`);
    }
  }

  process.exit(1);
}

const env = Object.freeze({ ...sonuc.data, PORT, UYGULAMA });

// Geriye uyum: bu iki isim artik deger tutmuyor, env'den turetiliyor.
// Tuketiciler dogrudan env.ADMIN_PAROLA / env.HASH_TUZU de kullanabilir.
export const VARSAYILAN_PAROLA = env.ADMIN_PAROLA;
export const VARSAYILAN_TUZ = env.HASH_TUZU;

// ---------------------------------------------------------------------------
// Uretim uyarilari
// ---------------------------------------------------------------------------

if (env.HASH_TUZU.includes('degistir')) {
  console.warn(`${HATA_ON_EKI} HASH_TUZU hala ornek degerde: degistirilmeli.`);
}

if (URETIM_MI && env.CEREZ_GUVENLI === '0') {
  console.warn('uyari: prod ortamda CEREZ_GUVENLI=0');
}

// HUB_URL public adrestir. Uretimde disariya yalnizca 80/443 acik oldugu icin
// ic port yazili kalmamali. Dev ve test'te port mesrudur: hub yerelde o portta.
if (URETIM_MI) {
  const hubPortu = new URL(env.HUB_URL).port;
  if (hubPortu) {
    throw new Error(
      `${HATA_ON_EKI} HUB_URL ic port tasiyor (${hubPortu}), uretimde public adres portsuz olmali`
    );
  }
}

// ---------------------------------------------------------------------------
// Capraz kontroller
// ---------------------------------------------------------------------------

export const dogrula = () => {
  const hatalar = [];
  const uyarilar = [];

  if (env.GUNCELLEME_MIN_DK > env.GUNCELLEME_MAX_DK) {
    hatalar.push('GUNCELLEME_MIN_DK, GUNCELLEME_MAX_DK degerinden buyuk olamaz.');
  }
  if (env.GUNCELLEME_MIN_DK === env.GUNCELLEME_MAX_DK) {
    uyarilar.push('Guncelleme araligi sabit; damga her istekte ayni dakikaya duser.');
  }
  if (env.HASH_TUZU === env.ADMIN_PAROLA) {
    hatalar.push('HASH_TUZU ile ADMIN_PAROLA ayni olamaz.');
  }
  if (URETIM_MI && env.CEREZ_GUVENLI === '0') {
    hatalar.push('Uretimde CEREZ_GUVENLI=1 olmali.');
  }
  if (TEST_MI && URETIM_MI) {
    hatalar.push('Ortam ayni anda test ve uretim olamaz.');
  }

  for (const uyari of uyarilar) console.warn(`${HATA_ON_EKI} ${uyari}`);
  if (hatalar.length > 0) {
    throw new Error(`${HATA_ON_EKI} gecersiz yapilandirma:\n- ${hatalar.join('\n- ')}`);
  }

  return true;
};

// Acilista calisir: kontroller olu kod kalmasin, hatali env ile ayaga kalkilmasin.
dogrula();

// ---------------------------------------------------------------------------
// Yardimci: guncelleme dakikasi ve ISO 8601 damgasi
// ---------------------------------------------------------------------------

// MIN..MAX araligindan rastgele dakika. Aralik env'den gelir, boylece
// GUNCELLEME_MIN_DK / GUNCELLEME_MAX_DK gercekten etkili olur.
export const guncellemeDakika = () => {
  const aralik = env.GUNCELLEME_MAX_DK - env.GUNCELLEME_MIN_DK;
  return env.GUNCELLEME_MIN_DK + Math.floor(Math.random() * (aralik + 1));
};

const parcalariAl = (tarih, dilim) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: dilim,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(tarih);

const ofsetAl = (tarih, dilim) => {
  const parca = new Intl.DateTimeFormat('en-US', {
    timeZone: dilim,
    timeZoneName: 'longOffset',
  })
    .formatToParts(tarih)
    .find((p) => p.type === 'timeZoneName');

  const eslesme = /GMT([+-]\d{2}:\d{2})/.exec(parca?.value ?? '');
  return eslesme ? eslesme[1] : '+00:00';
};

// Verilen tarihi site saat diliminde, ofsetli ISO 8601'e cevirir.
export const zamanDamgasi = (tarih) => {
  const p = Object.fromEntries(
    parcalariAl(tarih, env.SITE_SAAT_DILIMI)
      .filter((parca) => parca.type !== 'literal')
      .map((parca) => [parca.type, parca.value])
  );

  const saat = p.hour === '24' ? '00' : p.hour;

  return `${p.year}-${p.month}-${p.day}T${saat}:${p.minute}:${p.second}${ofsetAl(tarih, env.SITE_SAAT_DILIMI)}`;
};

// Simdiki zamandan MIN..MAX dakika geriye dusulmus damga.
export const sonGuncellemeDamgasi = (taban = new Date()) => {
  const fark = guncellemeDakika();
  return zamanDamgasi(new Date(taban.getTime() - fark * 60_000));
};

// ---------------------------------------------------------------------------
// Host / slug dogrulama
// ---------------------------------------------------------------------------

const ETIKET = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD = /^[a-z0-9]{2,}$/;

// IPv6 koseli parantezi ve varsa port birlikte cozulur. Ciplak IPv6'nin sonundaki
// ":1" port sanilmasin diye port yalnizca tek iki nokta varsa atilir.
export function hostNormalize(host) {
  let h = String(host ?? '').toLowerCase().trim();
  const ipv6 = h.match(/^\[([0-9a-f:.]+)\](?::[^:]*)?$/);
  if (ipv6) h = ipv6[1];
  else if (h.split(':').length === 2) h = h.replace(/:[^:]*$/, '');
  return h.replace(/\.$/, '').replace(/^www\./, '');
}

// Canonical icin: www. ve m. yalnizca kalan parca hala nokta iceriyorsa soyulur,
// boylece "m.com" gibi tek etiketli host "com"a dusmez.
export function kokHostNormalize(host) {
  let h = hostNormalize(host);
  while (h.startsWith('www.')) h = h.slice(4);
  if (h.startsWith('m.') && h.slice(2).includes('.')) h = h.slice(2);
  while (h.startsWith('www.')) h = h.slice(4);
  return h;
}

// URL icinde kullanilacak host parcasi: IPv6 paranteze alinir, aksi halde
// "https://::1/" gibi gecersiz adres cikar
export function kokUrlHost(host) {
  const h = kokHostNormalize(host);
  return h.includes(':') ? `[${h}]` : h;
}

export function ipGecerli(ip) {
  if (typeof ip !== 'string') return false;
  if (ip.includes(':')) {
    if (ip === '::') return true;
    if (!/^[0-9a-f:.]{2,45}$/i.test(ip)) return false;
    return /[0-9a-f]/i.test(ip) && !ip.includes(':::');
  }
  const p = ip.split('.');
  if (p.length !== 4) return false;
  return p.every((x) => /^\d{1,3}$/.test(x) && Number(x) <= 255);
}

export function hostGecerli(host) {
  if (typeof host !== 'string') return false;
  const h = hostNormalize(host);
  if (h.length < 3 || h.length > 190) return false;
  if (ipGecerli(h)) return true;
  const parcalar = h.split('.');
  if (parcalar.length < 2) return false;
  if (!parcalar.every((p) => ETIKET.test(p))) return false;
  return TLD.test(parcalar[parcalar.length - 1]);
}

export function slugGecerli(slug) {
  return typeof slug === 'string' && slug.length <= 190 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

// ---------------------------------------------------------------------------
// Disa aktarim
// ---------------------------------------------------------------------------

export { env };
export const isProd = URETIM_MI;
export const AYAR = env;
export default env;