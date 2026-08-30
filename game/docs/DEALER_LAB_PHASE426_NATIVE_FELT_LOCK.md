# Phase 426 — Dealer Lab Native Felt + Tabletop Lock

Build target: `DEALER-LAB-V2.3-NATIVE-FELT-TABLETOP-LOCK`

## Scope
Dealer Lab only. Public landing page and production lobby remain untouched.

## User-approved working preset

```json
{
  "dealer": {
    "scale": 0.007,
    "y": 0,
    "z": 0.82,
    "x": 0.08,
    "shoulderX": 0.55,
    "shoulderZ": -0.48,
    "elbowX": 0.36,
    "wristZ": -0.45,
    "speed": 1.35
  },
  "table": {
    "tableY": 0.62,
    "feltDrop": 0.014,
    "innerMargin": 0.125,
    "collisionDrop": 0.02,
    "cardLift": 0.008
  }
}
```

## Table corrections

- Recognize the source GLB's `polotno` mesh as the real/native felt.
- Apply the polished green felt material directly to that native mesh.
- Do not stack a second generated felt plane over the GLB during normal operation.
- Suppress `Object001` / material `14 - Default`, identified as the broad upper cover slab visible above the actual hand-rest structure.
- Preserve and neutralize the actual hand-rest/rail material rather than covering it with lab-created geometry.
- Keep diagnostic guides off by default.
- Keep a generated felt only as a defensive fallback if a future table asset lacks a native felt mesh.
- Keep collision and card-landing calibration independent from the visible native felt.

## Acceptance

1. No broad purple tabletop cover is visible in normal lab view.
2. Green felt follows the real table geometry instead of floating as a separate oval.
3. Existing hand-rest/rail geometry remains visible.
4. Guides appear only when intentionally enabled.
5. The table preset remains lab-only until visual approval.
