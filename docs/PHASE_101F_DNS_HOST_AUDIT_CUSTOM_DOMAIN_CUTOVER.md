# Phase 101F - DNS Host Audit and Custom Domain Cutover

## Purpose

Escalate the stale public route from a game-runtime issue to a DNS/Pages/hosting-source issue.

## Current public evidence

The public root is not serving the current repository root. It shows older launch copy such as `Admin Offline` and `Preview Game`.

The public `/game/` route is not serving the current Phase 101/260 entry. It shows old boot output such as:

```text
Booting...
Logs Hands: ... BUILD: 20260314-P43
```

A `www.svrpoker.com` check can show a different SVR landing layout, which suggests host/cache inconsistency.

## Current repository expected state

The repository game entry includes:

```text
phase101_boot_load_screen_recovery.js
phase101_partial_runtime_render_guard.js
phase101_render_marker_cleanup.js
main.js
phase260_roman_canopy_archway_final_lock.js
```

## GitHub issue opened

Issue:

```text
#103 - Phase 101F - DNS host audit and custom domain cutover for stale svrpoker.com route
```

Labels:

```text
deployment
github-pages
dns
phase-101f
```

## Required GitHub Pages check

Open:

```text
GitHub repo -> Settings -> Pages
```

Preferred setting:

```text
Source: GitHub Actions
Workflow: Auto Deploy
Custom domain: svrpoker.com
```

Fallback setting:

```text
Source: Deploy from branch
Branch: gh-pages
Folder: /root
Custom domain: svrpoker.com
```

## DNS cutover checklist

If GitHub Pages settings are correct but the stale host remains:

- Check the DNS provider for `svrpoker.com`.
- Confirm the apex/root domain points to GitHub Pages if GitHub Pages is the intended host.
- Confirm `www.svrpoker.com` points to the intended GitHub Pages hostname.
- Remove old A/CNAME records that point to stale hosting.
- Clear CDN cache if Cloudflare, GoDaddy forwarding, AWS CloudFront, or another CDN is in front.
- Recheck `/phase101d-live-route-marker.md` and `/phase101e-live-host-source-proof.md`.

## Final validation routes

```text
https://svrpoker.com/
https://svrpoker.com/phase101d-live-route-marker.md
https://svrpoker.com/phase101e-live-host-source-proof.md
https://svrpoker.com/game/index.html?v=phase101d-live-route-lock
```

## Expected final result

- Root shows current Phase 101D marker or current launch source.
- Marker file loads.
- Game entry includes Phase 101 boot recovery modules and `main.js`.
- Game does not show `BUILD: 20260314-P43`.
- Game does not show `PHASE-247-DIRECT-DEPLOY-ROUTE-VERIFY-LOCK`.

## Locked rule

This phase does not modify gameplay, lobby geometry, Android movement, sponsor content, or Unity logic.

## Next phase

```text
Phase 101G - Post-Cutover Quest WebXR Smoke Test
```
