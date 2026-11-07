import { describe, it, expect } from 'vitest';
import { DIKEYLER, dikey } from '../dikey.mjs';
import { makaleUret } from '../article.mjs';

const ZORUNLU = [
  'ad', 'baslik', 'aciklama', 'ara', 'araEtiket', 'cta', 'ctaUst', 'sayacEtiket',
  'ustYedek', 'ustYedekCta', 'premiumBaslik', 'trendBaslik', 'ortaEtiket', 'bos',
  'paragraflar', 'uyarilar', 'footer', 'varsayilanTeklif', 'toastTip', 'toastEtiket',
  'yasakliKelimeler', 'makale',
];

const MAKALE_ZORUNLU = [
  'h1', 'baslik', 'aciklama', 'gorselAlt', 'giris', 'kriterH', 'kriterG', 'kriter',
  'tabloH', 'tabloG', 'kolon', 'tur', 'cevrim', 'sonKolon', 'kapanis', 'notH', 'notG',
  'not', 'nedirH', 'nedir', 'adimH', 'adim', 'adimSon', 'altH', 'alt', 'dikkatH',
  'dikkatG', 'dikkat', 'sssH', 'sss', 'bilgiH', 'bilgi', 'telif',
];

// Anahtar = preset, deger = o preset metninde BULUNMAMASI gereken diger dikey kelimeleri.
// Harf siniri sart: "maç" aksi hâlde "Amaç" icinde eslesir.
const CAPRAZ = {
  bonus: /(?<!\p{L})(şifresiz|maç|taraftarium24)/iu,
  'canli-mac': /(?<!\p{L})(bonus|çevrim|bahis)/iu,
};

function caprazMetin(d) {
  return JSON.stringify({ ...d, footer: '', yasakliKelimeler: [] });
}

describe('dikey presetleri', () => {
  for (const [ad, d] of Object.entries(DIKEYLER)) {
    it(`${ad}: zorunlu alanlar dolu`, () => {
      for (const k of ZORUNLU) expect(d[k], k).toBeTruthy();
      for (const k of MAKALE_ZORUNLU) expect(d.makale[k], `makale.${k}`).toBeTruthy();
      expect(d.ad).toBe(ad);
      expect(d.makale.kolon.length).toBe(5);
      expect(d.makale.gorselAlt.length).toBe(3);
      expect(d.makale.sss.every((x) => Array.isArray(x) && x.length === 2)).toBe(true);
      expect(['para', 'kisi']).toContain(d.toastTip);
      expect(d.makale.tur.length).toBeGreaterThan(0);
      expect(d.makale.cevrim.length).toBeGreaterThan(0);
    });

    it(`${ad}: diger dikeyin kelimesi karismamis`, () => {
      expect(caprazMetin(d)).not.toMatch(CAPRAZ[ad]);
    });
  }
});

describe('makaleUret', () => {
  const uret = (tohum) =>
    makaleUret({
      tohum,
      markalar: [{ ad: 'X', slug: 'x', teklif: 'HD' }],
      siteAdi: 'S',
      hubUrl: 'https://h',
    });

  it('aktif dikeyin h1 metnini kullanir', () => {
    const r = uret(7);
    expect(r.baslik).toBe(dikey.makale.baslik);
    expect(r.govde).toContain(`<h1>${dikey.makale.h1}</h1>`);
  });

  it('tablo kolon sayisi baslikla eslesir', () => {
    const r = uret(7);
    const kolon = (r.govde.match(/<th>/g) ?? []).length;
    const veri = (r.govde.match(/<tr><td>/g) ?? []).length;
    expect(kolon).toBe(dikey.makale.kolon.length);
    expect(veri).toBe(1);
  });

  it('ayni tohum ayni ciktiyi verir', () => {
    expect(uret(3).govde).toBe(uret(3).govde);
  });

  it('farkli tohum farkli ciktiyi verir', () => {
    expect(uret(3).govde).not.toBe(uret(4).govde);
  });
});