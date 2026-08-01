# Phase 356 — Android Real-Device Freeze Recovery and Site Professionalism

Build: `PHASE-356-ANDROID-REAL-DEVICE-FREEZE-RECOVERY-LOCK`

## Owner report

The installed Android APK opens the remotely hosted stable web game but can freeze before a complete hand finishes. The public Matrix effect also exposed too many secret phrase letters at once, the profile camera needed a professional temporary legend avatar, and the website support widget needed real GPT capability with readable responses.

## Android changes

- Removed Android shader `compileAsync` prewarming. Real phones now compile incrementally during normal frames.
- Removed all Android deferred lobby, account, FBX-avatar, and network-presence modules during table play.
- Replaced repeated full-scene traversals with one startup inspection capped at 240 nodes.
- Kept the Phase 347 single MOVE, LOOK, seated movement, and poker-action controller as the only Android controller.
- Added five low-poly table avatars with no FBX downloads, animation mixer, or network presence cost.
- Capped standard Android pixel ratio at 1.0 and low-power recovery at 0.78; shadows remain disabled.
- Added a frame-gap watchdog and WebGL context-loss recovery.
- Added visible `Continue Low Power` and `Reload Table` controls.
- Preserved the Phase 336 poker rules, pot settlement, card flow, legal actions, and NEXT HAND contracts.

## APK lock

The current installed wrapper remains:

- Version name: `0.1.0-rc1`
- Version code: `1`
- Forced update: `false`
- Update prompt: `false`
- Manual update only: `true`
- Stable entry: `/game/android.html?channel=stable&v=phase356`

No signed RC2 is claimed. The repository still does not contain the native wrapper source and signing identity required to build a replacement signed APK. Phase 356 updates the remote web runtime used by the existing wrapper.

## Matrix rain

- Secret phrases no longer appear immediately on page load.
- Desktop phrase bursts occur no more often than every 9 seconds.
- Touch/mobile phrase bursts occur no more often than every 12 seconds.
- Reduced-motion phrase bursts occur no more often than every 18 seconds.
- Phrase letters are staggered instead of appearing simultaneously.
- Mobile column count, trail length, glow, frame rate, and drop speed are reduced.

## Profile legend pedestal

The profile page now receives a Phase 356 live showroom overlay:

- verified local Eric FBX body
- `SVR LEGEND` temporary identity
- professional metallic pedestal, gold ring, cyan scan ring, lights, and slow rotation
- drag rotation and existing pause/reset controls
- procedural low-poly backup if the FBX cannot load
- mobile pixel-ratio limit

This is a temporary professional default until the full avatar pipeline is refined.

## GPT support

- The frontend now sends platform, page, build, and recent-chat context to `POST /api/ai/support`.
- The backend uses the official server-side OpenAI SDK and Responses API.
- The OpenAI key stays only in backend environment configuration.
- Default model configuration is `gpt-5-mini` and can be changed with `OPENAI_MODEL`.
- Responses are displayed in a full-height scrollable panel with preserved line breaks and word wrapping.
- A local SVR knowledge system remains available when the GPT backend is unavailable or not configured.
- GPT becomes live only after `OPENAI_API_KEY` is configured on the backend and that backend is redeployed.

## Platform and Unity blueprint

`docs/PHASE-356-PLATFORM-UNITY-BLUEPRINT.json` records Android, Quest, desktop, Camera 3, website routes, shared profile fields, poker authority, input authority, recovery contract, and the future Unity mapping. Unity should consume these authorities rather than copy visual-page code directly.

## Automated validation

Workflow: `Phase 356 Android Site AI Check`

It validates:

- JavaScript syntax
- Android critical load order
- zero Android deferred modules
- bounded scene inspection
- shader-precompile exclusion on Android
- low-power and reload controls
- APK policy locks
- slower/staggered secret phrases
- profile legend asset and fallback
- GPT endpoint and readable chat layout
- backend OpenAI dependency
- Unity blueprint JSON

## Real-device acceptance still required

Automated browser acceptance is historical evidence only. Phase 356 remains pending until the owner completes multiple Android hands on the installed APK and confirms:

1. Sit and deal.
2. Play preflop, flop, turn, river, and showdown.
3. Confirm winner and pot settlement.
4. Press NEXT HAND.
5. Repeat for several hands without frozen controls or a frozen view.
6. If recovery appears, test `Continue Low Power` before using `Reload Table`.

Do not mark real-device validation passed until this test is completed on the owner’s Android device.
