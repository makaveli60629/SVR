# Phase 92 — WebXR Auto Deploy Lock

## Scope
Game/WebXR only. The website/site side is locked and must not be edited in this phase.

## Locked behavior
- Keep the current lobby baseline.
- Preserve WebXR / Three.js modular runtime.
- Preserve Quest/Oculus controller fallback.
- Preserve hand-tracking support.
- Preserve private scene routing:
  - Reiki Room
  - PGA Drive
  - PGA Chip/Putt
  - SVR Store
  - Smoker Lounge
  - Scorpion Room
- Preserve storefront/portal lobby structure.
- Keep unapproved Reiki/Trueitive/founder branding blocked.

## Deploy behavior
Current GitHub Pages workflow deploys committed files directly from `/game` and excludes ZIP files and `/update` during the copy step. This phase therefore updates direct game files, not only `update/game.zip`.

## Changed files
- `game/index.html`
- `game/modules/scene_portal_router.js`
- `game/docs/BUILD_VERSION.json`
- `game/docs/PHASE_92_WEBXR_AUTO_DEPLOY_LOCK.md`

## Verification
After deploy, open:

```text
https://svrpoker.com/game/?v=phase92-webxr-auto-deploy-lock
```

Expected visible marker:

```text
BUILD: PHASE-92-WEBXR-AUTO-DEPLOY-LOCK
```

Expected private scene route query suffix:

```text
?v=phase92
```
