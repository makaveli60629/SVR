# SVR Poker — Phase 369–371 Historical Continuation Record

## Superseded by Phase 372

This document is retained only as a historical record of the Phase 368–371 work. It is **not** the active production or database handoff.

The authoritative continuation document is:

```text
docs/SVR_PHASE_372_PRODUCTION_RECOVERY_MANIFEST.md
```

The active release is:

```text
PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK
```

Active routes:

```text
Android: /game/android.html?channel=stable&v=phase372
Quest/Oculus: /game/index.html?platform=quest&v=phase372
Login: /site/login.html?v=phase372
Registration: /site/login.html?mode=register&v=phase372
Deploy health: /deploy-health.json
```

## Preserved Phase 368–371 work

- Phase 368 uploaded `Cards.fbx` dealer motion profile.
- Phase 369 bounded Android JOIN/table recovery and low-power path.
- Phase 370 login, registration, textured avatar, Eric default avatar, profile portrait, and mobile-menu polish.
- Phase 371 Android app banner, AI fallback status, and lighter Matrix rain.

## Corrected production authority

Phase 372 adds the missing live-enablement layer:

- visible Android `JOIN TABLE` before the heavy boot path
- visible Quest/Oculus `START VR LOBBY` before the heavy boot path
- canonical table visibility enforcement
- loading-overlay release on success and recovery
- one production deployment workflow
- exact `main` build published to `gh-pages`
- both `table.glb` and `table.fbx` required in the production artifact
- `/deploy-health.json` commit verification

## Database correction

Azure is retired. Do not use the former Phase 370 Azure SQL role-assignment procedure.

The active account design is AWS:

- Amazon Cognito for identity
- DynamoDB for profiles and sessions
- protected Cognito `admin` group for owner/admin authority
- API Gateway endpoint to be inserted into the public config only after approved AWS deployment

AWS template:

```text
infrastructure/aws/phase372-player-account-foundation.yml
```

Public configuration:

```text
site/config/player-api.json
```

No public file may contain AWS keys, client secrets, passwords, database credentials, Cash App passwords, PINs, or card numbers.

## Acceptance truth

The repository and browser tests can validate code, assets, routes, gameplay contracts, and deployment packaging. Final freeze behavior, touch comfort, table/dealer position, Oculus tracking, and immersive-session stability still require the owner’s physical Android and Quest devices after deployment.
