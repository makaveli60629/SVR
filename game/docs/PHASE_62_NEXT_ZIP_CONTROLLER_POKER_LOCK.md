# PHASE-62-NEXT-ZIP-CONTROLLER-POKER-LOCK

## Locked fixes

- Updated visible build label to `PHASE-62-NEXT-ZIP-CONTROLLER-POKER-LOCK`.
- Removed public bottom `Table` and `old Reiki Room` buttons.
- Kept clean routing: Lobby, Seat, Reiki, Reiki Room, PGA, Legend, Sponsor, Scorpion.
- Added controller-proxy fallback for the wrist watch when hand tracking is unavailable.
- Removed live unapproved unapproved wellness/founder runtime branding and replaced it with neutral `AWAITING APPROVAL` sponsor placeholders.
- Preserved real lobby / VR-first path and current poker demo foundation.

## Test checklist

1. Load `/game/?v=phase62`.
2. Confirm top HUD says `PHASE-62-NEXT-ZIP-CONTROLLER-POKER-LOCK`.
3. Confirm no bottom `Table` or `old Reiki Room` button.
4. Enter VR and test controller fallback watch.
5. Sit at the open table seat and verify poker demo remains visible.
