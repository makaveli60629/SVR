# Phase 101N - Public Admin State and Game Boot Cache Fix

## Purpose

Fix two live issues reported from browser testing:

1. Public page still showing `ADMIN ONLINE` after admin logout.
2. Game boot screen still showing Phase 260 static fallback text, making the project look stuck on Phase 260.

## Public admin state fix

### Root page

Updated:

```text
index.html
```

Static public launch page now defaults to:

```text
ADMIN OFFLINE
```

New root build marker:

```text
PHASE-101N-PUBLIC-ADMIN-OFFLINE-CACHE-REFRESH-LOCK
```

### Public hooks

Updated:

```text
site-public-hooks.js
```

New behavior:

- Loading state defaults offline.
- API failure fallback defaults offline.
- Local stale cache no longer forces public admin online.
- Server API must return online and be fresh to display online.

Runtime object:

```text
window.SVR_ADMIN_PRESENCE
```

Expected when logged out or API unavailable:

```text
state: offline
isOnline: false
build: PHASE-101N-PUBLIC-ADMIN-OFFLINE-FALLBACK-LOCK
```

## Game boot fallback fix

Updated:

```text
game/index.html
```

Static boot screen now shows:

```text
PHASE 101N ACTIVE
CURRENT STACK LOADING
```

instead of:

```text
PHASE 260 ACTIVE
ROMAN CANOPY ARCHWAY FINAL LOCK
```

New game build marker:

```text
PHASE-101N-LIVE-BOOT-CACHE-REFRESH-LOCK
```

The Phase 260 geometry is still preserved by the runtime. Phase 260 should not be treated as the visible/current status anymore.

## Validation routes

Use cache-busted routes:

```text
https://svrpoker.com/?v=phase101n-admin-offline
https://svrpoker.com/game/index.html?v=phase101n-current-stack
```

## Expected public result

- Public launch page starts as `ADMIN OFFLINE`.
- Public launch page does not flash `ADMIN ONLINE` from static HTML.
- If API fails, public launch page stays `ADMIN OFFLINE`.
- Game boot fallback says Phase 101N while loading.
- Runtime title/status moves to Phase 101M/101N current stack once modules run.

## Browser cache note

If Chrome still shows old values, clear this site only:

```text
Chrome -> lock/sliders icon beside URL -> Site settings -> Delete data
```

or open an Incognito window and use the phase101n URL above.

## Locked rule

This phase fixes public admin state and game boot/cache labels only. It does not change lobby geometry, Android movement, Quest locomotion, sponsor modules, or Unity logic.

## Commit name

```text
Phase 101N - Public Admin Offline Fallback and Game Boot Cache Refresh
```
