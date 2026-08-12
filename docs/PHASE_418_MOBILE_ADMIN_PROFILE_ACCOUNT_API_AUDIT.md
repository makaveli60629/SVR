# Phase 418 — Mobile, Admin Presence, Profile and Account/API Audit

Build: `PHASE-418-MOBILE-ADMIN-PROFILE-ACCOUNT-POLISH-LOCK`

## Scope

This phase responds to physical Android testing and owner/admin testing without changing the protected poker engine or Quest gameplay authority.

## Protected authorities

- Phase 403 poker engine and side-pot rules
- Phase 398 raise rules
- Phase 402 physical/visual seat order
- Phase 404 ALL IN decision safety
- Phase 414+ human-turn authority
- Phase 417 Android viewport/media-fit authority
- Quest Phase 396 route and seated gameplay
- APK `0.1.0-rc2`, version code `2`, manual-update only

## Public Admin / AI status

Previous problem:

- The public construction status always displayed `AI ONLINE` even when the owner/admin browser was authenticated and admin presence was set online.
- The public launch hook read only `svr_admin_presence` and did not recognize the current owner session record.

Phase 418 behavior:

- Fresh owner presence payload is authoritative.
- A valid `SVR_ADMIN_SESSION` is recognized.
- Public `#admin-status` paints `Admin Online` / `Admin Offline`.
- The third service pill shows:
  - `ADMIN ONLINE` while admin presence is online.
  - `AI ONLINE` while admin presence is offline.
- Explicit owner offline presence overrides a still-valid session through the fresh presence payload.

This is a same-origin browser bridge. Cross-device presence still depends on the live backend `GET /api/admin/status` path.

## Android / iPhone entry fit

- Android chooser is constrained to one `100dvh` device page.
- Portrait uses a compact three-column mode layout where screen size permits.
- Very short screens hide secondary mode descriptions before hiding core buttons.
- Sign In, Create Account and Tournament Account are surfaced on the chooser.
- iPhone uses the same shared Phase 418 table surface while keeping the Phase 400 Safari adapter.

## Wrapper recovery

Previous problem:

The wrapper could display a working table but still fail because every historical QA hook did not report in time, forcing the user to tap `OPEN DIRECT GAME`.

Phase 418 behavior:

- Core playable UI + one burn pile + protected engine is enough to accept the table.
- Full historical QA remains observable but is not allowed to block a playable table.
- If the wrapper really cannot confirm the core table, it automatically opens the direct table after a short grace period.

## Table information placement

- `LEFT → RIGHT` flow rail is moved out of the top table/player layer.
- It is docked immediately after the Phase 404 decision strip inside `#raisePanel`.
- It can no longer overlap top opponent names/cards.
- Opponent bankroll gets an explicit `STACK $…` line in addition to the existing rank/bankroll text.
- A persistent `MIC / VOX` quick control opens the existing Phase 405 voice sheet.
- Profile / Sign In / Create Account are visible at the table.

Voice truth remains unchanged: controls exist, but remote voice only transmits after a real WebRTC peer connection exists.

## Profile and Eric audit

Prior Phase 388 physical/headset audit already established:

- Eric FBX contains rig/animation data.
- It does not contain restorable embedded image textures/material nodes.
- The gray striped appearance was a fallback artifact.
- Imported animation could rotate/collapse Eric in the browser viewer.

Phase 418 reuses that correction strategy for the profile page:

- Bone-aware upright orientation uses `head` and left/right foot/ankle/toe bones.
- Body is re-scaled to about `1.78 m` and grounded after orientation.
- Dressing-room/profile animation mixer is stopped for Eric inspection.
- Original image maps are preserved when a future model actually contains one.
- No-map fallback material is stabilized and checker/stripe fallback maps are not allowed to control the display.
- Profile/mobile layout is compressed so the player identity and avatar are visible immediately instead of requiring a long Matrix-first scroll.

## Account/API audit

### Browser account client contract

`site/js/phase345-player-account-client.js` expects:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /player/profile`
- `PUT /player/profile`
- session/activity and daily-reward endpoints

### Current AWS foundation

`infrastructure/aws/phase372-player-account-foundation.yml` defines:

- Cognito user pool
- public web client
- admin group
- DynamoDB player profiles table
- DynamoDB player sessions table

It does **not** currently define API Gateway or the Lambda service implementing the browser contract.

### Current public player config

`site/config/player-api.json` therefore keeps `apiBase` blank.

That is a truthful deployment state, not a URL typo. Phase 418 labels it `cloud-endpoint-pending` instead of implying a random application failure.

### Architecture drift found

The repo also contains two older backend paths:

1. `backend/phase345/` — complete Node/Azure SQL player-account API matching the browser contract.
2. `api/server.js` — PostgreSQL-style site/admin/messages/analytics API with admin presence routes.

Those are not interchangeable with the AWS Cognito/DynamoDB player-account configuration. Do not point `player-api.json` at either backend until its auth/profile contract is explicitly selected and aligned.

## Cloud deployment boundary

GitHub merge and Pages auto-deploy cannot provision a real AWS API Gateway URL. Enabling the production player API requires:

1. An authorized AWS deployment identity/role.
2. Selected AWS region.
3. API Gateway + Lambda implementation matching the browser account contract.
4. Deployment output URL.
5. Updating public `apiBase` only after that real HTTPS endpoint passes `/health`.

No endpoint, AWS key, database credential, password or secret is invented or committed by Phase 418.

## Release verification

Required before merge:

- Android chooser one-screen lock found.
- Direct wrapper auto-recovery found.
- One burn pile remains.
- Flow rail re-parent contract found.
- Visible MIC / VOX control found.
- Five opponent bankroll badges found at runtime.
- Profile loads Phase 418 compact CSS and Eric authority module.
- Admin/AI fallback logic found.
- AWS config remains secret-free and does not claim a live endpoint.
- Protected poker, Quest and APK contracts remain unchanged.
