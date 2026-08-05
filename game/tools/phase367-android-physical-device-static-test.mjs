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

const files = {
  protectedRuntime: 'game/modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js',
  platform: 'game/modules/phase340_platform_manifest.js',
  androidRedirect: 'game/android.html',
  androidStable: 'game/android-stable.html',
  manifest: 'game/manifest.json',
  release: 'game/android-release.json',
  profile: 'site/profile.html',
  profileWatchdog: 'site/js/phase366-profile-live-camera-watchdog.js',
  avatarVr: 'game/avatar-vr.html'
};
for (const file of Object.values(files)) if (!exists(file)) errors.push(`missing-file:${file}`);

const runtime = read(files.protectedRuntime);
const platform = read(files.platform);
const androidRedirect = read(files.androidRedirect);
const androidStable = read(files.androidStable);
const manifest = JSON.parse(read(files.manifest));
const release = JSON.parse(read(files.release));
const profile = read(files.profile);
const profileWatchdog = read(files.profileWatchdog);
const avatarVr = read(files.avatarVr);

// Preserve the Phase 367 optional 3D calibration module as a regression surface.
requireText(runtime, "export const BUILD = 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK'", 'runtime-build');
requireText(runtime, 'window.visualViewport', 'visual-viewport');
requireText(runtime, '--svr367-vw', 'viewport-width-variable');
requireText(runtime, '--svr367-vh', 'viewport-height-variable');
requireText(runtime, 'env(safe-area-inset-top)', 'safe-area-top');
requireText(runtime, 'env(safe-area-inset-right)', 'safe-area-right');
requireText(runtime, 'env(safe-area-inset-bottom)', 'safe-area-bottom');
requireText(runtime, 'now - lastStabilizedAt < 900', 'stabilization-rate-limit');
requireText(runtime, 'window.SVR_PHASE365_STABILIZE_SEAT?.()', 'phase365-stabilizer-reuse');
requireText(runtime, "runtime.controllerRoots = $$('#svr347Root').length", 'controller-root-audit');
requireText(runtime, "runtime.moveControls = $$('#svr347Move').length", 'move-audit');
requireText(runtime, "runtime.lookControls = $$('#svr347Look').length", 'look-audit');
requireText(runtime, "runtime.actionPanels = $$('#svr347Actions').length", 'actions-audit');
requireText(runtime, "target.closest('#svr347Move')", 'move-touch-metric');
requireText(runtime, "target.closest('#svr347Look')", 'look-touch-metric');
requireText(runtime, '#svr347Actions,#svr363JoinControl,#svr357Ante,#svr347Raise', 'action-touch-metric');
requireText(runtime, 'window.SVR_PHASE367_DEVICE_QA', 'runtime-qa');
requireText(runtime, 'window.SVR_PHASE367_DEVICE_CALIBRATE', 'runtime-calibrate');
requireText(runtime, 'window.SVR_PHASE367_DEVICE_STABILIZE', 'runtime-stabilize');
forbidText(runtime, "document.createElement('button')", 'no-new-button');
forbidText(runtime, 'new THREE.', 'no-new-three-authority');
forbidText(runtime, 'state.pot =', 'no-pot-mutation');
forbidText(runtime, 'players[', 'no-player-mutation');

requireText(platform, "export const VERSION = 'phase367'", 'platform-version');
requireText(platform, "'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js',\n  'modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js'", 'android-successor-order');
requireText(platform, 'phase367-android-device-not-last', 'android-last-validator');
requireText(platform, "'modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js'", 'platform-entry');

// Current production authority is the Phase 380 standalone Android table.
requireText(androidRedirect, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK', 'protected-full-game-certification');
requireText(androidRedirect, 'android-stable.html?v=phase380', 'phase380-stable-redirect');
requireText(androidStable, 'data-build="PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK"', 'android-build');
requireText(androidStable, 'JOIN NOW', 'join-now');
requireText(androidStable, 'movementControlsWhileSeated:0', 'seated-movement-lock');
requireText(androidStable, 'visualViewport', 'standalone-visual-viewport');
requireText(androidStable, 'env(safe-area-inset-top)', 'standalone-safe-area');
requireText(androidStable, 'function scoreFive(cards)', 'standalone-evaluator');
requireText(androidStable, "logoUrl:'/logo.png'", 'standalone-logo');
forbidText(androidStable, 'phase367_android_physical_device_viewport_touch_acceptance_lock.js', 'heavy-3d-device-module-on-standalone');

if (manifest.phase !== 380) errors.push('manifest-phase380');
if (manifest.build !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK') errors.push('manifest-build');
if (manifest.start_url !== './android-stable.html?v=phase380') errors.push('manifest-start-url');
if (!manifest.android_visual_viewport_calibration || !manifest.android_safe_area_calibration) errors.push('manifest-viewport-safe-area');
if (!manifest.android_sticks_hidden_while_seated || manifest.android_movement_controls_while_seated !== 0) errors.push('manifest-seated-lock');
if (manifest.apk_version_name !== '0.1.0-rc2' || manifest.apk_version_code !== 2) errors.push('manifest-apk-version');
if (!manifest.release_ready || manifest.force_update || manifest.show_update_prompt || !manifest.manual_update_only) errors.push('manifest-apk-policy');
if (manifest.profile_live_camera_route !== '/site/profile.html?v=phase381') errors.push('manifest-profile-route');
if (manifest.quest_runtime_build !== 'PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK') errors.push('manifest-quest-successor');

if (release.webEntry !== '/game/android-stable.html?v=phase380') errors.push('release-web-entry');
if (release.currentGameBuild !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK') errors.push('release-build');
if (release.apkVersionName !== '0.1.0-rc2' || release.apkVersionCode !== 2) errors.push('release-apk-version');
if (!release.releaseReady || release.forceUpdate || release.showUpdatePrompt || !release.manualUpdateOnly) errors.push('release-apk-policy');
if (!release.tablePolicy?.joinRequiredBeforeDeal || !release.tablePolicy?.cardsHiddenBeforeJoin) errors.push('release-join-policy');
if (!release.tablePolicy?.deterministicHandEvaluator || !release.tablePolicy?.burnCards) errors.push('release-poker-policy');
if (!release.publicControls?.downloadApkVisible || !release.publicControls?.playAndroidVisible) errors.push('release-public-controls');

requireText(profile, 'PHASE-374-PROFILE-MOBILE-AVATAR-MENU-RECOVERY-LOCK', 'profile-phase374-marker');
requireText(profile, 'phase366-profile-live-camera-watchdog.js', 'profile-watchdog-import');
requireText(profileWatchdog, 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK', 'watchdog-phase366-marker');
requireText(avatarVr, 'phase374', 'vr-room-phase374-route');

const result = {
  build: 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK',
  protectedCalibrationBuild: 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK',
  questSuccessor: manifest.quest_runtime_build,
  filesChecked: Object.keys(files).length,
  architecture: 'Phase 380 standalone Android authority; Phase 367 optional 3D physical-device calibration preserved',
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
