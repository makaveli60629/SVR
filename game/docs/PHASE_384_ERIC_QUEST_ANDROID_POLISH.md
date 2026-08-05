# Phase 384 — Eric, Quest Quick Play, and Android One-Page Poker

## Build locks

- Overall web successor: `PHASE-384-ERIC-QUEST-ANDROID-POLISH-LOCK`
- Android authority preserved: `PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK`
- Android presentation successor: `PHASE-384-ANDROID-ONE-PAGE-3D-CHIP-WINNER-LOCK`
- Quest predecessor preserved: `PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK`
- Quest presentation successor: `PHASE-384-QUEST-ERIC-TABLE-QUICKPLAY-POLISH-LOCK`
- Site avatar successor: `PHASE-384-ERIC-DEFAULT-AVATAR-SITE-LOCK`
- Full website baseline preserved: `PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK`

## Site avatar and dressing room

- Demo Player records migrate to `/game/assets/models/eric/eric.fbx` when no approved avatar is saved.
- The default equipped outfit is clean Eric with generated equipment disabled.
- The box-shaped jacket/top overlay is removed.
- The avatar viewer normalizes Eric upright, resets the camera, and disables initial auto-rotation.
- Missing FBX material maps receive lightweight generated skin/fabric materials while embedded maps remain preserved.
- The profile camera retries the normal showroom and installs a direct Eric viewer when the old fallback remains active.

## Quest quick-play demo

- Phase 381 remains responsible for dealer bone retargeting, dealing motion, seated movement lock, overlay cleanup, and poker sound.
- Phase 384 keeps one approved Eric dealer and hides duplicate Eric roots.
- External skeleton helpers and debug armatures are hidden; Eric's embedded bones remain active.
- Missing Eric material maps receive generated skin/fabric textures.
- The original uploaded table remains authoritative.
- A professional felt surface and centered SVR logo are layered above the original table.
- The player starts near the table for inspection and moves to the stable seat after 6.5 seconds. Add `walk=1` to the Quest URL to suppress automatic seating for inspection.

## Android one-page poker

- JOIN NOW remains visible before cards or actions.
- Texas Hold'em evaluation, burn cards, `10` rank text, bot logic, and play-money persistence remain active.
- Joined gameplay uses a fixed one-page viewport with no normal page scrolling.
- Card backs display the SVR logo.
- Face cards display one centered suit with a readable rank.
- Bets animate chips toward the pot.
- Winners receive a flashing seat/stack, winner banner, chip movement, and WebAudio victory cue.
- Perspective, shadows, felt texture, and table watermark add depth without loading the full Three.js world on Android.

## APK policy

- APK version remains `0.1.0-rc2`, version code `2`.
- `forceUpdate` remains `false`.
- `showUpdatePrompt` remains `false`.
- The Phase 384 changes are delivered through the hosted web runtime; no native APK rebuild is forced.

## Physical acceptance still required

Static and deployment checks verify files, contracts, and assets. A user headset test must still confirm Eric's visible skinning, exact table alignment, dealer motion quality, frame rate, and seated eye position in the physical Quest/Oculus device.
