import { config as envYukle } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Sistem ortami (pm2/systemd) .env tarafindan ezilmemeli
const SISTEM_ENV = { ...process.env };

envYukle({ path: path.join(KOK, '.env') });
envYukle({ path: path.join(process.cwd(), '.env'), override: true });

for (const [k, v] of Object.entries(SISTEM_ENV)) process.env[k] = v;

const VARSAYILAN_PAROLA = 'PAROLAPAROLA';
const VARSAYILAN_TUZ = 'ugb-tuz-degistir';

const Sema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'prod']).default('dev'),
  SITE_ID: z.coerce.number().int().min(1).max(999).default(1),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  DB_HOST: z.string().min(1).max(190),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().regex(/^[a-z0-9_]{1,64}$/, 'kucuk harf, rakam, alt cizgi'),
  DB_USER: z.string().min(1).max(64),
  DB_PASS: z.string().min(16),
  DB_POOL: z.coerce.number().int().min(1).max(50).default(10),
  HOSTMAP_TTL_MS: z.coerce.number().int().min(5000).max(600000).default(60000),
  TRUST_PROXY: z.string().default('false').transform((v) => ['1', 'true', 'evet', 'yes'].includes(v.toLowerCase())),
  CF_ARKADA: z.enum(['0', '1']).default('0'),
  BOT_ZORLA: z.enum(['0', '1']).default('0'),
  BOT_UA_GECER: z.enum(['0', '1']).default('1'),
  HASH_TUZU: z.string().min(8).max(190).default(VARSAYILAN_TUZ),
  LOG_SEVIYE: z.enum(['info', 'warn', 'error']).default('info'),
  HUB_URL: z.string().min(8).default('http://hedefb.com:3002'),
  HUB_HOST: z.string().min(3).default('hedefb.com'),
  ADMIN_PAROLA: z.string().min(8).default(VARSAYILAN_PAROLA),
});

const sonuc = Sema.safeParse(process.env);

if (!sonuc.success) {
  console.error('env hatasi:');
  for (const i of sonuc.error.issues) console.error(`  ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}

if (sonuc.data.NODE_ENV === 'prod') {
  if (sonuc.data.ADMIN_PAROLA === VARSAYILAN_PAROLA) {
    console.warn('uyari: prod ortamda ADMIN_PAROLA varsayilan degerde');
  }
  if (sonuc.data.HASH_TUZU === VARSAYILAN_TUZ) {
    console.warn('uyari: prod ortamda HASH_TUZU varsayilan degerde');
  }
  if (/:3002$/.test(sonuc.data.HUB_URL)) {
    console.warn(`uyari: prod ortamda HUB_URL varsayilan portlu (${sonuc.data.HUB_URL})`);
  }
  if (sonuc.data.CF_ARKADA === '1' && !sonuc.data.TRUST_PROXY) {
    console.warn('uyari: CF_ARKADA=1 ama TRUST_PROXY kapali');
  }
}

export const env = Object.freeze(sonuc.data);
export const isProd = env.NODE_ENV === 'prod';
export { VARSAYILAN_PAROLA, VARSAYILAN_TUZ };

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

// URL icinde kullanilacak host parcasi: IPv6 paranteze alinir, aksi hâlde
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