# Runbook

## Taşıyıcı ekleme

1. `node scripts/domain.mjs ekle <host> carrier kume-1`
   Script kume içinde boş `site_id` ve boş `decoy_id` atar; ikisi de yoksa durur.
2. `node jobs/linkblock.mjs` (hub/spoke ise)
3. nginx `server_name` listesine host'u ekle, `nginx -t && systemctl reload nginx`
4. `certbot --nginx -d <host>`
5. DNS A kaydı sunucu IP'sine
6. Doğrula: `curl -si -H "Host: <host>" http://127.0.0.1:3001/health`

Kod değişmez. Hostmap en geç 60 saniyede alır.

## Taşıyıcı çıkarma

1. `node scripts/domain.mjs cikar <host>` (`aktif = 0`, `elle_kapali = 1`)
2. nginx'ten `server_name` satırını kaldır

Kayıtlar silinmez.

## Decoy kimliği

Her taşıyıcının ayrı restoran kimliği olmalı; iki taşıyıcı aynı `decoy_id`'yi paylaşmaz (`uq_decoy`).

Yeni kimlik: `decoys` tablosuna satır ekle. Decoy düzenlemesi 60 saniye içinde yayına girer.

Gerçek işletme bilgisi girildiğinde `isim`, `adres`, `tel`, `saatler`, `menu` alanları doldurulur; galeri görselleri `packages/core/assets/img/` altına konur.

## Kapı kontrolü

1. `BOT_ZORLA=1` ile sunucuyu başlat, `curl -H "Host: <host>" http://127.0.0.1:3001/` → AMP makale.
2. `BOT_ZORLA=0` ile yeniden başlat, aynı istek → decoy.
3. Mobil UA ile istek → reklam sayfası.
4. `curl -s -H "Host: <host>" http://127.0.0.1:3001/sitemap.xml | grep -c "<url>"` → `1`.
5. Gerçek Google IP'sinden (AS15169) tek istek, `crawl_log` içinde `bot = 1` doğrula.

`x-ugb-bot: 1` başlığı yalnız `NODE_ENV=dev` iken geçerlidir; prod'da spoof edilebilir.

## AMP

AMP Cache 1 Temmuz 2026'da kapatıldı. AMP yalnız hız için tutuluyor, sıralama avantajı yok. Şablon geçerliliği `amphtml-validator` ile kontrol edilir.

## Bakım

- `npm run refresh` 12 saatte bir, 4 domain.
- `npm run linkcheck` günde bir; `elle_kapali = 1` olan markanın `aktif` alanına dokunmaz.
- `npm run dupes` haftada bir; 0.45 üstü örtüşme uyarı.
- `npm run temizle` ayda bir.
- Yedek: `jobs/yedek.sh`, 03:15, 14 gün saklama, aylık geri dönüş provası.

## Kapı sızıntı alarmı

`SELECT COUNT(*) FROM crawl_log WHERE bot = 0 AND ip LIKE '66.249.%' AND created_at > NOW() - INTERVAL 1 DAY;`

Sıfırdan büyükse kapı Google IP'sini kaçırıyor demektir; `bot.mjs` ve `TRUST_PROXY` / `CF-Connecting-IP` zinciri kontrol edilir.