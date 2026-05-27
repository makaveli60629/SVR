# SVR Update 2.0 — Site Stability Lock

Updated: 2026-05-27T06:06:31Z

## Scope

This package is **site-side only**.

## Protected

- Root public Matrix launch page is not included and must not be overwritten.
- Game files are not included in this package.
- No SQL, Stripe, admin, API, or production secrets are included.

## Included

- `site/update-2.html`
- `site/data/update-2-status.json`
- `site/docs/UPDATE_2_0_SITE_LOCK.md`
- `site/docs/UPDATE_2_0_SITE_MANIFEST.json`

## Finished

- Added the Update 2.0 site status page.
- Added a site status JSON file.
- Added a site manifest.
- Preserved the public Matrix launch page.
- Preserved the game track.

## Still to finish tomorrow

- Quest watch orientation polish.
- Seated table height alignment.
- Card/chip readability at the table.
- Full Quest QA run.
- Backend/API production connection after baseline is stable.

## Test

Open:

```text
https://svrpoker.com/site/update-2.html?v=svr-update-2-site-lock
```

Then confirm:

1. The page loads.
2. The public Matrix page is unchanged.
3. `/site/index.html` is unchanged unless you separately edit it.
4. No game files changed from this site package.

## Next phase

`PHASE-283-QUEST-WATCH-SEATED-TABLE-POLISH`
