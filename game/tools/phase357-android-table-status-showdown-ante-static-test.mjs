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
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(label); };
const match = (source, pattern, label) => { if (!pattern.test(source)) errors.push(label); };

for (const [token, label] of [
  ['PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK', 'build-label'],
  ['function desiredSeatCamera', 'close-seat-target'],
  ['metrics.depth * 0.5 + edgeOffset', 'table-edge-distance'],
  ['function moveRigByWorldDelta', 'xr-camera-world-delta-correction'],
  ["button.dataset?.ui === 'seat'", 'sit-button-intercept'],
  ["button.id === 'svr347Recenter'", 'recenter-button-intercept'],
  ['svr357TurnPanel', 'turn-panel'], ['svr357Bets', 'six-player-bet-strip'],
  ['TO CALL', 'amount-to-call-indicator'], ['actor?.lastAction', 'last-action-indicator'],
  ['svr357Showdown', 'showdown-panel'], ['WINNING CARDS:', 'winning-cards-display'],
  ['winner.label', 'winning-hand-name'], ['BOARD:', 'community-board-display'],
  ['ANTE UP • NEXT HAND', 'ante-up-prompt'], ['window.SVR_POKER_NEXT_HAND?.()', 'authoritative-next-hand'],
  ['playerBetIndicators === 6', 'six-player-qa'], ['window.SVR_PHASE357_QA', 'runtime-qa'],
  ['window.SVR_PHASE357_RECENTER', 'recenter-api'], ['window.SVR_PHASE357_ANTE_UP', 'ante-api']
]) need(runtime, token, label);

for (const [token, label] of [
  ['PHASE-357-ANDROID-DIRECT-CAMERA-SEAT-FIX', 'direct-camera-build'],
  ['renderer()?.xr?.isPresenting', 'xr-exclusion'], ['camera.position.x = local.x', 'direct-camera-x'],
  ['camera.position.z = local.z', 'direct-camera-z'], ["'seat-transition' : 'seated-watchdog'", 'seat-transition-correction'],
  ['window.SVR_PHASE357_DIRECT_CAMERA_CORRECT', 'direct-camera-api'], ['window.SVR_PHASE357_DIRECT_CAMERA_QA', 'direct-camera-qa']
]) need(directCamera, token, label);

need(continuity, 'PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK', 'phase359-continuity-build');
need(shuffle, 'PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK', 'phase360-shuffle-build');
for (const [token, label] of [
  ['PHASE-363-ANDROID-INTEGRATED-LOBBY-AUDIO-GYRO-BANKROLL-LOCK', 'phase363-build'],
  ['const STARTING_STACK = 15000', 'phase363-starting-stack'], ['function prepareLobby', 'phase363-lobby-state'],
  ['function joinTable', 'phase363-join-state'], ['function leaveTable', 'phase363-leave-state']
]) need(phase363, token, label);
need(raiseCapture, 'PHASE-363-ANDROID-RAISE-UI-CAPTURE-LOCK', 'phase363-raise-capture-build');
need(raiseCapture, 'event.stopImmediatePropagation()', 'phase363-raise-capture');
need(streetRaise, 'PHASE-363-ANDROID-STREET-RAISE-ACTION-LOCK', 'phase363-street-raise-build');
need(streetRaise, "expectedOrder = ['preflop', 'flop', 'turn', 'river', 'showdown']", 'phase363-street-order');
need(streetRaise, "river: { community: 5, burn: 3 }", 'phase363-burn-order');
need(consistency, 'PHASE-363-ANDROID-SETTLEMENT-LOBBY-CONSISTENCY-LOCK', 'phase363-consistency-build');
need(consistency, 'effectiveTableChips', 'settled-chip-accounting');
need(consistency, 'enforceLobbyCardClear', 'lobby-card-clear');

const sequence = [
  "await bootPlatform({forcedPlatform:'android'})",
  'phase363_android_canonical_table_asset_lock.js',
  'phase357_android_table_status_showdown_ante_lock.js',
  'phase357_android_direct_camera_seat_fix.js',
  'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js',
  'phase363_android_raise_ui_capture_lock.js',
  'phase363_android_street_raise_action_lock.js',
  'phase363_android_join_control_capture_lock.js',
  'phase363_android_settlement_lobby_consistency_lock.js'
].map((token) => android.indexOf(token));
if (!sequence.every((index) => index >= 0) || !sequence.every((index, i) => i === 0 || index > sequence[i - 1])) errors.push('android-runtime-order');
if (android.includes('phase359_dual_platform_gameplay_continuity_lock.js')) errors.push('phase359-must-not-auto-run-before-join');
if (android.includes('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js')) errors.push('phase360-must-not-auto-run-before-join');
match(android, /data-build="PHASE-(?:363|3[6-9]\d)-/, 'android-page-build');
match(android, /data-acceptance="PHASE-(?:354|357|363|3[6-9]\d)-/, 'android-acceptance-record');
match(android, /data-release="PHASE-(?:363|3[6-9]\d)-/, 'android-release-label');
match(android, /manifest\.json\?v=phase(?:363|3[6-9]\d)/, 'android-manifest-cache-version');

if (Number(manifest.phase) < 363) errors.push('manifest-phase');
if (!/^PHASE-(?:363|3[6-9]\d)-/.test(String(manifest.build || ''))) errors.push('manifest-build');
if (!/v=phase(?:363|3[6-9]\d)/.test(String(manifest.start_url || ''))) errors.push('manifest-start-url');
if (release.protectedAndroidAuthority !== 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK') errors.push('phase357-authority-record-regressed');
if (!/v=phase363/.test(String(release.webEntry || ''))) errors.push('protected-phase363-route-missing');
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
  geometrySuccessor: 'phase364-table-floor-and-seat-height',
  apk: { versionName: release.apkVersionName, versionCode: release.apkVersionCode, manualUpdateOnly: release.manualUpdateOnly }
}, null, 2));
