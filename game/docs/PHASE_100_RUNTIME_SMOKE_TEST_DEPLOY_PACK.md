# SVR Poker — Phase 100 Runtime Smoke-Test + Deploy Pack

**Phase:** `PHASE-100-RUNTIME-SMOKE-TEST-DEPLOY-PACK-LOCK`  
**Scope:** Game documentation / deploy validation only  
**Runtime preserved:** `PHASE-98-RUNTIME-PHASE-SYNC-LOCK`  
**Site touched:** No  
**Track:** Game side only

---

## 1. Purpose

This phase creates a clean test and deploy packet for the current modular game runtime. It does **not** replace the lobby, poker engine, website, or site files.

The goal is to stop blind deploys and give every future phase a repeatable smoke-test sequence.

---

## 2. Hard protection rules

Before any future commit or deploy:

```text
DO NOT touch /site
DO NOT touch root public Matrix website files
DO NOT replace the lobby shell
DO NOT remove watch, poker HUD, table FX, NPC FX, feedback FX, runtime audit, or health panel
DO NOT add blocked Reiki/founder/sponsor terms
DO NOT exceed 25 MB when producing ZIP packages
```

Blocked sponsor/Reiki terms remain:

```text
Trueitive
Truitive
trueitive.com
truitive.com
Shyona
Royston
founder photos
outside Reiki websites
unapproved Reiki logos
```

Allowed Reiki placeholder content:

```text
SVR branding
AWAITING APPROVAL
WAITING FOR APPROVAL
```

---

## 3. Deploy steps

Run deploy from GitHub:

```text
GitHub → Actions → Auto Deploy → Run workflow → main
```

Then open:

```text
https://svrpoker.com/game/?v=phase100-smoke-test
```

Force-refresh:

```text
Ctrl + F5
```

---

## 4. First-load smoke test

Confirm:

- game boots past `Loading world…`
- no black screen
- no visible runtime error overlay
- build label eventually syncs via runtime audit
- main lobby is still the original lobby baseline
- Moon and Mars are still visible if sky/lobby visibility is active
- table is visible
- bots are visible
- player can move/look around on desktop

---

## 5. HEALTH panel test

Click the **HEALTH** button.

Expected:

```text
Status: OK or CHECK with clear listed reason
Site touched: NO
Missing modules: none
Missing routes: none or explicitly listed fallback issue
Blocked approval terms: none
Poker: active street / pot value visible
HUD / FX: HUD YES, Table YES, NPC YES, Feedback YES, Panel YES
```

Console optional:

```js
window.SVR_PHASE98_RUNTIME_AUDIT
window.SVR_PHASE98_RUNTIME_HEALTH_PANEL
```

---

## 6. Poker smoke test — desktop/browser

Use either keyboard or HUD buttons.

Keyboard:

```text
F = Fold
C = Check / Call
R = Raise
A = All-In
H = Next Hand
```

Confirm:

- hand starts automatically
- your two cards show
- board cards appear by street
- bots act automatically
- pot value changes
- side-pot logic does not crash on all-in
- winner is declared
- next hand starts
- toast feedback appears on turn/action/winner

---

## 7. Poker HUD smoke test

Confirm desktop/Android HUD shows:

- current street
- pot
- board cards
- player cards
- active player / your turn state
- Fold button works
- Check/Call button works
- Raise button works
- All-In button works
- Next button works

In XR mode the desktop HUD should hide.

---

## 8. Watch smoke test — VR/XR

In Quest/WebXR:

- watch is visible on wrist
- watch is readable
- poker controls appear on watch
- route buttons appear on watch
- teleport toggle appears on watch
- watch does not detach or flip away from the user

Test watch poker buttons:

```text
Fold
Check/Call
Raise
All-In
Next Hand
```

---

## 9. Teleport / movement smoke test

Quest/Oculus target behavior:

```text
Right stick up/down = forward/back movement
Right stick left/right = 45-degree snap turn
A / grip / trigger hold = aim teleport
release = teleport
hand pinch/fist hold = aim teleport
release = teleport
```

Confirm:

- no accidental teleport
- teleport arc appears
- release moves the player
- snap turn does not freeze the runtime
- controller mesh stays hidden or hand-like

---

## 10. Table FX smoke test

Confirm:

- active seat glow appears
- active seat pulse appears unless low-performance fallback is active
- pot chip stack appears
- winner banner appears after showdown
- FX does not break poker input
- low-performance mode can simplify FX without crashing

---

## 11. NPC bot FX smoke test

Confirm:

- bots have subtle idle breathing
- action bubbles appear
- call/raise/all-in chip reach appears
- fold gesture appears
- winner reaction appears
- low-performance mode can reduce animation work

---

## 12. Private route smoke test

Use bottom nav or watch routes.

Check:

```text
Lobby
Seat
Reiki
PGA
Legend
Sponsor
Scorpion
Drive
Chip/Putt
Store
Lounge
```

Expected:

- route buttons do not black-screen
- missing route fallback reports clearly instead of crashing
- full private rooms remain separate routes/scenes, not embedded in the lobby

---

## 13. Approval safety smoke test

In console:

```js
window.SVR_PHASE98_RUNTIME_AUDIT?.blockedApprovalTermsPresent
```

Expected:

```text
[]
```

No blocked sponsor/Reiki terms should appear in game runtime.

---

## 14. Failure handling

If boot fails:

1. Open console.
2. Check runtime error overlay.
3. Check `window.SVR_PHASE98_RUNTIME_AUDIT` if available.
4. Verify `game/index.html` script list still includes:

```text
main.js
poker_table_fx.js
npc_bot_animation_fx.js
runtime_audit_guard.js
poker_feedback_fx.js
runtime_health_panel.js
```

If a module is missing, restore that module only. Do not replace the whole lobby.

---

## 15. Next phase after this pack

Recommended next code phase:

```text
Phase 101 — Visual Card Mesh Sync
```

Goal:

- synchronize visible card meshes with the poker engine state
- show player cards, board cards, and winner reveal as actual table cards
- keep logic source of truth inside `playable_poker.js`
- preserve all Phase 85–100 locks
