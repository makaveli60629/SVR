# PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK

## Audit result
Phase 86 was a rollback built from an older package. Phase 253 restores the uploaded Phase 252 forward baseline and advances from there.

## Critical fixes
- Website/site remains untouched.
- Restores Phase 252 Quest locomotion baseline.
- Keeps right-stick forward/back movement and 45-degree snap turn.
- Keeps hold A / grip / trigger to aim teleport, release to teleport.
- Keeps hand face/chin pinch/fist teleport toggle and pointed-pinch destination confirmation.
- Keeps watch upright correction modules and diagnostics.
- Moves SVR Store kiosk out from behind the sponsor wall into a clearer east/front showcase position.
- Adds interactive store kiosk overlay: Open Store, Store Room, Equip Test.
- Adds `modules/store_kiosk_interaction.js`.
- Keeps Reiki, PGA Drive, Chip/Putt, Store Room, Smoker Lounge, and Scorpion as private scene routes.
- Re-locks poker visual/card flow to right-to-left from dealer button.
- Adds chip table contact/physics visual rule: chips lie flat and closer to felt, with `svrPhysicsChip` markers for the next real rigid-body pass.
- Raises Moon and Mars visibility again.

## Hard manifest locks
1. Do not return to Phase 86 or any old rollback package.
2. Official active phase after this package is Phase 253+.
3. Full lobby is the baseline.
4. Store kiosk belongs inside the lobby and also has a private store room route.
5. Reiki hub must have private Reiki room route.
6. PGA hub must have private driving range and chip/putt routes.
7. Poker deal direction: right-to-left visual dealing from the dealer button. Do not relock left-to-right unless explicitly requested later.
8. Chips must be flat on the table; no sideways or floating chip stacks.
9. Website/public Matrix page must not be touched by game patches.

## Test checklist
- Load `/game/?v=phase253-forward-restore`.
- Confirm build label is `PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK`.
- Enter VR.
- Right stick up/down moves forward/back.
- Right stick left/right snap-turns 45 degrees.
- Hold A/grip/trigger aims teleport; release teleports.
- Watch faces user; if not, press F6 diagnostic panel on desktop.
- Store kiosk visible from lobby, not hidden behind sponsor wall.
- Press O on desktop to open kiosk overlay.
- Kiosk buttons: Open Store / Store Room / Equip Test.
- Reiki Room opens private Reiki route.
- PGA Drive opens private driving range route.
- Chip/Putt opens private short-game route.
- Cards visually deal right-to-left.
- Chips lie flat near the felt surface.
