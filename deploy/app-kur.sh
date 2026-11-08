#!/usr/bin/env bash
set -euo pipefail

: "${DB_HOST:?DB_HOST gerekli}"
: "${DB_USER:=ugb_app}"
: "${DB_PASS:?DB_PASS gerekli}"
: "${DB_NAME:=ugb}"
: "${DB_PORT:=3306}"
: "${HUB_URL:?HUB_URL gerekli}"
: "${HUB_HOST:?HUB_HOST gerekli}"
: "${ADMIN_PAROLA:?ADMIN_PAROLA gerekli}"
: "${HASH_TUZU:?HASH_TUZU gerekli (openssl rand -hex 16)}"
: "${CARRIER_HOSTLAR:?CARRIER_HOSTLAR gerekli (boslukla ayrilmis)}"
: "${HUB_HOSTLAR:?HUB_HOSTLAR gerekli}"
: "${SPOKE_HOSTLAR:?SPOKE_HOSTLAR gerekli}"
: "${CARRIER_PORT:=3001}"
: "${HUB_PORT:=3002}"
: "${SPOKE_PORT:=3003}"

apt update
apt install -y curl ufw nginx certbot python3-certbot-nginx logrotate

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm i -g pm2

ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

install -d -m 755 /srv/ugb

# Parola ve adresler tirnaklanir: bosluk, $ veya # iceren deger .env'i bozmaz.
cat >/srv/ugb/.env <<ENV
NODE_ENV=prod
SITE_ID=1
DB_HOST=$(printf '%q' "$DB_HOST")
DB_PORT=$DB_PORT
DB_NAME=$(printf '%q' "$DB_NAME")
DB_USER=$(printf '%q' "$DB_USER")
DB_PASS=$(printf '%q' "$DB_PASS")
DB_POOL=10
DB_QUEUE_LIMIT=40
HOSTMAP_TTL_MS=60000
TRUST_PROXY=true
DINLEME_HOST=127.0.0.1
BOT_ZORLA=0
LOG_SEVIYE=info
HUB_HOST=$(printf '%q' "$HUB_HOST")
HUB_URL=$(printf '%q' "$HUB_URL")
ADMIN_PAROLA=$(printf '%q' "$ADMIN_PAROLA")
HASH_TUZU=$(printf '%q' "$HASH_TUZU")
HUB_HTTPS_ZORLA=1
HUB_API_KORU=1
CARRIER_PORT=$CARRIER_PORT
HUB_PORT=$HUB_PORT
SPOKE_PORT=$SPOKE_PORT
ENV
chmod 600 /srv/ugb/.env

echo "kod /srv/ugb altina alinmali, sonra bu betik ikinci kez calistirilir."
if [ ! -f /srv/ugb/package.json ]; then
  echo "package.json yok, kod kopyalandiktan sonra tekrar calistir."
  exit 0
fi

cd /srv/ugb
npm ci --omit=dev

# cwd'deki .env kok .env'i eziyor, uygulama altinda .env birakma
rm -f apps/*/.env

# sablonu bloklar ve portlarla doldur
sed \
  -e "s|{{CARRIER_HOSTLAR}}|$CARRIER_HOSTLAR|" \
  -e "s|{{HUB_HOSTLAR}}|$HUB_HOSTLAR|" \
  -e "s|{{SPOKE_HOSTLAR}}|$SPOKE_HOSTLAR|" \
  -e "s|{{CARRIER_PORT}}|$CARRIER_PORT|" \
  -e "s|{{HUB_PORT}}|$HUB_PORT|" \
  -e "s|{{SPOKE_PORT}}|$SPOKE_PORT|" \
  deploy/nginx.conf.tpl >/etc/nginx/sites-available/ugb

ln -sf /etc/nginx/sites-available/ugb /etc/nginx/sites-enabled/ugb
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# migration prod'da --evet ister
npm run migrate -- --evet

pm2 start deploy/ecosystem.cjs
pm2 startup systemd -u root --hp /root
pm2 save

cat >/etc/logrotate.d/pm2-root <<'LR'
/root/.pm2/logs/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    copytruncate
}
LR

echo "uygulama ayakta. TLS icin:"
for h in $CARRIER_HOSTLAR $HUB_HOSTLAR $SPOKE_HOSTLAR; do
  echo "  certbot --nginx -d $h"
done