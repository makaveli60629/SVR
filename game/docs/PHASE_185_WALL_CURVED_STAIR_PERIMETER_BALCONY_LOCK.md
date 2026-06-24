# Phase 185 — Wall Curved Stair Perimeter Balcony Lock

## Scope
Game-side only. No website or site edits.

## User screenshot coordinate used
The QA panel showed the left-wall stair start area around:
- camera: `x -8.94 y 1.62 z 7.20`
- mouse floor: `x -12.85 z 8.01`
- last click: `x -9.54 z 4.06`

Phase 185 uses the left-wall location as the stair start point.

## Built
- New module: `game/modules/phase185_wall_curved_stair_perimeter_balcony_lock.js`
- Removes prior Phase 178/180 upper-structure roots.
- Rebuilds the upper floor as a full perimeter balcony/walkway around the lobby walls.
- Starts the stair system at the left wall near `x -12.85 z 8.01`.
- Shortens the stair run by using a curved wall-hugging stair path.
- Adds overlap/tight wall connector geometry so the balcony does not float away from the wall.
- Adds aligned inner glass edge panels on the balcony/walkway.
- Adds textured floor/walkway/step materials.
- Adds height-follow logic for desktop and XR rig movement.

## Runtime audit
```js
SVR_RUN_PHASE185_STAIR_AUDIT()
```

## Test URL
`/game/?v=phase185-wall-curved-stair-balcony`

## QA checklist
- Stairs start near the left-wall location shown in the screenshot.
- Stairs are shorter and curve up to the second-floor walkway.
- Balcony is a perimeter walkway around the lobby.
- Wall and balcony geometry overlap slightly to avoid visible gaps.
- Glass sits on the balcony/walkway edge.
- Desktop camera height follows the stairs.
- Oculus rig height follows the stairs/second floor.
