import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];
const requireText = (source, token, label) => {
  if (!source.includes(token)) errors.push(label || `missing:${token}`);
};
const forbidText = (source, token, label) => {
  if (source.includes(token)) errors.push(label || `forbidden:${token}`);
};

const modulePath = 'game/modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js';
const manifestPath = 'game/modules/phase340_platform_manifest.js';
const androidPath = 'game/android.html';
const gameManifestPath = 'game/manifest.json';
const releasePath = 'game/android-release.json';

for (const file of [modulePath, manifestPath, androidPath, gameManifestPath, releasePath, 'site/profile.html', 'site/avatar.html', 'game/avatar-vr.html']) {
  if (!exists(file)) errors.push(`missing-file:${file}`);
}

const moduleSource = read(modulePath);
const platformManifest = read(manifestPath);
const androidHtml = read(androidPath);
const gameManifest = JSON.parse(read(gameManifestPath));
const androidRelease = JSON.parse(read(releasePath));
const profile = read('site/profile.html');
const avatar = read('site/avatar.html');
const avatarVr = read('game/avatar-vr.html');

requireText(moduleSource, "PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK", 'module-build');
requireText(moduleSource, 'const TABLE_LINE_OFFSET = 0.065', 'table-reference-line-offset');
requireText(moduleSource, 'referenceLineY', 'table-reference-line-state');
requireText(moduleSource, 'body.svr365-seated #svr347Move,body.svr365-seated #svr347Look', 'seated-sticks-hidden-css');
requireText(moduleSource, "text === 'LOBBY' || text === 'CENTER'", 'seated-navigation-hidden');
requireText(moduleSource, 'right.multiplyScalar(move.x * WALK_SPEED * dt)', 'direct-left-right-mapping');
requireText(moduleSource, "window.addEventListener('deviceorientation'", 'gyro-listener');
requireText(moduleSource, 'DeviceOrientationEvent.requestPermission', 'gyro-permission');
requireText(moduleSource, 'camera.position.lerp(target', 'seated-camera-damping');
requireText(moduleSource, 'PHASE365_ANDROID_CLEAN_POT_DISPLAY', 'clean-pot-authority');
requireText(moduleSource, "context.clearRect(0, 0, canvas.width, canvas.height)", 'pot-transparent-canvas');
requireText(moduleSource, 'SVR_ANDROID_BRAND_SLOT', 'brand-slot');
requireText(moduleSource, 'SVR_PHASE365_SET_BRAND', 'replaceable-brand-api');
requireText(moduleSource, 'PHASE365_BRANDED_CARD_BACK_TEXTURE', 'card-back-branding');
requireText(moduleSource, 'PHASE365_NAME_TAG_', 'avatar-name-tags');
requireText(moduleSource, 'PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'existing-avatar-authority-reused');
forbidText(moduleSource, 'new THREE.Group();\n  group.name = \'PHASE365_ANDROID_LIGHTWEIGHT_TABLE_AVATARS\'', 'duplicate-avatar-group');

requireText(platformManifest, "export const VERSION = 'phase365'", 'platform-version');
requireText(platformManifest, "'modules/phase350_android_controller_dom_deduplication_lock.js',\n  'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js'", 'dedupe-before-phase365');
requireText(platformManifest, "phase365-android-seated-ux-not-last", 'phase365-last-validator');
requireText(platformManifest, "'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js'", 'phase365-manifest-entry');

const htmlPhase365 = androidHtml.indexOf("phase365_android_seated_ux_branding_gyro_alignment_lock.js?v=phase365");
const htmlSettlement = androidHtml.indexOf("phase363_android_settlement_lobby_consistency_lock.js?v=phase365");
if (htmlPhase365 < 0 || htmlSettlement < 0 || htmlPhase365 < htmlSettlement) errors.push('android-html-phase365-not-last');
requireText(androidHtml, "window.SVR_ANDROID_BRAND_SLOT={id:'svr',name:'SVR POKER'", 'android-default-brand-slot');
requireText(androidHtml, 'data-build="PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK"', 'android-build-label');

if (gameManifest.phase !== 365) errors.push('game-manifest-phase');
if (gameManifest.start_url !== './android.html?channel=stable&v=phase365') errors.push('game-manifest-start-url');
if (gameManifest.table_reference_line_offset_meters !== 0.065) errors.push('game-manifest-table-line');
if (!gameManifest.android_sticks_hidden_while_seated) errors.push('game-manifest-sticks-hidden');
if (!gameManifest.android_hud_brand_slot || !gameManifest.android_card_back_brand_slot) errors.push('game-manifest-brand-slots');
if (!gameManifest.tournament_brand_replaceable) errors.push('game-manifest-brand-replaceable');
if (gameManifest.apk_version_name !== '0.1.0-rc1' || gameManifest.apk_version_code !== 1) errors.push('apk-version-lock');
if (gameManifest.release_ready || gameManifest.force_update || gameManifest.show_update_prompt || !gameManifest.manual_update_only) errors.push('apk-update-policy');

if (androidRelease.webEntry !== '/game/android.html?channel=stable&v=phase365') errors.push('release-web-entry');
if (androidRelease.currentGameBuild !== 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK') errors.push('release-build');
if (!androidRelease.androidExperience?.sticksHiddenAfterJoin) errors.push('release-sticks-hidden');
if (!androidRelease.androidExperience?.transparentUnframedPot) errors.push('release-clean-pot');
if (!androidRelease.androidExperience?.brandSlotReplaceableForTournaments) errors.push('release-brand-slot');
if (androidRelease.releaseReady || androidRelease.forceUpdate || androidRelease.showUpdatePrompt || !androidRelease.manualUpdateOnly) errors.push('release-apk-policy');

if (!/showroom|profile.*avatar|avatar.*profile/i.test(profile)) errors.push('profile-showroom-marker');
if (!/dressing|wardrobe|avatar/i.test(avatar)) errors.push('website-dressing-room-marker');
if (!/WebXR|dressing|pedestal|avatar/i.test(avatarVr)) errors.push('vr-dressing-room-marker');

const result = {
  build: 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK',
  filesChecked: 8,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
