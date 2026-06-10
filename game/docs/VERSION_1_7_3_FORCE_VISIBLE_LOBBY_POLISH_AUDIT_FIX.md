# Version 1.7.3 - Force Visible Lobby Polish Audit Fix

## Why this exists
The previous 1.7.2 patch may have been applied but not visible due to one of these:
- GitHub Auto Deploy did not run after push.
- Browser cache showed old game.
- Script loaded before the Three.js scene was available.
- Coordinates were too subtle or not obvious enough.
- Prior script tags or stale build labels hid the update.

## What this patch does
- Removes old lobby polish script tags.
- Injects a new force-visible script last.
- Adds a large visible confirmation panel near spawn.
- Adds directory board.
- Adds daily board.
- Adds portal rings.
- Adds VIP route lighting.
- Adds ambient silhouettes.
- Adds build badge in the top-left browser UI.
- Adds debug module lock inspector with `debug=1`.

## Test URLs
Normal:
https://svrpoker.com/game/?v=1-7-3-force-visible-lobby-polish

Debug:
https://svrpoker.com/game/?v=1-7-3-force-visible-lobby-polish&debug=1

## Expected visible marker
A large panel near spawn that says:

SVR LOBBY POLISH ACTIVE
