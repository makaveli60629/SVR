# Phase 342 — Adaptive Performance and Asset Pipeline Lock

Phase 342 adds explicit runtime budgets for Android, Quest, desktop, and Camera 3. It measures frame time and Three.js renderer statistics, lowers resolution only after sustained pressure, and gradually restores quality after sustained headroom.

It also adds platform material and texture tuning, shader/texture prewarming, Quest foveation, asset-load telemetry, automatic repository asset audits, and a manual Meshopt/WebP optimization workflow.

Automatic app update banners are disabled. The update interface opens only through an explicit manual request. APK version `0.1.0-rc1`, code `1`, remains locked.

## Runtime QA
```js
window.SVR_PHASE342_AUDIT()
window.SVR_PHASE342_SET_QUALITY('balanced')
window.SVR_PHASE342_REPREWARM()
window.SVR_ASSET_LOAD_METRICS
window.SVR_CHECK_FOR_APP_UPDATE()
```
