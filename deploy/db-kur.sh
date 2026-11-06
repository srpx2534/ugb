#!/usr/bin/env bash
set -euo pipefail

: "${DB_NAME:=ugb}"
: "${DB_USER:=ugb_app}"
: "${DB_PASS:?DB_PASS gerekli (en az 16 karakter)}"
: "${APP_IP:?APP_IP gerekli}"

apt update
apt install -y mariadb-server fail2ban ufw

ufw default deny incoming
ufw allow 22/tcp
ufw allow from "$APP_IP" to any port 3306 proto tcp
ufw --force enable

cat >/etc/mysql/mariadb.conf.d/99-ugb.cnf <<CFG
[mysqld]
bind-address = 0.0.0.0
skip-name-resolve
local-infile = 0
max_connections = 200
max_connect_errors = 1000
innodb_buffer_pool_size = 1G
slow_query_log = 1
long_query_time = 0.5
CFG

systemctl restart mariadb

mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'$APP_IP' IDENTIFIED BY '$DB_PASS';
ALTER USER '$DB_USER'@'$APP_IP' WITH MAX_USER_CONNECTIONS 40;
GRANT ALL ON \`$DB_NAME\`.* TO '$DB_USER'@'$APP_IP';
FLUSH PRIVILEGES;
SQL

cat >/etc/fail2ban/jail.d/mariadb.local <<'JAIL'
[mariadb-auth]
enabled  = true
port     = 3306
filter   = mysqld-auth
logpath  = /var/log/mysql/error.log
maxretry = 5
bantime  = 3600
JAIL

systemctl restart fail2ban
echo "db hazir. migration'i uygulama sunucusundan calistir."