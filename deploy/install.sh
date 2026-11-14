#!/usr/bin/env bash
# =====================================================================
#  Meena Shadi Rishtey (MSR) – one-command VPS installer / updater
#
#  Usage (as root on the VPS):
#     curl -fsSL https://raw.githubusercontent.com/ganeshrprajapati29/Meenashadirishtey/main/deploy/install.sh | bash
#  or, after cloning:   bash deploy/install.sh
#
#  SAFE FOR SHARED SERVERS – it does NOT touch existing apps:
#    • everything lives in /opt/msr (own Node.js runtime, own data folder)
#    • API runs as its own systemd service "msr-api" on 127.0.0.1:5055
#    • MongoDB runs in its own Docker container "msr-mongo" on 127.0.0.1:27027
#    • only ONE new nginx site file is added (/etc/nginx/sites-*/msr.conf)
#    • existing nginx sites, databases, pm2 apps, node versions are untouched
#  Run it again any time to update to the latest code.
# =====================================================================
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/ganeshrprajapati29/Meenashadirishtey.git}"
BRANCH="${BRANCH:-main}"
BASE=/opt/msr
APP="$BASE/app"
NODE_VERSION="${NODE_VERSION:-v20.18.1}"
API_PORT="${API_PORT:-5055}"
MONGO_PORT="${MONGO_PORT:-27027}"
PUBLIC_IP="${PUBLIC_IP:-$(curl -fsS4 https://api.ipify.org || hostname -I | awk '{print $1}')}"
DOMAIN="${DOMAIN:-msr.${PUBLIC_IP//./-}.sslip.io}"
SEED_DEMO="${SEED_DEMO:-true}"

c() { echo -e "\n\033[1;33m▶ $*\033[0m"; }
ok() { echo -e "\033[1;32m✔ $*\033[0m"; }
die() { echo -e "\033[1;31m✘ $*\033[0m"; exit 1; }

[ "$(id -u)" = "0" ] || die "Please run as root"
command -v apt-get >/dev/null || die "This installer supports Ubuntu/Debian (apt) only"

port_owner() { ss -ltnpH "sport = :$1" 2>/dev/null | sed -E 's/.*users:\(\("([^"]+)".*/\1/' | head -1; }

c "Domain: $DOMAIN  (IP $PUBLIC_IP)"

# ---------- pre-flight: make sure we don't collide with anything ----------
c "Checking ports"
for p in "$API_PORT" "$MONGO_PORT"; do
  owner="$(port_owner "$p")"
  if [ -n "$owner" ] && ! systemctl is-active --quiet msr-api 2>/dev/null && [ "$owner" != "docker-proxy" ]; then
    die "Port $p is already used by '$owner'. Re-run with API_PORT=xxxx MONGO_PORT=yyyy bash install.sh"
  fi
done
WEB_OWNER="$(port_owner 80 || true)"
if [ -n "$WEB_OWNER" ] && [ "$WEB_OWNER" != "nginx" ]; then
  die "Port 80 is served by '$WEB_OWNER' (not nginx). Add a reverse proxy for $DOMAIN → 127.0.0.1:$API_PORT manually (see deploy/README.md)."
fi
ok "Ports free"

# ---------- base packages (only installs what is missing) ----------
c "Installing missing system packages"
NEED=()
for pkg in git curl xz-utils ca-certificates; do dpkg -s "$pkg" >/dev/null 2>&1 || NEED+=("$pkg"); done
command -v nginx >/dev/null || NEED+=(nginx)
command -v certbot >/dev/null || NEED+=(certbot python3-certbot-nginx)
if [ ${#NEED[@]} -gt 0 ]; then
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y "${NEED[@]}"
fi
if ! command -v docker >/dev/null; then
  c "Installing Docker (for an isolated MongoDB)"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true
ok "System packages ready"

# ---------- private Node.js runtime (does not replace system node) ----------
mkdir -p "$BASE"
if [ ! -x "$BASE/node/bin/node" ] || [ "$("$BASE/node/bin/node" -v)" != "$NODE_VERSION" ]; then
  c "Installing private Node.js $NODE_VERSION in $BASE/node"
  ARCH=$(uname -m); case "$ARCH" in x86_64) NARCH=x64;; aarch64) NARCH=arm64;; *) die "Unsupported CPU $ARCH";; esac
  rm -rf "$BASE/node" && mkdir -p "$BASE/node"
  curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-$NARCH.tar.xz" | tar -xJ -C "$BASE/node" --strip-components=1
fi
export PATH="$BASE/node/bin:$PATH"
ok "Node $(node -v)"

# ---------- code ----------
if [ -d "$APP/.git" ]; then
  c "Updating code"
  git -C "$APP" fetch --depth 1 origin "$BRANCH"
  git -C "$APP" reset --hard "origin/$BRANCH"
else
  c "Cloning code (if the repo is private, enter your GitHub username + Personal Access Token)"
  git clone --depth 1 -b "$BRANCH" "$REPO_URL" "$APP"
fi
ok "Code at $(git -C "$APP" log -1 --format='%h %s')"

# ---------- MongoDB (isolated container) ----------
c "Starting MongoDB container msr-mongo on 127.0.0.1:$MONGO_PORT"
mkdir -p "$BASE/mongo-data"
if ! docker ps -a --format '{{.Names}}' | grep -qx msr-mongo; then
  MONGO_IMAGE=mongo:7
  # MongoDB 5+ needs AVX; fall back to 4.4 on older CPUs
  grep -qw avx /proc/cpuinfo || MONGO_IMAGE=mongo:4.4
  docker run -d --name msr-mongo --restart unless-stopped \
    -p 127.0.0.1:"$MONGO_PORT":27017 -v "$BASE/mongo-data":/data/db "$MONGO_IMAGE" >/dev/null
fi
docker start msr-mongo >/dev/null
for i in $(seq 1 30); do
  docker exec msr-mongo sh -c 'mongosh --quiet --eval "db.runCommand({ping:1})" || mongo --quiet --eval "db.runCommand({ping:1})"' >/dev/null 2>&1 && break
  sleep 2
done
ok "MongoDB running"

# ---------- backend ----------
c "Installing backend"
cd "$APP/backend"
if [ ! -f "$BASE/backend.env" ]; then
  JWT=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 64)
  ADMIN_PW="Msr@$(head -c 6 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 8)"
  cat > "$BASE/backend.env" <<ENV
NODE_ENV=production
PORT=$API_PORT
CLIENT_URL=https://$DOMAIN,http://$DOMAIN
MONGO_URI=mongodb://127.0.0.1:$MONGO_PORT/meenashadirishtey
JWT_SECRET=$JWT
JWT_EXPIRES_IN=30d
OTP_MODE=screen
SMS_PROVIDER=msg91
SMS_API_KEY=
SMS_SENDER_ID=MSRSHD
SMS_TEMPLATE_ID=
ADMIN_EMAIL=admin@meenashadirishtey.com
ADMIN_PASSWORD=$ADMIN_PW
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
UPLOAD_DIR=$BASE/uploads
ENV
  chmod 600 "$BASE/backend.env"
  FIRST_INSTALL=true
fi
mkdir -p "$BASE/uploads"
ln -sf "$BASE/backend.env" "$APP/backend/.env"
# uploads live outside the repo so updates never delete photos
sed -i "s#^UPLOAD_DIR=.*#UPLOAD_DIR=$BASE/uploads#" "$BASE/backend.env"
npm ci --omit=dev --no-audit --no-fund
if [ "${FIRST_INSTALL:-false}" = "true" ]; then
  if [ "$SEED_DEMO" = "true" ]; then node src/seed.js --demo; else node src/seed.js; fi
else
  node src/seed.js
fi
ok "Backend ready"

# ---------- website ----------
c "Building website"
cd "$APP/web"
npm ci --no-audit --no-fund
npm run build
ok "Website built"

# ---------- systemd service ----------
c "Configuring systemd service msr-api"
cat > /etc/systemd/system/msr-api.service <<UNIT
[Unit]
Description=Meena Shadi Rishtey API
After=network.target docker.service

[Service]
Type=simple
WorkingDirectory=$APP/backend
ExecStart=$BASE/node/bin/node src/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
StandardOutput=append:$BASE/api.log
StandardError=append:$BASE/api.log

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable msr-api >/dev/null 2>&1
systemctl restart msr-api
sleep 3
curl -fsS "http://127.0.0.1:$API_PORT/api/health" >/dev/null || { tail -30 "$BASE/api.log"; die "API did not start"; }
ok "API running on 127.0.0.1:$API_PORT"

# ---------- nginx (new site only) ----------
c "Configuring nginx site for $DOMAIN"
if [ -d /etc/nginx/sites-available ]; then
  CONF=/etc/nginx/sites-available/msr.conf; LINK=/etc/nginx/sites-enabled/msr.conf
else
  CONF=/etc/nginx/conf.d/msr.conf; LINK=""
fi
HAS_CERT=false
[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && HAS_CERT=true

LOCATIONS=$(cat <<LOC
    root $APP/web/dist;
    index index.html;
    client_max_body_size 25m;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /socket.io/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 3600s;
    }
    location /uploads/ {
        alias $BASE/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
    location / {
        try_files \$uri \$uri/ /index.html;
    }
LOC
)
if $HAS_CERT; then
  cat > "$CONF" <<NGX
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
$LOCATIONS
}
NGX
else
  cat > "$CONF" <<NGX
server {
    listen 80;
    server_name $DOMAIN;
$LOCATIONS
}
NGX
fi
[ -n "$LINK" ] && ln -sf "$CONF" "$LINK"
if ! nginx -t 2>/tmp/msr-nginx-test; then
  cat /tmp/msr-nginx-test
  rm -f "$CONF" ${LINK:+"$LINK"}
  die "nginx config test failed – removed msr.conf, nothing else was changed"
fi
systemctl enable nginx >/dev/null 2>&1 || true
systemctl reload nginx 2>/dev/null || systemctl start nginx
ok "nginx site added"

# open firewall only if ufw is active
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
fi

# ---------- SSL ----------
if ! $HAS_CERT; then
  c "Requesting free SSL certificate (Let's Encrypt)"
  if certbot certonly --webroot -w "$APP/web/dist" -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email; then
    ok "Certificate issued – re-running nginx step with HTTPS"
    exec bash "$APP/deploy/install.sh"
  else
    echo "⚠ SSL could not be issued right now; site works on http://$DOMAIN . Re-run this script later to retry."
  fi
fi

SCHEME=http; [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ] && SCHEME=https
echo
echo "=============================================================="
echo "  🎉  Meena Shadi Rishtey is live!"
echo "  Website : $SCHEME://$DOMAIN"
echo "  Admin   : $SCHEME://$DOMAIN/admin"
echo "            email    : $(grep ^ADMIN_EMAIL "$BASE/backend.env" | cut -d= -f2)"
echo "            password : $(grep ^ADMIN_PASSWORD "$BASE/backend.env" | cut -d= -f2)"
echo "  API     : $SCHEME://$DOMAIN/api/health"
echo "  Logs    : tail -f $BASE/api.log"
echo "  Config  : $BASE/backend.env   (then: systemctl restart msr-api)"
echo "=============================================================="
