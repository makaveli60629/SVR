# Phase 101Z - Hard Overlay Release / No-Stuck Presentation Lock

## Purpose

Fix the remaining loading-card blocker shown in the screenshot.

The screenshot showed the lobby scene was already visible behind the Safe Loader Bridge card. That means the runtime loaded, but the overlay/card did not disappear.

## Patch applied

Updated:

```text
game/index.html
```

## Fix

The safe overlay now force-hides using direct inline styles and body classes:

```text
boot-released
runtime-visible
overlay-released
```

The release function now directly sets:

```text
safeStage.style.display = 'none'
safeStage.style.opacity = '0'
safeStage.style.visibility = 'hidden'
safeStage.style.pointerEvents = 'none'
```

## New hard release triggers

- As soon as `window.__SVR_RENDERER__` exists.
- As soon as `window.__SVR_SCENE__` exists.
- As soon as a `canvas` exists.
- After runtime launch.
- On window error.
- On unhandled promise rejection.
- Absolute release at 1.8 seconds.
- Backup release at 3.2 seconds.

## Manual emergency console command

If any browser still displays the card, run:

```js
window.SVR_FORCE_HIDE_SAFE_STAGE('manual')
```

## Validation URL

```text
https://svrpoker.com/game/index.html?v=phase101z-hard-overlay-release
```

## Expected result

- No stuck Safe Loader Bridge card.
- Scene is visible.
- Lobby modules still load behind the safe loader.
- Phase 101V bridge still loads later modules.
- No boot rewrite beyond overlay release logic.

## Locked rule

This phase only fixes the stuck overlay/card. It does not change admin API, public site, Android movement, Quest locomotion core, sponsor content, or Unity logic.

## Commit name

```text
Phase 101Z - Hard Overlay Release No-Stuck Lock
```
