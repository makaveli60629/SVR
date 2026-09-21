#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo $0"
  exit 1
fi

cd /opt/svr

echo "[SVR] Pulling approved main branch..."
git fetch origin main
git checkout main
git pull --ff-only origin main

echo "[SVR] Installing API dependencies..."
cd /opt/svr/api
if [[ -f package-lock.json ]]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

echo "[SVR] Restarting API..."
systemctl daemon-reload
systemctl restart svr-api
sleep 2

echo "[SVR] Health check..."
if curl -fsS http://127.0.0.1:3000/api/health >/tmp/svr-health.json; then
  cat /tmp/svr-health.json
  echo
  echo "[SVR] Deploy healthy."
else
  echo "[SVR] Health endpoint failed. Recent logs:"
  journalctl -u svr-api -n 80 --no-pager
  exit 1
fi
