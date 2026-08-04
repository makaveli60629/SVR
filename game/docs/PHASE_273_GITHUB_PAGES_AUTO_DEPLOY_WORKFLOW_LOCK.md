# Phase 273 GitHub Pages Auto Deploy Workflow Lock

Build: `PHASE-273-GITHUB-PAGES-AUTO-DEPLOY-WORKFLOW-LOCK`

## Summary

Phase 273 adds a GitHub Pages deployment workflow at:

```text
.github/workflows/pages.yml
```

## Trigger

The workflow runs on:

```text
push to main
manual workflow_dispatch
```

## Deploy Path

The workflow uploads the repository root as the Pages artifact:

```text
path: .
```

## Protected Work

- Phase 271/272 boot/runtime sync remains preserved.
- Game source remains preserved.
- Site content was not edited.
- This phase is deployment infrastructure only.

## Manual QA

After GitHub Actions runs, open:

```text
https://svrpoker.com/game/?v=phase273-github-pages-auto-deploy
```

Check:

- workflow run exists in GitHub Actions
- Pages deploy succeeds
- game boot page still loads
- runtime remains on the current locked build
