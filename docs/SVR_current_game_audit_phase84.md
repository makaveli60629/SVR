# SVR Poker Current Game Audit

## What is actually broken

1. Quest and desktop are running different content paths.
   - Quest uses `questSafeMode` / `questUltraLite` branches.
   - Desktop loads heavier actors and different table/dealer paths.
   - Result: PC and Quest do not match.

2. The current build does not contain your final real table asset.
   - `assets/models/table.obj` is a small simplified custom table.
   - `assets/models/poker_table.obj` is only a tiny placeholder.
   - Result: felt alignment and table shape keep failing because the build is not using your final table.

3. Quest Eric parity is intentionally reduced.
   - Desktop tries to load full `eric.fbx`.
   - Quest uses a lightweight fallback instead.
   - Result: Eric appears on PC but not the same way in Quest.

4. Browser WebXR cannot guarantee native Meta system hands.
   - The app can request browser hand-tracking data.
   - It cannot force Meta's system-styled hands from a webpage.
   - Result: if Quest browser hand tracking is not exposed the way the build expects, you get no hands.

5. Overlay handling is duplicated and brittle.
   - The build currently has multiple hide/remove/purge methods for VR HUD.
   - Result: Quest overlay behavior is inconsistent and keeps coming back.

6. The current codebase is carrying too many fallback systems at once.
   - Different table paths.
   - Different dealer paths.
   - Different hand paths.
   - Different Quest emergency/ultralite/safe modes.
   - Result: each new patch can fix one thing and break another.

## What should be locked next

1. Freeze one Quest-safe core.
2. Strip Quest HUD from HTML entirely instead of hiding it with JS.
3. Use one table path only: your exact final table asset.
4. Use one dealer path only: lightweight but identical on Quest and PC.
5. Restore movement before touching hands again.
6. Do hands last, with honest browser hand-tracking expectations.

## Immediate next build rules

- No new art packs.
- No new overlays.
- No duplicate table formats.
- No desktop-vs-Quest scene divergence.
- Real table asset only.
- Movement first.
- Hands after movement.
