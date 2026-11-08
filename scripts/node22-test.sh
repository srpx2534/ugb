#!/usr/bin/env bash
set -uo pipefail

V22="v22.11.0"
HATA=0

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) OS=win; EXT=.exe ;;
  *) OS=linux; EXT= ;;
esac

if [ "$OS" = "win" ]; then
  ARSIV="node-${V22}-win-x64.zip"
  DIZIN="/tmp/node-${V22}-win-x64"
  NODE="$DIZIN/node.exe"
else
  ARSIV="node-${V22}-linux-x64.tar.xz"
  DIZIN="/tmp/node-${V22}-linux-x64"
  NODE="$DIZIN/bin/node"
fi

say() { printf '\n== %s\n' "$1"; }
kontrol() { if [ "$1" -eq 0 ]; then echo "  ok   $2"; else echo "  HATA $2"; HATA=$((HATA+1)); fi; }

if [ ! -x "$NODE" ]; then
  say "node 22 indiriliyor"
  curl -fsSL -o "/tmp/node22.arsiv" "https://nodejs.org/dist/${V22}/${ARSIV}"
  kontrol $? "indirme"
  if [ "$OS" = "win" ]; then
    ( cd /tmp && unzip -qo node22.arsiv )
  else
    ( cd /tmp && tar -xf node22.arsiv )
  fi
  kontrol $? "acma"
fi

say "surum"
"$NODE" -v
kontrol $? "node 22 calisiyor"

say "birim testleri"
"$NODE" node_modules/vitest/vitest.mjs run
kontrol $? "vitest"

say "kapi testleri"
"$NODE" scripts/kapi-test.mjs
kontrol $? "kapi"

say "kalite kapisi"
BASE=http://127.0.0.1:3001 HOST=hedefa.com "$NODE" scripts/dogrula.mjs
kontrol $? "dogrula"

say "amp dogrulama"
curl -fsS -H "Host: hedefa.com" -H "x-ugb-bot: 1" http://127.0.0.1:3001/ -o /tmp/makale.html
kontrol $? "makale indi"
"$NODE" node_modules/amphtml-validator/index.js /tmp/makale.html
kontrol $? "amphtml-validator"

say "tekrar kontrolu"
"$NODE" jobs/dupes.mjs
kontrol $? "dupes"

say "temizlik oncesi sayim"
"$NODE" scripts/sql.mjs "SELECT COUNT(*) AS crawl FROM crawl_log"
"$NODE" scripts/sql.mjs "SELECT COUNT(*) AS click FROM clicks"

say "temizlik"
"$NODE" jobs/temizle.mjs
kontrol $? "temizle"

say "temizlik sonrasi sayim"
"$NODE" scripts/sql.mjs "SELECT COUNT(*) AS crawl FROM crawl_log"
"$NODE" scripts/sql.mjs "SELECT COUNT(*) AS click FROM clicks"

printf '\n%s\n' "$([ "$HATA" -eq 0 ] && echo 'TUM ADIMLAR GECTI' || echo "$HATA ADIM HATALI")"
exit $([ "$HATA" -eq 0 ] && echo 0 || echo 1)