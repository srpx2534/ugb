import mysql from 'mysql2/promise';
import { env } from './config.mjs';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  connectionLimit: env.DB_POOL,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 5000,
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

export async function q(sql, params = {}) {
  const [satirlar] = await pool.execute(sql, params);
  return satirlar;
}

export async function one(sql, params = {}) {
  return (await q(sql, params))[0] ?? null;
}

export async function ins(sql, params = {}) {
  const [sonuc] = await pool.execute(sql, params);
  return sonuc.insertId;
}

export async function tx(fn) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const sonuc = await fn(c);
    await c.commit();
    return sonuc;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

export async function withLock(ad, saniye, fn) {
  const c = await pool.getConnection();
  try {
    const [s] = await c.query('SELECT GET_LOCK(?, ?) AS ok', [ad, saniye]);
    if (s[0].ok !== 1) throw new Error(`kilit alinamadi: ${ad}`);
    try {
      return await fn(c);
    } finally {
      await c.query('SELECT RELEASE_LOCK(?)', [ad]);
    }
  } finally {
    c.release();
  }
}

export async function ping() {
  const c = await pool.getConnection();
  try {
    await c.query('SELECT 1');
    return true;
  } finally {
    c.release();
  }
}

export async function close() {
  await pool.end();
}