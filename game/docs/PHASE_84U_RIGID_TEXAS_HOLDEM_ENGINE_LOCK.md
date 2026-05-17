# Phase 84U — Rigid Texas Holdem Engine Lock

Game-side only. Website untouched.

## Added

- Dealer button advances clockwise one seat each hand.
- Small blind and big blind post before cards are dealt.
- Hole cards are dealt one at a time clockwise starting left of the dealer button.
- Standard Texas Holdem street flow: preflop, burn/flop, burn/turn, burn/river, showdown.
- Validated actions: Fold, Check, Call, Bet, Raise, All-In.
- Blocks illegal check when a bet is live.
- Raise sizing tracks the previous raise/minimum raise rule.
- 52-card deck evaluator with kickers for: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card.
- Side-pot calculation and visual center-pot separation for all-in stack differences.
- Ten-second floating winner reveal above the table.
- Private card peek support with `P`; desktop poker actions use `F`, `C`, `R`, `A`, `H`.
- Haptic pulse hooks through Web Gamepad vibration when hardware supports it.

## Preserved

- Wrist watch/native hand phase.
- Existing hand textures and hidden controller strategy.
- Moon/Mars/orbiting sky and strategic ad skyline.
- Main lobby and private scene routing.
- Reiki approval lock and site untouched lock.
