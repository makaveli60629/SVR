# Phase 190 — Session Export Lock

## Scope
Game-side QA/export improvement only. Public Matrix launch page remains untouched.

## Added
- `game/modules/session_export.js`
- `window.SVR_SESSION_EXPORT`
- Keyboard `X` downloads the current QA/session JSON.
- Keyboard `Y` copies the current QA/session JSON to clipboard when browser permission allows.
- Browser event `svr_session_export_update`.

## Purpose
Make every playtest easier to report by capturing turn state, hand history, action logs, legal actions, watch hints, side pots, all-in state, dealer/blind state, and runtime errors into one compact JSON payload.

## Locks Preserved
- Public page untouched.
- Dealer body disabled.
- Invisible deal/card logic preserved.
- Under 25 MB package target.
- Unapproved wellness/founder branding remains removed.
