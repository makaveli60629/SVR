# Phase 64 — Game Matrix Secret Phrase Lock

## Scope
Adds a game-side Matrix rain layer only.

## Locked secret phrases
- I LOVE SHY
- I LOVE SCARLETT

## Rules preserved
- Public page untouched
- Official website baseline untouched
- Game features untouched
- Matrix letters are embedded one-by-one in the binary rain
- Low opacity / low frame rate for Quest safety

## Files added
- game/modules/game_matrix_secret.js

## Patch target
- game/main.js imports and initializes the Matrix secret layer after renderer creation.
