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
  calibration: 'game/modules/phase366_android_device_calibration_avatar_showroom_continuity_lock.js',
  platform: 'game/modules/phase340_platform_manifest.js',
  android: 'game/android.html',
  manifest: 'game/manifest.json',
  release: 'game/android-release.json',
  profile: 'site/profile.html',
  camera: 'site/js/phase366-profile-live-camera-continuity.js',
  avatarVr: 'game/avatar-vr.html'
};
for (const file of Object.values(files)) if (!exists(file)) errors.push(`missing-file:${file}`);

const calibration = read(files.calibration);
const platform = read(files.platform);
const android = read(files.android);
const manifest = JSON.parse(read(files.manifest));
const release = JSON.parse(read(files.release));
const profile = read(files.profile);
const camera = read(files.camera);
const avatarVr = read(files.avatarVr);

requireText(calibration, 'PHASE-366-ANDROID-DEVICE-CALIBRATION-AVATAR-LIVE-CAMERA-LOCK', 'calibration-build');
requireText(calibration, "const STORAGE_KEY = 'svr.phase366.androidCalibration.v1'", 'local-storage-key');
requireText(calibration, 'tableYOffset', 'table-calibration');
requireText(calibration, 'seatDistanceOffset', 'seat-distance-calibration');
requireText(calibration, 'seatHeightOffset', 'seat-height-calibration');
requireText(calibration, 'hudScale', 'hud-scale-calibration');
requireText(calibration, 'potOpacity', 'pot-opacity-calibration');
requireText(calibration, 'potScale', 'pot-scale-calibration');
requireText(calibration, 'gyroSensitivity', 'gyro-calibration');
requireText(calibration, 'avatarRadialOffset', 'avatar-radial-calibration');
requireText(calibration, 'avatarHeightOffset', 'avatar-height-calibration');
requireText(calibration, 'window.SVR_PHASE365_ALIGN_TABLE?.()', 'phase365-table-baseline');
requireText(calibration, 'window.SVR_PHASE365_STABILIZE_SEAT?.()', 'phase365-seat-baseline');
requireText(calibration, 'window.SVR_PHASE366_SET_CALIBRATION', 'calibration-set-api');
requireText(calibration, 'window.SVR_PHASE366_RESET', 'calibration-reset-api');
requireText(calibration, 'window.SVR_PHASE366_EXPORT_CALIBRATION', 'calibration-export-api');
requireText(calibration, 'body.svr365-seated #svr366CalibrationButton', 'calibration-hidden-while-seated');
forbidText(calibration, 'state.pot =', 'no-poker-pot-mutation');
forbidText(calibration, 'players[', 'no-player-bankroll-mutation');

requireText(platform, "export const VERSION = 'phase366'", 'platform-version');
requireText(platform, "'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js',\n  'modules/phase366_android_device_calibration_avatar_showroom_continuity_lock.js'", 'successor-order');
requireText(platform, 'phase366-android-calibration-not-last', 'android-last-validator');
requireText(platform, "'modules/phase366_android_device_calibration_avatar_showroom_continuity_lock.js'", 'platform-calibration-entry');

requireText(android, 'data-build="PHASE-366-ANDROID-DEVICE-CALIBRATION-AVATAR-LIVE-CAMERA-LOCK"', 'android-build');
requireText(android, 'phase366_android_device_calibration_avatar_showroom_continuity_lock.js?v=phase366', 'android-calibration-import');
requireText(android, "apkVersionName:'0.1.0-rc1'", 'android-apk-version');
requireText(android, 'forceUpdate:false,showUpdatePrompt:false,manualUpdateOnly:true', 'android-update-policy');

if (manifest.phase !== 366) errors.push('manifest-phase');
if (manifest.start_url !== './android.html?channel=stable&v=phase366') errors.push('manifest-start-url');
if (!manifest.android_device_calibration) errors.push('manifest-calibration');
if (manifest.android_device_calibration_storage !== 'local-device-only') errors.push('manifest-calibration-scope');
if (!manifest.profile_live_avatar_camera_current || !manifest.shared_avatar_profile_record) errors.push('manifest-avatar-continuity');
if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('manifest-apk-version');
if (manifest.release_ready || manifest.force_update || manifest.show_update_prompt || !manifest.manual_update_only) errors.push('manifest-apk-policy');

if (release.webEntry !== '/game/android.html?channel=stable&v=phase366') errors.push('release-web-entry');
if (!release.deviceCalibration?.enabled || release.deviceCalibration?.scope !== 'local-device-only') errors.push('release-calibration');
if (release.deviceCalibration?.doesNotModifyPokerState !== true) errors.push('release-poker-isolation');
if (!release.avatarProfileProtection?.liveProfileCameraContinuity || !release.avatarProfileProtection?.sharedAvatarProfileRecord) errors.push('release-avatar-continuity');
if (release.apkVersionName !== '0.1.0-rc1' || release.apkVersionCode !== 1) errors.push('release-apk-version');
if (release.releaseReady || release.forceUpdate || release.showUpdatePrompt || !release.manualUpdateOnly) errors.push('release-apk-policy');

requireText(profile, 'PHASE-366-PROFILE-AVATAR-LIVE-CAMERA-CONTINUITY-LOCK', 'profile-build');
requireText(profile, 'phase366-profile-live-camera-continuity.js?v=phase366', 'profile-camera-loader');
requireText(profile, '../game/avatar-vr.html?v=phase366', 'profile-vr-room-route');
requireText(profile, '../game/android.html?channel=stable&v=phase366', 'profile-android-route');
requireText(camera, 'SVR_PHASE366_PROFILE_CAMERA_REFRESH', 'profile-camera-refresh');
requireText(camera, "window.addEventListener('storage'", 'cross-page-storage-refresh');
requireText(camera, "window.addEventListener('svr:avatar-saved'", 'avatar-save-refresh');
requireText(camera, '/site/avatar.html?v=phase366', 'website-dressing-route');
requireText(camera, '/game/avatar-vr.html?v=phase366', 'vr-dressing-route');
requireText(avatarVr, 'PHASE-366-VR-DRESSING-ROOM-PROFILE-LIVE-CAMERA-CONTINUITY-LOCK', 'vr-room-continuity-build');
requireText(avatarVr, '/site/profile.html?v=phase366', 'vr-room-profile-route');

const result = {
  build: 'PHASE-366-ANDROID-DEVICE-CALIBRATION-AVATAR-LIVE-CAMERA-LOCK',
  filesChecked: Object.keys(files).length,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
