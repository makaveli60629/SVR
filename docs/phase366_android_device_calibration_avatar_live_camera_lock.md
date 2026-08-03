# Phase 366 — Android Device Calibration and Avatar Live-Camera Continuity Lock

## Purpose

Phase 365 established the certified Android baseline for table/floor alignment, one controller, seated HUD cleanup, gyro look, transparent pot presentation, opponent seat alignment, name tags, and SVR branding.

Phase 366 adds a **device-local fine-tuning layer** for the owner’s physical phone and connects the existing avatar presentation routes into one current live-camera flow. It does not replace or weaken any certified gameplay authority.

## Android calibration

A small calibration button is available only in lobby mode. It is hidden automatically after `JOIN TABLE` so seated gameplay remains uncluttered.

Adjustable values:

- Table height offset
- Seated distance from table
- Seated eye height
- HUD scale
- Pot opacity
- Pot size
- Gyroscope sensitivity
- Opponent radial/chair offset
- Opponent seat-height offset

The settings are stored under:

```text
svr.phase366.androidCalibration.v1
```

They are local to the current browser/app device. They are not written to the player profile, poker state, bankroll, backend, or database.

`Reset` restores the exact Phase 365 baseline.

## Avatar continuity

The following routes continue to use the same saved profile fields:

- Profile live 3D camera: `/site/profile.html?v=phase366`
- Website dressing room: `/site/avatar.html?v=phase366`
- VR dressing room and moving pedestal: `/game/avatar-vr.html?v=phase366`

Shared fields remain:

```text
avatarUrl
modelId
palette
headwear
eyewear
top
shoes
accessory
```

The profile live camera listens for account/profile changes, avatar saves, storage changes, and page visibility. It refreshes the protected Phase 351 renderer rather than creating a second avatar or camera authority.

## Protected systems

- Phase 336: poker rules, cards, turns, pots, evaluation and payout
- Phase 347: only visible Android MOVE, LOOK and action controller
- Phase 350: Android controller DOM deduplication
- Phase 351: profile 3D showroom/live camera renderer and fallback
- Phase 353: VR dressing room and moving pedestal
- Phase 354: complete Android local-game acceptance
- Phase 357: table status, seating, showdown and ante presentation
- Phase 363: JOIN/LEAVE, bankroll, raise and street flow
- Phase 364: device geometry and table dimensions
- Phase 365: Android seated UX, branding, gyro and table/floor alignment baseline

## Runtime QA

```js
window.SVR_PHASE366_QA()
window.SVR_PHASE366_OPEN_CALIBRATION()
window.SVR_PHASE366_CLOSE_CALIBRATION()
window.SVR_PHASE366_SET_CALIBRATION({
  seatDistanceOffset: -0.04,
  seatHeightOffset: 0.02,
  hudScale: 0.92,
  potOpacity: 0.70
})
window.SVR_PHASE366_APPLY()
window.SVR_PHASE366_RESET()
window.SVR_PHASE366_EXPORT_CALIBRATION()

window.SVR_PHASE366_PROFILE_CAMERA_QA()
window.SVR_PHASE366_PROFILE_CAMERA_REFRESH()
```

## Acceptance requirements

- One calibration button and one panel only
- Calibration button visible in lobby and hidden while seated
- Default values reproduce Phase 365
- Custom values persist locally
- Reset restores Phase 365 values
- No poker-state or bankroll mutation
- One Android controller remains
- Full Hold’em regression still reaches settlement and conserves 90,000 chips
- Profile live camera refreshes from the same avatar record used by both dressing rooms
- No APK update or prompt change
- No browser errors or failed requests

## Product truth

- Current certified mode remains local play-money Texas Hold’em against five bots.
- Presence groundwork is not server-authoritative poker.
- Production account/database deployment remains separate.
- Physical phone comfort and final calibration values require the owner’s device.
- No real-money gambling is implemented or claimed.

## APK policy

- Version name: `0.1.0-rc1`
- Version code: `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

Phase 366 updates the remote web runtime only. It does not require an APK reinstall.
