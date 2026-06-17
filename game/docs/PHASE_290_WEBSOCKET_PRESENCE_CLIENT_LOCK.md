# Phase 290 WebSocket Presence Client Lock

Build: `PHASE-290-WEBSOCKET-PRESENCE-CLIENT-LOCK`

## Summary

Phase 290 adds a disabled presence client connector for the future live player movement layer.

## Runtime globals

```text
window.SVR_PHASE290_WEBSOCKET_PRESENCE_CLIENT_LOCK
window.SVR_PRESENCE_CLIENT
window.SVR_CONNECT_PRESENCE
window.SVR_PUBLISH_PRESENCE
```

## Default behavior

- No endpoint configured: stays disabled.
- Endpoint must use `wss://`.
- No server endpoint is committed into the repo.
- No payment or account data is sent.

## Files changed

```text
game/phase290_presence_client_lock.js
game/index.html
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Test

```text
https://svrpoker.com/game/?v=phase290-presence-client
```
