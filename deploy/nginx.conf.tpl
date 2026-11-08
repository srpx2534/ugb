server_tokens off;

# tasiyici: makale / decoy / reklam kapisi
server {
    listen 80;
    server_name {{CARRIER_HOSTLAR}};

    location / {
        proxy_pass http://127.0.0.1:{{CARRIER_PORT}};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_read_timeout 30s;
    }
}

# hub: portal, /l yonlendirici, admin
server {
    listen 80;
    server_name {{HUB_HOSTLAR}};

    location / {
        proxy_pass http://127.0.0.1:{{HUB_PORT}};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_read_timeout 30s;
    }
}

# spoke: uydu makale
server {
    listen 80;
    server_name {{SPOKE_HOSTLAR}};

    location / {
        proxy_pass http://127.0.0.1:{{SPOKE_PORT}};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_read_timeout 30s;
    }
}