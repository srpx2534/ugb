#!/usr/bin/env bash
set -uo pipefail

NODE22="/tmp/node-v22.11.0-win-x64"
HATA=0

say() { printf '\n== %s\n' "$1"; }
kontrol() { if [ "$1" -eq 0 ]; then echo "  ok   $2"; else echo "  HATA $2"; HATA=$((HATA+1)); fi; }

if [ ! -x "$NODE22/node.exe" ]; then
  say "node 22 indiriliyor"
  curl -fsSL -o /tmp/node22.zip https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip
  kontrol $? "indirme"
  ( cd /tmp && unzip -qo node22.zip )
  kontrol $? "acma"
fi

say "surum"
"$NODE22/node.exe" -v
kontrol $? "node 22 calisiyor"

say "birim testleri"
"$NODE22/node.exe" node_modules/vitest/vitest.mjs run
kontrol $? "vitest"

say "kapi testleri"
"$NODE22/node.exe" scripts/kapi-test.mjs
kontrol $? "kapi"

say "kalite kapisi"
BASE=http://127.0.0.1:3001 HOST=hedefa.com "$NODE22/node.exe" scripts/dogrula.mjs
kontrol $? "dogrula"

say "amp dogrulama"
curl -fsS -H "Host: hedefa.com" -H "x-ugb-bot: 1" http://127.0.0.1:3001/ -o /tmp/makale.html
kontrol $? "makale indi"
"$NODE22/node.exe" node_modules/amphtml-validator/index.js /tmp/makale.html
kontrol $? "amphtml-validator"

say "tekrar kontrolu"
"$NODE22/node.exe" jobs/dupes.mjs
kontrol $? "dupes"

say "temizlik oncesi sayim"
"$NODE22/node.exe" scripts/sql.mjs "SELECT COUNT(*) AS crawl FROM crawl_log"
"$NODE22/node.exe" scripts/sql.mjs "SELECT COUNT(*) AS click FROM clicks"

say "temizlik"
"$NODE22/node.exe" jobs/temizle.mjs
kontrol $? "temizle"

say "temizlik sonrasi sayim"
"$NODE22/node.exe" scripts/sql.mjs "SELECT COUNT(*) AS crawl FROM crawl_log"
"$NODE22/node.exe" scripts/sql.mjs "SELECT COUNT(*) AS click FROM clicks"

printf '\n%s\n' "$([ "$HATA" -eq 0 ] && echo 'TUM ADIMLAR GECTI' || echo "$HATA ADIM HATALI")"
exit $([ "$HATA" -eq 0 ] && echo 0 || echo 1)