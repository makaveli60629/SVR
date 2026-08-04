# Update 3.1-B — Lobby Structure Completion Lock

## Build label
`UPDATE-3.1-B-LOBBY-STRUCTURE-COMPLETION-LOCK`

## Scope
Game-side only. Website untouched.

## Main purpose
Start correcting the lobby toward the approved premium plan without replacing the baseline.

## Runtime module
- `game/update31_lobby_structure_completion.js`

## Attachment path
- `game/phase176_boot.js` imports `game/update31_version_sync_lock.js`.
- `game/update31_version_sync_lock.js` dynamically loads `game/update31_lobby_structure_completion.js`.

## Added / fixed
- Kills bad floor Moon / dome-style Moon artifacts.
- Adds one sky-positioned Moon to the left/high sky as lobby eye candy.
- Adds solid upstairs floor sections.
- Adds red carpet across upstairs sections.
- Adds red carpet strips to stair runs.
- Adds Roman-style columns and gold beams around the table patio zone.
- Adds city window glass and gold window frames.
- Adds procedural textured city tower silhouettes beyond the windows.
- Seals the spawn/back wall with an SVR arrival gate.
- Keeps diagnostics active.

## Protected
- Site files untouched.
- Lobby baseline not replaced.
- Existing portals remain separate storefronts/routes.
- Quest/Android/Desktop control rules preserved.
- Diagnostics remain visible.

## Test checklist
- Load `/game/?v=update31-b-lobby-structure`.
- Confirm the floor Moon dome is gone.
- Confirm Moon appears high in the sky and left of center.
- Confirm upstairs floors are solid.
- Confirm upstairs and stair carpets are red.
- Confirm Roman table patio columns are visible.
- Confirm city windows are visible behind/upstairs.
- Confirm spawn/back black void is sealed by arrival wall/gate.
- Confirm diagnostics still show Update 3.1-B.

## Next phase
Update 3.1-C — Sky / Moon / Window Fix

Focus:
- final Moon placement and scale
- stronger crater texture
- Mars placement
- city window sightline tuning
- remove any leftover dome/floor artifact if still visible
