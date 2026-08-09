# Phase 403 — Android Poker Engine Reliability + Table Clarity

## Goal
Make Android poker mechanically safer and easier to understand without disturbing the protected Quest or iPhone/Safari builds.

## Permanent table-flow authority
The visible Android action/dealer/deal order is permanently locked to:

`YOU (0) → Nova (5) → Claudia (1) → Eric (2) → Maya (3) → Darius (4) → YOU`

This same order controls:
- dealer-button movement,
- small blind and big blind,
- pre-flop action,
- flop/turn/river action,
- card-deal animation,
- Reiki tournament table order,
- odd-chip priority after split pots.

Critical regression: **Darius must advance to YOU whenever YOU is eligible.**

## Betting rules preserved
Phase 403 continues to use the Phase 398 raise-rule module:
- exact call difference,
- dynamic minimum raise based on the last full raise,
- RAISE TO labels,
- $50 raise steps,
- short all-ins do not reset the last full raise,
- short all-ins do not improperly reopen raising.

## Side pots and multiple all-ins
New Phase 403 pot authority records every player's committed chips for the full hand.

At showdown it derives:
- main pot,
- one or more side pots,
- player eligibility per pot,
- split-pot payouts,
- uncalled excess returns,
- odd-chip priority left-to-right from the dealer.

The runtime exposes an audit object containing table pot, tracked contributions, pot layers and reconciliation state.

Unmatched top-layer chips are shown as **UNCALLED RETURN**, not a false side pot.

## Tournament Ticket compatibility
The promotional Tournament Ticket remains non-cash.

Phase 403 corrects its showdown ownership rule:
- the ticket follows the **main-pot winner(s)**,
- a player who wins only a side pot does not take the special ticket,
- a tied main pot gives each tied main-pot winner one promotional ticket.

## Showdown teaching
The existing exact best-five evaluator remains in use.

Phase 403 adds a pot-by-pot showdown sheet for complex hands:
- exact pot amount,
- winner(s) of each pot,
- hand category,
- highlighted best-five cards,
- user's hand when useful,
- returned uncalled chips.

The standard Phase 399 showdown sheet remains for simple one-pot hands.

## Table clarity
New compact Android UI layer:
- `LEFT → RIGHT` flow rail,
- strong active-player outline,
- animated turn arrow,
- exact current action prompt,
- recent actions on the rail,
- `HISTORY` button with full current-hand action trail,
- graphical five-card examples inside the HANDS guide,
- side-pot badge when multiple contested pots exist.

The layer is designed to stay compact in portrait and in the Phase 401 sideways handheld layout.

## Bot personalities
The five local opponents now have distinct decision profiles:
- Claudia — **TIGHT**
- Eric — **BALANCED**
- Maya — **AGGRESSIVE**
- Darius — **LOOSE AGGRESSIVE**
- Nova — **TRICKY**

The bots use hand strength, call pressure, aggression and bluff tendency rather than one shared random threshold.

## Tournament clarity
REIKI FIRST 50 keeps the Phase 401 structure:
- registration template cap: 50,
- current local test field: 10,
- bots fill missing local entries,
- starting stack: 10,000 tournament chips,
- winner prize: 100,000 regular play chips,
- levels advance every 2 completed rounds,
- 24-hour champion crown.

Phase 403 adds:
- current user position,
- average tournament stack,
- next blind/ante level,
- rounds until the next level,
- pot-aware last-hand history (including side-pot wins).

## Multiplayer truth
The Android matchmaking/WebRTC client remains prepared, but production still has no secure shared `wss://` game-sync/signaling backend configured.

Therefore:
- real cross-device matchmaking is **not live**,
- shared 50-player tournament registration is **not live**,
- cross-device crown/profile sync is **not live**,
- live voice is **not live**,
- bot fallback remains authoritative.

## Protected platforms
- Quest remains `PHASE-396-QUEST-SEATED-CLEAN-TABLE-DEAL-LOCK`.
- iPhone/Safari remains `PHASE-400-IPHONE-SAFARI-WEB-GAME-LOCK`.
- Camera 3 remains Phase 392.

## APK policy
Unchanged:
- version name `0.1.0-rc2`,
- version code `2`,
- manual updates only,
- no forced update prompt,
- no native APK rebuild for Phase 403.

## New Phase 403 files
- `game/modules/phase403_android_pot_rules.js`
- `game/modules/phase403_android_gameplay.js`
- `game/modules/phase403_android_table_clarity.js`
- `game/styles/phase403_android_table_clarity.css`
- `game/android-stable-phase403.html`
- `.github/workflows/phase403-android-poker-engine-reliability-audit.yml`

## Main Android routes
- Hub: `/game/android.html?channel=stable&v=phase403`
- Practice: `/game/android-tabletop.html?v=phase403&mode=practice`
- Regular: `/game/android-tabletop.html?v=phase403&mode=regular`
- Tournament lobby: `/game/tournaments.html?v=phase403`
- Reiki tournament: `/game/android-tabletop.html?v=phase403&mode=tournament&tournament=reiki-first-50`
- Results: `/game/tournament-results.html?v=phase403`
- Direct runtime: `/game/android-stable-phase403.html?v=phase403&mode=regular&direct=1`

## Automated acceptance
Phase 403 CI includes:
- 10,000 permanent seat-cycle repetitions,
- all six dealer/blind anchors,
- explicit multi-all-in side-pot scenarios,
- uncalled-return checks,
- odd-chip split checks,
- 12,000 randomized contribution/payout conservation scenarios,
- protected Phase 398 raise regression,
- protected Phase 399 learning/match regression,
- protected Phase 401 tournament/crown/landscape regression,
- protected Phase 400 iPhone/Safari regression,
- protected Phase 396 Quest regression.

## Physical acceptance still required
CI validates source logic and deployment contracts, not a physical Android handset. On-device acceptance should watch several complete hands, including an all-in if possible, and confirm the visible left-to-right flow, legal actions, action history, showdown explanation and landscape fit.
