# Phase 101 - Auto Deploy Trigger

## Purpose

This file triggers the Phase 101 GitHub Pages deploy after adding the live deploy QA and WebXR route verification manifest.

## Trigger date

2026-06-15

## Commit purpose

- Trigger the `Auto Deploy` workflow from `main`.
- Confirm Phase 101 QA documents are included in the repo.
- Keep Phase 100 deploy health files active.
- Keep `/update/game.zip` in the Pages artifact.
- Preserve WebXR/Webex game-build-only lock.

## Validation targets

After deployment completes, verify:

```text
/deploy-health.json
/game/deploy-health.json
/phase100-deploy.json
/update/game.zip
/game/
/reiki/
/android/
/downloads/
```

## Locked rule

This is a deploy trigger only. It does not rebuild the website and does not modify game source logic.
