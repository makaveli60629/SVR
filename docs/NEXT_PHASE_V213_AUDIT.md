# SVR Game Next Phase v2.1.3 Audit

Size: 18.23 MB

Applied in this game-only package:
- Removed custom controller-held prop visuals so controller mode is hand-free.
- Replaced bundled slate floor maps with the uploaded Poliigon slate set.
- Increased floor tiling density so the tiles appear smaller.
- Kept stone-brick wall treatment.
- Darkened ambient scene lighting slightly while increasing Earth/Moon glow and nearby halo sprites.
- Upgraded the spawn billboard to binary purple rain plus launch phrases, with logo overlay preserved.
- Flipped Eric to face the opposite direction.
- Reworked watch placement toward a longer forearm bracelet with the UI rotated toward the viewer.
- Switched Claudia to prefer the walking FBX as the visible model and added an upright-orientation heuristic.

Known runtime-sensitive items:
- Claudia FBX orientation can still vary depending on the actual skeleton axis metadata in the runtime loader.
- Watch placement may still need one more headset pass because wrist basis varies between controller and hand-tracking poses.
