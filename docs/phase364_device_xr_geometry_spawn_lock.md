# Phase 364 — Device XR Geometry and Spawn Lock

## Owner-reported release defects

- Quest Browser blinked after **ENTER VR** and did not remain in immersive mode.
- The Quest camera appeared at the center of the poker table instead of the standing lobby spawn.
- **PLAY GAME** was visible but did not produce a usable seated game.
- Eric appeared untextured, sideways, and suspended in the air.
- Android table height did not match the floor and seated eye line.

## Corrections

- Makes `local-floor` optional during the initial WebXR session request instead of rejecting the whole session when floor recovery is unavailable.
- Provides one monitored Quest **ENTER VR** authority with visible failure/retry state.
- Reapplies a standing lobby spawn after `sessionstart` and applies a separately calibrated seated pose only after **PLAY GAME**.
- Corrects the rig-facing yaw for Three.js cameras, whose forward axis is local `-Z`.
- Normalizes the verified table to 2.74 m × 0.80 m × 1.46 m and aligns its lowest point to world floor `Y=0` on both Quest and Android.
- Creates one transparent floor/raycast authority at `Y=0`.
- Calibrates Android and Quest seated eye height from the measured table top.
- Quarantines Eric from the gameplay release scene until a textured upright rig passes physical headset acceptance.
- Preserves the Phase 363 Android JOIN/LEAVE flow, 15,000-chip stacks, Hold’em rules, and APK policy.

## Product truth

Browser automation can validate table dimensions, floor alignment, lobby/seat anchors, button authority, and complete poker regressions. It cannot prove that a physical Quest guardian, controller, hand joint, or headset permission session remains active. Physical Quest acceptance remains required after deployment.

## Test routes

- Quest: `https://svrpoker.com/game/index.html?platform=quest&v=phase364`
- Android: `https://svrpoker.com/game/android.html?channel=stable&v=phase364`

## Runtime QA

```js
window.SVR_PHASE364_QA()
window.SVR_PHASE364_ENTER_VR()
window.SVR_PHASE364_LOBBY_SPAWN()
window.SVR_PHASE364_SEAT()
window.SVR_PHASE364_ANDROID_SEAT()
window.SVR_PHASE364_ALIGN_TABLE()
window.SVR_PHASE364_SANITIZE_NPCS()
window.SVR_PHASE364_STATE
```
