# Phase 409 — Public Status + Player Turn + Mobile Fit Lock

## User-reported defects addressed

1. Public launch page did not place **SITE UNDER CONSTRUCTION** immediately above **Public Launch Page**.
2. Public status row needed green **SERVER ONLINE**, **DATABASE ONLINE**, and **AI ONLINE** indicators while the separate admin indicator remains offline unless manually changed.
3. Android regular play could visibly move from **Darius** to **Nova** while the human still had a pending decision.
4. Opponent player boxes were too large and could overlap on smaller phone layouts.

## Public page

- Root launch structure is preserved.
- Phase 409 status script positions the construction pill directly before the existing `Public Launch Page` eyebrow.
- Server / Database / AI status pills appear directly after that eyebrow and are green.
- Admin status remains its independent `Admin Online / Admin Offline` control and defaults to Offline.
- The three green service pills are presentation/configuration indicators requested for this test UI; they are **not represented internally as a verified remote backend health probe** (`remoteHealthVerified: false`).
- Green Phase 409 badge remains visible for build identification.

## Android / iPhone player-turn protection

- Protected Phase 403 engine is unchanged.
- New runtime guard watches the protected state/action trail.
- If the last action was Darius on the current street and the human still needs an initial action or owes chips, any attempted bot handoff is corrected to seat 0 before that bot can make a decision.
- If the human already acted and matched the bet, the guard does nothing.
- If the game legitimately advanced to a new street, it does nothing.
- Folded/all-in/empty-stack users remain skipped correctly.
- Existing left-to-right visual order remains `[YOU, Nova, Claudia, Eric, Maya, Darius]`, closing back from Darius to YOU.

## Mobile fit

- Opponent boxes reduced from the older `clamp(122px,29vw,190px)` footprint to a Phase 409 maximum of 150px, with tighter phone and landscape overrides.
- Faces, hidden cards, text, turn badge and padding scale down together.
- User cards, board cards, pot, burn pile and action controls are not shrunk by this change.

## Protected systems

- Phase 403 poker/pot authority unchanged.
- Phase 408 Hold'em street/call truth unchanged.
- Quest Phase 396 files unchanged.
- APK remains `0.1.0-rc2`, version code `2`, manual-only, no forced prompt/rebuild.
- No claim of production multiplayer or peer voice is introduced.

## Test routes

- Android: `/game/android.html?channel=stable&v=phase409`
- Android regular: `/game/android-tabletop.html?v=phase409&mode=regular`
- iPhone/iPad: `/game/iphone.html?v=phase409`
- Public: `/?v=phase409`
