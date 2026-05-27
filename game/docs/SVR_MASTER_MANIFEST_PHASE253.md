# SVR Poker Master Manifest — Phase 253

## Active build
`PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK`

## Source baseline
Uploaded backup: `game-phase252-forward-restore-quest-poker-lock.zip`.

## Why this phase exists
The game was accidentally rolled back to Phase 86. Phase 86 lacked the later locomotion/watch/teleport/runtime work. Phase 253 restores the forward baseline and adds the requested kiosk, routing, deal-direction, chip, and celestial corrections.

## Protected files
- Root public site: protected.
- `/site`: protected.
- `site.zip`: protected.
- This package touches game only.

## Required modules
- `modules/teleport.js` — Quest movement, snap turn, hold/release teleport.
- `modules/watch.js` — wrist watch UI.
- `modules/watch_upright_orientation_panel.js` — watch correction/diagnostic.
- `modules/quest_input_autocalibration.js` — right-stick diagnostic.
- `modules/store_kiosk_interaction.js` — new interactive kiosk overlay.
- `modules/world_skyline.js` — lobby, hubs, Moon/Mars, store wall, chips/cards.
- `modules/poker_demo.js` — poker flow and right-to-left deal order.

## Locomotion lock
- Right stick Y: forward/back movement.
- Right stick X: 45-degree snap turn.
- Hold A/grip/trigger: teleport aim.
- Release A/grip/trigger: teleport.
- No accidental instant teleport.

## Store kiosk lock
- URL: `https://svrpoker.com/site/store.html`.
- Must be visible in lobby.
- Must not hide behind sponsor wall.
- Must support VR-friendly panel flow.
- Store room route remains `store-room.html`.

## Private room lock
- Reiki hub → `reiki.html`.
- PGA Drive → `pga-drive.html`.
- Chip/Putt → `chip-putt.html`.
- Store → `store-room.html`.
- Smoker Lounge → `smoker-lounge.html`.
- Scorpion → `scorpion.html`.

## Poker lock
- Dealer body invisible/disabled unless later approved.
- Deal direction: right-to-left visual deal from dealer button.
- Chips flat; no sideways chips; no floating stacks.
- Next phase should add true rigid-body chip throw/gravity if physics library is approved.

## Next recommended phase
Phase 254 — True Chip Physics + VR Grab Lock:
- add lightweight chip rigid-body behavior or custom gravity/drop simulation,
- hand/controller chip grab,
- throw-to-pot interaction,
- table collision plane,
- chip settle/stack clamp.
