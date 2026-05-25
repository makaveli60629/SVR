# PHASE-218-AUTO-APPLY-STATUS-LOCK

## Purpose
Install a first-run bridge proxy before event/firewall/poker modules so missing `record*` methods cannot crash the runtime.

## Locked behavior
- Public Matrix launch page untouched.
- Dealer body remains disabled; invisible deal/card logic preserved.
- Direct `/game` folder deploy compatible.
- `window.SVR_ENTERPRISE_BRIDGE` and `window.SVREnterpriseBridge` always expose safe recorder functions.
- Adds `window.SVR_BRIDGE_PROXY` with a report surface.

## Added files
- `game/modules/bridge_proxy.js`
- `game/modules/enterprise_bridge_phase218.js`
- `game/docs/MODULE_REGISTRY_PHASE207.json`
