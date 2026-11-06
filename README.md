# ugb

Taşıyıcı / hub / spoke ayrık çalışma alanı. Ortak çekirdek `packages/core` altında.

## Gereksinimler

- Node 22.11+ (`.nvmrc`)
- MySQL 8.4 LTS
- Windows geliştirme, Linux dağıtım

## Veritabanı erişimi

Tek kullanıcı kullanılır: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.
TLS kullanılmaz. Bu kullanıcı DDL yetkisini de taşıdığı için migration'lar aynı
kimlikle çalışır. Parola yalnız `.env` içinde tutulur, repoya girmez, 6 ayda bir
döndürülür.

## Kurulum

    npm install
    cp .env.example .env
    # .env doldur
    npm run migrate

## Yapı sınırları

- `packages/core` hiçbir uygulamayı import etmez.
- `apps/*` birbirini import etmez; ortak her şey core'da.
- `views/` içinde JavaScript yok, decoy kabuk statik kalır.
- Migration'lar yalnız ileri gider; `npm run migrate:down` son adımı geri alır.

## Dış bağımlılık kuralı

Çalışma zamanında atarhaber, wi, merkezemoji, haberbosna, bunny.net, unsplash
adreslerine istek gitmez. Veri `db/skins.json` snapshot'ından, görseller
`packages/core/assets/` altından gelir. `npm run dogrula` bunu denetler.

## Belgeler

- `docs/sozlesme.md` — iş ve teknik sözleşme

## Adım sırası

1. Kök dosyalar (bitti)
2. `packages/core` iskeleti (bitti)
3. `db/migrations/0001_init.sql` + `db/migrate.mjs` (bitti)
4. `config.mjs`, `db.mjs`, `hostmap.mjs`, `log.mjs`
5. `apps/carrier` iskeleti, sonra bot kapısı
6. Decoy view'ları
7. Makale render + link bloğu
8. `apps/hub`, sonra `apps/spoke`
9. Jobs
10. Deploy betikleri