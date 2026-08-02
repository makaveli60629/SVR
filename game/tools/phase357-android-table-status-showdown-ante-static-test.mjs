import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('game/modules/phase357_android_table_status_showdown_ante_lock.js');
const directCamera = read('game/modules/phase357_android_direct_camera_seat_fix.js');
const continuity = read('game/modules/phase359_dual_platform_gameplay_continuity_lock.js');
const shuffle = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const phase363 = read('game/modules/phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const raiseCapture = read('game/modules/phase363_android_raise_ui_capture_lock.js');
const streetRaise = read('game/modules/phase363_android_street_raise_action_lock.js');
const consistency = read('game/modules/phase363_android_settlement_lobby_consistency_lock.js');
const android = read('game/android.html');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const errors = [];

function requireText(source, needle, label) {
  if (!source.includes(needle)) errors.push(label);
}
function requirePattern(source, pattern, label) {
  if (!pattern.test(source)) errors.push(label);
}

requireText(runtime, 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK', 'build-label');
requireText(runtime, 'function desiredSeatCamera', 'close-seat-target');
requireText(runtime, 'metrics.depth * 0.5 + edgeOffset', 'table-edge-distance');
requireText(runtime, 'function moveRigByWorldDelta', 'xr-camera-world-delta-correction');
requireText(runtime, "button.dataset?.ui === 'seat'", 'sit-button-intercept');
requireText(runtime, "button.id === 'svr347Recenter'", 'recenter-button-intercept');
requireText(runtime, 'svr357TurnPanel', 'turn-panel');
requireText(runtime, 'svr357Bets', 'six-player-bet-strip');
requireText(runtime, 'TO CALL', 'amount-to-call-indicator');
requireText(runtime, 'actor?.lastAction', 'last-action-indicator');
requireText(runtime, 'svr357Showdown', 'showdown-panel');
requireText(runtime, 'WINNING CARDS:', 'winning-cards-display');
requireText(runtime, 'winner.label', 'winning-hand-name');
requireText(runtime, 'BOARD:', 'community-board-display');
requireText(runtime, 'ANTE UP • NEXT HAND', 'ante-up-prompt');
requireText(runtime, 'window.SVR_POKER_NEXT_HAND?.()', 'authoritative-next-hand');
requireText(runtime, 'playerBetIndicators === 6', 'six-player-qa');
requireText(runtime, 'window.SVR_PHASE357_QA', 'runtime-qa');
requireText(runtime, 'window.SVR_PHASE357_RECENTER', 'recenter-api');
requireText(runtime, 'window.SVR_PHASE357_ANTE_UP', 'ante-api');

requireText(directCamera, 'PHASE-357-ANDROID-DIRECT-CAMERA-SEAT-FIX', 'direct-camera-build');
requireText(directCamera, 'renderer()?.xr?.isPresenting', 'xr-exclusion');
requireText(directCamera, 'camera.position.x = local.x', 'direct-camera-x');
requireText(directCamera, 'camera.position.z = local.z', 'direct-camera-z');
requireText(directCamera, "'seat-transition' : 'seated-watchdog'", 'seat-transition-correction');
requireText(directCamera, 'window.SVR_PHASE357_DIRECT_CAMERA_CORRECT', 'direct-camera-api');
requireText(directCamera, 'window.SVR_PHASE357_DIRECT_CAMERA_QA', 'direct-camera-qa');

requireText(continuity, 'PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK', 'phase359-continuity-build');
requireText(shuffle, 'PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK', 'phase360-shuffle-build');
requireText(phase363, 'PHASE-363-ANDROID-INTEGRATED-LOBBY-AUDIO-GYRO-BANKROLL-LOCK', 'phase363-build');
requireText(phase363, 'const STARTING_STACK = 15000', 'phase363-starting-stack');
requireText(phase363, 'function prepareLobby', 'phase363-lobby-state');
requireText(phase363, 'function joinTable', 'phase363-join-state');
requireText(phase363, 'function leaveTable', 'phase363-leave-state');
requireText(raiseCapture, 'PHASE-363-ANDROID-RAISE-UI-CAPTURE-LOCK', 'phase363-raise-capture-build');
requireText(raiseCapture, 'event.stopImmediatePropagation()', 'phase363-raise-capture');
requireText(streetRaise, 'PHASE-363-ANDROID-STREET-RAISE-ACTION-LOCK', 'phase363-street-raise-build');
requireText(streetRaise, "expectedOrder = ['preflop', 'flop', 'turn', 'river', 'showdown']", 'phase363-street-order');
requireText(streetRaise, "river: { community: 5, burn: 3 }", 'phase363-burn-order');
requireText(consistency, 'PHASE-363-ANDROID-SETTLEMENT-LOBBY-CONSISTENCY-LOCK', 'phase363-consistency-build');
requireText(consistency, 'effectiveTableChips', 'settled-chip-accounting');
requireText(consistency, 'enforceLobbyCardClear', 'lobby-card-clear');

const bootIndex = android.indexOf("await bootPlatform({forcedPlatform:'android'})");
const tableIndex = android.indexOf('phase363_android_canonical_table_asset_lock.js');
const phase357Index = android.indexOf('phase357_android_table_status_showdown_ante_lock.js');
const directCameraIndex = android.indexOf('phase357_android_direct_camera_seat_fix.js');
const phase363Index = android.indexOf('phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const raiseCaptureIndex = android.indexOf('phase363_android_raise_ui_capture_lock.js');
const streetRaiseIndex = android.indexOf('phase363_android_street_raise_action_lock.js');
const joinCaptureIndex = android.indexOf('phase363_android_join_control_capture_lock.js');
const consistencyIndex = android.indexOf('phase363_android_settlement_lobby_consistency_lock.js');
if (bootIndex < 0 || tableIndex <= bootIndex) errors.push('verified-table-must-load-after-platform-boot');
if (phase357Index <= tableIndex) errors.push('phase357-must-load-after-verified-table');
if (directCameraIndex <= phase357Index) errors.push('direct-camera-fix-must-load-after-phase357');
if (phase363Index <= directCameraIndex) errors.push('phase363-must-load-after-direct-camera-fix');
if (raiseCaptureIndex <= phase363Index) errors.push('raise-capture-must-load-after-core');
if (streetRaiseIndex <= raiseCaptureIndex) errors.push('street-raise-must-load-after-raise-capture');
if (joinCaptureIndex <= streetRaiseIndex) errors.push('join-capture-must-load-after-street-raise');
if (consistencyIndex <= joinCaptureIndex) errors.push('consistency-must-load-last');
if (android.includes('phase359_dual_platform_gameplay_continuity_lock.js')) errors.push('phase359-must-not-auto-run-before-join');
if (android.includes('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js')) errors.push('phase360-must-not-auto-run-before-join');
requireText(android, 'data-build="PHASE-363-ANDROID-INTEGRATED-LOBBY-AUDIO-GYRO-BANKROLL-LOCK"', 'android-page-build');
requireText(android, 'data-acceptance="PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK"', 'android-acceptance-record');
requirePattern(android, /data-release="PHASE-363-/, 'android-release-label');
requirePattern(android, /manifest\.json\?v=phase363/, 'android-manifest-cache-version');

if (Number(manifest.phase) < 363) errors.push('manifest-phase');
if (!/^PHASE-363-/.test(String(manifest.build || ''))) errors.push('manifest-build');
if (!/v=phase363/.test(String(manifest.start_url || ''))) errors.push('manifest-start-url');
if (release.protectedAndroidAuthority !== 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK') errors.push('phase357-authority-record-regressed');
if (!/v=phase363/.test(String(release.webEntry || ''))) errors.push('phase363-route-missing');
if (Number(release.realDeviceValidation?.phase) < 363 || release.realDeviceValidation?.pending !== true) errors.push('owner-playtest-pending');

if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('manifest-apk-version');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-apk-policy');
if (release.apkVersionName !== '0.1.0-rc1' || release.apkVersionCode !== 1) errors.push('release-apk-version');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-apk-policy');
if (release.releaseReady !== false || release.apkUrl !== '') errors.push('unverified-apk-exposed');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  pass: true,
  protectedAuthority: release.protectedAndroidAuthority,
  successorRelease: manifest.build,
  closeSeat: 'direct-non-xr-camera-to-south-table-edge-with-xr-rig-preserved',
  androidContinuation: 'phase363-join-gated-fresh-15000-chip-table',
  raise: 'capture-protected bet and raise-to authority',
  streets: 'preflop-flop-turn-river-showdown with three burns',
  settlement: 'effective settled stacks prevent contribution double-counting',
  historicalContinuityProtected: ['phase359', 'phase360'],
  apk: {
    versionName: release.apkVersionName,
    versionCode: release.apkVersionCode,
    manualUpdateOnly: release.manualUpdateOnly
  }
}, null, 2));
