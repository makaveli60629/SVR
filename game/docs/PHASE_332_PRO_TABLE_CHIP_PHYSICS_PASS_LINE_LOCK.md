# Phase 332 — Professional Table, Chip Physics, and Pass-Line Lock

## Build
`PHASE-332-PRO-TABLE-CHIP-PHYSICS-PASS-LINE-LOCK`

## Scope
Game-side only. The public website and sponsor/partner content are untouched.

## Source audit used for this phase
The uploaded source packages were inspected before implementation.

Confirmed source assets and prior design work:
- `game/assets/models/table.glb`
- `game/assets/models/table.fbx`
- `game/assets/texture/tablefelt.png`
- existing cylinder-based poker-chip geometry in the older world and poker demo modules
- uploaded `logo table.png`, showing the intended centered SVR identity and white pass-line arrangement

No separate finished chip texture image was found in the inspected source archives. Phase 332 therefore preserves the prior cylinder geometry direction and generates lightweight SVR denomination faces and edge stripes at runtime.

## Permanent table authority
The existing uploaded table remains the only table authority. Phase 332 does not create a replacement table.

Priority:
1. `PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED`
2. `PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT`
3. `PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED`

The felt/play surface is detected from the table mesh and material names, including the source material name `polotno`.

## Table material polish
- Applies the existing `assets/texture/tablefelt.png` to the detected felt mesh.
- Adds a lightweight procedural fabric bump to the felt.
- Tunes the padded black rail toward dark leather.
- Tunes silver/metal trim separately.
- Preserves the original model geometry and UVs.
- Keeps the Phase 331 SVR logo flat and centered on the detected surface.

## Chip geometry
Phase 332 chips are smaller than the older temporary chips.

- Diameter: `0.072` world units
- Thickness: `0.0085` world units
- 40-segment cylinder geometry
- textured top and bottom faces
- striped wrapped edge texture
- shared geometry/material assets per denomination for Quest performance

Player denominations:
- `$1` — white/cyan
- `$5` — red
- `$25` — green
- `$100` — black/purple

The player's bank is placed on the left side of the open south/front seat.

## Pass-line layout and logic
- A white outer pass line and gold inner line are generated directly from the detected playable-surface dimensions.
- The right side of the player position is marked as the bet area.
- Chips remain removable before they cross the pass line.
- A released chip that settles past the pass line is committed and becomes non-removable.
- Multiple chips released in quick succession are grouped into one physical bet.
- The physical bet dispatches:
  - `svr:physical-bet-committed`
- When the poker engine is waiting for the human player, the physical bet resolves to call or raise through the existing poker action authority.

## Gravity and throwing
Meta-hand pinch and controller-trigger pickup remain supported.

On release:
- hand/controller movement becomes throw velocity
- gravity acts on the chip
- the chip spins from angular velocity
- the felt produces a damped bounce
- the rail reflects and slows chips
- slow chips settle flat
- chips released near another chip snap into a stack
- chips settling beyond the pass line become committed bets

## Alignment lock
Cards remain aligned by Phase 331 to the detected table surface. Phase 332 uses the same surface height for:
- personal chip stacks
- thrown chips
- settled chips
- pass-line geometry
- bet-area markings

## Runtime helpers
```js
window.SVR_PHASE332_TABLE_QA()
window.SVR_PHASE332_TABLE_SYSTEM
window.SVR_FINALIZE_PHYSICAL_BET()
window.SVR_RESET_PLAYER_CHIPS()
```

## Oculus test route
```text
https://svrpoker.com/game/index.html?v=phase332-pro-table
```

## Acceptance checks
1. Only the existing table asset is visible.
2. Felt, leather rail, and metal trim read as separate materials.
3. SVR logo is centered and flush.
4. Pass line is clean and follows the actual felt dimensions.
5. Player chips are on the left and are visibly smaller than Phase 331 chips.
6. Denominations are readable.
7. Meta-hand pinch picks up a chip.
8. Controller trigger remains a fallback.
9. A tossed chip follows an arc and lands on the felt.
10. A slowly released chip near a stack snaps onto it.
11. A chip settling beyond the pass line becomes locked.
12. APK policy remains `0.1.0-rc1`, version code `1`, with no forced update.
