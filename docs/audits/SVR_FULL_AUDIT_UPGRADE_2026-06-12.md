# SVR Full Audit + Upgrade Manifest

**Build:** `PHASE-1.7.4-FULL-AUDIT-SITE-GAME-DATA-LOCK`
**Date:** 2026-06-12T13:08:08.5340399-05:00
**Repo:** `C:\Users\ronal\SVR`

## Passes
- PASS: Folder exists: /game
- PASS: Folder exists: /site
- PASS: Folder exists: /update
- PASS: Workflow has manual Run workflow trigger
- PASS: Workflow references update/game.zip
- PASS: Workflow normalizes zip permissions
- PASS: Workflow has Node 24 env flag
- PASS: Site file exists: \index.html
- PASS: Site file exists: \site\index.html
- PASS: Android page exists: /site/android/
- PASS: Game boot file exists: /game/index.html
- PASS: JavaScript syntax passed for 78 files under 2MB
- PASS: Backend folder exists
- PASS: SQL folder exists

## Warnings
- WARN: APK file missing: direct APK download will 404 until APK is built and committed
- WARN: backend/.env exists locally; verify it is not committed

## Failures
- None

## Fixes
- FIXED: Created backup: C:\Users\ronal\SVR\_svr_local_backups\before-full-audit-1.7.4-20260612-130716
- FIXED: Rewrote deploy workflow with zip overlay, permission normalization, deploy health, and Node 24 flag
- FIXED: Added Android APK button to \index.html
- FIXED: Added Android APK button to \site\index.html
- FIXED: Created APK, downloads, RICI, and typo-redirect site routes
- FIXED: Injected non-destructive game audit guard
- FIXED: Synchronized game/version.json, game/docs/BUILD_VERSION.json, and update/version.json
- FIXED: Added .gitignore protection: backend/.env
- FIXED: Added .gitignore protection: *.jks
- FIXED: Added .gitignore protection: *.keystore
- FIXED: Added .gitignore protection: android/keystores/
- FIXED: Added .gitignore protection: _svr_local_backups/
- FIXED: Wrote /site/data/svr-audit-status.json
- FIXED: Rebuilt update/game.zip from /game with index.html at zip root; size 22068106 bytes
- FIXED: Rebuilt root site.zip and update/site.zip

## Locked rules
- Playable poker first.
- Lobby remains storefront portals only.
- Private rooms contain full experiences.
- Quest controller fallback preserved.
- Android/mobile fallback preserved.
- No frontend secrets.
- update/game.zip must stay under 25 MB.
- Keep /game and /update/game.zip synchronized.

## Test URLs
- https://svrpoker.com/?v=full-audit-174
- https://svrpoker.com/site/?v=full-audit-174
- https://svrpoker.com/site/android/?v=full-audit-174
- https://svrpoker.com/site/downloads/svr-poker-demo.apk
- https://svrpoker.com/site/presentations/rici/?v=full-audit-174
- https://svrpoker.com/game/?v=full-audit-174
- https://svrpoker.com/game/deploy-health.json?v=full-audit-174
