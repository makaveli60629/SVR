# PHASE-170-PLAYABLE-POKER-TEST-LOCK

Date: 2026-05-24
Scope: game-side only. Website/site files are not included.

## Phase goals
- Move the uploaded build forward from stale P39/P95 labels into a current phase marker.
- Clean approval-sensitive Reiki runtime content.
- Keep the lobby as the working baseline without redesigning it.
- Add basic manual poker test controls for desktop and watch-based interaction checks.
- Keep the build package under 25 MB.

## Changes included
- Updated visible build label to `PHASE-170-PLAYABLE-POKER-TEST-LOCK`.
- Removed public `Table` and `Zen Den` bottom buttons from the lobby UI.
- Added desktop poker action buttons: Fold, Check, Call, Raise, All-In, Next Hand.
- Added keyboard poker controls: F fold, X check, C call, R raise, A all-in, H next hand.
- Added watch poker action buttons for Fold, Check, Call, Raise, and All-In.
- Neutralized Reiki storefront with SVR-owned `AWAITING APPROVAL` placeholders.
- Removed unapproved Reiki sponsor/founder runtime assets and old docs containing those references.
- Disabled visible Eric/dealer body loading while preserving invisible dealing/card logic.
- Preserved five seated bots plus the open south/front player seat.
- Preserved left-to-right animated dealing, hand evaluation, pot display, board cards, Moon/Mars, skyline, portals, and Quest/WebXR route.

## Testing target
This phase is suitable for first playable-table QA, not final public launch. The next lock should convert the current demo action layer into a true turn-gated betting state machine.
