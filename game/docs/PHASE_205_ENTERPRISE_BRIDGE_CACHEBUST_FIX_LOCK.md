# Phase 205 — Enterprise Bridge Cache-Bust Fix Lock

## Purpose
Fixes runtime crash seen in live game:

```text
TypeError: this.recordDecisionAid is not a function
```

## Fix
- Creates `game/modules/enterprise_bridge_phase230.js`.
- Changes `main.js` to import the cache-busted bridge file instead of the previously cached bridge path.
- Installs recorder aliases before event listeners.
- Wraps event listeners so missing/future aliases queue safely instead of crashing the render loop.
- Preserves the public Matrix launch page untouched.

## Locked rules
- Dealer body remains disabled.
- Invisible dealer/card logic remains preserved.
- Public page remains untouched.
- Game package remains under 25 MB.
