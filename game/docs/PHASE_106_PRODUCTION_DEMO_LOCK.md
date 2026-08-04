# Phase 106 — Production Demo Lock

## Build

`SVR-PHASE-106-PRODUCTION-DEMO-LOCK`

## Purpose

Lock the current clean WebXR lobby as the production demo baseline after the Phase 99–105 cleanup sequence.

## Player-facing behavior

- Page title: `Scarlett Poker VR`
- Loading text: `Loading Scarlett Poker VR lobby...`
- No visible phase/debug/QA labels on the player overlay.
- Lobby opens through the short clean boot path.

## Current clean boot chain

1. `phase101_boot_load_screen_recovery.js`
2. `phase101_partial_runtime_render_guard.js`
3. `phase101_render_marker_cleanup.js`
4. `main.js`
5. `phase101t_lobby_interaction_portal_qa_lock.js`
6. `phase99_clean_expanded_lobby_rebuild_lock.js`
7. `phase98_second_floor_safety_floor_lock.js`
8. `phase101_second_floor_visibility_final_qa_lock.js`
9. `phase103_view_polish_lock.js`
10. `phase104_boot_integrity_clean_runtime_audit_lock.js`
11. `phase105_single_clean_boot_consolidation_lock.js`
12. `phase106_production_demo_lock.js`

## Protected runtime features

- Clean expanded lobby geometry
- Open spawn zone
- Corrected wall-mounted storefront signs
- Doorway pillars on left and right sides
- Correct upside-down-U arch geometry
- Solid floor/wall/threshold surfaces
- Second-floor/balcony safety floor
- Hand teleport ray/release chain
- Watch module
- Poker/card/chip action modules
- Portals
- Moon/Mars visibility

## Not touched

- `/site`
- public landing page
- poker logic
- watch logic
- movement logic
- private scene content

## Test URL

`https://svrpoker.com/game/?v=phase106-production-demo`

## Quest test checklist

1. Load game fresh with Ctrl+F5 or Quest browser refresh.
2. Confirm loading screen says `Scarlett Poker VR`.
3. Confirm no phase/debug text appears to the player.
4. Confirm spawn is open and clear.
5. Confirm storefront signs are inside/on the wall.
6. Confirm each doorway has one left pillar and one right pillar.
7. Confirm arches look like doorway arches.
8. Confirm second-floor/balcony surfaces are visible.
9. Confirm hand pinch shows ray/target before release.
10. Confirm release commits teleport.
11. Confirm poker table/cards/chips/watch remain visible.
