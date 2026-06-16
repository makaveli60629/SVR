# Phase 101E - Live Host Source Proof and Escalation

## Purpose

Create hard proof that the public custom domain is still serving a stale deploy while the repository contains the newer Phase 101/260 game entry.

## Live public finding

The public route currently serves an older game page:

```text
SVR Poker • Phase 247 Direct Deploy Route Verify Lock
Booting...
Logs Joints Hands: ... BUILD: PHASE-247-DIRECT-DEPLOY-ROUTE-VERIFY-LOCK
```

This means the domain is no longer on the very old `20260314-P43` output, but it is still stale and not serving the current Phase 101/260 source.

## Current repository expected game entry

The current repository game entry must include:

```text
phase101_boot_load_screen_recovery.js
phase101_partial_runtime_render_guard.js
phase101_render_marker_cleanup.js
main.js
phase260_roman_canopy_archway_final_lock.js
```

## Interpretation

This is not a game-code blocker anymore. It is a deployment-source or hosting-source mismatch.

Likely causes:

- GitHub Pages is not using the latest Actions artifact.
- GitHub Pages is pointed at an older branch/folder.
- `svrpoker.com` DNS is pointed to an older host/CDN.
- A cache layer is holding the Phase 247 build.

## Required manual check

Open:

```text
GitHub repo -> Settings -> Pages
```

Use one of these:

### Preferred

```text
Source: GitHub Actions
Workflow: Auto Deploy
Custom domain: svrpoker.com
```

### Fallback

```text
Source: Deploy from a branch
Branch: gh-pages
Folder: /root
Custom domain: svrpoker.com
```

## Proof route added previously

These marker files exist in the repository:

```text
/phase101d-live-route-marker.md
/docs/PHASE_101D_LIVE_ROUTE_CACHE_BUST_FINAL_QA.md
```

If `https://svrpoker.com/phase101d-live-route-marker.md` does not load publicly, then the public domain is not serving the latest repository source.

## Validation after Pages/DNS is corrected

Check:

```text
https://svrpoker.com/
https://svrpoker.com/phase101d-live-route-marker.md
https://svrpoker.com/game/
https://svrpoker.com/game/index.html?v=phase101d-live-route-lock
```

Expected:

- Root includes `PHASE-101D-LIVE-ROUTE-CACHE-BUST-LOCK`.
- Marker file loads.
- Game entry includes `phase101_boot_load_screen_recovery.js`.
- Game entry includes `main.js`.
- Game entry does not show Phase 247 or `20260314-P43`.

## Locked rule

No lobby redesign. No website rebuild. No Unity-only logic. This phase is deployment-source proof only.

## Next phase if still stale

```text
Phase 101F - DNS Host Audit and Custom Domain Cutover
```
