# SVR Poker Phase 380 — Game and Site Integrity Audit

## Scope

This phase audits and corrects the current production game and site without redesigning the locked public Matrix launch page or the established Quest lobby.

## Confirmed root causes

### 1. Stale production tree

The production workflow copied a small whitelist into the existing `gh-pages` checkout. Files removed or renamed in `main` therefore remained available indefinitely in production. Game modules, assets, site pages and old phase files could drift from the source branch.

### 2. Quest emergency table became permanent

The Phase 379 emergency table assigned itself to `window.SVR_TABLE_AUTHORITY`. Later watchdog passes inspected that authority before rescanning for the uploaded table, so the emergency table prevented the original GLB/FBX from taking control after it finished loading.

### 3. Android poker was presentation-only

The standalone Android table correctly protected JOIN NOW and avoided the heavy lobby, but winner selection was random. Cards used a single center label and did not provide the requested two-corner rank/suit presentation or replaceable tournament logo slot.

### 4. Release and site route drift

Release manifests still described the APK as pending after the same-domain RC2 package had been published. `showUpdatePrompt` remained enabled despite manual-only update policy. Older site pages contained obsolete game phase routes.

## Corrections

### Production publication

- Rebuilds the `gh-pages` production tree from a clean directory.
- Copies the full current `game/`, `site/` and `downloads/` runtime trees.
- Deletes stale files through `git add -A`.
- Keeps the locked root Matrix page intact.
- Excludes development tools, documentation archives, ZIPs, PowerShell scripts and `.env` files from the published tree.
- Validates required table assets, APK, site pages and runtime modules before publishing.

### Quest table authority

- Adds `phase380_original_table_authority_lock.js`.
- Loads `game/assets/models/table.glb` first and `game/assets/table.fbx` only as its uploaded fallback.
- Preserves original texture maps and normalizes the table to the verified 2.734 m × 1.460 m footprint.
- Installs the original table as the trapped global authority.
- Delays the procedural table for ten seconds.
- Continues scanning after fallback creation.
- Removes the procedural table immediately when the original table appears.

### Android stable table

- Keeps static JOIN NOW before all cards and controls.
- Keeps the low-power standalone route independent of the heavy 3D lobby.
- Adds deterministic seven-card Texas Hold’em evaluation.
- Adds burn cards before flop, turn and river.
- Adds rotating dealer order, blinds, tied-pot splitting and stack persistence.
- Renders `10`, never `T`.
- Adds upper-left and lower-right rank/suit corners with a large center suit.
- Adds a replaceable upper-right tournament/sponsor logo slot.
- Keeps movement controls absent while seated.

### Site and release truth

- Leaves the root Matrix page unchanged.
- Updates the interior portal to current Phase 380 routes.
- Adds runtime normalization for older site links.
- Points APK controls to the verified same-domain RC2 file.
- Disables forced and recurring update prompts while preserving visible manual update/download controls.

## Product truth

- Android stable play remains a lightweight local play-money table against five bots.
- Quest/desktop remain the full 3D lobby route.
- The emergency Quest table is a last-resort fallback, not the visual authority.
- Current multiplayer is not server-authoritative.
- Final Android touch comfort and Quest Guardian/controller comfort require physical device acceptance after deployment.

## Canonical routes

- Public Matrix page: `/`
- Interior portal: `/site/?v=phase380`
- Android stable: `/game/android-stable.html?v=phase380`
- Quest: `/game/index.html?platform=quest&v=phase380`
- APK: `/downloads/svr-poker-android-rc2.apk`
- Deployment proof: `/deploy-health.json`
