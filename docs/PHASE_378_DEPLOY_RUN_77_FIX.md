# Phase 378 — Production Auto Deploy Run 77 Fix

The first Phase 378 production run failed before publishing the APK. The website therefore remained on Phase 377, which matched the owner screenshot.

## Corrective changes

- Removed the repository-stored custom keystore path from the build.
- Switched the install package to Android's automatic test-signing flow.
- Switched the workflow from `assembleRelease` to the deterministic `assembleDebug` output used for private RC testing.
- Added `android-actions/setup-android@v3` before SDK package installation.
- Added explicit Android 35 platform/build-tools installation and `apksigner` availability verification.
- Updated the static contract to reject embedded keystore passwords and require the corrected APK output path.

## Resulting package

- Package: `com.svrpoker.app`
- Version: `0.1.0-rc2`
- Version code: `2`
- Published filename: `svr-poker-android-rc2.apk`
- Public route: `/downloads/svr-poker-android-rc2.apk`
- Primary Android game: `/game/android-stable.html?v=phase378`

The prior APK must be uninstalled before installing this test-signed RC2 package.
