# SVR Lobby Organization 1.3 — Final Audit Manifest

## Build name

**LOBBY-ORG-1-3J-FINAL-AUDIT-MANIFEST**

## Purpose

This manifest locks the current 1.3 lobby organization pass and records what was changed, what must be tested, and what remains on the punch list before the next major update.

---

## Completed phase chain

### 1. Reiki storefront / RICI module

- Built the Reiki/RICI mother-module storefront concept.
- Added glass-front luxury layout.
- Added red-carpet entrance cleanup.
- Removed walkway-blocking plant objects where detected.
- Removed bad welcome/threshold floor clutter where detected.
- Added green interaction circle.
- Added Android/desktop/Quest gated controls for the carousel.
- Added first-page welcome/about card.
- Added second-page video card.
- Kept **AWAITING APPROVAL** visible and emphasized.
- Added approval-safe symbol placeholder wall.
- Added voiceover placeholder slots.
- Kept checkout/database/email forwarding disabled for Reiki.

### 2. Reiki video / carousel behavior

- Page 1 is now welcome/about/swipe instruction.
- Page 2 is video/interview.
- Video is forced silent/paused/reset when not on the video page.
- Action on video page attempts to enable voice/audio.
- Android slide/action buttons appear only inside the Reiki interaction zone.
- Desktop keyboard carousel parity added.
- Quest pointer targeting added for carousel buttons.

### 3. SVR Storefront

- Replaced scattered store panels with one clean carousel panel.
- Added premium storefront façade.
- Added SVR Daily Giveaway kiosk.
- Added twirling hologram-style SVR logo.
- Added store interaction ring.
- Added carousel API:
  - `window.SVR_STORE_CAROUSEL_12.next()`
  - `window.SVR_STORE_CAROUSEL_12.prev()`
  - `window.SVR_STORE_CAROUSEL_12.activate()`
- Checkout/database remain off.

### 4. Espresso / Daily Cash store

- Rebuilt Espresso With Cream storefront.
- Added Daily Cash panel.
- Added 5,000 chip bonus placeholder.
- Added coffee/menu preview panel.
- Added sponsor-tier sample language.
- Kept checkout/database off.

### 5. Portal plaza / route audit

- Added lobby directory board.
- Added portal cards.
- Added route cleanup module.
- Added route aliases.
- Patched portal card activation handlers where possible.
- Added route audit badge.
- Route audit now loads directly through `main.js` before later sponsor modules.

### 6. Skyline / moon / Mars

- Added 12 ad-capable skyline buildings.
- Added 4 Tier 1, 4 Tier 2, and 4 Tier 3 ad buildings.
- Added building numbers and tier labels.
- Hid older Phase 101 moon/Mars fallback by route audit module.
- Kept Phase 121 high-sky moon/Mars as the active intended sky pair.

### 7. Android / desktop / Quest controls

- Android movement stick inversion fixed earlier.
- Android controls now gate slide/action buttons by interaction zone.
- Android routes slide/action to either Reiki or SVR Store depending on zone.
- Desktop keyboard controls added:
  - `[` or `,` = previous
  - `]` or `.` = next
  - `Enter` or `Space` = action
- Quest controller pointer targeting improved.
- Hover label added for controller pointer targets.

### 8. Performance stability

- Added Quest/mobile render pressure reduction.
- Added XR framebuffer scaling.
- Added foveation where supported.
- Disabled shadows in performance pass.
- Reduced transparent-material flicker risk.
- Reduced sprite/firefly/dust brightness.
- Added dynamic particle culling when FPS drops hard.
- Added frame guard status object:
  - `window.SVR_PERFORMANCE_STABILITY_13I`

---

## Current key files changed or added

```text
game/main.js
game/index.html
game/modules/android_controls.js
game/modules/controller_pointer_bridge_1_2.js
game/modules/reiki_luxury_cleanup_1_2.js
game/modules/reiki_interaction_gate_1_2.js
game/modules/reiki_symbols_placeholder_1_2.js
game/modules/svr_storefront_module_1_2.js
game/modules/espresso_daily_cash_store_1_2.js
game/modules/portal_route_audit_cleanup_1_3.js
game/modules/performance_stability_1_3.js
game/modules/portal_plaza_directory_1_2.js
game/modules/obj_skyline_loader.js
game/modules/phase121_sky_fix.js
```

---

## Runtime debug objects

Use the browser console to verify:

```js
window.SVR_REIKI_LUXURY_CLEANUP_12
window.SVR_REIKI_INTERACTION_GATE_12
window.SVR_REIKI_SYMBOLS_PLACEHOLDER_12
window.SVR_STORE_CAROUSEL_12
window.SVR_STOREFRONT_MODULE_12
window.SVR_ESPRESSO_DAILY_CASH_STORE_12
window.SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13
window.SVR_CONTROLLER_POINTER_BRIDGE
window.SVR_PERFORMANCE_STABILITY_13I
window.SVR_PHASE121_SKY_FIX
```

---

## Required test URL

```text
https://svrpoker.com/game/?v=lobby-org-final-audit-13j
```

---

## Quest test checklist

1. Lobby boots without exposing build stack wording.
2. Loading screen does not say WebXR/WebEx.
3. Frame rate is smoother than before.
4. No major blinking/flicker from panels.
5. Only one moon and one Mars remain visible.
6. Moon and Mars are high enough to be visible above buildings.
7. Controller pointer ray is visible.
8. Controller ray can trigger Reiki carousel buttons.
9. Controller ray can trigger SVR Store carousel buttons.
10. Portal cards show hover/activation behavior where applicable.
11. Watch still appears and remains usable.
12. Fist teleport and controller movement should be retested after performance pass.

---

## Android test checklist

1. Spawn shows no slide/action buttons.
2. Movement forward/back is not inverted.
3. Enter Reiki circle: slide/action buttons appear.
4. Leave Reiki circle: slide/action buttons hide.
5. Enter SVR Store circle: slide/action buttons appear and route to SVR Store.
6. Store carousel changes pages.
7. Daily Giveaway action sets the placeholder action state.
8. Menu button opens/collapses destination menu.
9. UI buttons do not overlap main movement pads.

---

## Desktop test checklist

1. Destination menu is collapsed by default.
2. Destination menu opens with **Destinations** button.
3. Standing in Reiki ring: `]` or `.` advances Reiki carousel.
4. Standing in SVR Store ring: `]` or `.` advances store carousel.
5. `Enter` or `Space` triggers active carousel action.
6. Outside rings, carousel keyboard controls do nothing.
7. Number-key quick routes still work.

---

## Remaining punch list

### High priority

1. Verify the Quest pointer ray angle matches the real controller aim.
2. Confirm video audio unlocks on the second Reiki card after ACTION.
3. Confirm no duplicate moon/Mars remains after all modules finish loading.
4. Confirm performance module does not over-blur Quest visuals.
5. Confirm SVR Store is positioned where the old wall sign was expected.
6. Confirm Espresso Daily Cash storefront does not duplicate old espresso geometry.
7. Confirm route buttons do not navigate to missing HTML files.

### Medium priority

1. Replace Reiki symbol placeholders with approved art and wording.
2. Add real Reiki voiceover/audio clips when approved.
3. Add real Daily Giveaway profile hook later.
4. Add admin gating for hub owners later.
5. Add proper sponsor-packet loader later.
6. Add polished forest/private session scene as separate route.
7. Add PGA/Golf storefront upgrade using the same mother-module system.

### Low priority / polish

1. Add subtle ambient audio zones.
2. Add kiosk idle animation for all storefront modules.
3. Add friendly tutorial prompts for first-time users.
4. Add module diagnostics panel visible only in dev mode.
5. Add legal/approval overlay toggle for partner modules.

---

## Approval / legal lock

Reiki/RICI content remains **presentation preview only**.

No database write, payment, checkout, email forwarding, or live commercial claim should be enabled until formal partner approval is received.

---

## Recommended next update

**Update 1.4 — Storefront Expansion + Route Hardening**

Suggested focus:

1. PGA/Golf storefront built from the SVR/Reiki carousel module pattern.
2. Scorpion room portal audit and real scene preview.
3. Forest/private Reiki scene route hardening.
4. Final moon/Mars scene-global sky lock.
5. Quest locomotion retest and comfort tuning.
