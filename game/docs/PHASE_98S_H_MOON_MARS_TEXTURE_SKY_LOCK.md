# Phase 98S-H — Moon/Mars Real Texture + Higher Sky Lock

Date: 2026-06-02
Track: game-side only

## Purpose

Fix the Moon/Mars presentation so the lobby sky has a real hero visual instead of low, fake-looking glowing spheres.

## Files changed

- `game/modules/moon_mars_finish_patch.js`
- `game/index.html`
- `game/docs/PHASE_98S_H_MOON_MARS_TEXTURE_SKY_LOCK.md`

## What changed

- Added a modular Moon/Mars sky overlay.
- Added CDN/direct path texture candidates for Moon and Mars.
- Tries real image paths first:
  - `./assets/textures/moon.jpg`
  - `./assets/textures/moon.png`
  - `./assets/textures/Moon.jpg`
  - `./assets/textures/Moon.png`
  - `./assets/moon.jpg`
  - `./assets/moon.png`
  - `./moon.jpg`
  - `./moon.png`
  - and matching Mars paths.
- Adds fallback procedural textures only when real files are missing.
- Moon is much higher and much larger.
- Mars is higher and orbits near/around Moon.
- Glow is reduced and more subtle.
- Older large sky-sphere planets are hidden where detected.

## Runtime object names

- `SVR_Phase98SH_Moon_Mars_Texture_Sky_Lock`
- `SVR_Hero_Moon`
- `SVR_Hero_Mars`

## Debug info

The patch exposes:

```js
window.SVR_MOON_MARS_PATCH
```

This reports:

- phase
- status
- Moon texture source
- Mars texture source
- whether older procedural planets were hidden

## Protected

- Website/site side untouched.
- Reiki deploy lock preserved.
- Runtime snap guard preserved.
- Main lobby baseline not rewritten.

## Important note

If real texture files are not present in the deployed `/game/assets/...` path, the patch will use a stronger fallback texture. For best results, place real texture files at:

```text
game/assets/textures/moon.jpg
game/assets/textures/mars.jpg
```

or equivalent candidate paths listed above.

## Test route

Open:

`/game/?v=phase98sh-moon-mars-texture-sky-lock`

Then verify:

1. Build label says `PHASE-98S-H-MOON-MARS-TEXTURE-SKY-LOCK`.
2. Moon is much higher in the night sky.
3. Moon is much larger.
4. Mars is near/orbiting the Moon.
5. Glow is not overpowering.
6. Texture source can be checked with `window.SVR_MOON_MARS_PATCH` in console.
