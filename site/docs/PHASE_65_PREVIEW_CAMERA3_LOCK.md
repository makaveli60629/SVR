# Phase 65 â€” Preview Camera 3 Lock

## Goal
Restore the website preview panel so it shows the actual SVR Poker game with the moving third/director camera instead of the static "SVR Poker Lobby Preview" placeholder.

## Changed
- `site/index.html`
  - Replaced the static preview card with an iframe to `../game/index.html?preview=1&cam=director&autocam=1`.
  - Added a `CAM 3 LIVE` badge.
  - Kept the public Matrix launch page separate.
  - Did not touch `/game` runtime files.

## Test
Open:

```text
https://svrpoker.com/site/?v=preview-camera3
```

Expected:
- live game window visible inside the preview panel
- third/director camera moving around the table/lobby
- no static "SVR Poker Lobby Preview" placeholder
- full game still opens from the preview button
