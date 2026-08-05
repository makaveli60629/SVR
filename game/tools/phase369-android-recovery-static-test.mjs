import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const androidRedirect = read('game/android.html');
const androidLobby = read('game/android-lobby.html');
const androidStable = read('game/android-stable.html');
const platformManifest = read('game/modules/phase340_platform_manifest.js');
const runtime = read('game/modules/phase369_android_join_table_freeze_recovery_lock.js');
const readiness = read('game/modules/phase369_android_join_readiness_transaction_lock.js');
const intent = read('game/modules/phase369_android_join_intent_bridge_lock.js');
const successor = read('game/modules/phase372_live_entry_recovery_lock.js');
const dealer = read('game/modules/phase368_card_dealer_animation_lock.js');
const historicalRelease = JSON.parse(read('game/phase369-release.json'));
const currentRelease = JSON.parse(read('game/android-release.json'));
const gameManifest = JSON.parse(read('game/manifest.json'));

need(androidRedirect, 'android-lobby.html?v=phase381', 'phase381-lobby-redirect');
need(androidRedirect, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK', 'protected-full-game-certification');
need(androidLobby, 'data-build="PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK"', 'phase381-active-marker');
need(androidLobby, 'data-acceptance="PHASE-363-ANDROID-CANONICAL-TABLE-JOIN-BANKROLL-AUDIO-LOCK"', 'phase363-certification-marker');
need(androidLobby, 'window.SVR_REQUIRE_TABLE_JOIN = true', 'join-required');
need(androidLobby, 'window.SVR_TABLE_STARTING_STACK = 15000', 'starting-stack');
need(androidLobby, "bootPlatform({ forcedPlatform:'android' })", 'platform-boot');
need(androidLobby, 'phase363_android_join_control_capture_lock.js?v=phase381', 'join-control-capture');
need(androidLobby, 'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js?v=phase381', 'join-bankroll-audio');
need(androidLobby, 'phase363_android_settlement_lobby_consistency_lock.js?v=phase381', 'settlement-consistency');
need(androidLobby, "SVR_PHASE363_LEAVE_TABLE?.('phase381-lobby-start')", 'lobby-before-seat');
need(androidLobby, 'phase368_card_dealer_animation_lock.js?v=phase381', 'dealer-load');
need(androidLobby, "logoUrl:'/logo.png'", 'android-logo');
need(androidLobby, 'unlockSound()', 'sound-unlock');
need(androidLobby, 'SVR_PHASE381_ANDROID_LOBBY_QA', 'phase381-lobby-qa');
need(androidStable, 'PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK', 'low-power-successor');
need(androidStable, 'JOIN NOW', 'low-power-visible-join');
need(androidStable, 'SVR card back', 'low-power-logo-card-back');

need(platformManifest, 'phase356_android_real_device_freeze_recovery_lock.js', 'active-freeze-recovery');
need(platformManifest, 'phase365_android_seated_ux_branding_gyro_alignment_lock.js', 'active-seated-ux');
need(platformManifest, 'phase367_android_physical_device_viewport_touch_acceptance_lock.js', 'active-physical-device-contract');

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
need(intent, "document.addEventListener('click', legacyListener, true)", 'captured-legacy-join');
need(intent, 'event.stopImmediatePropagation()', 'unbound-button-guard');
need(intent, 'queueMicrotask', 'install-replay');
need(intent, 'window.SVR_PHASE369_JOIN_INTENT_QA', 'intent-qa');
forbid(intent, 'setInterval(', 'intent-no-polling');
forbid(intent, 'new THREE.', 'intent-no-renderer');

need(successor, "PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK", 'successor-build');
need(successor, "'JOIN TABLE'", 'successor-visible-join');
need(successor, "['SVR_PHASE369_JOIN_TABLE', 'SVR_PHASE363_JOIN_TABLE']", 'successor-reuses-join-authority');
need(successor, 'table.visible = true', 'successor-table-visible');
need(successor, 'window.SVR_PHASE372_QA', 'successor-qa');
forbid(successor, 'new THREE.WebGLRenderer', 'successor-no-renderer');

need(dealer, "dealer.position.set(info.center.x, 0, info.box.min.z - DEALER_GAP)", 'dealer-across-table');
need(dealer, 'dealer.rotation.set(0, Math.PI, 0)', 'dealer-faces-table');
need(dealer, 'optimizedFromUploadedFbx: true', 'uploaded-fbx-motion');

if (historicalRelease.build !== 'PHASE-373-QUEST-SEATED-TELEPORT-TABLE-SPAWN-NPC-LOCK') errors.push('historical-release:phase373-active-build');
if (historicalRelease.androidBuild !== 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK') errors.push('historical-release:phase372-android-build');
if (historicalRelease.androidRecoveryBuild !== 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK') errors.push('historical-release:phase369-protection');
if (historicalRelease.certifiedBase !== 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK') errors.push('historical-release:base');
if (!historicalRelease.androidFlow?.joinRequiredBeforeDeal) errors.push('historical-release:join-before-deal');
if (!historicalRelease.androidFlow?.authoritativeTableForcedVisible) errors.push('historical-release:table-visible');
if (!historicalRelease.androidFlow?.automaticNextHandAfterShowdown) errors.push('historical-release:continuous-play');
if (historicalRelease.apkPolicy?.forceUpdate || historicalRelease.apkPolicy?.showUpdatePrompt || !historicalRelease.apkPolicy?.manualUpdateOnly) errors.push('historical-release:apk-policy');
if (historicalRelease.truth?.physicalAndroidAcceptancePassed !== false) errors.push('historical-release:physical-acceptance-truth');

if (currentRelease.currentGameBuild !== 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK') errors.push('current-release:phase381-build');
if (currentRelease.webEntry !== '/game/android-lobby.html?v=phase381') errors.push('current-release:lobby-entry');
if (currentRelease.lowPowerEntry !== '/game/android-stable.html?v=phase381') errors.push('current-release:low-power-entry');
if (!currentRelease.tablePolicy?.lobbyBeforeSeating || !currentRelease.tablePolicy?.joinRequiredBeforeDeal) errors.push('current-release:lobby-join-policy');
if (currentRelease.forceUpdate || currentRelease.showUpdatePrompt || !currentRelease.manualUpdateOnly) errors.push('current-release:apk-policy');
if (gameManifest.phase !== 381 || gameManifest.start_url !== './android-lobby.html?v=phase381') errors.push('manifest:phase381-lobby');

const result = {
  build: 'PHASE-369-ANDROID-RECOVERY-PROTECTED-BY-PHASE-381',
  successor: 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK',
  protectedRecoveryBuild: 'PHASE-369-ANDROID-JOIN-TABLE-FREEZE-RECOVERY-LOCK',
  lobbyFirst: true,
  lowPowerRecovery: true,
  joinBeforeDeal: true,
  sound: true,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
