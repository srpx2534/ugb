import { pool } from './db.mjs';
import { env } from './config.mjs';
import { log } from './log.mjs';

// Istek yolunda DB'ye yazilmaz: kayit bellekte biriktirilir, toplu INSERT ile
// bosaltilir. Boylece trafik artisi dogrudan DB yazma sayisina donusmez.

const KUYRUK = [];
const DURUM = { yazilan: 0, atilan: 0, hata: 0, sonHata: null, kuyruk: 0 };

let calisiyor = false;
let zamanlayici = null;
let temizlikZamanlayici = null;

const SUTUNLAR = '(domain_id, ip, ua, yol, durum, bot, mobil)';

// Ilginc kayitlar (bot, hata, reklam tiklamasi) her zaman tutulur; siradan
// trafik 1/ORNEK oraninda orneklenir.
function ornekGecer(kayit) {
  if (env.CRAWL_LOG_ORNEK <= 1) return true;
  if (kayit.bot) return true;
  if (kayit.durum >= 400) return true;
  if (kayit.yol.startsWith('/l/')) return true;
  return Math.random() * env.CRAWL_LOG_ORNEK < 1;
}

function bosalt() {
  if (calisiyor || KUYRUK.length === 0) return;
  calisiyor = true;

  const parti = KUYRUK.splice(0, env.CRAWL_LOG_TOPLU);
  const yer = new Array(parti.length).fill(`(${new Array(7).fill('?').join(',')})`).join(',');
  const degerler = [];

  for (const k of parti) {
    degerler.push(k.domain_id, k.ip, k.ua, k.yol, k.durum, k.bot, k.mobil);
  }

  pool
    .query(`INSERT INTO crawl_log ${SUTUNLAR} VALUES ${yer}`, degerler)
    .then(() => {
      DURUM.yazilan += parti.length;
    })
    .catch((e) => {
      DURUM.hata += 1;
      DURUM.sonHata = e.message;

      // Havuz mesgulse partiyi geri koy, sonraki turda tekrar denenir.
      // Kalici hatada geri koymak kuyrugu tikar, o yuzden sadece mesgulde.
      if (e.mesgul && KUYRUK.length + parti.length <= env.CRAWL_LOG_KUYRUK) {
        KUYRUK.unshift(...parti);
      } else {
        DURUM.atilan += parti.length;
      }
    })
    .finally(() => {
      calisiyor = false;
      if (KUYRUK.length >= env.CRAWL_LOG_TOPLU) bosalt();
    });
}

export function crawlLogEkle(kayit) {
  if (env.CRAWL_LOG === '0') return;
  if (!ornekGecer(kayit)) return;

  if (KUYRUK.length >= env.CRAWL_LOG_KUYRUK) {
    KUYRUK.shift();
    DURUM.atilan += 1;
  }

  KUYRUK.push(kayit);
  DURUM.kuyruk = KUYRUK.length;

  if (KUYRUK.length >= env.CRAWL_LOG_TOPLU) bosalt();
}

export function crawlLogDurum() {
  return {
    kuyruk: KUYRUK.length,
    kuyrukLimiti: env.CRAWL_LOG_KUYRUK,
    yazilan: DURUM.yazilan,
    atilan: DURUM.atilan,
    hata: DURUM.hata,
    sonHata: DURUM.sonHata,
  };
}

// Eski kayitlar parca parca silinir: tek dev DELETE tabloyu kilitlemesin.
async function temizle() {
  const gun = env.CRAWL_LOG_SAKLAMA_GUN;

  for (let tur = 0; tur < 20; tur++) {
    try {
      const [s] = await pool.query(
        'DELETE FROM crawl_log WHERE created_at < NOW() - INTERVAL ? DAY LIMIT 5000',
        [gun]
      );
      if (s.affectedRows < 5000) return;
    } catch (e) {
      log.warn('crawl_log temizlik', { hata: e.message });
      return;
    }
  }
}

export function crawlLogBaslat() {
  if (env.CRAWL_LOG === '0' || zamanlayici) return;

  zamanlayici = setInterval(bosalt, env.CRAWL_LOG_ARALIK_MS);
  zamanlayici.unref();

  temizlikZamanlayici = setInterval(() => {
    void temizle();
  }, 60 * 60 * 1000);
  temizlikZamanlayici.unref();
}

// Kapanista cagrilir: kalan partiyi yazmayi dener, en fazla bir tur bekler.
export async function crawlLogDurdur() {
  if (zamanlayici) clearInterval(zamanlayici);
  if (temizlikZamanlayici) clearInterval(temizlikZamanlayici);
  zamanlayici = null;
  temizlikZamanlayici = null;

  for (let i = 0; i < 50; i++) {
    if (!calisiyor && KUYRUK.length === 0) break;
    if (!calisiyor) bosalt();
    await new Promise((r) => setTimeout(r, 100));
  }
}