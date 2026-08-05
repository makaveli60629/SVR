import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const redirect = read('game/android.html');
const html = read('game/android-lobby.html');
const lowPower = read('game/android-stable.html');
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

assert(redirect.includes('android-lobby.html?v=phase381'), 'Legacy Android route does not open Phase 381 lobby');
assert(html.includes('PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK'), 'Canonical Android lobby build missing');
assert(html.includes('window.SVR_REQUIRE_TABLE_JOIN = true'), 'Android does not require JOIN before cards');
assert(html.includes('window.SVR_TABLE_STARTING_STACK = 15000'), 'Android starting stack flag is not 15,000');
for (const module of [
  'phase363_android_canonical_table_asset_lock.js',
  'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js',
  'phase363_android_raise_ui_capture_lock.js',
  'phase363_android_street_raise_action_lock.js',
  'phase363_android_join_control_capture_lock.js',
  'phase363_android_settlement_lobby_consistency_lock.js'
]) assert(html.includes(`${module}?v=phase381`), `${module} is not loaded by Phase 381 lobby`);
assert(!html.includes('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js'), 'Legacy 10,000-chip module still loads on Android');
assert(html.includes("SVR_PHASE363_LEAVE_TABLE?.('phase381-lobby-start')"), 'Android must begin in lobby state');
assert(html.includes('unlockSound()'), 'Android sound unlock is missing');

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
for (const token of ["window.addEventListener('pointerdown'", "window.addEventListener('click'", 'event.stopImmediatePropagation()', 'visible.length === 1', "return joinedNow() ? 'LEAVE TABLE' : 'JOIN NOW'", 'duplicateActivationsBlocked']) assert(join.includes(token), `JOIN contract missing ${token}`);
for (const token of ['effectiveTableChips', 'settledHand ? 0 : committedChips', 'enforceLobbyCardClear', 'installAuditWrapper', 'engineHandsCleared']) assert(consistency.includes(token), `Settlement/lobby contract missing ${token}`);

assert(manifest.phase === 381, 'Manifest is not Phase 381');
assert(manifest.android_starting_stack === 15000, 'Manifest starting stack is not 15,000');
assert(manifest.android_players === 6, 'Manifest player count changed');
assert(manifest.android_join_required_before_deal === true && manifest.android_cards_hidden_before_join === true, 'Manifest JOIN/card policy changed');
assert(manifest.android_sound_enabled === true, 'Android sound policy missing');
assert(manifest.force_update === false && manifest.show_update_prompt === false && manifest.manual_update_only === true, 'APK update policy changed');

assert(release.currentGameBuild === 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK', 'Android Phase 381 release record missing');
assert(release.lowPowerGameBuild === 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK', 'Low-power fallback record missing');
assert(release.webEntry === '/game/android-lobby.html?v=phase381', 'Canonical lobby release route changed');
assert(release.tablePolicy.startingStackPerPlayer === 15000 && release.tablePolicy.players === 6, 'Protected Android bankroll/player count changed');
assert(release.tablePolicy.joinRequiredBeforeDeal === true && release.tablePolicy.cardsHiddenBeforeJoin === true, 'Protected JOIN policy changed');
assert(release.tablePolicy.deterministicHandEvaluator === true && release.tablePolicy.burnCards === true, 'Protected Holdem correctness changed');
assert(release.tablePolicy.soundEnabled === true && release.tablePolicy.twoLogoCardBacksPerOpponent === true, 'Phase 381 presentation policy changed');
assert(release.apkVersionName === '0.1.0-rc2' && release.apkVersionCode === 2, 'APK version changed');
assert(release.releaseReady === true, 'Verified APK is not release-ready');
assert(release.forceUpdate === false && release.showUpdatePrompt === false && release.manualUpdateOnly === true, 'APK prompt policy changed');

assert(lowPower.includes('function scoreFive(cards)'), 'Low-power deterministic evaluator missing');
assert(lowPower.includes('function burn()'), 'Low-power burn cards missing');
assert(lowPower.includes('SVR card back'), 'Low-power SVR logo card backs missing');
assert(profile.includes('profileShowroomCanvas'), 'Profile live avatar camera was removed');
assert(profile.includes('avatar.html?v=') || profile.includes('../game/avatar-vr.html?v='), 'Profile no longer connects to an avatar dressing-room route');
assert(dressingRoom.includes('PHASE-353-VR-AVATAR-DRESSING-ROOM-LIVE-PEDESTAL-LOCK'), 'VR dressing room authority was removed');
assert(dressingRoom.includes('togglePedestal'), 'Moving avatar pedestal was removed');

console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-363-ANDROID-CANONICAL-TABLE-JOIN-BANKROLL-AUDIO-LOCK',
  successorBuild: 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK',
  startingStack: 15000,
  players: 6,
  reliableRaise: true,
  holdemStreetOrder: ['preflop', 'flop', 'turn', 'river', 'showdown'],
  joinLabel: 'JOIN NOW',
  lobbyBeforeSeat: true,
  sound: true,
  avatarShowroomsProtected: true,
  apk: `${release.apkVersionName}/${release.apkVersionCode}`
}, null, 2));
