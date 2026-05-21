# Phase 106 — HoloCtx Boot Fix Lock

## Target
Fix the black boot rescue screen showing:

```text
SyntaxError: Identifier 'holoCtx' has already been declared
```

## Fix
- Kept the current Three.js/WebXR runtime.
- Did not apply the older A-Frame watch-ui snippet.
- Renamed watch hologram canvas/context/texture identifiers to unique Phase 106 names.
- Preserved the physical HOLO watch button and wrist hologram panel.
- Preserved Phase 102/103/105 visual and boot-safety work.
- Site untouched.

## Verification
- `node --check` passes for `main.js`, `main-runtime.js`, and `modules/watch.js`.
- Build label: `PHASE-106-HOLOCTX-BOOT-FIX-LOCK`.
