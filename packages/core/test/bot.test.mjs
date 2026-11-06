import { describe, it, expect } from 'vitest';
import { secFetchGecerli, ipGoogleMi } from '../bot.mjs';

describe('secFetchGecerli', () => {
  it('baslik yoksa gecerli sayar', () => {
    expect(secFetchGecerli({})).toBe(true);
  });

  it('document + navigate gecerli', () => {
    expect(secFetchGecerli({ 'sec-fetch-dest': 'document', 'sec-fetch-mode': 'navigate' })).toBe(true);
  });

  it('image dalini reddeder', () => {
    expect(secFetchGecerli({ 'sec-fetch-dest': 'image', 'sec-fetch-mode': 'no-cors' })).toBe(false);
  });

  it('dest var mode yok ise reddeder', () => {
    expect(secFetchGecerli({ 'sec-fetch-dest': 'document' })).toBe(false);
  });
});

describe('ipGoogleMi', () => {
  it('bos ip false', async () => {
    expect(await ipGoogleMi('')).toBe(false);
  });

  it('ipv6 false', async () => {
    expect(await ipGoogleMi('2a00:1450:4001::200e')).toBe(false);
  });
});