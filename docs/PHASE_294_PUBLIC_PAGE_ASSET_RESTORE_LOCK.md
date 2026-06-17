# Phase 294 Public Page Asset Restore Lock

Build: `PHASE-294-PUBLIC-PAGE-ASSET-RESTORE-LOCK`

## Summary

The root public page was not supposed to be visually changed. The page content remains the public launch page, but the lightweight Pages workflow was not copying required root assets into the deployed artifact.

## Fix

The GitHub Pages workflow now includes and copies the public launch assets:

```text
launch.css
launch-overrides.css
matrix.js
site-local-counter.js
site-public-hooks.js
logo.png
logo.webp
favicon.ico
style.css
.nojekyll
```

## Hard rule

Do not edit the public root page again unless explicitly requested.

Protected file:

```text
index.html
```

## Scope

- Public asset deploy fix only.
- Game-side phase files untouched in this phase.
- Root page content not rewritten.
