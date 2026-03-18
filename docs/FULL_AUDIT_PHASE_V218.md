# SVR Game Audit Phase v2.1.8

## What was changed
- Restored native WebXR hand models using `XRHandModelFactory` and removed custom hand-held geometry.
- Reworked watch alignment so the bracelet shell runs along the forearm axis instead of across it.
- Recentered all four sponsor matrix walls so each panel fills the wall from near-floor to near-ceiling.
- Brightened and repositioned Earth and Moon; Earth now circles the room sky and Moon circles Earth.
- Flattened the center staging platform to remove the raised bump under the table.
- Enlarged the real table, hid thin blinking cap meshes, and moved the dealer side to the spawn-facing edge.
- Repositioned Claudia to the dealer side and added a runtime attempt to use `walking.fbx`; fallback upper-body motion remains active.
- Tightened floor and wall texture tiling and increased skyline façade realism with glass, strips, and poles.

## Limits
- `card.fbx` and the bedding/store kiosk asset were not present in the accessible uploads in this environment, so this package still uses procedural demo cards and does not add the missing kiosk.
- This package was syntax-checked with `node --check`, but not live-tested in a Quest headset here.
