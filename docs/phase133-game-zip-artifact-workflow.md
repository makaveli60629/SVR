# Phase 133 — Game Zip Artifact Workflow

## Scope

Game-side package automation prep.

No site files changed. No poker engine rewrite. No movement or watch rewrite.

## Workflow

`.github/workflows/package-game.yml`

Workflow name:

`Package Game Zip`

## What it does

- Checks out the repo.
- Verifies `game/index.html` and `game/main.js` exist.
- Zips the contents of `game/` into `package-out/game.zip`.
- Verifies `index.html` is at the zip root.
- Fails if `game/index.html` is nested in the zip.
- Uploads a GitHub Actions artifact named `game-zip`.

## How to run

1. Open the GitHub repo.
2. Go to Actions.
3. Select `Package Game Zip`.
4. Click `Run workflow`.
5. Download the `game-zip` artifact after the run completes.

## Important

This workflow creates a downloadable artifact. It does not automatically commit the binary zip back to the repo.

## Runtime test URL

https://svrpoker.com/game/?v=phase133-zip-automation

## Hidden QA

```js
window.SVR_RUN_PHASE133_PACKAGE_AUTOMATION_QA()
```

## Next step

Run the workflow after manual Quest pass. Download the artifact and confirm the zip root contains `index.html` directly.
