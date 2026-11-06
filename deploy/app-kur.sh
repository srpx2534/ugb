#!/usr/bin/env bash
set -euo pipefail

: "${DB_HOST:?DB_HOST gerekli}"
: "${DB_USER:=ugb_app}"
: "${DB_PASS:?DB_PASS gerekli}"
: "${DB_NAME:=ugb}"
: "${HUB_URL:?HUB_URL gerekli}"

apt update
apt install -y curl ufw nginx certbot python3-certbot-nginx

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm i -g pm2

ufw default deny incoming
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /srv/ugb
cat >/srv/ugb/.env <<ENV
NODE_ENV=prod
DB_HOST=$DB_HOST
DB_PORT=3306
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_POOL=10
HOSTMAP_TTL_MS=60000
TRUST_PROXY=true
BOT_ZORLA=0
LOG_SEVIYE=info
HUB_URL=$HUB_URL
ADMIN_PAROLA=${ADMIN_PAROLA:-degistir-bu-parolayi}
ENV
chmod 600 /srv/ugb/.env

echo "kod /srv/ugb altina alinmali, sonra:"
echo "  cd /srv/ugb && npm ci && npm run migrate"
echo "  pm2 start deploy/ecosystem.cjs && pm2 save"