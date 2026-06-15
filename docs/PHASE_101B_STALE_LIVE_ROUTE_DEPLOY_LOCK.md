# Phase 101B - Stale Live Route Deploy Lock

## Purpose

Fix the live route mismatch where the repository has the Phase 101A boot recovery patch, but the public custom domain still serves an older game boot page.

## Live finding

The public root and game route appear stale compared to the repository main branch. The repo has newer launch copy and the Phase 101A game entry. The public site still shows older launch/game boot output.

## Deployment patch applied

The GitHub Pages workflow was updated to include missing root deploy files and custom-domain support in the Pages artifact.

Added to sparse checkout and build copy:

- CNAME
- launch-overrides.css
- site-local-counter.js
- deploy-health.json
- phase100-deploy.json
- Phase 101 and Phase 101A docs

The workflow now writes an additional health file inside the Pages artifact:

- phase101b-deploy.json

## Why this matters

If the Pages artifact does not include CNAME, the custom domain can drift or continue serving stale content. If root assets are missing, the public root can also behave differently from the repo root.

## Validation targets

After deploy, check:

- Root route shows the current repository launch page.
- Game route loads the Phase 101A boot recovery entry.
- deploy-health JSON shows Phase 101B build marker.
- Game no longer remains stuck on the old boot page.

## Locked rule

This is a deploy-route patch only. It does not rebuild the game source, does not rebuild the website, and does not replace the lobby baseline.

## Commit name

Phase 101B - Fix Stale Live Route, Include CNAME, Re-trigger Pages Deploy
