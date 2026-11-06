import { config as envYukle } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { z } from 'zod';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

envYukle({ path: path.join(KOK, '.env') });
envYukle({ path: path.join(process.cwd(), '.env'), override: true });

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
  TRUST_PROXY: z.string().default('false').transform((v) => v === 'true'),
  BOT_ZORLA: z.enum(['0', '1']).default('0'),
  LOG_SEVIYE: z.enum(['info', 'warn', 'error']).default('info'),
  HUB_URL: z.string().min(8).default('http://hedefb.com:3002'),
  HUB_HOST: z.string().min(3).default('hedefb.com'),
  ADMIN_PAROLA: z.string().min(8).default('PAROLAPAROLA'),
});

const sonuc = Sema.safeParse(process.env);

if (!sonuc.success) {
  console.error('env hatasi:');
  for (const i of sonuc.error.issues) console.error(`  ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}

export const env = Object.freeze(sonuc.data);
export const isProd = env.NODE_ENV === 'prod';
export const VARSAYILAN_PAROLA = 'PAROLAPAROLA';

const ETIKET = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD = /^[a-z0-9]{2,}$/;

export function hostNormalize(host) {
  return String(host ?? '')
    .toLowerCase()
    .trim()
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .replace(/^www\./, '');
}

export function ipGecerli(ip) {
  if (typeof ip !== 'string') return false;
  if (ip.includes(':')) return /^[0-9a-f:]{2,45}$/i.test(ip);
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