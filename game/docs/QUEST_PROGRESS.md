# Quest playability progress — 2026-11-17

Repository branch: `codex/quest-playability`. Draft PR: https://github.com/makaveli60629/SVR/pull/269.
Scope: game sources, game manifests, game documentation and game tests only. No website source, hosting configuration, account backend or production deployment changes.

## Implemented repairs

- Fixed strict-module window event registration crashing the event instrumentation wrapper.
- Prevented the runtime health monitor from dismissing direct Quest loading/error UI before room setup finishes; direct-entry retry reloads failed module state.
- Added lobby import-error recovery, retry and slow-load feedback. Rendering and movement initialize before table/dealer loading; VR entry waits for lobby readiness.
- Connected hands, action buttons and layout modules to the current approved table instead of retired table names. Live action labels are protected from legacy cleanup, and the smaller action panel sits beside the player card zone.
- Serialized card presentation rebuilding, built card meshes before optional logo loading and prevented burn-record accumulation. Retired surface checks now yield to native-felt card animation; the final room pass recalibrates seating and aligns human hole cards with the player side.
- Changed the FBX cache to return separate scene instances, skeletons and materials while retaining one download/parse. This prevents legacy and current dealer guards from manipulating the same model.
- Protected in-flight dealer models from legacy duplicate cleanup using an ownership marker set before FBX loading.
- Stabilized the action wrapper chain so presentation and debounce guards cannot repeatedly wrap each other or reject every valid action.
- Mapped the actual Eric FBX bone names to the dealer's procedural pose controls.
- Updated room audit measurements to inspect the active approved table/dealer rather than a retired visual authority.
- Prevented restarting an active hand through NEXT/H. Closed raising after a short all-in now also applies to all-in, bet-alias and physical-chip inputs.
- Reviewed Quest manifest routes, session contracts and chip policy. The observed practice table starts with 1,000 per player (6,000 total); the older 10,000-stack/15-second-clock policy is historical, not active in the tested entry. Historical browser certifications remain labeled as historical; physical headset acceptance remains pending.
- Updated older game audit expectations that referenced obsolete route versions.

## Completed checks

- Existing Quest watch/world, surface/motion and room behavior regression suites pass.
- New window-event, active-table, card-rebuild, action-wrapper and FBX-instance regression suites pass.
- Poker rule regression completed 100 hands, checking showdown, chip conservation, a unique 52-card deck, five community cards and three burns. It also checks rejected raising inputs, short all-in calls, active-hand restart prevention and explicit reset.
- Chromium lobby inspection rendered the table, dealer and lighting successfully. The repaired poker room now reaches its full readiness gate, with seating, gameplay and control checks passing. A separate actual-model diagnostic confirms Eric is grounded with valid transforms and skeleton matrices.
- Several GitHub audit failures also exist on base main (`660993b`), including the full-stack guard and older mobile/site audits. Those unrelated sources and deployment workflows have not been changed.

## Final browser result

- PASS: lobby → seated poker room → full hand → showdown → next hand.
- PASS: blocked lobby-module loading exposes retry and Poker Room navigation.
- Normal gameplay produced zero page/console errors and zero HTTP asset failures. The deliberate blocked-module test records its expected errors separately.
- Screenshot review confirms the centered table view, readable action labels, settled cards and face-up human hole cards on the player side.

## Remaining physical-device checks

- Physical Quest entry, controller/hand input, wrist orientation, seated reach, stereo readability and frame pacing. Browser/CPU tests cannot establish these.

## Repeatable local checks

Install test dependencies outside the repository:

```sh
npm install --prefix /tmp/svr-quest-tests --no-save three@0.160.0 playwright
export NODE_PATH=/tmp/svr-quest-tests/node_modules
node game/tools/quest-action-wrapper-regression.cjs
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

No production deployment or merge was performed. All project changes are under `game/`. Current playability is local practice poker against bots, not shared multiplayer.

## Follow-up: Quest device detection

The same complete browser playthrough also passes with Quest/Oculus Browser identification enabled: lobby, room readiness, full hand, showdown, next hand and blocked-module recovery, with zero normal console/page or HTTP errors. This uses Chromium/software WebGL with a Quest user-agent string; it does not simulate an actual XR session or certify headset/controller behavior.

Repeat with `SVR_TEST_QUEST_UA=1` when running `game/tools/quest-playability-browser.cjs`.
