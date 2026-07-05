# SVR Site Phase — VIBEZ Four-Ad Intro Campaign

## Scope

This phase adds `((( VIBEZ )))` as a removable sponsor-style advertising module inside the `/site/` area only.

## Hard Locks

- Do not touch the public root Matrix page.
- Do not touch `/game`.
- Do not add app backend secrets to the repository.
- Do not compare the product to any protected third-party brand.
- Keep VIBEZ modular and removable.

## Files Added

- `site/vibez.html`
- `site/vibez.css`
- `site/assets/banners/vibez-intro-banner.svg`
- `site/docs/VIBEZ_MODULE_MANIFEST.md`

## File Updated

- `site/js/market-ads.js`

## Website Behavior

- Adds a `VIBEZ` button/link to the `/site/` header dynamically.
- Injects a removable VIBEZ ad module into `/site/index.html`.
- Creates a dedicated VIBEZ page with a download-app placeholder.

## VIBEZ Positioning

VIBEZ is introduced as a short-form creator platform focused on:

- creator expression
- community discovery
- mobile-first video posting
- reactions, comments, follows, and sharing
- future admin controls and moderation

## AWS Isolation Rule

Future VIBEZ app work must use isolated cloud resources:

- separate S3 bucket for VIBEZ videos
- separate S3 bucket or prefix for thumbnails
- separate database for VIBEZ users/videos/comments/reports
- separate budget alerts and upload limits
- no intermixing with SVR Poker game assets or game data

Suggested future names:

```text
svr-vibez-video-uploads
svr-vibez-video-thumbnails
vibez_app_db
```

## Next App Module Step

After this ad/page module, the next project step is the VIBEZ MVP app starter:

- repository or app module setup
- Next.js mobile-first frontend
- secure backend API
- AWS S3 upload path
- database schema
- admin moderation tools
- first install/download package placeholder
