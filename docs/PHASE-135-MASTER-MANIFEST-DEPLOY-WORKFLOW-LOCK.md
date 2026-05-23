# PHASE-135-MASTER-MANIFEST-DEPLOY-WORKFLOW-LOCK

## Build marker

`PHASE-135-MASTER-MANIFEST-DEPLOY-WORKFLOW-LOCK`

## Purpose

This phase locks the project back onto the correct professional workflow after the temporary NewServer experiment:

- GitHub is the source of truth.
- PowerShell is the operator workflow.
- GitHub Actions / Auto Workflow is the deploy workflow.
- The public launch page must not show `NewServer`.
- The current emergency game baseline is the stable lightweight lobby runtime from Phase 133 / Phase 134.
- Future game work must proceed by planned modules, not stacked emergency patches.

## Repository changes locked by this phase

- `index.html` no longer contains the `NewServer` link.
- `launch.css` no longer contains `.btn-newserver` styling.
- `docs/SVR_VERSION_0_1_MASTER_BLUEPRINT.md` is the active project blueprint.
- `scripts/SVR-Phase135-Deploy-And-Audit.ps1` provides the local PowerShell deploy/audit workflow.
- `update/version.json` records this build lock.

## Current active architecture

```text
/
├─ index.html                    Public launch page
├─ launch.css                    Public launch styling
├─ game/
│  ├─ index.html                 Game entry
│  ├─ main.js                    Game runtime orchestrator
│  ├─ modules/                   Modular runtime systems
│  └─ assets/                    Runtime assets only
├─ site/                         Website path, separate from game track
├─ docs/                         Manifests and phase records
├─ update/version.json           Active build marker
└─ scripts/                      PowerShell operator workflows
```

## Permanent workflow

### 1. Pull latest

```powershell
git pull origin main
```

### 2. Audit local state

```powershell
git status
```

### 3. Commit only intentional changes

```powershell
git add <changed-files>
git commit -m "Clear phase message"
```

### 4. Push to GitHub

```powershell
git push origin main
```

### 5. Run Auto Workflow

Use GitHub Actions → Auto Deploy → Run workflow → main.

## Test URLs

Public launch page:

```text
https://svrpoker.com/?v=phase135-workflow-lock
```

Game baseline:

```text
https://svrpoker.com/game/?v=phase135-workflow-lock
```

## Immediate next phases

- **Phase 136:** Full stable lobby rebuild module pass.
- **Phase 137:** Movement / locomotion / teleport module lock.
- **Phase 138:** Watch UI and input bridge lock.
- **Phase 139:** Poker gameplay table/state lock.
- **Phase 140:** Portal/private scene routing lock.
- **Phase 141:** AWS backend/API/schema manifest.
- **Phase 142:** Account/profile/admin/god-mode manifest.
- **Phase 143:** Sponsorship/charity/marketing integration manifest.
- **Phase 144:** Multiplayer readiness manifest.
- **Phase 145:** Quest performance certification checklist.

## Quality rule

No more patch stacking. Each future phase must:

1. Name the module being changed.
2. Audit the current file before editing.
3. Preserve the locked blueprint.
4. Keep site/game separation unless the phase explicitly targets both.
5. Update `update/version.json` and a phase manifest.
6. Include a test URL and PowerShell command block.

## Done criteria

- Public page has no `NewServer` button.
- Master blueprint exists and is current.
- PowerShell deploy/audit script exists.
- `update/version.json` says Phase 135.
- Next development starts from the locked SVR-Version 0.1 blueprint.
