# SÖZLEŞME UGB-2026-001

Sürüm 3.0 — 6 Kasım 2026
Yürürlük: imza ile. Sürüm 2.0'ı geçersiz kılar.
Durum: **devam eden iş.** Bu belge hem sözleşme hem devir dosyasıdır.

---

## 1. Taraflar ve amaç

1.1 İşveren ve Yüklenici Ek H'de.
1.2 Amaç: taşıyıcı / hub / spoke rollerinden oluşan, tek kod tabanlı, çoklu domain cloaking ağı kurmak ve işletmek.
1.3 Bu belge, işin **herhangi bir ajan veya geliştirici tarafından kesintisiz sürdürülebilmesi** için yazılmıştır. Bölüm 16 iş emridir, Bölüm 18 değişmez karar günlüğüdür, Bölüm 20 devir protokolüdür. Devralan taraf Bölüm 20'yi okumadan tek satır kod yazmaz.

---

## 2. Mevcut durum

2.1 Kod tabanı `https://github.com/srpx2534/ugb`, dal `main`, commit `0d35956`. Tek commit.
2.2 Tamamlanan: kök iskelet, `packages/core`, şema ve migration çalıştırıcı, `config/db/hostmap/log`, carrier + bot kapısı, 7 sayfalık decoy, AMP makale + JSON-LD + tazelik, hub (portal, `/l/:slug`, admin, tıklama), spoke, jobs (assets, dupes, refresh, temizle, linkcheck, yedek), deploy betikleri, `scripts/dogrula.mjs`.
2.3 **Kritik uyarı:** 6 Kasım 2026'da yapılan 19 maddelik düzeltme ve `decoys` tablosu işi **sohbet içinde yazıldı, repoya işlenmedi.** Repo şu an düzeltilmemiş hâldedir. Devralan taraf Bölüm 16'yı sıfırdan uygular; sohbette yazılmış dosyalar yok varsayılır.
2.4 Bilinen açık: kapı şu an çalışmıyor (D-01). `npm run dogrula` kırmızı.

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

5.1 Üç uygulama, üç port, tek sunucu, tek PM2 süreci grubu. Host yönlendirme `hostmap` üzerinden, DB tek doğru kaynak, bellek sadece sıcak yol.
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

8.1 Tablolar: `clusters`, `skins`, `brands`, `domains`, `decoys`, `brand_assignment`, `articles`, `article_grams`, `article_versions`, `crawl_log`, `link_blocks`, `clicks`, `schema_migrations`.
8.2 `domains.role` = `carrier|hub|spoke`. `domains.decoy_id` tekildir (`uq_decoy`); iki taşıyıcı aynı decoy'u paylaşmaz.
8.3 Decoy kimliği kodda değil `decoys` tablosunda durur. Yeni kimlik = satır ekleme, kod değişmez.
8.4 `articles` domain başına tek `index` satırı. 5-gram kapısı eşiği 0.45.
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
11.6 Gizli link bloğu `display:none`, `rel="follow"`, azami 25, ağırlık marka 60 / bölge 25 / işletme 10 / genel 5.
11.7 AMP Cache 1 Temmuz 2026'da kapandı. AMP sıralama avantajı için değil, hız için tutulur.

---

## 12. SEO ve indeksleme

12.1 Google'ın indeksinde tek URL kalır: `/`. Destek sayfaları bot için 200 + aynı makale + canonical döner.
12.2 `sitemap.xml` tek `<url>`, `lastmod`, `changefreq`, `priority`.
12.3 `robots.txt` Googlebot ve AdsBot için `Allow`, `Sitemap` satırı taşır.
12.4 `/l/:slug` 302'dir, 301 değil: yönlendirme koşullu.
12.5 Tıklama zinciri carrier/spoke → hub → marka. Zincirin ilk bacağı sayar, hub'a `?say=0` ile devredilir. Çift sayım yasak.

---

## 13. Güvenlik

13.1 `ADMIN_PAROLA` prod'da varsayılan değerdeyse açılışta uyarı.
13.2 `crawl_log` ve `clicks` IP'yi SHA-256 ile tutar, ham IP saklanmaz (45 karakter kolonu istisna: teşhis için).
13.3 `/assets/*` yol çözümü `VARLIK + path.sep` ile sınırlanır.
13.4 Migration prod'da `--evet` olmadan çalışmaz.

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

---

## 16. İş emri — açık açıklar

Her madde: dosya, sorun, düzeltme, kabul. Sırayla uygulanır. D-01 olmadan diğerleri doğrulanamaz.

**D-01 — `packages/core/bot.mjs`: kapı ölü.**
`botMu` Google/Bing/Yandex dallarından sonra koşulsuz `return true` yapıyor; normal tarayıcı UA'sı da bot sayılıyor. `istek.makale` herkes için `true`, decoy ve reklam sayfası hiç açılmıyor, `crawl_log.bot` insanlarda 1.
Düzeltme: `if (u.includes('bingbot')) return listede(ip, BING_CIDR);` ve `if (u.includes('yandexbot')) return listede(ip, YANDEX_CIDR);` sonra `return false;`.
Kabul: masaüstü UA → decoy, mobil UA → reklam, Googlebot UA + `BOT_ZORLA=0` → decoy.

**D-02 — `apps/spoke/server.mjs`: eksik rotalar.**
`/assets/*` ve `/sitemap.xml` yok; makale gövdesi `/assets/img/makale-*.svg`, favicon `/assets/favicon.svg` istiyor, hepsi 404. `robots.txt` içinde `Sitemap:` satırı yok.
Düzeltme: carrier'daki `/assets/*` bloğu ve `sitemap()` çağrısı birebir taşınır, robots'a `Sitemap: https://<host>/sitemap.xml` eklenir.
Kabul: `/assets/img/makale-1.svg` 200 `image/svg+xml`, `/sitemap.xml` tek `<url>`.

**D-03 — `packages/core/amp.mjs`: skin rengi ve favicon uygulanmıyor.**
`d.ana` yalnız `theme-color`'a yazılıyor, CSS'te `--ana` sabit. `favicon` parametresi alınıp kullanılmıyor. `articleLd` importu ölü.
Düzeltme: `<style amp-custom>:root{--ana:${ana}}...`, `<link rel="icon" href="${favicon || '/assets/favicon.svg'}">`, ölü import silinir.
Kabul: iki farklı `site_id` ile iki farklı renk ve favicon çıktısı.

**D-04 — çift tıklama sayımı.**
carrier `/l/:slug` `clicks`'e yazıp hub'a 302 atıyor, hub aynı slug için tekrar yazıyor. Her tıklama 2 satır.
Düzeltme: carrier ve spoke `.../l/${slug}?say=0` adresine gider; hub `istek.query.say === '0'` ise saymaz.
Kabul: tek tıklama = tek `clicks` satırı.

**D-05 — `apps/hub/server.mjs`, `apps/spoke/server.mjs`: yanlış IP.**
`ipHash(istek.ip)` kullanılıyor, `istemciIp` yardımcısı yalnız carrier'da. Proxy arkasında tüm tıklamalar proxy IP'sine yazılır.
Düzeltme: carrier'daki `istemciIp` birebir taşınır, `onRequest` içinde `istek.istemciIp` atanır, hash ondan üretilir.

**D-06 — `db/migrations/0013_brands_hedef.sql`: kırık rollback.**
Rollback `url = slug` yazıyor, ardından `NOT NULL` yapıyor; geri alındıktan sonra `/l/:slug` `sahabet` gibi göreli adrese yönlendirir.
Düzeltme: `UPDATE brands SET url = CONCAT('https://', slug, '.com');`

**D-07 — `db/migrate.mjs`: eksik migration dosyaları.**
`0002`–`0005` repoda yok (0001'e konsolide). `durum` bunları göstermiyor, `down` dosya bulamayınca patlıyor. Ayrıca uygulanmış bir dosya düzeltilince checksum uyuşmuyor ve `up` kilitleniyor.
Düzeltme: `durum` uygulanmış ama dosyası olmayan kayıtları `[!]` ile listeler; `eksik-sil` komutu bu kayıtları siler; `checksum-yenile <ad>` komutu checksum'ı tazeler; `down` dosya yoksa anlaşılır hata verir.

**D-08 — `jobs/linkcheck.mjs`: elle kapatmayı eziyor.**
Başarılı hedefte koşulsuz `aktif = 1` yazıyor; admin'in kapattığı marka geri açılıyor.
Düzeltme: `domains.elle_kapali` ve `brands.elle_kapali` kolonları (`0017`). Admin toggle'ı `elle_kapali = 1` yazar. linkcheck başarıda `aktif = IF(elle_kapali = 1, 0, 1)`, `elle_kapali = 1` ise düşüşte pasife almaz.

**D-09 — `jobs/refresh.mjs`: marka adı ve açıklama.**
`siteAdi: d.host` veriyor, ilk render `siteAdi(siteId)` kullanıyor; telif satırı tazelendikten sonra domaine dönüşüyor. `aciklama` hiç yazılmıyor.
Düzeltme: `site_id` de select'e eklenir, `siteAdi(d.site_id)` kullanılır, INSERT ve UPDATE `aciklama` alanını da yazar.

**D-10 — `packages/core/article.mjs`: çift paragraf.**
`GIRIS`, `NEDIR`, `CEVIRIMSIZ` havuzlarından iki kez `sec()` çağrılıyor; aynı paragraf üst üste gelebiliyor.
Düzeltme: havuzu karıştırıp ilk iki elemanı alan `iki(d)` yardımcısı; üç havuz için birer kez çağrılır.

**D-11 — `packages/core/linkblock.mjs`: geçersiz rel, kaçışsız çıktı.**
`rel="dofollow"` geçerli değer değil; `hedef` ve `anchor` HTML kaçışı yapılmıyor.
Düzeltme: `rel="follow"`, `kacis()` ile sarılır.

**D-12 — `scripts/domain.mjs`: eksik atama.**
`ekle` komutu `site_id` ve `decoy_id` atamıyor; yeni taşıyıcı varsayılan renk ve aynı restoranla açılıyor.
Düzeltme: küme içinde boş `site_id` (1-21) ve boş `decoy_id` bulunur, ikisi de yoksa komut durur. `cikar` `elle_kapali = 1` de yazar.

**D-13 — `packages/core/config.mjs`, `.env.example`: eksik ve fazla anahtar.**
`HUB_HOST` şemada yok ama `.env.example`, `dupes.mjs` ve runbook kullanıyor. `.env.example`'da `SITE_ID`, `PORT`, `BOT_ZORLA` yok.
Düzeltme: `HUB_HOST` şemaya eklenir, üç anahtar `.env.example`'a yazılır, `VARSAYILAN_PAROLA` sabiti dışa verilir.

**D-14 — `docs/runbook.md`: yarım.**
"Kapı kontrolü" başlığında kesiliyor. Decoy ataması, AMP notu, kapı sızıntı alarmı, bakım takvimi yok.
Düzeltme: tam runbook yazılır; decoy bölümü, `BOT_ZORLA` testi, AMP Cache kapanış notu, `crawl_log` alarm sorgusu eklenir.

**D-15 — `apps/carrier/routes.mjs`: yol sınırı.**
`tam.startsWith(VARLIK)` kontrolü `assetsX` dizinini de geçirir.
Düzeltme: `tam !== VARLIK && !tam.startsWith(VARLIK + path.sep)`.

**D-16 — `apps/hub/server.mjs`: varsayılan parola sessiz.**
Prod'da `ADMIN_PAROLA` varsayılansa uyarı yok.
Düzeltme: açılışta `isProd && env.ADMIN_PAROLA === VARSAYILAN_PAROLA` ise `log.warn`.

**D-17 — `amp.html`:** kökte sahipsiz dosya, hiçbir yerden referans yok. Silinir.

**D-18 — `db/migrations/0001_init.sql`:** `skins.renk` yanlış JSON yolu (`$.primary.main`), `0009` düzeltiyor. Doğrusu `$.colors.primary.main`. Değişiklik sonrası `checksum-yenile 0001_init.sql`.

**D-19 — `deploy/db-kur.sh`:** fail2ban `logpath` journald kullanan kurulumlarda boş, `log_error` tanımlı değil.
Düzeltme: `log_error = /var/log/mysql/error.log`, dizin oluşturma, ardından jail.

**D-20 — `decoys` tablosu (madde 10).**
Decoy kimliği `domains.decoy` JSON'ında, tek kimlik var, üç taşıyıcı aynı restoranı gösteriyor.
Düzeltme: `0018_decoys.sql` — `decoys` tablosu (isim, tur, adres, sehir, bolge, posta, tel, eposta, hakkinda, saatler JSON, menu JSON, fotolar, aktif), üç farklı kimlik seed, mevcut JSON'lar taşınır, taşıyıcılara sırayla dağıtılır, `uq_decoy` eklenir, `domains.decoy` düşürülür. `decoy.mjs` → `decoyCoz(decoyId)` DB'den + 60 sn TTL cache + `decoyTemizle()`. `hostmap` `decoy` parse'ı yerine `es_decoy_id` devralır. `routes.mjs` `await decoy(istek)`.
Kabul: iki taşıyıcı iki farklı restoran gösterir; `decoy_id` değişimi 60 sn içinde yayına girer.

---

## 17. Dışarıdan bekleyenler

17.1 Gerçek affiliate URL'leri — 7 marka ölü, 3 rastlantısal. `brands.url` boş kalabilir; hub "hedef tanımlı değil" sayfası döner.
17.2 Üç gerçek işletme kimliği (isim, adres, telefon, saatler, menü) — `decoys` satırları.
17.3 Gerçek decoy fotoğrafları — galeri şu an SVG yer tutucu.
17.4 Gerçek Google IP'sinden kapı testi.
17.5 Sunucular, DNS, nginx `server_name`, certbot.
17.6 KVKK aydınlatma metni, Search Console kaydı, Rich Results testi.
17.7 `packages/core/test` gerçek testler (şu an `todo`).
17.8 404/500 sayfalarının decoy temasına alınması.
17.9 `refresh` için `ORDER BY RAND()` yerine kuyruk.
17.10 `hostmap` dışındaki cache invalidation (decoy düzenlemesi 60 sn TTL'e bağlı).

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

---

## 20. Devir protokolü

Yeni ajan veya geliştirici sırayla:

20.1 Bu belgeyi baştan sona okur. Bölüm 18 ve 19'u ezberler.
20.2 Repoyu klonlar, `npm install`, `.env` doldurur, `npm run migrate:durum` ile şemayı görür.
20.3 **Bölüm 16'yı sırayla uygular.** D-01 ile başlar; D-01 olmadan hiçbir kapı testi anlamlı değildir.
20.4 Her maddeden sonra Bölüm 15'in ilgili satırını çalıştırır.
20.5 Bölüm 15 tamamen yeşil olmadan Bölüm 17'ye geçmez.
20.6 Her maddede commit atar, mesaj `D-xx: <kısa>` biçimindedir.
20.7 Karar değişikliği gerekiyorsa Bölüm 18'e yeni `K-` maddesi ekler, mevcut maddeyi silmez.
20.8 İşverene ilerlemeyi madde numarasıyla raporlar.

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

## Ek A — Dosya listesi

apps/carrier/{server.mjs, routes.mjs, views/}
apps/hub/{server.mjs, views/{portal,panel}.mjs}
apps/spoke/server.mjs
packages/core/{config,db,hostmap,log,bot,device,html,article,linkblock,decoy,skins,freshness,jsonld,amp,makale,siteadi}.mjs
packages/core/assets/{stil.css, favicon.svg, favicon/, img/}
db/{migrate.mjs, migrations/, skins.json}
jobs/{skins,linkblock,assets,dupes,refresh,temizle,linkcheck}.mjs, jobs/yedek.sh
scripts/{dogrula,domain}.mjs
deploy/{db-kur.sh, app-kur.sh, nginx.conf.tpl, ecosystem.cjs, crontab}
docs/{sozlesme.md, runbook.md}

## Ek B — Komutlar

npm install
npm run migrate -- --evet
node db/migrate.mjs durum
node db/migrate.mjs eksik-sil
node db/migrate.mjs checksum-yenile <dosya>
npm run dogrula
npm run dupes
npm run linkcheck

## Ek C — Kontrol sorguları

```sql
-- kapı sızıntısı: bot=0 ama Google IP
SELECT COUNT(*) FROM crawl_log
WHERE bot = 0 AND ip LIKE '66.249.%' AND created_at > NOW() - INTERVAL 1 DAY;

-- decoy tekilliği
SELECT decoy_id, COUNT(*) FROM domains WHERE decoy_id IS NOT NULL GROUP BY decoy_id HAVING COUNT(*) > 1;

-- çift tıklama
SELECT slug, COUNT(*) FROM clicks GROUP BY slug, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') HAVING COUNT(*) > 2;

Ek D — Kabul kontrol listesi
 D-01..D-20 kapalı
 dogrula tüm satırlar ok
 amphtml-validator PASS
 durum çıktısında [!] yok
 tek tıklama tek clicks satırı
 iki taşıyıcı iki farklı decoy
 crawl_log Google IP'sinde bot = 1
 crawl_log insan IP'sinde bot = 0
 sitemap tek URL
 çalışma zamanında dış istek yok
Ek E — Stack
Node 22.11+, Fastify 5, mysql2, zod, dotenv, vitest, MariaDB, nginx, PM2, certbot, rclone.