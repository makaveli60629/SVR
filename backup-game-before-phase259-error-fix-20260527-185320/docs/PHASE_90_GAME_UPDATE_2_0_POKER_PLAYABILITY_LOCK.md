# Phase 90 — Game Update 2.0 Poker Playability Lock

## Scope
Game-side only. The public website and site pages are untouched.

## Baseline preserved
- Original lobby only
- No second lobby / duplicate room walls
- Minor lobby edits only
- Private scenes remain separate from the lobby
- Moon/Mars, watch, teleport, locomotion, poker table, and portal markers preserved

## Poker upgrades
- Converted the poker module from mostly timed demo behavior into a playable action loop.
- Added player decision pauses at preflop, flop, turn, and river.
- Added controls: Fold, Check/Call, Raise, All-In, Next Hand.
- Added keyboard actions: `F`, `C`, `R`, `A`, `H`.
- Added watch poker controls tied to the same action API.
- Added stack accounting, blind posting, pot updates, bot decisions, and winner payout.
- Preserved left-to-right dealing from dealer button order.
- Enlarged card face rendering for readability.

## Safety locks
- Dealer body remains disabled/invisible.
- Poker logic stays inside `game/modules/poker_demo.js`.
- No lobby redesign.
- No embedded second lobby.
- No site edits.
- No autoplay music added.
- No unapproved Reiki/founder/sponsor branding added.

## Next recommended phase
Phase 91 — Poker UX + Watch Status Polish: raise amount UI, active turn glow refinement, hand history strip, and Quest seating verification.
