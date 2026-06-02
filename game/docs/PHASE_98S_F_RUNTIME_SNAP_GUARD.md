# Phase 98S-F — Runtime Snap Guard

Date: 2026-06-02
Track: game-side only

## Triggering bug

The live game stopped on a runtime error:

```text
TypeError: Cannot read properties of undefined (reading 'snapLeft')
at updateDesktopSnap
```

## Root cause

`desktop.update(dt, roomClamp)` sometimes returned `undefined`, but `main.js` immediately tried to read:

```js
input.snapLeft
input.snapRight
```

That caused the animation loop to throw and the lobby to stop loading.

## Fix applied

`game/main.js` now guards desktop snap input:

```js
input = desktop.update?.(dt, roomClamp) || {};
```

and wraps the desktop control update in a small try/catch so a desktop-control issue cannot black-screen the whole game loop.

## Camera 3 safety

The preview camera orbit is also clamped:

- radius is clamped between 8 and 20
- height is clamped between 1.65 and 3.2

This reduces the risk of the director/camera preview drifting too far away and crashing or dropping the browser.

## CDN / asset follow-up

Heavy assets such as GLB/FBX and high-resolution textures should be treated as CDN-safe or direct deploy assets that can be served reliably from `/game/assets/...`.

Moon/Mars follow-up should audit:

- actual texture paths
- case sensitivity
- CDN availability
- fallback procedural texture behavior
- whether `world_skyline.js` is using uploaded Moon/Mars textures or generated canvas textures

## Protected

- Website/site track untouched.
- Reiki finish patch preserved.
- Existing lobby baseline preserved.
- Existing Scorpion portal lock preserved.
