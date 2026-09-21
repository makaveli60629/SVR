# Phase 464 — Unity 6 Web Runtime Prep

## Goal
Apply Unity Web's fast-start principles to the current A-Frame/Three.js runtime without replacing the production game, while preparing a parallel Unity 6 migration path.

## Browser runtime changes
- Preconnect to jsDelivr before Three.js module requests.
- Preload the boot logo.
- Add connection-aware `modulepreload` hints for the first critical runtime modules.
- Preserve the existing sequential execution order so side-effect-heavy phase modules still initialize deterministically.
- Cache versioned same-origin JS, CSS, data, models, textures, audio and WASM through the service worker.
- Preserve network-first navigation and always-fresh updater/APK behavior.
- Keep query strings in runtime cache keys so new phase/version URLs do not silently resolve to an older asset.

## Unity migration direction
The current production game remains A-Frame/Three.js/WebXR. A real Unity build should live in a parallel project folder or dedicated Unity repository and target:
1. Unity Web for Android/iOS browsers.
2. Native Android/Quest build profiles for headset delivery.
3. Progressive asset loading / Addressables.
4. Brotli release compression and size-oriented LTO.
5. WebGPU where supported, with WebGL2 compatibility fallback.
6. Unity Build Automation connected to GitHub so builds can run in the cloud.

## Android-only owner workflow
An Android phone is sufficient for GitHub review, Unity Dashboard build control, deployment checks and browser/Quest testing. Interactive Unity Editor work still requires a desktop-class environment; use a cloud/remote workstation when scene, prefab, rig, lighting or inspector work is required.

## Safety
This phase is isolated in a PR. It does not alter the live main branch until reviewed/merged.
