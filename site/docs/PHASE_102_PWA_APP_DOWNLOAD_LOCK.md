# Phase 102 — PWA App Download Header Lock

## Scope

This phase adds the SVR Poker installable web app layer and a download/install button path without rewriting the game.

## Added

- `/manifest.webmanifest`
- `/pwa-sw.js`
- `/pwa-app-install.js`
- `/offline.html`
- `/site/app.html`
- Auto Deploy publishing for the new PWA files
- Auto injection of the app installer script into built HTML pages
- Header/navigation install button injection for the public launch page and `/site/` market navigation

## User-facing routes

- App page: `https://svrpoker.com/site/app.html`
- PWA manifest: `https://svrpoker.com/manifest.webmanifest`
- Service worker: `https://svrpoker.com/pwa-sw.js`
- Offline fallback: `https://svrpoker.com/offline.html`

## Signing status

The live button does not link to an unsigned APK. The current app layer is an HTTPS-delivered PWA.

Native Android APK/AAB signing still needs a private signing setup outside public source files. Do not commit private signing files or passwords to the repository.

## Protected

- `/game` runtime not rewritten
- poker lobby not redesigned
- current website pages preserved
- no unsigned APK download exposed
