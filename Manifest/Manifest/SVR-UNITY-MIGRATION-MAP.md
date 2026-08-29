# SVR Poker — Unity Migration Map

**Build authority:** `PHASE-423-PROFESSIONAL-MODULAR-BUSINESS-UNITY-READINESS-LOCK`  
**Purpose:** preserve the current web/Quest/mobile concept while preparing a clean, additive migration into Unity when a development computer is available.

## Migration rule

The current web runtime remains the source of truth until a Unity implementation passes a documented parity gate. Unity migration is **additive**. Do not delete or rewrite the current working web modules merely because a Unity equivalent exists.

Every Unity feature must map back to an SVR module ID in `SVR-MODULE-CATALOG.json` and must have:

- one authoritative assembly/package;
- explicit dependencies;
- an asset/data owner;
- an activation gate;
- tests;
- a rollback path;
- a parity status against the current web runtime.

## Recommended Unity package architecture

Unity Package Manager custom packages are the preferred boundary for large SVR domains. Package names should use reverse-domain notation and remain independent enough to test or disable without destabilizing unrelated systems.

Proposed packages:

| Package | Responsibility | Primary module IDs |
| --- | --- | --- |
| `com.svrpoker.foundation` | bootstrap, config, logging, feature gates, events, service interfaces | `platform.*` |
| `com.svrpoker.identity` | player profile/auth client abstractions | `identity.player-account` |
| `com.svrpoker.poker` | Hold'em state, action authority, pots, hand rules, tournaments | `poker.*` |
| `com.svrpoker.presentation` | lobby, table, avatars, props, materials, audio | `presentation.*` |
| `com.svrpoker.xr` | Quest/OpenXR rig, hands/controllers, locomotion, seated play | `runtime.quest-webxr` |
| `com.svrpoker.mobile` | optional shared mobile UI/domain adapters | `runtime.android`, `runtime.ios` |
| `com.svrpoker.networking` | API clients, presence, future multiplayer transport | `identity.player-account`, `admin.site-api`, tournament authority |
| `com.svrpoker.business` | sponsor/impact/campaign metadata shown inside the experience; no secrets or payment processing | `marketing.*`, `community.*` |
| `com.svrpoker.tests` | edit-mode/play-mode/parity test harness | all enabled modules |

## Assembly definition plan

Each runtime package receives Assembly Definition files so a change in one domain does not force the entire project into one compile dependency graph.

Suggested assemblies:

- `SVR.Foundation`
- `SVR.Foundation.Editor`
- `SVR.Identity`
- `SVR.Poker.Core`
- `SVR.Poker.Tournaments`
- `SVR.Presentation.Lobby`
- `SVR.Presentation.Table`
- `SVR.Presentation.Avatar`
- `SVR.XR.Core`
- `SVR.XR.Quest`
- `SVR.Networking`
- `SVR.Business`
- `SVR.Tests.EditMode`
- `SVR.Tests.PlayMode`

Rules:

1. Poker rules cannot reference presentation assemblies.
2. Presentation may consume read-only poker state through interfaces/events.
3. Identity/networking implementations sit behind interfaces; gameplay must remain testable offline.
4. Business/marketing presentation cannot own money calculations, player bankroll truth, authentication, or poker rules.
5. Editor tooling must never be compiled into player runtime assemblies.

## XR foundation

Use Unity's supported XR stack rather than rebuilding low-level controller behavior from scratch:

- XR Interaction Toolkit for interactors/interactables, UI interaction and locomotion framework.
- OpenXR/XR Plug-in Management for runtime/device integration.
- Input System actions for controller/hand input mappings.
- Keep seated poker interactions separate from free-locomotion/lobby interactions so one can be enabled without the other.

The current Quest web modules remain the behavioral reference for:

- seated table relationship;
- table/rail/felt geometry;
- player/card orientation;
- hand/controller intent;
- teleport policy;
- performance constraints.

## Asset migration and Addressables

Do not copy assets into Unity without an import record. Every model, texture, animation, audio file, logo and sponsor creative should receive a stable asset ID and metadata record.

Recommended fields:

```text
assetId
sourceRepositoryPath
sourceFilename
assetType
licenseOrOwnership
approvedUse
contentHash
unityTargetPath
addressableAddress
addressableLabels
importScale
coordinateNotes
materialNotes
lodPolicy
compressionPolicy
ownerModule
status
```

Use Addressables for reusable/lazy-loaded content such as:

- lobby storefront/hub sets;
- sponsor creatives and approved billboards;
- avatar/model variants;
- table themes;
- room-specific art/audio;
- optional event content.

Core poker logic and essential startup UI should not depend on a remote asset download succeeding.

## Proposed Unity project layout

```text
SVR-Unity/
  Assets/
    SVR/
      Bootstrap/
      Scenes/
      Settings/
  Packages/
    manifest.json
  ProjectSettings/
  UserSettings/                 # never source-controlled

Packages-local/                 # or embedded Packages/ during early development
  com.svrpoker.foundation/
  com.svrpoker.identity/
  com.svrpoker.poker/
  com.svrpoker.presentation/
  com.svrpoker.xr/
  com.svrpoker.networking/
  com.svrpoker.business/
  com.svrpoker.tests/
```

Each custom package should contain its own `package.json`, `Runtime/`, optional `Editor/`, `Tests/`, `Samples~/`, documentation and assembly definitions.

## Scene composition

Avoid one giant scene containing all business concepts.

Recommended composition:

- `Bootstrap` — service container/config/feature gates only.
- `Lobby_Core` — navigation shell and shared lobby geometry.
- `Poker_Table_Core` — poker table and seating contract.
- `Poker_Room_*` — room/theme composition referencing core table.
- `Hub_PGA`, `Hub_Store`, `Hub_Impact`, etc. — additive hub scenes/prefabs.
- `Marketing_Display_System` — approved billboard/sponsor placements consuming campaign data.

Use additive scenes or prefab/module composition so a hub can be removed or replaced without changing poker core.

## Data/service interfaces

Unity must never contain production secrets. API URLs may be public configuration; credentials/secrets remain server side.

Recommended service interfaces:

- `IPlayerIdentityService`
- `IPlayerProfileService`
- `IPokerSessionService`
- `ITournamentService`
- `IPresenceService`
- `IContentCatalogService`
- `ICampaignDisplayService`
- `IAnalyticsService`
- `IFeatureGateService`

Every service needs a local/test implementation so scenes can be developed without live cloud infrastructure.

## Poker migration order

1. Port pure card/hand models and deterministic tests.
2. Port betting/action authority.
3. Port pot/side-pot/split-pot rules.
4. Port table/player presentation adapters.
5. Port local six-seat test match.
6. Port tournament state.
7. Add authenticated player/profile service.
8. Add server-authoritative multiplayer only after local parity is green.

Do not start by porting the lobby visuals while poker rules are still entangled with UI state.

## Business and campaign content inside Unity

Unity is a display/client layer, not the accounting authority.

Sponsor/campaign payloads may include:

- campaign ID;
- approved brand name/logo/creative asset IDs;
- approved placement inventory;
- start/end window;
- disclosure text/flag;
- target hub/room/table;
- click/action destination;
- campaign status.

Money owed to sponsors, charities, contractors or SVR must be calculated and approved in server/accounting systems, not in client-side Unity scripts.

## Unity parity matrix

Before Unity replaces any web authority, record `not-started`, `partial`, `parity`, or `better-than-parity` for:

- Hold'em actions;
- betting order;
- side pots/split pots;
- six-seat layout;
- dealer/burn/deal presentation;
- Quest seated geometry;
- controllers/hands;
- locomotion;
- lobby/hubs;
- profile/avatar;
- tournament registration/start;
- account sign-in;
- sponsor/billboard system;
- accessibility;
- analytics;
- performance;
- crash recovery.

A replacement requires parity for the module being replaced; unrelated modules stay on their current authority.

## Current Unity reference research (August 2026)

Unity 6 documentation supports the architecture above:

- Custom packages can contain scripts, assemblies, native plug-ins and assets and declare dependencies through package manifests.
- Assembly Definitions provide explicit assembly/reference/platform boundaries.
- Addressables provide address-based asynchronous loading and dependency management for local or remote assets.
- XR Interaction Toolkit provides component-based Interactor/Interactable/Interaction Manager patterns and locomotion/UI interaction support.

Reference documentation:

- https://docs.unity3d.com/6000.0/Manual/CustomPackages.html
- https://docs.unity3d.com/6000.0/Manual/upm-manifestPkg.html
- https://docs.unity3d.com/6000.0/Manual/assembly-definition-file-format.html
- https://docs.unity3d.com/6000.0/Manual/com.unity.addressables.html
- https://docs.unity3d.com/6000.0/Manual/com.unity.xr.interaction.toolkit.html

Do not pin future package versions solely from this document. When the Unity workstation is created, select a supported Unity LTS/editor version, then lock package versions after a clean Quest build and test pass.
