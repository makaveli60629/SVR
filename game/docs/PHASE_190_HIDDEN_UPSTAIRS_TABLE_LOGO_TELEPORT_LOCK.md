# Phase 190 — Hidden Upstairs Table Logo Teleport Lock

## Scope
Game-side only. No website or site edits.

## Built
- Visible stairs removed.
- Upper balcony concealed.
- Added UPSTAIRS and LOBBY teleport pads.
- Added a maximum-size SVR logo carpet under the table.
- Restores table visibility when the real FBX table root exists.
- Removes middle rail and rope objects near the table area.
- Keeps Vibes Theater and Smokers Lounge on the south wall.

## Runtime audit
```js
SVR_RUN_PHASE190_ARCHITECTURE_AUDIT()
```

## Runtime helpers
```js
SVR_PHASE190_TELEPORT_UPSTAIRS()
SVR_PHASE190_TELEPORT_LOBBY()
SVR_ACTIVATE_PHASE190_PORTAL()
```

## Test URL
`/game/?v=phase190-hidden-upstairs-table-logo`
