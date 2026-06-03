# Phase 98S-K — Duplicate Portal Cleanup + Storefront Wall Fit

Date: 2026-06-02
Track: game-side only

## Purpose

Refine the Phase 98S-J lobby portal/ad overlay so storefronts feel attached to the wall and duplicate portal clutter is reduced.

## Files changed

- `game/modules/lobby_ads_portals_patch.js`
- `game/index.html`
- `game/docs/PHASE_98S_K_STOREFRONT_WALL_FIT_CLEANUP.md`

## What changed

- Updated lobby ads/portals patch from Phase 98S-J to Phase 98S-K.
- Added stronger attached storefront shells.
- Added side return walls so storefronts look connected to the wall.
- Pulled portal rings/glows into the storefront frames.
- Added base foot pieces to make the hubs feel grounded.
- Added duplicate suppression pass near the new portal/storefront positions.
- Hides old Phase 98S-J overlay if present.
- Preserved leaderboards and ad banners.

## Storefronts covered

- Reiki Hub
- PGA Training
- SVR Store
- Smoker Lounge
- Scorpion Room

## Protected locks

- Scorpion portal lock preserved at X 12.78 / Y 1.60 / Z 15.75 and yaw 51.78.
- Reiki hologram/audio containment preserved.
- Moon/Mars patch preserved.
- Android controls preserved.
- Runtime snap guard preserved.
- Website/site untouched.

## Runtime debug object

```js
window.SVR_LOBBY_ADS_PORTALS_PATCH
```

Expected:

```js
{
  phase: "98S-K",
  installed: true,
  duplicateSuppression: true,
  oldOverlayHidden: true/false,
  hubs: ["reiki", "pga", "store", "smoker", "scorpion"],
  leaderboard: true
}
```

## Test route

Open:

`/game/?v=phase98sk-storefront-wall-fit-cleanup`

Verify:

1. Build label says `PHASE-98S-K-STOREFRONT-WALL-FIT-CLEANUP`.
2. Storefronts look attached/grounded instead of floating.
3. Portal rings are inside their storefront frames.
4. Duplicate portal clutter is reduced.
5. Scorpion portal remains in locked position.
6. Reiki hologram still works visually.
7. Reiki audio still does not play from spawn.
8. Moon/Mars still appear high.
9. Android sticks still show on Android.

## Remaining after this phase

Next recommended phase:

`Phase 98S-L — Website Banner Cleanup + SVR Welcome Banner`

That should remove the mismatched first site banner and replace it with main SVR branding.
