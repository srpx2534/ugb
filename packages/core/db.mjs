import mysql from 'mysql2/promise';
import { env } from './config.mjs';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  connectionLimit: env.DB_POOL,
  queueLimit: env.DB_QUEUE_LIMIT,
  waitForConnections: true,
  connectTimeout: env.DB_BAGLANTI_ZAMAN_ASIMI_MS,
  maxIdle: env.DB_POOL,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4_unicode_ci',
  timezone: 'Z',
  dateStrings: true,
  namedPlaceholders: true,
  decimalNumbers: true,
});

pool.on('connection', (c) => {
  c.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci', (e) => {
    if (e) console.error('SET NAMES hatasi:', e.message);
  });
});

export class DbMesgul extends Error {
  constructor(sebep) {
    super(`veritabani mesgul: ${sebep.message}`);
    this.name = 'DbMesgul';
    this.mesgul = true;
    this.statusCode = 503;
    this.retryAfter = env.DB_RETRY_AFTER_SN;
    this.sebep = sebep.code ?? null;
    this.cause = sebep;
  }
}

const GECICI_KODLAR = new Set([
  'POOL_ENQUEUELIMIT',
  'ER_CON_COUNT_ERROR',
  'ER_LOCK_WAIT_TIMEOUT',
  'ER_LOCK_DEADLOCK',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_SEQUENCE_TIMEOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'EHOSTUNREACH',
]);

// Bir kez yeniden denenir: unique anahtar yarisi deadlock uretir, tekrar
// genellikle ON DUPLICATE dalina duser ve is biter.
const YENIDEN_DENEN = new Set(['ER_LOCK_DEADLOCK']);

function geciciMi(e) {
  if (!e) return false;
  if (e.mesgul) return true;
  if (e.code && GECICI_KODLAR.has(e.code)) return true;
  return /queue limit|too many connections|connect timeout|handshake inactivity/i.test(e.message ?? '');
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function koru(fn) {
  for (let deneme = 1; ; deneme++) {
    try {
      return await fn();
    } catch (e) {
      if (e?.code && YENIDEN_DENEN.has(e.code) && deneme < 2) {
        await bekle(50 + Math.floor(Math.random() * 100));
        continue;
      }
      if (geciciMi(e)) throw new DbMesgul(e);
      throw e;
    }
  }
}

const opts = (ek) => ({ timeout: env.DB_SORGU_ZAMAN_ASIMI_MS, ...ek });

export async function q(sql, params = {}, ek = {}) {
  return koru(async () => {
    const [satirlar] = await pool.execute(sql, params, opts(ek));
    return satirlar;
  });
}

export async function one(sql, params = {}, ek = {}) {
  return (await q(sql, params, ek))[0] ?? null;
}

export async function ins(sql, params = {}, ek = {}) {
  return koru(async () => {
    const [sonuc] = await pool.execute(sql, params, opts(ek));
    return sonuc.insertId;
  });
}

function islemZamanAsimi() {
  let zaman;
  const soz = new Promise((_, red) => {
    zaman = setTimeout(
      () =>
        red(
          new DbMesgul(
            Object.assign(new Error('islem zaman asimi'), { code: 'PROTOCOL_SEQUENCE_TIMEOUT' })
          )
        ),
      env.DB_ISLEM_ZAMAN_ASIMI_MS
    );
  });
  return { soz, durdur: () => clearTimeout(zaman) };
}

export async function tx(fn) {
  return koru(async () => {
    const c = await pool.getConnection();
    const { soz, durdur } = islemZamanAsimi();
    const is = fn(c);

    try {
      const sonuc = await Promise.race([is, soz]);
      await c.commit();
      return sonuc;
    } catch (e) {
      // Zaman asiminda fn hala calisiyor olabilir; baglanti birakilmadan once
      // kisa sure beklenir, aksi halde sorgu baska istege verilmis baglantiya gider.
      await Promise.race([is.catch(() => {}), bekle(1500)]);
      try {
        await c.rollback();
      } catch {
        // baglanti kopmussa rollback de patlar
      }
      throw e;
    } finally {
      durdur();
      c.release();
    }
  });
}

export async function withLock(ad, saniye, fn) {
  return koru(async () => {
    const c = await pool.getConnection();
    try {
      const [s] = await c.query('SELECT GET_LOCK(?, ?) AS ok', [ad, saniye]);
      if (s[0].ok !== 1) {
        throw new DbMesgul(
          Object.assign(new Error(`kilit alinamadi: ${ad}`), { code: 'ER_LOCK_WAIT_TIMEOUT' })
        );
      }
      try {
        return await fn(c);
      } finally {
        await c.query('SELECT RELEASE_LOCK(?)', [ad]).catch(() => {});
      }
    } finally {
      c.release();
    }
  });
}

export async function ping() {
  try {
    const c = await pool.getConnection();
    try {
      await c.query('SELECT 1');
      return true;
    } finally {
      c.release();
    }
  } catch {
    return false;
  }
}

export function havuzDurumu() {
  const p = pool.pool ?? {};
  return {
    baglanti: p._allConnections?.length ?? 0,
    bos: p._freeConnections?.length ?? 0,
    kuyruk: p._connectionQueue?.length ?? 0,
    baglantiLimiti: env.DB_POOL,
    kuyrukLimiti: env.DB_QUEUE_LIMIT,
    dolu: (p._connectionQueue?.length ?? 0) >= env.DB_QUEUE_LIMIT,
  };
}

export async function close() {
  await pool.end();
}