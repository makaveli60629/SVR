# Phase 340 — Platform Core Extraction and Authority Lock

## Build
`PHASE-340-PLATFORM-CORE-EXTRACTION-AUTHORITY-LOCK`

## Goal
Replace route-specific historical boot lists with one explicit, deduplicated platform loader.

## Platform manifests
- Android: foundation, one Phase 326 control authority, Phase 339 governor, authoritative poker/pot/bankroll.
- Quest: foundation, lobby, authoritative poker, current table presentation, Quest hands/shaders/seated systems.
- Desktop: foundation, lobby, authoritative poker, current table presentation without Quest-only hand modules.
- Camera 3: table-only foundation, authoritative poker presentation, lightweight orbit camera.

## Runtime authority registry
Phase 340 installs before the game runtime and tracks event listeners, renderer animation loops, one table authority, one table-area logo, legacy presentation suppression, Android controls, and renderer budgets.

## Prewarm
Before releasing the loading screen, Phase 340 uploads up to 64 textures and precompiles the visible scene when supported.

## Runtime QA
```js
window.SVR_PHASE340_AUDIT()
window.SVR_PHASE340_AUTHORITY_AUDIT()
window.SVR_PHASE340_GOVERN()
window.SVR_PHASE340_MANIFEST
```

## Protected scope
- APK remains `0.1.0-rc1`, code `1`.
- Android update prompts remain disabled and manual-only.
- No claim of completed server-authoritative multiplayer.
- Database/account/avatar work remains in subsequent phases.
