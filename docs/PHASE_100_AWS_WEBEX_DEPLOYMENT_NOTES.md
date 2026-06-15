# Phase 100 - AWS / Webex Deployment Notes

## Current deployment target

Primary target is GitHub Pages from `main` using `.github/workflows/deploy.yml`.

The workflow deploys the static build folder created from the repo root game/site assets. The root `index.html` must remain at the web root.

## Auto deploy behavior

The deploy workflow runs on:

- Push to `main`
- Manual `workflow_dispatch`

Required permissions:

- `contents: read`
- `pages: write`
- `id-token: write`

## Public build folders

The Pages build should include:

- `index.html`
- `style.css`
- `launch.css`
- `matrix.js`
- `site-public-hooks.js`
- `logo.png`
- `logo.webp`
- `favicon.ico`
- `.nojekyll`
- `site/`
- `game/`
- `reiki/`
- `android/`
- `downloads/`
- `presentations/`
- `presentation/`
- `update/`

## Update package rule

`update/game.zip` must remain available for update/download workflow support.

Rules:

- Keep `update/game.zip` at `/update/game.zip`.
- Avoid nested zip folders.
- Keep the game entry file at the correct root inside the zip.
- Target `game.zip` size should stay at or below 25 MB when possible.

## AWS-ready structure

Future AWS mirror should preserve:

```text
/public
/game
/assets
/update
/docs
```

Recommended AWS path:

1. Upload static site to S3 bucket.
2. Enable static website hosting or serve through CloudFront.
3. Add CloudFront cache policy with short cache for `deploy-health.json`.
4. Use longer cache for textures, models, and stable assets.
5. Use cache-busting filenames for game assets after major revisions.

## Webex demo rules

During Webex presentation:

- Use desktop showcase camera.
- Hide Quest hand debug panels.
- Hide performance stats unless troubleshooting.
- Keep UI readable from screen share distance.
- Keep Reiki hologram audio controlled.
- Do not let sponsor panels overlap poker UI.

## Health check files

The deploy workflow writes:

- `/deploy-health.json`
- `/game/deploy-health.json`
- `/phase100-deploy.json`

These files confirm that the Pages artifact was built from the latest commit.
