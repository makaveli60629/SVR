# Phase 101D Live Route Marker

Build: PHASE-101D-LIVE-ROUTE-CACHE-BUST-FINAL-QA

Purpose: verify that the public host is serving the current repository source and not the stale 20260314-P43 boot page.

Expected public route checks:

- `/` should include `PHASE-101D-LIVE-ROUTE-CACHE-BUST-LOCK` in the body data-build attribute.
- `/game/index.html` should include `phase101_boot_load_screen_recovery.js`.
- `/game/index.html` should include `main.js`.
- `/game/index.html` should not show `BUILD: 20260314-P43`.

Locked rule: route/cache verification only. No lobby redesign. No website rebuild. No Unity-only logic.
