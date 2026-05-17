# Phase 85 — NPC Scene Motion Lock

Game-side only. Website/site files are not touched.

## Purpose

Phase 85 turns the Phase 84 avatar intake into a reusable NPC scene-motion layer. It keeps Eric, Carla, and Mei as lightweight runtime candidates and adds scene-specific roles:

- lobby walking NPCs
- seated poker NPC placeholders
- Reiki guide placeholder
- PGA range coach placeholder
- chip/putt coach placeholder
- Smoker Lounge host placeholder
- Scorpion Room host placeholder
- VR Store avatar display placeholder

## Locked safety rules

- Do not load the raw sci-fi downtown OBJ in the lobby.
- Do not touch `/site` or public website files.
- Keep controller/hand tracking systems untouched.
- Preserve dealer body disabled unless explicitly approved later.
- Keep game package under 25 MB.
- Use procedural fallback NPCs if FBX loading fails.

## New files

```text
game/modules/npc_motion_controller.js
game/modules/npc_scene_attach.js
game/modules/npc_avatar_system.js
game/modules/avatar_asset_registry.js
game/docs/PHASE_85_NPC_SCENE_MOTION_LOCK.md
game/docs/NPC_SCENE_MOTION_MANIFEST.json
```

## Notes

Private scene pages can integrate the avatar layer by importing `attachNpcAvatarsToScene` from `game/modules/npc_scene_attach.js` after creating their THREE scene. The main lobby is patched automatically through `game/main.js`.
