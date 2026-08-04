# Phase 170 — Teleport Aim Commit Lock

## Scope
Game-side only. No lobby redesign. No site changes.

## Purpose
Fix teleport behavior so it does not jump immediately when the player points.

## Locked behavior
- Teleporter has a real ON/OFF state.
- Hold trigger/grip to aim.
- Aim ray and marker stay visible while held.
- Release moves only after a short hold and stable target.
- Pointing alone does not move the player.
- If an old auto-move fires while aiming, Phase 170 restores the pre-aim pose.
- The current movement export is routed through a Phase 170 bridge so the live rig is available to the aim-lock module.

## Controls
- `T` on desktop toggles teleport.
- Quest A/B/Y style buttons try to toggle when available through XR gamepad buttons.
- Hold trigger/grip to aim.
- Release trigger/grip to move.
- Escape cancels aim on desktop.

## Files
- `game/modules/phase170_teleport_aim_commit_lock.js`
- `game/modules/movement_phase170_teleport_lock.js`
- `game/modules/movement_phase228.js`
- `game/index.html`
- `update/version.json`

## Runtime audit
```js
SVR_RUN_PHASE170_TELEPORT_AUDIT()
```

## Test URL
`/game/?v=phase170-teleport-aim-commit`
