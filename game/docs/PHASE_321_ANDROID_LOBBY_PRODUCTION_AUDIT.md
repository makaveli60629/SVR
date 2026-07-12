# Phase 321 — Android Lobby Production Audit Lock

## Scope

Game-side only. The website and site files are not changed.

Primary target: make the existing planned SVR lobby practical to test from an Android phone while preserving Quest/controller code for later headset testing.

## Audit findings

### Fixed in this phase

1. **Android was not routed to the dedicated phone build.**
   - `/game/` loaded the standard phase stack on Android.
   - The dedicated `/game/android.html` route existed but required manual navigation.
   - Android now automatically routes to `android.html` unless the request is an iframe/director preview or explicitly asks for standard/desktop mode.

2. **The Android walking boundary was smaller than the planned lobby.**
   - The touch module converted the lobby's `roomClamp` function to a number, failed, then used a hard maximum near 7.25 meters.
   - The planned storefront bays are around 12 meters from center and the room is roughly 39 × 33 meters.
   - The controller now calls the lobby's real `roomClamp(x,z)` function, allowing the phone player to reach the planned Reiki, PGA, store, and Scorpion bays while staying inside the floor.

3. **The normal Android route was a debug/recovery experience rather than a presentable test build.**
   - Walking started disabled.
   - Multiple safe-mode banners and recovery panels covered the lobby.
   - Phase 321 loads dual-stick movement by default and removes the legacy debug overlays from the production phone route.

4. **Preview-only camera polish loaded during ordinary game sessions.**
   - Phase 94/95 preview modules were imported unconditionally from `game/index.html`.
   - They now load only in iframe/director/preview mode.

5. **Android performance needed a lobby-preserving cleanup.**
   - Shadows remain disabled.
   - Mobile pixel ratio starts at 0.72 and adapts down only when sustained frame rate is low.
   - Small column glow rings, upstairs posts/glass, decorative bulbs, and five wall-bay point lights are disabled on Android only.
   - Core architecture, arches, signs, table area, Moon, Mars, portal bays, and the two-floor planned lobby remain visible.

## Android controls

- Left stick: camera-relative walk/strafe.
- Right stick: look/turn.
- Lobby: returns to the main spawn.
- Seat: moves to the open south seat and attempts table join.
- Center: resets camera position and direction.
- Movement is smoothed and held at standing eye height.
- Touch zoom, text selection, and page scrolling are blocked inside the game.

## Planned lobby baseline preserved

- Large two-floor lobby shell.
- Rear arch bays for Reiki/Wellness, PGA, Play Game, SVR Store, and Scorpion.
- Main poker table area.
- Red carpet and portal pads.
- Moon and Mars high above the rear wall.
- Jumbotron, sponsor, daily bonus, events, legends, and upper-level placeholders.

## Remaining completion work

### P0 — Poker correctness

The current poker module is a playable simulation, but it is not release-correct Texas Hold'em yet.

- Replace the approximate/random showdown scoring with deterministic seven-card evaluation.
- Add straights, straight flushes, kickers, ties, split pots, side pots, and correct all-in settlement.
- Enforce player turn order before accepting actions.
- Rotate dealer button and blinds each hand.
- Preserve stacks between hands instead of resetting every player to 50,000.
- Reconcile visual card/chip movement with the authoritative state.

### P0 — Android device QA

- Test portrait-blocking/landscape handling on the user's Android phone.
- Verify dual-touch does not drop one stick when the other is active.
- Verify lobby, table, seat, Reiki, PGA, store, and Scorpion positions are reachable.
- Record sustained FPS and memory behavior during a five-minute lobby walk.
- Verify back-button and tab-resume recovery.

### P1 — Private scene routing

- Lobby storefronts should open dedicated private scene pages instead of only moving the camera to storefront coordinates.
- Verify Reiki, PGA drive, chip/putt, lounge, store room, and Scorpion scene entry and return-to-lobby behavior.

### P1 — Final NPC/table presentation

- Replace remaining procedural/placeholding player bodies with optimized seated GLB avatars.
- Verify table FBX, chair height, labels, cards, and chips on Android.
- Keep one open south/front user seat.

### P1 — Multiplayer

- Current presence/status modules are not a complete authoritative multiplayer poker backend.
- Finish room authority, reconnect, seat ownership, action validation, anti-cheat boundaries, and server-side hand state before claiming multiplayer-ready.

### P2 — Packaging and cleanup

- Remove obsolete phase modules after visual regression testing.
- Consolidate duplicate Android/recovery modules.
- Add a release build/version registry that matches the actual runtime.
- Audit large textures/models and keep the shipped package within the locked size budget.

## Validation performed

- JavaScript syntax checked for the new Phase 321 modules.
- Android route module list reduced to the active runtime, recovery guard, production optimizer, and poker core.
- No site files changed.
