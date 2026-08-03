import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const errors = [];
const files = [
  'game/modules/phase367_android_physical_device_viewport_acceptance_lock.js',
  'game/android.html',
  'game/modules/phase340_platform_manifest.js',
  'game/manifest.json',
  'game/android-release.json',
  'site/profile.html',
  'game/avatar-vr.html'
];
for (const file of files) if (!fs.existsSync(file)) errors.push(`missing-file:${file}`);

const runtime = read(files[0]);
const android = read(files[1]);
const platform = read(files[2]);
const manifest = JSON.parse(read(files[3]));
const release = JSON.parse(read(files[4]));
const profile = read(files[5]);
const vrRoom = read(files[6]);
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(label); };

for (const [token, label] of [
  ['PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-ACCEPTANCE-LOCK', 'runtime-build'],
  ['window.visualViewport', 'visual-viewport'],
  ['--svr367-vh', 'viewport-height-variable'],
  ['safe-area-inset-bottom', 'safe-area-bottom'],
  ['requestStabilization', 'debounced-stabilization'],
  ['now - lastStabilizedAt < 900', 'stabilization-minimum-interval'],
  ['window.SVR_PHASE365_STABILIZE_SEAT', 'phase365-seat-stabilizer'],
  ["runtime.controllerRoots = $$('#svr347Root').length", 'real-controller-root-audit'],
  ["runtime.moveControls = $$('#svr347Move').length", 'move-audit'],
  ["runtime.lookControls = $$('#svr347Look').length", 'look-audit'],
  ['visibleNavigationWhileSeated', 'seated-navigation-audit'],
  ['moveTouches', 'move-touch-metric'],
  ['lookTouches', 'look-touch-metric'],
  ['actionTouches', 'action-touch-metric'],
  ['SVR_PHASE367_DEVICE_QA', 'runtime-qa'],
  ['SVR_PHASE367_DEVICE_CALIBRATE', 'manual-calibration'],
  ['SVR_PHASE367_DEVICE_STABILIZE', 'manual-stabilization']
]) need(runtime, token, label);

for (const [token, label] of [
  ['data-build="PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-ACCEPTANCE-LOCK"', 'android-build'],
  ['manifest.json?v=phase367', 'manifest-cache-key'],
  ['phase364_device_xr_geometry_spawn_lock.js?v=phase367', 'geometry-cache-key'],
  ['phase365_android_seated_ux_branding_gyro_alignment_lock.js?v=phase367', 'phase365-protection'],
  ['phase367_android_physical_device_viewport_acceptance_lock.js?v=phase367', 'phase367-runtime-load'],
  ['SVR_PHASE367_DEVICE_CALIBRATE', 'android-calibrate-call']
]) need(android, token, label);

for (const [token, label] of [
  ["export const VERSION = 'phase367'", 'platform-version'],
  ["'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js',\n  'modules/phase367_android_physical_device_viewport_acceptance_lock.js'", 'phase365-phase367-order'],
  ['phase367-android-critical-load-order', 'android-load-order-validator'],
  ['phase367-android-device-acceptance-not-last', 'android-final-validator'],
  ['phase367-android-background-deferred-work', 'zero-deferred-validator']
]) need(platform, token, label);

const finalBlock = platform.split('const ANDROID_FINAL = [')[1]?.split('];')[0] || '';
const phase365Index = finalBlock.indexOf('phase365_android_seated_ux_branding_gyro_alignment_lock.js');
const phase367Index = finalBlock.indexOf('phase367_android_physical_device_viewport_acceptance_lock.js');
if (phase365Index < 0 || phase367Index <= phase365Index) errors.push('android-final-order');
if (!finalBlock.trim().endsWith("'modules/phase367_android_physical_device_viewport_acceptance_lock.js'")) errors.push('phase367-not-final');

if (manifest.phase !== 367 || manifest.build !== 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-ACCEPTANCE-LOCK') errors.push('manifest-build');
if (manifest.start_url !== './android.html?channel=stable&v=phase367') errors.push('manifest-start-route');
if (!manifest.android_visual_viewport_calibration || !manifest.android_safe_area_calibration) errors.push('manifest-device-calibration');
if (!manifest.android_orientation_stabilization_debounced || manifest.android_orientation_stabilization_minimum_interval_ms !== 900) errors.push('manifest-stabilization');
if (!manifest.android_physical_touch_metrics) errors.push('manifest-touch-metrics');
if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('apk-version');
if (manifest.release_ready || manifest.force_update || manifest.show_update_prompt || !manifest.manual_update_only) errors.push('manifest-apk-policy');

if (release.currentGameBuild !== manifest.build || release.webEntry !== '/game/android.html?channel=stable&v=phase367') errors.push('release-build-route');
if (release.protectedAndroidAuthority !== 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK') errors.push('phase365-authority-changed');
if (release.protectedAuthorities?.profileLiveCameraReliability !== 'PHASE-366') errors.push('phase366-profile-authority-changed');
if (!release.androidExperience?.visualViewportCalibration || !release.androidExperience?.safeAreaCalibration) errors.push('release-device-calibration');
if (release.releaseReady || release.apkUrl !== '' || release.forceUpdate || release.showUpdatePrompt || !release.manualUpdateOnly) errors.push('release-apk-policy');
if (release.realDeviceValidation?.pending !== true) errors.push('physical-device-validation-not-pending');

if (!profile.includes('data-live-avatar-camera="phase366"') || !profile.includes('avatar-vr.html?v=phase366') || !profile.includes('avatar.html?v=phase366')) errors.push('profile-live-camera-not-protected');
if (!vrRoom.includes('PHASE-353-VR-AVATAR-DRESSING-ROOM-LIVE-PEDESTAL-LOCK')) errors.push('vr-room-not-protected');

const result = {
  pass: errors.length === 0,
  build: manifest.build,
  errors,
  protected: {
    controller: release.protectedAuthorities?.androidController,
    seatedUx: release.protectedAuthorities?.seatedUxBranding,
    profileCamera: release.protectedAuthorities?.profileLiveCameraReliability,
    vrDressingRoom: release.protectedAuthorities?.vrDressingRoom
  },
  apkLocked: true
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
