# Phase 101C - GitHub Pages Source Verification, Actions Run Check, Custom Domain Route Lock

## Purpose

Resolve the remaining live-route mismatch after the Phase 101A boot recovery patch and Phase 101B deploy-artifact patch.

## Confirmed repo state

The repository `main` branch contains the corrected game entry. The entry now loads:

- `phase101_boot_load_screen_recovery.js`
- `phase101_partial_runtime_render_guard.js`
- `phase101_render_marker_cleanup.js`
- `main.js`
- Phase 257 / 258 / 259 Roman canopy modules
- Phase 260 Roman canopy archway final lock

## Confirmed fallback branch

A `gh-pages` branch was created from the latest fixed commit so GitHub Pages has a branch-source fallback if Pages settings are not using the Actions artifact source.

The `gh-pages` branch contains:

- `CNAME` with `svrpoker.com`
- corrected `game/index.html`
- boot recovery modules
- `main.js`
- current site root files

## Why this was needed

The public custom domain was serving stale output even after repository fixes. That means at least one of these is true:

- GitHub Pages source is not pointed at the current Actions artifact.
- GitHub Pages source is pointed at an older branch or folder.
- The custom domain or CDN cache is serving old content.
- GitHub Pages Actions is not executing or not publishing the artifact.

## Required manual GitHub Pages check

Open repository settings:

```text
GitHub repo → Settings → Pages
```

Confirm one of the following:

### Preferred setting

```text
Source: GitHub Actions
Workflow: Auto Deploy
Custom domain: svrpoker.com
```

### Fallback setting

```text
Source: Deploy from a branch
Branch: gh-pages
Folder: /root
Custom domain: svrpoker.com
```

Do not point Pages to an old backup folder or stale branch.

## Validation targets after the source is correct

Check these routes:

```text
https://svrpoker.com/
https://svrpoker.com/game/
https://svrpoker.com/game/index.html
https://svrpoker.com/deploy-health.json
https://svrpoker.com/game/deploy-health.json
https://svrpoker.com/phase101b-deploy.json
```

Expected game entry must show Phase 101/260 current boot text, not `BUILD: 20260314-P43`.

## Locked rule

This phase changes deployment routing only. It does not redesign the lobby, rebuild the website, change Android movement, or add Unity-only logic.

## Commit name

Phase 101C - Pages Source Verification, gh-pages Fallback, Custom Domain Route Lock
