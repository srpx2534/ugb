# ugb

Taşıyıcı / hub / spoke ayrık çalışma alanı. Ortak çekirdek `packages/core` altında.

## Gereksinimler

- Node 22.11 (`.nvmrc`)
- MySQL 8.4 LTS / MariaDB
- Windows geliştirme, Linux dağıtım

## Veritabanı erişimi

Tek kullanıcı kullanılır: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.
TLS kullanılmaz. Bu kullanıcı DDL yetkisini de taşıdığı için migration'lar aynı
kimlikle çalışır. Parola yalnız `.env` içinde tutulur, repoya girmez, 6 ayda bir
döndürülür.

## Kurulum

    npm ci
    cp .env.example .env
    # .env doldur
    npm run migrate -- --evet

`apps/*` altında `.env` tutulmaz: uygulamalar kök `.env`'i okur, cwd'deki dosya
kök dosyayı ezer.

`npm ci` sonrası `esbuild` postinstall betiği engellenmişse birim testleri
sessizce patlar:

    npm install-scripts approve esbuild

## Yerel çalıştırma

Portlar `.env` içindeki `CARRIER_PORT`, `HUB_PORT`, `SPOKE_PORT` değerlerinden
gelir; uygulama kendi adını çalışma dizininden çözer. Üç ayrı terminal:

    cd apps/carrier && node server.mjs
    cd apps/hub     && node server.mjs
    cd apps/spoke   && node server.mjs

Uygulamalar varsayılan olarak `127.0.0.1` dinler (`DINLEME_HOST`). Uzak proxy ya
da konteyner arkasında `DINLEME_HOST=0.0.0.0` verilir.

İstekler `Host` başlığıyla ayrılır:

    curl -s -H "Host: hedefa.com" http://127.0.0.1:3001/health

Bot dalını görmek için `x-ugb-bot: 1` (yalnız `NODE_ENV=dev`).

Prod'da portlar `.env`'de durur, `deploy/ecosystem.cjs` oradan okur,
`deploy/nginx.conf.tpl` yer tutucularla doldurulur.

## Yapı sınırları

- `packages/core` hiçbir uygulamayı import etmez.
- `apps/*` birbirini import etmez; ortak her şey core'da.
- `views/` içinde JavaScript yok, decoy kabuk statik kalır.
- Migration'lar yalnız ileri gider; `npm run migrate:down` son adımı geri alır.

## Dış bağımlılık kuralı

Çalışma zamanında atarhaber, wi, merkezemoji, haberbosna, bunny.net, unsplash
adreslerine istek gitmez. Veri `db/skins.json` snapshot'ından, görseller
`packages/core/assets/` altından gelir. `npm run dogrula` bunu denetler.

## Doğrulama

    npx vitest run                 # birim testleri
    node scripts/kapi-test.mjs     # hub yonetim kapisi
    npm run dogrula                # kalite kapisi (sunucu ayakta)
    bash scripts/node22-test.sh    # tam tur, Node 22 ile
    npm audit                      # bagimlilik zafiyetleri

## Belgeler

- `docs/sozlesme.md` — iş ve teknik sözleşme
- `docs/runbook.md` — işletim adımları