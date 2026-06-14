# Issue 95 — Phase 191 Patch Note

## Issue
`[launch-blocker][vr] Fix duplicate floor system`

## Patch
Phase 191 enforces floor authority for the current WebXR/game lobby.

## Result expected
- One authoritative visual floor.
- Decorative floor-like duplicates hidden.
- Phase188/Phase189 duplicate upper/sky-floor decks hidden or disabled.
- Collision remains mathematical/reference-space based.
- Teleport remains ray-to-Y=0 plus bounds clamp.
- Phase190 Quest controller teleport forward remains preserved.

## Test URL
`https://svrpoker.com/game/?v=phase191-floor-authority`

## Status
Patched. Quest/desktop verification pending before closing issue #95.
