# Phase 442 — Avatar Lab Real Geometry + Motion Lock

## Outcome

- Adds the private `/game/labs/avatar/` route and `/game/avatar-lab.html` redirect.
- Uses the textured Eric and Claudia production FBX bodies, not placeholder bodies.
- Adds owner-supplied idle, walk, run and jump clips for both bodies, plus Eric's sitting clip.
- Activates curved fitted wardrobe geometry: jacket, vest, hoodie, sleeves, cap, beanie, crown, glasses, visor, shoes, chain, watch and badge.
- Saves one schema-versioned avatar selection to `svrPlayerAvatarV2` for the later profile/game bridge.
- Preserves the Phase 441 table and Phase 440 single-table/single-Eric production authorities.
- Makes Dealer Lab cards launch from Eric's rig-reported right-hand origin.

## QA contract

`window.SVR_AVATAR_LAB.qa()` must report a loaded textured model, a live motion action and a passing viewer audit.
