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
const intent = read('game/modules/phase369_android_join_intent_bridge_lock.js');
const successor = read('game/modules/phase372_live_entry_recovery_lock.js');
const physicalRelease = read('game/modules/phase374_physical_release_truth_lock.js');
const originalTable = read('game/modules/phase374_original_table_authority_lock.js');
const dealer = read('game/modules/phase368_card_dealer_animation_lock.js');
const release = JSON.parse(read('game/phase369-release.json'));
const currentRelease = JSON.parse(read('game/phase374-release.json'));

need(android, 'data-build="PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK"', 'phase374-active-marker');
need(android, 'data-android-authority="PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK"', 'phase372-authority-marker');
need(android, 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK', 'phase367-certification-marker');
need(android, 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK', 'phase369-certification-marker');
need(android, 'window.SVR_REQUIRE_TABLE_JOIN=true', 'join-required');
need(android, 'window.SVR_PHASE369_PENDING_JOIN=false', 'pending-join-initializer');
need(android, 'event.stopImmediatePropagation();window.SVR_PHASE369_PENDING_JOIN=true', 'early-intent-capture');
need(android, '#svr369Join:not([data-svr369-readiness-bound])', 'unbound-button-guard');
need(android, "phase374_original_table_authority_lock.js?v=phase374", 'phase374-original-table-load');
need(android, "phase372_live_entry_recovery_lock.js?v=phase374", 'phase372-early-entry');
need(android, "phase367_android_physical_device_viewport_touch_acceptance_lock.js?v=phase374", 'phase367-base-load');
need(android, "phase369_android_join_table_freeze_recovery_lock.js?v=phase374", 'phase369-base-load');
need(android, "phase369_android_join_readiness_transaction_lock.js?v=phase374", 'phase369-readiness-load');
need(android, "phase369_android_join_intent_bridge_lock.js?v=phase374", 'phase369-intent-load');
need(android, 'const loadDealerLater=', 'dealer-deferred');
need(android, "requestIdleCallback(run,{timeout:6000})", 'idle-dealer-load');
need(android, "logoUrl:'/logo.png'", 'android-logo');
const originalIndex = android.indexOf('phase374_original_table_authority_lock.js');
const phase372Index = android.indexOf('phase372_live_entry_recovery_lock.js');
const phase367Index = android.indexOf('phase367_android_physical_device_viewport_touch_acceptance_lock.js');
const phase369Index = android.indexOf('phase369_android_join_table_freeze_recovery_lock.js');
const readinessIndex = android.indexOf('phase369_android_join_readiness_transaction_lock.js');
const intentIndex = android.indexOf('phase369_android_join_intent_bridge_lock.js');
if (!(originalIndex >= 0 && phase372Index > originalIndex && phase367Index > phase372Index && phase369Index > phase367Index && readinessIndex > phase369Index && intentIndex > readinessIndex)) errors.push('order:phase374-table-phase372-before-protected-phase369-stack');

need(runtime, "export const BUILD = 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK'", 'runtime-build');
need(runtime, '>JOIN TABLE<', 'phase369-entry-join-label');
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

need(readiness, 'PHASE-369-ANDROID-JOIN-READINESS-TRANSACTION-LOCK', 'readiness-build');
need(readiness, 'async function waitForTable(timeoutMs = 18000)', 'bounded-table-wait');
need(readiness, 'async function waitForJoinApi(timeoutMs = 12000)', 'bounded-api-wait');
need(readiness, 'activePromise', 'single-flight-join');
need(readiness, 'JOINING TABLE…', 'visible-busy-state');
need(readiness, "joinApi('phase369-readiness-transaction')", 'fallback-join');
need(readiness, 'window.SVR_PHASE364_ANDROID_SEAT?.(true)', 'seat-after-readiness');
need(readiness, 'window.SVR_RESET_POKER_TABLE?.(15000)', 'deal-after-readiness');
need(readiness, 'current.replaceWith(replacement)', 'old-listener-replaced');
need(readiness, 'window.SVR_PHASE369_JOIN_TABLE = runJoin', 'join-api-upgraded');
need(readiness, 'window.SVR_PHASE369_JOIN_READINESS_QA', 'readiness-qa');
forbid(readiness, 'new THREE.', 'readiness-no-renderer');
forbid(readiness, 'setInterval(', 'readiness-no-polling-interval');

need(intent, 'PHASE-369-ANDROID-JOIN-INTENT-BRIDGE-LOCK', 'intent-build');
need(intent, 'window.SVR_PHASE369_PENDING_JOIN', 'intent-state');
need(intent, 'replayPendingJoin', 'intent-replay');
need(intent, 'queueMicrotask', 'install-replay');
need(intent, 'window.SVR_PHASE369_JOIN_INTENT_QA', 'intent-qa');
forbid(intent, 'setInterval(', 'intent-no-polling');
forbid(intent, 'new THREE.', 'intent-no-renderer');

need(successor, 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK', 'successor-build');
need(successor, "'JOIN TABLE'", 'successor-visible-join');
need(successor, "['SVR_PHASE369_JOIN_TABLE', 'SVR_PHASE363_JOIN_TABLE']", 'successor-reuses-join-authority');
need(successor, 'table.visible = true', 'successor-table-visible');
need(successor, 'window.SVR_PHASE372_QA', 'successor-qa');
need(successor, "import('./phase374_physical_release_truth_lock.js?v=phase374')", 'phase374-verifier-successor');
forbid(successor, 'new THREE.WebGLRenderer', 'successor-no-renderer');

need(physicalRelease, 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK', 'physical-release-build');
need(physicalRelease, 'window.SVR_PHASE374_RECOVER', 'physical-recovery-api');
need(originalTable, 'PHASE-374-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'original-table-build');
need(originalTable, 'window.SVR_TABLE_AUTHORITY = table', 'original-table-authority');

need(dealer, "dealer.position.set(info.center.x, 0, info.box.min.z - DEALER_GAP)", 'dealer-across-table');
need(dealer, 'dealer.rotation.set(0, Math.PI, 0)', 'dealer-faces-table');
need(dealer, 'optimizedFromUploadedFbx: true', 'uploaded-fbx-motion');

if (release.androidBuild !== 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK') errors.push('release:phase372-android-build');
if (release.androidRecoveryBuild !== 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK') errors.push('release:phase369-protection');
if (release.certifiedBase !== 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK') errors.push('release:base');
if (!release.androidFlow?.joinRequiredBeforeDeal) errors.push('release:join-before-deal');
if (!release.androidFlow?.authoritativeTableForcedVisible) errors.push('release:table-visible');
if (!release.androidFlow?.dealerDeferredUntilRuntimeStable) errors.push('release:dealer-deferred');
if (!release.androidFlow?.automaticNextHandAfterShowdown) errors.push('release:continuous-play');
if (release.apkPolicy?.forceUpdate || release.apkPolicy?.showUpdatePrompt || !release.apkPolicy?.manualUpdateOnly) errors.push('release:apk-policy');
if (release.truth?.physicalAndroidAcceptancePassed !== false) errors.push('release:physical-acceptance-truth');

if (currentRelease.build !== 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK') errors.push('current-release:phase374-build');
if (currentRelease.androidEntry !== '/game/android.html?channel=stable&v=phase374') errors.push('current-release:android-route');
if (!currentRelease.android?.singleJoinControl || !currentRelease.android?.leaveRestoresJoin) errors.push('current-release:join-flow');
if (currentRelease.apkPolicy?.forceUpdate || currentRelease.apkPolicy?.showUpdatePrompt || !currentRelease.apkPolicy?.manualUpdateOnly) errors.push('current-release:apk-policy');

const result = {
  build: 'PHASE-374-PHYSICAL-RELEASE-TRUTH-LOCK',
  androidBuild: 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK',
  protectedRecoveryBuild: 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK',
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
