# Phase 383 — Full Site Homepage Restore

## Root cause

The Android/Quest recovery page replaced `site/index.html`, so the public **Preview Site** button opened a stripped platform/download screen instead of the complete SVR Poker website.

## Restored homepage

- Premium SVR market navigation and visual banner slider
- Live lobby director preview
- Android stable play and APK RC2 access
- Quest/VR launch with the Phase 381 runtime preserved
- Player profile and Eric dressing room
- Store, tournaments, membership, sponsorship, advertising and billboards
- Community impact, project updates, about, registration and contact/support
- Server, game and APK status meters
- Local SVR AI concierge
- Mobile quick-action dock

## Protected baselines

- Public Matrix launch page design remains intact.
- Android remains Phase 380 / APK RC2 with no forced update.
- Quest remains Phase 381 with original-table-first authority, Eric dealer work, seated movement lock, overlay cleanup and audio fallback.
- Terminated partner names and material are not restored on the homepage.
- Phase 383 rolls browser and PWA caches so the stripped recovery screen is not served again.

## Production proof

`deploy-health.json` publishes `PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK` with `fullWebsiteRestored: true` and individual homepage restoration flags.
