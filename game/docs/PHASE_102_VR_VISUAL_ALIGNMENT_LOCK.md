# Phase 102 — VR Visual Alignment Lock

## Reason for phase

The Phase 101 runtime loaded correctly, but headset testing showed several visible alignment and interaction problems:

- Moon was partially hidden behind skyline geometry and was not visible enough on Quest.
- Mars needed the same Quest-safe visibility treatment.
- Espresso with Cream wall ad needed to be larger and directly aligned behind the Reiki hub on a tall building face.
- Scorpion room table had to resolve to one clean display table without duplicate fallback/asset overlap.
- PGA hub front display was clipping: info text and Juan Espejo portrait were not fully visible.
- Watch needed an obvious physical HOLO button plus a visible hologram panel.
- Fist teleport needed clear glow feedback and close-fist hold / release-to-teleport behavior.

## Locked fixes

- Build label: `PHASE-102-VR-VISUAL-ALIGNMENT-LOCK`
- Moon and Mars are moved higher/closer and render with depth-test disabled so Quest can see them over the skyline.
- Espresso with Cream ad is rebuilt as a taller/larger wall ad behind Reiki, with its own tower, frame, and warm light.
- Scorpion room table mount now uses one display table; fallback hides after the real asset loads so duplicate tables do not overlap.
- PGA hub info panel, portrait, badge, and reserve plaque are resized and realigned for full front visibility.
- Watch now has a raised physical HOLO button and a hologram router panel above the wrist.
- Fist teleport now arms by closing a fist near the face, glows cyan while aimed, and teleports on fist release.

## Preserved locks

- Site/website was not touched.
- Phase 99 Scorpion private-room table direction remains preserved.
- Lobby remains storefront/portal focused.
- Quest/Oculus controller fallback remains preserved.
- Hand tracking remains primary.
- Future sponsor/brand modules remain modular and removable.
