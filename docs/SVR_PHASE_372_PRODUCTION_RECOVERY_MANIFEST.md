# SVR Poker — Phase 372 Production Recovery Manifest

## Release identity

- **Build:** `PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK`
- **Source branch:** `agent/phase372-production-recovery-aws-autodeploy`
- **Production source after merge:** `main`
- **Published static branch:** `gh-pages`
- **Custom domain:** `svrpoker.com`
- **Android route:** `/game/android.html?channel=stable&v=phase372`
- **Quest/Oculus route:** `/game/index.html?platform=quest&v=phase372`

## Owner-reported production failure

The owner reported that Android froze and did not show the table, chairs, or JOIN button, while Oculus/Quest did not show the expected new work.

The repository audit found that this was not only a gameplay-module problem:

1. Phase 368–371 changes existed only on an unmerged branch.
2. The custom domain was serving a stale `gh-pages` branch rather than current `main`.
3. `main` was 1,674 commits ahead of the published branch at the time of the audit.
4. Two separate GitHub Pages workflows could compete to publish different artifacts.
5. One workflow excluded FBX files, even though `game/assets/table.fbx` is a protected table fallback.
6. Android and Quest displayed their user-facing entry controls only after long module chains had begun loading.
7. The pending account handoff still contained an obsolete Azure SQL administration script even though AWS is the active database platform.

## Phase 372 corrections

### Visible entry before heavy boot

A new shared recovery module loads before the platform boot sequence:

```text
game/modules/phase372_live_entry_recovery_lock.js
```

Android immediately receives:

- SVR logo
- `JOIN TABLE`
- `LOW POWER`
- `RELOAD`
- visible readiness and recovery messages

Quest/Oculus immediately receives:

- SVR logo
- `START VR LOBBY`
- `LOW POWER`
- `RELOAD`
- visible readiness and recovery messages

The entry module starts the existing protected runtime rather than replacing it. It waits for the canonical table, forces it visible, and then invokes the existing Android join or Quest lobby authorities.

### Android recovery

- Phase 336 remains poker authority.
- Phase 347 remains the only Android MOVE/LOOK/action controller.
- Phase 363 remains bankroll, JOIN/LEAVE, raise, street, burn-card, and settlement authority.
- Phase 364 remains table geometry and alignment authority.
- Phase 365 remains seated HUD, branding, gyro, and camera-stability authority.
- Phase 367 remains viewport and touch calibration authority.
- Phase 369 remains the bounded join transaction and freeze-recovery authority.
- The table is required before the visible Phase 372 join completes.
- The old loading screen is released on both successful boot and recovery/error paths.
- Dealer animation remains deferred until the table/runtime stabilize.
- No second Three.js renderer or duplicate controller is introduced.

### Quest/Oculus recovery

- Phase 358 complete Quest game authority remains protected.
- Phase 361 standing lobby, PLAY GAME seating, watch, and NPC authority remains protected.
- Phase 364 floor/table/spawn authority remains protected.
- Phase 365 Quest VR-button deduplication remains protected.
- The visible Phase 372 lobby-start surface appears before the heavy boot sequence.
- The table must resolve before the lobby entry is released.
- The old loading screen is released on both success and recovery paths.
- Dealer animation is deferred until the Quest lobby/table are stable.

### Dealer truth

- The uploaded `Cards.fbx` motion profile drives the dealer animation.
- The dealer stands across the authoritative table and faces the felt.
- The raw FBX is not parsed on the critical Android/Quest startup path.
- The current dealer does **not** physically grip or transfer card meshes.

## AWS account authority

Azure is retired for the active SVR account design.

The Phase 372 AWS template is:

```text
infrastructure/aws/phase372-player-account-foundation.yml
```

It defines:

- Amazon Cognito User Pool for email identity
- Cognito browser client with SRP and no client secret
- protected Cognito `admin` group
- DynamoDB player-profile table
- DynamoDB player-session table
- encryption, point-in-time recovery, deletion protection, and retain policies

The public account configuration is:

```text
site/config/player-api.json
```

It identifies AWS, Cognito, and DynamoDB, but intentionally contains no AWS region or API Gateway URL until an approved AWS deployment supplies them. It must never contain AWS access keys, secret keys, Cognito secrets, passwords, Cash App credentials, or database credentials.

Public registration always creates a normal player. Admin access is assigned only through the protected Cognito admin group after the real owner account is registered.

Cash App `$SVRhelp` is optional development-support information. Registration does not require payment and never collects a Cash App password, PIN, card number, or account credential.

## Production auto-deploy authority

The only production publisher is:

```text
.github/workflows/deploy.yml
```

On every push to `main`, it:

1. Sparse-checks out the public site and game.
2. Builds a clean deployment directory.
3. Removes backup archives and non-runtime source files.
4. Preserves both protected poker-table assets:
   - `game/assets/models/table.glb`
   - `game/assets/table.fbx`
5. Requires Android, Quest, dealer, Phase 369 recovery, Phase 372 recovery, site, profile, avatar, and account-config files.
6. Generates `/deploy-health.json` with the exact commit and Phase 372 routes.
7. Force-publishes the exact build to `gh-pages`.
8. Polls `https://svrpoker.com/deploy-health.json` for the new commit.

The former competing `.github/workflows/pages.yml` is removed.

## Runtime QA

### Shared Phase 372

```js
window.SVR_PHASE372_QA()
window.SVR_PHASE372_PRIMARY_ACTION()
window.SVR_PHASE372_STATE
```

### Android

```js
window.SVR_PHASE369_ANDROID_QA()
window.SVR_PHASE369_JOIN_READINESS_QA()
window.SVR_PHASE369_JOIN_INTENT_QA()
window.SVR_PHASE367_DEVICE_QA()
window.SVR_PHASE368_CARD_DEALER_STATE
```

### Quest/Oculus

```js
window.SVR_PHASE361_QA()
window.SVR_PHASE364_DEVICE_QA?.()
window.SVR_PHASE358_QA?.()
window.SVR_PHASE368_CARD_DEALER_STATE
```

## APK policy

The web-game recovery does not force a new native APK install:

- Version name: `0.1.0-rc1`
- Version code: `1`
- Forced update: `false`
- Recurring prompt: `false`
- Manual update only: `true`

## Acceptance truth

Code and automated browser validation can prove route wiring, table-asset inclusion, visible entry surfaces, gameplay contracts, AWS configuration safety, and production publishing.

Only the owner’s physical devices can finally confirm:

- Android WebView frame pacing and freezing
- Android safe areas and touch comfort
- Android table/chair/dealer visual position
- Quest Guardian/floor permissions
- Quest hand/controller tracking
- Quest immersive-session stability
- headset comfort and physical card reach

AWS Cognito, DynamoDB, and API Gateway resources also require an authorized AWS deployment role and selected AWS region. This repository commit defines and validates the infrastructure but does not pretend to provision resources without that authorization.

## Continuation order

1. Merge the validated Phase 372 recovery PR.
2. Confirm the auto-deploy workflow publishes the merged commit to `gh-pages`.
3. Confirm `/deploy-health.json` reports Phase 372.
4. Test Android with the Phase 372 route.
5. Test Quest/Oculus with the Phase 372 route.
6. Configure/deploy the AWS account API through the authorized AWS environment.
7. Continue focused Quest interaction polish without redesigning the Phase 372 Android route.
