# Phase 297 — Lobby Geometry Polish Alignment Lock

## Goal

Tighten the lobby storefront/display geometry after the arch-doorway fix. The lobby should look cleaner, aligned, readable, and polished in VR without redesigning the room.

## Changed files

- `game/phase295_storefront_doorway_trim_lock.js`
- `game/docs/PHASE_297_LOBBY_GEOMETRY_POLISH_ALIGNMENT_LOCK.md`

## Runtime upgrades

- Upgraded the live trim layer to `PHASE-297-LOBBY-GEOMETRY-POLISH-ALIGNMENT-LOCK`.
- Keeps the existing import chain through `phase101t_lobby_interaction_portal_qa_lock.js`.
- Tightens arch/pillar placement for every rear and side storefront/display bay.
- Adds darker readability backplates behind display panels so writing reads cleaner in VR.
- Keeps pillars outside the display edges.
- Keeps arch top above the display opening.
- Raises render priority for signs, panels, holograms, portal labels, prompts, sponsor placeholders, and hitboxes.
- Marks portal zones as protected so trigger areas remain clear.
- Adds measured opening metadata for QA.
- Makes small decor clearance adjustments for nearby glass, rope, plant, and post objects if they overlap display openings.

## Protected systems

- Website and `/site` files were not touched.
- Public Matrix page was not touched.
- Poker table logic was not touched.
- Dealer logic was not touched.
- Cards, chips, and deal order were not touched.
- Quest locomotion was not touched.
- Watch controls were not touched.
- Private scene routing was not touched.
- Moon/Mars were not touched.

## Alignment rule

```text
[ LEFT PILLAR ]   [ readable display/sign/storefront ]   [ RIGHT PILLAR ]
        \__________________ ARCH TOP __________________/
```

## QA checklist

- Stand at spawn.
- Confirm every display panel has a clean backplate behind it.
- Confirm every left/right pillar sits outside display text.
- Confirm top arch beam is above the display and not covering text.
- Confirm portal rings and hitboxes are still reachable.
- Confirm red carpet and walking path remain open.
- Confirm glass, rope, plants, and posts do not block writing.
- Confirm Quest view is readable from normal player height.

## Test URL

`/game/?v=phase297-geometry-polish-alignment`
