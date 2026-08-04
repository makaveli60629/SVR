# Phase 84 — Table Control Authority Clean Lock

Game-side only. Site untouched.

## Purpose

This phase wires the compact table control override into the active boot so the table test can focus on close seated play without competing table-camera modules.

## Active correction

- Active boot label moved to `PHASE84`.
- `game/modules/p225_lock.js` is loaded after the older table spawn helper.
- The override keeps the player close to the real table.
- Small position HUD is available through the override module.
- Table visual stack remains active.

## Protected

- No website files changed.
- No public Matrix site changes.
- No lobby redesign.
- No new sponsor/private scene work.

## Runtime checks

```js
SVR_RUN_P225_AUDIT()
SVR_P225_CLOSE()
```

## Test URL

`/game/?v=phase84-table-control-authority-clean-lock`

## Next

After this table position control is verified, the next proper target is Poker.js Truth Lock.
