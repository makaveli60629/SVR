# SVR Update 3.2 â€” Lobby Storefront Skyline Lock

## Build

`SVR-UPDATE-3.2-LOBBY-STOREFRONT-SKYLINE-LOCK`

## Purpose

This phase stabilizes the lobby presentation route and prepares it for review without rebuilding the whole game.

## New / updated files

- `game/modules/svr_update_3_2_lobby_skyline_lock.js`
- `game/config/lobby-skyline-lock-3-2.json`
- `docs/SVR_UPDATE_3_2_LOBBY_STOREFRONT_SKYLINE_LOCK.md`
- `game/docs/SVR_UPDATE_3_2_LOBBY_STOREFRONT_SKYLINE_LOCK.md`

## What this locks

- REIKI storefront focus route
- REIKI meditation-room portal
- Moon and Mars high in the sky
- temporary skyline/building hide option
- frozen skyline/building rotation
- duplicate procedural Moon/Mars suppression
- optional position panel

## Main test routes

```text
https://svrpoker.com/game/?scene=lobby&focus=reiki-storefront&source=trueitive-review&svr32sky=1&v=3-2
```

Debug position panel:

```text
https://svrpoker.com/game/?scene=lobby&focus=reiki-storefront&source=trueitive-review&svr32sky=1&svrpos=1&v=3-2
```

Meditation room:

```text
https://svrpoker.com/game/?scene=reiki-meditation&source=trueitive-review&v=3-2
```

## Honest status

This is a modular lobby presentation stabilization pass. It does not replace the poker table or lobby baseline. It freezes problem skyline movement and hides the problematic building tier only on review routes.
