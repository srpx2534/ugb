import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sahte } = vi.hoisted(() => {
  const sahte = { reverse: vi.fn(), resolve4: vi.fn(), resolve6: vi.fn() };
  return { sahte };
});

vi.mock('node:dns', () => ({ promises: sahte }));

import { botMu, dnsCacheTemizle } from '../bot.mjs';
import { mobilMi } from '../device.mjs';

const BOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BING_UA = 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';
const YANDEX_UA = 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)';
const MASA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MOBIL = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

beforeEach(() => {
  dnsCacheTemizle();
  sahte.reverse.mockReset().mockRejectedValue(new Error('yok'));
  sahte.resolve4.mockReset().mockRejectedValue(new Error('yok'));
  sahte.resolve6.mockReset().mockRejectedValue(new Error('yok'));
});

describe('mobilMi', () => {
  it('masaustu false', () => {
    expect(mobilMi(MASA)).toBe(false);
  });

  it('android true', () => {
    expect(mobilMi(MOBIL)).toBe(true);
  });

  it('iphone true', () => {
    expect(mobilMi('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
  });

  it('ipad true', () => {
    expect(mobilMi('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe(true);
  });

  it('bos false', () => {
    expect(mobilMi('')).toBe(false);
  });

  it('tanimsiz false', () => {
    expect(mobilMi('curl/8.0')).toBe(false);
  });
});

describe('botMu', () => {
  it('bos UA false', async () => {
    expect(await botMu({ ip: '66.249.66.1', ua: '', basliklar: {} })).toBe(false);
  });

  it('normal tarayici false', async () => {
    expect(await botMu({ ip: '66.249.66.1', ua: MASA, basliklar: {} })).toBe(false);
  });

  it('curl false', async () => {
    expect(await botMu({ ip: '66.249.66.1', ua: 'curl/8.0', basliklar: {} })).toBe(false);
  });

  it('bingbot dogru CIDR true', async () => {
    expect(await botMu({ ip: '40.77.167.10', ua: BING_UA, basliklar: {} })).toBe(true);
  });

  it('bingbot yanlis IP false', async () => {
    expect(await botMu({ ip: '1.2.3.4', ua: BING_UA, basliklar: {} })).toBe(false);
  });

  it('yandexbot dogru CIDR true', async () => {
    expect(await botMu({ ip: '5.255.253.10', ua: YANDEX_UA, basliklar: {} })).toBe(true);
  });

  it('yandexbot yanlis IP false', async () => {
    expect(await botMu({ ip: '1.2.3.4', ua: YANDEX_UA, basliklar: {} })).toBe(false);
  });

  it('googlebot dogru CIDR true ve DNS e cikmaz', async () => {
    expect(await botMu({ ip: '66.249.66.1', ua: BOT_UA, basliklar: {} })).toBe(true);
    expect(sahte.reverse).not.toHaveBeenCalled();
  });

  it('googlebot UA ama CIDR disi IP false', async () => {
    expect(await botMu({ ip: '1.2.3.4', ua: BOT_UA, basliklar: {} })).toBe(false);
  });

  it('googlebot UA ve bos IP false', async () => {
    expect(await botMu({ ip: '', ua: BOT_UA, basliklar: {} })).toBe(false);
  });

  it('googlebot UA ipv6 cozulemezse false', async () => {
    expect(await botMu({ ip: '2a00:1450::1', ua: BOT_UA, basliklar: {} })).toBe(false);
  });

  it('CIDR disi, DNS cevapsiz, gevsek kapali false', async () => {
    expect(await botMu({ ip: '1.2.3.4', ua: BOT_UA, basliklar: {}, gevsek: false })).toBe(false);
  });

  it('CIDR disi, DNS cevapsiz, gevsek acik true', async () => {
    expect(await botMu({ ip: '1.2.3.4', ua: BOT_UA, basliklar: {}, gevsek: true })).toBe(true);
  });

  it('CIDR disi ama PTR googlebot ve ileri dogrulama tutuyor true', async () => {
    sahte.reverse.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
    sahte.resolve4.mockResolvedValue(['1.2.3.4']);
    expect(await botMu({ ip: '1.2.3.4', ua: BOT_UA, basliklar: {}, gevsek: false })).toBe(true);
  });

  it('CIDR disi, PTR googlebot ama ileri dogrulama tutmuyor false', async () => {
    sahte.reverse.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
    sahte.resolve4.mockResolvedValue(['9.9.9.9']);
    expect(await botMu({ ip: '1.2.3.4', ua: BOT_UA, basliklar: {}, gevsek: false })).toBe(false);
  });

  it('CIDR disi, PTR baska alan false', async () => {
    sahte.reverse.mockResolvedValue(['bot.kotu-site.com']);
    expect(await botMu({ ip: '1.2.3.4', ua: BOT_UA, basliklar: {}, gevsek: false })).toBe(false);
  });

  it('sec-fetch image ise bot degil', async () => {
    expect(await botMu({ ip: '66.249.66.1', ua: BOT_UA, basliklar: { 'sec-fetch-dest': 'image', 'sec-fetch-mode': 'no-cors' } })).toBe(false);
  });
});