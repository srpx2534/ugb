import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sahteEnv, sahteQ } = vi.hoisted(() => ({
  sahteEnv: {
    CRAWL_LOG: '1',
    CRAWL_LOG_ORNEK: 1,
    CRAWL_LOG_TOPLU: 1000,
    CRAWL_LOG_ARALIK_MS: 10,
    CRAWL_LOG_KUYRUK: 1000,
    CRAWL_LOG_SAKLAMA_GUN: 7,
  },
  sahteQ: vi.fn(),
}));

vi.mock('../config.mjs', () => ({ env: sahteEnv }));
vi.mock('../db.mjs', () => ({ q: sahteQ }));
vi.mock('../log.mjs', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

let mod;

const kayit = (ek = {}) => ({
  domain_id: 1,
  ip: '1.1.1.1',
  ua: 'ua',
  yol: '/',
  durum: 200,
  bot: 0,
  mobil: 0,
  ...ek,
});

const mesgulHata = () => Object.assign(new Error('veritabani mesgul'), { mesgul: true });

beforeEach(async () => {
  Object.assign(sahteEnv, {
    CRAWL_LOG: '1',
    CRAWL_LOG_ORNEK: 1,
    CRAWL_LOG_TOPLU: 1000,
    CRAWL_LOG_KUYRUK: 1000,
  });
  sahteQ.mockReset();
  sahteQ.mockResolvedValue({ affectedRows: 0 });
  vi.resetModules();
  mod = await import('../crawllog.mjs');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ornekleme', () => {
  it('ORNEK=1 iken her kayit gecer', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    mod.crawlLogEkle(kayit());
    mod.crawlLogEkle(kayit());
    expect(mod.crawlLogDurum().kuyruk).toBe(2);
  });

  it('ORNEK=10 iken siradan trafik orana gore elenir', () => {
    sahteEnv.CRAWL_LOG_ORNEK = 10;

    vi.spyOn(Math, 'random').mockReturnValue(0.5); // 0.5 * 10 = 5, esik 1
    mod.crawlLogEkle(kayit());
    expect(mod.crawlLogDurum().kuyruk).toBe(0);

    vi.spyOn(Math, 'random').mockReturnValue(0.05); // 0.05 * 10 = 0.5, gecer
    mod.crawlLogEkle(kayit());
    expect(mod.crawlLogDurum().kuyruk).toBe(1);
  });

  it('bot, hata ve /l/ kayitlari orneklemeden muaf', () => {
    sahteEnv.CRAWL_LOG_ORNEK = 100;
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    mod.crawlLogEkle(kayit({ bot: 1 }));
    mod.crawlLogEkle(kayit({ durum: 404 }));
    mod.crawlLogEkle(kayit({ yol: '/l/marka' }));

    expect(mod.crawlLogDurum().kuyruk).toBe(3);
  });

  it('CRAWL_LOG=0 iken hic kayit alinmaz', () => {
    sahteEnv.CRAWL_LOG = '0';
    mod.crawlLogEkle(kayit({ bot: 1 }));
    expect(mod.crawlLogDurum().kuyruk).toBe(0);
  });
});

describe('kuyruk tavani', () => {
  it('tavan asilinca en eski kayit dusurulur ve sayilir', () => {
    sahteEnv.CRAWL_LOG_KUYRUK = 3;

    for (let i = 1; i <= 5; i++) mod.crawlLogEkle(kayit({ ip: `10.0.0.${i}` }));

    const d = mod.crawlLogDurum();
    expect(d.kuyruk).toBe(3);
    expect(d.atilan).toBe(2);
  });

  it('tavan doluyken yeni kayit yine de kabul edilir', () => {
    sahteEnv.CRAWL_LOG_KUYRUK = 2;

    mod.crawlLogEkle(kayit({ ip: '10.0.0.1' }));
    mod.crawlLogEkle(kayit({ ip: '10.0.0.2' }));
    mod.crawlLogEkle(kayit({ ip: '10.0.0.3' }));

    expect(mod.crawlLogDurum().kuyruk).toBe(2);
  });
});

describe('toplu yazim', () => {
  it('parti tavanina ulasinca tek INSERT ile yazar', async () => {
    sahteEnv.CRAWL_LOG_TOPLU = 3;

    for (let i = 1; i <= 3; i++) mod.crawlLogEkle(kayit({ ip: `10.0.0.${i}` }));

    await vi.waitFor(() => expect(sahteQ).toHaveBeenCalledTimes(1));

    const [sql, degerler] = sahteQ.mock.calls[0];
    expect(sql).toContain('INSERT INTO crawl_log');
    expect(sql.match(/\(\?,\?,\?,\?,\?,\?,\?\)/g)).toHaveLength(3);
    expect(degerler).toHaveLength(21);

    await vi.waitFor(() => expect(mod.crawlLogDurum().yazilan).toBe(3));
    expect(mod.crawlLogDurum().kuyruk).toBe(0);
  });

  it('sutun sirasi sema ile ayni', async () => {
    sahteEnv.CRAWL_LOG_TOPLU = 1;

    mod.crawlLogEkle(kayit({ domain_id: 7, ip: '9.9.9.9', ua: 'UA', yol: '/yol', durum: 404, bot: 1, mobil: 1 }));

    await vi.waitFor(() => expect(sahteQ).toHaveBeenCalledTimes(1));
    expect(sahteQ.mock.calls[0][1]).toEqual([7, '9.9.9.9', 'UA', '/yol', 404, 1, 1]);
  });
});

describe('hata davranisi', () => {
  it('mesgul hatasinda parti geri kuyruga konur, sonra yazilir', async () => {
    sahteEnv.CRAWL_LOG_TOPLU = 2;

    sahteQ.mockRejectedValueOnce(mesgulHata()).mockResolvedValueOnce({ affectedRows: 2 });

    mod.crawlLogEkle(kayit({ ip: '10.0.0.1' }));
    mod.crawlLogEkle(kayit({ ip: '10.0.0.2' }));

    await vi.waitFor(() => expect(mod.crawlLogDurum().yazilan).toBe(2));

    const d = mod.crawlLogDurum();
    expect(d.hata).toBe(1);
    expect(d.atilan).toBe(0);
    expect(d.kuyruk).toBe(0);
    expect(sahteQ).toHaveBeenCalledTimes(2);
  });

  it('kalici hatada parti atilir, kuyruk tikkanmaz', async () => {
    sahteEnv.CRAWL_LOG_TOPLU = 2;

    sahteQ.mockRejectedValue(new Error('bilinmeyen sutun'));

    mod.crawlLogEkle(kayit({ ip: '10.0.0.1' }));
    mod.crawlLogEkle(kayit({ ip: '10.0.0.2' }));

    await vi.waitFor(() => expect(mod.crawlLogDurum().hata).toBe(1));

    const d = mod.crawlLogDurum();
    expect(d.atilan).toBe(2);
    expect(d.kuyruk).toBe(0);
    expect(d.sonHata).toContain('bilinmeyen sutun');
  });

  it('mesgul hatasi kuyrugu tavanin ustune cikarirsa parti atilir', async () => {
    sahteEnv.CRAWL_LOG_TOPLU = 2;
    sahteEnv.CRAWL_LOG_KUYRUK = 2;

    sahteQ.mockRejectedValue(mesgulHata());

    mod.crawlLogEkle(kayit());
    mod.crawlLogEkle(kayit());

    await vi.waitFor(() => expect(mod.crawlLogDurum().atilan).toBeGreaterThan(0));
    expect(mod.crawlLogDurum().atilan).toBe(2);
  });
});