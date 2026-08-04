# Phase 197

Game-side only.

Added:
- `game/modules/phase197_single_authority_cleanup_lock.js`

Purpose:
- suppress gameplay update popup overlay
- aggressively remove remaining center rails and poles
- reduce duplicate moon/Mars objects by keeping the Phase 196 sky authority
- scan for the real FBX table root and force it visible
- show a clear diagnostic marker only if the real FBX table cannot be found
- hide duplicate floor logo overlays while preserving the active lobby logo

Runtime audit:
```js
SVR_RUN_PHASE197_AUDIT()
```

Test URL:
`/game/?v=phase197-single-authority-cleanup`
