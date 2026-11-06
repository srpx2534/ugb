#!/usr/bin/env bash
set -euo pipefail

: "${DB_NAME:=ugb}"
: "${YEDEK_DIZIN:=/var/backups/ugb}"

mkdir -p "$YEDEK_DIZIN"
DOSYA="$YEDEK_DIZIN/$(date +%F_%H%M).sql.gz"

mysqldump --single-transaction --quick --routines "$DB_NAME" | gzip -9 > "$DOSYA"
find "$YEDEK_DIZIN" -type f -name '*.sql.gz' -mtime +14 -delete

if command -v rclone >/dev/null 2>&1; then
  rclone copy "$DOSYA" uzak:ugb-db/
fi

echo "yedek: $DOSYA"