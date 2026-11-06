import { describe, it, expect } from 'vitest';
import { linkSec, linkBlokRender, AZAMI, AGIRLIK } from '../linkblock.mjs';
import { havuz } from './yardim.mjs';

const TAM = [...havuz(60, 'marka'), ...havuz(25, 'bolge'), ...havuz(10, 'isletme'), ...havuz(5, 'genel')];

function say(dizi) {
  const s = {};
  for (const x of dizi) s[x.tur] = (s[x.tur] ?? 0) + 1;
  return s;
}

describe('linkSec', () => {
  it('agirliklar sozlesmedeki gibi', () => {
    expect(AGIRLIK).toEqual({ marka: 60, bolge: 25, isletme: 10, genel: 5 });
  });

  it('azami siniri asmaz', () => {
    expect(linkSec(TAM, 100, 1).length).toBe(AZAMI);
  });

  it('ayni link iki kez gelmez', () => {
    const s = linkSec(TAM, AZAMI, 3).map((x) => x.hedef);
    expect(new Set(s).size).toBe(s.length);
  });

  it('ayni tohum ayni sonucu verir', () => {
    const a = linkSec(TAM, AZAMI, 7).map((x) => x.hedef);
    const b = linkSec(TAM, AZAMI, 7).map((x) => x.hedef);
    expect(a).toEqual(b);
  });

  it('slot dagilimi agirliklara yaklasir', () => {
    const toplam = {};
    for (let t = 0; t < 200; t++) {
      for (const [k, v] of Object.entries(say(linkSec(TAM, AZAMI, t)))) {
        toplam[k] = (toplam[k] ?? 0) + v;
      }
    }
    const n = 200 * AZAMI;
    expect(toplam.marka / n).toBeGreaterThan(0.55);
    expect(toplam.marka / n).toBeLessThan(0.65);
    expect(toplam.bolge / n).toBeGreaterThan(0.2);
    expect(toplam.bolge / n).toBeLessThan(0.3);
    expect(toplam.isletme / n).toBeGreaterThan(0.08);
    expect(toplam.genel / n).toBeGreaterThan(0.02);
  });

  it('kucuk havuzda pay diger turlere kayar', () => {
    const kucuk = [...havuz(10, 'marka'), ...havuz(10, 'bolge'), ...havuz(4, 'isletme'), ...havuz(1, 'genel')];
    const s = linkSec(kucuk, 25, 5);
    expect(s.length).toBe(25);
    expect(say(s).marka).toBe(10);
    expect(say(s).genel).toBe(1);
  });

  it('bos havuz bos doner', () => {
    expect(linkSec([], 10, 1)).toEqual([]);
  });
});

describe('linkBlokRender', () => {
  it('bos dizide bos string', () => {
    expect(linkBlokRender([])).toBe('');
    expect(linkBlokRender(null)).toBe('');
  });

  it('gizli blok ve rel follow uretir', () => {
    const html = linkBlokRender([{ anchor: 'a', hedef: 'https://a.com/' }]);
    expect(html).toContain('class="gizli-blok"');
    expect(html).toContain('rel="follow"');
  });

  it('html kacisi yapar', () => {
    const html = linkBlokRender([{ anchor: 'a<b>', hedef: 'https://a.com/?x=1&y=2' }]);
    expect(html).toContain('a&lt;b&gt;');
    expect(html).toContain('&amp;y=2');
  });
});