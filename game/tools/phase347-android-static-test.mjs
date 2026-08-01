import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('game/modules/phase347_android_single_controller_seated_gameplay_apk_release_lock.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const checker = read('app-update-checker.js');
const androidPage = read('site/android/index.html');
const downloadsPage = read('site/downloads/index.html');
const release = JSON.parse(read('game/android-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));
const errors = [];

function requireText(source, needle, label) {
  if (!source.includes(needle)) errors.push(label);
}

requireText(runtime, "const rightAmount = moveStick.x;", 'lobby-horizontal-direction');
requireText(runtime, 'seatX += moveStick.x', 'seated-horizontal-direction');
if (runtime.includes('const rightAmount = -moveStick.x') || runtime.includes('seatX -= moveStick.x')) errors.push('horizontal-inversion-returned');
requireText(runtime, "#svr326Root", 'legacy-controller-hidden');
requireText(runtime, "PHASE347_ANDROID_CAMERA_CARD_OVERLAY", 'floating-card-overlay');
requireText(runtime, "PHASE347_ANDROID_CENTER_LOGO_ROOT", 'android-logo');
requireText(runtime, "PHASE347_ANDROID_RAISED_TRANSLUCENT_POT_DISPLAY", 'raised-pot');
requireText(runtime, "Array.from({ length: 5 }", 'five-community-slots');
requireText(runtime, 'data-hole="0"', 'hole-slot-zero');
requireText(runtime, 'data-hole="1"', 'hole-slot-one');
requireText(runtime, "window.SVR_PHASE347_RUN_FULL_HAND_QA", 'full-hand-qa');
requireText(platform, "phase347_android_single_controller_seated_gameplay_apk_release_lock.js", 'platform-module');
requireText(checker, 'current.releaseReady && current.apkUrl && current.apkVersionCode > installed', 'conditional-apk-menu');
requireText(androidPage, 'm.releaseReady===true&&m.apkUrl', 'android-page-conditional-download');
requireText(downloadsPage, 'm.releaseReady===true&&m.apkUrl', 'downloads-page-conditional-download');

const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 347) errors.push('platform-version-regressed');
if (Number(manifest.phase || 0) < 347) errors.push('manifest-phase-regressed');
if (!String(manifest.build || '').startsWith('PHASE-')) errors.push('manifest-build-missing');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-update-policy');
if (!String(release.currentGameBuild || '').startsWith('PHASE-')) errors.push('release-build-missing');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-update-policy');
if (release.releaseReady !== false || release.apkUrl !== '') errors.push('unverified-apk-exposed');
if (release.apkVersionCode !== 1 || release.nextApkVersionCode !== 2) errors.push('apk-version-gate');

const controllerIndex = platform.indexOf('phase347_android_single_controller_seated_gameplay_apk_release_lock.js');
const accountIndex = platform.indexOf('phase345_player_account_activity_bridge.js');
if (controllerIndex < 0 || (accountIndex >= 0 && controllerIndex > accountIndex)) errors.push('controller-load-order-regressed');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK',
  currentBuild: release.currentGameBuild,
  platformVersion,
  controller: 'single-visible-authority',
  horizontalInput: 'direct',
  cards: { hole: 2, community: 5, floating: 7 },
  apk: { current: release.apkVersionName, currentCode: release.apkVersionCode, next: release.nextApkVersionName, nextCode: release.nextApkVersionCode, releaseReady: release.releaseReady }
}, null, 2));
