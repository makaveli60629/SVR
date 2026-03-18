SVR next phase v2.3.1

Included changes:
- restored native XR hand models and removed duplicate forearm hand mount
- wrist watch re-anchored to Meta hand wrist with outward-facing UI
- reduced renderer load and depth range for headset stability
- reduced city/star counts and slowed matrix updates to cut flicker
- moon moved higher/back behind skyline with slower orbit
- earth kept high orbit, reduced emissive washout
- removed neon table ring
- dealer side moved to far side of table from spawn and Claudia scaled up/repositioned
- added store.fbx to north-east wall facing table and aligned to wall
- kept lower-case packaged filenames for GitHub safety

Known limits:
- Meta hand skin texture remap from arms.fbx was not applied; native XR hand meshes remain standard hand meshes.
- card rig named cards.fbx was not found in accessible uploads, so Claudia still uses dealer pose loop plus procedural dealing cards.
- store active code-entry UI was not wired in this pass.
