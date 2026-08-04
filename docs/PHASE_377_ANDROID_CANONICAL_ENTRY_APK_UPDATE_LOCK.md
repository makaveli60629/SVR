# Phase 377 — Android Canonical Entry, APK and Update Controls

## Owner-reported evidence

The physical Android screenshot showed the obsolete runtime even after browser cache clearing:

- `TAP SIT FOR TABLE VIEW`
- `SIT`
- `LOBBY / SEAT / CENTER`
- two player cards before joining
- no `JOIN NOW`
- frozen interaction

## Root cause

The public launch page still linked to `game/index.html?v=phase102-current-stack`. The Android redirect in `game/index.html` preserved that old query when forwarding to `android.html`. That allowed an obsolete cached launch identity to keep reaching the old SIT HUD rather than the Phase 376 entry.

## Phase 377 routing lock

- New canonical Android path: `/game/android-play.html?channel=stable&v=phase377`
- Public page links directly to the canonical path.
- `game/index.html` discards incoming Android phase/query values and redirects to Phase 377.
- Legacy `game/android.html` immediately redirects to the canonical path.
- PWA manifests and workers use the canonical path and a new Phase 377 cache epoch.

## Playability priority

- `JOIN NOW` is static HTML and visible before any game module imports.
- `JOIN NOW` opens the stable lightweight six-player poker table first.
- No cards exist on the entry screen before joining.
- The full 3D room is an optional secondary action.
- If the 3D room fails, recovery returns to the stable table.

## Public distribution controls

The public launch page and release center visibly provide:

- Play Android
- Download APK
- Update App

The APK status remains truthful:

- APK version: `0.1.0-rc1`
- version code: `1`
- `releaseReady: false`
- `apkUrl: ""`
- signed APK binary not attached

The Download APK control remains visible and reports this status. It becomes a direct download only after a verified signed package URL and SHA-256 are added.

## Production gate

`node game/tools/phase377-public-route-android-recovery-static-test.mjs`
