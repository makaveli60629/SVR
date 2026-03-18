# full audit cleanup v230

## focus
- reduce room scale by one step
- speed up desktop walking
- move earth and moon out of the middle and into a higher orbit around the city
- align the northwest legend wall with the room wall
- add a northeast store wall aligned to the room wall
- preserve the lower-case package naming for github safety

## code audit
- checked `modules/config.js`
- checked `modules/core_scene.js`
- checked `modules/world_skyline.js`
- validated JS syntax after patching

## notable changes
- `room_radius` reduced from `40` to `34`
- desktop speed increased from `4.0` to `7.2`
- desktop boost increased from `2.25` to `2.8`
- camera depth range tightened again for room-scale stability
- floor/wall texture repeat reduced to fit the smaller room better
- earth moved to a higher city orbit based on room radius instead of the center path
- moon kept smaller and orbiting earth high above the city
- legend hall rotated/positioned to sit aligned with the northwest wall
- added a built-in store wall display on the northeast wall with logo/shelf/lights

## honest note
A dedicated store/kiosk model was not found in the currently accessible uploaded assets here, so the northeast store area in this build is a clean aligned wall display/kiosk built directly in the package rather than a missing external model.
