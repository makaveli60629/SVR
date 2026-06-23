# Phase 102 — PWA App Install + Download Lock

## Scope

This phase makes the public SVR Poker website installable as a phone/desktop app and adds a visible download/install path without touching the game runtime.

## Added

- `manifest.webmanifest` updated for the SVR Poker companion app.
- `app-install.js` added for install prompt handling and phone instructions.
- `sw.js` added as a lightweight service worker.
- Public launch page now includes a **Download App** button.
- Site pages load the app installer through the existing support/chat bridge.
- `/downloads/index.html` is now the app download/install page.
- GitHub Pages deploy workflow now includes and validates PWA files.

## Protected

- `/game` runtime was not rewritten.
- Poker/game logic was not changed.
- Site content was not redesigned.
- No private signing keys, SQL strings, or secrets were committed.

## Signing Status

The web app install path is HTTPS-backed through `svrpoker.com` and browser PWA installation.

A production signed Android APK still requires a private Android keystore. That keystore must be stored only in GitHub Actions secrets or a private release machine. Do not commit keystores, passwords, or signing configs to the repository.

Required future APK secrets:

```text
SVR_ANDROID_KEYSTORE_BASE64
SVR_ANDROID_KEYSTORE_PASSWORD
SVR_ANDROID_KEY_ALIAS
SVR_ANDROID_KEY_PASSWORD
```

## Phone Test

1. Deploy to GitHub Pages.
2. Open `https://svrpoker.com/?v=phase102-pwa` on Android Chrome.
3. Tap **Download App**.
4. Confirm the install prompt if available.
5. Launch SVR Poker from the phone app icon.
6. Test Preview Site, Launch VR Room, Store, and Support.

## iPhone Test

1. Open `https://svrpoker.com/downloads/` in Safari.
2. Tap Share.
3. Choose **Add to Home Screen**.
4. Confirm SVR Poker.

## Validation URLs

```text
https://svrpoker.com/?v=phase102-pwa
https://svrpoker.com/downloads/?v=phase102-pwa
https://svrpoker.com/manifest.webmanifest?v=phase102-pwa
https://svrpoker.com/sw.js?v=phase102-pwa
https://svrpoker.com/phase102-pwa-deploy.json
```
