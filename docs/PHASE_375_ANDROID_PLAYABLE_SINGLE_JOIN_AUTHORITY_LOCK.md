# SVR Poker Phase 375 — Android Playable Single Join Authority Lock

## Purpose

Phase 375 replaces the conflicting Android boot sequence that allowed the Phase 343 SIT HUD, pre-join cards, duplicate seat controls, and stalled join recovery to appear on the stable Android route.

## Locked Android Route

`/game/android.html?channel=stable&v=phase375`

## Runtime Changes

- Uses a curated Android module load order instead of the stale Phase 367 platform manifest.
- Loads the verified canonical table asset before the poker engine and controller.
- Does not load the Phase 343 SIT HUD or Phase 344 legacy input layer.
- Loads one controller authority: Phase 347.
- Loads one pre-play authority: Phase 375 `JOIN NOW`.
- Parks the poker engine in an idle, zero-card state until `JOIN NOW` succeeds.
- Hides all legacy SIT, SEAT, PLAY GAME, LOBBY, CENTER, and duplicate JOIN controls.
- Calls the Phase 347 seat API, starts a fresh 15,000-chip six-player hand, and corrects the camera only after joining.
- Provides a lightweight emergency table only if both verified table assets fail.
- Applies the Android low-power renderer budget at startup and after major frame gaps.
- Clears stale SVR service-worker caches once for the Phase 375 epoch.

## APK Policy

- Version name: `0.1.0-rc1`
- Version code: `1`
- Forced update: `false`
- Automatic prompt: `false`
- Native rebuild: `false`

The existing APK continues to load the stable web runtime. No forced APK reinstall is claimed.

## Acceptance

The production workflow runs:

`node game/tools/phase375-android-playable-static-test.mjs`

Physical-device checks remain:

1. Only `JOIN NOW` is visible before play.
2. No cards are visible before joining.
3. The poker table is visible.
4. `JOIN NOW` seats the player and starts the first hand.
5. Fold, check, call, raise, all-in, movement, and look remain responsive.
6. `LEAVE TABLE` returns to a clean no-card lobby.
