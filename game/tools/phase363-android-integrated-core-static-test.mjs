import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const html = read('game/android.html');
const core = read('game/modules/phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const table = read('game/modules/phase363_android_canonical_table_asset_lock.js');
const raiseCapture = read('game/modules/phase363_android_raise_ui_capture_lock.js');
const streetRaise = read('game/modules/phase363_android_street_raise_action_lock.js');
const join = read('game/modules/phase363_android_join_control_capture_lock.js');
const consistency = read('game/modules/phase363_android_settlement_lobby_consistency_lock.js');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const profile = read('site/profile.html');
const dressingRoom = read('game/avatar-vr.html');

assert(/v=phase(?:363|3[6-9]\d)/.test(html), 'Android route is not Phase 363 or a protected successor');
assert(html.includes('SVR_REQUIRE_TABLE_JOIN=true'), 'Android does not require JOIN before cards');
assert(html.includes('SVR_TABLE_STARTING_STACK=15000'), 'Android starting stack flag is not 15,000');
for (const module of [
  'phase363_android_canonical_table_asset_lock.js',
  'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js',
  'phase363_android_raise_ui_capture_lock.js',
  'phase363_android_street_raise_action_lock.js',
  'phase363_android_join_control_capture_lock.js',
  'phase363_android_settlement_lobby_consistency_lock.js'
]) assert(html.includes(module), `${module} is not loaded`);
assert(!html.includes('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js'), 'Legacy 10,000-chip module still loads on Android');

const order = [
  'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js',
  'phase363_android_raise_ui_capture_lock.js',
  'phase363_android_street_raise_action_lock.js',
  'phase363_android_join_control_capture_lock.js',
  'phase363_android_settlement_lobby_consistency_lock.js'
].map((name) => html.indexOf(name));
assert(order.every((index) => index >= 0) && order.every((index, position) => position === 0 || index > order[position - 1]), 'Phase 363 final Android authority order is incorrect');

for (const token of [
  'const STARTING_STACK = 15000',
  'const TABLE_BANKROLL = STARTING_STACK * players.length',
  "LOBBY: 'LOBBY'",
  "SEATED: 'SEATED'",
  'prepareLobby',
  'resetTable(STARTING_STACK)',
  "PokerAudio.play('card_shuffle')",
  "PokerAudio.play('card_deal')",
  "PokerAudio.play('chip_bet')",
  "PokerAudio.play('win_pot')",
  'navigator.vibrate',
  "window.addEventListener('deviceorientation'",
  'touchYaw',
  'adjustFov',
  'seatParallax',
  'BANKROLL 15,000',
  'JOIN TABLE TO RECEIVE CARDS'
]) assert(core.includes(token), `Integrated core missing ${token}`);

assert(table.includes('../assets/models/table.glb'), 'Verified GLB table is not first candidate');
assert(table.includes('../assets/table.fbx'), 'Verified FBX fallback is missing');
assert(!table.includes('../assets/table.obj'), 'Unverified OBJ path would generate a failed request');
assert(table.includes('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'), 'Uploaded table authority name is missing');

for (const token of ["key === runtime.lastKey", "window.SVR_PHASE363_RAISE_TO?.(target)", 'event.stopImmediatePropagation()']) assert(raiseCapture.includes(token), `Raise capture missing ${token}`);
for (const token of [
  'function raiseTo',
  "const type = before.currentBet > 0 ? 'raise' : 'bet'",
  'before.maximum > before.currentBet',
  "preflop: { community: 0, burn: 0 }",
  "flop: { community: 3, burn: 1 }",
  "turn: { community: 4, burn: 2 }",
  "river: { community: 5, burn: 3 }",
  "expectedOrder = ['preflop', 'flop', 'turn', 'river', 'showdown']",
  'window.SVR_PHASE363_STREET_RAISE_QA'
]) assert(streetRaise.includes(token), `Street/raise contract missing ${token}`);
for (const token of ["window.addEventListener('pointerdown'", "window.addEventListener('click'", 'event.stopImmediatePropagation()', 'visible.length === 1', "'LEAVE TABLE' : 'JOIN TABLE'", 'duplicateActivationsBlocked']) assert(join.includes(token), `JOIN contract missing ${token}`);
for (const token of ['effectiveTableChips', 'settledHand ? 0 : committedChips', 'enforceLobbyCardClear', 'installAuditWrapper', 'engineHandsCleared']) assert(consistency.includes(token), `Settlement/lobby contract missing ${token}`);

assert(Number(manifest.phase) >= 363, 'Manifest regressed below Phase 363');
assert(manifest.starting_stack === 15000, 'Manifest starting stack is not 15,000');
assert(manifest.table_bankroll === 90000, 'Manifest table bankroll is not 90,000');
assert(manifest.join_required_before_deal === true && manifest.cards_hidden_before_join === true, 'Manifest JOIN/card policy changed');
assert(manifest.force_update === false && manifest.show_update_prompt === false && manifest.manual_update_only === true, 'APK update policy changed');

assert(/^PHASE-3(?:6[3-9]|[7-9]\d)-ANDROID/.test(release.currentGameBuild), 'Android release record regressed below Phase 363');
assert(release.protectedAuthorities?.androidIntegratedFlow === 'PHASE-363' || release.notes?.some((note) => /Phase 363/i.test(note)), 'Phase 363 Android integrated authority is no longer protected');
assert(release.tablePolicy.startingStackPerPlayer === 15000 && release.tablePolicy.tableBankroll === 90000, 'Protected Android bankroll changed');
assert(release.tablePolicy.singleJoinLeaveControl === true, 'Release does not require one JOIN/LEAVE control');
assert(release.gameplayPolicy?.raiseControlRequired === true && release.gameplayPolicy?.raiseSliderConfirmRequired === true, 'Protected raise flow changed');
assert(JSON.stringify(release.gameplayPolicy?.streetOrder) === JSON.stringify(['preflop', 'flop', 'turn', 'river', 'showdown']), 'Protected Holdem street order changed');
assert(release.apkVersionName === '0.1.0-rc1' && release.apkVersionCode === 1, 'APK version changed');
assert(release.forceUpdate === false && release.showUpdatePrompt === false && release.manualUpdateOnly === true, 'APK prompt policy changed');

assert(profile.includes('profileShowroomCanvas'), 'Profile live avatar camera was removed');
assert(profile.includes('avatar.html?v=') || profile.includes('../game/avatar-vr.html?v='), 'Profile no longer connects to an avatar dressing-room route');
assert(dressingRoom.includes('PHASE-353-VR-AVATAR-DRESSING-ROOM-LIVE-PEDESTAL-LOCK'), 'VR dressing room authority was removed');
assert(dressingRoom.includes('togglePedestal'), 'Moving avatar pedestal was removed');

console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-363-ANDROID-CANONICAL-TABLE-JOIN-BANKROLL-AUDIO-LOCK',
  successorBuild: manifest.build,
  startingStack: manifest.starting_stack,
  tableBankroll: manifest.table_bankroll,
  reliableRaise: true,
  holdemStreetOrder: ['preflop', 'flop', 'turn', 'river', 'showdown'],
  avatarShowroomsProtected: true
}, null, 2));
