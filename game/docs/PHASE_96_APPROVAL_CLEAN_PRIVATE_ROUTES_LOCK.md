# Phase 96 — Approval Clean + Private Routes Lock

## Build
`PHASE-96-APPROVAL-CLEAN-PRIVATE-ROUTES-LOCK`

## Scope
Game-side only. Website/site files are not included and must not be changed by this package.

## Fixed
- Updated stale runtime build label from the legacy build text to Phase 96.
- Removed unapproved Reiki sponsor/founder runtime text and related UI asset payloads.
- Replaced Reiki hub panels with SVR approval-safe wording and `AWAITING APPROVAL` placeholders.
- Removed the old legacy table/meditation labels from the bottom runtime buttons.
- Added direct private scene routes:
  - `reiki.html`
  - `pga-drive.html`
  - `chip-putt.html`
  - `store-room.html`
  - `smoker-lounge.html`
  - `scorpion.html`
- Added controller-proxy watch fallback by allowing the watch to anchor to controller proxy hands when hand tracking joints are unavailable.
- Limited the playlist to the safe lobby audio track only.

## Preserved
- Original true-lobby structure.
- Main poker table.
- Watch module.
- Quest/Oculus controller fallback.
- Hold/release teleport behavior.
- PGA/Reiki as lobby storefronts with private scene routes.
- Store portal target: `https://svrpoker.com/site/store.html`.

## Locked rule
Do not touch the public website or `/site` track from this game package.
