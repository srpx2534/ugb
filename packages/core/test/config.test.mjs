import { describe, it, expect } from 'vitest';
import { hostGecerli, hostNormalize, slugGecerli, ipGecerli } from '../config.mjs';

describe('hostNormalize', () => {
  it('kucuk harfe cevirir', () => {
    expect(hostNormalize('HEFDA.COM')).toBe('hefda.com');
  });

  it('portu atar', () => {
    expect(hostNormalize('a.com:3001')).toBe('a.com');
  });

  it('www atar', () => {
    expect(hostNormalize('www.a.com')).toBe('a.com');
  });

  it('sondaki noktayi atar', () => {
    expect(hostNormalize('a.com.')).toBe('a.com');
  });
});

describe('hostGecerli', () => {
  it('normal host gecerli', () => {
    expect(hostGecerli('hedefa.com')).toBe(true);
  });

  it('ip gecerli', () => {
    expect(hostGecerli('127.0.0.1')).toBe(true);
  });

  it('tek etiket gecersiz', () => {
    expect(hostGecerli('localhost')).toBe(false);
  });

  it('bos gecersiz', () => {
    expect(hostGecerli('')).toBe(false);
  });

  it('tire ile baslayan etiket gecersiz', () => {
    expect(hostGecerli('-a.com')).toBe(false);
  });
});

describe('slugGecerli', () => {
  it('normal slug gecerli', () => {
    expect(slugGecerli('ultrabet')).toBe(true);
  });

  it('tire kabul', () => {
    expect(slugGecerli('a-b')).toBe(true);
  });

  it('buyuk harf gecersiz', () => {
    expect(slugGecerli('Ultrabet')).toBe(false);
  });

  it('bastaki tire gecersiz', () => {
    expect(slugGecerli('-a')).toBe(false);
  });
});

describe('ipGecerli', () => {
  it('ipv4 gecerli', () => {
    expect(ipGecerli('1.2.3.4')).toBe(true);
  });

  it('255 ustu gecersiz', () => {
    expect(ipGecerli('1.2.3.999')).toBe(false);
  });

  it('ipv6 sekli gecerli', () => {
    expect(ipGecerli('2a00:1450::1')).toBe(true);
  });
});