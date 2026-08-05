import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const androidRedirect = read('game/android.html');
const androidStable = read('game/android-stable.html');
const runtime = read('game/modules/phase369_android_join_table_freeze_recovery_lock.js');
const readiness = read('game/modules/phase369_android_join_readiness_transaction_lock.js');
const intent = read('game/modules/phase369_android_join_intent_bridge_lock.js');
const successor = read('game/modules/phase372_live_entry_recovery_lock.js');
const dealer = read('game/modules/phase368_card_dealer_animation_lock.js');
const phase381 = read('game/modules/phase381_vr_runtime_lock.js');
const release = JSON.parse(read('game/phase369-release.json'));
const appManifest = JSON.parse(read('game/manifest.json'));

// Current Android authority is the Phase 380 standalone table. Historical
// Phase 367/369/372 modules remain in source as optional 3D rollback coverage;
// they are no longer required in the active lightweight Android entry.
need(androidRedirect, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK', 'protected-full-game-certification');
need(androidRedirect, 'android-stable.html?v=phase380', 'phase380-stable-redirect');
need(androidStable, 'data-build="PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK"', 'phase380-active-marker');
need(androidStable, 'JOIN NOW', 'join-visible');
need(androidStable, 'joined:false', 'join-state-initializer');
need(androidStable, 'movementControlsWhileSeated:0', 'seated-controls-hidden');
need(androidStable, 'function scoreFive(cards)', 'deterministic-evaluator');
need(androidStable, 'function burnCard()', 'burn-cards');
need(androidStable, 'cardsHiddenBeforeJoin:true', 'cards-hidden-before-join');
need(androidStable, "logoUrl:'/logo.png'", 'android-logo');
forbid(androidStable, 'phase369_android_join_table_freeze_recovery_lock.js', 'heavy-phase369-module-on-standalone-android');
forbid(androidStable, 'phase368_card_dealer_animation_lock.js', 'heavy-dealer-on-standalone-android');

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
forbid(successor, 'new THREE.WebGLRenderer', 'successor-no-renderer');

need(dealer, "dealer.position.set(info.center.x, 0, info.box.min.z - DEALER_GAP)", 'protected-dealer-across-table');
need(dealer, 'dealer.rotation.set(0, Math.PI, 0)', 'protected-dealer-faces-table');
need(dealer, 'optimizedFromUploadedFbx: true', 'uploaded-fbx-motion');
need(phase381, 'PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK', 'phase381-dealer-successor');
need(phase381, 'assets/models/eric/eric.fbx', 'approved-eric-asset');
need(phase381, 'phase368_card_dealer_motion.js', 'protected-motion-reuse');

if (release.build !== 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK') errors.push('release:phase373-active-build');
if (release.androidBuild !== 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK') errors.push('release:phase372-android-build');
if (release.androidRecoveryBuild !== 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK') errors.push('release:phase369-protection');
if (release.certifiedBase !== 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK') errors.push('release:base');
if (!release.androidFlow?.joinRequiredBeforeDeal) errors.push('release:join-before-deal');
if (!release.androidFlow?.authoritativeTableForcedVisible) errors.push('release:table-visible');
if (!release.androidFlow?.dealerDeferredUntilRuntimeStable) errors.push('release:dealer-deferred');
if (!release.androidFlow?.automaticNextHandAfterShowdown) errors.push('release:continuous-play');
if (release.apkPolicy?.forceUpdate || release.apkPolicy?.showUpdatePrompt || !release.apkPolicy?.manualUpdateOnly) errors.push('release:apk-policy');
if (release.truth?.physicalAndroidAcceptancePassed !== false) errors.push('release:physical-acceptance-truth');
if (appManifest.build !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK' || appManifest.phase !== 380) errors.push('manifest:phase380-android-authority');
if (appManifest.quest_runtime_build !== 'PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK') errors.push('manifest:phase381-quest-successor');

const result = {
  build: 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK',
  questSuccessor: 'PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK',
  protectedRecoveryBuild: 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK',
  protectedSuccessorBuild: 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK',
  architecture: 'Phase 380 standalone Android authority with protected optional 3D recovery modules and Phase 381 Quest runtime',
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
