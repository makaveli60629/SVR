# PHASE 259 — VR Interaction Everything Lock

## Goal
Make all major interaction paths available for VR, not just desktop.

## Interaction Targets
- Store kiosk
- Store equip panel
- Reiki portal
- PGA portal
- Smoker portal
- Scorpion portal
- Watch selection bridge
- Chip grab/select hooks
- Card select hooks

## Supported Input Paths
- Quest trigger/select
- Hand pinch/select bridge
- VR ray intent events
- Desktop click fallback
- Keyboard fallback retained

## Preserved
- Phase 254 boot shield hotfix
- Phase 255 locomotion/teleport/watch lock
- Phase 256 chip physics prep
- Phase 257 alignment lock
- Phase 258 kiosk equip sandbox
- Site untouched

## QA Checklist
1. Game boots.
2. Press O opens kiosk panel.
3. Desktop click can select marked interactive objects.
4. VR select bridge can open kiosk.
5. Reiki portal route works.
6. PGA portal route works.
7. Store room route works.
8. Scorpion route works.
9. Chip select emits grab event.
10. Card select emits select event.
11. Movement/teleport/watch still work.

## Debug
Press F7 to rescan interactive objects.

## Next Phase
PHASE-260-POKER-RIGHT-DEAL-TABLE-READABILITY-LOCK
