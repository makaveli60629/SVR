# Phase 378 — Native APK RC2 and Stable Android Table

## Owner-reported failure

The physical Android device continued to show the obsolete frozen interface after Phase 377:

- no `JOIN NOW`
- old `SIT / SEAT` controls
- cards dealt before joining
- no visible APK download or update
- browser and installed APK both appeared unchanged

## Confirmed root problems

1. The repository did not contain an APK binary. Previous download pages only described an expected APK path; they never published an installable package.
2. The installed APK was an external/older build whose source and signed binary were not preserved in the repository.
3. The Android 3D route remained too dependent on layered modules and could freeze before the current entry interface became visible.
4. A root-scope service worker or WebView cache could continue presenting old HTML even after ordinary browser-cache clearing.

## Phase 378 corrective architecture

### Fresh native APK

- Package: `com.svrpoker.app`
- Version name: `0.1.0-rc2`
- Version code: `2`
- Public path: `/downloads/svr-poker-android-rc2.apk`
- Production workflow builds, verifies, hashes, and publishes the APK.
- This RC2 uses an SVR test signing identity. The previous APK must be uninstalled before RC2 is installed.

### Native cache protection

The Android WebView shell:

- uses `LOAD_NO_CACHE`
- clears WebView cache and history at launch
- opens a unique Phase 378 URL
- verifies that the loaded page contains `JOIN NOW`, `ANDROID STABLE TABLE`, or `YOUR TURN`
- automatically opens a bundled offline table when verification fails
- provides native `STABLE TABLE` and `REFRESH` controls

### Standalone browser table

Canonical Android route:

`/game/android-stable.html?v=phase378`

The page is self-contained:

- static `JOIN NOW` before gameplay starts
- no cards before joining
- six-player local play-money table
- no Three.js import
- no legacy Android module chain
- no automatic 3D startup
- optional separate 3D test link

### Public APK controls

The public page, download center, Android page, update menu, and cached-page helper script expose:

- `DOWNLOAD APK RC2`
- `PLAY ANDROID`
- `UPDATE / INSTALL HELP`

`site-local-counter.js` injects a floating APK notification so older cached public HTML can still receive the current APK and play controls when the helper script refreshes.

## Deployment acceptance

The production workflow must verify all three:

1. `deploy-health.json` contains the current commit.
2. `/game/android-stable.html` contains `JOIN NOW`.
3. `/downloads/svr-poker-android-rc2.apk` returns HTTP 200.

Static gate:

`node game/tools/phase378-native-apk-stable-static-test.mjs`
