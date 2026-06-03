# Phase 98S-V - Screenshot-Based Surgical Fixes Queue

Date: 2026-06-02
Track: presentation-safe QA

## Purpose

Create the next phase queue without making blind visual changes. This protects the current presentation build while preparing the repo for precise screenshot-based fixes.

## Current protected build

- Game page: Phase 98S-Q presentation-safe mode
- Reiki visual: Phase 98S-O minimal Reiki polish
- Store placeholders: Phase 98S-P
- Presentation hub: Phase 98S-S
- Final checklist: Phase 98S-T
- QA lock: Phase 98S-R
- Messy lobby storefront overlay: disabled

## Hard rule for this phase

Do not add broad visual overlays.
Do not re-enable `game/modules/lobby_ads_portals_patch.js`.
Do not move objects without screenshots or exact coordinates.
Do not touch the public Matrix launch page.
Do not add unapproved Reiki partner branding.

## Surgical fix slots

Use this queue after live screenshots are received.

### Slot 1 - Lobby spawn cleanup

Screenshot required:

- Lobby spawn view

Allowed fixes:

- hide misplaced object by exact name or coordinate
- reduce brightness/glow if blocking view
- remove duplicate visual if identified

### Slot 2 - Reiki entrance cleanup

Screenshot required:

- Reiki entrance view

Allowed fixes:

- adjust small Reiki patch object positions
- reduce carpet/rope/glass clutter
- hide duplicate Reiki labels

### Slot 3 - Reiki hologram alignment

Screenshot required:

- Reiki hologram close-up

Allowed fixes:

- move hologram by small exact offset
- rotate hologram to face inward
- shrink/enlarge only if visually confirmed
- preserve no-audio-from-spawn behavior

### Slot 4 - Moon/Mars correction

Screenshot required:

- Moon/Mars sky view

Allowed fixes:

- adjust height/scale if too low or too large
- reduce glow if washed out
- audit texture source if fake-looking

### Slot 5 - Store presentation cleanup

Screenshot required:

- Store page Reiki book/product area

Allowed fixes:

- card text cleanup
- spacing/card ordering
- approval-safe copy polish

## Current links

Presentation hub:

`/site/presentation.html?v=phase98ss-presentation-hub`

Game presentation:

`/game/?v=phase98sq-presentation-safe&present=1`

Game test:

`/game/?v=phase98sq-presentation-safe`

Store:

`/site/store.html?v=phase98sp-store-placeholders`

## Next action

Deploy current build, inspect visually, then attach screenshots before any code changes in this phase.
