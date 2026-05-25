# PHASE-175-CLEAN-RUNTIME-POKER-DB-LOCK

Date: 2026-05-25

## Locked rules
- Public Matrix launch page remains untouched.
- Game runtime cleaned and advanced only.
- Internal `/site/` wiring patches are allowed; root public files are not.
- Database/backend starter is separate and secure; no SQL/Stripe secrets in frontend.
- Game zip remains under 25 MB.

## Corrections made
- Replaced stale Phase 39 title/build markers with `PHASE-175-CLEAN-RUNTIME-POKER-DB-LOCK`.
- Removed unapproved Reiki sponsor/runtime references from live code and docs.
- Removed unapproved Reiki media assets.
- Disabled visible dealer FBX loading while preserving invisible card/deal logic.
- Added player poker action bridge: Fold, Call/Check, Raise, All-In, Next Hand.
- Added private-scene routing buttons for Reiki, PGA Drive, Chip/Putt, VR Store, Smoker Lounge, and Scorpion.
- Kept lobby as a portal hub; real experiences remain separate pages.

## Controls
- F = Fold
- C = Call/Check
- R = Raise
- A = All-In
- H = Next Hand
- 1 = Lobby
- 2 = Seat
- 3 = Reiki Hub
- 4 = Reiki Room
- 5 = PGA Hub
- 6 = PGA Drive
- 7 = Chip/Putt
- 8 = VR Store
- 9 = Scorpion
