# Phase 84 — Lobby Visual Match + Portal Polish Lock

## Goal

Match the current target screenshot direction without redesigning the game: grand curved casino lobby, clean arch/storefront framing, high Moon/Mars, readable sponsor/jumbotron panels, clean bottom portal routing, and clear walking path.

## Changed files

- `game/phase295_storefront_doorway_trim_lock.js`
- `game/docs/PHASE_84_LOBBY_VISUAL_MATCH_PORTAL_POLISH_LOCK.md`

## Runtime label

`PHASE-84-LOBBY-VISUAL-MATCH-PORTAL-POLISH-LOCK`

## What Phase 84 does

- Upgrades the existing active arch/doorway trim layer instead of creating a new lobby shell.
- Keeps the current lobby baseline intact.
- Adds stronger luxury casino-style pillar and arch accents.
- Adds darker readability backplates behind storefront/display panels.
- Adds gold/cyan threshold lines at portal entrances.
- Keeps pillars outside display text areas.
- Keeps arch top above display panels.
- Protects portal labels, hitboxes, rings, and buttons from being hidden behind frames.
- Protects the central carpet/walkway from obstructions.
- Adds Phase 84 QA telemetry at `window.SVR_PHASE84_LOBBY_VISUAL_MATCH_PORTAL_POLISH_LOCK`.

## Protected systems

- Website and `/site` were not touched.
- Public Matrix page was not touched.
- Poker logic was not touched.
- Dealer, cards, chips, pass line, and SVR table logo were not touched.
- Quest locomotion was not touched.
- Watch controls were not touched.
- Private scene routing was not touched.
- Moon/Mars modules were not touched.

## Lobby structure rule

The lobby remains a portal hub only:

- Main poker table
- Wellness/Reiki storefront portal
- PGA storefront portal
- Smoker Lounge portal
- Scorpion Room portal
- Store/Sponsor portal surface
- Sponsor placeholders and jumbotrons

The lobby must not physically contain the full Reiki room, full PGA range, full lounge, full Scorpion room, or full store room.

## Visual QA checklist

- Pillars sit outside display text.
- Arch tops sit above display panels.
- Backplates make writing easier to read.
- Jumbotrons and sponsor panels remain visible.
- Portal rings/buttons remain reachable.
- Red carpet/walkway remains clear.
- The lobby still matches the current curved casino layout.
- Moon and Mars remain high and visible through existing sky modules.

## Test URL

`/game/?v=phase84-lobby-visual-match`
