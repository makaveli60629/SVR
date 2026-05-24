# PHASE-169-LOBBY-ORIGINAL-ASSET-PASS-CORRECT-FLOOR-LOCK

## Purpose

Phase 169 continues the fast original-lobby restore by locking the lobby asset pass and QA overlay. It keeps the Phase 168 restored lobby runtime and adds a Phase 169 audit wrapper so the lobby reports the correct current phase and confirms the critical restoration rules.

## Files changed

- `game/index.html`
- `game/modules/phase169_lobby_original_asset_pass.js`
- `docs/PHASE-169-LOBBY-ORIGINAL-ASSET-PASS-CORRECT-FLOOR-LOCK.md`
- `update/version.json`

## Locked

- Game side only.
- Site untouched.
- No music.
- Official SVR logo only.
- Lobby storefronts only.
- Reiki, PGA, Scorpion, Store, and Lounge remain routed as separate/private destinations.
- Phase 168 original-style floor/walls/logo/portals/Moon/Mars runtime preserved.
- Controller objects remain hidden.
- Right-stick movement and 45 degree snap turn remain preserved.
- Trigger-release teleport remains preserved.
- Grip preview remains preserved.

## Added

- Phase 169 build marker.
- Lobby audit overlay.
- Runtime record:
  - `window.SVR_PHASE169_LOBBY_ASSET_PASS`
  - `window.SVR_PHASE169_LAST_AUDIT`

## Test URL

```text
https://svrpoker.com/game/index.html?v=phase169-lobby-asset-pass
```

## Next phase

Phase 170 should shift back to playable poker: `poker.js` lock, hand flow QA, and table gameplay validation. Do not expand scenery before poker logic is locked.
