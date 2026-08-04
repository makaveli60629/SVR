# SVR Poker Phase 376 — Android Immediate Join and Safe Play Lock

## Root cause

Phase 375 automatically started the full 3D module stack about 160 ms after page load. The `JOIN NOW` authority loaded last. If `main.js`, the table asset, poker boot, or controller initialization stalled, Android never reached the code that created the Join button.

## Phase 376 correction

- `JOIN NOW` is static HTML and is visible before any Three.js game module loads.
- The 3D room no longer starts automatically.
- Pressing `JOIN NOW` starts a lean critical boot sequence and then immediately seats the player and starts a fresh 15,000-chip hand.
- Settlement, bankroll synchronization, full-hand compatibility, and controller cleanup are deferred until after seating.
- Legacy SIT, SEAT, PLAY GAME, LOBBY, and CENTER controls are hidden.
- Low-power rendering is selected before the 3D lobby starts.
- A visible `SAFE TABLE` button is always available at startup.
- Any critical 3D boot failure automatically opens the lightweight playable safe table.
- The safe table includes six players, two player cards, community-card streets, betting actions, showdown evaluation, pot settlement, and persistent player stack.
- Service-worker and app caches advance to the `phase376` epoch.

## Stable route

`/game/android.html?channel=stable&v=phase376`

## APK policy

- Version name: `0.1.0-rc1`
- Version code: `1`
- Forced update: `false`
- Native rebuild: `false`

The existing APK continues loading the stable web route.

## Acceptance

1. `JOIN NOW` appears immediately after the page opens.
2. `SAFE TABLE` appears immediately beside the reload option.
3. The 3D lobby does not start until `JOIN NOW` is pressed.
4. Successful 3D boot seats the player and starts a fresh hand.
5. A critical 3D failure opens the safe playable table instead of leaving a frozen screen.
6. No legacy SIT or SEAT control remains visible.
