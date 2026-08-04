# Phase 350 — Profile Avatar, Camera 3, Android Controller, and Website Integrity Lock

## Build
`PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK`

## Profile avatar recovery

The old profile preview could remain blank when any of these stalled or failed:

- Three.js dynamic module loading
- `ResizeObserver`
- WebGL context creation
- avatar catalog fetch
- FBX/GLB model loading
- account bootstrap

Phase 350 draws an immediate Canvas2D avatar fallback before attempting 3D. Every asynchronous step has a timeout. The UI always reaches one visible state:

- fallback ready
- loading 3D
- 3D ready
- 3D fallback ready
- retry available

Runtime:

```js
window.SVR_PHASE350_PROFILE_AVATAR_QA()
window.SVR_PHASE350_PROFILE_AVATAR_RETRY()
window.SVR_PHASE350_PROFILE_AVATAR_RESET()
```

## Camera 3 visibility

Camera 3 removes the full lobby and therefore cannot depend on lobby lights. Phase 350 adds a dedicated spectator lighting root with:

- hemisphere fill
- ambient fill
- warm directional key
- cyan directional fill
- purple rim
- gold table accent
- ACES filmic tone mapping
- exposure `1.22`
- sRGB output
- deep-navy background
- shadows disabled

Runtime:

```js
window.SVR_PHASE350_CAMERA3_QA()
window.SVR_PHASE350_CAMERA3_RELIGHT()
```

## Android controller deduplication

Phase 347 remains the sole visible Android controller authority. Phase 350 does not create another controller.

It physically removes:

- Phase 326 controller root
- Phase 343 HUD root
- Phase 344 toast remnants
- Phase 324/325/329/330 control roots
- generic old mobile/touch-control roots
- external virtual sticks outside `#svr347Root`
- duplicate Phase 347 roots
- legacy controller style elements

A `MutationObserver` and periodic sweep remove late-created duplicates.

Runtime:

```js
window.SVR_PHASE350_ANDROID_CONTROLLER_QA()
window.SVR_PHASE350_ANDROID_CONTROLLER_SWEEP()
```

## Website integrity

Canonical pages are defined in:

`site/data/public-page-registry.json`

The audit:

- recursively scans public HTML
- validates canonical page existence
- validates local links, assets, form actions, and anchors
- reports placeholder links and buttons without explicit actions
- reports stale phase/cache versions
- treats canonical failures as release-blocking
- records historical/optional page problems as warnings
- uploads `phase350-site-integrity-report.json` as a workflow artifact

Command:

```bash
node site/tools/phase350-site-integrity-audit.mjs
```

## Website roadmap

Public route:

`/site/roadmap.html`

The roadmap distinguishes:

- completed systems
- active Phase 350 acceptance
- production account backend deployment
- live presence and social lobby
- store/inventory/content publishing
- server-authoritative poker
- native APK RC2
- Unity migration blueprint

## Protected locks

- Phase 336 remains poker authority.
- Phase 341 remains table/card coordinate authority.
- Phase 347 remains Android control/gameplay authority.
- Phase 348 remains local avatar authority.
- Phase 349 remains presence/seat authority.
- Camera 3 remains spectator-only.
- APK remains `0.1.0-rc1`, code `1`.
- Forced updates and recurring update prompts remain disabled.
