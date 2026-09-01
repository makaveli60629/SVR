# Phase 438 — Dealer Lab Master Lobby + Camera 3 Lock

Build: `PHASE-438-LAB-MASTER-LOBBY-DEALER-AUTHORITY`

## Approved visual authority

- The approved Dealer Lab table is now the visible VR lobby table authority.
- The approved Dealer Lab Eric is bundled with that table as one reusable dealer/table module.
- Quest keeps the older production table and Eric only as hidden logical references so existing cards, seats, and gameplay are not broken during promotion.
- The visible table uses the Phase 437 Lab surface authority: black native felt, table-fit pass line, centered SVR logo, left/right sponsor positions, outer-edge-only leather/carbon handrest, and hidden protective top cover.
- Eric uses the Quest-approved manual scale `0.0047`, grounded to floor Y `0`, with the Lab texture set, idle/ready dealer pose, deck prop, and deal animation hooks.

## Camera 3

Permanent route: `/game/camera3-live.html?v=phase438`

Aliases:
- `/game/camera3.html?v=phase438`
- `/game/cam3.html?v=phase438`

Camera 3 boots the full desktop lobby, promotes the same Dealer Lab master module, and runs a slow four-shot director sequence around the lobby/final table. Camera 3 automatically runs Eric's deal loop for presentation.

## Scope guard

Phase 438 does not replace the poker rules engine, seat logic, pot settlement, Android/iPhone action logic, or public landing page. It promotes the approved Lab visuals while preserving the existing logical authorities underneath until the integrated Quest table is visually approved.
