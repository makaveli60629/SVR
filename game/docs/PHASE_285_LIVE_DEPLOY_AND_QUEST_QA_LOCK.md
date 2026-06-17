# Phase 285 Live Deploy and Quest QA Lock

Build: `PHASE-285-LIVE-DEPLOY-AND-QUEST-QA-LOCK`

## Summary

Phase 285 adds game-side QA instrumentation for the live deploy and Quest headset pass.

## Runtime QA snapshot

The new module exposes:

```text
window.SVR_PHASE285_LIVE_DEPLOY_AND_QUEST_QA_LOCK
```

It records:

- current URL
- document title
- body build tag
- canvas present
- scene present
- renderer present
- pillar lock present
- moon present
- Mars present
- rear doorway obstruction count

## Files changed

```text
game/phase285_live_deploy_quest_qa_lock.js
game/index.html
game/docs/BUILD_VERSION.json
game/version.json
update/version.json
```

## Manual Quest checks still required

- rear pillars clear storefront signs
- teleport ray aims forward
- forward stick follows headset direction
- moon and Mars visible high in sky
- no old Trueitive or old lobby content

## Test

```text
https://svrpoker.com/game/?v=phase285-live-deploy-quest-qa
```
