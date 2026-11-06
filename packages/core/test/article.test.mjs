import { describe, it, expect } from 'vitest';
import { besGram, ortusmeOrani, normalize, mulberry32, makaleUret } from '../article.mjs';

describe('normalize', () => {
  it('bosluk sadelestirir', () => {
    expect(normalize('a   b')).toBe('a b');
  });

  it('yuzde boslugunu kapatir', () => {
    expect(normalize('% 50')).toBe('%50');
  });
});

describe('besGram', () => {
  it('5 kelimelik pencereler uretir', () => {
    expect(besGram('a b c d e f').size).toBe(2);
  });

  it('kisa metinde bos kume', () => {
    expect(besGram('a b c').size).toBe(0);
  });

  it('noktalama grami bozmaz', () => {
    expect(besGram('a, b! c d e f').size).toBe(2);
  });
});

describe('ortusmeOrani', () => {
  it('ayni kume 1 doner', () => {
    const a = new Set(['x', 'y']);
    expect(ortusmeOrani(a, a)).toBe(1);
  });

  it('bos kume 0 doner', () => {
    expect(ortusmeOrani(new Set(), new Set(['x']))).toBe(0);
  });

  it('kismi ortusme orani verir', () => {
    expect(ortusmeOrani(new Set(['a', 'b']), new Set(['a', 'c']))).toBe(0.5);
  });
});

describe('mulberry32', () => {
  it('ayni tohum ayni diziyi verir', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('0 ile 1 arasinda kalir', () => {
    const r = mulberry32(9);
    for (let i = 0; i < 100; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('makaleUret', () => {
  const markalar = [
    { ad: 'Alfa', slug: 'alfa', teklif: '100 TL' },
    { ad: 'Beta', slug: 'beta', teklif: '200 TL' },
  ];

  it('ayni tohum ayni govdeyi verir', () => {
    const a = makaleUret({ tohum: 11, markalar, siteAdi: 'x', hubUrl: '' });
    const b = makaleUret({ tohum: 11, markalar, siteAdi: 'x', hubUrl: '' });
    expect(a.govde).toBe(b.govde);
  });

  it('gizli blok disinda dis alan adi yok', () => {
    const { govde } = makaleUret({ tohum: 11, markalar, siteAdi: 'x', hubUrl: '' });
    expect(govde).not.toContain('bunny.net');
    expect(govde).not.toContain('unsplash.com');
  });

  it('hubUrl bos iken goreli link uretir', () => {
    const { govde } = makaleUret({ tohum: 11, markalar, siteAdi: 'x', hubUrl: '' });
    expect(govde).toContain('href="/l/');
  });

  it('hubUrl dolu iken mutlak link uretir', () => {
    const { govde } = makaleUret({ tohum: 11, markalar, siteAdi: 'x', hubUrl: 'http://h:3002' });
    expect(govde).toContain('href="http://h:3002/l/');
  });

  it('amp yasak etiketleri yok', () => {
    const { govde } = makaleUret({ tohum: 5, markalar, siteAdi: 'x', hubUrl: '' });
    expect(govde).not.toContain('<script');
    expect(govde).not.toContain('<style');
  });
});