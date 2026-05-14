# PHASE-90-UNLOCKED-APPLY-BOOT-LOCK

Game-side only fix. Website/site side is untouched.

## Purpose

This phase fixes the apply problem by removing the brittle one-phase-only upload gate from the PowerShell process. The package still validates that a real `game/` folder exists, but it no longer fails just because Windows reused an older `game.zip` name or because the script expected one exact label.

## Preserved locks

- Original lobby preserved.
- `spawnLogoTex` boot fix preserved.
- Safe boot fallback preserved.
- Private scene routes preserved:
  - `reiki.html`
  - `pga-drive.html`
  - `chip-putt.html`
  - `store-room.html`
  - `smoker-lounge.html`
  - `scorpion.html`
  - `range.html`
- Store portal remains `https://svrpoker.com/site/store.html`.
- No unapproved Reiki sponsor/founder branding.
- Package remains under 25 MB.

## Deploy rule

The current GitHub workflow deploys the committed `/game` folder directly and excludes zip files from the build. The apply script therefore replaces both `/game` and `/update/game.zip` to prevent drift.
