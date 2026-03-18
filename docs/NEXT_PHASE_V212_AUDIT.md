SVR next phase v2.1.2 game-only audit

Summary
- Based on prior v2.1.1 package.
- Kept site untouched.
- Final zip size: ~18 MB.

Patches in this drop
- Watch reworked to a readable forearm-facing bracelet console.
- Watch anchor now projects toward the viewer instead of relying on palm/back-of-hand normal only.
- Quick Sit / Leave Table controls remain on the watch.
- Purple matrix rain billboard added behind the table at spawn.
- Spawn billboard includes centered SVR logo plane when logo texture is available.
- Earth and moon moved higher and given sprite halos plus stronger glow.
- General scene darkened slightly while keeping earth/moon bright.
- Removed moving skyline rotation to stop the city from drifting.
- Removed the face tint overlay by disabling the atmospheric inner shell/haze visuals.
- Eric rotated to face the opposite direction from the prior package.
- Claudia moved closer to the visible play area and given a stronger axis correction.
- Claudia path tightened to stay in view.
- Floor textures continue to use the slate texture set bundled in assets/texture.
- Wall textures continue to use the stone brick texture set bundled in assets/texture.

Known limits
- Claudia walking remains the highest-risk runtime item because FBX orientation and clip retargeting cannot be headset-tested here.
- Music uses the bundled ambient tracks already present in the package; no new user-provided music files were available in this environment.
