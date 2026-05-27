# PHASE 281 — Overnight Stability Lock Plan

Updated: 2026-05-27T04:45:00Z
Track: Game-side only
Site touched: false

## Current Repo Audit

The repo was audited before this plan was written. Current direct game files still report Phase 271, so the next execution must push direct `/game` file changes, not only ZIP files.

Observed current state:
- `game/version.json` reports `PHASE-271-TELEPORT-VIEW-PERFORMANCE-LOCK`.
- `game/index.html` still loads `boot.js?v=phase271-teleport-view-performance` and displays the Phase 271 HUD badge.
- `game/main.js` still creates the Phase 265 visible lobby shell and Phase 266 early render loop.
- `game/modules/hands.js` still updates fire/lightning hand glow every frame.
- `.github/workflows/deploy.yml` deploys committed direct files and excludes `update/` and `*.zip`.

## Phase 281 Goal

Create the last overnight stability lock so the morning test starts from a clear build:

- One lobby only.
- No duplicate emergency lobby layer blocking the table.
- Teleport is hold → aim → release.
- Hand fire/glow only appears while teleport is armed.
- HUD/debug clutter is hidden from the central spawn view.
- Runtime shield does not remain stuck over a visible lobby.
- Build labels and cache tags advance beyond stale Phase 271.
- A clear completed/still-to-finish manifest is saved.

## Completed Before This Phase

- Route health exists.
- Direct game deploy workflow exists.
- Runtime shield fail-open work exists.
- Early render fallback exists.
- Missing asset fallback/registry exists.
- Store/Reiki/PGA/Smoker/Scorpion private scene routes exist.
- Quest controller movement and snap-turn logic exists in `teleport.js`.
- Teleport release logic was partially repaired in Phase 271.

## Must Finish In Phase 281

- Apply a direct committed game patch.
- Remove stale Phase 271 labels from direct game files.
- Hide emergency fallback walls from the spawn/table view.
- Hide old fallback duplicate table layer when real table objects exist.
- Make hand fire/glow teleport-active-only.
- Hide optional loader/debug/HUD panels unless manually opened.
- Add overnight QA manifest and tomorrow task list.

## Tomorrow Checklist

1. Test Quest load with cache-busted URL.
2. Confirm build label shows Phase 281.
3. Confirm one lobby only.
4. Confirm no fallback wall blocks the table.
5. Confirm hand fire/glow is off when teleport is off.
6. Confirm A/grip/trigger hold aims teleport.
7. Confirm release completes teleport.
8. Confirm right stick forward/back movement.
9. Confirm right stick 45-degree snap turn.
10. Confirm watch remains visible and not upside down.
11. Confirm store kiosk/portal opens.
12. Confirm private routes load: Reiki, PGA Drive, Chip/Putt, VR Store, Smoker, Scorpion.
13. Begin Phase 282 only after the lobby/teleport baseline is verified.

## Phase 282 Recommendation

PHASE-282-QUEST-WATCH-LOCOMOTION-SEATED-TABLE-POLISH

Scope:
- watch orientation polish
- seated table height alignment
- card/chip readability at table
- no new room additions
- no site edits
