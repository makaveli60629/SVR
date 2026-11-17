# Quest playability progress — 2026-11-17

Repository branch: `codex/quest-playability`.
Scope: game sources, game manifests, game documentation and game tests only. No website source, hosting configuration, account backend or production deployment changes.

## Repairs under verification

- Fixed strict-module window event registration crashing the event instrumentation wrapper.
- Prevented the runtime health monitor from dismissing direct Quest loading/error UI before room setup finishes; direct-entry retry reloads failed module state.
- Added lobby import-error recovery, retry and slow-load feedback. Rendering and movement initialize before table/dealer loading; VR entry waits for lobby readiness.
- Connected hands, action buttons and layout modules to the current approved table instead of retired table names.
- Serialized card presentation rebuilding, built card meshes before optional logo loading and prevented burn-record accumulation.
- Changed the FBX cache to return separate scene instances, skeletons and materials while retaining one download/parse. This prevents legacy and current dealer guards from manipulating the same model.
- Mapped the actual Eric FBX bone names to the dealer's procedural pose controls.
- Updated room audit measurements to inspect the active approved table/dealer rather than a retired visual authority.
- Prevented restarting an active hand through NEXT/H. Closed raising after a short all-in now also applies to all-in, bet-alias and physical-chip inputs.
- Reviewed Quest manifest routes and session contracts. Historical browser certifications remain labeled as historical; physical headset acceptance remains pending.
- Updated older game audit expectations that referenced obsolete route versions.

## Completed checks

- Existing Quest watch/world, surface/motion and room behavior regression suites pass.
- New window-event, active-table, card-rebuild and FBX-instance regression suites pass.
- Poker rule regression completed 100 hands, checking showdown, chip conservation, a unique 52-card deck, five community cards and three burns. It also checks rejected raising inputs, short all-in calls, active-hand restart prevention and explicit reset.
- Initial Chromium lobby inspection rendered the table, dealer and lighting successfully.

## Still being verified

- Final browser playthrough after the dealer cache/rig repairs: lobby → poker room → complete hand → showdown → next hand.
- Lobby blocked-module recovery in the same browser run.
- Physical Quest entry, controller/hand input, wrist orientation, seated reach, stereo readability and frame pacing. Browser/CPU tests cannot establish these.

## Repeatable local checks

Install test dependencies outside the repository:

```sh
npm install --prefix /tmp/svr-quest-tests --no-save three@0.160.0 playwright
export NODE_PATH=/tmp/svr-quest-tests/node_modules
node game/tools/quest-event-instrumentation-regression.cjs
node game/tools/quest-current-authority-regression.cjs
node game/tools/quest-card-rebuild-regression.cjs
node game/tools/quest-fbx-instance-regression.cjs
node game/tools/quest-poker-rules-regression.cjs
node game/tools/quest-watch-world-regression.cjs
node game/tools/quest-surface-motion-regression.cjs
node game/tools/quest-room-behavior-regression.cjs
```

Serve the repository root over HTTP for desktop testing, then run:

```sh
SVR_CHROMIUM=/usr/bin/chromium node game/tools/quest-playability-browser.cjs
```

The browser test defaults to `http://127.0.0.1:8000`, writes screenshots and JSON to `/tmp/svr-quest-browser`, and accepts `SVR_TEST_BASE` and `SVR_TEST_ARTIFACTS` overrides. Install Playwright's Chromium and omit `SVR_CHROMIUM` when a system Chromium is unavailable. Physical headset testing requires a secure origin (HTTPS).
