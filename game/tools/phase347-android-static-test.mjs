import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('game/modules/phase347_android_single_controller_seated_gameplay_apk_release_lock.js');
const engine = read('game/modules/phase336_authoritative_engine.js');
const handDriver = read('game/modules/phase355_android_full_hand_driver_compatibility_lock.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const checker = read('app-update-checker.js');
const androidPage = read('site/android/index.html');
const downloadsPage = read('site/downloads/index.html');
const androidEntry = read('game/android.html');
const release = JSON.parse(read('game/android-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));
const errors = [];

function requireText(source, needle, label) {
  if (!source.includes(needle)) errors.push(label);
}

requireText(runtime, 'const rightAmount = moveStick.x;', 'lobby-horizontal-direction');
requireText(runtime, 'seatX += moveStick.x', 'seated-horizontal-direction');
if (runtime.includes('const rightAmount = -moveStick.x') || runtime.includes('seatX -= moveStick.x')) errors.push('horizontal-inversion-returned');
requireText(runtime, '#svr326Root', 'legacy-controller-hidden');
requireText(runtime, 'PHASE347_ANDROID_CAMERA_CARD_OVERLAY', 'floating-card-overlay');
requireText(runtime, 'PHASE347_ANDROID_CENTER_LOGO_ROOT', 'android-logo');
requireText(runtime, 'PHASE347_ANDROID_RAISED_TRANSLUCENT_POT_DISPLAY', 'raised-pot');
requireText(runtime, 'Array.from({ length: 5 }', 'five-community-slots');
requireText(runtime, 'data-hole="0"', 'hole-slot-zero');
requireText(runtime, 'data-hole="1"', 'hole-slot-one');
requireText(runtime, 'window.SVR_PHASE347_RUN_FULL_HAND_QA', 'full-hand-qa');
requireText(engine, 'window.SVR_POKER_QA_PASSIVE_BOTS === true', 'acceptance-passive-bot-engine-gate');
requireText(engine, "return needed ? 'call' : 'check'", 'acceptance-passive-bot-policy');
requireText(engine, 'const delay = qa ? 35', 'acceptance-fast-bot-delay');
requireText(handDriver, 'window.SVR_PHASE344_RUN_FULL_HAND_QA = driveHand', 'phase344-driver-compatibility');
requireText(handDriver, 'window.SVR_POKER_QA_PASSIVE_BOTS = true', 'driver-enables-passive-bots');
requireText(handDriver, 'delete window.SVR_POKER_QA_PASSIVE_BOTS', 'driver-removes-passive-bot-flag');
requireText(handDriver, 'window.SVR_POKER_QA_PASSIVE_BOTS = previousPassiveMode', 'driver-restores-passive-bot-flag');
requireText(handDriver, 'totalStacks === 6000', 'hand-driver-chip-conservation');
requireText(handDriver, "['preflop', 'flop', 'turn', 'river', 'showdown']", 'hand-driver-all-streets');
requireText(handDriver, 'activeRecord = makeRecord(result.attempts + 1)', 'retry-record-recreation');

for (const token of [
  'const ANDROID_FOUNDATION =',
  'const ANDROID_POKER =',
  'const ANDROID_FINAL =',
  'phase355_android_runtime_smoothness_hardening_lock.js',
  'phase355_android_poker_boot_order_lock.js',
  'phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
  'phase355_android_full_hand_driver_compatibility_lock.js',
  'phase350_android_controller_dom_deduplication_lock.js',
  "if (value === 'android') return unique([...REGISTRY, ...ANDROID_FOUNDATION, ...ANDROID_POKER, ...ANDROID_FINAL]);",
  'const order = [',
  "order.at(-1) !== normalized.length - 1",
  'phase355-android-critical-load-order',
  'const ANDROID_DEFERRED =',
  '...SHARED_SOCIAL'
]) requireText(platform, token, `platform-${token}`);

const androidFinalBlock = platform.slice(platform.indexOf('const ANDROID_FINAL ='), platform.indexOf('const ANDROID_DEFERRED ='));
const controllerIndex = androidFinalBlock.indexOf('phase347_android_single_controller_seated_gameplay_apk_release_lock.js');
const driverIndex = androidFinalBlock.indexOf('phase355_android_full_hand_driver_compatibility_lock.js');
const dedupeIndex = androidFinalBlock.indexOf('phase350_android_controller_dom_deduplication_lock.js');
if (!(controllerIndex >= 0 && driverIndex > controllerIndex && dedupeIndex > driverIndex)) errors.push('android-final-order');

requireText(checker, 'current.releaseReady && current.apkUrl && current.apkVersionCode > installed', 'conditional-apk-menu');
requireText(androidPage, 'm.releaseReady===true&&m.apkUrl', 'android-page-conditional-download');
requireText(downloadsPage, 'm.releaseReady===true&&m.apkUrl', 'downloads-page-conditional-download');

const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
const releasePhase = Number(String(release.currentGameBuild || '').match(/PHASE-(\d+)/)?.[1] || 0);
if (platformVersion < 347) errors.push('platform-version-regressed');
if (Number(manifest.phase || 0) < 347) errors.push('manifest-phase-regressed');
if (!String(manifest.build || '').startsWith('PHASE-')) errors.push('manifest-build-missing');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-update-policy');
if (releasePhase < 355) errors.push('android-release-build-regressed');
if (!String(release.webEntry || '').includes('v=phase355')) errors.push('android-release-web-entry');
if (!androidEntry.includes('PHASE-355-ANDROID-RUNTIME-SMOOTHNESS-HARDENING-LOCK')) errors.push('android-entry-build');
if (!androidEntry.includes('phase340_platform_core_loader.js?v=phase355')) errors.push('android-entry-loader');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-update-policy');
if (release.releaseReady !== false || release.apkUrl !== '') errors.push('unverified-apk-exposed');
if (release.apkVersionCode !== 1 || release.nextApkVersionCode !== 2) errors.push('apk-version-gate');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK',
  globalBuild: manifest.build,
  androidReleaseBuild: release.currentGameBuild,
  platformVersion,
  controller: 'single-visible-authority',
  horizontalInput: 'direct',
  qaBots: 'deterministic-check-call-only-during-acceptance',
  runtimeOrderValidation: 'android-critical-order-preserved-with-independent-later-platform-builds',
  cards: { hole: 2, community: 5, floating: 7 },
  apk: { current: release.apkVersionName, currentCode: release.apkVersionCode, next: release.nextApkVersionName, nextCode: release.nextApkVersionCode, releaseReady: release.releaseReady }
}, null, 2));
