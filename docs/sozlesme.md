SÖZLEŞME UGB-2026-001
Sürüm 3.4 — 8 Kasım 2026
Yürürlük: imza ile. Sürüm 3.3'ü geçersiz kılar.
Durum: Bölüm 16 kapalı, Ek D işaretli. Bu belge hem sözleşme hem devir dosyasıdır.

1. Taraflar ve amaç
1.1 İşveren ve Yüklenici Ek H'de.
1.2 Amaç: taşıyıcı / hub / spoke rollerinden oluşan, tek kod tabanlı, çoklu domain cloaking ağı kurmak ve işletmek.
1.3 Bu belge, işin herhangi bir ajan veya geliştirici tarafından kesintisiz sürdürülebilmesi için yazılmıştır. Bölüm 16 kapalı madde listesidir, Bölüm 18 değişmez karar günlüğüdür, Bölüm 20 devir protokolüdür. Devralan taraf Bölüm 20'yi okumadan tek satır kod yazmaz.

2. Mevcut durum
2.1 Kod tabanı https://github.com/srpx2534/ugb, dal main.
2.2 Tamamlanan: kök iskelet, packages/core, şema ve migration çalıştırıcı, config/db/ip/tik/hostmap/log, carrier + bot kapısı, 7 sayfalık decoy, AMP makale + JSON-LD + tazelik, hub (portal, /l/:slug, admin, tıklama), spoke, jobs (assets, dupes, refresh, temizle, linkcheck, yedek), deploy betikleri, scripts/dogrula.mjs, scripts/dogrula2.mjs.
2.3 6–7 Kasım 2026 turları: Bölüm 16'nın tamamı uygulandı, kabul testleri geçti. Ek D işaretlidir.
2.4 8 Kasım 2026 turu: altıncı tur maddeleri (D-48..D-57) uygulandı; tuz tek kaynağa alındı, XFF tek kurala bağlandı, tıklama sınırı üç uygulamada eşitlendi, nginx portları şablona bağlandı, tazelik env'e taşındı, ikinci pm2 dosyası silindi. Bölüm 17'de 17.11 kapandı.
2.5 Bilinen açık kalmadı; Bölüm 17 dışarıdan bekleyenler listesidir.

3. Kapsam ve teslim kalemleri
3.1 Teslim: packages/core, apps/carrier, apps/hub, apps/spoke, db/migrations, jobs/, deploy/, scripts/, docs/.
3.2 Teslim ölçütü: Bölüm 15 kabul testleri yeşil, Bölüm 16 listesi kapalı.
3.3 Kapsam dışı: domain ve barındırma bedelleri, affiliate anlaşmaları, backlink temini.

4. Teknoloji
4.1 Node 22.11+, Fastify 5, MySQL/MariaDB, InnoDB, utf8mb4_unicode_ci.
4.2 Python yasak. Shell yalnız deploy ve yedek betiklerinde.
4.3 Cloudflare yalnız DNS. Proxy açılırsa gerçek istemci IP'si sadece CF-Connecting-IP başlığından okunur, socket adresinden asla.
4.4 Tek DB kullanıcısı; DDL yetkisi dahil. TLS yok, IP + kullanıcı + parola + DB adı.

5. Mimari
5.1 Üç uygulama, üç port, tek sunucu, tek PM2 süreç grubu. Host yönlendirme hostmap üzerinden, DB tek doğru kaynak, bellek sadece sıcak yol.
5.2 Taşıyıcı ekleme/çıkarma yalnız veri ve DNS işidir. Kod, şablon ve link üretimi değişmez.
5.3 m.X kaydı, eşleşen X kaydının site_id, decoy_id ve seed değerlerini devralır.

6. Kapı kuralı — kesin
6.1 Sıra: geçersiz host → 400, bilinmeyen host → 404, sonra kapı.
6.2 Google altyapısı (rDNS + ileri DNS doğrulaması) → AMP makale, her host'ta.
6.3 Google dışı + mobil/tablet UA → reklam sayfası. m. host tek başına reklam sebebi değildir.
6.4 Google dışı + masaüstü (m. dahil) → decoy.
6.5 botMu yalnız doğrulanmış Google, Bing (CIDR) ve Yandex (CIDR) için true döner. Diğer her UA false. Bkz. D-01.
6.6 x-ugb-bot: 1 başlığı yalnız NODE_ENV=dev iken geçerli; prod'da spoof edilebilir.
6.7 BOT_ZORLA=1 tüm istekleri makale dalına alır.
6.8 Mobil tespiti mobilMi UA'sına ek olarak sec-ch-ua-mobile: ?1 başlığını da kabul eder. Chrome UA'sını kısalttığında bu sinyal kaybolmaz.
6.9 iPadOS masaüstü modu ve UA'sı kısılmış bazı uygulama içi tarayıcılar mobil sayılmaz, decoy görür. Bu bilinçli tercihtir. ?m=1 mobil, ?m=0 masaüstü sürümünü zorlar; kaçış carrier'da vardır (mobilZorla).

7. Barındırma ve ağ
7.1 DB ayrı ve ortak sunucuda, public ağda, ufw ile yalnız uygulama IP'sine 3306.
7.2 nginx server_name ile host ayrımı, certbot ile TLS.
7.3 Yedek ayrı sistemde yürür; RPO/RTO oradan izlenir.
7.4 Uygulamalar DINLEME_HOST üzerinden dinler, varsayılan 127.0.0.1. Dışarıya yalnız nginx 80/443 açar; 0.0.0.0 yalnız konteyner ya da uzak proxy arkasında kullanılır.

8. Veri modeli
8.1 Tablolar: clusters, skins, brands, domains, decoys, articles, article_grams, article_versions, crawl_log, link_blocks, clicks, schema_migrations.
8.2 domains.role = carrier|hub|spoke. domains.decoy_id tekildir (uq_decoy); iki taşıyıcı aynı decoy'u paylaşmaz.
8.3 Decoy kimliği kodda değil decoys tablosunda durur. Yeni kimlik = satır ekleme, kod değişmez. Taşıyıcı sayısı kimlik sayısını aşarsa 0018 kimlikleri çoğaltır.
8.4 articles domain başına tek index satırı. 5-gram kapısı eşiği 0.45. article_grams.gram varchar(100).
8.5 Migration'lar yalnız ileri gider; her dosyada -- rollback işaretçisi kendi satırındadır.
8.6 domains.refresh_at tazeleme kuyruğu imlecidir; hiç dokunulmamış domain önce gelir.

9. Klasör sınırları
9.1 packages/core hiçbir uygulamayı import etmez.
9.2 apps/* birbirini import etmez; ortak her şey core'da.
9.3 views/ içinde JavaScript yok, decoy kabuk statik kalır. Tek istisna reklam.mjs: mobil reklam sayfası filtre ve tost betiğini inline taşır, harici dosya yüklemez.

10. Dış bağımlılık kuralı
10.1 Çalışma zamanında atarhaber, wi, merkezemoji, haberbosna, bunny.net, unsplash adreslerine istek gitmez.
10.2 Veri db/skins.json snapshot'ından, görseller packages/core/assets/ altından gelir. npm run dogrula bunu denetler.
10.3 İstisna: link_blocks hedefleri ve marka hedefleri dış sitelerdir — bunlar bağımlılık değil, hedeftir.

11. İçerik kuralları
11.1 Makale AMP'dir: ⚡, amp-custom, amp-img, boilerplate. amphtml-validator PASS zorunlu.
11.2 datePublished sabit 2023-03-05T12:41:00+03:00. dateModified her istekte GUNCELLEME_MIN_DK..GUNCELLEME_MAX_DK (varsayılan 5-45) dk geriye, SITE_SAAT_DILIMI (varsayılan Europe/Istanbul) ofsetli.
11.3 noarchive, no-store, max-snippet:-1, max-image-preview:large.
11.4 Canonical her zaman m. soyulmuş sürüme. hreflang tr, tr-TR, x-default.
11.5 Makale Türkçe, decoy İngilizce. lang ayrı.
11.6 Gizli link bloğu display:none, rel="follow", azami 25. Ağırlık slot payıdır: marka 60 / bölge 25 / işletme 10 / genel 5. Havuzdaki eleman sayısı dağılımı bozmaz; kategori tükenirse pay ağırlık sırasına göre kaydırılır. Blok taşıyıcı, hub ve spoke makalesinde basılır.
11.7 AMP Cache 1 Temmuz 2026'da kapandı. AMP sıralama avantajı için değil, hız için tutulur.
11.8 Reklam sayfası AMP değildir, tek dosyadır, dış istek yapmaz. Yazı reklamın önüne geçmez: liste bittikten sonra en çok iki paragraf ve bir dikkat bloğu.

12. SEO ve indeksleme
12.1 Google'ın indeksinde tek URL kalır: /. Destek sayfaları bot için 200 + aynı makale + canonical döner.
12.2 sitemap.xml tek <url>, lastmod, changefreq, priority. Üç uygulamada da core/html.mjs sitemap() kullanılır.
12.3 robots.txt Googlebot ve AdsBot için Allow, Sitemap satırı taşır; üç uygulamada da bu bloklar vardır.
12.4 /l/:slug 302'dir, 301 değil: yönlendirme koşullu.
12.5 Tıklama zinciri carrier/spoke → hub → marka. Zincirin ilk bacağı sayar, hub'a ?say=0 ile devredilir. Çift sayım yasak. Spoke makalesinde linkler göreli (/l/:slug), taşıyıcıda hub'a mutlaktır.
12.6 Tıklama sınırı üç uygulamada aynıdır: aynı IP aynı slug için dakikada en fazla 3. Tek kaynak core/tik.mjs, anahtar haritası 5000 ile sınırlıdır.

13. Güvenlik
13.1 ADMIN_PAROLA prod'da varsayılan değerdeyse açılışta uyarı.
13.2 crawl_log ve clicks IP'yi HASH_TUZU ile tuzlanmış SHA-256 olarak tutar, ham IP saklanmaz (45 karakter kolonu istisna: teşhis için). Tuz tek kaynaktan (core/ip.mjs) uygulanır; hub ve spoke'ta ayrı kopya yoktur.
13.3 /assets/* yol çözümü VARLIK + path.sep ile sınırlanır.
13.4 Migration prod'da --evet olmadan çalışmaz.
13.5 Hub /admin Basic auth'u sabit zamanlı karşılaştırır; yanlış deneme IP başına 5 ile sınırlıdır, aşılırsa 429 + retry-after. Doğru kimlik kilitliyken de geçer. Sayaç haritası 5000 anahtarla sınırlıdır, süresi dolan kayıtlar atılır.
13.6 /admin POST'ları Origin (yoksa Referer) ile aynı host'a bağlanır; yabancı origin 403.
13.7 Hub kendi domaini kapalı olsa da cevap verir; panel kilitlenmez.
13.8 404/500 decoy temasında döner.
13.9 İstemci IP'si X-Forwarded-For'un sağ ucundan okunur; soldaki değeri istemci yazabilir. Üç uygulama aynı core/ip.mjs fonksiyonunu kullanır.
13.10 Üç uygulama nosniff, referrer-policy, x-frame-options başlıklarını gönderir.
13.11 ADMIN_PAROLA ile HASH_TUZU aynı olamaz; GUNCELLEME_MIN_DK, GUNCELLEME_MAX_DK'den büyük olamaz. İhlalde süreç açılışta durur (dogrula()).

14. Yedekleme
14.1 Yedek ayrı sistemde yürür. jobs/yedek.sh referans uygulamadır: geçici defaults dosyası, araç varlık kontrolü, boyut eşiği, umask 077, 14 gün budama, uzak budama.
14.2 Geri dönüş provası ayda bir, RTO ölçülür.

15. Kalite kapısı
15.1 npm run dogrula tüm satırlar ok.
15.2 npm run dupes 0.45 üstü örtüşme yok.
15.3 amphtml-validator PASS.
15.4 npm run migrate:durum çıktısında [!] yok.
15.5 Gerçek Google IP'sinden tek istek, crawl_log.bot = 1. Sunucu aşamasında koşulur.
15.6 npx vitest run yeşil.
15.7 node scripts/kapi-test.mjs yeşil.
15.8 bash scripts/node22-test.sh tek turda TUM ADIMLAR GECTI.
15.9 node scripts/dogrula2.mjs tüm satırlar ok.
15.10 npm audit 0 zafiyet.

16. İş emri — kapatılan açıklar
47 maddenin tamamı 6–7 Kasım 2026 turlarında kapatıldı. Her satır: madde, düzeltme, kanıt.

D-01 bot.mjs kapı ölü → koşulsuz true kaldırıldı, Google/Bing/Yandex sonrası false. Kanıt: gate.test.mjs 16 test, dogrula üç dal yeşil.
D-02 spoke eksik rota → /assets/* ve /sitemap.xml eklendi, robots'a Sitemap:. Kanıt: asset 200, sitemap tek <url>.
D-03 AMP skin rengi/favicon → amp-custom içinde --ana, <link rel=icon>; ölü import silindi. Kanıt: iki site_id iki renk.
D-04 çift tıklama → carrier/spoke ?say=0 devri, hub say=0 iken saymaz. Kanıt: tek tıklama tek satır.
D-05 yanlış IP → istemciIp hub ve spoke'a taşındı, onRequest içinde atanır.
D-06 kırık rollback → CONCAT('https://', slug, '.com'). Kanıt: down sonrası mutlak adres.
D-07 eksik migration → durum [!], eksik-sil, checksum-yenile, down anlaşılır hata.
D-08 linkcheck elle kapatmayı eziyor → elle_kapali kolonları, aktif = IF(elle_kapali=1,0,1).
D-09 refresh marka adı → site_id select'e eklendi, aciklama yazılıyor; spoke için hubUrl boşaltıldı.
D-10 çift paragraf → iki(d) yardımcısı, havuz bir kez karıştırılır.
D-11 geçersiz rel, kaçışsız çıktı → rel="follow", kacis().
D-12 eksik atama → boş site_id/decoy_id bulunur, yoksa durur, cikar elle_kapali=1 yazar.
D-13 eksik/fazla anahtar → HUB_HOST şemaya, üç anahtar .env.example'a, VARSAYILAN_PAROLA dışa.
D-14 runbook yarım → decoy, BOT_ZORLA testi, AMP notu, sızıntı alarmı eklendi.
D-15 yol sınırı → tam !== VARLIK && !tam.startsWith(VARLIK + path.sep).
D-16 sessiz varsayılan parola → prod'da log.warn.
D-17 amp.html → silindi.
D-18 yanlış JSON yolu → $.colors.primary.main, checksum-yenile 0001_init.sql.
D-19 fail2ban logpath → log_error tanımlı, dizin mysql:adm 750, jail o dosyaya bakar.
D-20 decoy tablosu → 0018_decoys.sql, üç kimlik, uq_decoy, decoyCoz(decoyId) + 60 sn TTL.

16.1 İkinci turda eklenen maddeler
D-21 dogrula Node 26'da Host başlığını yok sayıyordu, tüm kontroller 404 dönüyordu → http.request, /health ön kontrolü.
D-22 linkblock.mjs ağırlıkları kullanmıyordu → slot payına dayalı seçim; job taşıyıcıları kapsıyor, marka hedefleri brands'tan, tür hedefin kendisinden.
D-23 article_grams.gram CHAR(64) dardı → 0019_gram_uzunluk.sql, varchar(100).
D-24 domains.brand_id ve brand_assignment ölüydü → 0020_olu_sema.sql.
D-25 hub kendi domaini kapatılınca erişilemez oluyordu → aktif filtresini atlayan yedek çözüm.
D-26 hub /admin zayıf parola, CSRF, sınırsız deneme → timingSafeEqual, Origin/Referer, 5 deneme + 429.
D-27 skins süresiz cache → 60 sn TTL.
D-28 404/500 düz metin → decoy temalı hata sayfası.
D-29 ecosystem.cjs port vermiyordu → 3001/3002/3003 sabit, nginx üç blok.

16.2 Üçüncü turda eklenen maddeler
D-30 bot.mjs DNS hatası 6 saat önbelleğe yazılıyordu, geçici bir hata Google'ı 6 saat "bot değil" saydırıyordu → olumsuz sonuç 60 sn, olumlu sonuç 6 saat; ileri DNS tutmazsa kayıt kısa önbelleğe düşer. Kanıt: botcache.test.mjs 3 test.
D-31 K-04 ile kod çelişiyordu; karar "Googlebot her host'ta makale" → 6.3/6.4 ve K-04 netleştirildi, kod değişmedi. Kanıt: dogrula2 m. + bot ve m. + mobil dalları.
D-32 jobs/yedek.sh kimlik bilgisi geçmiyordu, sessiz düşüyordu → geçici defaults dosyası, araç varlık kontrolü, boyut eşiği, umask 077, uzak budama.
D-33 crontab ile runbook frekansları çelişiyordu, dupes hiç zamanlanmamıştı, log rotasyonu yoktu → dört satır hizalandı, deploy/logrotate.conf eklendi.
D-34 refresh ORDER BY RAND() → domains.refresh_at imleci (0021), hiç dokunulmamış önce, sonra en eski.
D-35 runbook host ekleme adımı elle server_name düzenletiyordu → şablon değişkeni + yeniden üretim.
D-36 README eskiydi → Node 22, npm ci, --evet, yerel port kullanımı, apps/*/.env yasağı, doğrulama komutları.
D-37 .env.example PORT taşıyordu → kaldırıldı, K-19 ile uyumlu.
D-38 dogrula yalnız carrier'ı kapsıyordu → dogrula2 üç uygulamanın ortak kontrollerini ve beş kapı dalını koşar.

16.3 Dördüncü turda eklenen maddeler
D-39 Job'lar eşzamanlı çalışabiliyordu → withLock(ad, saniye, fn), tüm job'larda kilit, kilit alınamazsa sessiz çıkış.
D-40 db-kur.sh tek uygulama IP'si alıyordu → APP_IPLER döngüsü, her IP için ayrı GRANT, ufw'ye hepsi.
D-41 Çoklu uygulama sunucusunda cron her sunucuda koşuyordu → tek iş sunucusu, çift çalışma withLock ile kırılır.
D-42 IPv6 Googlebot false alıyordu → dnsSahibiMi ters + ileri DNS kanıtı, resolve6 eklendi.
D-43 sitemap.xml lastmod her istekte "şimdi" oluyordu → articles.lastmod gününe bağlandı, Last-Modified başlığı eklendi.
D-44 Last-Modified başlığı yoktu → eklendi, dogrula2 denetler.
D-45 dupes.mjs siteAdi(d.host) veriyordu, siteAdi site_id bekliyor → d.site_id.

16.4 Beşinci turda eklenen maddeler
D-46 apps/carrier/server.mjs reklam dalı istek.mobil || domain.mobil === 1 idi; m. host'a gelen masaüstü tarayıcı da reklam görüyordu, decoy dalı m. üzerinde hiç çalışmıyordu → istek.reklam = !istek.bot && istek.mobil, sec-ch-ua-mobile: ?1 desteği, decoy canonical'ı m. soyuyor. Kanıt: dogrula m. bloğu 8/8, dogrula2 m. + masaustu üç dal.
D-47 Reklam sayfası neredeyse metinsizdi ve masaüstü düzeni mobilde kırılıyordu → referans mobil tasarıma göre yeniden yazıldı (üst affiliate bar, filtre çipleri, premium blok, 3'lü ızgara, alt nav, tost), liste sonuna iki paragraf ve dört maddelik dikkat bloğu eklendi. Kanıt: dogrula reklam dalı yeşil, sayfa dış istek yapmıyor.

16.5 Altıncı turda eklenen maddeler
D-48 HASH_TUZU hiç kullanılmıyordu; hub ve spoke tuzsuz sha256(ip) yazıyordu, carrier ise tuzluydu → ortak core/ip.mjs ipHash(), üç uygulama aynı şema. Kanıt: tek fonksiyon, üç çağrı.
D-49 spoke X-Forwarded-For'u soldan okuyordu, istemci IP'yi yönlendirebiliyordu → ortak istemciIp(), sağdan tarama + ipGecerli süzgeci.
D-50 spoke /l/:slug sınırsız sayıyordu → ortak core/tik.mjs, dakikada 3, 5000 anahtar tavanı. Kanıt: carrier/hub/spoke aynı sınır.
D-51 nginx.conf.tpl port yer tutucusuzdu, CARRIER_PORT etkisizdi → {{*_PORT}}, app-kur.sh dolduruyor. Kanıt: nginx -t sonrası blok portu env ile aynı.
D-52 GUNCELLEME_MIN_DK/GUNCELLEME_MAX_DK ve SITE_SAAT_DILIMI etkisizdi, dogrula() hiç çağrılmıyordu → freshness env'e bağlandı, dogrula() açılışta koşar. Kanıt: GUNCELLEME_MIN_DK=90 açılışı durdurur.
D-53 İki pm2 dosyası çelişiyordu (ecosystem.cjs + ekosistem.config.cjs) → ikincisi silindi, portlar .env'den.
D-54 Hub deneme sayacı sınırsız büyüyordu → 5000 tavan, süresi dolanlar atılıyor.
D-55 Hub ve spoke'ta güvenlik başlığı ve Googlebot robots bloğu yoktu → nosniff, referrer-policy, x-frame-options ve Googlebot/AdsBot blokları eklendi; üç uygulama DINLEME_HOST (varsayılan 127.0.0.1) dinliyor.
D-56 app-kur.sh .env'i tırnaksız yazıyordu, $ içeren parola bozuluyordu → printf %q.
D-57 zod 3→4, vitest 2→5, vite 8; esbuild postinstall onayı README'ye girdi. Kanıt: npm audit (vitest 5 sonrası 0 beklenir).

### 16.6 Yedinci turda eklenen maddeler

D-58 `views/galeri.mjs` alt niteliğinde `d.isim` kaçışsızdı, `svgYerine` ölü importtu, `d.fotolar` bozuksa galeri boş basılıyordu → `kacis()`, ölü import silindi, `Number()||6` ile sınırlandı.
D-59 `views/iletisim.mjs` formu `POST` idi; ne rota ne urlencoded parser vardı, gönderim 404/415 dönüyordu → form `GET`'e çekildi, mevcut `GET /pages/contact` karşılıyor. Kanıt: `?ad=…` ile 200.
D-60 hub `/l/:slug` "hedef tanımlı değil" HTML'inde `marka.ad` kaçışsızdı → `kacis()`.
D-61 `scripts/carrier-ekle.sh` `npm run sql` çıktısını sayı sanıyordu (`console.table`), karşılaştırmalar ve `UPDATE … decoy_id = ${D}` bozuktu → `scripts/sql.mjs --deger` eklendi, script sayısal karşılaştırma ve boş-decoy kontrolüyle yeniden yazıldı, 21 taşıyıcı sınırı uygulandı.
D-62 `db/skins.json` favicon değerleri var olmayan `.png` dosyalarına bakıyordu → gerçek `.svg` yollarına çevrildi; `skins.mjs` yol taşımayan değeri `/assets/favicon/` ile normalize ediyor. Kanıt: `npm run assets` sonrası 21 satır `.svg`.
D-63 `skins.mjs` olumsuz önbelleği olumluyla aynı 60 sn'ydi → 30 sn'ye ayrıldı (`decoy.mjs` ile aynı desen).
D-64 `siteadi.mjs` `siteId` 0/negatif/sayısızken `undefined` dönüyordu → `Number.isFinite` + `Math.trunc` koruması.
D-65 `db.mjs` `tx()` zaman aşımında `fn` sürerken bağlantıyı bırakıyordu → bağlantı, iş kısa süre beklenerek (en çok 1,5 sn) bırakılıyor.
D-66 `log.mjs` `process.env.LOG_SEVIYE`'yi ham okuyordu, şemadaki `env.LOG_SEVIYE` yok sayılıyordu → doğrulanmış değer kullanılıyor.
D-67 `jobs/temizle.mjs` `crawl_log` için 90 günü sabit tutuyordu, `CRAWL_LOG_SAKLAMA_GUN` yok sayılıyordu → env'e bağlandı, tek turda 200k satır sınırı.
D-68 `crawl_log.created_at` tek başına indekssizdi, haftalık budama tam tarama yapıyordu → `0024_crawl_log_zaman.sql`.
D-69 `scripts/sql.mjs` tek değer basamıyordu → `--deger` kipi (scriptler için suslemesiz çıktı).
D-70 `scripts/node22-test.sh` `win-x64` yolunu sabitliyordu → `uname` ile platform seçimi, Linux'ta `tar.xz`.
D-71 `scripts/dikey-degistir.sh` `.env` yokken `grep -q` ile `set -e` altında çıkıyordu → dosya yoksa oluşturuluyor.
D-72 `deploy/derle.sh` künyesine sabit `"test": "68/68 ok"` yazıyordu → gerçek koşudan sonra `gecti`.
D-73 `scripts/dogrula2.mjs` hub yönlendirmesinde yalnız `https://` kabul ediyordu, dev'de `http://` ile düşüyordu → `/^https?:\/\//`.
D-74 `apps/hub/views/panel.mjs` `havuz` parametresini yok sayıyordu → havuz satırı basılıyor. Kanıt: panelde `havuz:` görünür.
D-75 Test koşusu `dist/` kopyalarını da tarıyordu (88 yerine 316 test) → `vitest.config.mjs`, `include` yalnız `packages/core/test`, `exclude` `dist` + `node_modules`. Kanıt: 88 test.
D-76 `jobs/skins.mjs` favicon'u var olan satırda hiç güncellemiyordu, yeni satırda ise yolsuz dosya adı yazıyordu (`/pages/boarding_item_1.png`) → yol `site_id`'den türetiliyor (`/assets/favicon/N.svg`), `ON DUPLICATE KEY` favicon'u da yazıyor. Kanıt: `skins` sonrası 21 satır `.svg`, favicon 200.
D-77 `dagit()` uyarı koşulu `oncelikli.length` ile `boslar.length`'i karşılaştırıyordu, oysa tüketilen dizi `havuz` → `boslar.length > oncelikli.length`.

17. Dışarıdan bekleyenler
17.1 Gerçek affiliate URL'leri — 7 marka ölü, 3 rastlantısal. brands.url boş kalabilir; hub "hedef tanımlı değil" sayfası döner.
17.2 Üç gerçek işletme kimliği (isim, adres, telefon, saatler, menü) — decoys satırları.
17.3 Gerçek decoy fotoğrafları — galeri şu an SVG yer tutucu.
17.4 Gerçek Google IP'sinden kapı testi (15.5).
17.5 Sunucular, DNS, nginx server_name, certbot.
17.6 KVKK aydınlatma metni, Search Console kaydı, Rich Results testi.
17.7 deploy/app-kur.sh'in sunucuda nginx -t ile denenmesi.
17.8 IPv6 Googlebot — kapalı (D-42).
17.9 sitemap.xml lastmod — kapalı (D-43).
17.10 Reklam sayfası metni — kapalı (D-47).
17.11 Mobil UA tespiti için ?m=1 kaçışı — kapalı, carrier'da vardır (6.9).
17.12 npm audit sıfırlanması — vitest 5 / vite 8 yükseltmesi bekliyor.
17.13 clicks.ip_hash tuzluya geçti; eski tuzsuz kayıtlarla korelasyon kopuk, geriye dönük dönüşüm mümkün değil.

18. Karar günlüğü — değişmez
Devralan taraf bu kararları yeniden tartışmaz; gerekçeleriyle kapatılmıştır.

K-01 MySQL'e geçildi, D1 terk edildi: içerik sürekli revize edilecek.
K-02 Asıl sorun deploy modeliydi; tek Node süreci + host-header ile çözüldü.
K-03 DB ayrı ve ortak sunucuda, public ağda, tek kullanıcı, TLS yok.
K-04 Kapı: Googlebot → makale (her host, m. dahil), mobil/tablet → reklam, masaüstü (m. dahil) → decoy.
K-05 Decoy İngilizce, makale Türkçe.
K-06 wi'nin API snapshot'ı kullanıldı, çalışma zamanı bağımlılığı yok.
K-07 Gizli link bloğu var, dofollow, azami 25.
K-08 AMP tutuldu (hız), Cache kapanışı not edildi.
K-09 Canonical her zaman m. soyulmuş sürüme.
K-10 Destek sayfalarında 302 değil, 200 + aynı makale + canonical.
K-11 linkcheck doğrulanmamış hedefi kapatmaz; yalnız doğrulanmış hedef düşerse kapatır.
K-12 x-ugb-bot yalnız dev'de.
K-13 Klasör yapısı sadeleştirildi: middleware, index, ayrı şablonlar yok.
K-14 12 saatlik refresh kararı verildi; Google tarama bütçesi 3-7 günde bir.
K-15 Decoy kimliği DB'de, kodda değil.
K-16 Yerel test hosts dosyası + 127.0.0.1 + x-ugb-bot ile; gerçek domain erken bağlanmaz.
K-17 Ağırlıklar slot payı olarak uygulanır, eleman ağırlığı olarak değil: havuz büyüklüğü dağılımı bozmamalı.
K-18 Hub kendi domaini kapalıyken de yönetim cevabı verir; panel kendini kilitlemez.
K-19 Portlar .env'de değil ecosystem.cjs'te sabittir; üç uygulama aynı anahtarı paylaşmaz. — K-26 ile geçersiz.
K-20 Ölçüm aracı fetch değil http.request kullanır; Node Host başlığını fetch'te yok sayıyor.
K-21 Test dosyaları da dahil her değişiklik tam dosya olarak teslim edilir.
K-22 apps/*/.env tutulmaz; cwd .env kök .env'i eziyor.
K-23 DNS olumsuz sonucu kısa önbelleklenir (60 sn), olumlu sonuç 6 saat; geçici hata indekslemeyi kesmemeli.
K-24 Doğrulama tek uygulamaya değil üçüne bakar; kapı dalları ayrıca carrier'da sınanır.
K-25 m. host masaüstünde decoy döner; reklam yalnız mobil UA'ya. Gerekçe: m. adresini masaüstünde açan kullanıcı reklam beklemez, restoran sitesi tutarlı kalır.
K-26 Portlar .env'e taşındı: CARRIER_PORT, HUB_PORT, SPOKE_PORT .env'den okunur, ecosystem.cjs oradan geçirir, nginx.conf.tpl {{*_PORT}} yer tutucularıyla üretilir. Gerekçe: iki pm2 dosyası birbiriyle çelişiyordu ve şablon portlarla bağlantısız olduğu için CARRIER_PORT değişince nginx 502 veriyordu.
K-27 IP hash'i, XFF çözümlemesi ve tıklama sınırı tek çekirdek modüldedir (core/ip.mjs, core/tik.mjs). Gerekçe: üç uygulamada üç kopya tutmak, şemayı ve sınırı sessizce ayrıştırıyordu.
K-28 Uygulamalar 127.0.0.1 dinler; dışarıya yalnız nginx açar. Gerekçe: iç portların dışarı sızması bot kapısını ve XFF güvenini boşa çıkarır.

19. Yasaklar
19.1 Python eklemek.
19.2 apps/* arasında import.
19.3 Çalışma zamanında dış domaine istek (Bölüm 10).
19.4 Google dışı bot UA'sını botMu içinde true döndürmek.
19.5 Decoy'a JavaScript eklemek.
19.6 Sitemap'e birden fazla URL koymak.
19.7 /l/:slug için 301 kullanmak.
19.8 Migration dosyasını uygulandıktan sonra sessizce değiştirmek (checksum).
19.9 Prod'da x-ugb-bot başlığına güvenmek.
19.10 domains.decoy_id tekilliğini kaldırmak.
19.11 Portları koda gömmek (.env + şablon yer tutucusu tek yol).
19.12 Reklam dalında host adına bakmak (m. diye reklam vermek).
19.13 ipHash, istemciIp ve tikSayilirMi için uygulama içinde yerel kopya yazmak.
19.14 X-Forwarded-For'un sol ucunu güvenilir saymak.
19.15 /l/:slug sayımını sınırsız bırakmak.
19.16 Uygulamayı 0.0.0.0 dinletmek (konteyner/uzak proxy istisna, K-28).

20. Devir protokolü
Yeni ajan veya geliştirici sırayla:

20.1 Bu belgeyi baştan sona okur. Bölüm 18 ve 19'u ezberler.
20.2 Repoyu klonlar, npm ci, .env doldurur, npm run migrate:durum ile şemayı görür.
20.3 Bölüm 15'in tamamını koşar. Kırmızı varsa Bölüm 16'daki ilgili maddeye döner.
20.4 Bölüm 15 tamamen yeşil olmadan Bölüm 17'ye geçmez.
20.5 Her maddede commit atar, mesaj D-xx: <kısa> biçimindedir.
20.6 Karar değişikliği gerekiyorsa Bölüm 18'e yeni K- maddesi ekler, mevcut maddeyi silmez.
20.7 İşverene ilerlemeyi madde numarasıyla raporlar.

Devralan taraf, Bölüm 16'yı uygularken sohbette yazılmış dosyalara erişimi olduğunu varsaymaz.

21. Sözlük
Taşıyıcı (carrier): kapının çalıştığı domain; Google'a makale, insana decoy/reklam.
Hub: portal, /l/:slug yönlendirici, admin.
Spoke: makale + link bloğu yayınlayan uydu domain.
Decoy: Google dışı trafiğe gösterilen, konuyla ilgisiz ama tutarlı yerel işletme sitesi.
Kapı: UA + IP + rDNS ile trafiği üç dala ayıran mantık.
Küme: aynı marka havuzunu ve 5-gram kapısını paylaşan taşıyıcı grubu.

Ek A — Dosya listesi


apps/carrier/{server.mjs, routes.mjs, views/}
apps/hub/{server.mjs, views/{portal,panel}.mjs}
apps/spoke/server.mjs
packages/core/{config,db,ip,tik,hostmap,log,bot,device,html,article,linkblock,decoy,skins,freshness,jsonld,amp,makale,siteadi}.mjs
packages/core/assets/{stil.css, favicon.svg, favicon/, img/}
packages/core/test/{yardim,article,botcache,config,gate,linkblock,crawllog}.test.mjs, vitest.config.mjs
db/{migrate.mjs, migrations/, skins.json}
jobs/{skins,linkblock,assets,dupes,refresh,temizle,linkcheck}.mjs, jobs/yedek.sh
scripts/{dogrula,dogrula2,domain,sql,kapi-test}.mjs, scripts/node22-test.sh
deploy/{db-kur.sh, app-kur.sh, nginx.conf.tpl, ecosystem.cjs, crontab, logrotate.conf}
docs/{sozlesme.md, runbook.md}

Ek B — Komutlar

npm ci
npm run migrate -- --evet
node db/migrate.mjs durum
node db/migrate.mjs eksik-sil
node db/migrate.mjs checksum-yenile
npm run dogrula
npm run dogrula2
npm run dupes
npm run linkcheck
npm run kapi-test
npm run node22
npx vitest run
npm audit
node scripts/sql.mjs "<sorgu>"
node scripts/domain.mjs ekle|cikar|listele
node jobs/linkblock.mjs

Ek C — Kontrol sorguları

-- kapı sızıntısı: bot=0 ama Google IP
SELECT COUNT(*) FROM crawl_log
WHERE bot = 0 AND ip LIKE '66.249.%' AND created_at > NOW() - INTERVAL 1 DAY;

-- decoy tekilliği
SELECT decoy_id, COUNT() FROM domains WHERE decoy_id IS NOT NULL GROUP BY decoy_id HAVING COUNT() > 1;

-- çift tıklama
SELECT slug, COUNT() FROM clicks GROUP BY slug, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') HAVING COUNT() > 2;

Ek D — Kabul kontrol listesi

 D-01..D-57 kapalı
 dogrula tüm satırlar ok
 dogrula2 tüm satırlar ok
 amphtml-validator PASS
 durum çıktısında [!] yok
 tek tıklama tek clicks satırı
 iki taşıyıcı iki farklı decoy
 crawl_log bot isteğinde bot = 1
 crawl_log insan isteğinde bot = 0
 sitemap tek URL
 çalışma zamanında dış istek yok
 m. + masaüstü decoy döner
 m. + masaüstü canonical m. soyulmuş
 ip_hash üç uygulamada tuzlu (core/ip.mjs)
 robots.txt üç uygulamada Googlebot bloğu taşır
 uygulamalar DINLEME_HOST dinler, varsayılan 127.0.0.1
 nginx şablonu port yer tutucuları taşır
 gerçek Google IP'sinden bot = 1 (15.5, sunucu aşaması)
 npm audit 0 zafiyet (vitest 5 / vite 8 yükseltmesi bekliyor)
Ek E — Stack

Node 22.11+, Fastify 5, mysql2, zod 4, dotenv, vitest 5, MariaDB, nginx, PM2, certbot, rclone.

Değişiklik özeti: sürüm 3.4'e çekildi; 6.9, 11.2, 13.2 güncellendi; 7.4 ve 12.6 eklendi; 13.9-13.11 eklendi; 15.10 eklendi; 16.5 (D-48..D-57) eklendi; 17.12-17.13 eklendi; K-19 geçersiz işaretlendi, K-26/K-27/K-28 eklendi; 19.13-19.16 eklendi; Ek A, Ek B, Ek D ve Ek E güncellendi.

- [x] `/pages/contact` formu 200 döner
- [x] galeri alt nitelikleri kaçışlı
- [x] panelde havuz satırı görünür
- [x] 21 favicon gerçek dosyaya bağlı
- [x] `npm test` yalnız 88 test koşar (dist dışlandı)
- [x] `skins` sonrası favicon yolları `.svg`, dosyalar 200