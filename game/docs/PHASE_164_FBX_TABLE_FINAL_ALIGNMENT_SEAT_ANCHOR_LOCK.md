# Phase 164 â€” FBX Table Final Alignment + Seat Anchor Lock

## Scope
Game-side only. Website untouched.

## Locked behavior
- The fake/procedural geometry table is disabled at source in phase195_clean_lobby_world.js.
- The Phase 155 fallback geometry table remains disabled.
- The Phase 159 visible stool guide is disabled.
- A runtime purge module removes any recreated table/chair/stool/poker-panel geometry around the table.
- The real FBX table remains the only visible table authority.
- Seat locations remain available through world.seats as invisible anchors.

## Test
Open /game/?v=phase164-fbx-table-final and confirm the center table area shows the FBX table only.
