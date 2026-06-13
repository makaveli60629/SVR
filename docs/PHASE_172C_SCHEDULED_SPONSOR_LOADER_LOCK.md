# Phase 172C — Scheduled Sponsor Loader Lock

## Objective
Make the sponsor system automatic. Approved sponsors now only display in the game when their approved schedule is active.

## Added

### `game/modules/sponsor_loader_phase172.js`
Added schedule enforcement:

- `evaluateSponsorSchedule(profile, now)`
- Checks approved status.
- Blocks denied, paused, and expired sponsors.
- Checks start date.
- Checks end date.
- Checks approved day of week.
- Checks approved hour window.
- Exposes schedule result at `window.SVR_PHASE172C_SPONSOR_SCHEDULE`.

The sponsor module now displays only when:

1. `approved` is true.
2. `approvalStatus` is not denied/paused/expired.
3. Today is inside `schedule.startDate` and `schedule.endDate`.
4. Current day matches `schedule.days`.
5. Current time is inside `schedule.hours`.

### `game/data/sponsors/example-reiki-sponsor.json`
Updated the demo sponsor schedule so it is active for live verification:

- Start: `2026-06-01`
- End: `2026-12-31`
- Days: all week
- Hours: `00:00` to `23:59`

### Label / version locks
Updated:

- `game/phase141_label_fix.js`
- `game/phase152_post_boot_verify.js`
- `game/version.json`

## Runtime Markers

- `window.SVR_PHASE172C_SPONSOR_SCHEDULE`
- `window.SVR_PHASE172C_VERIFY`
- `window.SVR_PHASE172_SPONSOR_MODULE`

## Test URLs

Game:

`/game/?v=phase172c-scheduled-sponsor-loader`

Disable sponsors:

`/game/?noSponsors=1`

Admin dashboard:

`/site/admin-sponsors.html`

Sponsor intake:

`/site/sponsor-intake.html`

## Verification Checklist

1. Open the game.
2. Confirm the build label reads Phase 172C.
3. Confirm sponsor module appears because the demo schedule is currently active.
4. Change a sponsor JSON to a future date to confirm it does not appear.
5. Change approvalStatus to paused/denied/expired to confirm it does not appear.
6. Confirm `window.SVR_PHASE172C_SPONSOR_SCHEDULE` reports the correct reason.

## Commits
- `20636b1545b337cdd0bba475518a9acd589ca582` — Add Phase 172C sponsor schedule enforcement.
- `8b398ece937d394eff6b2e7e0ffee336f5a7e8c7` — Make example sponsor active for Phase 172C schedule test.
- `a49c03e18fd4e27cd194437953681971c4e87cc0` — Update label override to Phase 172C.
- `7f1a89f2894afbbf73c8533b7cf9bb6d1951e31d` — Update boot verify to Phase 172C.
- `2f246d35b5849e22e3fc03567e7997d00d4850f9` — Update game version to Phase 172C scheduled sponsor loader.
