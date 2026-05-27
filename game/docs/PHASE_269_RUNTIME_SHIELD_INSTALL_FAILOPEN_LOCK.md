# PHASE 269 — Runtime Shield Install Failopen Lock

## Audit result
Phase 268 imported the runtime-shield quiet module, but main.js did not actually call:
installPhase268RuntimeShieldQuiet({ scene, renderer, camera });

That meant the shield-quiet system was present but not installed.

## Fixes
- Installs runtime-shield quiet recovery immediately after renderer creation.
- Adds fail-open wrapper around optional frame systems.
- Keeps visible lobby active.
- Prevents one optional module from keeping the runtime shield overlay active.
- Preserves Phase 265 visible lobby shell.
- Preserves Phase 266 early render guard.
- Preserves Phase 267 newline repair.
- Preserves Phase 268 runtime quiet module.
- Site untouched.

## Test
1. Build says PHASE-269-RUNTIME-SHIELD-INSTALL-FAILOPEN-LOCK.
2. Lobby is visible.
3. Runtime shield message does not stay stuck.
4. Route buttons remain.
5. Enter VR remains.
6. Logs may show skipped optional step, but lobby must stay usable.

## Next
PHASE-270-QUEST-MOVEMENT-TELEPORT-HARDENING-LOCK
