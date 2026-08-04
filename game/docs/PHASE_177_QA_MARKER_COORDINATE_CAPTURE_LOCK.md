# Phase 177 — QA Marker Coordinate Capture Lock

## Scope
Game-side only. No website or site edits.

## Purpose
Add a laptop QA layer for exact placement and alignment checks.

## Added
- Runtime module: `game/modules/phase177_qa_marker_coordinate_capture_lock.js`
- Desktop/laptop coordinate panel.
- In-world QA reference markers for table center, felt center, floor logo, Moon, and Mars.
- Runtime audit output for table/felt/logo/sky/teleport status.
- Fresh Phase 177 cache keys in `game/index.html`.

## Controls
- `M` toggles QA markers.
- `Shift + M` copies the current audit JSON to clipboard.

## Runtime audit
```js
SVR_RUN_PHASE177_QA_MARKER_AUDIT()
```

## Test URL
`/game/?v=phase177-qa-coordinate-capture`
