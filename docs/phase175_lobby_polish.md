# Phase 175 Lobby Polish

## Finding
The loader page still used Phase 172A cache strings. That could keep old scripts active even after newer commits.

## Fix
Updated game index cache strings to Phase 175.

Added `game/modules/phase175_lobby_polish_audit.js`.

The new module removes old lobby clutter after boot instead of only hiding it.

It targets old background and wall objects.

It preserves controls, watch, sponsor module, Phase 173 wall, and approved Moon and Mars objects.

## Runtime markers

`window.SVR_PHASE175_LOBBY_AUDIT`

`window.SVR_PHASE175_VERIFY`

## Manual keys

F6 runs the polish cleanup pass.

F10 shows the movement audit panel.

## Test

`/game/?v=phase175-lobby-polish-audit&phase173=1`
