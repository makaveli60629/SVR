# SVR Poker — Phase 99 Current Game Manifest Sync Lock

**Manifest phase:** `PHASE-99-CURRENT-GAME-MANIFEST-SYNC-LOCK`  
**Current runtime build preserved:** `PHASE-98-RUNTIME-PHASE-SYNC-LOCK`  
**Scope:** Game documentation / manifest sync only  
**Website/site touched:** No  
**Repo track:** Game side only

---

## Current state

Phase 99 updates the current game manifest after the Phase 85–98 runtime work. It does not replace the current runtime. The live runtime remains Phase 98 until the next code phase is built.

---

## Current runtime modules

```text
game/modules/playable_poker.js
game/modules/watch.js
game/modules/poker_action_hud.js
game/modules/poker_table_fx.js
game/modules/npc_bot_animation_fx.js
game/modules/poker_feedback_fx.js
game/modules/runtime_audit_guard.js
game/modules/runtime_health_panel.js
```

---

## Current runtime globals

```text
window.SVR_PLAYABLE_POKER
window.SVR_POKER_ACTION_HUD
window.SVR_PHASE91_TABLE_FX
window.SVR_PHASE92_NPC_BOT_ANIMATION_FX
window.SVR_PHASE95_POKER_FEEDBACK_FX
window.SVR_PHASE98_RUNTIME_AUDIT
window.SVR_PHASE98_RUNTIME_HEALTH_PANEL
```

---

## Locked rules

- Game track only.
- Do not edit `/site` or the public Matrix website from this track.
- Preserve original lobby baseline.
- Keep lobby as a portal/storefront hub.
- Keep full Reiki, PGA, Smoker Lounge, Scorpion, and Store experiences as private routes/scenes.
- Preserve Quest controller fallback and hand tracking.
- Preserve left-to-right poker dealing.
- Preserve one player seat and five bot seats.
- Preserve approval-safe Reiki placeholders only.
- Keep unapproved sponsor/founder terms out of runtime.

---

## Next recommended phase

### Phase 100 — Runtime Smoke-Test Checklist + Deploy Pack

Purpose:

- create a precise deploy/test checklist
- document expected health panel output
- document manual smoke tests for poker, watch, HUD, FX, NPC, audit, and private routes
- prepare next phase for visual card mesh synchronization

---

## Test command

After deploy:

```text
https://svrpoker.com/game/?v=phase99-manifest-sync
```

Then press:

```text
Ctrl + F5
```

Open the **HEALTH** panel and verify the runtime is reporting Phase 98/Phase 99 manifest alignment with no site edits.
