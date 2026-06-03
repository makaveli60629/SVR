# Phase 98S-J — Portal / Storefront Alignment + Lobby Ads Lock

Date: 2026-06-02
Track: game-side only

## Purpose

Make the lobby portal and ad layer look more intentional and professional without rewriting the core lobby baseline.

## Files changed

- `game/modules/lobby_ads_portals_patch.js`
- `game/index.html`
- `game/docs/PHASE_98S_J_LOBBY_ADS_PORTALS_LOCK.md`

## What was added

### Portal/storefront alignment overlay

Added attached-looking storefront/portal frames for:

- Reiki Hub
- PGA Training
- SVR Store
- Smoker Lounge
- Scorpion Room

Each storefront includes:

- wall-style frame
- readable sign
- glow portal ring
- floor portal glow
- neon trim

### Lobby ads and boards

Added:

- SVR Poker welcome banner
- ALL IN / SVRPOKER.COM banner
- Espresso With Cream featured ad banner
- Lobby leaderboard board

## Protected locks

- Scorpion portal lock preserved at X 12.78 / Y 1.60 / Z 15.75 with yaw 51.78.
- Reiki deploy lock preserved.
- Moon/Mars patch preserved.
- Android controls preserved.
- Runtime snap guard preserved.
- Website/site untouched.

## Runtime debug object

The patch exposes:

```js
window.SVR_LOBBY_ADS_PORTALS_PATCH
```

Expected:

```js
{
  phase: "98S-J",
  installed: true,
  hubs: ["reiki", "pga", "store", "smoker", "scorpion"],
  ads: ["SVR Poker welcome", "All In", "Espresso With Cream"],
  leaderboard: true
}
```

## Test route

Open:

`/game/?v=phase98sj-lobby-ads-portals-lock`

Verify:

1. Build label says `PHASE-98S-J-LOBBY-ADS-PORTALS-LOCK`.
2. Storefront frames appear near their hub portals.
3. Scorpion portal still appears at the locked location.
4. Lobby leaderboard board is visible.
5. SVR Poker welcome banner appears.
6. ALL IN banner appears.
7. Espresso With Cream ad appears.
8. Reiki audio containment still works.
9. Android two-stick controls still appear on Android.

## Note

This phase is a safe overlay pass. It does not yet delete older portal graphics from the base lobby. After testing, if duplicate portals/signs are visible, the next pass should hide or merge specific older visuals by name/position.
