# Phase 335 — Oculus Acceptance and Gameplay Stability Lock

## Build
`PHASE-335-OCULUS-ACCEPTANCE-GAMEPLAY-STABILITY-LOCK`

## Result
Phase 335 preserves the Phase 332–334 professional table, chip physics, shaders, seated position, cards, Eric bots, and gesture poker while adding a final Oculus stability layer.

### Locked improvements
- Old face-level pot, bet, status, audit, and desktop overlays remain suppressed.
- The turn panel stays above the sightline.
- The action row stays near the player’s hands.
- A one-time seated-envelope correction runs at XR session start only when needed.
- Duplicate poker actions within 520 milliseconds are ignored.
- Chips outside valid table bounds are returned through the Phase 334 layout authority.
- Hole and community cards remain visible and above the table.
- Player cards face the active headset camera.
- Five Phase 334 bot groups remain visible and table-facing.
- The action bar is reconstructed if it disappears during the player’s turn.
- The headset QA panel is hidden by default.

## Test route
`https://svrpoker.com/game/index.html?v=phase335-oculus-stability`

## Runtime QA
```js
window.SVR_PHASE335_TABLE_QA()
window.SVR_PHASE335_SHOW_QA()
window.SVR_PHASE335_HIDE_QA()
window.SVR_PHASE335_RECENTER()
window.SVR_PHASE335_RECOVER_TABLE()
```

## Release policy
- APK: `0.1.0-rc1`
- Version code: `1`
- Forced update: `false`
- Public website untouched.
- No claim of completed networked multiplayer.
