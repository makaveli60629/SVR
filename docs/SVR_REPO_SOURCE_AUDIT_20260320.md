# SVR Repo + Source Audit (2026-03-20)

## What I found

1. The repo deploy workflow builds from two different sources:
   - checked-in `/game` source inside the repo
   - `update/game.zip` overlay applied during GitHub Pages deploy

2. In the uploaded repo snapshot, `update/game.zip` only contains **one file**:
   - `game/index.html`

3. That means the deployed game can become a **mixed build**:
   - newer HTML from `update/game.zip`
   - older checked-in JS/modules/assets from `/game`

4. This is the highest-risk source of the black "Booting..." screen and stale build tags.

5. The workflow validation only checks `build/index.html` and does **not** verify:
   - `build/game/index.html`
   - `build/game/main.js`
   - module/assets presence

## Fix I prepared

I packaged a **full self-contained game zip** under 25 MB so the deploy overlay replaces the game as one consistent build instead of mixing generations.

Prepared file:
- `svr_game_repo_source_audit_fix_20260320_under25mb.zip`

## Recommended deploy path

1. Replace `update/game.zip` with the new full zip
2. Commit only that file
3. Push to `main`
4. Hard-refresh or clear Quest/browser cache after GitHub Pages finishes

## Suggested future hardening

- Validate `build/game/index.html` in the workflow
- Validate `build/game/main.js` in the workflow
- Fail deploy if `update/game.zip` contains only HTML without the rest of the runtime
- Keep all packaged filenames lower-case
