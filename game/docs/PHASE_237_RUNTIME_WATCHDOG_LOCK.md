# Phase 237 — Runtime Watchdog Lock

## Build label

```text
PHASE-237-RUNTIME-WATCHDOG-LOCK
```

## Scope

- Game-only.
- Site untouched.
- Keeps the live runtime path active.
- Adds a lightweight watchdog after `main.js`.

## Purpose

This phase is the next safe recovery step after the PC-safe entry confirmed the route could render. It resumes the live runtime and adds a guard that clears the boot overlay when a canvas, renderer, or scene appears.

## Files changed

- `game/index.html`
- `game/phase237_runtime_watchdog_lock.js`
- `game/docs/BUILD_VERSION.json`
- `game/docs/PHASE_237_RUNTIME_WATCHDOG_LOCK.md`

## Test URL

```text
https://svrpoker.com/game/index.html?v=phase237-runtime-watchdog-lock&fresh=237
```

## Expected result

- Top-right label: `PHASE 237 ACTIVE • RUNTIME WATCHDOG`.
- If the renderer appears, the boot overlay fades away.
- If a runtime issue appears, the visible error panel reports it.
