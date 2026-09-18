# SVR AI Communication Manifest

**Manifest version:** 1.0.0  
**Project:** SVR Poker / `makaveli60629/SVR`  
**Primary repository:** https://github.com/makaveli60629/SVR  
**Primary development branch:** `main`  
**Working branch:** `copilot/quest-onboarding-feedback`  
**Last updated:** 2026-09-18

## 1. Purpose

This manifest defines how AI tools and human contributors coordinate work on SVR Poker. It is intended to keep research, planning, implementation, testing, and deployment aligned.

The repository is the source of truth. AI tools must not claim that code is deployed, multiplayer is live, or Quest acceptance is complete unless the repository and physical-device tests provide evidence.

## 2. AI roles

| Role | Responsibility | Required output |
|---|---|---|
| **Coordinator AI** | Maintains priorities, resolves conflicts, assigns work, and updates this manifest. | Current milestone, owner, dependencies, blockers |
| **Research AI** | Studies Quest VR poker conventions, WebXR comfort, interaction, avatars, and performance. | Sources, findings, recommendations, date checked |
| **Audit AI** | Inspects repository structure, active manifests, workflows, runtime authorities, and security risks. | Evidence-based audit with file paths and acceptance gaps |
| **Gameplay AI** | Designs and implements poker state, bots, betting, turns, settlement, and next-hand flow. | State/event contract and tests |
| **XR AI** | Owns Quest movement, teleportation, snap turn, recentering, seating, and calibration. | Input contract, calibration data, device QA |
| **Presentation AI** | Owns lobby, rooms, lighting, table composition, card readability, effects, and deal animation. | Visual contract, performance budget, screenshots/device notes |
| **Avatar AI** | Owns player/bot avatar construction, tracking, nameplates, expressions, LOD, and privacy. | Asset license record, model budget, fallback behavior |
| **Multiplayer AI** | Owns realtime sessions, presence, reconnect, matchmaking, voice/moderation integration, and server authority. | Network protocol, server ownership, failure handling |
| **QA AI** | Runs static checks, browser checks, workflow checks, and maintains Quest acceptance procedures. | Reproducible results, failures, device/build identifiers |
| **Release AI** | Reviews changes for deployment safety, cache/versioning, rollback, and production claims. | Release checklist and verified commit SHA |

One AI may perform several roles, but each change must identify the roles performed.

## 3. Authority order

When instructions conflict, use this order:

1. Safety, security, privacy, and legal requirements
2. The current production route and runtime manifest
3. This communication manifest
4. A committed architecture or design contract in `docs/`
5. Current source code and tests
6. Historical phase notes and backup directories
7. External research and suggestions

Historical files must not override the active runtime merely because they have a higher phase number.

## 4. Current product priorities

### Milestone A — Quest vertical slice

- One production Quest route: `game/quest.html`
- One renderer, scene, table, dealer, deck, and movement authority
- Reliable standing/seated spawn and recentering
- Controller and hand-tracking parity
- Complete play-money hand with bots
- Deterministic card-deal animation
- Readable cards, pot, active turn, and legal actions
- Next-hand and leave-table recovery

### Milestone B — Lobby and rooms

- Lightweight Quest-first lobby
- One clear Play Poker destination
- Lazy-loaded secondary rooms
- Consistent movement and alignment anchors
- No duplicate tables, dealers, lights, overlays, or portals

### Milestone C — Avatars

- Quest-safe avatar fallback first
- Head and hand tracking
- Nameplates and bot/player identity
- LOD and frame budget
- Licensed realistic assets only after the vertical slice is accepted

### Milestone D — Multiplayer

- Choose one server authority
- Server-owned shuffle, hidden cards, legal actions, timers, and settlement
- Presence, invites, reconnect, seat reservation, and bot replacement
- Do not describe multiplayer as live until end-to-end server tests pass

## 5. Active technical authorities

| Concern | Current evidence/authority | Rule |
|---|---|---|
| Quest platform selection | `game/modules/phase340_platform_manifest.js` | Changes require manifest validation |
| Quest entry | `game/quest.html` | Do not add a second Quest boot route without coordinator approval |
| Runtime boot | `game/modules/phase340_platform_core_loader.js` | Preserve startup and deferred-load boundaries |
| Three.js/WebXR scene | `game/modules/core_scene.js` and active `game/main.js` | Never create a second renderer or animation loop |
| Poker truth | `game/modules/phase336_authoritative_engine.js` | Presentation must not mutate poker truth directly |
| Poker evaluation | `game/modules/phase336_poker_evaluator.js` | All hand results use the authoritative evaluator |
| Card presentation | `game/modules/phase341_*`, `phase368_*`, and current Quest card modules | Consolidate before adding another dealer animation |
| XR input/movement | Active `movement_phase228.js` path and Quest manifest | Controller and hand input must share destination/height rules |
| Wrist console | `game/modules/watch.js` | Secondary controls only; core poker actions remain at the table |
| Onboarding | `game/modules/quest_onboarding.js` | Must remain player-facing and not create runtime authorities |
| Avatar prototype | `game/modules/quest_avatar_factory.js` | Prototype only until licensed optimized models exist |
| Vertical-slice events | `game/modules/quest_vertical_slice.js` | Use events to connect poker truth to animation/presentation |

If the active authority cannot be determined, stop implementation and record a blocker rather than adding another competing authority.

## 6. Communication protocol

Every AI task must begin with a short task record:

```text
TASK_ID: SVR-YYYYMMDD-NNN
ROLE: Coordinator | Research | Audit | Gameplay | XR | Presentation | Avatar | Multiplayer | QA | Release
REQUESTED_BY: username or agent
BRANCH: branch name
SCOPE: files/directories included
OUT_OF_SCOPE: explicit exclusions
DEPENDENCIES: task IDs or files
SUCCESS_CRITERIA: measurable conditions
```

Every completed task must end with:

```text
TASK_ID: SVR-YYYYMMDD-NNN
STATUS: complete | partial | blocked
COMMIT: SHA or none
FILES_CHANGED: list of paths
TESTS: commands and results
QUEST_TEST: not-run | pending | passed | failed
RISKS: known risks
NEXT_OWNER: role or human
NEXT_ACTION: one concrete action
```

AI tools do not communicate directly with one another through hidden channels. They coordinate through committed files, GitHub issues/PRs, commit messages, and these task records.

## 7. Change-control rules

1. Work on a feature branch, never directly on `main` unless explicitly authorized.
2. One coherent milestone per pull request.
3. Do not mix lobby redesign, multiplayer transport, avatar asset replacement, and poker-engine changes in one unreviewed commit.
4. Before changing an authority module, inspect its manifest consumers and dependent modules.
5. Do not delete historical phase files during a gameplay fix; archive them in a separate cleanup task.
6. Do not add a phase-numbered patch when a named authority or runtime service should be changed.
7. Every new global `window.SVR_*` symbol requires documentation here or in an architecture contract.
8. Every new event requires a name, payload schema, producer, consumers, and failure behavior.
9. Do not commit secrets, credentials, private API keys, unlicensed assets, or real-money balances.
10. Do not claim physical Quest acceptance from desktop/browser execution.

## 8. Event contract

The preferred presentation boundary is event-driven:

```js
window.dispatchEvent(new CustomEvent('svr:card-deal-animation', {
  detail: {
    cardId: 'h17',
    destination: 'player-1-hole-0',
    faceUp: true,
    sequence: 4,
    createdAt: new Date().toISOString()
  }
}));
```

Required rules:

- Poker engine owns whether a card was dealt.
- Presentation owns how the card moves and flips.
- Duplicate events must be safely ignored by sequence/card identity.
- Missing visual assets must not block poker state.
- A failed animation must be logged and resolved to the final card position.

## 9. Definition of done

A feature is complete only when:

- Source changes are committed on the intended branch.
- The active manifest includes required modules exactly once.
- No duplicate renderer/table/dealer/movement authority is introduced.
- Desktop or automated checks pass where available.
- A player-facing failure path exists.
- Documentation is updated.
- Physical Quest testing is marked separately and honestly.
- A rollback commit or known-good parent is identified.

## 10. Quest acceptance gates

### Boot

- Fresh load shows a non-black scene.
- Table is visible from the initial spawn.
- No duplicate VR buttons, tables, dealers, or overlays.
- WebXR failure gives a player-facing recovery message.

### Movement

- Controller teleport works.
- Hand pinch teleport works.
- Snap turn works without changing player height.
- Recenter aligns the player with the seat/table anchors.
- Invalid destinations are rejected visibly.

### Poker

- Cards are dealt to the correct seat.
- Card rank and suit are readable from the seated view.
- Pot and active turn are visible.
- Illegal actions are rejected with an explanation.
- A complete bot hand reaches showdown and settlement.
- The next hand starts without duplicate cards or stale state.

### Social/avatar

- Bots and real-player placeholders use the same seat contract.
- Avatar nameplates identify player/bot state.
- Avatar count is bounded for Quest performance.
- Reconnect/leave removes stale presence safely.

## 11. Blocker policy

Mark a task **blocked** when any of these are true:

- Production authority is ambiguous.
- Required asset license or server endpoint is missing.
- A change would affect real-money play without security/legal review.
- Physical Quest validation is required but unavailable.
- A requested behavior conflicts with the authoritative poker engine.
- A build/workflow check fails and no safe fallback exists.

A blocked task must include the smallest decision needed to continue.

## 12. Current task board

| ID | Owner role | Task | Status |
|---|---|---|---|
| SVR-001 | Coordinator | Establish AI communication manifest | Complete |
| SVR-002 | XR | Consolidate movement and calibration authority | Planned |
| SVR-003 | Gameplay | Connect authoritative poker events to presentation | Planned |
| SVR-004 | Presentation | Consolidate card-deal animation | Planned |
| SVR-005 | Presentation | Redesign Quest-first lobby | Planned |
| SVR-006 | Avatar | Implement Quest-safe avatar fallback | Prototype added |
| SVR-007 | Multiplayer | Define server-authoritative real-player protocol | Blocked: endpoint not configured |
| SVR-008 | QA | Execute physical Quest acceptance | Pending device access |
| SVR-009 | Presentation / QA | Mode-aware Quest onboarding and loading feedback | In review |

Update this table whenever a task changes state.
