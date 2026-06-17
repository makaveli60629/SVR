# Phase 312 Free Manual Presence Transport Lock

Build: `PHASE-312-FREE-MANUAL-PRESENCE-TRANSPORT-LOCK`

## Summary

Phase 312 is game-side only. The public root page remains locked and untouched.

## Purpose

Adds a free manual presence transport scaffold for two-device testing before a paid or dedicated server is introduced.

## Behavior

- Uses browser WebRTC datachannel support.
- No dedicated server is committed.
- No SQL, Stripe, API keys, or secrets are used.
- Exposes manual pairing functions for offer / answer testing.
- Sends local camera presence frames over the datachannel when connected.
- Applies received remote frames to the Phase 311 Android Ghost pill.
- Keeps `realServerConnected=false` so this is not confused with production multiplayer.

## Runtime globals

```text
window.SVR_PHASE312_FREE_MANUAL_PRESENCE_TRANSPORT_LOCK
window.SVR_PHASE312_FREE_MANUAL_PRESENCE_TRANSPORT_STATE
window.SVR_PHASE312_REMOTE_PLAYER_FRAME
window.SVR_PHASE312_CREATE_OFFER()
window.SVR_PHASE312_ACCEPT_OFFER(code)
window.SVR_PHASE312_ACCEPT_ANSWER(code)
window.SVR_PHASE312_DISCONNECT()
```

## Manual test flow

```text
Device A / Oculus:
await SVR_PHASE312_CREATE_OFFER()

Device B / Android:
await SVR_PHASE312_ACCEPT_OFFER("PASTE_OFFER_CODE")

Device A / Oculus:
await SVR_PHASE312_ACCEPT_ANSWER("PASTE_ANSWER_CODE")
```

## Files changed

```text
game/phase312_free_manual_presence_transport_lock.js
game/phase311_local_two_player_ghost_multiplayer_prototype.js
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Important limit

This is a manual no-server test scaffold. A production two-device lobby still needs a backend signaling / presence server later.

## Test

```text
https://svrpoker.com/game/?v=phase312-free-manual-presence
```
