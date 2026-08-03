import fs from 'node:fs';
import process from 'node:process';

const read = (path) => fs.readFileSync(path, 'utf8');
const errors = [];
const requiredFiles = [
  'game/modules/phase366_android_physical_device_viewport_acceptance_lock.js',
  'site/js/phase366-profile-live-camera-lock.js',
  'site/css/phase366-profile-live-camera.css',
  'site/profile.html',
  'game/android.html',
  'game/modules/phase340_platform_manifest.js',
  'game/manifest.json',
  'game/android-release.json'
];
for (const file of requiredFiles) if (!fs.existsSync(file)) errors.push(`missing:${file}`);

const device = read(requiredFiles[0]);
const camera = read(requiredFiles[1]);
const cameraCss = read(requiredFiles[2]);
const profile = read(requiredFiles[3]);
const android = read(requiredFiles[4]);
const platform = read(requiredFiles[5]);
const manifest = JSON.parse(read(requiredFiles[6]));
const release = JSON.parse(read(requiredFiles[7]));
const requireText = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };

for (const token of [
  'PHASE-366-ANDROID-PHYSICAL-DEVICE-PROFILE-LIVE-CAMERA-LOCK',
  'visualViewport',
  '--svr366-vh',
  'safe-area-inset-bottom',
  'requestStabilization',
  'SVR_PHASE365_STABILIZE_SEAT',
  'SVR_PHASE366_DEVICE_QA',
  'controllerRoots === 1',
  'visibleNavigationWhileSeated === 0'
]) requireText(device, token, `device-${token}`);

for (const token of [
  "new Set(['full', 'portrait', 'outfit', 'orbit'])",
  'svr366-live-camera-toolbar',
  'SVR_PHASE351_PROFILE_SHOWROOM_RETRY',
  'SVR_PHASE366_PROFILE_CAMERA_QA',
  'SVR_PHASE366_PROFILE_CAMERA_SET',
  'avatar-vr.html?v=phase353',
  'avatar.html?v=phase366'
]) requireText(camera, token, `camera-${token}`);

for (const token of ['svr366-camera-portrait', 'svr366-camera-outfit', 'svr366-live-orbit', 'svr366-live-camera-badge']) requireText(cameraCss, token, `css-${token}`);
for (const token of [
  'data-build="PHASE-366-ANDROID-PHYSICAL-DEVICE-PROFILE-LIVE-CAMERA-LOCK"',
  'phase366-profile-live-camera.css?v=phase366',
  'phase366-profile-live-camera-lock.js?v=phase366',
  'VR Dressing Room',
  'profile.html?v=phase366'
]) requireText(profile, token, `profile-${token}`);
for (const token of [
  'data-build="PHASE-366-ANDROID-PHYSICAL-DEVICE-PROFILE-LIVE-CAMERA-LOCK"',
  'phase366_android_physical_device_viewport_acceptance_lock.js?v=phase366',
  'SVR_PHASE366_DEVICE_CALIBRATE'
]) requireText(android, token, `android-${token}`);
requireText(platform, "export const VERSION = 'phase366'", 'platform-version');
requireText(platform, "'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js',\n  'modules/phase366_android_physical_device_viewport_acceptance_lock.js'", 'platform-order');
requireText(platform, 'phase366-android-device-acceptance-not-last', 'platform-last-check');

if (manifest.phase !== 366 || manifest.build !== 'PHASE-366-ANDROID-PHYSICAL-DEVICE-PROFILE-LIVE-CAMERA-LOCK') errors.push('manifest-build');
if (!manifest.android_visual_viewport_calibration || !manifest.android_safe_area_calibration) errors.push('manifest-device-calibration');
if (!manifest.profile_live_camera || manifest.profile_camera_modes?.length !== 4) errors.push('manifest-profile-camera');
if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('manifest-apk-version');
if (manifest.release_ready || manifest.force_update || manifest.show_update_prompt || !manifest.manual_update_only) errors.push('manifest-apk-policy');

if (release.currentGameBuild !== manifest.build || release.webEntry !== '/game/android.html?channel=stable&v=phase366') errors.push('release-build-route');
if (!release.androidExperience?.visualViewportCalibration || !release.androidExperience?.safeAreaCalibration) errors.push('release-device-calibration');
if (release.avatarProfileProtection?.liveProfileCameraModes?.length !== 4) errors.push('release-profile-camera-modes');
if (release.releaseReady || release.forceUpdate || release.showUpdatePrompt || !release.manualUpdateOnly) errors.push('release-apk-policy');

const result = {
  build: manifest.build,
  pass: errors.length === 0,
  errors,
  android: {
    singleControllerProtected: true,
    viewportCalibration: manifest.android_visual_viewport_calibration,
    safeAreaCalibration: manifest.android_safe_area_calibration,
    orientationStabilization: manifest.android_orientation_stabilization_debounced
  },
  profile: {
    liveCamera: manifest.profile_live_camera,
    modes: manifest.profile_camera_modes,
    websiteDressingRoom: manifest.website_dressing_room,
    vrDressingRoom: manifest.vr_dressing_room
  },
  apkLocked: true
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
