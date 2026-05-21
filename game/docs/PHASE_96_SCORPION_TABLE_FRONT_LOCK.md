# Phase 96 — Scorpion Table Front Lock

## Purpose
Move the visible poker table asset out of the store-front display path and lock it into the Scorpion game room/front-table area.

## Locked changes
- Scorpion room now has a dedicated front poker table mount named `PHASE_96_SCORPION_FRONT_TABLE_MOUNT`.
- The Scorpion table tries to load the real table asset first:
  - `assets/models/table.glb`
  - fallback: `assets/models/store.glb`
  - fallback: `assets/models/table.fbx`
  - fallback: `assets/models/store.fbx`
- If no model loads, a procedural fallback table is shown so the room is never empty.
- Store-front model mounting is disabled so the table no longer appears as a store prop.
- Store remains a kiosk/portal preview only.
- Scorpion room received extra front guard rails and a table label so the player understands the table belongs to that room.
- Runtime UNAPPROVED_REIKI_BRANDING_REMOVED/APPROVAL_PENDING_PERSON branding was replaced with red `AWAITING APPROVAL` SVR placeholders and the unapproved image files were removed from the active game package.

## Files changed
- `index.html`
- `main.js`
- `modules/world_skyline.js`
- `docs/GAME_MANIFEST.md`
- `docs/NEXT_PHASE_PLAN.md`
- `docs/PHASE_96_SCORPION_TABLE_FRONT_LOCK.md`
- `docs/INSTALL_POWERSHELL.txt`

## Verification checklist
- [ ] Lobby boots without black screen.
- [ ] Store wall still appears as a storefront/kiosk/portal area.
- [ ] Store wall does not display the poker table as its front prop.
- [ ] Scorpion room shows a front poker table.
- [ ] Scorpion button/watch route moves player to the Scorpion table/front-room area.
- [ ] No unapproved UNAPPROVED_REIKI_BRANDING_REMOVED/APPROVAL_PENDING_PERSON runtime branding appears.
- [ ] Moon and Mars still appear high in the lobby sky.
- [ ] Watch remains visible and routes remain usable.
- [ ] Package remains under 25 MB.

## Next phase
Phase 97 should split Scorpion into a more formal private module file and harden the portal/back-portal routes for every storefront.
