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
const androidRedirect = read('game/android.html');
const androidLobby = read('game/android-lobby.html');
const android = read('game/android-stable.html');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(label); };

for (const [token, label] of [
  ['PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK', 'build-label'],
  ['function desiredSeatCamera', 'close-seat-target'],
  ['metrics.depth * 0.5 + edgeOffset', 'table-edge-distance'],
  ['function moveRigByWorldDelta', 'xr-camera-world-delta-correction'],
  ['svr357TurnPanel', 'turn-panel'],
  ['svr357Bets', 'six-player-bet-strip'],
  ['TO CALL', 'amount-to-call-indicator'],
  ['svr357Showdown', 'showdown-panel'],
  ['WINNING CARDS:', 'winning-cards-display'],
  ['ANTE UP • NEXT HAND', 'ante-up-prompt'],
  ['window.SVR_PHASE357_QA', 'runtime-qa']
]) need(runtime, token, label);
for (const [token, label] of [
  ['PHASE-357-ANDROID-DIRECT-CAMERA-SEAT-FIX', 'direct-camera-build'],
  ['renderer()?.xr?.isPresenting', 'xr-exclusion'],
  ['camera.position.x = local.x', 'direct-camera-x'],
  ['camera.position.z = local.z', 'direct-camera-z'],
  ['window.SVR_PHASE357_DIRECT_CAMERA_CORRECT', 'direct-camera-api']
]) need(directCamera, token, label);
need(continuity, 'PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK', 'phase359-continuity-build');
need(shuffle, 'PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK', 'phase360-shuffle-build');
for (const [token, label] of [
  ['PHASE-363-ANDROID-INTEGRATED-LOBBY-AUDIO-GYRO-BANKROLL-LOCK', 'phase363-build'],
  ['const STARTING_STACK = 15000', 'phase363-starting-stack'],
  ['function prepareLobby', 'phase363-lobby-state'],
  ['function joinTable', 'phase363-join-state'],
  ['function leaveTable', 'phase363-leave-state']
]) need(phase363, token, label);
need(raiseCapture, 'PHASE-363-ANDROID-RAISE-UI-CAPTURE-LOCK', 'phase363-raise-capture-build');
need(raiseCapture, 'event.stopImmediatePropagation()', 'phase363-raise-capture');
need(streetRaise, 'PHASE-363-ANDROID-STREET-RAISE-ACTION-LOCK', 'phase363-street-raise-build');
need(streetRaise, "expectedOrder = ['preflop', 'flop', 'turn', 'river', 'showdown']", 'phase363-street-order');
need(streetRaise, "river: { community: 5, burn: 3 }", 'phase363-burn-order');
need(consistency, 'PHASE-363-ANDROID-SETTLEMENT-LOBBY-CONSISTENCY-LOCK', 'phase363-consistency-build');
need(consistency, 'effectiveTableChips', 'settled-chip-accounting');
need(consistency, 'enforceLobbyCardClear', 'lobby-card-clear');

need(androidRedirect, 'android-lobby.html?v=phase381', 'android-phase381-lobby-redirect');
need(androidLobby, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK', 'android-lobby-build');
need(androidLobby, 'phase357_android_table_status_showdown_ante_lock.js', 'phase357-loaded-in-lobby');
need(androidLobby, 'phase357_android_direct_camera_seat_fix.js', 'phase357-camera-loaded-in-lobby');
need(androidLobby, 'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js', 'phase363-loaded-in-lobby');
need(androidLobby, "SVR_PHASE363_LEAVE_TABLE?.('phase381-lobby-start')", 'lobby-before-seat');
need(androidLobby, 'unlockSound()', 'lobby-audio-unlock');

need(android, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK', 'protected-low-power-build');
need(android, 'PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK', 'low-power-successor');
need(android, 'JOIN NOW', 'android-join-now');
need(android, 'No cards, poker actions, or movement controls appear before joining.', 'android-prejoin-protection');
need(android, 'function scoreFive(cards)', 'deterministic-hand-evaluator');
need(android, 'function bestHand(cards)', 'best-seven-card-hand');
need(android, 'function burn()', 'three-burn-support');
need(android, 'function settle()', 'settlement');
need(android, 'movementControlsWhileSeated:0', 'seated-movement-zero');
need(android, 'window.SVR_PHASE380_SET_BRAND', 'replaceable-brand-slot');
need(android, 'SVR card back', 'logo-card-backs');
need(android, 'function tone(', 'low-power-sound');
if (/three\.module|type="module"|main\.js/.test(android)) errors.push('standalone-heavy-3d-regressed');
if (android.includes('phase359_dual_platform_gameplay_continuity_lock.js')) errors.push('phase359-must-not-auto-run-before-join');
if (android.includes('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js')) errors.push('phase360-must-not-auto-run-before-join');

if (manifest.phase !== 381) errors.push('manifest-phase');
if (manifest.build !== 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK') errors.push('manifest-build');
if (manifest.start_url !== './android-lobby.html?v=phase381') errors.push('manifest-start-url');
if (manifest.android_low_power_entry !== './android-stable.html?v=phase381') errors.push('manifest-low-power-url');
if (!manifest.android_deterministic_hand_evaluator || !manifest.android_burn_cards) errors.push('manifest-poker-correctness');
if (!manifest.android_sticks_hidden_while_seated || manifest.android_movement_controls_while_seated !== 0) errors.push('manifest-seated-lock');
if (!manifest.android_sound_enabled || !manifest.android_compact_opponent_panels || !manifest.android_logo_card_backs) errors.push('manifest-presentation');
if (manifest.apk_version_name !== '0.1.0-rc2' || manifest.apk_version_code !== 2) errors.push('manifest-apk-version');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true || manifest.release_ready !== true) errors.push('manifest-apk-policy');

if (release.webEntry !== '/game/android-lobby.html?v=phase381') errors.push('release-route');
if (release.lowPowerEntry !== '/game/android-stable.html?v=phase381') errors.push('release-low-power-route');
if (release.currentGameBuild !== 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK') errors.push('release-build');
if (release.lowPowerGameBuild !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK') errors.push('release-low-power-build');
if (!release.tablePolicy?.deterministicHandEvaluator || !release.tablePolicy?.burnCards) errors.push('release-poker-correctness');
if (!release.tablePolicy?.joinRequiredBeforeDeal || !release.tablePolicy?.cardsHiddenBeforeJoin) errors.push('release-prejoin-policy');
if (!release.tablePolicy?.replaceableTournamentBrandSlot) errors.push('release-brand-policy');
if (!release.tablePolicy?.soundEnabled || !release.tablePolicy?.compactOpponentPanels || !release.tablePolicy?.twoLogoCardBacksPerOpponent) errors.push('release-presentation-policy');
if (release.apkVersionName !== '0.1.0-rc2' || release.apkVersionCode !== 2 || release.releaseReady !== true) errors.push('release-apk-version');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-apk-policy');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedOptional3d: ['Phase 357 table/status/camera', 'Phase 363 join/raise/settlement'],
  successorRelease: manifest.build,
  androidContinuation: 'Phase 381 full lobby before JOIN with Phase 380 low-power recovery',
  cards: 'two-corner 10-rank presentation, burn cards and SVR-logo backs',
  controls: 'normal lobby movement; no movement controls while seated',
  sound: true,
  apk: { versionName: release.apkVersionName, versionCode: release.apkVersionCode, manualUpdateOnly: release.manualUpdateOnly }
}, null, 2));
