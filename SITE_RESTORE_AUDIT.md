# SVR Official Public Site Restore Audit

Source: `site-official-matrix-onepage-restore.zip`

Verified contents:

- Root `index.html` public launch page
- Purple binary Matrix canvas via `matrix.js`
- Embedded secret Matrix phrases:
  - `I LOVE SHY`
  - `I LOVE SCARLETT`
- `logo.webp`
- `launch.css`
- `style.css`
- `site/index.html` official one-page website
- `site-public-hooks.js` admin/status + local-safe message hook
- `setup/sql-next-steps.md`
- `setup/stripe-notes.md`
- `setup/business-email-options.md`

Important deployment note:
The current GitHub workflow copies committed root files directly and excludes `*.zip`; therefore this restore must be extracted into the repo root and committed as direct files. Uploading only `site.zip` will not update the live website under the current workflow.

This package contains no `/game` folder.
