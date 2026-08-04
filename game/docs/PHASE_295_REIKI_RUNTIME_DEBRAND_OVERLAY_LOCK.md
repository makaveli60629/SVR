# Phase 295 — Reiki Runtime Approval Overlay Lock

## Scope

Game-side runtime patch only. Website files and `/site` were not touched.

## Reason

A runtime audit found active lobby canvas textures in `game/modules/world_skyline.js` that still draw old Reiki partner wording into the lobby storefront. Historical docs and backups still contain old wording, but those are not active runtime files.

## Changed files

- `game/phase295_reiki_runtime_debrand_overlay.js`
- `game/index.html`
- `game/docs/PHASE_295_REIKI_RUNTIME_DEBRAND_OVERLAY_LOCK.md`

## Runtime behavior

- Adds a high-render-order approval-safe overlay in the Reiki storefront area.
- Covers old lobby signage with SVR-safe placeholder panels.
- Displays `REIKI HUB`, `SVR WELLNESS PREVIEW`, `AWAITING APPROVAL`, and `ENTER REIKI HUB`.
- Keeps the existing lobby geometry intact.
- Does not remove historical docs or backup folders.

## Protected areas

- Root public website not edited.
- `/site` not edited.
- Poker table, movement, moon, Mars, watch, and private scenes preserved.
- No stale `game.zip` uploaded.

## Test routes

- `/game/?v=phase295-reiki-approval-overlay`
- `/game/reiki.html?v=phase295-private-reiki`
- `/game/range.html?v=phase295-pga-range`
