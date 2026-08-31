# Phase 435 — Quest clean table + Eric manual scale lock

## Scope
Dealer Lab only. Public lobby/gameplay remains unchanged.

## Locked Quest observations
- Native `polotno` felt is the sole interior playing surface.
- Protective top-cover mesh is hidden.
- True outer handrest/rail remains visible with dark leather/carbon treatment.
- SVR center logo, white pass line, left REIKI sponsor slot, and right reserved sponsor slot use the XR-clear decal authority.
- Card landing is derived from the native felt surface with only a minimal anti-clipping lift.

## Eric authority
Owner headset-tuned dealer transform is authoritative:
- scale: `0.0047`
- x: `-0.10`
- z: `0.71`
- feet: grounded to floor Y `0`

The older 1.78 m auto-normalizer remains in the historical V2.3 runtime for compatibility, but `dealer-scale-authority-phase435.js` blocks it from overriding the approved Quest scale on load, grounding, or XR session start.

## Promotion rule
Do not promote Dealer Lab geometry or scale into the public poker table until Oculus visual approval.
