# Phase 134 — Workflow Run Artifact Download Handoff

## Scope

This is an operator handoff for the game zip artifact workflow.

No site files changed. No poker engine rewrite. No movement or watch rewrite. No manual Quest pass is claimed here.

## Current game test URL

https://svrpoker.com/game/?v=phase133-zip-automation

## Workflow to run

Workflow name:

```text
Package Game Zip
```

Workflow file:

```text
.github/workflows/package-game.yml
```

## Run steps

1. Open the GitHub repository.
2. Select the Actions tab.
3. Select `Package Game Zip`.
4. Click `Run workflow`.
5. Wait for the workflow to complete.
6. Open the completed workflow run.
7. Download the artifact named `game-zip`.
8. Extract it and confirm it contains `game.zip`.
9. Inspect `game.zip` and confirm `index.html` is at the root of the zip.

## What the workflow checks

- `game/index.html` exists.
- `game/main.js` exists.
- The workflow zips the contents of `game/`.
- `index.html` must be at the zip root.
- The workflow fails if the zip contains `game/index.html` as a nested path.

## Important rule

The workflow creates a downloadable artifact only. It does not commit the binary zip back into the repo.

## After download

After manual Quest pass and artifact download, keep the downloaded `game.zip` as the clean release package.

If the Quest test fails, fix the failed check before treating the artifact as a release package.
