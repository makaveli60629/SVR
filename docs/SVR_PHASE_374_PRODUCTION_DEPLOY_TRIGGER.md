# SVR Poker Phase 374 Production Deploy Trigger

This marker triggers the existing single production publisher after the Phase 374 Android and mobile-profile recovery commits.

## Included source locks

- Android stable route: `/game/android.html?channel=stable&v=phase374`
- Android recovery module: `game/modules/phase374_android_join_table_app_recovery_lock.js`
- Android Join authority: `JOIN NOW`
- No deal or next hand before authoritative join state
- Canonical table visibility plus lightweight emergency-table fallback
- Mobile profile route: `/site/profile.html?v=phase374`
- Mobile profile controls moved below the avatar camera
- Profile navigation changed from horizontal scrolling to a wrapped grid
- APK policy remains `0.1.0-rc1`, version code `1`, manual-update-only, no forced update

## Deployment authority

- Source branch: `main`
- Publisher: `.github/workflows/deploy.yml`
- Publish branch: `gh-pages`
- Custom domain: `svrpoker.com`

Production verification requires the Phase 374 Android HTML, module, profile HTML, CSS, and JavaScript to appear on `gh-pages` at this trigger commit or a newer commit.
