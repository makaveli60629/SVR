# Phase 84F — Espresso Boot Fix + Visible Ad Lock

Fixes the runtime boot blocker:

- `ReferenceError: espressoTex is not defined` in `world_skyline.js`.
- Preloads the Espresso ad texture at module scope so all skyline helper functions can use it.
- Keeps the Espresso With Cream ad on a front-visible skyline ad holder.
- Preserves website untouched.
- Preserves Reiki approval lock: SVR / AWAITING APPROVAL only.
- Preserves controller movement lock.
