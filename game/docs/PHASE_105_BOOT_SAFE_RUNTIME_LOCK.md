# Phase 105 — Boot Safe Runtime Lock

This phase fixes the black-screen / stuck-on-Booting failure path.

## Lock

- Do not replace the current Three.js/WebXR game with A-Frame snippets.
- `main.js` is now a boot wrapper.
- `main-runtime.js` contains the real game runtime.
- Runtime import errors are caught and shown to the player instead of freezing on a black screen.
- Full world building is timeout-protected. If it fails, a minimal emergency scene loads so testing can continue.

## Test

Open `/game/?v=phase105`. The build label must show `PHASE-105-BOOT-SAFE-RUNTIME-LOCK`.
