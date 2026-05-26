# Phase 248 — Supplemental Audit + Recovery Lock

**Project:** SVR Poker / Scarlett VR Poker  
**Track:** Game-side recovery/audit only  
**Date:** 2026-05-25  
**Supplement Type:** Manifest supplement, not master manifest replacement  
**Trusted baseline rule:** Phase 241 remains the last trusted working baseline unless a later phase is proven by diff and QA to preserve Phase 241 behavior without regression.

---

## 1. Purpose

This supplement exists because the project drifted backward through mixed deployment paths, stale ZIPs, direct `/game` commits, and phase-label confusion. This document does not replace `docs/SVR_Master_Manifest.md`. It corrects the active working rules and lists the current bugs, locks, and required fixes before further feature work.

---

## 2. Current Source Reality

The current committed source is labeled:

`PHASE-247-DIRECT-DEPLOY-ROUTE-VERIFY-LOCK`

Active source files confirm:

- `game/index.html` advertises Phase 247.
- `game/docs/BUILD_VERSION.json` advertises Phase 247.
- `update/version.json` advertises Phase 247.
- Current workflow deploys committed `/game` files directly.
- `update/game.zip` is backup/support only and must not be treated as the sole live source.

Important: Phase 247 is a candidate state, not automatically the trusted gameplay baseline. Phase 241 remains the trusted baseline until Phase 247 is reconciled against it.

---

## 3. Locked Rules

### 3.1 Site Lock

- Do not touch website/site/public page work in this game recovery phase.
- Root public Matrix site remains locked.
- `/site` remains locked unless user explicitly opens a site-track request.

### 3.2 Game Baseline Lock

- Do not revert to Phase 296 or any higher-numbered backup just because it has a higher number.
- Do not overwrite the current lobby with a scaffold shell.
- Do not replace the original working lobby layout.
- Apply targeted module fixes only.

### 3.3 Phase 241 Lock

- Phase 241 is the user-trusted working reference.
- Later phases must be diff-audited before being trusted.
- If a later phase broke locomotion, teleport, watch, fist toggle, poker controls, or private routing, restore the Phase 241 behavior for that module only.

### 3.4 Deployment Lock

- Commit `/game` directly.
- Keep `game/docs/BUILD_VERSION.json` and `update/version.json` synchronized.
- Keep `update/game.zip` synchronized only as backup/support.
- Do not rely on uploading a stale `game.zip` alone.
- Current deploy workflow excludes ZIP files and deploys committed direct files.

---

## 4. Current Bug Audit

### BUG-001 — Locomotion regression risk

**File:** `game/modules/teleport.js`  
**Area:** `movePlayerFromControllers(dt)`

Current logic selects `moveSource = leftGp || rightGp`, which can allow left-controller gamepad priority when the locked requirement is right-controller movement fallback. This conflicts with the user rule that Quest/Oculus right stick must support forward/back movement and right-stick X must snap turn.

**Required fix:**

- Preserve right-controller stick up/down forward/back movement.
- Preserve right-stick left/right 45-degree snap turn.
- Allow left stick as optional fallback only if right controller is unavailable.
- Document this explicitly in code comments and QA checklist.

### BUG-002 — Teleport button language drift

**File:** `game/modules/teleport.js`

Idle status says `A/X teleport`, while active controller teleport uses trigger hold/release. The project lock requires hold A / grip / trigger to aim and release to teleport, with no accidental instant teleport.

**Required fix:**

- Update status copy and control mapping to match actual locked behavior.
- Add explicit A-button support if missing.
- Keep trigger-release teleport as fallback.
- Keep grip/fist hold/release teleport behavior.

### BUG-003 — Fist on/off toggle is too narrow

**File:** `game/modules/teleport.js`

Current hand fist toggle only works when the hand is near the face. That may be intentional safety, but the user reports the FIST on/off behavior broke. The lock must preserve safe no-accidental teleport while making fist toggle reliable.

**Required fix:**

- Keep no accidental instant teleport.
- Support clear fist/hold gesture to arm teleport.
- Add a visible TP ON/OFF state to watch and HUD.
- Require release-to-teleport after stable aim.
- Record the expected QA test.

### BUG-004 — Teleport arc stubbed out

**File:** `game/modules/teleport.js`

`hideArc(){}` is currently empty. If the curved teleport arc existed in the trusted locomotion module, it is now missing or disabled.

**Required fix:**

- Restore visible curved teleport arc or line feedback.
- Preserve target logo marker and purple glow.
- Hide arc cleanly when teleport is off.

### BUG-005 — Watch attachment works only if hand/controller proxy has usable wrist/index/pinky data

**Files:** `game/modules/watch.js`, `game/modules/hands.js`

The watch pose computes from wrist, index, and pinky joints. Controller proxies create joints, but the watch still needs QA against controller fallback to verify it stays mounted and clickable.

**Required fix:**

- Verify watch mounts on controller-proxy hands when real hand tracking is unavailable.
- Verify trigger/pinch simulation can activate watch buttons.
- Keep controller meshes hidden.
- Keep natural hand-style proxies visible.

### BUG-006 — Source/live drift risk

**Files:** `.github/workflows/deploy.yml`, `game/docs/BUILD_VERSION.json`, `update/version.json`

The workflow currently deploys committed direct files and excludes ZIPs. If only `update/game.zip` is changed, live source will not update. This was the root cause of repeated phase confusion.

**Required fix:**

- Every game patch must commit direct `/game` files.
- Version files must sync with visible game label.
- New build docs must say whether `/game` was touched.

### BUG-007 — Master manifest is stale relative to active runtime

**File:** `docs/SVR_Master_Manifest.md`

The master manifest describes older A-Frame/scarlett1 architecture while the active game uses a Three.js/WebXR module import path under `game/modules/`. This supplement corrects the active recovery rule without rewriting the master.

**Required fix:**

- Keep master manifest untouched for now.
- Use this supplemental manifest as the current recovery source of truth.
- Later create a separate master-manifest revision only after Phase 241 reconciliation is complete.

---

## 5. Required Fix Order

No new scenery, new hubs, sponsor work, store changes, or site work until these are complete.

### Step 1 — Source of truth lock

- Confirm active repo phase.
- Confirm live deploy phase.
- Confirm Phase 241 baseline evidence.
- Mark Phase 247 as candidate only.

### Step 2 — Locomotion module repair

Target file:

`game/modules/teleport.js`

Fix:

- right stick forward/back
- right stick 45-degree snap turn
- left stick fallback only
- no controller-object visibility regression
- no accidental teleport

### Step 3 — Teleport/fist repair

Target files:

- `game/modules/teleport.js`
- `game/modules/gestures.js` if thresholds need adjustment
- `game/modules/watch.js` if state label needs clearer display

Fix:

- TP button toggles on/off
- fist/hand teleport works
- A/grip/trigger hold aims
- release teleports
- visible marker/arc restored
- state resets after teleport

### Step 4 — Watch QA lock

Target files:

- `game/modules/watch.js`
- `game/modules/hands.js`
- `game/main.js`

Fix:

- watch visible on hands and controller proxy
- watch screen faces user
- TP ON/OFF status accurate
- scene buttons route correctly

### Step 5 — Version/deploy lock

Target files:

- `game/index.html`
- `game/docs/BUILD_VERSION.json`
- `update/version.json`
- `update/game.zip` as backup only

Fix:

- direct `/game` source committed
- visible label matches docs
- no stale zip-only deployment

---

## 6. QA Checklist

### Locomotion

- [ ] Quest right stick up moves forward.
- [ ] Quest right stick down moves backward.
- [ ] Quest right stick left/right snap-turns exactly 45 degrees.
- [ ] Left stick is fallback only or secondary, not the only movement path.
- [ ] Movement is headset-facing.

### Teleport

- [ ] TP button toggles teleport on/off from watch.
- [ ] Fist/hand gesture can arm teleport safely.
- [ ] A/grip/trigger hold shows aim marker/arc.
- [ ] Release teleports.
- [ ] No instant accidental teleport.
- [ ] Teleport resets to OFF or safe state after successful jump.
- [ ] Purple glow/target marker visible.
- [ ] Curved arc/line feedback restored if Phase 241 had it.

### Watch

- [ ] Watch appears on real hand tracking.
- [ ] Watch appears on controller-proxy hand.
- [ ] Watch screen faces player.
- [ ] Watch TP ON/OFF label is accurate.
- [ ] Watch scene buttons route correctly.

### Deploy

- [ ] `/game/index.html` build label matches `BUILD_VERSION.json`.
- [ ] `update/version.json` matches.
- [ ] Direct `/game` source committed.
- [ ] No site files changed.
- [ ] Live `/game/deploy-health.json` matches current repo after deploy.

---

## 7. Lock Statement

From this point forward, the project does not move to new features until this recovery checklist is finished. Phase 248 is a correction/audit phase. It is not a redesign phase.

The only approved next code work is targeted repair of locomotion, teleport, fist toggle, watch state, and direct deploy version sync.

---

## 8. Next Build Name

`PHASE-248-LOCOMOTION-TELEPORT-RECOVERY-LOCK`

Next build must produce:

- updated `game/modules/teleport.js`
- updated watch label/state only if necessary
- updated `game/docs/BUILD_VERSION.json`
- updated `update/version.json`
- backup `update/game.zip` only after direct `/game` source is correct

No site changes.
