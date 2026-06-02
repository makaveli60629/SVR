# Phase 99 — Reiki Hub Logo Lock

## Purpose

This phase locks the uploaded lotus/circuit **REIKI HUB** visual direction as the official Reiki/Riki Hub logo inside the game runtime.

## Brand distinction

- **Reiki Hub / Riki Hub** is the wellness hub and uses the lotus/circuit logo style.
- **Truitive / Trueitive** is treated as the founder, partner, or mother-company relationship with SVR.
- Truitive/Trueitive is **not** the Reiki Hub logo.

## Game implementation

Added:

```text
game/modules/reiki_hub_logo_lock.js
```

Updated:

```text
game/main.js
```

The runtime now installs a procedural lotus/circuit REIKI HUB logo overlay in the lobby Reiki storefront area:

- main storefront header overlay
- left/right badge plates
- Reiki portal/floor badge
- center interior brand plate
- runtime status marker: `window.SVR_REIKI_HUB_LOGO_LOCK`

## Protected areas

- Website/site was not touched.
- Game lobby was not replaced.
- Existing Reiki routing was preserved.
- This is a targeted logo/brand-lock module only.

## Notes

The uploaded image is the visual reference. The runtime module recreates that direction procedurally for web deployment safety and performance, while preserving the distinction between hub identity and founder/partner identity.
