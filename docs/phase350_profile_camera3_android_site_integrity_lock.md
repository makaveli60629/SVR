# Phase 350 — Profile, Camera 3, Android, and Website Integrity

Build: `PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK`

## User-reported defects resolved

1. Profile avatar preview can no longer remain blank indefinitely. It paints an immediate fallback, bounds all 3D loading steps, exposes status, and offers retry.
2. Camera 3 has a dedicated spectator lighting/exposure authority rather than relying on lobby lighting removed by the lightweight route.
3. Android physically removes legacy controller roots and external virtual sticks, preserving one Phase 347 controller.
4. Canonical site pages and local navigation are audited by CI.
5. A public website roadmap establishes the ordered next major milestones.

## Canonical website roadmap

- Phase 351: production account/database deployment
- Phase 352: live presence and social lobby
- Phase 353: store, inventory, and content publishing
- Phase 354: server-authoritative poker rooms
- Phase 355: signed Android APK RC2
- Phase 356: shared Unity migration blueprint

## Release truth

Phase 350 is a web-runtime and website release. APK RC1 remains installed-policy authority and RC2 remains blocked by the missing original wrapper/signing identity.
