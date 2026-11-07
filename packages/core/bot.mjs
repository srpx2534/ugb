import { promises as dns } from 'node:dns';

const GOOGLE_CIDR = [
  '66.249.64.0/19', '66.102.0.0/20', '64.233.160.0/19', '72.14.192.0/18',
  '74.125.0.0/16', '209.85.128.0/17', '216.239.32.0/19', '216.239.36.0/23',
  '34.64.0.0/10', '35.190.0.0/17', '35.191.0.0/16', '130.211.0.0/22',
  '142.250.0.0/15', '172.217.0.0/16', '173.194.0.0/16',
];

const BING_CIDR = ['40.77.167.0/24', '157.55.39.0/24', '199.30.16.0/24', '207.46.0.0/16'];
const YANDEX_CIDR = ['5.255.253.0/24', '100.43.81.0/24', '37.9.169.0/24', '213.180.193.0/24', '178.154.131.0/24'];

const GOOGLE_UA = [
  'googlebot',
  'googlebot-image',
  'googlebot-video',
  'googlebot-news',
  'adsbot-google',
  'adsbot-google-mobile',
  'mediapartners-google',
  'google-read-aloud',
  'google-translate',
  'google-inspectiontool',
  'storebot-google',
];

// Olumlu sonuc uzun, olumsuz sonuc kisa tutulur: gecici bir DNS hatasi
// 6 saat boyunca Google'i "bot degil" saymaya yol acmasin.
const DNS_TTL_MS = 6 * 60 * 60 * 1000;
const DNS_OLUMSUZ_TTL_MS = 60 * 1000;

const dnsCache = new Map();

function ipv6Mi(ip) {
  return typeof ip === 'string' && ip.includes(':');
}

function ipSayi(ip) {
  const p = ip.split('.').map(Number);
  return (((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]) >>> 0;
}

function cidrIcinde(ip, cidr) {
  const [ag, maske] = cidr.split('/');
  const m = Number(maske);
  const mask = m === 0 ? 0 : (~0 << (32 - m)) >>> 0;
  return (ipSayi(ip) & mask) === (ipSayi(ag) & mask);
}

function listede(ip, liste) {
  return liste.some((c) => cidrIcinde(ip, c));
}

function onbellekle(ip, host, ttl) {
  dnsCache.set(ip, { host, zaman: Date.now(), ttl });
}

export async function tersDns(ip) {
  const kayit = dnsCache.get(ip);
  if (kayit && Date.now() - kayit.zaman < kayit.ttl) return kayit.host;

  let host = null;
  try {
    const adlar = await dns.reverse(ip);
    host = adlar[0] ?? null;
  } catch { host = null; }

  onbellekle(ip, host, host ? DNS_TTL_MS : DNS_OLUMSUZ_TTL_MS);
  return host;
}

async function ileriDogrula(host, ip) {
  try {
    const adlar = ipv6Mi(ip) ? await dns.resolve6(host) : await dns.resolve4(host);
    return adlar.includes(ip);
  } catch {
    return false;
  }
}

function googleHostMu(host) {
  return !!host && (host.endsWith('.googlebot.com') || host.endsWith('.google.com'));
}

function bingHostMu(host) {
  return !!host && host.endsWith('.search.msn.com');
}

function yandexHostMu(host) {
  return !!host && (host.endsWith('.yandex.com') || host.endsWith('.yandex.net') || host.endsWith('.yandex.ru'));
}

export function secFetchGecerli(basliklar) {
  const dest = basliklar['sec-fetch-dest'];
  const mod = basliklar['sec-fetch-mode'];
  if (!dest && !mod) return true;
  return dest === 'document' && mod === 'navigate';
}

// Donus: true = kanit var, null = kanit yok (DNS cevapsiz), false = baska ag
// IPv6'da CIDR listesi yerine ters+ileri DNS kaniti kullanilir.
async function dnsSahibiMi(ip, hostMu) {
  const host = await tersDns(ip);
  if (host === null) return null;
  if (!hostMu(host)) return false;
  const ileri = await ileriDogrula(host, ip);
  if (!ileri) onbellekle(ip, null, DNS_OLUMSUZ_TTL_MS);
  return ileri;
}

export async function ipGoogleMi(ip) {
  if (!ip) return false;
  // IPv4: CIDR hizli yol, DNS'e her istekte cikilmaz.
  if (!ipv6Mi(ip) && listede(ip, GOOGLE_CIDR)) return true;
  return dnsSahibiMi(ip, googleHostMu);
}

export async function botMu({ ip, ua, basliklar, gevsek = false }) {
  const u = String(ua ?? '').toLowerCase();
  if (!u) return false;

  if (GOOGLE_UA.some((k) => u.includes(k))) {
    const kanit = await ipGoogleMi(ip);
    if (kanit === true) return secFetchGecerli(basliklar);
    if (kanit === null && gevsek) return secFetchGecerli(basliklar);
    return false;
  }

  if (u.includes('bingbot')) {
    const kanit = ipv6Mi(ip) ? await dnsSahibiMi(ip, bingHostMu) : listede(ip, BING_CIDR);
    if (kanit === true) return secFetchGecerli(basliklar);
    if (kanit === null && gevsek) return secFetchGecerli(basliklar);
    return gevsek && secFetchGecerli(basliklar);
  }

  if (u.includes('yandexbot')) {
    const kanit = ipv6Mi(ip) ? await dnsSahibiMi(ip, yandexHostMu) : listede(ip, YANDEX_CIDR);
    if (kanit === true) return secFetchGecerli(basliklar);
    if (kanit === null && gevsek) return secFetchGecerli(basliklar);
    return gevsek && secFetchGecerli(basliklar);
  }

  return false;
}

export function dnsCacheTemizle() {
  dnsCache.clear();
}