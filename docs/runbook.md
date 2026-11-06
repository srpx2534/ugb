# Runbook

## Taşıyıcı ekleme

1. `node scripts/domain.mjs ekle <host> carrier kume-1`
2. nginx `server_name` listesine host'u ekle, `nginx -t && systemctl reload nginx`
3. `certbot --nginx -d <host>`
4. DNS A kaydı sunucu IP'sine
5. `node jobs/linkblock.mjs` (hub/spoke ise)
6. Doğrula: `curl -si -H "Host: <host>" http://127.0.0.1:3001/health`

Kod değişmez. Hostmap en geç 60 saniyede alır.

## Taşıyıcı çıkarma

1. `node scripts/domain.mjs cikar <host>`
2. nginx'ten `server_name` satırını kaldır

Kayıtlar silinmez, `aktif=0` yeterlidir.

## Kapı kontrolü