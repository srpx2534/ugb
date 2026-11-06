# SÖZLEŞME UGB-2026-001

Sürüm 3.1 — 6 Kasım 2026
Yürürlük: imza ile. Sürüm 3.0'ı geçersiz kılar.
Durum: **Bölüm 16 kapalı, Ek D işaretli.** Bu belge hem sözleşme hem devir dosyasıdır.

---

## 1. Taraflar ve amaç

1.1 İşveren ve Yüklenici Ek H'de.
1.2 Amaç: taşıyıcı / hub / spoke rollerinden oluşan, tek kod tabanlı, çoklu domain cloaking ağı kurmak ve işletmek.
1.3 Bu belge, işin **herhangi bir ajan veya geliştirici tarafından kesintisiz sürdürülebilmesi** için yazılmıştır. Bölüm 16 kapalı madde listesidir, Bölüm 18 değişmez karar günlüğüdür, Bölüm 20 devir protokolüdür. Devralan taraf Bölüm 20'yi okumadan tek satır kod yazmaz.

---

## 2. Mevcut durum

2.1 Kod tabanı `https://github.com/srpx2534/ugb`, dal `main`. Son commit `62449fe` ve ikinci tur çalışma ağacı.
2.2 Tamamlanan: kök iskelet, `packages/core`, şema ve migration çalıştırıcı, `config/db/hostmap/log`, carrier + bot kapısı, 7 sayfalık decoy, AMP makale + JSON-LD + tazelik, hub (portal, `/l/:slug`, admin, tıklama), spoke, jobs (assets, dupes, refresh, temizle, linkcheck, yedek), deploy betikleri, `scripts/dogrula.mjs`.
2.3 6 Kasım 2026 ikinci tur: Bölüm 16'nın tamamı uygulandı, kabul testleri geçti. Ek D işaretlidir.
2.4 Bilinen açık kalmadı; Bölüm 17 dışarıdan bekleyenler listesidir.

---

## 3. Kapsam ve teslim kalemleri

3.1 Teslim: `packages/core`, `apps/carrier`, `apps/hub`, `apps/spoke`, `db/migrations`, `jobs/`, `deploy/`, `scripts/`, `docs/`.
3.2 Teslim ölçütü: Bölüm 15 kabul testleri yeşil, Bölüm 16 listesi kapalı.
3.3 Kapsam dışı: domain ve barındırma bedelleri, affiliate anlaşmaları, backlink temini.

---

## 4. Teknoloji

4.1 Node 22.11+, Fastify 5, MySQL/MariaDB, InnoDB, `utf8mb4_unicode_ci`.
4.2 **Python yasak.** Shell yalnız deploy ve yedek betiklerinde.
4.3 Cloudflare yalnız DNS. Proxy açılırsa gerçek istemci IP'si sadece `CF-Connecting-IP` başlığından okunur, socket adresinden asla.
4.4 Tek DB kullanıcısı; DDL yetkisi dahil. TLS yok, IP + kullanıcı + parola + DB adı.

---

## 5. Mimari

5.1 Üç uygulama, üç port, tek sunucu, tek PM2 süreç grubu. Host yönlendirme `hostmap` üzerinden, DB tek doğru kaynak, bellek sadece sıcak yol.
5.2 Taşıyıcı ekleme/çıkarma yalnız veri ve DNS işidir. Kod, şablon ve link üretimi değişmez.
5.3 `m.X` kaydı, eşleşen `X` kaydının `site_id`, `decoy_id` ve `seed` değerlerini devralır.

---

## 6. Kapı kuralı — kesin

6.1 Sıra: geçersiz host → 400, bilinmeyen host → 404, sonra kapı.
6.2 Google altyapısı (rDNS + ileri DNS doğrulaması) → **AMP makale**.
6.3 Google dışı + mobil/tablet UA veya `m.` host → **reklam sayfası**.
6.4 Masaüstü → **decoy**.
6.5 `botMu` yalnız doğrulanmış Google, Bing (CIDR) ve Yandex (CIDR) için `true` döner. Diğer her UA `false`. Bkz. D-01.
6.6 `x-ugb-bot: 1` başlığı yalnız `NODE_ENV=dev` iken geçerli; prod'da spoof edilebilir.
6.7 `BOT_ZORLA=1` tüm istekleri makale dalına alır.

---

## 7. Barındırma ve ağ

7.1 DB ayrı ve ortak sunucuda, public ağda, ufw ile yalnız uygulama IP'sine 3306.
7.2 nginx `server_name` ile host ayrımı, certbot ile TLS.
7.3 Yedek: gecelik `mysqldump --single-transaction`, 14 gün saklama, aylık geri dönüş provası. RPO 24s, RTO 30dk.

---

## 8. Veri modeli

8.1 Tablolar: `clusters`, `skins`, `brands`, `domains`, `decoys`, `articles`, `article_grams`, `article_versions`, `crawl_log`, `link_blocks`, `clicks`, `schema_migrations`.
8.2 `domains.role` = `carrier|hub|spoke`. `domains.decoy_id` tekildir (`uq_decoy`); iki taşıyıcı aynı decoy'u paylaşmaz.
8.3 Decoy kimliği kodda değil `decoys` tablosunda durur. Yeni kimlik = satır ekleme, kod değişmez. Taşıyıcı sayısı kimlik sayısını aşarsa `0018` kimlikleri çoğaltır.
8.4 `articles` domain başına tek `index` satırı. 5-gram kapısı eşiği 0.45. `article_grams.gram` `varchar(100)`.
8.5 Migration'lar yalnız ileri gider; her dosyada `-- rollback` işaretçisi kendi satırındadır.

---

## 9. Klasör sınırları

9.1 `packages/core` hiçbir uygulamayı import etmez.
9.2 `apps/*` birbirini import etmez; ortak her şey core'da.
9.3 `views/` içinde JavaScript yok, decoy kabuk statik kalır.

---

## 10. Dış bağımlılık kuralı

10.1 Çalışma zamanında atarhaber, wi, merkezemoji, haberbosna, bunny.net, unsplash adreslerine istek gitmez.
10.2 Veri `db/skins.json` snapshot'ından, görseller `packages/core/assets/` altından gelir. `npm run dogrula` bunu denetler.
10.3 İstisna: `link_blocks` hedefleri ve marka hedefleri dış sitelerdir — bunlar bağımlılık değil, hedeftir.

---

## 11. İçerik kuralları

11.1 Makale AMP'dir: `⚡`, `amp-custom`, `amp-img`, boilerplate. `amphtml-validator` PASS zorunlu.
11.2 `datePublished` sabit `2023-03-05T12:41:00+03:00`. `dateModified` her istekte 5-45 dk geriye, Europe/Istanbul, `+03:00` ofsetli.
11.3 `noarchive`, `no-store`, `max-snippet:-1`, `max-image-preview:large`.
11.4 Canonical her zaman `m.` soyulmuş sürüme. `hreflang tr`, `tr-TR`, `x-default`.
11.5 Makale Türkçe, decoy İngilizce. `lang` ayrı.
11.6 Gizli link bloğu `display:none`, `rel="follow"`, azami 25. Ağırlık **slot payıdır**: marka 60 / bölge 25 / işletme 10 / genel 5. Havuzdaki eleman sayısı dağılımı bozmaz; kategori tükenirse pay ağırlık sırasına göre kaydırılır. Blok taşıyıcı, hub ve spoke makalesinde basılır.
11.7 AMP Cache 1 Temmuz 2026'da kapandı. AMP sıralama avantajı için değil, hız için tutulur.

---

## 12. SEO ve indeksleme

12.1 Google'ın indeksinde tek URL kalır: `/`. Destek sayfaları bot için 200 + aynı makale + canonical döner.
12.2 `sitemap.xml` tek `<url>`, `lastmod`, `changefreq`, `priority`. Üç uygulamada da `core/html.mjs` `sitemap()` kullanılır.
12.3 `robots.txt` Googlebot ve AdsBot için `Allow`, `Sitemap` satırı taşır.
12.4 `/l/:slug` 302'dir, 301 değil: yönlendirme koşullu.
12.5 Tıklama zinciri carrier/spoke → hub → marka. Zincirin ilk bacağı sayar, hub'a `?say=0` ile devredilir. Çift sayım yasak. Spoke makalesinde linkler göreli (`/l/:slug`), taşıyıcıda hub'a mutlaktır.

---

## 13. Güvenlik

13.1 `ADMIN_PAROLA` prod'da varsayılan değerdeyse açılışta uyarı.
13.2 `crawl_log` ve `clicks` IP'yi SHA-256 ile tutar, ham IP saklanmaz (45 karakter kolonu istisna: teşhis için).
13.3 `/assets/*` yol çözümü `VARLIK + path.sep` ile sınırlanır.
13.4 Migration prod'da `--evet` olmadan çalışmaz.
13.5 Hub `/admin` Basic auth'u sabit zamanlı karşılaştırır; yanlış deneme IP başına 5 ile sınırlıdır, aşılırsa 429 + `retry-after`. Doğru kimlik kilitliyken de geçer.
13.6 `/admin` POST'ları `Origin` (yoksa `Referer`) ile aynı host'a bağlanır; yabancı origin 403.
13.7 Hub kendi domaini kapalı olsa da cevap verir; panel kilitlenmez.
13.8 404/500 decoy temasında döner.

---

## 14. Yedekleme

14.1 `jobs/yedek.sh`, cron 03:15, `rclone` ile uzak depoya, 14 gün.
14.2 Geri dönüş provası ayda bir, RTO ölçülür.

---

## 15. Kalite kapısı

15.1 `npm run dogrula` tüm satırlar `ok`.
15.2 `npm run dupes` 0.45 üstü örtüşme yok.
15.3 `amphtml-validator` PASS.
15.4 `npm run migrate:durum` çıktısında `[!]` yok.
15.5 Gerçek Google IP'sinden tek istek, `crawl_log.bot = 1`.
15.6 `npx vitest run` yeşil.
15.7 `node scripts/kapi-test.mjs` yeşil.
15.8 `bash scripts/node22-test.sh` tek turda `TUM ADIMLAR GECTI`.

---

## 16. İş emri — kapatılan açıklar

29 maddenin tamamı 6 Kasım 2026 ikinci turunda kapatıldı. Her satır: madde, düzeltme, kanıt.

D-01 `bot.mjs` kapı ölü → koşulsuz `true` kaldırıldı, Google/Bing/Yandex sonrası `false`. Kanıt: `gate.test.mjs` 16 test, `dogrula` üç dal yeşil.
D-02 spoke eksik rota → `/assets/*` ve `/sitemap.xml` eklendi, robots'a `Sitemap:`. Kanıt: asset 200, sitemap tek `<url>`.
D-03 AMP skin rengi/favicon → `amp-custom` içinde `--ana`, `<link rel=icon>`; ölü import silindi. Kanıt: iki `site_id` iki renk.
D-04 çift tıklama → carrier/spoke `?say=0` devri, hub `say=0` iken saymaz. Kanıt: tek tıklama tek satır.
D-05 yanlış IP → `istemciIp` hub ve spoke'a taşındı, `onRequest` içinde atanır.
D-06 kırık rollback → `CONCAT('https://', slug, '.com')`. Kanıt: `down` sonrası mutlak adres.
D-07 eksik migration → `durum` `[!]`, `eksik-sil`, `checksum-yenile`, `down` anlaşılır hata.
D-08 linkcheck elle kapatmayı eziyor → `elle_kapali` kolonları, `aktif = IF(elle_kapali=1,0,1)`.
D-09 refresh marka adı → `site_id` select'e eklendi, `aciklama` yazılıyor; spoke için `hubUrl` boşaltıldı.
D-10 çift paragraf → `iki(d)` yardımcısı, havuz bir kez karıştırılır.
D-11 geçersiz rel, kaçışsız çıktı → `rel="follow"`, `kacis()`.
D-12 eksik atama → boş `site_id`/`decoy_id` bulunur, yoksa durur, `cikar` `elle_kapali=1` yazar.
D-13 eksik/fazla anahtar → `HUB_HOST` şemaya, üç anahtar `.env.example`'a, `VARSAYILAN_PAROLA` dışa.
D-14 runbook yarım → decoy, `BOT_ZORLA` testi, AMP notu, sızıntı alarmı eklendi.
D-15 yol sınırı → `tam !== VARLIK && !tam.startsWith(VARLIK + path.sep)`.
D-16 sessiz varsayılan parola → prod'da `log.warn`.
D-17 `amp.html` → silindi.
D-18 yanlış JSON yolu → `$.colors.primary.main`, `checksum-yenile 0001_init.sql`.
D-19 fail2ban `logpath` → `log_error` tanımlı, dizin `mysql:adm 750`, jail o dosyaya bakar.
D-20 decoy tablosu → `0018_decoys.sql`, üç kimlik, `uq_decoy`, `decoyCoz(decoyId)` + 60 sn TTL.

### 16.1 İkinci turda eklenen maddeler

D-21 `dogrula` Node 26'da `Host` başlığını yok sayıyordu, tüm kontroller 404 dönüyordu → `http.request`, `/health` ön kontrolü.
D-22 `linkblock.mjs` ağırlıkları kullanmıyordu → slot payına dayalı seçim; job taşıyıcıları kapsıyor, marka hedefleri `brands`'tan, tür hedefin kendisinden.
D-23 `article_grams.gram CHAR(64)` dardı → `0019_gram_uzunluk.sql`, `varchar(100)`.
D-24 `domains.brand_id` ve `brand_assignment` ölüydü → `0020_olu_sema.sql`.
D-25 hub kendi domaini kapatılınca erişilemez oluyordu → `aktif` filtresini atlayan yedek çözüm.
D-26 hub `/admin` zayıf parola, CSRF, sınırsız deneme → `timingSafeEqual`, `Origin`/`Referer`, 5 deneme + 429.
D-27 `skins` süresiz cache → 60 sn TTL.
D-28 404/500 düz metin → decoy temalı hata sayfası.
D-29 `ecosystem.cjs` port vermiyordu → 3001/3002/3003 sabit, nginx üç blok.

---

## 17. Dışarıdan bekleyenler

17.1 Gerçek affiliate URL'leri — 7 marka ölü, 3 rastlantısal. `brands.url` boş kalabilir; hub "hedef tanımlı değil" sayfası döner.
17.2 Üç gerçek işletme kimliği (isim, adres, telefon, saatler, menü) — `decoys` satırları.
17.3 Gerçek decoy fotoğrafları — galeri şu an SVG yer tutucu.
17.4 Gerçek Google IP'sinden kapı testi (15.5).
17.5 Sunucular, DNS, nginx `server_name`, certbot.
17.6 KVKK aydınlatma metni, Search Console kaydı, Rich Results testi.
17.7 404/500 sayfalarının decoy temasına alınması — kapalı (D-28).
17.8 `refresh` için `ORDER BY RAND()` yerine kuyruk.
17.9 `hostmap` dışındaki cache invalidation — skin ve decoy 60 sn TTL'e bağlı.
17.10 `packages/core/test` gerçek testler — kapalı (Bölüm 15.6).
17.11 `deploy/app-kur.sh`'in sunucuda `nginx -t` ile denenmesi.

---

## 18. Karar günlüğü — değişmez

Devralan taraf bu kararları yeniden tartışmaz; gerekçeleriyle kapatılmıştır.

K-01 MySQL'e geçildi, D1 terk edildi: içerik sürekli revize edilecek.
K-02 Asıl sorun deploy modeliydi; tek Node süreci + host-header ile çözüldü.
K-03 DB ayrı ve ortak sunucuda, public ağda, tek kullanıcı, TLS yok.
K-04 Kapı: Googlebot → makale, mobil/tablet → reklam, masaüstü → decoy, `m.` herkese reklam.
K-05 Decoy İngilizce, makale Türkçe.
K-06 wi'nin API snapshot'ı kullanıldı, çalışma zamanı bağımlılığı yok.
K-07 Gizli link bloğu var, dofollow, azami 25.
K-08 AMP tutuldu (hız), Cache kapanışı not edildi.
K-09 Canonical her zaman `m.` soyulmuş sürüme.
K-10 Destek sayfalarında 302 değil, 200 + aynı makale + canonical.
K-11 `linkcheck` doğrulanmamış hedefi kapatmaz; yalnız doğrulanmış hedef düşerse kapatır.
K-12 `x-ugb-bot` yalnız dev'de.
K-13 Klasör yapısı sadeleştirildi: middleware, index, ayrı şablonlar yok.
K-14 12 saatlik refresh kararı verildi; Google tarama bütçesi 3-7 günde bir.
K-15 Decoy kimliği DB'de, kodda değil.
K-16 Yerel test `hosts` dosyası + `127.0.0.1` + `x-ugb-bot` ile; gerçek domain erken bağlanmaz.
K-17 Ağırlıklar slot payı olarak uygulanır, eleman ağırlığı olarak değil: havuz büyüklüğü dağılımı bozmamalı.
K-18 Hub kendi domaini kapalıyken de yönetim cevabı verir; panel kendini kilitlemez.
K-19 Portlar `.env`'de değil `ecosystem.cjs`'te sabittir; üç uygulama aynı anahtarı paylaşmaz.
K-20 Ölçüm aracı `fetch` değil `http.request` kullanır; Node `Host` başlığını fetch'te yok sayıyor.
K-21 Test dosyaları da dahil her değişiklik tam dosya olarak teslim edilir.
K-22 `apps/*/.env` tutulmaz; cwd `.env` kök `.env`'i eziyor.

---

## 19. Yasaklar

19.1 Python eklemek.
19.2 `apps/*` arasında import.
19.3 Çalışma zamanında dış domaine istek (Bölüm 10).
19.4 Google dışı bot UA'sını `botMu` içinde `true` döndürmek.
19.5 Decoy'a JavaScript eklemek.
19.6 Sitemap'e birden fazla URL koymak.
19.7 `/l/:slug` için 301 kullanmak.
19.8 Migration dosyasını uygulandıktan sonra sessizce değiştirmek (checksum).
19.9 Prod'da `x-ugb-bot` başlığına güvenmek.
19.10 `domains.decoy_id` tekilliğini kaldırmak.
19.11 Portları `.env`'e geri taşımak.

---

## 20. Devir protokolü

Yeni ajan veya geliştirici sırayla:

20.1 Bu belgeyi baştan sona okur. Bölüm 18 ve 19'u ezberler.
20.2 Repoyu klonlar, `npm ci`, `.env` doldurur, `npm run migrate:durum` ile şemayı görür.
20.3 Bölüm 15'in tamamını koşar. Kırmızı varsa Bölüm 16'daki ilgili maddeye döner.
20.4 Bölüm 15 tamamen yeşil olmadan Bölüm 17'ye geçmez.
20.5 Her maddede commit atar, mesaj `D-xx: <kısa>` biçimindedir.
20.6 Karar değişikliği gerekiyorsa Bölüm 18'e yeni `K-` maddesi ekler, mevcut maddeyi silmez.
20.7 İşverene ilerlemeyi madde numarasıyla raporlar.

Devralan taraf, Bölüm 16'yı uygularken sohbette yazılmış dosyalara erişimi olduğunu varsaymaz.

---

## 21. Sözlük

**Taşıyıcı (carrier):** kapının çalıştığı domain; Google'a makale, insana decoy/reklam.
**Hub:** portal, `/l/:slug` yönlendirici, admin.
**Spoke:** makale + link bloğu yayınlayan uydu domain.
**Decoy:** Google dışı trafiğe gösterilen, konuyla ilgisiz ama tutarlı yerel işletme sitesi.
**Kapı:** UA + IP + rDNS ile trafiği üç dala ayıran mantık.
**Küme:** aynı marka havuzunu ve 5-gram kapısını paylaşan taşıyıcı grubu.

---

Ek A — Dosya listesi

apps/carrier/{server.mjs, routes.mjs, views/}
apps/hub/{server.mjs, views/{portal,panel}.mjs}
apps/spoke/server.mjs
packages/core/{config,db,hostmap,log,bot,device,html,article,linkblock,decoy,skins,freshness,jsonld,amp,makale,siteadi}.mjs
packages/core/assets/{stil.css, favicon.svg, favicon/, img/}
packages/core/test/{yardim,article,bot,config,gate,linkblock}.test.mjs
db/{migrate.mjs, migrations/, skins.json}
jobs/{skins,linkblock,assets,dupes,refresh,temizle,linkcheck}.mjs, jobs/yedek.sh
scripts/{dogrula,domain,sql,kapi-test}.mjs, scripts/node22-test.sh
deploy/{db-kur.sh, app-kur.sh, nginx.conf.tpl, ecosystem.cjs, crontab}
docs/{sozlesme.md, runbook.md}

Ek B — Komutlar

npm ci
npm run migrate -- --evet
node db/migrate.mjs durum
node db/migrate.mjs eksik-sil
node db/migrate.mjs checksum-yenile
npm run dogrula
npm run dupes
npm run linkcheck
node scripts/sql.mjs "<sorgu>"
node scripts/kapi-test.mjs
npx vitest run
bash scripts/node22-test.sh
node scripts/domain.mjs ekle|cikar|listele
node jobs/linkblock.mjs

Ek C — Kontrol sorguları

-- kapi sizintisi: bot=0 ama Google IP
SELECT COUNT(*) FROM crawl_log
WHERE bot = 0 AND ip LIKE '66.249.%' AND created_at > NOW() - INTERVAL 1 DAY;

-- decoy tekilligi
SELECT decoy_id, COUNT() FROM domains WHERE decoy_id IS NOT NULL GROUP BY decoy_id HAVING COUNT() > 1;

-- cift tiklama
SELECT slug, COUNT() FROM clicks GROUP BY slug, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') HAVING COUNT() > 2;

Ek D — Kabul kontrol listesi (6 Kasım 2026, tamamı geçti)

- [x] D-01..D-29 kapalı
- [x] dogrula tüm satırlar ok (40/40)
- [x] amphtml-validator PASS, negatif kontrol FAIL + exit 1
- [x] durum çıktısında [!] yok
- [x] tek tıklama tek clicks satırı
- [x] iki taşıyıcı iki farklı decoy
- [x] crawl_log yerel bot isteğinde bot = 1
- [x] crawl_log insan isteğinde bot = 0
- [x] sitemap tek URL
- [x] çalışma zamanında dış istek yok
- [x] `npx vitest run` 63 test yeşil
- [x] `node scripts/kapi-test.mjs` yeşil
- [x] `npm run dupes` temiz
- [x] `npm run temizle` 91 günlük satırı sildi
- [x] Node 22.11.0 üzerinde tüm adımlar geçti
- [ ] Gerçek Google IP'sinden 15.5 (sunucu aşamasında)

Ek E — Stack

Node 22.11+, Fastify 5, mysql2, zod, dotenv, vitest, amphtml-validator, MariaDB, nginx, PM2, certbot, rclone.

Değişen yerler: sürüm 3.1, 2.3/2.4, 8.3/8.4, 11.6, 12.2, 12.5, 13.5–13.8, 15.6–15.8, Bölüm 16 kapalı liste (D-01..D-29), 17 güncel, K-17..K-22, 19.11, Ek A–E.