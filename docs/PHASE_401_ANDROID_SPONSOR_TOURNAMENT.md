# Phase 401 — Android Sponsor Tournament + Landscape Handheld Polish

## Scope
Android web gameplay only. Quest remains Phase 396. iPhone/Safari remains Phase 400. Phase 398 betting math and Phase 399 learning/winner presentation are protected.

## Android game modes
- **Practice** — existing table, bots, HANDS guide, Smart Hand Coach.
- **Regular** — existing table and matchmaking-ready path with bot fallback.
- **Tournament** — dedicated Reiki First 50 local test tournament.

## Reiki First 50 tournament
- Sponsor: REIKI.
- Registration template cap: 50 real players.
- Current local test field: 10 entrants.
- One real player is enough to run the test; bots fill open entrants.
- Featured visible table: 6 seats so the phone layout remains readable.
- Starting tournament stack: 10,000 tournament chips.
- Winner prize: 100,000 regular play chips.
- Tournament bankroll is isolated from the regular play-chip stack.
- Results persist locally and are shown on `/game/tournament-results.html?v=phase401`.
- Tournament lobby/status is `/game/tournaments.html?v=phase401`.

## Blind / ante schedule
A level lasts two completed tournament rounds.

1. 50 / 100 — ante 0
2. 75 / 150 — ante 25
3. 100 / 200 — ante 25
4. 150 / 300 — ante 50
5. 200 / 400 — ante 50
6. 300 / 600 — ante 100
7. 400 / 800 — ante 100
8. 500 / 1,000 — ante 150
9. 750 / 1,500 — ante 200
10. 1,000 / 2,000 — ante 300

## Learning support
- Phase 399 **HANDS** button is preserved.
- Smart Hand Coach is preserved.
- Exact best-five card highlighting is preserved.
- Tournament lobby and Results page include a separate Poker Hands Card showing all ten Texas Hold'em hand categories.

## 24-hour champion crown
- The local user receives a **REIKI CHAMPION** crown if they win the tournament.
- Crown lifetime is exactly 24 hours from the saved tournament completion timestamp.
- Reopening/reloading the game does not extend the crown.
- Crown appears by the Android player/profile identity and table seat.
- Crown metadata is exposed for future multiplayer profile sync.
- Cross-device visibility is **not live** until the secure multiplayer/profile backend exists.

## Landscape handheld redesign
The sideways Android view has its own layout for screens up to 620px high:
- compact top/profile/status rows;
- wider usable table center;
- smaller perimeter opponent panels;
- compact dealer/sponsor/board presentation;
- board and hole cards remain readable;
- raise controls reflow horizontally;
- Fold / Check-Call / Raise / All-In stay visible at the bottom;
- footer controls are reduced and horizontally scrollable;
- portrait layout is not overridden.

Phase 401 landscape/tournament CSS and runtime modules are conditionally loaded only when the shared mobile table is **not** running as iPhone/iPad/Safari.

## Multiplayer status
The repository still has no production secure `wss://` matchmaking/tournament service. Therefore:
- the 50-player cap is a tournament template, not a cross-device authoritative registration count yet;
- Phase 401 local testing uses 10 entrants with bots filling open spots;
- real-player matchmaking and voice remain readiness features;
- shared tournament state, real cross-device placements, and cross-device crown visibility require the multiplayer backend.

## Protected systems
- Phase 398 Check / Call / Raise-To math unchanged.
- Phase 397 clockwise action order unchanged.
- Phase 399 HANDS / Smart Hand Coach / showdown highlights unchanged.
- Phase 396 burn tray / community cards / dealer button presentation preserved.
- Quest Phase 396 unchanged.
- iPhone/Safari Phase 400 protected from Phase 401 Android-only layout/runtime.
- APK remains `0.1.0-rc2`, version code `2`, manual-only; no native rebuild or forced update.

## Test checklist
1. Open `/game/android.html?channel=stable&v=phase401` and confirm Practice / Regular / Tournament choices.
2. Rotate Android sideways and confirm table is taller/cleaner with betting controls visible.
3. Open Tournament and confirm REIKI FIRST 50 status page.
4. Confirm Poker Hands Card lists Royal Flush through High Card.
5. Enter tournament and confirm 10,000 tournament stack, 10-player field counter and 100,000 prize display.
6. Complete two tournament rounds and confirm level increases on the next round.
7. Confirm tournament bankroll does not permanently replace the regular stack.
8. Confirm Results page shows placements/champion.
9. If local user wins, confirm 100,000 regular play chips are awarded and crown appears.
10. Reload and confirm crown remaining time decreases instead of resetting to 24 hours.
11. Confirm crown disappears after expiry.
12. Recheck Phase 398 Check / Call / Raise-To behavior.
13. Recheck iPhone/Safari and Quest entry routes for regressions.
