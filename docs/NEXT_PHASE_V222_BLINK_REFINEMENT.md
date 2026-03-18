# SVR Game Phase v2.2.2 Blink Refinement

This pass focused on the persistent shimmer / blinking reported after v2.2.1.

## Changes actually made
- disabled the main directional shadow caster to remove moving shadow-line shimmer across the floor
- disabled shadow receiving on the main floor and inner platform
- reduced floor texture frequency from 180x to 110x to lower alias shimmer
- removed the floor normal-map contribution to avoid specular/normal flicker in-headset
- widened the thin-cap filter on the table to hide more coplanar top-cover pieces
- reduced felt-glow opacity and lifted it slightly above the table to reduce z-fighting
- added a soft fake table shadow so the table still feels grounded without dynamic shadow shimmer
- disabled model cast/receive shadows in the generic table/model shadow helper to target remaining flicker sources

## Validation
- JS syntax checked successfully for `modules/world_skyline.js`
- package rebuilt from the current v2.2.1 workspace with the above modifications
