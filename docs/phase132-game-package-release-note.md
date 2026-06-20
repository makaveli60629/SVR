# Phase 132 — Fresh Game Package Prep + Release Notes

## Scope

Game-side package prep only.

No site files changed. No poker engine rewrite. No movement or watch rewrite. No real multiplayer or payment readiness is claimed.

## Current test URL

https://svrpoker.com/game/?v=phase132-package-prep

## Hidden QA

```js
window.SVR_RUN_PHASE132_PACKAGE_PREP_QA()
window.SVR_RUN_PHASE131_MANUAL_QUEST_TEST_QA()
window.SVR_RUN_PHASE130_PRODUCTION_DEMO_QA()
```

## Package target

Create `update/game.zip` from the contents of the `game` folder.

Important: `index.html` must be at the root of the zip, not nested inside an extra folder.

## PowerShell package command

Run from repo root:

```powershell
New-Item -ItemType Directory -Force -Path .\update | Out-Null
if (Test-Path .\update\game.zip) { Remove-Item .\update\game.zip -Force }
Compress-Archive -Path .\game\* -DestinationPath .\update\game.zip -Force
```

## Commit command after local package creation

```powershell
git add game docs deploy-health.json update/game.zip
git commit -m "Package Phase 132 game build"
git push origin main
```

## Manual Quest requirement

Before publishing the zip as final, manually test on Quest:

- One table only.
- Quest hitboxes select Fold, Check, Call, Raise, All-In, and Next.
- Dealer prompt and pot display respond.
- Presence pills remain visible.
- Route preview panels remain visible.
- Watch and teleport visuals remain present.
- Moon/Mars and second floor remain visible.
- Performance is acceptable.

## Current locked stack

Phase 116 routes through Phase 132 package prep are loaded by `game/index.html`.

## Next step

After manual Quest pass, generate `update/game.zip` locally and commit it. If Quest testing fails, fix the failed checks before packaging.
