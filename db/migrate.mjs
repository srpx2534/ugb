// MariaDB uzerinde calisir. DDL otomatik commit eder; bir ifade patlarsa dosya
// yarim kalir. Bu yuzden her dosya tek seferde gonderilir ve hata aninda durulur.
// Tek DB kullanicisi: DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASS.

import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

const KLASOR = path.join(process.cwd(), 'db', 'migrations');
const ISARET = '-- rollback';
const YON = process.argv[2];
const EVET = process.argv.includes('--evet');
const KOMUTLAR = ['up', 'down', 'durum', 'eksik-sil', 'checksum-yenile'];

if (!KOMUTLAR.includes(YON)) {
  console.error('kullanim: node db/migrate.mjs <up|down|durum|eksik-sil|checksum-yenile> [ad] [--evet]');
  process.exit(1);
}

if (!process.env.DB_HOST || !process.env.DB_USER) {
  console.error('DB_HOST ve DB_USER tanimli olmali');
  process.exit(1);
}

const bag = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  multipleStatements: true,
  timezone: 'Z',
});

function ozet(icerik) {
  return crypto.createHash('sha256').update(icerik).digest('hex');
}

// Uretimde onay: semayi veya kayitlari degistiren her komut --evet ister.
function onay(aciklama) {
  if (process.env.NODE_ENV === 'prod' && !EVET) {
    console.error(`uretim ortami: ${aciklama}, onay icin --evet ekle`);
    process.exit(2);
  }
}

// Isaretci kendi satirinda olmak zorunda. Ileri blok ondan once, geri blok sonra.
function bol(icerik) {
  const i = icerik.indexOf('\n' + ISARET);
  if (i === -1) throw new Error(`${ISARET} satiri yok`);
  const ileri = icerik.slice(0, i).trim();
  const geri = icerik.slice(i + 1 + ISARET.length).trim();
  if (!ileri) throw new Error('ileri blok bos');
  if (!geri) throw new Error('geri blok bos');
  return { ileri, geri };
}

async function dosyalar() {
  const adlar = (await fs.readdir(KLASOR)).filter((a) => /^\d{4}_.+\.sql$/.test(a)).sort();
  return adlar.map((a) => path.join(KLASOR, a));
}

async function tabloKur() {
  await bag.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      ad           VARCHAR(190) NOT NULL,
      checksum     CHAR(64) NOT NULL,
      uygulandi_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ad (ad)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function uygulanan() {
  const [s] = await bag.query('SELECT ad, checksum FROM schema_migrations ORDER BY id');
  return s;
}

async function up() {
  await tabloKur();
  const gecmis = await uygulanan();
  const harita = new Map(gecmis.map((g) => [g.ad, g.checksum]));

  for (const yol of await dosyalar()) {
    const ad = path.basename(yol);
    const icerik = await fs.readFile(yol, 'utf8');
    const sum = ozet(icerik);

    if (harita.has(ad)) {
      if (harita.get(ad) !== sum) {
        throw new Error(
          `${ad} uygulanmis ama icerigi degismis (checksum uyusmuyor). ` +
          `Bilincli duzeltme ise: node db/migrate.mjs checksum-yenile ${ad}`
        );
      }
      continue;
    }

    onay(`${ad} uygulanacak`);

    const { ileri } = bol(icerik);
    console.log(`uygulaniyor: ${ad}`);
    await bag.query(ileri);
    await bag.query('INSERT INTO schema_migrations (ad, checksum) VALUES (?, ?)', [ad, sum]);
  }
  console.log('guncel');
}

async function down() {
  await tabloKur();
  const gecmis = await uygulanan();
  if (!gecmis.length) { console.log('geri alinacak adim yok'); return; }

  const son = gecmis[gecmis.length - 1];
  const yol = path.join(KLASOR, son.ad);

  let icerik;
  try {
    icerik = await fs.readFile(yol, 'utf8');
  } catch {
    throw new Error(
      `${son.ad} uygulanmis ama dosyasi yok. Once "node db/migrate.mjs eksik-sil" calistir.`
    );
  }

  const { geri } = bol(icerik);

  onay(`${son.ad} geri alinacak`);

  console.log(`geri aliniyor: ${son.ad}`);
  await bag.query(geri);
  await bag.query('DELETE FROM schema_migrations WHERE ad = ?', [son.ad]);
  console.log('geri alindi');
}

async function durum() {
  await tabloKur();
  const gecmis = await uygulanan();
  const hepsi = (await dosyalar()).map((y) => path.basename(y));
  const dosyaSet = new Set(hepsi);

  for (const ad of hepsi) {
    console.log(`${gecmis.some((g) => g.ad === ad) ? '[x]' : '[ ]'} ${ad}`);
  }

  const eksik = gecmis.filter((g) => !dosyaSet.has(g.ad));
  for (const g of eksik) console.log(`[!] ${g.ad} (uygulanmis, dosya yok)`);
  if (eksik.length) console.log(`\n${eksik.length} dosyasi olmayan kayit var, "eksik-sil" ile temizlenebilir`);

  const bekleyen = hepsi.filter((ad) => !gecmis.some((g) => g.ad === ad));
  if (bekleyen.length) console.log(`\n${bekleyen.length} bekleyen migration var, "up" ile uygulanir`);
}

async function eksikSil() {
  await tabloKur();
  const hepsi = new Set((await dosyalar()).map((y) => path.basename(y)));
  const gecmis = await uygulanan();
  const eksik = gecmis.filter((g) => !hepsi.has(g.ad));
  if (!eksik.length) { console.log('eksik kayit yok'); return; }

  onay(`${eksik.length} dosyasi olmayan kayit silinecek`);

  for (const g of eksik) {
    await bag.query('DELETE FROM schema_migrations WHERE ad = ?', [g.ad]);
    console.log(`silindi: ${g.ad}`);
  }
}

async function checksumYenile(adHam) {
  if (!adHam) throw new Error('dosya adi gerekli: node db/migrate.mjs checksum-yenile 0001_init.sql');

  // Yol tasimayan ad kabul edilir; aksi halde migrations/ disi dosya hash'lenir.
  const ad = path.basename(adHam);
  if (ad !== adHam) throw new Error(`dosya adi yol tasimamali (ornek: 0001_init.sql), gelen: ${adHam}`);

  const yol = path.join(KLASOR, ad);
  const icerik = await fs.readFile(yol, 'utf8');

  onay(`${ad} checksum'i yenilenecek`);

  const [s] = await bag.query('UPDATE schema_migrations SET checksum = ? WHERE ad = ?', [ozet(icerik), ad]);
  if (!s.affectedRows) throw new Error(`schema_migrations icinde kayit yok: ${ad}`);
  console.log(`checksum yenilendi: ${ad}`);
}

try {
  if (YON === 'up') await up();
  else if (YON === 'down') await down();
  else if (YON === 'durum') await durum();
  else if (YON === 'eksik-sil') await eksikSil();
  else await checksumYenile(process.argv[3] ?? '');
} catch (e) {
  console.error(`hata: ${e.message}`);
  process.exitCode = 1;
} finally {
  await bag.end();
}