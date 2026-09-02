# Phase 443 — Avatar, Dealer, and Table Polish

- Eric is dealer-only and is absent from the Avatar Lab and avatar catalog.
- The Avatar Lab uses an independent 19-joint player hierarchy with curved anatomical meshes, fitted clothing, accessories, and five live motion states.
- Dealer Lab no longer loads the competing Phase 435 scale lock. Its controls own Eric's transform, grounding is explicit, and the camera can refocus him.
- The held deal card releases from Eric's right-hand world position and animates to the felt.
- The authoritative pass line is inset 0.09525 m (3.75 inches) from the felt boundary.
- The center SVR logo uses the supplied root logo texture at a higher render order to prevent surface occlusion.
- `phase443-avatar-dealer-table-audit.mjs` guards separation, articulation, non-placeholder geometry, dealing, measured clearance, branding, and production cache routing.
