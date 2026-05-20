# Phase 105 — Teleport Hotfix ZIP and Live Deploy Verification Lock

## Purpose

Fix the teleport regression reported after Phase 102 where fist/clench teleport on/off behavior was not working correctly.

## Locked behavior

```text
Hold fist / grip / A / trigger = aim teleport
Release = teleport
```

The system must not behave like a broken toggle. It must not instant teleport. It must not get stuck on or off.

## Added module

```text
game/modules/teleport_hotfix_guard.js
```

## Safety rules

- Game-side hotfix only.
- No website edits.
- No SQL/backend edits.
- No lobby redesign.
- No new rooms.
- No sponsor content.
- Keep package under 25 MB.

## Validation

- Fist/clench hold shows teleport marker.
- Fist/clench release teleports.
- Grip hold/release works.
- A-button hold/release works where supported.
- Trigger/select fallback works.
- Purple marker appears only while aiming.
- Tracking loss cancels safely.
- Watch teleport state matches actual state.
- Quest movement/snap turn remain valid.
- Scorpion gameplay remains unaffected.
