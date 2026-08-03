import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('game/modules/phase347_android_single_controller_seated_gameplay_apk_release_lock.js');
const recovery = read('game/modules/phase356_android_real_device_freeze_recovery_lock.js');
const engine = read('game/modules/phase336_authoritative_engine.js');
const handDriver = read('game/modules/phase355_android_full_hand_driver_compatibility_lock.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const checker = read('app-update-checker.js');
const androidPage = read('site/android/index.html');
const downloadsPage = read('site/downloads/index.html');
const release = JSON.parse(read('game/android-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(label); };

need(runtime, 'const rightAmount = moveStick.x;', 'lobby-horizontal-direction');
need(runtime, 'seatX += moveStick.x', 'seated-horizontal-direction');
if (runtime.includes('const rightAmount = -moveStick.x') || runtime.includes('seatX -= moveStick.x')) errors.push('horizontal-inversion-returned');
for (const [token, label] of [
  ['#svr326Root', 'legacy-controller-hidden'],
  ['PHASE347_ANDROID_CAMERA_CARD_OVERLAY', 'floating-card-overlay'],
  ['PHASE347_ANDROID_CENTER_LOGO_ROOT', 'android-logo'],
  ['PHASE347_ANDROID_RAISED_TRANSLUCENT_POT_DISPLAY', 'raised-pot'],
  ['Array.from({ length: 5 }', 'five-community-slots'],
  ['data-hole="0"', 'hole-slot-zero'],
  ['data-hole="1"', 'hole-slot-one'],
  ['window.SVR_PHASE347_RUN_FULL_HAND_QA', 'full-hand-qa']
]) need(runtime, token, label);
for (const [token, label] of [
  ["window.SVR_POKER_QA_PASSIVE_BOTS === true", 'acceptance-passive-bot-engine-gate'],
  ["return needed ? 'call' : 'check'", 'acceptance-passive-bot-policy'],
  ["const delay = qa ? 35", 'acceptance-fast-bot-delay']
]) need(engine, token, label);
for (const [token, label] of [
  ['window.SVR_PHASE344_RUN_FULL_HAND_QA = driveHand', 'phase344-driver-compatibility'],
  ['window.SVR_POKER_QA_PASSIVE_BOTS = true', 'driver-enables-passive-bots'],
  ['delete window.SVR_POKER_QA_PASSIVE_BOTS', 'driver-removes-passive-bot-flag'],
  ['window.SVR_POKER_QA_PASSIVE_BOTS = previousPassiveMode', 'driver-restores-passive-bot-flag'],
  ['window.SVR_PHASE362_CONSTANTS?.TABLE_BANKROLL', 'table-policy-aware-chip-conservation'],
  ['totalStacks === tableBankroll', 'dynamic-hand-driver-chip-conservation'],
  ["['preflop', 'flop', 'turn', 'river', 'showdown']", 'hand-driver-all-streets'],
  ['activeRecord = makeRecord(result.attempts + 1)', 'retry-record-recreation']
]) need(handDriver, token, label);

for (const [token, label] of [
  ['const DEVICE_ALIGNMENT =', 'phase364-device-array'],
  ['phase364_device_xr_geometry_spawn_lock.js', 'phase364-device-alignment-module'],
  ['const ANDROID_FOUNDATION = [', 'android-foundation-array'],
  ['...DEVICE_ALIGNMENT,', 'device-alignment-before-android-recovery'],
  ['phase356_android_real_device_freeze_recovery_lock.js', 'phase356-recovery-module'],
  ['const ANDROID_FINAL = [', 'android-final-array'],
  ['phase347_android_single_controller_seated_gameplay_apk_release_lock.js', 'platform-controller-module'],
  ['phase355_android_full_hand_driver_compatibility_lock.js', 'platform-hand-driver'],
  ['phase350_android_controller_dom_deduplication_lock.js', 'platform-dedupe-module'],
  ['phase365_android_seated_ux_branding_gyro_alignment_lock.js', 'platform-phase365-repair-module'],
  ["if (value === 'android') return unique([...REGISTRY, ...ANDROID_FOUNDATION, ...ANDROID_POKER, ...ANDROID_FINAL]);", 'android-critical-runtime-assembly'],
  ['const ANDROID_DEFERRED = []', 'android-background-work-disabled'],
  ['phase365-android-critical-load-order', 'phase365-critical-order-validator'],
  ['phase365-android-seated-ux-not-last', 'phase365-last-validator'],
  ['phase365-android-background-deferred-work', 'zero-deferred-error-label']
]) need(platform, token, label);

const foundation = platform.split('const ANDROID_FOUNDATION = [')[1]?.split('];')[0] || '';
if (foundation.indexOf('...DEVICE_ALIGNMENT') < 0 || foundation.indexOf('phase356_android_real_device_freeze_recovery_lock.js') <= foundation.indexOf('...DEVICE_ALIGNMENT')) errors.push('device-alignment-not-before-recovery');
const final = platform.split('const ANDROID_FINAL = [')[1]?.split('];')[0] || '';
const finalOrder = [
  'phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
  'phase355_android_full_hand_driver_compatibility_lock.js',
  'phase350_android_controller_dom_deduplication_lock.js',
  'phase365_android_seated_ux_branding_gyro_alignment_lock.js'
].map((token) => final.indexOf(token));
if (!finalOrder.every((index) => index >= 0) || !finalOrder.every((index, position) => position === 0 || index > finalOrder[position - 1])) errors.push('android-final-authority-order');

for (const [token, label] of [
  ['PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'lightweight-table-avatars'],
  ['inspected < 240', 'bounded-scene-inspection'],
  ['gap > 1800', 'frame-gap-watchdog'],
  ['window.SVR_PHASE356_ENTER_LOW_POWER', 'low-power-recovery']
]) need(recovery, token, label);
need(checker, 'current.releaseReady && current.apkUrl && current.apkVersionCode > installed', 'conditional-apk-menu');
need(androidPage, 'm.releaseReady===true&&m.apkUrl', 'android-page-conditional-download');
need(downloadsPage, 'm.releaseReady===true&&m.apkUrl', 'downloads-page-conditional-download');

const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 347 || Number(manifest.phase || 0) < 347) errors.push('platform-or-manifest-version-regressed');
if (!String(manifest.build || '').startsWith('PHASE-')) errors.push('manifest-build-missing');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-update-policy');
if (release.protectedAuthorities?.androidController !== 'PHASE-347') errors.push('protected-android-controller-changed');
if (release.controllerAuthority !== 'PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK') errors.push('controller-authority-record-changed');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-update-policy');
if (release.releaseReady !== false || release.apkUrl !== '') errors.push('unverified-apk-exposed');
if (release.apkVersionCode !== 1 || release.nextApkVersionCode !== 2) errors.push('apk-version-gate');
if (Number(manifest.phase || 0) >= 356 && release.realDeviceValidation?.pending !== true) errors.push('real-device-validation-must-remain-pending');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK',
  successorWebBuild: manifest.build,
  platformVersion,
  controller: 'single-visible-phase347-authority-repaired-by-phase365',
  horizontalInput: 'direct',
  deviceAlignmentBeforeRecovery: true,
  zeroDeferredWork: true,
  apk: { current: release.apkVersionName, currentCode: release.apkVersionCode, nextCode: release.nextApkVersionCode, releaseReady: release.releaseReady }
}, null, 2));
