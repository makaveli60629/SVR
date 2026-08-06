# SVR Poker Phase 389 — Full Audit and Visible Fixes Manifest

## Build

`PHASE-389-FULL-AUDIT-VISIBLE-FIXES-LOCK`

Predecessor: `PHASE-388-QUEST-TABLE-PLAYER-ERIC-AUTHORITY-LOCK`

Branch: `agent/phase389-full-audit-visible-fixes`

## Requested scope

- Audit the live repository and production deployment path.
- Determine why the game, avatar dressing room, and profile avatar demo appeared unchanged.
- Fix high-confidence code, route, cache, and deployment issues.
- Improve Android layout suitability.
- Add a dedicated Camera 3 live preview route with the table visible and sufficient lighting.
- Preserve the RC2 APK version and avoid a forced native update.

## Audit method

This was a repository and deployment-contract audit of `makaveli60629/SVR` on GitHub. It covered entry routes, imported runtime authorities, static HTML/CSS/JavaScript, service workers, PWA metadata, release metadata, GitHub Pages workflows, and source-to-production copying rules.

Physical Quest headset, Android device, animation retargeting, and final visual acceptance remain manual test steps because they require the actual hardware/runtime.

## Root causes found

### 1. Visible pages were still loading predecessor assets

The Phase 388 deployment routes used Phase 388 query strings, but the dressing room continued to load `phase346-avatar-room.js?v=phase346`, and the profile continued to load Phase 351/374 showroom and recovery files. The URLs changed while the main visible implementation remained predecessor code.

**Fix:** New Phase 389 dressing room and profile showroom entry files, responsive CSS, explicit route versions, visible build labels, saved-outfit refresh, and camera presets.

### 2. Dressing-room correction ran as a permanent override

The Phase 388 Eric correction stopped animation, disabled auto-rotation, recolored geometry, and swept repeatedly. That made the page look static and prevented the dressing room from behaving like a normal outfit preview.

**Fix:** The Phase 389 dressing room no longer imports the repeated Phase 388 correction module. It uses the normal viewer, outfit application, portrait capture, saved profile record, and full/upper/face camera views.

### 3. Profile demo remained tied to Phase 351/374

The profile page used an older showroom module and mobile recovery layer. It could stay on a fallback presentation even after the dressing-room code changed.

**Fix:** New Phase 389 profile showroom loads the saved avatar and equipped outfit directly, supports retry/fullscreen/camera views, and refreshes when account or outfit state changes.

### 4. Two Quest seat authorities were active together

`game/index.html` imported `phase388_front_south_seat_authority.js` before dynamically importing `phase388_quest_table_player_eric_authority.js`. Both continuously repositioned and locked the rig, creating competing seat correction loops.

**Fix:** Phase 389 disables the duplicate front-south import and keeps one authoritative Quest table/seat controller. A runtime health module checks that the duplicate authority is not installed.

### 5. Game visibility had no final consolidated health guard

The runtime had table, material, dealer, and overlay modules, but no final Phase 389 check that the renderer canvas, table, and authoritative Eric instance were visible together.

**Fix:** `phase389_runtime_health_visibility.js` restores canvas visibility, reasserts table visibility, removes duplicate authoritative dealer roots, and exposes a runtime QA snapshot.

### 6. Camera 3 used old Phase 339/350 framing and limited table discovery

The old `/game/camera3.html` route was still labeled Phase 368 and relied on older table-name candidates. The lighting exposure was lower and there was no dedicated production feed contract.

**Fix:** New canonical route:

`/game/camera3-live.html?v=phase389`

It includes robust table discovery, original-table reassertion, recursive table visibility, material repair, seven preview lights, ACES tone mapping, exposure `1.48`, five director shots, no HUD controls, and a Camera 3 QA function. Legacy `/game/camera3.html`, `/game/cam3.html`, and `/game/preview.html` routes now point to it. Website preview iframes and preview links are rewritten to the new route.

### 7. Android layout was fixed to Phase 385 sizing

The tabletop CSS had useful compact sizing but no Visual Viewport height controller and no separate portrait/landscape control layout. Small screens and landscape mode could compress cards and actions.

**Fix:** Phase 389 adds:

- Visual Viewport based height.
- Safe-area insets.
- Portrait and landscape classes.
- A right-side landscape action rail.
- Larger minimum action targets.
- Responsive cards and compact seat panels.
- Preserved gyroscope and touch fallback.

### 8. Cache and release metadata were stale

Service workers, public link normalization, PWA shortcuts, game manifest, Android release metadata, and app-version metadata pointed to mixed Phase 380/383/384/385/388 routes.

**Fix:** Rolled the web cache epoch and all canonical web routes to Phase 389 while preserving APK `0.1.0-rc2`, version code `2`, `forceUpdate: false`, and `showUpdatePrompt: false`.

### 9. Production workflows would reject the corrected release

The deploy and Pages workflows validated Phase 388 strings and would fail after a Phase 389 merge.

**Fix:** Both production workflows now validate Phase 389 game, Camera 3, Android, avatar, profile, cache, security, and asset contracts. A PR audit workflow performs syntax, JSON, route, asset, and protected-release checks.

## Canonical Phase 389 routes

| Surface | Route |
|---|---|
| Quest entry | `/game/quest.html?v=phase389` |
| Quest runtime | `/game/index.html?platform=quest&v=phase389&direct=1&autoseat=1&questfix=1&clean=1` |
| Camera 3 live | `/game/camera3-live.html?v=phase389` |
| Android entry | `/game/android.html?channel=stable&v=phase389` |
| Android tabletop | `/game/android-tabletop.html?v=phase389` |
| Avatar dressing room | `/site/avatar.html?v=phase389` |
| Profile avatar demo | `/site/profile.html?v=phase389` |

## Major files added

- `game/camera3-live.html`
- `game/modules/phase389_camera3_live_preview.js`
- `game/modules/phase389_runtime_health_visibility.js`
- `game/modules/phase389_android_responsive_layout.js`
- `game/styles/phase389_android_responsive_layout.css`
- `site/js/phase389-avatar-room.js`
- `site/js/phase389-profile-showroom.js`
- `site/css/phase389-avatar-profile-visible-refresh.css`
- `.github/workflows/phase389-audit-check.yml`

## Major files updated

- `index.html`
- `site-public-hooks.js`
- `site/avatar.html`
- `site/profile.html`
- `site/phase383-home-restore.js`
- `game/index.html`
- `game/quest.html`
- `game/camera3.html`
- `game/cam3.html`
- `game/preview.html`
- `game/android.html`
- `game/android-tabletop.html`
- `game/manifest.json`
- `game/android-release.json`
- `manifest.webmanifest`
- `sw.js`
- `pwa-sw.js`
- `update/app-version.json`
- `.github/workflows/deploy.yml`
- `.github/workflows/pages-live-publish.yml`

## Protected items

- Public Phase 383 website structure remains present.
- Original table GLB and FBX assets remain present.
- Eric FBX asset remains present.
- APK remains `0.1.0-rc2`, version code `2`.
- No forced APK update.
- No secrets, credentials, `.env`, Azure SQL connection strings, Stripe secrets, or AWS secrets are added.

## Acceptance checklist

### Automated

- JSON syntax validation.
- JavaScript syntax validation.
- Phase 389 route and build marker validation.
- Original table and Eric asset presence.
- Duplicate Quest seat import absent.
- Camera 3 route and production-lighting marker present.
- Android responsive CSS/module present.
- Avatar and profile Phase 389 entry modules present.
- Secret-pattern scan.
- RC2 APK version policy preserved.

### Manual hardware/browser acceptance

1. Open Camera 3 and confirm the uploaded poker table is visible in every shot.
2. Confirm the Camera 3 table is bright enough without washed-out cards or felt.
3. Open Quest and confirm one stable front table seat without camera fighting.
4. Confirm Eric is visible and grounded.
5. Open the dressing room, change clothing, save, then open Profile Demo and confirm the saved outfit appears.
6. Test Android portrait and landscape layouts on the physical phone.
7. Confirm all four action buttons remain reachable above system navigation bars.
8. Confirm no forced APK update prompt appears.

## Known limits

- A repository audit cannot guarantee every visual or hardware issue is resolved without physical Quest and Android acceptance testing.
- Eric animation retargeting/shuffle motion is not claimed as complete in this phase; the current authoritative Eric FBX does not expose a verified compatible shuffle clip in the audited runtime.
- The Phase 383 public site remains intentionally protected rather than redesigned.
