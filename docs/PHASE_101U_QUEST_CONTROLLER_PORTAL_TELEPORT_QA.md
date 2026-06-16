# Phase 101U - Quest Controller Portal Selection + Teleport QA Pass

## Purpose

Add Quest/controller portal selection and teleport QA instrumentation after the finished lobby and portal layer.

## Patch applied

### New module

```text
game/phase101u_quest_controller_portal_teleport_qa.js
```

Adds:

- Quest/WebXR controller portal ray support.
- Controller select/squeeze portal activation.
- Portal ray beams attached to XR controllers.
- Raycast checks against Phase 101T portal hitboxes.
- Keyboard fallback shortcuts:

```text
P = PGA
W = Wellness
S = Store
C = Scorpion
```

- Portal selection payload:

```text
window.SVR_PHASE101U_LAST_CONTROLLER_PORTAL
```

- QA object:

```text
window.SVR_PHASE101U_QUEST_QA
```

- QA runner:

```text
window.SVR_RUN_PHASE101U_QA()
```

## Important boot note

The Phase 101U module is committed as a standalone late-load module. The direct boot-chain rewrite was blocked by the connector safety filter, so the module was not force-wired into `game/index.html` in this phase.

Use manual console import for immediate testing:

```js
import('./phase101u_quest_controller_portal_teleport_qa.js?v=phase101u-manual')
```

Or after opening the game route:

```js
await import('/game/phase101u_quest_controller_portal_teleport_qa.js?v=phase101u-manual')
```

## Validation route

Open:

```text
https://svrpoker.com/game/index.html?v=phase101t-lobby-interaction
```

Then run console import above.

## Expected console checks

```text
window.SVR_PHASE101U_QUEST_QA
window.SVR_RUN_PHASE101U_QA()
window.SVR_PHASE101U_LAST_CONTROLLER_PORTAL
```

## Manual Quest QA

- [ ] Open lobby on Quest Browser.
- [ ] Enter WebXR.
- [ ] Point controller at PGA portal.
- [ ] Press trigger/select.
- [ ] Confirm `window.SVR_PHASE101U_LAST_CONTROLLER_PORTAL.key === "pga"`.
- [ ] Repeat Wellness, Store, and Scorpion.
- [ ] Test teleport ray still points forward.
- [ ] Confirm no boot/loading regression.

## Locked rule

This phase adds a controller QA module only. It does not change admin API, Android movement, public site, or Unity logic.

## Commit name

```text
Phase 101U - Quest Controller Portal Selection and Teleport QA Module
```
