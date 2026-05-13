# Site Phase 03 Refined Direct Deploy Lock

Build: `SITE-PHASE-03-REFINED-SVRHELP-DIRECT-LOCK`

This is a site-only direct deploy package. It preserves the locked purple binary Matrix public page and does not include or touch `/game`.

## Locked items

- Purple binary Matrix launch page
- Hidden phrase behavior for `I LOVE SHY` and `I LOVE SCARLETT`
- Admin Online / Offline indicator
- Safe local visitor message/drop-box
- Website hub pages under `/site/`
- Live game preview iframe on `/site/index.html`
- Cash App support handle: `$SVRhelp`
- Store checkout disabled until backend approval

## Important deployment rule

The current GitHub Pages workflow copies committed files directly and excludes `update/` and `*.zip`. Therefore the deploy must commit the direct files, not only `site.zip` or `update/site.zip`.
