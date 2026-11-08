// packages/core/ip.mjs
//
// Istemci IP cozumleme tek kaynak. hub, carrier ve spoke ayni kurallari
// kullanir; daha once spoke XFF'i soldan okuyordu ve istemci tarafindan
// belirlenebilen degerle tiklama sayimi yonlendirilebiliyordu.
//
// nginx $proxy_add_x_forwarded_for kullanir: soldaki deger istemciden gelir,
// guvenilir olan sagdaki degerdir cunku onu proxy yazar.

import crypto from 'node:crypto';
import { env, ipGecerli } from './config.mjs';

export function baslikMetni(deger) {
  if (Array.isArray(deger)) return deger[0];
  return deger;
}

// TRUST_PROXY kapaliyken gelen adres IPv4-mapped IPv6 olabilir
// (::ffff:1.2.3.4). IPv4 izin listesiyle eslesmesi icin sadelestirilir.
export function ipSade(ip) {
  const s = String(ip ?? '').trim();
  const m = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(s);
  return m ? m[1] : s;
}

// Sagdan sola taranir: ilk gecerli IP proxy'nin yazdigi degerdir.
export function istemciIp(istek) {
  if (!env.TRUST_PROXY) return ipSade(istek.ip);

  if (env.CF_ARKADA === '1') {
    const cf = baslikMetni(istek.headers['cf-connecting-ip']);
    if (ipGecerli(cf)) return String(cf).trim();
  }

  const xff = baslikMetni(isteKBasligi(istek, 'x-forwarded-for'));
  if (xff) {
    const parcalar = String(xff).split(',');
    for (let i = parcalar.length - 1; i >= 0; i--) {
      const aday = parcalar[i].trim();
      if (ipGecerli(aday)) return aday;
    }
  }
  return ipSade(istek.ip);
}

function isteKBasligi(istek, ad) {
  return istek.headers?.[ad];
}

// Tuzlu hash: HASH_TUZU env'den gelir. Tuvali olmayan duz sha256 IPv4 uzayinda
// ters cevrilebilir; ayrica uc uygulama ayni semayla yazmali ki korelasyon tutsun.
export function ipHash(ip) {
  return crypto.createHash('sha256').update(`${env.HASH_TUZU}:${String(ip ?? '')}`).digest('hex');
}