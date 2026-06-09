# RICI Final Polish Update Manifest

**Project:** SVR Poker / svrpoker.com WebXR game  
**Update name:** RICI Final Polish Update  
**Version target:** `VERSION-1.7.0-RICI-FINAL-POLISH-BASELINE-LOCK`  
**Purpose:** Stop completed work from reverting, lock modules by permanent IDs, prepare the RICI/Reiki presentation flow, and connect module state to AWS-backed persistence.

---

## 1. Current Problem

The game is losing completed work because later patches are overwriting earlier modules. The visible symptoms are:

- Moon and Mars move correctly, then revert when another update runs.
- Old sky scripts fight newer sky scripts.
- Android stick controls keep disappearing.
- Reiki storefront/glass layout gets corrected, then damaged by another phase.
- Build labels show old versions after a newer patch.
- `/game`, `update/game.zip`, GitHub Pages output, and chat state are not always aligned.

The fix is to create a **single source of truth** for module locks and force every future phase to read that lock before editing.

---

## 2. Hard Rules

- Game side first.
- Do not touch the public website unless specifically working on the RICI presentation page.
- Do not rebuild or replace the lobby.
- Do not touch the private Reiki room until the baseline lock is installed.
- No duplicate Moon/Mars modules.
- No duplicate Android controller modules.
- No duplicate Reiki storefront/glass modules.
- Every module must have a permanent ID.
- Every locked value must exist in AWS and local repo JSON.
- Future phases must modify modules by ID, not by adding another competing script.

---

## 3. Permanent Module IDs

| Area | Permanent ID | Purpose |
|---|---|---|
| Moon | `svr.module.celestial.moon.primary` | One real Moon only |
| Mars | `svr.module.celestial.mars.primary` | One real Mars only |
| Celestial controller | `svr.module.celestial.controller.primary` | Single sky controller |
| Skyline tiers | `svr.module.skyline.tierlock.primary` | Building tier lock |
| Android controls | `svr.module.controls.android.primary` | Android smart-device sticks |
| Quest controls | `svr.module.controls.quest.primary` | Quest controller fallback |
| Hand teleport | `svr.module.controls.handteleport.primary` | Fist/pinch teleport |
| Reiki storefront | `svr.module.reiki.storefront.primary` | Lobby storefront |
| Reiki glass wall | `svr.module.reiki.glasswall.primary` | Glass attached to black wall |
| Reiki carousel | `svr.module.reiki.carousel.primary` | Manual hologram carousel |
| Reiki private room | `svr.module.reiki.private-room.primary` | Meditation demo room |
| RICI preview camera | `svr.module.camera.rici.preview` | Dedicated presentation camera |
| Presentation route | `svr.route.presentation.rici` | Presentation page/game preview route |

---

## 4. AWS Database Lock

Recommended service: **DynamoDB** for module locks.

Table:

```text
svr_module_locks
```

Primary key:

```text
module_id
```

Recommended fields:

```json
{
  "module_id": "svr.module.celestial.moon.primary",
  "environment": "production",
  "version": "1.7.0",
  "enabled": true,
  "locked": true,
  "lock_priority": 1000,
  "config": {},
  "last_good_config": {},
  "updated_by": "SVR",
  "updated_at": "ISO_DATE",
  "notes": "Current locked production module state"
}
```

Optional history table:

```text
svr_module_lock_history
```

This stores every module change before/after so we can roll back to the last good state.

---

## 5. Required Local Config Files

Create these in the repo:

```text
game/config/module-locks.json
game/config/current-baseline.json
game/config/celestial-lock.json
game/config/control-locks.json
game/config/reiki-presentation-lock.json
game/docs/RICI_FINAL_POLISH_MANIFEST.md
game/docs/RICI_FINAL_POLISH_QA_CHECKLIST.md
game/docs/RICI_FINAL_POLISH_AWS_SCHEMA.md
```

Priority order:

```text
1. AWS production lock
2. Local game/config/*.json
3. Emergency hardcoded defaults
```

---

## 6. Celestial Lock

Current requested target:

```json
{
  "module_id": "svr.module.celestial.controller.primary",
  "version": "1.7.0",
  "locked": true,
  "moon": {
    "id": "svr.module.celestial.moon.primary",
    "position": [-620, 8000, -6200],
    "scale": [800, 800, 800],
    "texture": "game/assets/textures/moon.jpg",
    "visible_from_lobby": true,
    "rotation_enabled": true
  },
  "mars": {
    "id": "svr.module.celestial.mars.primary",
    "position": [680, 8000, -7200],
    "scale": [800, 800, 800],
    "texture": "game/assets/textures/mars.jpg",
    "visible_from_lobby": true,
    "rotation_enabled": true
  }
}
```

Rules:

- Only one Moon visible.
- Only one Mars visible.
- Older sky modules removed from `index.html`.
- Buildings cannot block Moon/Mars.
- Future phases must import this lock instead of hardcoding new positions.

---

## 7. Android Controller Lock

Permanent ID:

```text
svr.module.controls.android.primary
```

Required behavior:

| Input | Behavior |
|---|---|
| Right virtual stick up/down | Forward/back using camera/head yaw |
| Right virtual stick left/right | 45-degree snap turn |
| Touch teleport hold | Aim teleport |
| Touch teleport release | Teleport |
| Desktop | Android overlay hidden |
| Quest | Android overlay hidden |
| Android browser | Android overlay visible |

Config:

```json
{
  "module_id": "svr.module.controls.android.primary",
  "locked": true,
  "enabled_on": ["android", "mobile-browser"],
  "hidden_on": ["desktop", "quest-webxr"],
  "movement_reference": "camera_yaw",
  "snap_turn_degrees": 45,
  "teleport": {
    "mode": "hold_to_aim_release_to_teleport",
    "no_instant_teleport": true
  }
}
```

---

## 8. Reiki / RICI Storefront Lock

Permanent IDs:

```text
svr.module.reiki.storefront.primary
svr.module.reiki.glasswall.primary
svr.module.reiki.carousel.primary
```

Rules:

- Storefront stays in lobby.
- Glass attaches to the beginning of the black wall, not carpet.
- Red carpet remains clear.
- Hologram carousel is manual, not auto-spinning.
- Presentation slides remain approval-gated.
- Private Reiki room opens through portal/carousel.

Glass lock:

```json
{
  "module_id": "svr.module.reiki.glasswall.primary",
  "locked": true,
  "placement": "beginning_of_black_wall",
  "red_carpet_clear": true,
  "must_attach_to_wall": true,
  "must_not_cross_walkway": true,
  "trim": "cyan_neon"
}
```

---

## 9. RICI Presentation Flow

Presentation route:

```text
svr.route.presentation.rici
```

Target site path:

```text
/site/presentations/rici.html
```

Target game preview route:

```text
/game/?presentation=rici&camera=svr.module.camera.rici.preview
```

Flow:

1. Start at RICI/Reiki storefront.
2. Show storefront, glass wall, red carpet, and hologram carousel.
3. Show founder/profile slide slot.
4. Show hologram video slide.
5. Show private meditation room portal.
6. Transition to the private meditation room.
7. Show meditation demo with soft water audio.
8. Return to lobby.

---

## 10. RICI Preview Camera

Permanent ID:

```text
svr.module.camera.rici.preview
```

Sequence:

```json
{
  "module_id": "svr.module.camera.rici.preview",
  "locked": true,
  "camera_name": "RICI Preview Camera",
  "sequence": [
    "wide storefront establishing shot",
    "slow pan across glass wall",
    "focus on manual hologram carousel",
    "show video hologram slide",
    "show teleport portal",
    "transition to private meditation room",
    "meditation room slow pan"
  ],
  "output": {
    "live_preview": true,
    "recordable": true,
    "site_embed_ready": true
  }
}
```

---

## 11. Reiki Meditation Room Sample

Create a simple professional sample only.

Required:

- Calm purple/dark environment.
- Moon/stars visible.
- Meditation platform.
- Low fog or soft mist.
- Water sound loop.
- Return-to-lobby portal.
- Instruction panel:

```text
Welcome to the Reiki VR Meditation Preview.
Breathe slowly. Relax your shoulders. Follow the sound of water.
```

Audio placeholders:

```text
game/assets/audio/reiki_water_loop.mp3
game/assets/audio/soft_bowls_loop.mp3
```

---

## 12. Presentation Page

Site-side phase only after game baseline is locked.

Path:

```text
site/presentations/rici.html
```

Content:

- Title: `SVR x Trueitive — Reiki VR Presentation Preview`
- Private preview / approval disclaimer.
- Embedded live preview or recorded walkthrough.
- Buttons:
  - Watch Preview
  - Open VR Demo
  - Download Presentation Packet
  - Contact SVR

---

## 13. Execution Order

1. Baseline recovery.
2. Remove conflicting modules.
3. Create AWS/local module lock files.
4. Add module lock loader.
5. Lock Moon/Mars.
6. Lock Android controls.
7. Lock Reiki storefront/glass/carousel.
8. Create simple meditation sample.
9. Add RICI preview camera.
10. Add presentation page.
11. Deploy and verify.

---

## 14. QA Checklist

- [ ] Build label shows current version.
- [ ] Moon visible from lobby.
- [ ] Mars visible from lobby.
- [ ] Only one Moon visible.
- [ ] Only one Mars visible.
- [ ] Buildings do not block Moon/Mars.
- [ ] Android sticks visible on Android only.
- [ ] Android forward/back works.
- [ ] Quest fallback works.
- [ ] Hand teleport still works.
- [ ] Reiki storefront exists.
- [ ] Glass is attached to black wall.
- [ ] Red carpet clear.
- [ ] Private Reiki room not overwritten.
- [ ] AWS lock updated.
- [ ] Local config lock updated.
- [ ] `update/game.zip` rebuilt.
- [ ] Git commit pushed.
- [ ] Auto Deploy completed.
- [ ] Live URL tested with cache-bust.

---

## 15. Timeline

Realistic estimate after repo/AWS access is confirmed:

| Work item | Time |
|---|---:|
| AWS/local lock foundation | 1–2 hours |
| Baseline cleanup | 1–2 hours |
| Moon/Mars stable lock | 30–60 min |
| Android sticks lock | 1–2 hours |
| Reiki storefront lock | 1–3 hours |
| Meditation sample | 1–2 hours |
| RICI preview camera | 1–2 hours |
| Presentation page | 1–2 hours |

Total:

```text
1 focused day if repo is clean
2 days if old modules are still fighting
```

---

## 16. What Is Needed From User

Needed before AWS execution:

1. AWS service choice: DynamoDB or RDS/PostgreSQL.
2. AWS region.
3. Database/table name if already created.
4. Whether the game reads a static generated JSON or calls an API.
5. Approved assets:
   - founder photo
   - hologram video
   - banner
   - short bio
   - water sound file

Recommended safe setup:

```text
Use DynamoDB for module locks.
Do not let the public browser write directly to AWS.
Use an admin/deploy script to pull AWS locks into static JSON during deploy.
The game reads static JSON from /game/config/.
```

---

## 17. Final Instruction For Implementer

Do not create another patch that hardcodes Moon/Mars, Android controls, or Reiki placement before reading:

```text
game/config/current-baseline.json
game/config/celestial-lock.json
game/config/control-locks.json
game/config/reiki-presentation-lock.json
game/docs/RICI_FINAL_POLISH_MANIFEST.md
```

If those files do not exist, create them first.
