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
requireText(engine, "window.SVR_POKER_QA_PASSIVE_BOTS === true", 'acceptance-passive-bot-engine-gate');
requireText(engine, "return needed ? 'call' : 'check'", 'acceptance-passive-bot-policy');
requireText(engine, "const delay = qa ? 35", 'acceptance-fast-bot-delay');
requireText(handDriver, "window.SVR_PHASE344_RUN_FULL_HAND_QA = driveHand", 'phase344-driver-compatibility');
requireText(handDriver, "window.SVR_POKER_QA_PASSIVE_BOTS = true", 'driver-enables-passive-bots');
requireText(handDriver, "delete window.SVR_POKER_QA_PASSIVE_BOTS", 'driver-removes-passive-bot-flag');
requireText(handDriver, "window.SVR_POKER_QA_PASSIVE_BOTS = previousPassiveMode", 'driver-restores-passive-bot-flag');
requireText(handDriver, "totalStacks === 6000", 'protected-hand-driver-chip-conservation');
requireText(handDriver, "['preflop', 'flop', 'turn', 'river', 'showdown']", 'hand-driver-all-streets');
requireText(handDriver, "activeRecord = makeRecord(result.attempts + 1)", 'retry-record-recreation');
requireText(platform, "phase356_android_real_device_freeze_recovery_lock.js", 'phase356-recovery-module');
requireText(platform, "phase347_android_single_controller_seated_gameplay_apk_release_lock.js", 'platform-module');
requireText(platform, "phase355_android_full_hand_driver_compatibility_lock.js", 'platform-hand-driver');
requireText(platform, "if (value === 'android') return unique([...REGISTRY, ...ANDROID_FOUNDATION, ...ANDROID_POKER, ...ANDROID_FINAL]);", 'android-critical-runtime-assembly');
requireText(platform, 'export function deferredManifestFor', 'android-deferred-runtime-export');
requireText(platform, 'const ANDROID_DEFERRED = []', 'android-background-work-disabled');
requireText(platform, "const recoveryIndex = normalized.findIndex", 'runtime-recovery-index');
requireText(platform, "const controllerIndex = normalized.findIndex", 'runtime-controller-index');
requireText(platform, "const handDriverIndex = normalized.findIndex", 'runtime-hand-driver-index');
requireText(platform, "const dedupeIndex = normalized.findIndex", 'runtime-dedupe-index');
requireText(platform, "mainIndex <= recoveryIndex", 'recovery-before-main-validator');
requireText(platform, "handDriverIndex <= controllerIndex", 'critical-order-validator');
requireText(platform, "dedupeIndex <= handDriverIndex", 'dedupe-after-driver-validator');
requireText(platform, "normalizedDeferred.length !== 0", 'zero-deferred-validator');
requireText(platform, "phase356-android-background-deferred-work", 'zero-deferred-error-label');
requireText(recovery, 'PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'lightweight-table-avatars');
requireText(recovery, 'inspected < 240', 'bounded-scene-inspection');
requireText(recovery, 'gap > 1800', 'frame-gap-watchdog');
requireText(recovery, 'window.SVR_PHASE356_ENTER_LOW_POWER', 'low-power-recovery');
requireText(checker, 'current.releaseReady && current.apkUrl && current.apkVersionCode > installed', 'conditional-apk-menu');
requireText(androidPage, 'm.releaseReady===true&&m.apkUrl', 'android-page-conditional-download');
requireText(downloadsPage, 'm.releaseReady===true&&m.apkUrl', 'downloads-page-conditional-download');

const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 347) errors.push('platform-version-regressed');
if (Number(manifest.phase || 0) < 347) errors.push('manifest-phase-regressed');
if (!String(manifest.build || '').startsWith('PHASE-')) errors.push('manifest-build-missing');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-update-policy');
const protectedAuthority = release.protectedAndroidAuthority || release.currentGameBuild;
if (protectedAuthority !== 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK') errors.push('protected-android-authority-changed');
if (Number(manifest.phase || 0) < 360 || !/^PHASE-(?:360|36[1-9]|3[7-9]\d)-/.test(String(manifest.build || ''))) errors.push('phase360-or-successor-build-missing');
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
  protectedAndroidAuthority: protectedAuthority,
  successorWebBuild: manifest.build,
  platformVersion,
  controller: 'single-visible-authority',
  horizontalInput: 'direct',
  qaBots: 'deterministic-check-call-mode-enabled-only-during-acceptance-and-restored-afterward',
  runtimeOrderValidation: 'phase356-recovery-before-main-critical-gameplay-and-driver-with-zero-background-deferred-work',
  avatars: 'five-lightweight-table-opponents-without-fbx-presence-downloads',
  cards: { hole: 2, community: 5, floating: 7 },
  apk: { current: release.apkVersionName, currentCode: release.apkVersionCode, next: release.nextApkVersionName, nextCode: release.nextApkVersionCode, releaseReady: release.releaseReady }
}, null, 2));
