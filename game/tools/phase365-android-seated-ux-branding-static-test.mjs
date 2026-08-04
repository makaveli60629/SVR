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
const successorPath = 'game/modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js';
const phase374UiPath = 'game/modules/phase374_android_tournament_card_ui_lock.js';
const manifestPath = 'game/modules/phase340_platform_manifest.js';
const androidPath = 'game/android.html';
const gameManifestPath = 'game/manifest.json';
const releasePath = 'game/android-release.json';
const currentReleasePath = 'game/phase374-release.json';
const profileCameraPath = 'site/js/phase366-profile-live-camera-watchdog.js';

for (const file of [modulePath, successorPath, phase374UiPath, manifestPath, androidPath, gameManifestPath, releasePath, currentReleasePath, 'site/profile.html', 'site/avatar.html', profileCameraPath, 'game/avatar-vr.html']) {
  if (!exists(file)) errors.push(`missing-file:${file}`);
}

const moduleSource = read(modulePath);
const successorSource = read(successorPath);
const phase374Ui = read(phase374UiPath);
const platformManifest = read(manifestPath);
const androidHtml = read(androidPath);
const gameManifest = JSON.parse(read(gameManifestPath));
const androidRelease = JSON.parse(read(releasePath));
const currentRelease = JSON.parse(read(currentReleasePath));
const profile = read('site/profile.html');
const avatar = read('site/avatar.html');
const profileCamera = read(profileCameraPath);
const avatarVr = read('game/avatar-vr.html');

requireText(moduleSource, 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK', 'module-build');
requireText(moduleSource, 'const TABLE_LINE_OFFSET = 0.065', 'table-reference-line-offset');
requireText(moduleSource, 'referenceLineY', 'table-reference-line-state');
requireText(moduleSource, 'body.svr365-seated #svr347Move,body.svr365-seated #svr347Look', 'seated-sticks-hidden-css');
requireText(moduleSource, "text === 'LOBBY' || text === 'CENTER'", 'seated-navigation-hidden');
requireText(moduleSource, 'right.multiplyScalar(move.x * WALK_SPEED * dt)', 'direct-left-right-mapping');
requireText(moduleSource, "window.addEventListener('deviceorientation'", 'gyro-listener');
requireText(moduleSource, 'DeviceOrientationEvent.requestPermission', 'gyro-permission');
requireText(moduleSource, 'camera.position.lerp(target', 'seated-camera-damping');
requireText(moduleSource, 'PHASE365_ANDROID_CLEAN_POT_DISPLAY', 'clean-pot-authority');
requireText(moduleSource, 'context.clearRect(0, 0, canvas.width, canvas.height)', 'pot-transparent-canvas');
requireText(moduleSource, 'SVR_ANDROID_BRAND_SLOT', 'brand-slot');
requireText(moduleSource, 'SVR_PHASE365_SET_BRAND', 'replaceable-brand-api');
requireText(moduleSource, 'PHASE365_BRANDED_CARD_BACK_TEXTURE', 'card-back-branding');
requireText(moduleSource, 'PHASE365_NAME_TAG_', 'avatar-name-tags');
requireText(moduleSource, 'PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'existing-avatar-authority-reused');
forbidText(moduleSource, "new THREE.Group();\n  group.name = 'PHASE365_ANDROID_LIGHTWEIGHT_TABLE_AVATARS'", 'duplicate-avatar-group');

requireText(successorSource, 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK', 'phase367-build');
requireText(successorSource, 'window.visualViewport', 'visual-viewport');
requireText(successorSource, 'now - lastStabilizedAt < 900', 'stabilization-rate-limit');
requireText(successorSource, "runtime.controllerRoots = $$('#svr347Root').length", 'existing-controller-root-audit');
requireText(successorSource, 'window.SVR_PHASE365_STABILIZE_SEAT?.()', 'phase365-seat-authority-reused');

requireText(phase374Ui, 'PHASE-374-ANDROID-TOURNAMENT-CARD-UI-LOCK', 'phase374-ui-build');
requireText(phase374Ui, 'body.svr374-seated #svr347Move', 'phase374-seated-sticks-hidden');
requireText(phase374Ui, '#svr374TournamentLogo', 'phase374-logo-slot');
requireText(phase374Ui, "if (rank === 'T')", 'phase374-ten-display');
requireText(phase374Ui, 'window.SVR_PHASE374_SET_TOURNAMENT_BRAND', 'phase374-replaceable-brand');

requireText(platformManifest, "export const VERSION = 'phase367'", 'platform-version');
requireText(platformManifest, "'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js',\n  'modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js'", 'phase365-before-phase367');
requireText(platformManifest, 'phase367-android-device-not-last', 'phase367-last-validator');

const htmlSettlement = androidHtml.indexOf('phase363_android_settlement_lobby_consistency_lock.js?v=phase374');
const htmlPhase365 = androidHtml.indexOf('phase365_android_seated_ux_branding_gyro_alignment_lock.js?v=phase374');
const htmlPhase367 = androidHtml.indexOf('phase367_android_physical_device_viewport_touch_acceptance_lock.js?v=phase374');
const htmlPhase374Ui = androidHtml.indexOf('phase374_android_tournament_card_ui_lock.js?v=phase374');
if (htmlPhase374Ui < 0 || htmlSettlement < 0 || htmlPhase365 < htmlSettlement || htmlPhase367 < htmlPhase365) errors.push('android-html-successor-order');
requireText(androidHtml, "window.SVR_ANDROID_BRAND_SLOT={id:'svr-default',name:'SVR POKER'", 'android-default-brand-slot');
requireText(androidHtml, 'data-build="PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK"', 'android-current-build-label');
requireText(androidHtml, 'data-acceptance="PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK"', 'android-protected-acceptance');

if (gameManifest.phase !== 374) errors.push('game-manifest-phase');
if (gameManifest.start_url !== './android.html?channel=stable&v=phase374') errors.push('game-manifest-start-url');
if (Math.abs(Number(gameManifest.table_dimensions_meters?.height) - 0.801) > 0.006) errors.push('game-manifest-table-height');
if (!gameManifest.one_table_authority_both_platforms || gameManifest.generated_low_poly_table_is_visible_authority) errors.push('game-manifest-original-table');
if (!gameManifest.android_sticks_hidden_while_seated) errors.push('game-manifest-sticks-hidden');
if (!gameManifest.android_hud_brand_slot || !gameManifest.android_card_back_brand_slot || !gameManifest.android_tournament_logo_slot) errors.push('game-manifest-brand-slots');
if (!gameManifest.tournament_brand_replaceable) errors.push('game-manifest-brand-replaceable');
if (!gameManifest.android_visual_viewport_calibration || !gameManifest.android_safe_area_calibration) errors.push('game-manifest-device-calibration');
if (gameManifest.apk_version_name !== '0.1.0-rc1' || gameManifest.apk_version_code !== 1) errors.push('apk-version-lock');
if (gameManifest.release_ready || gameManifest.force_update || gameManifest.show_update_prompt || !gameManifest.manual_update_only) errors.push('apk-update-policy');

if (androidRelease.protectedAndroidAuthority !== 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK') errors.push('release-phase365-authority');
if (!androidRelease.androidExperience?.sticksHiddenAfterJoin) errors.push('release-sticks-hidden');
if (!androidRelease.androidExperience?.transparentUnframedPot) errors.push('release-clean-pot');
if (!androidRelease.androidExperience?.brandSlotReplaceableForTournaments) errors.push('release-brand-slot');
if (!androidRelease.androidExperience?.visualViewportCalibration || !androidRelease.androidExperience?.safeAreaCalibration) errors.push('release-device-calibration');
if (androidRelease.releaseReady || androidRelease.forceUpdate || androidRelease.showUpdatePrompt || !androidRelease.manualUpdateOnly) errors.push('release-apk-policy');

if (currentRelease.phase !== 374 || currentRelease.build !== 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK') errors.push('current-release-phase');
if (currentRelease.androidEntry !== '/game/android.html?channel=stable&v=phase374') errors.push('current-release-web-entry');
if (!currentRelease.android?.singleJoinControl || !currentRelease.android?.leaveRestoresJoin) errors.push('current-release-join-flow');
if (!currentRelease.android?.physicalOwnerRetestRequired) errors.push('current-release-physical-truth');

if (!/live avatar camera|showroom|profile.*avatar|avatar.*profile/i.test(profile)) errors.push('profile-showroom-marker');
if (!/dressing|wardrobe|avatar/i.test(avatar)) errors.push('website-dressing-room-marker');
if (!/PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK/.test(profileCamera)) errors.push('phase366-profile-camera-marker');
if (!/WebXR|dressing|pedestal|avatar/i.test(avatarVr)) errors.push('vr-dressing-room-marker');

const result = {
  build: 'PHASE-365-PROTECTED-BY-PHASE-374',
  filesChecked: 12,
  currentRelease: currentRelease.phase,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);