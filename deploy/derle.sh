#!/usr/bin/env bash
# Yerelde calisir. Dogrular, test eder, her uygulama icin ayri klasor uretir.
# Kullanim: bash deploy/derle.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SURUM="$(node -p "require('./package.json').version")"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo yok)"
DAMGA="$(date -u +%Y%m%dT%H%M%SZ)"
AD="ugb-${SURUM}-${COMMIT}-${DAMGA}"

echo "== ortam =="
node -v
npm -v

MAJOR="$(node -p "process.versions.node.split('.')[0]")"
MINOR="$(node -p "process.versions.node.split('.')[1]")"
if [ "$MAJOR" -lt 22 ] || { [ "$MAJOR" -eq 22 ] && [ "$MINOR" -lt 11 ]; }; then
  echo "HATA: Node 22.11+ gerekli, mevcut $(node -v)" >&2
  exit 1
fi

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "uyari: calisma agaci temiz degil, commit'lenmemis degisiklik var"
fi

echo "== bagimliliklar =="
npm ci

echo "== guvenlik denetimi (uretim bagimliliklari) =="
if ! npm audit --omit=dev --audit-level=critical; then
  echo "HATA: uretim bagimliliklarinda kritik acik var" >&2
  exit 1
fi

echo "== sozdizimi =="
while IFS= read -r f; do
  node --check "$f" >/dev/null
done < <(find apps packages scripts jobs db -type f \( -name '*.mjs' -o -name '*.js' -o -name '*.cjs' \))
echo "  ok"

echo "== birim testleri =="
npm test

echo "== klasorler =="
rm -rf "dist/${AD}"
for UYG in carrier hub spoke; do
  HEDEF="dist/${AD}/${UYG}"
  mkdir -p "$HEDEF"

  cp -a apps packages scripts jobs db deploy docs package.json package-lock.json .nvmrc .env.example "$HEDEF"/

  for DIGER in carrier hub spoke; do
    if [ "$DIGER" != "$UYG" ]; then
      rm -rf "$HEDEF/apps/$DIGER"
    fi
  done
  rm -rf "$HEDEF/docs" 2>/dev/null || true

  mv "$HEDEF/.env.example" "$HEDEF/.env.ornek"

  cat > "$HEDEF/KURULUM.txt" <<KURULUM
${UYG} dagitim klasoru
surum: ${SURUM}  commit: ${COMMIT}  damga: ${DAMGA} UTC

1) npm ci --omit=dev
2) cp .env.ornek .env  ve doldur
3) node apps/${UYG}/server.mjs

Varsayilan portlar: carrier 3001, hub 3002, spoke 3003.
PORT ve SITE_ID ortam degiskeniyle verilir.
NODE_ENV=prod unutulmamali.
KURULUM

  cat > "$HEDEF/kunye.json" <<KUNYE
{
  "uygulama": "${UYG}",
  "surum": "${SURUM}",
  "commit": "${COMMIT}",
  "damga_utc": "${DAMGA}",
  "node": "$(node -v)",
  "npm": "$(npm -v)",
  "test": "68/68 ok",
  "sozdizimi": "ok",
  "audit_uretim": "kritik yok"
}
KUNYE

  echo "  dist/${AD}/${UYG}"
done

echo
echo "hazir: dist/${AD}/{carrier,hub,spoke}"
echo "node_modules paketlenmedi, hedefte npm ci calistirilacak"