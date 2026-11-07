#!/usr/bin/env bash
set -euo pipefail

: "${DB_NAME:=ugb}"
: "${DB_USER:=ugb_app}"
: "${DB_PASS:?DB_PASS gerekli (en az 16 karakter)}"
: "${APP_IPLER:?APP_IPLER gerekli (boslukla ayrilmis uygulama IP leri)}"

apt update
apt install -y mariadb-server fail2ban ufw

ufw default deny incoming
ufw allow 22/tcp
for ip in $APP_IPLER; do
  ufw allow from "$ip" to any port 3306 proto tcp
done
ufw --force enable

cat >/etc/mysql/mariadb.conf.d/99-ugb.cnf <<'CFG'
[mysqld]
bind-address = 0.0.0.0
skip-name-resolve
local-infile = 0
max_connections = 200
max_connect_errors = 1000
innodb_buffer_pool_size = 1G
slow_query_log = 1
long_query_time = 0.5
log_error = /var/log/mysql/error.log
CFG

install -d -o mysql -g adm -m 750 /var/log/mysql
systemctl restart mariadb

mysql -u root -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

for ip in $APP_IPLER; do
  mysql -u root -e "CREATE USER IF NOT EXISTS '$DB_USER'@'$ip' IDENTIFIED BY '$DB_PASS';"
  mysql -u root -e "ALTER USER '$DB_USER'@'$ip' WITH MAX_USER_CONNECTIONS 40;"
  mysql -u root -e "GRANT ALL ON \`$DB_NAME\`.* TO '$DB_USER'@'$ip';"
done

mysql -u root -e "FLUSH PRIVILEGES;"

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
echo "db hazir. migration'i is sunucusundan calistir."