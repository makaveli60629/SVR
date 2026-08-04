# Phase 296 — Lobby Arch Doorway Alignment Lock

## Goal

Fix the lobby arch and pillar placement so display sections read like doorway frames, not blocked signage.

## Source instruction

Pillars must sit on the left and right edges of each display or storefront section. The upside-down U arch must wrap around the display like a doorway opening. Text, signage, portal labels, storefront writing, info walls, and hologram panels must stay readable.

## Changed files

- `game/phase295_storefront_doorway_trim_lock.js`
- `game/docs/PHASE_296_LOBBY_ARCH_DOORWAY_ALIGNMENT_LOCK.md`

## Runtime behavior

- Uses the existing `phase101t_lobby_interaction_portal_qa_lock.js` import chain.
- Upgrades the live doorway trim layer to `PHASE-296-LOBBY-ARCH-DOORWAY-ALIGNMENT-LOCK`.
- Hides old center-blocking columns/pillars that sit inside display openings.
- Adds slim left/right pillars outside each display edge.
- Adds top beams and glow lines to form an upside-down U arch above each display.
- Protects signs, display panels, portal prompts, hitboxes, hologram panels, and sponsor placeholders with higher render priority.
- Marks portal trigger zones as protected so the walking/teleport path remains clear.

## Protected systems

- Website and `/site` files were not touched.
- Public Matrix page was not touched.
- Poker logic was not touched.
- Dealer, cards, chips, and deal order were not touched.
- Quest locomotion was not touched.
- Watch controls were not touched.
- Private scene routing was not touched.
- Moon/Mars were not touched.

## Placement rule

For every arch section:

```text
archWidth > displayWidth
pillarLeft.x < displayLeftEdge
pillarRight.x > displayRightEdge
pillarDepth aligns with wall/frame
display stays centered/readable inside opening
```

## VR test checklist

- Stand at lobby spawn.
- Look at each arch/display section.
- Confirm pillars are not in front of writing.
- Confirm each arch frames the display like a doorway.
- Walk/teleport toward each storefront.
- Confirm trigger areas still work.
- Confirm no glass/rope/plant/pillar blocks text.
- Confirm Quest view reads cleanly without clutter.

## Commit message

`Fix lobby arch doorway alignment and display readability`
