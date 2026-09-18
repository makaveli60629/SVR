# SVR Poker Master Manifest

**Status:** authoritative project source memory  
**Current implementation phase:** Phase 465  
**Project:** SVR Poker / Scarlett VR Poker  
**Primary domain:** `svrpoker.com`  
**Repository:** `makaveli60629/SVR`  
**Production branch:** `main`  
**Active migration branch:** `feat/unity6-web-runtime-fastpath-20260918`  
**Active pull request:** PR #264 — Phase 464/465: Unity 6 web fast path + cloud-build foundation  
**Manifest updated:** 2026-09-18

---

## 1. Purpose

This file is the authoritative cross-chat / cross-project handoff for SVR Poker.

A new ChatGPT Project, coding agent, developer, or future conversation should read this file **before modifying the repository**. It records:

- the current product direction;
- the protected production architecture;
- the parallel Unity migration;
- exact build entry points;
- device goals;
- current completed work;
- known limitations;
- the next execution sequence;
- safety/rollback boundaries.

Do not infer project state from older phase manifests when this file contains a newer rule.

---

## 2. Product standard

SVR Poker is a cross-device, six-seat poker platform targeting:

- Meta Quest;
- Android;
- iPhone/iPad browser fallback;
- desktop browsers;
- future native/mobile store delivery.

All clients must ultimately represent the same poker table state and the same legal action model.

The server should remain authoritative for:

- cards and RNG;
- legal actions;
- wagers;
- pots;
- stacks;
- turn order;
- timers;
- settlement;
- reconnect snapshots.

Clients may predict presentation, animation, button response, and local comfort behavior, but never authoritative poker outcomes.

Canonical command envelope:

```text
{ protocolVersion, tableId, sessionId, clientActionId, expectedSequence, action, amount, sentAt }
```

---

## 3. Current architecture — two-track system

SVR is now intentionally split into two runtime tracks.

### Track A — production browser/WebXR game

Current production lineage remains:

- A-Frame;
- Three.js;
- vanilla JavaScript modules;
- WebXR;
- browser/PWA delivery;
- existing SVR backend/API bridges.

Primary entry:

`game/index.html`

This track remains operational and is the fallback while Unity is built beside it.

### Track B — parallel Unity migration

A real Unity project now exists at:

`unity/SVRPoker`

The Unity project does **not** replace or masquerade as the existing browser runtime.

It is the foundation for:

- Unity Web builds;
- Android APK builds;
- Meta Quest/OpenXR builds;
- production avatar/animation migration;
- future shared table geometry and gameplay presentation.

Migration is incremental. Do not delete the existing A-Frame/Three.js game until Unity reaches verified feature parity and release acceptance.

---

## 4. Phase 464 browser-runtime upgrade

Phase 464 applies modern fast-start principles to the current browser game without changing its fundamental engine.

Implemented on PR #264:

- preconnect to critical external module/CDN origin;
- boot-logo preload;
- connection-aware `modulepreload` hints;
- preserved deterministic module execution order;
- version-aware service-worker caching;
- cached versioned JS/CSS/JSON/models/textures/audio/WASM;
- network-first navigation behavior;
- updater/APK paths remain fresh;
- failed runtime assets do not incorrectly fall back to HTML;
- service-worker cache bump to Phase 464.

Important constraint:

The current browser project is still A-Frame/Three.js/WebXR. These improvements are performance and delivery improvements, **not** a fake Unity conversion.

---

## 5. Phase 465 Unity foundation

### Unity project root

`unity/SVRPoker`

### Unity version

`6000.3.15f1`

Revision:

`c1aa84e375f6`

Track:

Unity 6.3 LTS.

### Important project files

```text
unity/SVRPoker/
├── ProjectSettings/
│   └── ProjectVersion.txt
├── Packages/
│   └── manifest.json
├── Assets/
│   ├── Plugins/
│   │   └── WebGL/
│   │       └── SVRWebBridge.jslib
│   └── SVR/
│       ├── Core/
│       │   ├── SVRBootstrap.cs
│       │   ├── SVRPlatform.cs
│       │   └── SVRWebBridge.cs
│       └── Editor/
│           └── SVRBuild.cs
├── .gitignore
└── README.md
```

### Unity Web build method

`SVR.Editor.SVRBuild.BuildWebCloud`

### Unity Android build method

`SVR.Editor.SVRBuild.BuildAndroidCloud`

### Quest prototype method

`SVR.Editor.SVRBuild.BuildQuestPrototype`

The Quest prototype currently shares the Android foundation. Meta XR/OpenXR activation is intentionally deferred until Unity can serialize and verify the generated XR settings in a real Editor session.

### Android application identifier

`com.svrpoker.game`

### Current Unity foundation behavior

The project can automatically create a bootstrap scene.

That scene currently establishes:

- camera;
- directional key light;
- table fill light;
- simple foundation floor;
- simple poker-table placeholder;
- SVR Unity foundation marker.

This placeholder proves the build pipeline before production geometry is migrated.

---

## 6. Unity ↔ website bridge

The Unity Web build has a browser bridge through:

`Assets/Plugins/WebGL/SVRWebBridge.jslib`

Events currently exposed:

- `svr:unity-progress`
- `svr:unity-ready`

Purpose:

The website can display load progress and detect when the Unity player is ready instead of treating Unity as an isolated black box.

Future bridge events should follow the same SVR event-oriented architecture.

---

## 7. Cloud-build architecture

The intended owner workflow is phone-first:

```text
Android phone
    ↓
GitHub / ChatGPT
    ↓
Unity Build Automation
    ↓
Web build / Android APK / future Quest build
    ↓
SVRPoker.com deployment + device testing
```

The Android phone does not need to compile Unity locally.

### Unity Build Automation configuration

Project root:

`unity/SVRPoker`

Web configuration:

- target: WebGL;
- method: `SVR.Editor.SVRBuild.BuildWebCloud`;
- compression: Brotli;
- data caching enabled.

Android configuration:

- target: Android;
- method: `SVR.Editor.SVRBuild.BuildAndroidCloud`;
- artifact target: `SVRPoker.apk`;
- start with test/debug signing;
- production signing comes later.

### External action still required

The Unity account must authorize/connect Build Automation to the GitHub repository.

This account-level authorization cannot be replaced by source-code edits.

---

## 8. GitHub validation

Validation workflow:

`.github/workflows/unity-foundation-lint.yml`

It verifies:

- Unity project structure;
- exact Unity editor pin;
- package JSON validity;
- required WebGL module presence;
- Android JNI module presence;
- cloud build entry points;
- Brotli Web configuration.

The first Unity Foundation Validation run passed successfully.

This is structural validation only. A true Unity compilation still requires Unity Build Automation or a Unity-capable workstation.

---

## 9. Platform strategy

### Meta Quest

Long-term target:

- native Unity Android/Quest build;
- OpenXR / Meta XR;
- seated table experience;
- hands/controllers;
- 72–90 FPS target;
- no unwanted table-zone teleport.

Current production browser Quest route stays available during migration.

### Android

Maintain two delivery choices:

1. browser/mobile web;
2. Unity Android APK.

Android controls must remain readable and non-overlapping.

### iPhone/iPad

Maintain browser/touch fallback.

Do not make the entire product depend on WebXR availability in Safari.

### Desktop

Maintain browser preview/testing and optional Unity Web access.

---

## 10. Locked Quest table authority

- Exactly one approved table should be visible in the playable scene.
- Exactly one Eric/dealer should be present.
- No duplicate tabletops.
- No floating table cover.
- No dark face-mounted obstruction.
- No uncontrolled blinking light/card artifact.
- Player spawn is seated at the table at a comfortable eye line.
- Table-zone teleport remains disabled.
- Future lobby travel uses deliberate destination logic outside the protected table interaction zone.

Reference measurable comfort/performance gates:

- duplicate-input suppression target: 180 ms;
- seated eye height target: 1.35 m–1.75 m;
- seat drift target: ≤ 0.08 m;
- no face obstruction closer than 0.45 m;
- 72 Hz frame budget: 13.89 ms;
- 90 Hz frame budget: 11.11 ms.

---

## 11. Dealer / Eric authority

Eric is the dealer, not a selectable player avatar.

Migration order for Eric:

1. validate table world scale;
2. validate table origin;
3. validate dealer anchor;
4. import Eric;
5. align feet/seat/dealer zone;
6. attach animator;
7. add idle;
8. add card pickup;
9. add left-to-right dealing;
10. verify hands/cards remain visible from all six seats.

Do not migrate Eric before the canonical table geometry is stable.

---

## 12. Avatar direction

SVR avatars are a modular system, separate from Eric.

Target features include:

- male/female base bodies;
- skin variation;
- eye variation;
- hair styles;
- body-size variation;
- wardrobe anchors;
- shirts/jackets/accessories;
- female nail customization;
- profile/store equipment;
- rig verification before wardrobe production;
- animation-compatible skeleton.

Core body and rig correctness comes before large wardrobe/content production.

---

## 13. Lobby direction

The approved long-range direction is a modular octagonal casino/social atrium.

Potential areas include:

- central giveaway area;
- store/avatar mirror;
- leaderboards;
- sponsor placements;
- Reiki/meditation;
- golf;
- Scorpion room;
- future portal-driven rooms.

Performance rules:

- merge or instance static geometry where practical;
- bake lighting where possible;
- reserve real-time lights for important moving/focal objects;
- use texture atlases;
- asynchronously load secondary rooms/content;
- avoid forcing all rooms and avatars into initial boot.

---

## 14. Progressive loading strategy

The desired Unity load sequence is:

```text
boot shell
→ canonical poker table
→ lighting
→ seated camera/player origin
→ Eric
→ cards/chips/basic gameplay
→ local avatar/hands
→ other player avatars
→ social systems
→ secondary rooms
→ store/optional content
```

Large optional environments should eventually use Addressables/progressive loading rather than inflating the initial build.

---

## 15. Permanent protections

Unless a task explicitly overrides a protection:

- do not modify public/marketing pages during game-only phases;
- keep `game` and `site` delivery scopes separate;
- preserve rollback predecessors;
- do not force APK updates during ordinary development phases;
- do not expose secrets, database credentials, private keys, payment secrets, RNG internals, or admin tokens in browser code;
- never expose unauthorized hole cards;
- do not auto-promote a lab build to production without acceptance evidence;
- do not remove the browser fallback during Unity migration;
- do not hand-author generated Meta/OpenXR serialized settings and pretend they have been validated by Unity;
- do not merge PR #264 solely because the files exist—build evidence comes first.

---

## 16. Current PR and release boundary

Active work:

PR #264

Title:

`Phase 464/465: Unity 6 web fast path + cloud-build foundation`

Branch:

`feat/unity6-web-runtime-fastpath-20260918`

Base:

`main`

Status at this manifest update:

- open;
- draft;
- mergeable;
- not merged.

Production `main` therefore remains the live baseline until this migration PR is intentionally merged.

---

## 17. Definition of done for Phase 465

Phase 465 is complete when:

- repository structure validates;
- Unity project restores successfully;
- Web build compiles in Unity;
- Android APK compiles in Unity;
- Web player loads and emits `svr:unity-ready`;
- Android bootstrap scene renders;
- output artifacts can be downloaded/tested;
- rollback instructions remain clear;
- production browser game remains functional.

The structural GitHub portion is complete.

The remaining acceptance work is the first real Unity Web and Android compilation.

---

## 18. Next execution order

A new chat/project should continue in this order unless the user explicitly changes priority:

1. Connect Unity Build Automation to `makaveli60629/SVR`.
2. Create WebGL build configuration rooted at `unity/SVRPoker`.
3. Run first Unity Web build.
4. Fix any compiler/package errors.
5. Create Android build configuration.
6. Run first Android APK build.
7. Test bootstrap build on actual devices.
8. Import the canonical SVR poker table only.
9. Verify table scale, origin, felt, logo, pass-line geometry, and seated camera.
10. Port lighting.
11. Port Eric and dealer animations.
12. Port cards/chips and authoritative action presentation.
13. Add OpenXR/Meta XR through a real Unity Editor session.
14. Add Quest hands/controllers.
15. Port avatar system.
16. Move optional rooms/content to progressive loading.
17. Integrate Unity Web build into SVRPoker.com with the existing browser version retained as fallback.
18. Only after parity/QA: consider production cutover.

---

## 19. Do not repeat solved work

The following foundation work already exists and should not be rebuilt from scratch:

- Phase 464 browser preconnect/preload pass;
- connection-aware module preload logic;
- version-aware service-worker runtime caching;
- Unity 6.3 LTS project folder;
- exact Unity version pin;
- SVR platform helper;
- Unity Web browser bridge;
- Unity bootstrap runtime;
- cloud-callable Web build method;
- cloud-callable Android build method;
- project-local Unity gitignore;
- Phase 464/465 documentation;
- Unity structural GitHub validation workflow.

Extend these pieces rather than creating parallel duplicates.

---

## 20. Cross-chat handoff instruction

When this project is opened in another ChatGPT chat/project, begin with:

> Read `docs/SVR_MASTER_MANIFEST.md` from `makaveli60629/SVR`, then inspect PR #264 and the current branch before changing code. Treat the manifest as project memory, verify repository state, preserve the production browser runtime, and continue the Unity migration from the listed next execution order.

If PR #264 has been merged or replaced, update this manifest before starting a new major phase.

---

## 21. Source-of-truth hierarchy

When documents conflict, use this priority:

1. current user instruction;
2. current repository state;
3. this `docs/SVR_MASTER_MANIFEST.md`;
4. current active-phase manifests;
5. historical manifests/backups.

Historical phase files remain useful lineage records but are not automatically current requirements.

---

## 22. Current milestone

**Milestone name:** SVR Unity Cloud-Build Foundation  
**Phase:** 465  
**Immediate gate:** first successful Unity Web build + Android APK build  
**Production protection:** existing A-Frame/Three.js/WebXR game remains live/fallback  
**Next major migration asset:** canonical poker table
