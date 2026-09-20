# SVR Poker — IONOS VPS Runbook

This folder prepares an Ubuntu IONOS VPS to support svrpoker.com without changing the public game architecture.

## What this VPS is for

1. Run the SVR Node API behind Nginx.
2. Provide a staging/diagnostic host for Android, iPhone and Quest testing.
3. Run automated GLB/GLTF and texture audits/optimization jobs.
4. Pull approved SVR code from GitHub and restart services with one command.
5. Produce health logs so broken builds/assets are easier to isolate.
6. Leave AWS/PostgreSQL and production credentials external to GitHub.

This VPS is **not** a GPU Unity workstation. A small Linux VPS can optimize assets and host services, but Unity Editor/Quest graphical development still needs a GPU-capable workstation or cloud GPU later.

## Recommended starting size

For a low-cost SVR support box, target at least 2 vCPU / 4 GB RAM / 120 GB NVMe. 4 vCPU / 8 GB RAM is substantially better for asset processing.

The bootstrap script adds swap and works on smaller machines, but heavy Blender/Unity jobs are intentionally excluded.

## First install

From the IONOS browser console as root:

```bash
curl -fsSL https://raw.githubusercontent.com/makaveli60629/SVR/infra/ionos-vps-bootstrap/infra/ionos/bootstrap.sh -o /root/svr-bootstrap.sh
bash /root/svr-bootstrap.sh
```

The script installs Node.js, Nginx, Git, fail2ban, UFW, ffmpeg, ImageMagick and the glTF Transform CLI; clones SVR into `/opt/svr`; installs the API dependencies; and creates the systemd service.

## Secrets

The server creates `/etc/svr/api.env`. Never commit real passwords, JWT secrets, database URLs, or AWS keys to GitHub.

Required/typical values:

- `DATABASE_URL`
- `ADMIN_JWT_SECRET` (32+ characters)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ALLOWED_ORIGIN=https://svrpoker.com`
- AWS/S3 variables only if the API needs resource uploads

After secrets are filled in:

```bash
systemctl restart svr-api
systemctl status svr-api --no-pager
curl http://127.0.0.1:3000/api/health
```

## Domain

Use a separate subdomain such as `api.svrpoker.com` or `stage.svrpoker.com` pointed at the VPS IPv4 address. Then enable HTTPS with Certbot after DNS resolves.

## One-command update

```bash
sudo /opt/svr/infra/ionos/deploy.sh
```

That performs a fast-forward pull, installs locked dependencies when present, restarts the API, and checks local health.

## VR/graphics diagnostics

Run:

```bash
cd /opt/svr
infra/ionos/vr-asset-audit.sh .
```

The report flags oversized GLB/GLTF files, large textures, suspicious duplicate asset names, and total asset footprint.

To optimize a GLB/GLTF copy without overwriting the original:

```bash
infra/ionos/optimize-gltf.sh path/to/model.glb
```

The output goes beside the source as `*.optimized.glb`.

## Security baseline

- SSH is allowed through UFW.
- Web ports 80/443 are allowed.
- The Node API binds to localhost behind Nginx.
- fail2ban is enabled.
- Production secrets stay in `/etc/svr/api.env`.
- Do not open PostgreSQL directly to the public internet.

## Phase plan

**Phase 1 — VPS support node:** API, staging, health checks, asset audit.

**Phase 2 — Graphics cleanup:** identify oversized geometry/textures, compress GLB/GLTF assets, remove duplicate resources, test Quest budget.

**Phase 3 — Multiplayer services:** WebSocket/session services when the current client is stable.

**Phase 4 — GPU/Unity workstation:** move Unity Editor/build work to a GPU-capable machine while keeping this VPS as the persistent backend/control node.
