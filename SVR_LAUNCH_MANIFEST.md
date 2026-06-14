# SVR Launch Manifest

## Project

**Project:** SVR Poker / svrpoker.com  
**Platform targets:** Web, Mobile, Desktop, VR, Meta Quest  
**Current status:** Launch cleanup, modular rebuild planning, VR lobby correction, production architecture lock.

## Primary Decision

The current cinematic lobby reference is **not** the final VR lobby. It may be used only as:

- visual inspiration
- marketing reference
- desktop landing-page concept

The production VR lobby must be rebuilt as:

- walkable 3D geometry
- modular zone-based scene
- Quest-readable world-space UI
- clean teleport surfaces
- separate desktop and VR HUD layers
- server-connected gameplay systems

## Product Layers

```text
SVR Platform
├── Unity VR Client
│   └── visuals, input, VR lobby, table UI, player interaction
├── Web Client
│   └── svrpoker.com landing page, account portal, table browser
├── Backend API
│   └── auth, profiles, chips, matchmaking, support, sponsor data
├── Game Server
│   └── poker state, rules, seats, betting, cards, winners
├── Webex Service
│   └── support rooms, event rooms, admin alerts, community links
├── AWS Infrastructure
│   └── hosting, APIs, database, logs, secrets, deployment
└── GitHub
    └── source control, CI/CD, releases, issue tracking
```

## Proposed Repository Structure

```text
svr-platform/
├── README.md
├── CHANGELOG.md
├── AUDIT.md
├── TODO.md
├── MODULES.md
├── SECURITY.md
├── DEPLOYMENT.md
├── COMPLIANCE.md
├── SVR_LAUNCH_MANIFEST.md
├── apps/
│   ├── unity-client/
│   ├── web-client/
│   └── admin-dashboard/
├── services/
│   ├── api/
│   ├── game-server/
│   └── webex-service/
├── packages/
│   ├── shared-types/
│   ├── poker-engine/
│   └── analytics-events/
├── infra/
│   ├── aws/
│   └── github/
└── docs/
    ├── vr-lobby/
    ├── architecture/
    ├── deployment/
    ├── webex/
    └── poker/
```

## VR Lobby Architecture

### Target Experience

The player should spawn in a clean physical casino atrium, not a flat panoramic webpage.

```text
                       Legends Hall
                            |
Wellness Hub  —  Spawn Plaza  —  Sponsor Gallery
                            |
                    Play Game / Tables
                            |
                     Scorpion Room
```

### Correct VR Lobby Rules

- One visual floor.
- One collision floor.
- One teleport surface.
- One intended lobby poker table.
- No duplicate hidden floor.
- No unintended green poker table.
- No desktop/browser overlays in VR.
- No browser-style bottom navigation in VR.
- No tiny unreadable text.
- No giant full-screen flat background panels.
- UI must be world-space and readable in Quest.

### Unity Scene Hierarchy Target

```text
LobbyVR
├── LobbyRoot
│   ├── Environment
│   ├── FloorSystem
│   │   ├── VisualFloor
│   │   ├── CollisionFloor
│   │   ├── TeleportNavMesh
│   │   └── FloorPulseDebug
│   ├── ZoneAnchors
│   │   ├── SpawnAnchor
│   │   ├── PlayGameAnchor
│   │   ├── WellnessAnchor
│   │   ├── PGAAnchor
│   │   ├── LegendsAnchor
│   │   ├── SponsorAnchor
│   │   └── ScorpionAnchor
│   ├── Zones
│   │   ├── Zone_PlayGame
│   │   ├── Zone_Wellness
│   │   ├── Zone_PGA
│   │   ├── Zone_Legends
│   │   ├── Zone_Sponsor
│   │   └── Zone_Scorpion
│   ├── Kiosks
│   │   ├── TableSelectKiosk
│   │   ├── WebexSupportKiosk
│   │   ├── SponsorKiosk
│   │   └── LegendsKiosk
│   ├── TableProps
│   │   └── IntendedLobbyPokerTable
│   ├── VRRig
│   ├── VRHUD
│   ├── Lighting
│   └── Audio
└── DesktopOnly_DisabledInVR
```

## Unity Files To Create

```text
apps/unity-client/Assets/Scripts/Lobby/
├── LobbySceneController.cs
├── LobbyZone.cs
├── LobbyZoneRegistry.cs
├── LobbyPlatformMode.cs
├── LobbyDebugValidator.cs
└── LobbySceneNotes.md

apps/unity-client/Assets/Scripts/VR/
├── QuestInputMapper.cs
├── QuestTeleportForwardFix.cs
├── TeleportControllerGuard.cs
├── VRHudController.cs
└── VRRigValidator.cs

apps/unity-client/Assets/Scripts/UI/
├── WorldSpaceKiosk.cs
├── TableSelectKiosk.cs
├── WebexSupportKiosk.cs
└── SponsorKiosk.cs

apps/unity-client/Assets/Scripts/Networking/
├── ApiClient.cs
├── AuthClient.cs
├── WebSocketClient.cs
└── ReconnectManager.cs
```

## Backend Files To Create

```text
services/api/src/
├── server.ts
├── routes/
│   ├── auth.routes.ts
│   ├── profile.routes.ts
│   ├── table.routes.ts
│   ├── wallet.routes.ts
│   ├── webex.routes.ts
│   └── health.routes.ts
├── middleware/
│   ├── requireAuth.ts
│   ├── rateLimit.ts
│   └── requestLogger.ts
└── config/
    ├── env.ts
    └── aws.ts

services/game-server/src/
├── server.ts
├── poker/
│   ├── Deck.ts
│   ├── HandEvaluator.ts
│   ├── BettingRound.ts
│   ├── PotManager.ts
│   └── Showdown.ts
├── table/
│   ├── TableActor.ts
│   ├── TableState.ts
│   ├── SeatManager.ts
│   ├── TurnManager.ts
│   └── TableLifecycle.ts
└── security/
    ├── ActionValidator.ts
    ├── AntiCheatMonitor.ts
    └── ServerAuthority.ts

services/webex-service/src/
├── webexClient.ts
├── createSupportRoom.ts
├── createTournamentRoom.ts
├── sendAdminAlert.ts
├── webexWebhookHandler.ts
└── types.ts
```

## AWS MVP Architecture

```text
CloudFront
├── S3 static hosting for svrpoker.com
├── API Gateway HTTP API
│   └── API service
├── API Gateway WebSocket API
│   └── game server router
└── WAF

Backend
├── ECS Fargate or Lambda for API
├── ECS Fargate for game server
├── DynamoDB for player/table/session data
├── Redis / ElastiCache for presence, seat locks, and timers
├── Cognito for auth
├── Secrets Manager for Webex/AWS/API secrets
├── SQS for async events
└── CloudWatch for logs and alarms
```

## Webex Integration Rule

Webex must be backend-controlled.

```text
Unity / Web Client
        |
        v
SVR API
        |
        v
Webex Service
        |
        v
Webex API
```

Rules:

- Webex bot token must never be inside Unity.
- Unity calls SVR API.
- SVR API calls Webex service.
- Webex service calls Webex API.
- Secrets live in AWS Secrets Manager.

## GitHub Workflow Plan

Branches:

```text
main        = production
staging     = pre-production
develop     = active integration
feature/*   = individual fixes
hotfix/*    = emergency fixes
```

Labels:

```text
launch-blocker
vr
unity
aws
webex
security
poker-engine
frontend
backend
deployment
documentation
```

Initial issues:

- `[launch-blocker][vr] Remove desktop HUD from VR lobby`
- `[launch-blocker][vr] Fix duplicate floor system`
- `[launch-blocker][vr] Fix Quest right-controller teleport forward`
- `[launch-blocker][vr] Remove unintended green poker table`
- `[backend] Add API health check`
- `[webex] Add server-side support room service`
- `[aws] Add staging environment`
- `[security] Move all secrets to Secrets Manager`
- `[poker-engine] Enforce server-authoritative table state`

## Launch Blocker Checklist

- [ ] Desktop HUD disabled in VR.
- [ ] Browser/debug controls hidden in headset.
- [ ] `VR NOT SUPPORTED` removed from VR build.
- [ ] Input tracking fixed.
- [ ] Quest right controller aims teleport ray forward.
- [ ] Duplicate/two-floor problem removed.
- [ ] Intended floor can blink/pulse without affecting collision.
- [ ] Unwanted green poker table removed.
- [ ] Correct lobby poker table remains.
- [ ] Table selection kiosk works in world space.
- [ ] Webex support kiosk calls backend only.
- [ ] API health endpoint returns OK.
- [ ] Secrets are not in Unity or GitHub.
- [ ] Staging AWS environment exists before production.
- [ ] Poker game state is server-authoritative.

## Teleport Controller Fix

Required behavior:

- Meta Quest right-controller forward equals teleport/movement forward.
- Player body/camera forward should not override right-hand aim direction.
- Teleport ray must follow controller forward, not headset forward.
- Teleport destination must land on the teleport nav mesh only.

Suggested module:

```text
apps/unity-client/Assets/Scripts/VR/QuestTeleportForwardFix.cs
apps/unity-client/Assets/Scripts/VR/QuestInputMapper.cs
apps/unity-client/Assets/Scripts/VR/TeleportControllerGuard.cs
```

## HUD Layer Fix

Split UI roots:

```text
DesktopHUD
├── TopButtons
├── BottomNav
├── WebDebugButtons
└── BrowserStatus

VRHUD
├── WristMenu
├── FloatingNearbyPrompt
├── ControllerRayPointer
└── ZoneTooltip
```

Runtime rules:

- VR: `DesktopHUD.SetActive(false)` and `VRHUD.SetActive(true)`.
- Desktop: `DesktopHUD.SetActive(true)` and `VRHUD.SetActive(false)`.
- Do not share one HUD root between VR and desktop.

## Work Log

Decision:
SVR will be structured as a modular production platform with Unity VR client, web client, backend API, game server, Webex service, AWS infrastructure, and GitHub CI/CD.

Assumptions:

- Unity is the long-term main VR/game client.
- Current browser/WebXR work remains useful as a prototype/demo track until Unity migration is explicitly started.
- AWS hosts backend, web, auth, secrets, logs, and game infrastructure.
- Webex is used for support, events, rooms, alerts, or community workflows.
- GitHub is the source-control and release-management system.

Modules touched/planned:

- Unity VR Client
- Lobby Scene
- Floor System
- Teleport Controller
- Quest Input Mapping
- HUD Layer
- Poker Table Props
- Backend API
- Poker Game Server
- Webex Service
- AWS Infrastructure
- GitHub Workflow
- Security
- Deployment
- Documentation

Risks:

- VR lobby will stay broken if desktop UI and VR UI share the same canvas.
- Teleport bugs will continue if controller forward is not the ray authority.
- Poker will be unsafe if Unity controls cards, chips, or winners.
- Webex will be insecure if tokens are stored in the client.
- AWS deployment will be risky without staging and secrets management.

Rollback plan:

1. Duplicate current Unity scene as `Lobby_OLD_Backup.unity`.
2. Create new scene named `LobbyVR.unity`.
3. Keep desktop lobby separate as `LobbyDesktop.unity`.
4. Create feature branch: `feature/vr-lobby-rebuild`.
5. Commit every module separately.
6. Deploy backend first to staging, not production.
7. Only merge to main after VR, API, Webex, and AWS checks pass.

## Immediate Next Action

Open the repo/project workspace and provide one of the following:

1. Unity scene hierarchy screenshot.
2. `Assets/Scripts` folder screenshot.
3. XR Interaction Toolkit setup screenshot.
4. Teleport controller script.
5. VR rig hierarchy.
6. Current Lobby scene object list.

Then convert this manifest into exact file edits, pull-request tasks, and implementation commits.
