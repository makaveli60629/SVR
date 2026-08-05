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
const manifestPath = 'game/modules/phase340_platform_manifest.js';
const androidRedirectPath = 'game/android.html';
const androidStablePath = 'game/android-stable.html';
const gameManifestPath = 'game/manifest.json';
const releasePath = 'game/android-release.json';
const profileCameraPath = 'site/js/phase366-profile-live-camera-watchdog.js';

for (const file of [modulePath, successorPath, manifestPath, androidRedirectPath, androidStablePath, gameManifestPath, releasePath, 'site/profile.html', 'site/avatar.html', profileCameraPath, 'game/avatar-vr.html']) {
  if (!exists(file)) errors.push(`missing-file:${file}`);
}

const moduleSource = read(modulePath);
const successorSource = read(successorPath);
const platformManifest = read(manifestPath);
const androidRedirect = read(androidRedirectPath);
const androidStable = read(androidStablePath);
const gameManifest = JSON.parse(read(gameManifestPath));
const androidRelease = JSON.parse(read(releasePath));
const profile = read('site/profile.html');
const avatar = read('site/avatar.html');
const profileCamera = read(profileCameraPath);
const avatarVr = read('game/avatar-vr.html');

// Preserve the optional 3D Android seated/gyro implementation.
requireText(moduleSource, 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK', 'module-build');
requireText(moduleSource, 'const TABLE_LINE_OFFSET = 0.065', 'table-reference-line-offset');
requireText(moduleSource, 'body.svr365-seated #svr347Move,body.svr365-seated #svr347Look', 'seated-sticks-hidden-css');
requireText(moduleSource, "window.addEventListener('deviceorientation'", 'gyro-listener');
requireText(moduleSource, 'DeviceOrientationEvent.requestPermission', 'gyro-permission');
requireText(moduleSource, 'camera.position.lerp(target', 'seated-camera-damping');
requireText(moduleSource, 'PHASE365_ANDROID_CLEAN_POT_DISPLAY', 'clean-pot-authority');
requireText(moduleSource, 'SVR_ANDROID_BRAND_SLOT', 'legacy-brand-slot');
requireText(moduleSource, 'SVR_PHASE365_SET_BRAND', 'legacy-replaceable-brand-api');
requireText(moduleSource, 'PHASE365_BRANDED_CARD_BACK_TEXTURE', 'legacy-card-back-branding');
requireText(moduleSource, 'PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'existing-avatar-authority-reused');
forbidText(moduleSource, "new THREE.Group();\n  group.name = 'PHASE365_ANDROID_LIGHTWEIGHT_TABLE_AVATARS'", 'duplicate-avatar-group');

requireText(successorSource, 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK', 'phase367-build');
requireText(successorSource, 'window.visualViewport', 'visual-viewport');
requireText(successorSource, 'window.SVR_PHASE365_STABILIZE_SEAT?.()', 'phase365-seat-authority-reused');
requireText(platformManifest, "export const VERSION = 'phase367'", 'optional-3d-platform-version');
requireText(platformManifest, "'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js',\n  'modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js'", 'phase365-before-phase367');

// Phase 380 canonical Android path is deliberately standalone and seated.
requireText(androidRedirect, 'android-stable.html?v=phase380', 'android-phase380-redirect');
requireText(androidStable, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK', 'android-build-label');
requireText(androidStable, 'JOIN NOW', 'android-join-now');
requireText(androidStable, 'id="brandSlot"', 'android-default-brand-slot');
requireText(androidStable, 'window.SVR_PHASE380_SET_BRAND', 'android-replaceable-brand-api');
requireText(androidStable, 'movementControlsWhileSeated:0', 'android-seated-controls-zero');
requireText(androidStable, 'function scoreFive(cards)', 'android-deterministic-evaluator');
requireText(androidStable, 'function burn()', 'android-burn-cards');
requireText(androidStable, 'POT $0', 'android-clean-pot');
forbidText(androidStable, 'phase368_card_dealer_animation_lock.js', 'android-heavy-dealer-excluded');

if (gameManifest.phase !== 380) errors.push('game-manifest-phase');
if (gameManifest.start_url !== './android-stable.html?v=phase380') errors.push('game-manifest-start-url');
if (gameManifest.table_reference_line_offset_meters !== 0.065) errors.push('game-manifest-table-line');
if (!gameManifest.android_sticks_hidden_while_seated || gameManifest.android_movement_controls_while_seated !== 0) errors.push('game-manifest-sticks-hidden');
if (!gameManifest.android_hud_brand_slot || !gameManifest.android_card_back_brand_slot) errors.push('game-manifest-brand-slots');
if (!gameManifest.tournament_brand_replaceable) errors.push('game-manifest-brand-replaceable');
if (!gameManifest.android_visual_viewport_calibration || !gameManifest.android_safe_area_calibration) errors.push('game-manifest-device-calibration');
if (gameManifest.apk_version_name !== '0.1.0-rc2' || gameManifest.apk_version_code !== 2) errors.push('apk-version-lock');
if (!gameManifest.release_ready || gameManifest.force_update || gameManifest.show_update_prompt || !gameManifest.manual_update_only) errors.push('apk-update-policy');

if (androidRelease.webEntry !== '/game/android-stable.html?v=phase380') errors.push('release-web-entry');
if (androidRelease.currentGameBuild !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK') errors.push('release-build');
if (!androidRelease.tablePolicy?.replaceableTournamentBrandSlot) errors.push('release-brand-slot');
if (!androidRelease.tablePolicy?.deterministicHandEvaluator || !androidRelease.tablePolicy?.burnCards) errors.push('release-poker-correctness');
if (!androidRelease.tablePolicy?.cardsHiddenBeforeJoin || !androidRelease.tablePolicy?.joinRequiredBeforeDeal) errors.push('release-prejoin-protection');
if (!androidRelease.releaseReady || androidRelease.forceUpdate || androidRelease.showUpdatePrompt || !androidRelease.manualUpdateOnly) errors.push('release-apk-policy');

if (!/live avatar camera|showroom|profile.*avatar|avatar.*profile/i.test(profile)) errors.push('profile-showroom-marker');
if (!/dressing|wardrobe|avatar/i.test(avatar)) errors.push('website-dressing-room-marker');
if (!/PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK/.test(profileCamera)) errors.push('phase366-profile-camera-marker');
if (!/WebXR|dressing|pedestal|avatar/i.test(avatarVr)) errors.push('vr-dressing-room-marker');

const result = {
  build: 'PHASE-365-REGRESSION-PROTECTED-BY-PHASE-380',
  filesChecked: 11,
  architecture: 'Phase 380 standalone seated Android with protected optional 3D modules',
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
