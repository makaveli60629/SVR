# Phase 176 — Live QA Authority Lock

## Scope
Game-side only. No website or site edits.

## Purpose
Keep the active runtime modules visible and auditable after boot.

## Changes
- Bumps active game module cache keys to `phase176`.
- Adds `game/modules/phase176_live_qa_authority_lock.js`.
- Keeps checking whether the active teleport, table, sky, overlay, position display, and playable poker modules are loaded.
- Keeps black/square overlay DOM nodes hidden.
- Keeps `index.html` as a module activator only.

## Runtime audit
```js
SVR_RUN_PHASE176_LIVE_QA_AUDIT()
```

## Test URL
`/game/?v=phase176-live-qa-authority`
