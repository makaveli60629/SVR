# SVR Poker — Version 1.4.1 Manifest

## Version
`VERSION-1.4.1-MOON-MARS-QUEST-LOCOMOTION-LOCK`

## Baseline
The active baseline is the current 1.4G / Emergency Realignment Reiki Front Layout state.

## Hard Lock
The lobby and Reiki storefront are locked. Do not edit the Reiki Hub, Reiki store/front, Reiki mother module, hologram/video carousel, private Reiki route, red carpet, ropes, plants, panels, or any lobby/storefront placement unless the user explicitly says:

`unlock the Reiki Hub`

## Scope of 1.4.1
Only these areas are changed:

1. Moon/Mars sky placement, scale, glow, rotation, and orbit.
2. Quest controller locomotion and teleport alignment.

## Moon / Mars
- Moon moved much higher into the sky.
- Moon scaled larger.
- Moon diffuse and bump textures remain active.
- Moon rotates slowly.
- Mars moved higher and scaled larger.
- Mars diffuse and bump textures remain active.
- Mars rotates and orbits the Moon.
- Placeholder duplicate moon/Mars systems are not added.

## Quest Locomotion
- Right stick up/down = headset-forward/back movement.
- Right stick left/right = 45-degree snap turn.
- Forward remains forward after a 45-degree turn.
- Movement uses the current headset-facing direction, flattened to the floor plane.

## Quest Teleport
- Grip/A arms the teleport module.
- Trigger hold/release performs the leap after aim is stable.
- Teleport ray is forced to resolve in front of the player and is guarded against backward Quest target-ray bugs.
- Raycast marker and arc remain visible.

## Music
Lobby music remains disabled. No autoplay on page load or XR entry.

## Site
Website/site files are untouched.

## Deploy Rule
Keep `/game` and `/update/game.zip` synchronized for every future release.
