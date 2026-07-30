# Phase 331 — Quest Meta Hands + Table Interaction Lock

Build: `PHASE-331-QUEST-META-HANDS-TABLE-INTERACTION-LOCK`

## Scope

Game-side Quest/Oculus and shared table-runtime update layered on top of Phase 330. The public website is untouched. Android Phase 330 controls and APK release policy remain unchanged.

## Meta hand arbitration

- Native Meta hands may connect or reconnect at any time during an XR session.
- Each hand is evaluated separately.
- A native Meta hand immediately suppresses the matching controller-hand visual.
- Controller input remains available as fallback when the matching native hand is absent.
- Mixed mode is supported: one Meta hand and one controller fallback hand.
- Controller hardware meshes remain hidden.

Runtime helpers:

```js
window.SVR_ENABLE_META_HANDS()
window.SVR_HAND_INPUT_STATE
```

## Table surface authority

The existing uploaded poker table remains the only table authority. Phase 331 detects the felt/play surface and aligns:

- community cards
- player cards
- player chip stacks
- center-pot chips
- center SVR logo

All cards and chips share the same detected table resting surface. Static duplicate card/chip layers are suppressed when the live poker layer is available.

## Pot display

- Replaces the sideways pot label with an upright translucent panel.
- Raises it above the table for seated readability.
- Faces the active player camera.
- Tracks the live Phase 85 pot value.

## Chip pickup

- Meta hands: pinch thumb and index finger near a chip to pick it up; release to drop.
- Controller fallback: hold trigger near a chip; release to drop.
- Dropped chips snap to the table surface.
- Chips released near another chip snap onto that stack.

## Center logo

The approved SVR logo texture is placed flush at the center of the existing table surface. Duplicate table-logo layers are suppressed.

## QA

Run in the Oculus browser console when available:

```js
window.SVR_PHASE331_QUEST_QA()
```

Expected:

- `duplicateHandsPrevented: true`
- `potDisplay: true`
- `tableLogo: true`
- `surfaceY` is numeric
- `inputMode` is `meta-hands`, `mixed`, or `controllers`

## Protected locks

- Existing table asset remains authoritative.
- No duplicate procedural table was created.
- Public website/site files were not edited.
- No sponsor/partner content was edited.
- APK version remains `0.1.0-rc1`, version code `1`.
- `forceUpdate` and `showUpdatePrompt` remain `false`.
