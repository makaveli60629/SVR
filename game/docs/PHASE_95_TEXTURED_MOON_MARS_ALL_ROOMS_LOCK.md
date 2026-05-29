# Phase 95 — Textured Moon Mars All Rooms Lock

## Scope
Game/WebXR only. Website/site remains locked and untouched.

## Added
- `game/modules/moon_mars_textured.js`
- Procedural Moon texture with crater/noise detail.
- Procedural Mars texture with red terrain streaking and bump detail.
- Textured Moon/Mars applied to the lobby through the Phase 93 bootstrap render hook.
- Textured Moon/Mars added to all private rooms through `private_scene_common.js`.

## Preserved
- Phase 93 lobby floor/table/locomotion/sky fixes.
- Phase 94 Reiki Room portal hologram.
- Private scene routing.
- Quest/controller fallback.
- Fist/pinch teleport.

## Rooms covered
- Main lobby
- Reiki Room
- PGA Driving Range
- Chip/Putt
- Store Room
- Smoker Lounge
- Scorpion Room

## Test
Open:

```text
https://svrpoker.com/game/?v=phase95-textured-planets
```

Then verify:

- Build label shows `PHASE-95-TEXTURED-MOON-MARS-ALL-ROOMS-LOCK`.
- Lobby Moon and Mars have visible texture/noise instead of flat colors.
- Each private room shows textured Moon and Mars high in the sky.
