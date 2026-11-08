#!/usr/bin/env bash
# Dikeyi degistirir, kalan dikey bagimli yerleri raporlar.
# Kullanim: bash scripts/dikey-degistir.sh <bonus|canli-mac>
set -euo pipefail
cd "$(dirname "$0")/.."

YENI="${1:-}"
case "$YENI" in
  bonus|canli-mac) ;;
  *) echo "kullanim: bash scripts/dikey-degistir.sh <bonus|canli-mac>" >&2; exit 1 ;;
esac

if [ ! -f packages/core/dikey.mjs ]; then
  echo "HATA: packages/core/dikey.mjs yok" >&2
  exit 1
fi

# .env yoksa olusturulur; grep -q set -e altinda patlamasin
[ -f .env ] || : >.env

if grep -q '^DIKEY=' .env; then
  sed -i "s/^DIKEY=.*/DIKEY=${YENI}/" .env
else
  printf 'DIKEY=%s\n' "$YENI" >> .env
fi

[ -f .env.example ] || : >.env.example
if grep -q '^DIKEY=' .env.example; then
  sed -i "s/^DIKEY=.*/DIKEY=${YENI}/" .env.example
else
  printf 'DIKEY=%s\n' "$YENI" >> .env.example
fi
grep -n '^DIKEY=' .env

echo
echo "== dikey disi kalan metinler =="
case "$YENI" in
  canli-mac) KELIMELER='bonus|bahis|çevrim|casino|kumar|yatik' ;;
  bonus)  KELIMELER='taraftarium24|Maç Yayını|Kupon|Canlı' ;;
esac

grep -rnE "$KELIMELER" \
  --include='*.mjs' --include='*.md' --include='*.sql' --include='*.sh' \
  packages apps scripts db docs 2>/dev/null \
  | grep -v 'packages/core/dikey.mjs' \
  | grep -v 'node_modules' \
  || echo "  (temiz)"

echo
echo "DIKEY=${YENI} yazildi. Sunucuyu yeniden baslat, sonra:"
echo "  npm test && npm run dogrula"