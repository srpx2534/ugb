#!/usr/bin/env bash
set -euo pipefail

: "${DB_NAME:=ugb}"
: "${DB_USER:?DB_USER gerekli}"
: "${DB_PASS:?DB_PASS gerekli}"
: "${YEDEK_DIZIN:=/var/backups/ugb}"
: "${YEDEK_SAKLAMA:=14}"
: "${RCLONE_HEDEF:=}"

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "HATA: mysqldump bulunamadi" >&2
  exit 1
fi
if ! command -v gzip >/dev/null 2>&1; then
  echo "HATA: gzip bulunamadi" >&2
  exit 1
fi

umask 077
install -d -m 700 "$YEDEK_DIZIN" 2>/dev/null || mkdir -p "$YEDEK_DIZIN"

# parolayi surec listesinde gostermemek icin gecici defaults dosyasi
CNF="$(mktemp)"
HATA="$(mktemp)"
trap 'rm -f "$CNF" "$HATA"' EXIT
cat >"$CNF" <<CNF_ICERIK
[client]
user=$DB_USER
password=$DB_PASS
CNF_ICERIK
chmod 600 "$CNF" 2>/dev/null || true

DOSYA="$YEDEK_DIZIN/$(date +%F_%H%M).sql.gz"

if ! mysqldump \
  --defaults-extra-file="$CNF" \
  --single-transaction \
  --quick \
  --routines \
  --no-tablespaces \
  --set-gtid-purged=OFF \
  "$DB_NAME" 2>"$HATA" | gzip -9 >"$DOSYA"; then
  echo "HATA: mysqldump basarisiz" >&2
  cat "$HATA" >&2
  exit 1
fi

# bos dosya yedek sayilmaz
BOYUT="$(stat -c%s "$DOSYA" 2>/dev/null || echo 0)"
if [ "$BOYUT" -lt 1024 ]; then
  echo "HATA: yedek cok kucuk ($BOYUT bayt): $DOSYA" >&2
  exit 1
fi

find "$YEDEK_DIZIN" -type f -name '*.sql.gz' -mtime +"$YEDEK_SAKLAMA" -delete

if [ -n "$RCLONE_HEDEF" ] && command -v rclone >/dev/null 2>&1; then
  rclone copy "$DOSYA" "$RCLONE_HEDEF"
  rclone delete --min-age "${YEDEK_SAKLAMA}d" "$RCLONE_HEDEF"
fi

echo "yedek: $DOSYA ($BOYUT bayt)"