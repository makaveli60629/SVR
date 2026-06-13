# PHASE-84-QUEST-TELEPORT-PRIVATE-ROUTE-LOCK

Game-side only. Website/site untouched.

## Locked changes
- Updated visible build label to `PHASE-84-QUEST-TELEPORT-PRIVATE-ROUTE-LOCK`.
- Fixed Quest controller right-stick forward/back movement while preserving 45° snap turn.
- Reworked controller teleport to hold A / grip / trigger, aim, release.
- Added visible purple controller teleport arc and floor marker.
- Corrected controller ray direction to prevent the teleport line aiming behind the player.
- Added private scene routes for Reiki, PGA Drive, Chip/Putt, Store, Lounge, and Scorpion.
- Replaced unapproved Reiki sponsor/founder runtime wording with red approval-safe placeholders.
- Removed unapproved Reiki media/audio payloads from package.
- Preserved lobby structure and poker table baseline.

## Test
1. Quest right stick up/down moves forward/back based on headset direction.
2. Right stick left/right snap-turns 45 degrees.
3. Hold A/grip/trigger: teleport arc appears in front. Release: teleport.
4. Bottom buttons open private scene pages.
5. Reiki runtime shows approval-safe SVR placeholders only.
