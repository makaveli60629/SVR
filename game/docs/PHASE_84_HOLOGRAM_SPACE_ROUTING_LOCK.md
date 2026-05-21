# Phase 84 — Hologram Visibility + Space Station Private Route Lock

## Scope

Game-side only.

This phase does not touch website or site files and does not redesign the lobby geometry.

## Changes

- Added guaranteed DOM hologram fallback overlay for cases where the 3D hologram card mesh is not visible in Quest/browser testing.
- Wired watch HOLO action to use the fallback overlay when needed.
- Added Space Station as a private-scene route.
- Added `game/space-station.html` as a lightweight private space-station placeholder.
- Added Space Station to the route registry and bottom route button.
- Added Space Station action to the hologram fallback menu.
- Refined fist gesture detection slightly to reduce accidental toggle while preserving the working fist teleport.

## Space Station asset note

Uploaded source assets:

- `Space Station Scene.fbx`
- `Space Station Scene.blend`

These are reserved as source/reference assets. They are not shipped directly in this phase to avoid breaking the 25 MB package rule or introducing unoptimized runtime payloads.

Recommended next step:

- Convert/optimize the source scene into a web-safe GLB.
- Audit size and texture payload.
- Only then add it to the private Space Station scene.

## Protected locks

- Website/site untouched.
- Lobby geometry untouched.
- Current working fist teleport preserved.
- Quest/Oculus controller fallback preserved.
- Private scenes stay separate from lobby.
- Hologram fallback is UI-only and removable.

## Test checklist

- Game boots.
- Fist teleport still toggles ON/OFF.
- Active hand glow remains visible.
- Watch HOLO opens visible fallback panel if the 3D hologram is not visible.
- Space button opens `space-station.html`.
- Hologram Space Station button opens `space-station.html`.
- Other private routes still open.
- Site remains unchanged.
