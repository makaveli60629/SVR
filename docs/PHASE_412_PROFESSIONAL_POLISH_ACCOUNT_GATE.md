# Phase 412 — Professional Polish + Tournament Account Gate

## Scope
Phase 412 begins the professional mobile polish pass without changing the protected Phase 403 poker engine, Phase 398 betting rules, Quest Phase 396 gameplay, the RC2 APK policy, or the public page structure.

## Tournament access
- Practice remains available to Guest 1.
- Tournament entry requires a player identity.
- The tournament portal defaults to `LOGIN / CREATE ACCOUNT TO ENTER`.
- The tournament gameplay route is guarded too, so a direct URL cannot bypass the requirement.
- A generic Guest 1 or ordinary Demo Player session does **not** qualify for tournament entry.
- Before the approved AWS player API is live, the player must explicitly create a named **Local Tournament Test Account** from the account page. The test-account record is tied to that local profile ID.
- Once the approved API is configured and healthy, local test identity no longer passes; only the production API/Cognito account path is tournament-eligible.
- No purchase is required for tournament identity creation.

## Professional polish foundation
- Consistent touch feedback on action buttons.
- Minimum mobile touch target sizing.
- Focus-visible keyboard/accessibility treatment.
- Reduced-motion support.
- `YOUR DECISION` / `OPPONENT THINKING` / `HAND COMPLETE` status cue.
- Online/offline/local-test connectivity pill.
- Winner banner settle animation and light haptic feedback where supported.
- Phase 412 cache epoch and service-worker refresh.

## Protected systems
- Phase 403 poker engine and side pots unchanged.
- Phase 402 physical seat order unchanged.
- Phase 398 raise/call rules unchanged.
- Phase 404 ALL IN safety unchanged.
- Phase 411 100-player local tournament rotation and bot independence remain underneath the new gate.
- Quest remains Phase 396.
- APK remains `0.1.0-rc2`, version code `2`, manual-only, with no forced update and no native rebuild.
- Root public `index.html` is not modified.

## User-supplied professional/WebXR concepts accepted for adaptation
The following concepts are useful and should be adapted to the existing modular WebXR/Three.js runtime rather than pasted as a second A-Frame architecture:
- tactile hole-card peek/bend interaction;
- pinch/grab/toss gestures for cards and chips;
- Quest haptic feedback for dealing, chip pickup and betting;
- clear 3D active-player halo and winning-hand presentation;
- spatial voice visualization anchored to player seats once a real remote peer stream exists;
- player portrait compression before profile persistence/sync;
- KTX2/WebP asset optimization and mobile texture budgets.

The supplied hard-coded table heights (`0.75m` felt / `0.78m` rail) are not authoritative for the current SVR table and must not replace current table calibration. New tactile interaction modules must derive felt/rail surfaces from the loaded SVR table calibration.

## Existing features not to duplicate
- VOX already uses `getUserMedia` with echo cancellation, noise suppression and automatic gain control, and truthfully reports when there is no live peer.
- Profile portrait upload already center-crops/compresses to 256×256 JPEG at ~0.82 quality on-device.
- Player-account infrastructure already supports login/register API paths plus a local fallback while the public AWS endpoint is still unconfigured.

## Next professional polish targets
1. Hand-history/replay panel with concise action timeline.
2. Tournament lobby roster and table assignment presentation.
3. Disconnect/reconnect resume behavior for real multiplayer backend.
4. Player profile badges, avatar portraits, mute/report controls and accessibility labels.
5. Sound mix pass: deal, chips, action confirmation, showdown and tournament advancement.
6. Micro-animation budget and low-end mobile performance profile.
7. Cross-device visual regression matrix for Android Chrome/Samsung Internet and iPhone Safari.
8. Quest-native tactile interaction module: card peeking, chip toss/stacking, hand/controller haptics and gestures using current SVR table calibration.
9. Spatial peer voice rings and seat-anchored WebAudio after authoritative peer identity/seat mapping exists.
10. Secure shared tournament registration after AWS/Cognito and authoritative multiplayer backend are configured.
