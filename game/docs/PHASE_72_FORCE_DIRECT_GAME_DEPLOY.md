# Phase 72 — Force Direct Game Deploy

Purpose: stop the live site from remaining on Phase 62 by updating the committed `/game` folder directly and replacing `/update/game.zip` as a backup.

Current workflow note: the deployed game is taken from committed `/game` files. Uploading only `/update/game.zip` is not enough when the workflow excludes `/update` and `*.zip` from the base build.

Locked rules:
- Original lobby preserved.
- Game-side only.
- Site untouched.
- Store portal preserved.
- Private store scene preserved.
- Reiki/PGA/Smoker/Scorpion stay as private scene routes.
- Package stays under 25 MB.

Visible build label:
`PHASE-73-DEPLOY-UNSTUCK-DIRECT-GAME`
