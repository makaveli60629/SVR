SVR refined next phase audit

Game-only package created.

Key fixes:
- Camera 3 autocam now triggers automatically when loaded inside an iframe, so site preview can move again without a site edit.
- Watch fit shifted to a 45 degree inner-forearm orientation with a longer strap and larger offset.
- Music state now shows clearly on the watch as NOW PLAYING, and audio priming was strengthened.
- Local packaged assets were added for table/Eric/moon/room textures so the build is less dependent on CDN-only paths.
- Floor, wall, chair, and table topper materials now have procedural fallback if any repo texture is unavailable.
- Moon raised higher, Earth refined, stars made smaller/farther/denser, extra haze and lighting added.
- Chairs are more detailed and seated mode lowers the player view when joining the table.

Runtime-sensitive items that still need live headset verification:
- exact watch fit on the user’s hand model
- XR audio unlock behavior on Quest browser
- Eric facing/material look in-headset
