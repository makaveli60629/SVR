# Phase 85 — Lobby Edit Unlock

Scope: game-side only.

## Purpose
Unlock the lobby phase for targeted edits while preserving the single original lobby baseline.

## Locked protections kept
- Original lobby remains the only lobby shell.
- No second embedded lobby room is allowed inside the lobby.
- Reiki, Scorpion, PGA, Store, and Sponsor areas should remain portal/storefront markers in the lobby.
- Full private experiences must stay outside the lobby or route to separate pages/scenes.
- Website/site files are untouched.
- Music/autoplay remains disabled in this phase.
- Unapproved Reiki sponsor/founder branding remains removed.

## What changed
- Build label updated to PHASE-85-LOBBY-EDIT-UNLOCK.
- Lobby edit state exposed at `window.SVR_LOBBY_PHASE`.
- Duplicate Table and Reiki Room bottom buttons removed.
- Watch scene buttons simplified to current lobby portal routes.
- Heavy in-lobby Reiki/Scorpion room shells replaced with thin portal markers.
