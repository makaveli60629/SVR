# Version 1.5.6 - Reiki Storefront Wall Layout

## Scope
Game side only.

## What changed
- Removes the Trueitive/Reiki presentation as a global popup overlay.
- Creates a 3D wall-mounted Reiki/Trueitive presentation frame inside the storefront.
- Keeps her photo/info/banner/video frames visible as storefront wall content, not a screen-covering HUD.
- Keeps the red carpet clear by hiding plant-like objects detected in the center walkway.
- Hides old floor/bottom signs such as "Reiki Hologram Carousel" and old carousel spinner labels.
- Adds small manual slide controls only; no auto-spinning carousel.
- Long video hologram frame uses video texture if ssets/presentation/trueitive_hologram.mp4 exists.
- Keeps Moon and Mars high above the skyline with texture fallbacks.

## Asset slots
- game/assets/presentation/shyona_royston.png
- game/assets/presentation/trueitive_banner.png
- game/assets/presentation/trueitive_ad.png
- game/assets/presentation/trueitive_hologram.mp4
- game/assets/textures/moon.jpg
- game/assets/textures/mars.jpg

## Protected
- Website/site untouched.
- Existing Reiki runtime files hash-protected.
- Lobby is not rebuilt.
- No global popup is used.

## Test
https://svrpoker.com/game/?v=1-5-6-reiki-storefront-wall-layout
