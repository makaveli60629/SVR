# Phase 411 — Tournament Flow + Bot Independence + Action Readability

## Scope
Android + iPhone shared mobile poker only. Quest gameplay and APK policy remain protected.

## Tournament page
- Practice and Regular cards are removed from the tournament portal.
- The top of the page now shows the next five-hour tournament slot and the most recent result.
- Featured tournament is a 100-player local simulation field: one local human plus up to 99 bot placeholders, with six visible seats at a time.
- Field size can be locally configured from 10 through 199 with `svr411_tournament_field_size`; default is 100.
- Surviving bot placeholders rotate into open visible seats as eliminations occur.
- Table changes show `GATHERING TABLE`; six remaining players show `FINAL TABLE`.
- A share button uses Web Share where available and clipboard fallback otherwise.

## Bot strategy
Phase 403 remains the poker/pot/betting authority. Phase 411 does not replace winner, pot, call or raise rules.

A separate strategy guard gives the five visible bots different re-raise tolerance and suppresses chain-raising when multiple raises occur on the same street:
- Claudia — AI 1 / Conservative
- Eric — AI 2 / Balanced
- Maya — AI 3 / Pressure
- Darius — AI 4 / Loose Aggressive
- Nova — AI 5 / Tricky

The guard never exposes another player's private cards to a bot. It only uses that bot's own cards, the public board and current action history.

## Readability
- Player names/stacks are made more readable without expanding the Phase 409 box footprint.
- Every Fold, Check, Call, Bet, Raise and All-In gets a large temporary action badge anchored to that player.
- A short global action ticker gives a fast glance at the latest action.
- Pot wins receive the same large feedback treatment.

## Multiplayer truth
- This is still a local browser tournament simulation.
- A secure authoritative match/tournament backend is still required for actual shared remote 100-player registration, live Guest 2 seating, synchronized tournament state and real peer voice.
- Missed five-hour slots continue to be reconciled by the existing local scheduler when a tournament/results page is next opened; a static page cannot execute while every client is closed.

## Protected
- Phase 403 poker engine and pot rules unchanged.
- Phase 410 mobile human input unchanged.
- Phase 409 player-turn guard unchanged.
- Phase 408 Hold'em street/call truth unchanged.
- Quest Phase 396 unchanged.
- APK remains 0.1.0-rc2, code 2, manual-only, no forced update/rebuild.
