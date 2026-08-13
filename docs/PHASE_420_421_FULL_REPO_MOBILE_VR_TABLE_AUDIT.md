# SVR Poker — Phase 420/421 Full Repository Release Audit

Date: 2026-08-12

## Scope

This audit uses `main` as the source of truth and covers:

- repository/deployment workflow
- Android and iPhone launchers/wrappers
- shared mobile poker runtime and protected poker authorities
- player-account/login source and public configuration
- tournament schedule, registration, roster and start routing
- Quest/VR poker-table authority chain
- active release configuration and APK policy
- open GitHub issues/PR state
- basic repository security/hygiene indicators

The public website is locked and is not part of this change set.

## Starting source state

Starting main commit: `b10bf46c6fb581f18358c27781a967dc594c8706`

The starting repository labeled the current mobile work as Phase 419, while several launch wrappers still reported Phase 418.

## Release bugs found and corrected

### 1. Phase 419 mobile table-flow continuous DOM polling

`game/modules/phase419_mobile_table_flow_polish.js` continuously ran its installer every 220 ms even after the layout was correct.

Risk:

- unnecessary DOM mutation checks
- mobile CPU/battery churn
- avoidable long-session work on Android/iPhone

Correction:

- removed the permanent 220 ms polling loop
- retained an initial install
- added bounded settle checks
- added a MutationObserver that only schedules repair when the flow host/rail is actually missing or displaced
- preserved `pokerStateMutated:false`

### 2. Mobile navigation could downgrade newer tournament links to Phase 412

`game/modules/phase407_mobile_fit_login.js` rewrote tournament links to `v=phase412` during its continuous UI sweep.

Risk:

- Phase 419/420 pages could silently navigate back to older route labels
- release/debug evidence could disagree with the source that actually loaded

Correction:

- added minimum-version navigation logic
- older links can be upgraded to the minimum compatible version
- newer Phase 419/420 links are never downgraded

### 3. Android/iPhone outer launchers and wrappers were stale

Android/iPhone use one shared protected poker engine, but the outer pages still reported Phase 418.

Correction:

- Android launcher -> Phase 420
- iPhone launcher -> Phase 420
- Android shared-table wrapper -> Phase 420
- iPhone shared-table wrapper -> Phase 420
- iPhone remains a wrapper over the shared `android-stable-phase405.html` poker authority
- Quest device redirects point to the Phase 421 test query without replacing the protected Quest wrapper

### 4. Tournament registration/start slot semantics were inconsistent

The Phase 419 registration page correctly registered humans for the next five-hour slot, while tournament entry did not have an explicit current-slot authority.

Correction:

- added `phase420_tournament_start_authority.js`
- one exact slot constant remains authoritative: 5 hours / 18,000,000 ms
- tournament entry targets the current running slot
- registration links target the next slot
- eligible entry includes the explicit current `slot` id
- production shared registration is still truthfully disabled until its API exists

### 5. Production deploy health/stamping was stale

The production deploy workflow validated and stamped Phase 419/418 even after successor source work.

Correction:

- deploy validation now checks Phase 420 mobile + Phase 421 table files
- deploy health records Phase 420 mobile wrapper/release, Phase 420 tournament start authority and Phase 421 VR table polish
- production routes are stamped with Phase 420 mobile / Phase 421 Quest query versions
- protected Phase 403 poker, Phase 414 human-turn authority, Phase 396 Quest wrapper and APK policy remain intact

## Login/account audit

The browser account client exists and supports API-backed login when a real endpoint is configured, with a local test fallback otherwise.

Current public account config remains intentionally truthful:

- deployment state: `cloud-endpoint-pending`
- player API base: blank
- account API endpoint configured: false

Therefore:

- mobile login UI/source is prepared and polished
- local test profiles can be used for test identity
- **production player login is not live yet**
- the missing authorized AWS API Gateway/Lambda/Cognito/DynamoDB deployment is an external infrastructure blocker, not a browser UI bug

This phase does not put secrets or credentials into public config to fake readiness.

## Tournament backend audit

Current `game/config/tournament-api.json` remains:

- `apiBase`: blank
- `sharedRegistrationBackendLive`: false
- `backgroundPushLive`: false
- schedule: every 5 hours
- field cap: 100

Therefore:

- current-browser/local test registration works
- five-hour slot calculation works
- current-slot launch routing is now explicit
- shared cross-device roster and background push alerts are **not production-live** until a verified tournament API/push service is deployed

## Mobile poker authority audit

The Android and iPhone table routes share the protected browser poker runtime.

Protected critical authorities were not changed in this release:

- Phase 403 Android poker engine
- Phase 403 side-pot rules
- Phase 398 raise sizing rules
- Phase 414 human-turn rotation authority
- Phase 416 human-seat-never-skip guard
- one physical burn-zone source in the shared mobile shell
- safety script remains loaded before the poker engine

The Phase 420 release layer is presentation/routing/account/tournament truth only and does not become a second poker engine.

## VR table audit

### Root visual defect

The protected Phase 390 table authority intentionally creates a branded felt surface with a 0.165 m / roughly 6.5 inch recess below the table top and repeatedly maintains that legacy surface. That is too deep for the requested polished padded poker-table appearance and can make the felt look visually disconnected from the rail/card plane.

### Phase 421 correction

A successor, table-only polish module now:

- clones the established branded playing-surface geometry/material mapping
- creates `PHASE421_FINAL_POLISHED_PLAYING_SURFACE`
- places the visible felt at a shallow 0.026 m recess below the outer table top
- adds a lightweight procedural cloth micro-bump surface
- uses high roughness / zero metalness for felt
- polishes named leather/rail/padding materials
- preserves metallic trim behavior
- hides older duplicate felt overlays
- suppresses color output from the legacy deep Phase 390 surface so legacy positioning code can keep running without visually fighting the final surface
- uses bounded/event-driven enforcement, not a permanent heavy resweep

Hard boundaries:

- no lobby geometry change
- no locomotion change
- no Quest wrapper replacement
- no poker-engine change
- no website change

Physical headset inspection is still required for final visual sign-off because repository/source validation cannot substitute for a Quest display test.

## GitHub/repository findings

### Open pull requests at audit start

None.

### Relevant open issues that remain real blockers or follow-up work

- #129 — Android wrapper source/signing identity recovery for a genuine RC2 upgrade APK
- #102 — server-authoritative poker state required before real multiplayer/live economy
- #101 — production secrets-management hardening
- #100 — staging environment
- #98 — backend API health service
- #94–#97 — older VR launch-blocker issues remain open and should not be silently treated as closed by this table-only phase

### Native Android APK boundary

The browser Android game can advance without forcing an APK update. A true signed RC2 upgrade still depends on recovering/verifying the original Android native wrapper and signing identity. Phase 420 does not fake that release boundary.

### Backend source hygiene finding

Legacy/alternate `backend/src/server.js` trees contain a JWT fallback string `dev-secret`. The currently referenced root `backend/package.json` starts `backend/server.js`, which is a separate marker-health service, but the duplicate source trees should be treated as non-production until fail-closed JWT secret handling is consolidated.

No obvious committed AWS access-key prefix (`AKIA`) was found in the code-search sweep. This is not a substitute for GitHub secret scanning or credential rotation.

## Files changed in Phase 420/421

Mobile / tournament:

- `game/android.html`
- `game/iphone.html`
- `game/android-tabletop.html`
- `game/iphone-tabletop.html`
- `game/tournaments.html`
- `game/modules/phase407_mobile_fit_login.js`
- `game/modules/phase419_mobile_table_flow_polish.js`
- `game/modules/phase420_mobile_release_lock.js`
- `game/modules/phase420_tournament_start_authority.js`

VR table:

- `game/modules/phase406_quest_side_burn_chip_polish.js`
- `game/modules/phase421_vr_table_final_polish.js`

CI/deploy:

- `.github/workflows/phase418-mobile-admin-profile-account-audit.yml`
- `.github/workflows/phase420-mobile-release-phase421-vr-table-audit.yml`
- `.github/workflows/deploy.yml`

## Acceptance target

### Android/iPhone

- Phase 420 appears consistently on launchers/wrappers/shared table presentation
- same protected poker engine on Android and iPhone
- no 220 ms table-flow repair loop
- no tournament-link phase downgrade
- exact five-hour tournament slots
- signup -> next slot
- enter current tournament -> current slot
- login UI is truthful about local-test vs production API state

### VR

- Phase 421 source loads after the protected Quest table pass
- final visible felt is shallow-recessed, textured as cloth and aligned under the padded rail
- legacy deep surface is visually suppressed
- rail/leather/trim materials remain visible and polished
- no lobby/locomotion changes in this phase

## External blockers before calling the entire platform production-complete

1. Deploy the authorized player-account AWS endpoint and then set the public account API config.
2. Deploy/verify a shared tournament registration + push backend before claiming cross-device roster/background alerts.
3. Recover/verify Android native wrapper + signing identity before a genuine in-place RC2 APK upgrade.
4. Implement server-authoritative multiplayer poker before real multiplayer/economy claims.
5. Perform final physical Android, iPhone Safari and Quest headset acceptance tests.
