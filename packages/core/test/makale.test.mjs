import { describe, it, expect, vi, beforeEach } from 'vitest';

// Sahte baglanti: yalniz makale/gram yazimi icin gereken SQL bicimlerini bilir.
const { h } = vi.hoisted(() => {
  const makaleler = new Map();
  const gramlar = new Map();
  let sonId = 0;

  const bag = {
    async execute(sql, params = {}) {
      const s = String(sql).replace(/\s+/g, ' ').trim();

      if (s.startsWith('INSERT INTO articles')) {
        if (makaleler.has(params.d)) {
          return [{ affectedRows: 0, insertId: makaleler.get(params.d).id }];
        }
        sonId += 1;
        makaleler.set(params.d, {
          id: sonId,
          domain_id: params.d,
          seed: params.seed,
          baslik: params.b,
          aciklama: params.a,
          govde: params.g,
        });
        return [{ affectedRows: 1, insertId: sonId }];
      }

      if (s.startsWith('SELECT id, seed, baslik')) {
        const d = Array.isArray(params) ? params[0] : params.d;
        const k = makaleler.get(d);
        return [k ? [k] : []];
      }

      if (s.startsWith('INSERT IGNORE INTO article_grams')) {
        const set = gramlar.get(params.a) ?? new Set();
        set.add(params.g);
        gramlar.set(params.a, set);
        return [{ affectedRows: 1 }];
      }

      if (s.startsWith('UPDATE articles')) return [{ affectedRows: 1 }];

      if (s.startsWith('DELETE FROM article_grams')) {
        gramlar.delete(params[0]);
        return [{ affectedRows: 1 }];
      }

      throw new Error(`beklenmeyen sql: ${s}`);
    },
  };

  return { h: { makaleler, gramlar, bag } };
});

vi.mock('../db.mjs', () => ({
  q: async () => [],
  one: async (_sql, p) => h.makaleler.get(Array.isArray(p) ? p[0] : p) ?? null,
  ins: async () => 0,
  tx: async (fn) => fn(h.bag),
}));

vi.mock('../log.mjs', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const { makaleAl } = await import('../makale.mjs');

const domain = { id: 1, host: 'a.com', seed: 42, kume_id: null };
const cagri = () => makaleAl({ domain, markalar: [], siteAdi: 'X', hubUrl: '' });

beforeEach(() => {
  h.makaleler.clear();
  h.gramlar.clear();
});

describe('eszamanli uretim', () => {
  it('iki paralel istek tek satir birakir', async () => {
    await Promise.all([cagri(), cagri()]);
    expect(h.makaleler.size).toBe(1);
  });

  it('gramlar yalniz kazanan icin ve bir kez yazilir', async () => {
    await Promise.all([cagri(), cagri()]);

    const id = [...h.makaleler.values()][0].id;
    expect(h.gramlar.size).toBe(1);
    expect(h.gramlar.get(id).size).toBeGreaterThan(10);
  });

  it('kaybeden istek kazananin metnini doner', async () => {
    const [a, b] = await Promise.all([cagri(), cagri()]);
    expect(a.govde).toBe(b.govde);
    expect(a.baslik).toBe(b.baslik);
  });
});

describe('mevcut kayit', () => {
  it('aciklama doluysa yeniden uretilmez', async () => {
    h.makaleler.set(1, { id: 9, domain_id: 1, seed: 1, baslik: 'B', aciklama: 'A', govde: 'G' });
    const r = await cagri();
    expect(r).toEqual({ baslik: 'B', aciklama: 'A', govde: 'G' });
  });

  it('aciklama bossa onarilir ve gramlar yenilenir', async () => {
    h.makaleler.set(1, { id: 9, domain_id: 1, seed: 1, baslik: 'B', aciklama: '', govde: 'G' });
    h.gramlar.set(9, new Set(['eski']));

    const r = await cagri();
    expect(r.aciklama.length).toBeGreaterThan(0);
    expect(h.gramlar.get(9).has('eski')).toBe(false);
    expect(h.gramlar.get(9).size).toBeGreaterThan(10);
  });
});