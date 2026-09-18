# SVR AI Communication Manifest

**Manifest version:** 1.1.0  
**Project:** SVR Poker / `makaveli60629/SVR`  
**Primary development branch:** `main`  
**Current review branch:** `audit/owner-runtime-dedup-20260918`  
**Tracking issue:** #263  
**Last updated:** 2026-09-18

## 1. Purpose

This file is the shared coordination record for human contributors, ChatGPT, GitHub Copilot, and other AI coding agents working on SVR Poker.

The repository is the source of truth. No AI may claim deployment, database connectivity, multiplayer availability, or physical Quest acceptance unless the repository plus the relevant deployed/device evidence proves it.

## 2. Hard scope rules

1. The public launch page at repository root `/index.html` is protected. Backend, owner-panel, and Quest cleanup tasks must not modify it unless the owner explicitly authorizes public-page work.
2. Private owner/admin work belongs under `site/owner.html`, authenticated API routes, and backend/database files.
3. Historical phase files may remain for rollback/reference, but they must not become competing runtime authorities.
4. New fixes should consolidate a named authority instead of creating another visual/render/backend authority.
5. Never commit passwords, JWT secrets, database URLs, AWS keys, Stripe secrets, or private tokens.
6. Never report a remote player-account backend as live while `site/config/player-api.json.accountApiEndpointConfigured` is false.

## 3. AI roles

| Role | Responsibility |
|---|---|
| Coordinator | Maintains priorities, scope boundaries, dependencies, blockers, and this manifest |
| Audit | Finds duplicate authorities, stale routes, security gaps, schema drift, and deployment mismatches |
| Backend | Owns server routes, authentication, validation, storage, and API contracts |
| Database | Owns schema contracts, migrations, indexes, field compatibility, and data-integrity checks |
| XR | Owns Quest input, seating, calibration, movement, and device behavior |
| Presentation | Owns visible Quest room, table presentation, lighting, cards, dealer visuals, and performance |
| Gameplay | Owns authoritative poker state and legal game transitions |
| QA | Maintains reproducible automated checks and physical-device acceptance records |
| Release | Reviews deployment truth, cache/versioning, rollback, and production claims |

One agent may perform multiple roles, but the task record must state which roles were performed.

## 4. Authority order

When instructions or files conflict, use this order:

1. Security, privacy, safety, and legal requirements
2. Explicit current owner instruction
3. Current production route/configuration
4. This manifest
5. Current named authority modules and database contracts
6. Automated tests/workflows
7. Historical phase notes/backups
8. External research

A larger phase number does not automatically make a historical file authoritative.

## 5. Current technical authorities

| Concern | Current authority | Rule |
|---|---|---|
| Public launch page | root `index.html` | Protected in backend/owner/runtime cleanup work |
| Private owner panel | `site/owner.html` | Owner-only controls; no duplicate admin API probing |
| Site/admin API | `api/server.js` | PostgreSQL site/admin authority |
| Site/admin DB contract | `api/database-contract.json` | Required fields/tables must pass schema audit |
| Site/admin schema | `api/sql/001_site_admin_schema.sql` | Canonical idempotent PostgreSQL schema |
| Admin credentials | `admin_users.password_hash` | Database hash is login authority; no runtime plaintext password comparison |
| Private owner uploads | `admin_uploads` + `/api/admin/uploads*` | JWT required; max 8 MB; not public |
| Player identity | Cognito target | Remote endpoint still pending |
| Player storage | DynamoDB target | Contract recorded; remote API not yet verified |
| Player public config | `site/config/player-api.json` | Keep endpoint pending until actual API Gateway/Lambda service is verified |
| Tournament backend | `game/config/tournament-api.json` | Shared registration/push remain pending until verified |
| Quest entry | `game/quest.html` | One production Quest route |
| Three/WebXR core | active `game/main.js` + `core_scene.js` | Never create a second renderer/animation loop |
| Quest table/dealer | approved dealer/table runtime | Only one visible table and one Eric |
| Quest direct-room compatibility | `phase453_quest_direct_table_room_lock.js` | Anchor/travel lock only; no visible room shell or lighting |
| Quest visibility/dedupe/watch repair | `phase460_quest_vr_visible_repair.js` | Dedupe/visibility/watch only; no competing room light rig |
| Quest visible room + lighting | `phase462_quest_professional_table_room.js` | Single visible room/lighting authority |
| Poker truth | `phase336_authoritative_engine.js` | Presentation must not mutate poker truth directly |
| Wrist console | `game/modules/watch.js` | Secondary interface; must not become separate gameplay authority |

If an authority is ambiguous, record a blocker instead of adding another competing implementation.

## 6. Backend and database contract

### Site/admin PostgreSQL

Required schema is machine-readable in `api/database-contract.json`.

Current required tables:

- `admin_users`
- `admin_status`
- `site_messages`
- `admin_logs`
- `marketing_leads`
- `store_items`
- `game_events`
- `site_analytics_events`
- `admin_uploads`

Startup applies the canonical schema and then audits `information_schema`. A configured database that fails the contract must not silently report healthy.

Protected schema audit:

`GET /api/admin/database/schema`

### Private owner uploads

Routes:

- `POST /api/admin/uploads`
- `GET /api/admin/uploads`
- `GET /api/admin/uploads/:id/download`
- `POST /api/admin/uploads/:id/delete`

Rules:

- owner JWT required
- maximum 8 MB per upload
- payload is private PostgreSQL storage
- SHA-256 recorded
- delete is soft-delete from the active owner list
- not a public CDN
- never expose files without authenticated owner access

### Player accounts

The intended player-account architecture remains AWS Cognito + DynamoDB. The public configuration remains truthful:

- `deploymentState = cloud-endpoint-pending`
- `accountApiEndpointConfigured = false`
- `apiBase = ""`

Do not flip these values until a real remote service has passed registration, login, logout, profile, reward, session, and telemetry tests.

## 7. Quest duplicate-authority rules

The Quest vertical slice must maintain:

- one renderer
- one scene
- one visible table
- one visible Eric dealer
- one visible room shell
- one active room-lighting authority
- one player seating authority
- no old lobby/portal visual roots in direct table mode
- no duplicate table covers/overlays/felts
- no competing repair-light rigs

Current cleanup decision:

- Phase 453 keeps only the direct-room compatibility anchor and travel disable logic.
- Phase 460 keeps duplicate cleanup, visibility repair, table alignment, and watch repair.
- Phase 460 must not create a separate directional/hemisphere repair light rig.
- Phase 462 owns the final visible Quest room and lighting.

Historical files can remain in the repository for rollback, but they must not render duplicate authorities.

## 8. Communication protocol

Every AI task begins with:

```text
TASK_ID: SVR-YYYYMMDD-NNN
ROLE: Coordinator | Audit | Backend | Database | XR | Presentation | Gameplay | QA | Release
REQUESTED_BY: owner or agent
BRANCH: branch name
SCOPE: included files/directories
OUT_OF_SCOPE: explicit exclusions
DEPENDENCIES: task IDs/files
SUCCESS_CRITERIA: measurable conditions
```

Every completed task ends with:

```text
TASK_ID: SVR-YYYYMMDD-NNN
STATUS: complete | partial | blocked | in-review
COMMIT: SHA
FILES_CHANGED: paths
TESTS: checks and results
QUEST_TEST: not-run | pending | passed | failed
RISKS: known risks
NEXT_OWNER: role/human
NEXT_ACTION: one concrete action
```

AI tools coordinate through committed files, issues, pull requests, comments, commits, and this manifest. They do not rely on hidden cross-agent communication.

## 9. Definition of done

A task is complete only when:

- code is committed on the intended branch
- public-page scope is respected
- duplicate authorities are not introduced
- database/API contracts remain truthful
- static/syntax/workflow checks pass
- deployment claims identify the exact verified commit
- physical Quest acceptance is separately recorded
- known external blockers remain explicit

## 10. Current task board

| ID | Role | Task | Status |
|---|---|---|---|
| SVR-001 | Coordinator | Establish shared AI communication manifest | Complete |
| SVR-002 | XR | Consolidate movement/calibration authority | Planned |
| SVR-003 | Gameplay | Connect authoritative poker events to presentation | Planned |
| SVR-004 | Presentation | Consolidate card-deal presentation | Planned |
| SVR-005 | Presentation | Quest-first room/lobby architecture | Planned |
| SVR-006 | Avatar | Quest-safe avatar fallback | Prototype |
| SVR-007 | Multiplayer | Server-authoritative real-player protocol | Blocked: endpoint not configured |
| SVR-008 | QA | Physical Quest acceptance | Pending device |
| SVR-009 | Presentation/QA | Mode-aware Quest onboarding/loading | In review on separate Copilot branch |
| SVR-20260918-BACKEND-001 | Audit/Backend/Database/QA | Backend + DB authority audit, hashed admin auth, schema contract | In review |
| SVR-20260918-OWNER-002 | Audit/Backend/Presentation/QA | Owner-panel private uploads + admin route dedupe + Quest room/light dedupe | In review |

## 11. SVR-20260918 backend/owner cleanup record

**Branch:** `audit/owner-runtime-dedup-20260918`

Implemented in this review branch:

- canonical PostgreSQL field contract
- canonical site/admin SQL schema
- database-hash owner authentication
- strong JWT-secret requirement
- production-safe error responses
- database schema audit endpoint
- private authenticated owner file uploads
- owner-panel login/logout/presence corrections
- removal of obsolete owner presence endpoint probing
- authoritative owner health endpoint list
- Phase 453 converted to compatibility anchor instead of a second visible room
- Phase 460 repair lighting removed as a competing light authority
- Phase 462 retained as final visible Quest room/lighting authority
- CI authority guard added
- public root page intentionally untouched

External verification still required:

- remote PostgreSQL endpoint/database must be reachable and pass the schema audit
- private owner upload must be tested against the deployed API
- AWS player API remains unprovisioned/unverified
- physical Quest visual/gameplay acceptance remains pending

No AI may mark those external checks complete without evidence.
