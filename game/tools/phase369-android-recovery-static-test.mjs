import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const android = read('game/android.html');
const runtime = read('game/modules/phase369_android_join_table_freeze_recovery_lock.js');
const readiness = read('game/modules/phase369_android_join_readiness_transaction_lock.js');
const dealer = read('game/modules/phase368_card_dealer_animation_lock.js');
const release = JSON.parse(read('game/phase369-release.json'));

need(android, 'data-build="PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK"', 'phase367-certification-marker');
need(android, 'data-release="PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK"', 'phase369-release-marker');
need(android, 'window.SVR_REQUIRE_TABLE_JOIN=true', 'join-required');
need(android, "phase367_android_physical_device_viewport_touch_acceptance_lock.js?v=phase367", 'phase367-base-load');
need(android, "phase369_android_join_table_freeze_recovery_lock.js?v=phase369", 'phase369-base-load');
need(android, "phase369_android_join_readiness_transaction_lock.js?v=phase369", 'phase369-readiness-load');
need(android, 'const loadDealerLater=', 'dealer-deferred');
need(android, "requestIdleCallback(run,{timeout:5000})", 'idle-dealer-load');
need(android, "logoUrl:'/logo.png'", 'android-logo');
const phase367Index = android.indexOf('phase367_android_physical_device_viewport_touch_acceptance_lock.js');
const phase369Index = android.indexOf('phase369_android_join_table_freeze_recovery_lock.js');
const readinessIndex = android.indexOf('phase369_android_join_readiness_transaction_lock.js');
if (!(phase367Index >= 0 && phase369Index > phase367Index && readinessIndex > phase369Index)) errors.push('order:phase369-readiness-after-base');

need(runtime, "export const BUILD = 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK'", 'runtime-build');
need(runtime, '>JOIN TABLE<', 'single-entry-join-label');
need(runtime, "window.SVR_PHASE363_JOIN_TABLE?.('phase369-logo-entry')", 'join-api');
need(runtime, 'window.SVR_RESET_POKER_TABLE?.(15000)', 'fresh-table-after-join');
need(runtime, "window.SVR_PHASE368_PLAY_CARD_DEALER?.('android-first-deal')", 'dealer-first-deal');
need(runtime, 'table.visible = true', 'table-forced-visible');
need(runtime, 'window.SVR_TABLE_AUTHORITY = table', 'table-authority-preserved');
need(runtime, "['SIT', 'SEAT', 'SIT DOWN', 'SIT AT TABLE', 'PLAY GAME']", 'legacy-seat-suppression');
need(runtime, 'window.SVR_POKER_NEXT_HAND?.()', 'continuous-next-hand');
need(runtime, 'gap > 1400', 'long-frame-watch');
need(runtime, "applyLowPower('long-frame-gap')", 'automatic-low-power');
need(runtime, 'window.SVR_PHASE369_ANDROID_QA', 'runtime-qa');
forbid(runtime, 'new THREE.', 'no-new-renderer-or-table-authority');

need(readiness, "PHASE-369-ANDROID-JOIN-READINESS-TRANSACTION-LOCK", 'readiness-build');
need(readiness, 'async function waitForTable(timeoutMs = 18000)', 'bounded-table-wait');
need(readiness, 'async function waitForJoinApi(timeoutMs = 12000)', 'bounded-api-wait');
need(readiness, 'activePromise', 'single-flight-join');
need(readiness, "JOINING TABLE…", 'visible-busy-state');
need(readiness, "joinApi('phase369-readiness-transaction')", 'fallback-join');
need(readiness, 'window.SVR_PHASE364_ANDROID_SEAT?.(true)', 'seat-after-readiness');
need(readiness, 'window.SVR_RESET_POKER_TABLE?.(15000)', 'deal-after-readiness');
need(readiness, "current.replaceWith(replacement)", 'old-listener-replaced');
need(readiness, 'window.SVR_PHASE369_JOIN_TABLE = runJoin', 'join-api-upgraded');
need(readiness, 'window.SVR_PHASE369_JOIN_READINESS_QA', 'readiness-qa');
forbid(readiness, 'new THREE.', 'readiness-no-renderer');
forbid(readiness, 'setInterval(', 'readiness-no-polling-interval');

need(dealer, "dealer.position.set(info.center.x, 0, info.box.min.z - DEALER_GAP)", 'dealer-across-table');
need(dealer, 'dealer.rotation.set(0, Math.PI, 0)', 'dealer-faces-table');
need(dealer, 'optimizedFromUploadedFbx: true', 'uploaded-fbx-motion');

if (release.build !== 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK') errors.push('release:build');
if (release.certifiedBase !== 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK') errors.push('release:base');
if (!release.androidFlow?.joinRequiredBeforeDeal) errors.push('release:join-before-deal');
if (!release.androidFlow?.authoritativeTableForcedVisible) errors.push('release:table-visible');
if (!release.androidFlow?.dealerDeferredUntilRuntimeStable) errors.push('release:dealer-deferred');
if (!release.androidFlow?.automaticNextHandAfterShowdown) errors.push('release:continuous-play');
if (release.apkPolicy?.forceUpdate || release.apkPolicy?.showUpdatePrompt || !release.apkPolicy?.manualUpdateOnly) errors.push('release:apk-policy');
if (release.truth?.physicalAndroidAcceptancePassed !== false) errors.push('release:physical-acceptance-truth');

const result = {
  build: 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK',
  readinessBuild: 'PHASE-369-ANDROID-JOIN-READINESS-TRANSACTION-LOCK',
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
