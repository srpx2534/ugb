# Runbook

## Taşıyıcı ekleme

1. `node scripts/domain.mjs ekle <host> carrier kume-1`
   Script küme içinde boş `site_id` ve boş `decoy_id` atar; ikisi de yoksa durur.
2. Host'u rolüne göre değişkene ekle: `CARRIER_HOSTLAR`, `HUB_HOSTLAR` veya `SPOKE_HOSTLAR`.
3. Şablonu yeniden üret:
   `sed -e "s|{{CARRIER_HOSTLAR}}|$CARRIER_HOSTLAR|" -e "s|{{HUB_HOSTLAR}}|$HUB_HOSTLAR|" -e "s|{{SPOKE_HOSTLAR}}|$SPOKE_HOSTLAR|" deploy/nginx.conf.tpl > /etc/nginx/sites-available/ugb`
4. `nginx -t && systemctl reload nginx`
5. `certbot --nginx -d <host>`
6. DNS A kaydı sunucu IP'sine
7. Doğrula: `curl -si -H "Host: <host>" http://127.0.0.1:3001/health`

Kod değişmez. Hostmap en geç 60 saniyede alır.

## Taşıyıcı çıkarma

1. `node scripts/domain.mjs cikar <host>` (`aktif = 0`, `elle_kapali = 1`)
2. Host'u şablon değişkeninden çıkar, şablonu yeniden üret, `nginx -t && systemctl reload nginx`

Kayıtlar silinmez.

## Decoy kimliği

Her taşıyıcının ayrı restoran kimliği olmalı; iki taşıyıcı aynı `decoy_id`'yi paylaşmaz (`uq_decoy`).

Yeni kimlik: `decoys` tablosuna satır ekle. Taşıyıcı sayısı kimlik sayısını aşarsa `0018` kimlikleri çoğaltır. Decoy düzenlemesi 60 saniye içinde yayına girer.

Gerçek işletme bilgisi girildiğinde `isim`, `adres`, `tel`, `saatler`, `menu` alanları doldurulur; galeri görselleri `packages/core/assets/img/` altına konur.

## Kapı kontrolü

1. `BOT_ZORLA=1` ile sunucuyu başlat, `curl -H "Host: <host>" http://127.0.0.1:3001/` → AMP makale.
2. `BOT_ZORLA=0` ile yeniden başlat, aynı istek → decoy.
3. Mobil UA ile istek → reklam sayfası.
4. `m.` host + Googlebot UA → makale; `m.` host + masaüstü UA → reklam.
5. `curl -s -H "Host: <host>" http://127.0.0.1:3001/sitemap.xml | grep -c "<url>"` → `1`.
6. Gerçek Google IP'sinden (AS15169) tek istek, `crawl_log` içinde `bot = 1` doğrula.

`x-ugb-bot: 1` başlığı yalnız `NODE_ENV=dev` iken geçerlidir; prod'da spoof edilebilir.

## AMP

AMP Cache 1 Temmuz 2026'da kapatıldı. AMP yalnız hız için tutuluyor, sıralama avantajı yok. Şablon geçerliliği `amphtml-validator` ile kontrol edilir.

## Bakım

Cron yalnız tek iş sunucusunda kurulur; ikinci app sunucusuna kurulmaz. `refresh`, `temizle`, `linkcheck`, `dupes` DB kilidi taşıdığı için yanlışlıkla çift çalışsa da ikinci tur beklemede kalır.
- `refresh` saatlik tetiklenir, her turda sıradaki 4 domain; bir domain ortalama 12 saatte bir yenilenir.
- `linkcheck` günde bir; `elle_kapali = 1` olan markanın `aktif` alanına dokunmaz.
- `temizle` haftada bir, `crawl_log` 90 / `clicks` 180 gün.
- `dupes` haftada bir; 0.45 üstü örtüşme uyarı.
- Loglar `/var/log/ugb-*.log`, haftalık rotasyon, 8 dosya (`deploy/logrotate.conf`).
- Yedek ayrı sistemde yürür; RPO/RTO oradan izlenir.

## Kapı sızıntı alarmı

`SELECT COUNT(*) FROM crawl_log WHERE bot = 0 AND ip LIKE '66.249.%' AND created_at > NOW() - INTERVAL 1 DAY;`

Sıfırdan büyükse kapı Google IP'sini kaçırıyor demektir; `bot.mjs` DNS önbelleği ve `TRUST_PROXY` / `CF-Connecting-IP` zinciri kontrol edilir. DNS geçici hatasının 60 saniyede düzelmesi beklenir; sürüyorsa `dnsCacheTemizle()` için süreç yeniden başlatılır.