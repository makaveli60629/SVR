# Phase 322 — Full Lobby Visual Finish Lock

## Scope

Game-side visual completion only. Website and site files remain untouched.

## Locked lobby baseline

- Large two-floor SVR lobby preserved.
- Rear storefront row preserved.
- Main poker table and open south player seat preserved.
- Android dual-stick movement and full-lobby bounds preserved.
- Quest/WebXR systems remain available for later headset testing.

## Visual finish completed

### Architecture

- Removed the older smaller Phase 216 visual shell from the live load path.
- Added a finished rear crown, gold trim, doorway jambs, and illuminated seams.
- Kept pillars aligned inside the storefront doorway jambs instead of blocking signs.
- Added polished wall-base trim without reducing the planned lobby dimensions.

### Floor and central presentation

- Added a dark marble-style lobby floor.
- Added the long red center carpet with gold edge strips.
- Added a gold table medallion and seat-position floor markers.
- Added an SVR Poker hero sign and lightweight ring chandelier above the table.

### Storefront row

Final presentation panels now identify:

- Reiki Hub — approval-safe presentation with `AWAITING APPROVAL`.
- PGA Golf Training — Drive / Chip / Putt.
- Play SVR Poker — six-seat play-money table.
- SVR Store — gear, memberships, and cosmetics portal.
- Scorpion Room — private city poker destination.

Each storefront has coordinated color accents, framed content, and a lightweight animated hologram marker.

### Lobby information areas

- Left wall: SVR Mission jumbotron.
- Right wall: Events & Replays jumbotron.
- Upper level: Events, Legends Hall, and Sponsors fascia panels.
- Front floor: Daily Bonus and Sponsor Hub kiosks.

### Skyline and sky

- Added a lightweight instanced cityscape outside the lobby.
- Added three signature towers and spires.
- Moon and Mars remain high above the rear wall.
- Planet halos are aligned to their planet positions.
- Stars remain visible.
- The city object deliberately avoids `SKY` in its runtime name so the older table module cannot hide it.

### Performance

- City buildings use one instanced mesh.
- Android uses fewer buildings and reduced emissive intensity.
- Shadows remain disabled.
- Android pixel ratio remains capped at the Phase 321 mobile target.
- Only small low-cost hologram and trim animations are active.

## Removed visual conflicts

- The older Phase 216 lobby look module is no longer loaded.
- Placeholder Phase 201 presentation panels are hidden.
- Old Phase 202 placeholder signs are hidden while their useful storefront geometry remains.
- Debug-style high table status label is hidden.
- Phase 322 restores Moon, Mars, stars, and halos every render so older modules cannot make the sky disappear.

## Test checklist

1. Open `/game/?v=phase322` on Android.
2. Confirm red carpet, finished floor, table medallion, chandelier, and hero sign are visible.
3. Walk to all five rear storefronts.
4. Confirm storefront wording is readable and pillars do not block it.
5. Confirm Moon, Mars, stars, cityscape, and tower spires remain visible.
6. Confirm side jumbotrons and upper-level fascia panels are aligned.
7. Confirm left and right touch sticks remain responsive.
8. Walk for five minutes and report any frame drops, heat, black screen, or overlapping geometry.

## Remaining non-visual work

This phase completes the lobby presentation direction. Poker correctness, private-room routing, final avatar rigs, and authoritative multiplayer remain separate functional phases.
