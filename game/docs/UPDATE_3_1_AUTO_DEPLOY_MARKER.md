# Phase 356 Auto Deploy Marker

## Build
`PHASE-356-ANDROID-REAL-DEVICE-FREEZE-RECOVERY-LOCK`

## Deploy targets
- Static website/game trigger: push to `main`
- Static workflow: `.github/workflows/deploy.yml`
- Phase 356 validation workflow: `.github/workflows/phase356-android-site-ai-check.yml`
- Android full-hand validation: `.github/workflows/phase354-android-full-game-acceptance.yml`

## Static runtime payload
- `game/android.html`
- `game/android-release.json`
- `game/manifest.json`
- `game/modules/phase340_platform_manifest.js`
- `game/modules/phase340_platform_core_loader.js`
- `game/modules/phase356_android_real_device_freeze_recovery_lock.js`
- `matrix.js`
- `support-chat-bot.js`
- `site/js/phase356-profile-legend-pedestal.js`
- `sw.js`
- Phase 356 tests, platform blueprint, and handoff manifest

## Android real-device freeze locks
- Phase 347 remains the only Android MOVE, LOOK, seated movement, and poker-action controller.
- Android shader `compileAsync` prewarming is disabled.
- Android deferred lobby, account, FBX-avatar, and presence modules are disabled during table play.
- Scene inspection is bounded to one startup pass capped at 240 nodes.
- Standard Android pixel ratio is capped at 1.0; recovery mode uses 0.78.
- Shadows remain disabled.
- Five lightweight table opponents replace background FBX avatar loading.
- Frame-gap and WebGL context-loss recovery are active.
- `Continue Low Power` and `Reload Table` controls are visible when recovery is required.
- Phase 336 poker rules, settlement, legal actions, cards, and NEXT HAND remain authoritative.

## Website presentation locks
- Matrix secret phrase bursts are delayed and staggered.
- Desktop phrase interval: 9 seconds.
- Touch/mobile phrase interval: 12 seconds.
- Reduced-motion phrase interval: 18 seconds.
- Profile showroom displays the local Eric FBX as a rotating `SVR LEGEND` on a professional pedestal.
- A procedural lightweight legend remains available if the FBX cannot load.

## AI support locks
- The website uses a full-height, scrollable, platform-aware support panel.
- Frontend route: `POST /api/ai/support`.
- Offline SVR knowledge remains available when the GPT backend is unavailable.
- Browser code contains no OpenAI secret.
- Production GPT requires `OPENAI_API_KEY` on the separately deployed Node backend.
- Static deployment does not deploy or configure the Node backend.

## Platform and Unity blueprint
- Android, Quest, desktop, Camera 3, website, profile, controls, poker authority, and recovery contracts are recorded in `docs/PHASE-356-PLATFORM-UNITY-BLUEPRINT.json`.
- Unity should consume the shared authorities and profile fields rather than duplicate page-specific logic.

## Runtime QA
```js
window.SVR_PHASE356_QA()
window.SVR_PHASE356_ENTER_LOW_POWER('manual-test')
window.SVR_PHASE347_QA?.()
window.SVR_PHASE356_PROFILE_LEGEND_QA?.()
window.SVR_PHASE340_AUDIT?.()
```

## Validation status
- Phase 345 Account API Check: passed
- Phase 346 Avatar Check: passed
- Phase 347 Android Check: passed
- Phase 348 Avatar Runtime Check: passed
- Phase 349 Presence Check: passed
- Phase 350 Site Integrity Check: passed
- Phase 351 Profile Showroom Check: passed
- Phase 353 VR Avatar Check: passed
- Phase 354 Android Full Game Acceptance: passed
- Phase 356 Android Site AI Check: passed
- Real owner-device Android acceptance: pending

## APK release gate
- Current APK: `0.1.0-rc1`, code `1`
- Reserved next APK: `0.1.0-rc2`, code `2`
- Signed native package present: false
- Native wrapper source/signing identity present: false
- `releaseReady`: false
- APK URL: empty
- Forced update: false
- Automatic update prompt: false
- Manual update only: true
- Phase 356 updates the remote stable web runtime used by the installed RC1 wrapper; it does not claim a newly signed APK.
