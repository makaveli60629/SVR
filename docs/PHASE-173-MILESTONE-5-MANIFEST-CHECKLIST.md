# PHASE-173-MILESTONE-5-MANIFEST-CHECKLIST

## Build marker

`PHASE-173-MILESTONE-5-PRIVACY-PRESENTATION-MODULE-CHECKLIST-LOCK`

## Purpose

This checklist records the Phase 173 Milestone 5.0 upgrade direction after the Phase 169 lobby restore, Phase 170 poker.js lock, Phase 171 table bindings, and Phase 172 watch/action/seat QA work.

Phase 173 is a modular extension layer. It must not replace the restored lobby, must not touch the public website page, and must not break the current Scorpion poker room flow.

## Master rules

- Game-side work only.
- Do not touch the public page.
- Do not touch the `site/` folder unless a separate site-track task explicitly asks for it.
- Preserve the restored original-style lobby from Phase 168/169.
- Preserve Scorpion private-room poker work from Phase 170/171/172.
- Preserve left-to-right dealing.
- Preserve one open south/front player seat.
- Preserve five bots plus one player seat.
- Preserve invisible/disabled dealer body.
- Preserve no music.
- Preserve official SVR logo branding only.
- Preserve Moon/Mars high orbit lobby requirement.
- Preserve private scene routing.
- Preserve right-controller movement and 45-degree snap turn.
- Preserve trigger-release teleport and grip preview.
- Preserve hidden controller meshes.
- Preserve movement, teleport, WebXR dolly, and XR reference space.

## Phase 173 files added

- `game/modules/security-bubble.js`
- `game/modules/sports-ticker.js`
- `game/modules/hand-physics.js`
- `game/modules/seat-trigger.js`
- `game/modules/win-presentation.js`
- `game/modules/daily-pick.js`
- `js/scarlett1/mod_charity.js`

## Phase 173 module checklist

### Privacy / table protection

- [x] Add `security-bubble.js` as an optional A-Frame component.
- [x] Keep it isolated so it does not mutate the active Three.js lobby runtime unless mounted in an A-Frame scene.
- [x] Add card/seat privacy event hooks.
- [ ] Bind privacy shielding to real Scorpion table card meshes after the final table mesh pass.

### Presentation / winner flow

- [x] Add `win-presentation.js` as an optional A-Frame component.
- [x] Support 10-second winner text presentation.
- [x] Support winner seat pulse.
- [x] Dispatch `svr_win_presentation_active` for runtime records.
- [ ] Bind directly to poker.js showdown results after final event bridge.

### Hand mechanics

- [x] Add `hand-physics.js` as an optional A-Frame component.
- [x] Pre-allocate reusable vectors to reduce garbage collection spikes.
- [x] Detect hand flick / muck-style movement events.
- [ ] Bind hand flick to fold/muck action only after safety testing.

### Seat helper

- [x] Add `seat-trigger.js` as an optional A-Frame component.
- [x] Support proximity-based seat helper behavior.
- [x] Dispatch `svr_player_seated_automatically`.
- [ ] Use only in controlled A-Frame test scenes until the Scorpion seat map is fully validated.

### Daily pick / play-chip bonus

- [x] Add `daily-pick.js` as an optional A-Frame component.
- [x] Mark reward as play-chip/demo only.
- [x] Dispatch `svr_daily_pick_finished`.
- [ ] Wire to account/chips database only after backend API is ready.

### Ticker / status text

- [x] Add `sports-ticker.js` as an optional A-Frame component.
- [x] Use safe demo/social status text only.
- [x] No outside fetches, no secrets, no gambling integration.
- [ ] Replace demo lines with approved internal data source only after compliance review.

### Philanthropy hub

- [x] Add `js/scarlett1/mod_charity.js` as an event-driven philanthropy module.
- [x] Support charity ticker event dispatch.
- [x] Support 10-second post-hand showcase event dispatch.
- [ ] Connect to approved API routes only after backend endpoint exists.

## Safety checklist

- [x] Public page untouched.
- [x] `site/` folder untouched.
- [x] No secrets added.
- [x] No music added.
- [x] No real-money gambling logic added.
- [x] Optional modules isolated from active runtime unless explicitly mounted.
- [x] No WebXR reference-space changes.
- [x] No locomotion mutation.
- [x] No teleport mutation.
- [x] No controller mesh visibility added.

## Test checklist

### Lobby URL

`https://svrpoker.com/game/index.html?v=phase173`

- [ ] Lobby loads.
- [ ] Floor visible.
- [ ] Walls visible.
- [ ] Official SVR logo visible.
- [ ] Moon visible high.
- [ ] Mars visible high.
- [ ] No music.
- [ ] Right-controller forward/back movement works.
- [ ] 45-degree snap turn works.
- [ ] Trigger-release teleport does not freeze.
- [ ] Grip preview does not freeze.
- [ ] Controller meshes are hidden.
- [ ] Public page is unchanged.

### Scorpion URL

`https://svrpoker.com/game/private-scene.html?scene=scorpion&v=phase173`

- [ ] Scorpion private scene loads.
- [ ] Poker table QA visible.
- [ ] Six-seat layout visible.
- [ ] One open south/front player seat visible.
- [ ] Five bots visible as table state, not dealer body.
- [ ] Player cards visible.
- [ ] Board cards visible.
- [ ] Pot visible.
- [ ] Watch action buttons visible.
- [ ] Check/Call/Raise/Fold/All-In/Next Hand work.
- [ ] 20-second timer visible.
- [ ] Left-to-right dealing preserved.
- [ ] Winner display still works.
- [ ] Hand history remains visible.
- [ ] No teleport changes.
- [ ] No movement changes.

## Known pending work for Phase 174

- Complete `js/scarlett1/` enterprise module set if still needed:
  - `mod_private.js`
  - `mod_sponsor.js`
  - `mod_commerce.js`
  - `mod_stream.js`
  - `mod_audio.js`
  - `mod_watch.js`
  - `mod_router.js`
  - `mod_scorpion_fx.js`
  - `mod_sportsbook.js`
  - `mod_avatar.js`
  - `mod_profile_sync.js`
  - `mod_network.js`
- Add a safe module registry loader that does not touch the public page.
- Bind Scorpion showdown events to Phase 173 winner presentation.
- Bind privacy shield to table card mesh layer.
- Add backend/API stubs only after the site/backend track is active.

## Current lock

Phase 173 is now the active modular checklist lock for privacy, presentation, optional A-Frame helpers, and philanthropy event hooks. The next phase should be Phase 174: module registry completion and event bridge wiring, still with no public-page edits.
