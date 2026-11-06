import { describe, it, expect, vi, beforeEach } from 'vitest';

const reverse = vi.fn();
const resolve4 = vi.fn();

vi.mock('node:dns', () => ({ promises: { reverse, resolve4 } }));

const { botMu, dnsCacheTemizle } = await import('../bot.mjs');

const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const IP = '66.249.66.1';

describe('dns onbellegi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T10:00:00Z'));
    dnsCacheTemizle();
    reverse.mockReset();
    resolve4.mockReset();
  });

  it('gecici DNS hatasi 60 sn sonra tekrar denenir', async () => {
    reverse.mockRejectedValueOnce(new Error('zaman asimi'));
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(false);

    reverse.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
    resolve4.mockResolvedValue([IP]);

    vi.setSystemTime(new Date('2026-11-06T10:00:30Z'));
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(false);

    vi.setSystemTime(new Date('2026-11-06T10:01:10Z'));
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(true);
  });

  it('olumlu sonuc 6 saat onbellekte kalir', async () => {
    reverse.mockResolvedValue(['crawl-66-249-66-1.googlebot.com']);
    resolve4.mockResolvedValue([IP]);
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(true);

    reverse.mockRejectedValue(new Error('artik cagrilmamali'));
    vi.setSystemTime(new Date('2026-11-06T15:59:00Z'));
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(true);
  });

  it('ileri DNS tutmazsa kisa onbellek', async () => {
    reverse.mockResolvedValue(['sahte.googlebot.com']);
    resolve4.mockResolvedValue(['9.9.9.9']);
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(false);

    reverse.mockResolvedValue(['sahte.googlebot.com']);
    resolve4.mockResolvedValue([IP]);
    vi.setSystemTime(new Date('2026-11-06T10:00:30Z'));
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(false);

    vi.setSystemTime(new Date('2026-11-06T10:01:10Z'));
    expect(await botMu({ ip: IP, ua: UA, basliklar: {} })).toBe(true);
  });
});