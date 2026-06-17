# Phase 274 Pages Lightweight Artifact Lock

Build: `PHASE-274-PAGES-LIGHTWEIGHT-ARTIFACT-LOCK`

## Summary

Phase 274 fixes the Pages deployment workflow by creating a small `_pages` staging folder before upload.

## Why

The Phase 273 workflow uploaded the whole repository root. This repo contains large backup folders and binary files, so Pages deployment can fail or time out.

## Workflow Fix

Updated:

```text
.github/workflows/pages.yml
```

The workflow now:

- checks out the repo
- creates `_pages`
- copies the public root page
- copies `game/`
- copies `site/`
- copies non-zip files from `update/`
- excludes zip files and large source binaries
- uploads `_pages` instead of the full repo

## Test

Open GitHub Actions and run:

```text
Deploy SVR to GitHub Pages
```

Then test:

```text
https://svrpoker.com/game/?v=phase274-pages-lightweight-artifact
```
