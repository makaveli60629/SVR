# PHASE-232-BRIDGE-ALIAS-RECOVERY-LOCK

## Purpose
Prevent boot-route confusion after cache/import failures by adding a dependency-free route recovery module and correcting fallback private-scene links.

## Added
- `game/modules/boot_route_recovery.js`
- `window.SVR_BOOT_ROUTE_RECOVERY`
- `R` keyboard shortcut for route recovery panel
- direct links for Lobby, Scorpion, PGA Drive, Chip/Putt, Reiki Room, VR Store, Smoker Lounge, and Cam 3
- Phase 213 cache-bust alignment in boot/fallback/private links

## Protected
- Public Matrix launch page untouched
- Dealer body remains disabled
- Invisible card/deal logic preserved
- Game remains under 25 MB
