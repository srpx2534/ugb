#!/usr/bin/env bash
set -euo pipefail

: "${DB_HOST:?DB_HOST gerekli}"
: "${DB_USER:=ugb_app}"
: "${DB_PASS:?DB_PASS gerekli}"
: "${DB_NAME:=ugb}"
: "${HUB_URL:?HUB_URL gerekli}"
: "${CARRIER_HOSTLAR:?CARRIER_HOSTLAR gerekli (boslukla ayrilmis)}"
: "${HUB_HOSTLAR:?HUB_HOSTLAR gerekli}"
: "${SPOKE_HOSTLAR:?SPOKE_HOSTLAR gerekli}"

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

cat >/srv/ugb/.env <<ENV
NODE_ENV=prod
SITE_ID=1
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
HUB_HOST=$(echo "$HUB_HOSTLAR" | awk '{print $1}')
HUB_URL=$HUB_URL
ADMIN_PAROLA=${ADMIN_PAROLA:?ADMIN_PAROLA gerekli}
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

# sablonu uc blok halinde doldur
sed \
  -e "s|{{CARRIER_HOSTLAR}}|$CARRIER_HOSTLAR|" \
  -e "s|{{HUB_HOSTLAR}}|$HUB_HOSTLAR|" \
  -e "s|{{SPOKE_HOSTLAR}}|$SPOKE_HOSTLAR|" \
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