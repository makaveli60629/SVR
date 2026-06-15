# Phase 100 - Full Demo Polish, Webex Presentation Mode, AWS Deployment Prep

## Scope

This phase locks the SVR WebXR game build for sponsor-demo use. It is for the WebXR/Webex game build only. Do not rebuild the website. Do not remove the Phase 94 lobby baseline. Do not break Quest locomotion. Do not touch Android movement unless required for compatibility. Do not add Unity-only logic.

## Primary goal

Create a clean guided demo path that can be shown through Webex, deployed through GitHub Pages, and later mirrored to AWS static hosting.

## Demo path

1. Spawn Lobby
2. SVR Welcome / Main Table
3. Reiki Hub Hologram
4. Meditation Room Portal
5. PGA Training Hub
6. Driving Range Portal
7. Sponsor / Lounge Area
8. Poker Table Preview
9. Closing Demo Board

## Webex presentation mode

Add a runtime flag:

```js
const WEBEX_PRESENTATION_MODE = true;
```

When enabled:

- Smooth showcase camera is active.
- VR-only debug panels are hidden.
- UI panels are enlarged only where needed for screen share readability.
- Lobby music volume is reduced.
- Hologram audio is manually controlled and distance-aware.
- Camera path avoids walls, glass, ropes, and sponsor geometry.

## Sponsor module rules

### Reiki Hub

- First hologram screen shows the founder/video screen.
- Next, Back, Close, and Meditation Room teleport controls work.
- One hologram panel is visible at a time.
- Audio only plays inside the Reiki area and fades out when leaving.
- Glass connects to the wall and does not block the red carpet.

### PGA Hub

- PGA Training Hub signage remains readable.
- Juan Espejo / PGA module remains separate from Reiki.
- Driving Range portal remains active.

### SVR / Lounge / Sponsor sections

- Storefronts remain separated.
- Sponsor content does not overlap poker UI.
- Jumbotron content stays optional and controlled.

## Performance lock

- WebXR first.
- Quest performance first.
- Reduce transparent glass layers.
- Compress textures.
- Remove duplicate geometry.
- Limit glowing sprites.
- Reduce heavy shadows.
- Lazy-load hologram video when possible.
- Keep Moon and Mars lightweight but visible high in the sky.

## Deployment deliverables

- `.github/workflows/deploy.yml`
- `docs/PHASE_100_FULL_DEMO_POLISH_MANIFEST.md`
- `docs/PHASE_100_AWS_WEBEX_DEPLOYMENT_NOTES.md`
- `docs/PHASE_100_QA_CHECKLIST.md`
- `docs/PHASE_100_HANDOFF.md`
- `update/game.zip`

## Commit name

```text
Phase 100 - Full Demo Polish, Webex Presentation Mode, AWS Deployment Prep
```
