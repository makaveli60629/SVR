# Phase 365 — Android Seated UX, Branding, Gyro and Alignment Lock

## Owner-reported defects

- The visible reference line near the bottom of the poker table did not meet the lobby floor.
- Android MOVE and LOOK sticks were visible but did not reliably move the active camera/rig.
- MOVE and LOOK controls remained visible after JOIN TABLE even though seated play should use the table HUD and phone-look controls.
- LOBBY and CENTER navigation controls remained visible while seated.
- The seated camera appeared to bounce or recenter repeatedly.
- The pot display was oversized, framed and blocked the table/avatars.
- Lightweight opponents were not aligned with the canonical chair positions.
- Opponent names were not visible above their heads.
- The Android display and card backs needed the SVR logo, with one replaceable branding slot for future tournaments.
- The table needed a controlled color/texture polish.
- The existing Profile 3D Showroom and VR Dressing Room needed to remain connected and protected.

## Phase 365 corrections

### Table and floor alignment

- Preserves the verified Phase 364 table dimensions.
- Defines the visible lower table reference line as 0.065 meters above the model minimum.
- Moves the table authority so that this reference line—not an invisible model extremity—meets world floor Y=0.
- Updates `SVR_TABLE_TOP_Y` and rebuilds Phase 341 table/card presentation after alignment.

### Android controller

- Keeps Phase 347 as the only visible controller.
- Binds capture-stage pointer handling directly to the existing `#svr347Move` and `#svr347Look` sticks.
- Uses direct horizontal mapping: left input moves left and right input moves right.
- Uses camera-facing forward/back movement while in lobby mode.
- Does not create a second controller root.

### JOIN / seated state

- Hides MOVE and LOOK after JOIN TABLE.
- Hides LOBBY, CENTER and CENTER VIEW navigation controls while seated.
- Keeps poker buttons, hole cards, community cards, bankroll and showdown controls available.
- Restores the sticks and lobby navigation after LEAVE TABLE.

### Gyroscope and camera stability

- Requests device-orientation permission from the JOIN interaction when required by the device.
- Uses bounded phone yaw/pitch while seated.
- Adds small bounded lateral parallax so the player can inspect other avatars without leaving the seat.
- Uses damping instead of repeated hard recentering.
- Keeps the seated position within Phase 364's protected camera tolerance to prevent bounce loops.

### Pot display

- Reuses the existing Phase 347 raised pot sprite.
- Replaces the framed texture with transparent text-only POT and amount rendering.
- Reduces its scale and raises it just above the felt without blocking avatars or community cards.

### Avatars and name tags

- Reuses `PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS`.
- Aligns NOVA, ROOK, ACE, VEGA and IVY to Phase 341 canonical seats 1–5.
- Faces each opponent toward table center.
- Adds a billboard name/stack tag above every opponent.
- Does not create duplicate player bodies.

### Branding

- Adds one Android HUD brand slot using the committed SVR logo.
- Adds branded card backs for bot hole cards and burn cards.
- Preserves the Phase 341 table-center SVR logo.
- Adds `window.SVR_PHASE365_SET_BRAND()` so a future tournament can change the logo/name from one configuration point.
- Applies a subtle deep-green felt and black/purple rail polish without replacing the uploaded table.

### Protected avatar presentation

Phase 365 preserves rather than duplicates:

- Profile 3D Showroom: `/site/profile.html?v=phase351`
- Website Dressing Room: `/site/avatar.html?v=phase346`
- VR Dressing Room and moving pedestal: `/game/avatar-vr.html?v=phase353`

## Runtime QA

```js
window.SVR_PHASE365_QA()
window.SVR_PHASE365_SYNC()
window.SVR_PHASE365_ALIGN_TABLE()
window.SVR_PHASE365_STABILIZE_SEAT()
await window.SVR_PHASE365_REQUEST_GYRO()
window.SVR_PHASE365_SET_BRAND({
  id: 'tournament-example',
  name: 'TOURNAMENT SPONSOR',
  logoUrl: 'assets/ui/logo.png'
})
```

## Release boundary

- Local play-money poker against five bots remains the certified game mode.
- Phase 336 remains poker rules and settlement authority.
- Phase 347 remains the only visible Android controller authority.
- Phase 350 remains controller DOM deduplication authority.
- Phase 363 remains JOIN/LEAVE, bankroll, street and raise flow authority.
- Phase 364 remains device geometry and verified table-size authority.
- No server-authoritative multiplayer or real-money gambling is claimed.

## APK policy

- Current APK: `0.1.0-rc1`
- Version code: `1`
- `releaseReady: false`
- `forceUpdate: false`
- `showUpdatePrompt: false`
- `manualUpdateOnly: true`

This is a remotely loaded web-runtime phase and does not require an APK reinstall.
