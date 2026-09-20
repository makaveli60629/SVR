#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash $0"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "[SVR] Updating Ubuntu packages..."
apt-get update
apt-get -y upgrade
apt-get install -y ca-certificates curl git nginx ufw fail2ban unzip jq ffmpeg imagemagick build-essential

if ! command -v node >/dev/null 2>&1; then
  echo "[SVR] Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if [[ ! -f /swapfile ]]; then
  echo "[SVR] Adding 2 GB swap for low-memory VPS stability..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "[SVR] Firewall + fail2ban..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
systemctl enable --now fail2ban nginx

if ! command -v gltf-transform >/dev/null 2>&1; then
  npm install -g @gltf-transform/cli
fi

if [[ ! -d /opt/svr/.git ]]; then
  echo "[SVR] Cloning SVR..."
  git clone --depth 1 https://github.com/makaveli60629/SVR.git /opt/svr
else
  echo "[SVR] Existing /opt/svr repository found."
fi

cd /opt/svr/api
if [[ -f package-lock.json ]]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

mkdir -p /etc/svr
chmod 700 /etc/svr
if [[ ! -f /etc/svr/api.env ]]; then
  cp /opt/svr/infra/ionos/api.env.example /etc/svr/api.env
  chmod 600 /etc/svr/api.env
fi

install -m 0644 /opt/svr/infra/ionos/svr-api.service /etc/systemd/system/svr-api.service
install -m 0644 /opt/svr/infra/ionos/nginx-svr.conf /etc/nginx/sites-available/svr-api
ln -sf /etc/nginx/sites-available/svr-api /etc/nginx/sites-enabled/svr-api
rm -f /etc/nginx/sites-enabled/default
nginx -t

systemctl daemon-reload
systemctl enable svr-api
systemctl restart nginx

echo
echo "[SVR] Bootstrap complete."
echo "[SVR] NEXT: edit /etc/svr/api.env with the real secrets, then run:"
echo "      systemctl restart svr-api"
echo "      curl http://127.0.0.1:3000/api/health"
echo
echo "[SVR] Server:"
node --version
npm --version
free -h
df -h /
