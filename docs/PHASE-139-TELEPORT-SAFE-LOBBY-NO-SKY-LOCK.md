# PHASE-139-TELEPORT-SAFE-LOBBY-NO-SKY-LOCK

## Purpose

The user reported that the sky layer appears to be causing freezing during teleport. Phase 139 removes the heavy sky/orbit layer from the active lobby module and replaces it with a static lightweight ceiling cap.

## Files changed

- `game/modules/lobby_stable_refine.js`
- `docs/PHASE-139-TELEPORT-SAFE-LOBBY-NO-SKY-LOCK.md`
- `update/version.json`

## What changed

- Removed active high-orbit sky system from the lobby module.
- Removed active Moon/Mars orbit update loop from the lobby module.
- Replaced sky with `SVR_PHASE139_TELEPORT_SAFE_STATIC_CEILING_NO_SKY`.
- Kept the textured SVR floor.
- Kept the walls, portals, table, spawn pad, and north arrow.
- Kept the portal routes for Reiki, PGA, Scorpion, Store, Lounge, Sponsor, Impact, Chip/Putt, and PGA Drive.
- Kept Quest/WebXR performance-first renderer scaling.

## Why

Large sky spheres, animated planets, halo sprites, and wide far-field objects can cause GPU/scene update stress on Quest Browser. During teleport, world-root shifting moves the whole lobby relative to the user. Removing the sky group reduces the number of huge far-field objects affected by that shift and lowers GPU load.

## Runtime globals

- `window.SVR_PHASE139_STABLE_LOBBY`
- `window.SVR_PHASE139_STABLE_LOBBY.skyRemoved = true`

## Test URL

```text
https://svrpoker.com/game/?v=phase139-no-sky-teleport
```

Hard refresh:

```text
Ctrl + F5
```

## Quest test checklist

- Lobby loads without the animated sky/Moon/Mars layer.
- Floor remains visible.
- Teleport target appears.
- Trigger/A/grip hold-to-aim and release-to-teleport works without freezing.
- Hand fist/pinch teleport works without freezing.
- Watch teleport button still toggles teleport mode.
- Portal buttons still jump to lobby areas.

## Next phase

`PHASE-140-POKER-GAMEPLAY-TABLE-STATE-LOCK`

The planned poker phase should only start after this no-sky teleport build is confirmed stable on Quest.
