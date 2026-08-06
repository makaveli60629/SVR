# SVR Poker Phase 391 — Final Production Audit Result

## Audit date

2026-08-06

## Release lock

`PHASE-391-PRODUCTION-CONSOLIDATION-AUTO-DEPLOY-LOCK`

## Scope completed

This final pass audited the active `main` source, the `gh-pages` production tree, the Quest manifest, Android browser game, Camera 3, avatar/profile routes, caches, APK policy, open pull requests, deployment health, root repository hygiene, and website support assets.

## Final findings corrected

### 1. Missing website support assets in production

The full website references these root scripts:

- `/support-chat-bot.js`
- `/site-local-counter.js`

The previous clean-tree publisher did not copy them, so a deployment could remove the support bot and local analytics fallback even though the website still loaded those URLs.

Correction:

- both files were restored directly to `gh-pages`;
- both files were added to the production sparse checkout;
- both files are now copied into every clean production tree;
- deployment validation requires them and compares the published copies against `main`;
- deployment health now records `supportChatBotPublished` and `siteLocalCounterPublished`.

### 2. Deployment gate previously checked source text rather than active arrays

The previous deploy workflow could confirm that phrases such as `singleOriginalTableAuthority` existed without evaluating the manifest arrays actually loaded by Quest, Android, and Camera 3.

Correction:

- the publisher now imports the active Phase 391 platform manifest as an ES module;
- it verifies no duplicate module entries;
- it verifies the direct Quest route has no deferred lobby/social work;
- it verifies retired Phase 358, 379, and 388 Quest authorities are absent;
- it verifies Camera 3 has no Phase 339/350 legacy controller;
- it verifies Quest, Camera 3, and Android manifest audits all pass before publishing.

### 3. Empty shell-command artifacts remained in the repository root

The files `Get-Content`, `cd`, `dir`, `git`, and `type` were empty accidental command-redirection artifacts.

Correction:

- all five files were removed from `main`;
- `.gitignore` now blocks those names and related root command artifacts from returning.

### 4. Obsolete pull requests could reintroduce retired architecture

The old Phase 381 restoration PR and the alternate procedural/Socket.IO overhaul PR conflicted with the active Phase 391 table, route, and deployment architecture.

Correction:

- both were marked superseded and closed without merge;
- there are no remaining open pull requests in the repository at the time of this audit.

## Active Quest production contract

- One original uploaded table authority: `PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY`.
- Phase 358 fallback-table creation removed from the active manifest.
- Phase 379 procedural-table authority removed.
- Phase 388 combined Eric/seat/felt/lighting authority removed.
- Phase 388 alternate seat authority removed.
- Playing surface recessed `0.165 m` / approximately `6.5 in` below the hand-rest top.
- Hand-rest, leather, trim, and metal geometry preserved.
- Phase 341 card presentation restored with a minimum of 17 physical card meshes.
- Eric uses the uploaded FBX, anatomical upright correction, target height `1.78 m`, grounding, and dealer-side placement.
- Player receives a bounded startup spawn directly in front of the table.
- Direct Quest table play disables deferred lobby and social modules during initial gameplay.

Canonical Quest routes:

- `/game/quest.html?v=phase391`
- `/game/index.html?platform=quest&v=phase391&direct=1&autoseat=1&questfix=1&clean=1`

## Active Android production contract

Canonical Android routes:

- `/game/android.html?channel=stable&v=phase391`
- `/game/android-tabletop.html?v=phase391`
- `/game/android-stable.html?v=phase391&direct=1`

The browser game provides JOIN NOW, six seats, five bots, hole cards, community cards, pot/chip presentation, Fold, Check/Call, Raise, All In, Next Hand, portrait and landscape layouts, safe-area handling, and gyroscope support.

## Active Camera 3 contract

Canonical route:

- `/game/camera3-live.html?v=phase391`

Camera 3 uses the original table, recessed surface, restored cards, upright Eric, one director authority, and Phase 389 production lighting. Legacy Phase 339/350 camera controllers and the duplicate Phase 368 dealer are not active.

## Protected APK policy

- `apkVersionName`: `0.1.0-rc2`
- `apkVersionCode`: `2`
- `forceUpdate`: `false`
- `showUpdatePrompt`: `false`
- `nativeApkRebuild`: `false`

Routine website/game deployment does not claim or force a new native APK.

## Deployment contract

The production workflow now:

1. checks out only the required source tree;
2. evaluates the active platform manifests;
3. validates routes, assets, JSON, JavaScript syntax, secrets, and APK policy;
4. rebuilds a clean `gh-pages` tree;
5. preserves website support assets;
6. stamps a detailed `deploy-health.json`;
7. verifies source/published file equality for the critical runtime paths;
8. pushes only after every preflight succeeds.

## Remaining physical acceptance

Static repository and deployment validation cannot reproduce a real Quest stereoscopic session or every Android GPU/browser combination. Final device acceptance remains:

- confirm Eric is upright in both eyes;
- confirm the table rail and recessed playing surface align physically;
- confirm hole/community cards remain visible through a complete hand;
- confirm Quest controls and front spawn are comfortable;
- confirm Android portrait and landscape controls are reachable;
- confirm Camera 3 framing and lighting on the live website.
