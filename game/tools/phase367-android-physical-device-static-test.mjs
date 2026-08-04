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
  runtime: 'game/modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js',
  platform: 'game/modules/phase340_platform_manifest.js',
  android: 'game/android.html',
  manifest: 'game/manifest.json',
  release: 'game/android-release.json',
  phase374Release: 'game/phase374-release.json',
  phase374Table: 'game/modules/phase374_original_table_authority_lock.js',
  phase374Ui: 'game/modules/phase374_android_tournament_card_ui_lock.js',
  profile: 'site/profile.html',
  profileWatchdog: 'site/js/phase366-profile-live-camera-watchdog.js',
  avatarVr: 'game/avatar-vr.html'
};
for (const file of Object.values(files)) if (!exists(file)) errors.push(`missing-file:${file}`);

const runtime = read(files.runtime);
const platform = read(files.platform);
const android = read(files.android);
const manifest = JSON.parse(read(files.manifest));
const release = JSON.parse(read(files.release));
const phase374Release = JSON.parse(read(files.phase374Release));
const phase374Table = read(files.phase374Table);
const phase374Ui = read(files.phase374Ui);
const profile = read(files.profile);
const profileWatchdog = read(files.profileWatchdog);
const avatarVr = read(files.avatarVr);

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

requireText(android, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'android-current-build');
requireText(android, 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK', 'android-protected-build');
requireText(android, 'phase367_android_physical_device_viewport_touch_acceptance_lock.js?v=phase374', 'android-runtime-import');
requireText(android, 'phase374_original_table_authority_lock.js?v=phase374', 'phase374-original-table-import');
requireText(android, 'phase374_android_tournament_card_ui_lock.js?v=phase374', 'phase374-tournament-ui-import');
requireText(android, "apkVersionName:'0.1.0-rc1'", 'apk-version');
requireText(android, 'forceUpdate:false,showUpdatePrompt:false,manualUpdateOnly:true', 'apk-policy');

if (manifest.phase !== 374) errors.push('manifest-phase');
if (manifest.start_url !== './android.html?channel=stable&v=phase374') errors.push('manifest-start-url');
if (!manifest.android_visual_viewport_calibration || !manifest.android_safe_area_calibration) errors.push('manifest-viewport-safe-area');
if (manifest.android_orientation_stabilization_minimum_interval_ms !== 900) errors.push('manifest-stabilization-interval');
if (!manifest.android_device_layer_creates_no_new_movement_controls) errors.push('manifest-no-new-movement-controls');
if (!manifest.android_sticks_hidden_while_seated) errors.push('manifest-seated-stick-policy');
if (!manifest.android_tournament_logo_slot || manifest.android_tournament_logo_default !== '/logo.png') errors.push('manifest-tournament-logo');
if (manifest.android_card_rank_t_display !== '10' || !manifest.android_card_center_suit) errors.push('manifest-card-layout');
if (manifest.profile_live_camera_build !== 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK') errors.push('manifest-profile-build');
if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('manifest-apk-version');
if (manifest.release_ready || manifest.force_update || manifest.show_update_prompt || !manifest.manual_update_only) errors.push('manifest-apk-policy');

if (release.protectedAndroidAuthority !== 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK') errors.push('release-phase365-authority');
if (release.physicalDeviceAuthority !== 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK') errors.push('release-phase367-authority');
if (!release.androidExperience?.visualViewportCalibration || !release.androidExperience?.safeAreaCalibration) errors.push('release-device-calibration');
if (!release.androidExperience?.createsNoNewControls) errors.push('release-no-new-controls');
if (release.avatarProfileProtection?.profileReliabilityBuild !== 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK') errors.push('release-profile-protection');
if (release.releaseReady || release.forceUpdate || release.showUpdatePrompt || !release.manualUpdateOnly) errors.push('release-apk-policy');

if (phase374Release.phase !== 374 || phase374Release.androidEntry !== '/game/android.html?channel=stable&v=phase374') errors.push('phase374-release-route');
if (!phase374Release.android?.singleJoinControl || !phase374Release.android?.leaveRestoresJoin) errors.push('phase374-join-policy');
if (!phase374Release.quest?.seatedTeleportBlocked || !phase374Release.quest?.tableForcedVisible) errors.push('phase374-quest-policy');
requireText(phase374Table, 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'phase374-table-build');
requireText(phase374Ui, 'PHASE-374-ANDROID-TOURNAMENT-CARD-UI-LOCK', 'phase374-ui-build');
requireText(phase374Ui, "if (rank === 'T')", 'ten-expansion');
requireText(phase374Ui, 'svr374-card-corner top', 'top-card-corner');
requireText(phase374Ui, 'svr374-card-corner bottom', 'bottom-card-corner');
requireText(phase374Ui, '#svr374TournamentLogo', 'tournament-logo');
requireText(phase374Ui, 'body.svr374-seated #svr347Move', 'seated-move-hide');

requireText(profile, 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK', 'profile-phase366-marker');
requireText(profileWatchdog, 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK', 'watchdog-phase366-marker');
requireText(avatarVr, 'phase366', 'vr-room-phase366-route');

const result = {
  build: 'PHASE-367-PROTECTED-BY-PHASE-374',
  filesChecked: Object.keys(files).length,
  currentRelease: manifest.build,
  originalTable: manifest.table_asset_primary,
  tournamentLogo: manifest.android_tournament_logo_default,
  cardTenDisplay: manifest.android_card_rank_t_display,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
