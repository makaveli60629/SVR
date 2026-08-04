# Phase 333 — Quest Shader and Gameplay Polish Lock

## Build
`PHASE-333-QUEST-SHADER-GAMEPLAY-POLISH-LOCK`

## Scope
Game-side only. Public website files and sponsor/partner content remain untouched.

## Baseline preserved
Phase 333 does not replace the table or remove Phase 332 functionality. It preserves:

- the existing uploaded table as the sole table authority
- the detected true felt surface
- the centered SVR table logo
- the white-and-gold pass line
- smaller `$1`, `$5`, `$25`, and `$100` chips
- Meta-hand/controller chip pickup
- chip throw velocity, gravity, spin, rail bounce, friction, and stack snapping
- committed-bet logic after chips settle past the pass line
- the Android stable route and non-forced APK policy

## Shader and material polish
Phase 333 adds a Quest-safe physical-rendering pass rather than expensive full-screen post-processing.

### Felt
- Keeps the existing felt texture.
- Adds a subtle shader weave/fiber response through `onBeforeCompile`.
- Uses high roughness and low reflectivity.
- Raises texture anisotropy within Quest-safe limits.

### Padded rail
- Converts the detected rail/leather materials to `MeshPhysicalMaterial`.
- Adds controlled clearcoat and soft sheen.
- Keeps the rail dark without crushing all visible detail.

### Metal trim
- Uses high metalness, lower roughness, and stronger environment response.
- Keeps silver/chrome separate from the rail and felt.

### Chips and cards
- Adds controlled clearcoat to chip faces and edges.
- Improves chip readability without making them look metallic.
- Gives cards a light protective finish while retaining paper-like roughness.

### Environment and lighting
- Creates a one-time PMREM environment from Three.js `RoomEnvironment`.
- Uses ACES filmic tone mapping.
- Uses Quest-specific exposure.
- Adds only two table-focused lights to avoid a heavy Quest lighting pass.
- Reuses upgraded materials on later audits to prevent GPU-memory growth.

## Playable VR loop
A visible XR table HUD and action bar are added so poker remains playable during continued refinement.

### Status panel
Displays:
- whose turn it is
- current phase
- pot
- current bet
- player stack
- amount needed to call
- latest table action
- winner state

### VR action controls
Meta-hand pointing/pinch and controller pointing/trigger can activate:
- Fold
- Check or Call
- Raise
- All In
- Next Hand

The Check/Call label changes automatically according to the current amount required.

### Continuous recreation mode
- The poker engine still starts a playable hand.
- After showdown, the winner remains visible for approximately 6.2 seconds.
- The next hand starts automatically unless `window.SVR_PHASE333_AUTO_NEXT = false`.
- Physical pass-line bets continue to resolve through the poker authority.

## Integration frameworks
These are hooks, not claims of completed live services.

### Multiplayer turn hook
The game dispatches:
```js
window.addEventListener("svr:turn-changed", event => console.log(event.detail));
```
This creates a clean event boundary for later multiplayer synchronization. It does not enable a networked multiplayer server by itself.

### Store hook
```js
window.SVR_PHASE333_STORE_HOOK.open();
```
This opens the existing store route. Payment processing and inventory authority are not introduced by this phase.

## Runtime helpers
```js
window.SVR_PHASE333_TABLE_QA()
window.SVR_PHASE333_ACTION("fold")
window.SVR_PHASE333_ACTION("checkcall")
window.SVR_PHASE333_ACTION("raise")
window.SVR_PHASE333_ACTION("allin")
window.SVR_PHASE333_ACTION("next")
window.SVR_PHASE333_REPOLISH()
window.SVR_PHASE333_STORE_HOOK.open()
```

## Oculus test route
```text
https://svrpoker.com/game/index.html?v=phase333-shader-gameplay
```

## Acceptance checks
1. The Phase 332 pass line is still visible.
2. Personal denomination stacks remain on the left.
3. Chips still throw, bounce, settle, stack, and commit past the pass line.
4. Felt reads as cloth rather than plastic.
5. The padded rail reads as dark leather.
6. Silver trim reflects the environment without excessive glare.
7. Chips remain readable and slightly polished.
8. A turn-status panel is visible from the open player seat.
9. Fold, Check/Call, Raise, All In, and Next Hand controls are visible.
10. Hand pinch or controller trigger can select enabled controls.
11. The Check/Call label matches the current required action.
12. A completed hand advances automatically after the winner display.
13. Frame rate remains acceptable in Quest.
14. No public website files are changed.
15. APK remains `0.1.0-rc1`, code `1`, with no forced update.

## Completion status
The implementation and static validation are complete. Visual and interaction acceptance still require an Oculus headset playtest because shader balance, panel reach, and hand-ray comfort depend on the live headset view.
