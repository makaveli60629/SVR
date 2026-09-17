# Quest watch and table-only startup repair — 2026-09-17

Base main: a7a5d4ac436ac19c9d7297b74776308d1e8aa4fe.

## Verified defects and repairs

- `main.js` passed a hand/controller bundle to a watch accepting positional hand arguments. The watch could never find a wrist from that bundle. It now accepts both calling conventions, uses tracked hand/controller proxies, hides on tracking loss, and ignores wearing-hand presses.
- The watch emitted obsolete events while the current poker engine consumes `SVR_POKER_ACTION`. Actions now reach that engine exactly once, including its turn/stack validation; NEXT cannot reset an active hand. The table-only layout contains six poker actions and reads the active pot and player stack.
- Quest still constructed the grand lobby, storefronts, portals and alignment timers in `main.js`. Quest now creates only world coordinates; the existing fitted table-room module supplies the room. Other clients retain their world builder.
- Quest's Android user agent enabled phone controls. Quest is now explicitly excluded from those controls.
- The Quest manifest loaded legacy timed recovery modules that could create another renderer/lobby and replace the loading screen. Quest uses its own automatic startup and retry UI. The old recovery UI is no longer imported by the direct entry.
- Existing clearance depended on names and a narrow surface band. A geometric pass now removes broad, thin external meshes above the felt, including unnamed imported planes. Native table structure, cards, chips, avatars and tracked wrist controls are retained.
- Older seat modules could overwrite a later fitted seat. They now yield to the fitted seat owner. Its yaw faces the table, desktop preview is actually positioned, and pose adjustment stops after a short XR entry settling period instead of resetting natural head motion indefinitely.
- Entry and changed dependency URLs advance to phase459. The device module uses the same URL in the entry and manifest to avoid duplicate instances.

## Validation

`quest-watch-world-regression.cjs` executes the actual main loop with Three.js scene objects and stubbed rendering. It verifies watch visibility, input and tracking transitions, controller fallback, absence of the grand-lobby builder, geometric clearance, correct seat direction, bounded pose updates, and platform manifests.

`quest-surface-motion-regression.cjs` checks stable Eric idle/deal poses, current betting boundaries after table changes, overlay visibility and decal deduplication. Existing phase443, phase449, phase450 and phase455 audits remain deployment gates. Production deployment now also runs both behavioral suites.

## Limits and follow-up verification

The cloud test browser returned “Error creating WebGL context” before rendering the scene. CPU/scene-object tests do not establish visual correctness, headset tracking quality or Quest frame rate. A physical Quest session must verify wrist orientation, entry/exit, felt clearance and dealing in both eyes. The source still includes multiple legacy gameplay/presentation modules; this repair is not a complete engine rewrite.

Existing multiplayer/account endpoints remain separately unconfigured; these changes do not make a shared multiplayer backend live. No change to those settings or the public/mobile pages is included.

Rollback: revert this repair commit/PR through GitHub, preserving subsequent work. The previous source remains in history.
