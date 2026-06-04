# Phase 88 — Oculus Lobby + Reiki Presentation Lock

Game-side-only emergency polish pass based on in-headset Oculus review.

## Fixed
- Quest/Oculus performance pass: antialias disabled, XR framebuffer scale reduced, tone exposure reduced, shadows remain disabled.
- Lobby brightness pass: reduced spawn-side additive sprites, snow/dust particles, star opacity, and excessive point-light intensity.
- Moon/Mars correction: removed the strong fake halo look, kept the larger real textured Moon as the primary moon, moved Moon and Mars higher/back, preserved slow rotation/orbit motion.
- Reiki/Truitive presentation pass: restored Truitive/Reiki presentation wording with red AWAITING APPROVAL language; removed front black blocker wall from the Reiki entry path; kept founder/media area staged as approval-safe placeholder.
- Espresso With Cream tier-one ad: added a large north/Reiki-facing tier-one ad billboard for ESPRESSO WITH CREAM. The exact uploaded photo asset was found in File Library but is not physically embedded in the active game zip, so this build uses a procedural cup-photo-style fallback ad until that PNG is supplied directly in the working game assets.
- PGA hub face/profile cleanup: squared the profile image panel so Juan Espejo's face does not crop vertically and reduced PGA lighting intensity.
- Bottom desktop label cleanup: renamed Zen Den to Reiki Room and removed the extra Table button.

## Protected
- Website/site untouched.
- Main lobby preserved.
- Watch/control systems preserved.
- Game package remains under 25 MB.

## Next test checklist
1. Enter Quest/Oculus VR and confirm frame rate is smoother and black frame edges are reduced.
2. Face spawn/Reiki side and confirm brightness is darker/less dusty.
3. Look north/up: only the main textured Moon should read as the Moon; Mars should sit higher.
4. Confirm Reiki front no longer has a black blocker wall in the path.
5. Confirm Truitive/Reiki presentation has AWAITING APPROVAL visible.
6. Confirm PGA profile image no longer cuts off the face.
