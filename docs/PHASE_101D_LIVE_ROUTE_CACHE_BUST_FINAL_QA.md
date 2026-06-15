# Phase 101D - Live Route Confirm, Cache Bust, Final Game Launch QA

## Purpose

Confirm that the public custom domain serves the current repository files and no longer serves the stale old game boot page.

## Live issue still present before this phase

The public route `/game/` was still serving the old boot output:

```text
Booting...
Logs Hands: ... BUILD: 20260314-P43
```

That proves the live host was not serving the current Phase 101A/Phase 260 game entry yet.

## Patch applied in this phase

### Root launch page

Updated `index.html` with:

- no-cache meta tags
- `data-build="PHASE-101D-LIVE-ROUTE-CACHE-BUST-LOCK"`
- cache-busted stylesheet links
- cache-busted script links
- cache-busted VR launch link:

```text
./game/index.html?v=phase101d-live-route-lock
```

### Route marker

Added:

```text
phase101d-live-route-marker.md
```

This gives a direct static file to verify whether the public host is serving the latest repository source.

## Validation targets

Open these routes after deploy/source correction:

```text
https://svrpoker.com/
https://svrpoker.com/phase101d-live-route-marker.md
https://svrpoker.com/game/
https://svrpoker.com/game/index.html?v=phase101d-live-route-lock
```

Expected:

- Root source contains `PHASE-101D-LIVE-ROUTE-CACHE-BUST-LOCK`.
- Marker file loads.
- Game entry contains `phase101_boot_load_screen_recovery.js`.
- Game entry contains `main.js`.
- Game entry does not show `BUILD: 20260314-P43`.

## If stale route remains

The remaining blocker is outside game code. Check:

```text
GitHub repo -> Settings -> Pages
```

Preferred:

```text
Source: GitHub Actions
Workflow: Auto Deploy
Custom domain: svrpoker.com
```

Fallback:

```text
Source: Deploy from branch
Branch: gh-pages
Folder: /root
Custom domain: svrpoker.com
```

If the public domain still serves old files after those settings are correct, check DNS/hosting provider because `svrpoker.com` may be pointed to an older host/CDN.

## Locked rule

This phase is route/cache verification only. It does not redesign the lobby, rebuild the site, alter Android movement, or add Unity-only logic.

## Commit name

Phase 101D - Live Route Confirm, Cache Bust, Final Game Launch QA
