# SVR Poker — Game Update 2.0 Master Manifest

**Build label:** `PHASE-89-GAME-UPDATE-2-0-MANIFEST-LOCK`  
**Track:** Game-side only  
**Baseline:** Phase 88 locomotion active lock  
**Date:** 2026-05-27

---

## 1. Purpose

Game Update 2.0 is the forward production plan for the SVR Poker game build after the Phase 88 locomotion lock.

The goal is to move from repeated recovery/fix cycles into a clean, modular, testable game build while preserving the original lobby.

---

## 2. Hard Locks

These rules are mandatory for every Game Update 2.0 phase.

### Original lobby lock

- Keep the original SVR lobby as the only lobby shell.
- Do not add a second lobby.
- Do not add extra duplicate walls, boxed rooms, or full private-room builds inside the lobby.
- Lobby edits must be minor, targeted, and reversible.

### Site lock

- Do not touch the website/public site in this game track.
- Do not edit root `index.html`, `/site`, website CSS, Matrix page, store pages, or site backend files.
- The store portal may point to the website store URL, but the site itself stays untouched.

### Private scene lock

The lobby is a portal hub only. Full experiences must stay in separate private routes.

Lobby may contain:

- Main poker table
- Reiki storefront/portal marker
- PGA storefront/portal marker
- Smoker Lounge portal marker
- Scorpion portal marker
- VR Store kiosk/portal marker
- Sponsor placeholders

Lobby must not contain:

- Full Reiki meditation room
- Full PGA range
- Full chip/putt room
- Full smoker lounge
- Full Scorpion room
- Full store showroom

### Package lock

- Keep `game.zip` under 25 MB.
- Update both `/game` and `/update/game.zip` when deploying.
- Keep permissions deploy-safe.
- Avoid heavy FBX additions unless optimized and explicitly approved.

---

## 3. Current Confirmed Baseline

Phase 88 confirmed:

- Original lobby only.
- Second lobby removed.
- Locomotion active through `game/modules/teleport.js`.
- `game/main.js` imports and activates teleport/locomotion.
- Watch and teleport preserved.
- Right-stick forward/back and 45-degree snap-turn are locked.
- Poker table, seat, portals, Moon/Mars, and skyline preserved.
- Site untouched.

---

## 4. Game Update 2.0 Module Order

### 2.0.0 — Manifest / state lock

Status: **This package**

Deliverables:

- Game Update 2.0 master manifest
- execution checklist
- module registry
- build version marker
- no visual redesign
- no second lobby

### 2.0.1 — Original lobby cleanup pass

Goal: clean minor lobby issues without changing the lobby identity.

Tasks:

- Confirm no duplicate wall shells are active.
- Keep portal markers thin and readable.
- Keep pathways clear.
- Keep store portal close to store wall and out of walkway.
- Confirm Moon/Mars remain high and visible.
- Confirm no autoplay music.

### 2.0.2 — Playable poker first lock

Goal: make the poker table playable before adding more scenery.

Tasks:

- Player actions: fold, check, call, raise, all-in, next hand.
- Bot decisions: fold/check/call/raise.
- Correct hand evaluation.
- Pot accounting and winner payout.
- Visible active-turn indicator.
- Bigger readable card ranks and suits.
- Keep left-to-right dealing locked.
- Keep 5 bots + 1 open south/front player seat.
- Dealer body remains disabled/invisible.

### 2.0.3 — Watch + VR interaction lock

Goal: make the watch and VR controls reliable.

Tasks:

- Watch visible and facing the player.
- Trigger/select fallback for watch buttons.
- Meta hand tracking supported.
- Quest controller fallback supported.
- Controller meshes hidden or represented as natural hands.
- Teleport must be hold/aim/release only.
- No instant accidental teleport.

### 2.0.4 — Locomotion QA lock

Goal: make Quest movement predictable.

Tasks:

- Right stick up/down = forward/back.
- Right stick left/right = 45-degree snap turn.
- Left stick remains fallback.
- Teleport arc/marker visible.
- Seat jump stable.
- Private scene jumps face the correct direction.

### 2.0.5 — Private scene routing lock

Goal: make every lobby portal route to the correct private destination.

Required routes:

- Reiki portal -> `game/reiki.html`
- PGA Drive -> `game/pga-drive.html`
- PGA Chip/Putt -> `game/chip-putt.html`
- VR Store -> `game/store-room.html` or website portal surface
- Smoker Lounge -> `game/smoker-lounge.html`
- Scorpion Room -> `game/scorpion.html`

### 2.0.6 — Store portal / embedded web portal pass

Goal: keep store access simple and modular.

Rules:

- Store URL: `https://svrpoker.com/site/store.html`
- Store portal must not block the walkway.
- Store portal must be configurable in one place.
- Do not alter website files from this game track.

### 2.0.7 — Performance and Quest smoothness pass

Goal: prepare for stable headset testing.

Tasks:

- Cap unnecessary glow/emissive effects.
- Remove unused duplicate objects.
- Lazy-load or route private-room content.
- Reduce console noise.
- Avoid heavy asset imports.
- Validate zip size under 25 MB.

### 2.0.8 — Release candidate package

Goal: produce a testable Game Update 2.0 candidate.

Deliverables:

- `game.zip`
- PowerShell upload script
- checksum file
- phase manifest
- QA checklist
- known issues
- rollback instruction

---

## 5. Approved Control Rules

### Quest/Oculus controller

- Right stick up/down = forward/back movement.
- Right stick left/right = 45-degree snap turn.
- Hold A / grip / trigger = aim teleport.
- Release = teleport.
- Trigger/select = watch button fallback.

### Hand tracking

- Pinch/fist hold = aim teleport.
- Release = teleport.
- No accidental instant teleport.

### Desktop fallback

- Keyboard/mouse desktop controls stay available for testing.
- Desktop UI may be used for debugging, but VR remains the main target.

---

## 6. Poker Locks

- Left-to-right dealing is permanent.
- Dealer body remains disabled/invisible.
- Invisible deal/card logic remains active.
- One open south/front seat is preserved for the user.
- Five seated bots remain around the table.
- Card ranks/suits should be readable from a seated VR view.
- Pot/chip movement should be visible.
- Pass/bet line and SVR table logo stay preserved.

---

## 7. Branding / Approval Locks

- No Trueitive, Truitive, trueitive.com, founder names, founder photos, or unapproved sponsor media in game runtime.
- Reiki remains SVR-branded or `AWAITING APPROVAL` only.
- Sponsor modules must remain removable.
- Ads and storefronts must be modular.

---

## 8. File Targets

Primary game files:

- `game/index.html`
- `game/main.js`
- `game/modules/world_skyline.js`
- `game/modules/teleport.js`
- `game/modules/watch.js`
- `game/modules/poker_demo.js`
- `game/modules/store_kiosk.js`
- `game/modules/private_scene_common.js`

Private scenes:

- `game/reiki.html`
- `game/pga-drive.html`
- `game/chip-putt.html`
- `game/store-room.html`
- `game/smoker-lounge.html`
- `game/scorpion.html`

Docs:

- `game/docs/BUILD_VERSION.json`
- `game/docs/GAME_UPDATE_2_0_MASTER_MANIFEST.md`
- `game/docs/GAME_UPDATE_2_0_EXECUTION_CHECKLIST.md`
- `game/docs/GAME_UPDATE_2_0_MODULE_REGISTRY.json`

Deploy:

- `update/game.zip`
- `update/version.json`

---

## 9. Do Not Do

- Do not rebuild the site.
- Do not use another framework.
- Do not add a second lobby.
- Do not add full private rooms inside the lobby.
- Do not re-enable autoplay music.
- Do not reintroduce unapproved Reiki sponsor/founder branding.
- Do not remove the working locomotion/watch/poker baseline while adding polish.

---

## 10. Next Recommended Build

`Phase 90 — Game Update 2.0 Poker Playability Lock`

Scope:

- Poker logic and UI only.
- No lobby redesign.
- No website changes.
- No new hubs.
- No private-room expansion.
