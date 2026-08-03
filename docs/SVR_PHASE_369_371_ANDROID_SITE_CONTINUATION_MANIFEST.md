# SVR Poker — Phase 369–371 Continuation Manifest

## Status

This branch completes the code-side Android stabilization, account/profile presentation, avatar texture preservation, mobile navigation, Android app banner, public AI fallback status, and Matrix-rain polish requested on August 3, 2026.

The branch is based directly on the merged Phase 367 Android physical-device baseline. Physical comfort, frame pacing, and final screen placement still require the owner's real Android device after deployment.

## Phase map

### Phase 368 — Card Dealer Animation Lock

- Uses the uploaded `Cards.fbx` motion profile.
- Dealer stands behind the north/dealer side of the authoritative table.
- Dealer faces the felt and replays motion for a new hand and later streets.
- The raw 2.5 MB FBX is not parsed during Android or Quest startup.
- The current dealer gestures realistically but does not yet grip and transfer physical card objects.

### Phase 369 — Android Join Table + Freeze Recovery Lock

Entry:

```text
/game/android.html?channel=stable&v=phase369
```

Flow:

```text
SVR logo entry → one JOIN TABLE tap → bounded readiness wait → seated table → first deal → actions → showdown → next hand
```

Rules:

- No first visible deal before JOIN TABLE.
- One authoritative JOIN TABLE / LEAVE TABLE flow.
- The visible Phase 369 button is the user-facing join surface.
- One tap starts a single-flight readiness transaction; repeated taps cannot create duplicate joins.
- The transaction waits up to 18 seconds for the canonical table and up to 12 seconds for the authoritative join API.
- The button displays `JOINING TABLE…` while readiness is pending.
- If the base Phase 369 join returns before the joined state is confirmed, the transaction retries through the existing Phase 363 join authority.
- Old SIT, SEAT, PLAY GAME, and duplicate controller surfaces are suppressed.
- The canonical Phase 367 table pipeline remains the authority.
- The table is forced visible and aligned through the existing Phase 364 authority.
- Table lookup and alignment are bounded; the runtime does not perform full-scene alignment every frame or every half-second.
- The dealer is deferred until the core table and Android runtime are stable.
- Long frame gaps trigger lower renderer demand instead of stacking another renderer.
- APK remains `0.1.0-rc1`, version code `1`, manual-update-only.

Runtime QA:

```js
window.SVR_PHASE369_ANDROID_QA()
window.SVR_PHASE369_JOIN_READINESS_QA()
window.SVR_PHASE369_JOIN_TABLE()
window.SVR_PHASE369_LOW_POWER('manual')
window.SVR_PHASE367_DEVICE_QA()
window.SVR_PHASE368_CARD_DEALER_STATE
```

### Phase 370 — Account, Profile, Avatar + Mobile Navigation Polish

- Existing secure account API remains the authority.
- Login and registration use email/password through the backend and HTTP-only session cookies.
- New public registrations remain `player` accounts.
- Admin authority is never selectable from a public registration form.
- A secure SQL role-assignment script is included for the owner admin account and separate test-player account after both accounts register.
- Registration displays the optional development-support handle `$SVRhelp`.
- Cash App payment is not required for registration.
- The site never requests or stores a Cash App password, PIN, card number, or payment credential.
- Mobile/touch pages receive one hamburger navigation menu.
- Profile overlays are reduced so the avatar remains visible.
- The old Founder Legend / SVR Legend profile injector is disabled.
- Profile portrait captures the live avatar canvas when available.
- Eric remains the default avatar and rotates automatically.
- Textured avatar materials retain their texture maps instead of being recolored flat.

Role setup after registration:

```text
backend/phase370/sql/002_phase370_admin_test_role_assignment.sql
```

Replace only the two email placeholders, then run through the protected database administration path. Passwords are never placed in that script.

Runtime QA:

```js
window.SVR_PHASE370_SITE_QA()
window.SVR_PHASE351_PROFILE_SHOWROOM_QA()
window.SVR_PHASE346_QA_STATE
window.SVR_PLAYER_ACCOUNT_STATE
```

### Phase 371 — Android App Banner, AI Status + Matrix Polish

- The first `/site/` homepage banner announces the Android app playtest.
- The SVR logo is centered prominently in the app banner.
- The banner routes to Phase 369 Android and the downloads page.
- The public launch page remains structurally unchanged.
- When admin is offline, a solid green dot displays `AI ACTIVE`.
- When admin comes online, the AI fallback status moves to standby and is hidden.
- Matrix columns are wider and less dense.
- Binary trails are shorter, dimmer, and slower.
- Hidden phrase letters descend separately with independent delays rather than appearing together.

Runtime QA:

```js
window.SVR_MATRIX_RAIN_STATE
window.SVR_PUBLIC_AI_STATUS
window.SVR_PHASE370_SITE_QA()
```

## Files added

```text
game/modules/phase368_card_dealer_animation_lock.js
game/modules/phase368_card_dealer_motion.js
game/modules/phase369_android_join_table_freeze_recovery_lock.js
game/modules/phase369_android_join_readiness_transaction_lock.js
game/phase369-release.json
game/tools/phase368-card-dealer-static-test.mjs
game/tools/phase369-android-recovery-static-test.mjs
game/docs/PHASE_368_CARD_DEALER_ANIMATION_LOCK.md
site/css/phase370-account-profile-mobile-clean.css
site/js/phase370-account-profile-mobile-polish.js
site/tools/phase370-371-site-polish-static-test.mjs
backend/phase370/sql/002_phase370_admin_test_role_assignment.sql
docs/SVR_PHASE_369_371_ANDROID_SITE_CONTINUATION_MANIFEST.md
docs/SVR_PHASE_369_371_MANIFEST.json
.github/workflows/phase368-card-dealer.yml
.github/workflows/phase369-371-android-site-polish.yml
```

## Files updated

```text
game/index.html
game/android.html
game/camera3.html
game/tools/phase350-integrity-static-test.mjs
game/tools/phase356-android-real-device-static-test.mjs
game/tools/phase354-android-browser-acceptance.cjs
game/tools/phase357-android-browser-acceptance.cjs
game/tools/phase360-session-browser-acceptance.cjs
.github/workflows/phase357-android-table-status-showdown-ante.yml
site/js/phase346-avatar-viewer.js
matrix.js
```

## Protected and unchanged authorities

- Phase 336 poker rules, pot settlement, evaluator, and payout.
- Phase 347 Android MOVE/LOOK/action controller.
- Phase 350 controller deduplication.
- Phase 363 join/bankroll/audio/gyro base.
- Phase 364 geometry and table alignment.
- Phase 365 seated HUD, avatar seats, branding, and gyro baseline.
- Phase 367 viewport, safe-area, touch, and stabilization certification.
- APK version and update policy.
- Website public-page copy and layout except the requested dynamic AI status and Matrix effect.
- Quest gameplay authority; Quest is the next focused track after Android owner acceptance.

## Acceptance truth

Completed in code and static validation:

- One Android entry/join flow.
- Bounded one-tap table/API readiness transaction.
- Single-flight join protection.
- Visible pending/retry status instead of silent failure.
- Table recovery and visibility enforcement.
- Bounded table lookup/alignment instead of repeated full-scene work.
- Dealer deferred from critical boot.
- Logo entry and in-game logo.
- Continuous next-hand scheduling after showdown.
- Low-power recovery path.
- Secure account presentation.
- Admin/test role preparation.
- Clean profile/avatar presentation.
- Texture-preserving avatar viewer.
- Mobile navigation.
- Android app lead banner.
- AI-active fallback status.
- Thinner Matrix rain and staggered secret letters.
- Legacy Android browser gates updated to operate the visible Phase 369 JOIN surface rather than a hidden predecessor control.

Still dependent on external configuration or owner action:

- Register the actual owner admin email/password.
- Register the separate test-player email/password.
- Run the protected role-assignment SQL with those two emails.
- Confirm the account API and Azure SQL deployment environment variables.
- Perform the physical Android playtest for freeze behavior, safe areas, touch comfort, table visibility, dealer position, gyroscope feel, and continuous play.
- Approve and merge the pull request before production deployment.

## Test routes

```text
Android:
https://svrpoker.com/game/android.html?channel=stable&v=phase369

Site homepage:
https://svrpoker.com/site/index.html?v=phase371

Login / registration:
https://svrpoker.com/site/login.html?mode=register&v=phase370

Profile:
https://svrpoker.com/site/profile.html?v=phase370

Dressing room:
https://svrpoker.com/site/avatar.html?v=phase370

Public launch:
https://svrpoker.com/?v=phase371
```

## Next track

After Phase 369 physical Android acceptance, continue with Quest/WebXR validation. Do not redesign or replace the Phase 369 Android route during Quest work.
