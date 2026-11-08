#!/usr/bin/env bash
# Yeni tasiyici ekler: masaustu host + m. host + iki ayri decoy + dogrulama.
# Kullanim: bash scripts/carrier-ekle.sh <host> <kume_id>
# Ornek   : bash scripts/carrier-ekle.sh ornek.com 1
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${1:-}"
KUME="${2:-}"

if [ -z "$HOST" ] || [ -z "$KUME" ]; then
  echo "kullanim: bash scripts/carrier-ekle.sh <host> <kume_id>" >&2
  exit 1
fi

HOST="$(printf '%s' "$HOST" | tr 'A-Z' 'a-z')"
MOBIL_HOST="m.${HOST}"

case "$HOST" in
  *.*) ;;
  *) echo "HATA: host en az bir nokta icermeli" >&2; exit 1 ;;
esac

case "$KUME" in
  ''|*[!0-9]*) echo "HATA: kume_id sayi olmali" >&2; exit 1 ;;
esac

# Tek deger okuma: --deger suslemesiz sayi basar
sql1() { node scripts/sql.mjs --deger "$1"; }

echo "== on kontrol =="
DOLU="$(sql1 "SELECT COUNT(*) FROM domains WHERE kume_id = ${KUME} AND role = 'carrier'")"
echo "kume ${KUME} tasiyici sayisi: ${DOLU} (ust sinir 21)"
if [ "${DOLU:-0}" -ge 21 ]; then
  echo "HATA: kume dolu, 21 tasiyici siniri asiliyor" >&2
  exit 1
fi

VAR="$(sql1 "SELECT COUNT(*) FROM domains WHERE host IN ('${HOST}', '${MOBIL_HOST}')")"
if [ "${VAR:-0}" -gt 0 ]; then
  echo "HATA: ${HOST} veya ${MOBIL_HOST} zaten kayitli" >&2
  exit 1
fi

BOS_DECOY="$(sql1 "SELECT COUNT(*) FROM decoys d WHERE d.aktif = 1 AND NOT EXISTS (SELECT 1 FROM domains x WHERE x.decoy_id = d.id)")"
if [ "${BOS_DECOY:-0}" -lt 2 ]; then
  echo "HATA: en az 2 bos decoy gerekiyor, mevcut ${BOS_DECOY:-0}" >&2
  exit 1
fi

echo "== ekleme =="
node scripts/domain.mjs ekle "$HOST" carrier "$KUME" 0
node scripts/domain.mjs ekle "$MOBIL_HOST" carrier "$KUME" 1

echo "== decoy baglama =="
for H in "$HOST" "$MOBIL_HOST"; do
  D="$(sql1 "SELECT d.id FROM decoys d WHERE d.aktif = 1 AND NOT EXISTS (SELECT 1 FROM domains x WHERE x.decoy_id = d.id) ORDER BY d.id LIMIT 1")"
  if [ -z "$D" ]; then
    echo "HATA: ${H} icin bos decoy kalmadi" >&2
    exit 1
  fi
  node scripts/sql.mjs "UPDATE domains SET decoy_id = ${D} WHERE host = '${H}'"
  echo "  ${H} -> decoy ${D}"
done

echo "== dogrulama =="
node scripts/sql.mjs "SELECT id, host, role, kume_id, site_id, decoy_id, mobil, aktif FROM domains WHERE host IN ('${HOST}', '${MOBIL_HOST}')"

echo
echo "eklendi. hostmap onbellegi 60 sn icinde tazelenir; hemen test icin servisi yeniden baslat."
echo "sonraki adim:"
echo "  BASE=${BASE:-http://127.0.0.1:3001} HOST=${MOBIL_HOST} npm run bot-test"