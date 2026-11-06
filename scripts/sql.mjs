// Kullanim: node scripts/sql.mjs "SELECT * FROM domains"
import 'dotenv/config';
import mysql from 'mysql2/promise';

const sorgu = process.argv.slice(2).join(' ').trim();
if (!sorgu) {
  console.error('kullanim: node scripts/sql.mjs "SELECT ..."');
  process.exit(1);
}

const bag = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  timezone: 'Z',
});

try {
  const [satirlar] = await bag.query(sorgu);
  if (Array.isArray(satirlar)) {
    if (!satirlar.length) console.log('(bos)');
    else console.table(satirlar);
  } else {
    console.log(satirlar);
  }
} catch (e) {
  console.error(`hata: ${e.message}`);
  process.exitCode = 1;
} finally {
  await bag.end();
}