import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const html = read('game/android.html');
const core = read('game/modules/phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const table = read('game/modules/phase363_android_canonical_table_asset_lock.js');
const join = read('game/modules/phase363_android_join_control_capture_lock.js');
const consistency = read('game/modules/phase363_android_settlement_lobby_consistency_lock.js');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const profile = read('site/profile.html');
const dressingRoom = read('game/avatar-vr.html');

assert(html.includes('v=phase363'), 'Android route is not Phase 363');
assert(html.includes('SVR_REQUIRE_TABLE_JOIN=true'), 'Android does not require JOIN before cards');
assert(html.includes('SVR_TABLE_STARTING_STACK=15000'), 'Android starting stack flag is not 15,000');
assert(html.includes('phase363_android_canonical_table_asset_lock.js'), 'Canonical table authority is not loaded');
assert(html.includes('phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js'), 'Integrated Android core is not loaded');
assert(html.includes('phase363_android_join_control_capture_lock.js'), 'Final JOIN capture authority is not loaded');
assert(html.includes('phase363_android_settlement_lobby_consistency_lock.js'), 'Settlement/lobby consistency authority is not loaded');
assert(!html.includes('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js'), 'Legacy 10,000-chip module still loads on Android');

const coreIndex = html.indexOf('phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const joinIndex = html.indexOf('phase363_android_join_control_capture_lock.js');
const consistencyIndex = html.indexOf('phase363_android_settlement_lobby_consistency_lock.js');
assert(coreIndex >= 0 && joinIndex > coreIndex && consistencyIndex > joinIndex, 'Phase 363 final Android authority order is incorrect');

assert(core.includes('const STARTING_STACK = 15000'), 'Integrated core starting stack is not 15,000');
assert(core.includes('const TABLE_BANKROLL = STARTING_STACK * players.length'), 'Integrated core does not calculate table bankroll');
assert(core.includes("LOBBY: 'LOBBY'"), 'Lobby state is missing');
assert(core.includes("SEATED: 'SEATED'"), 'Seated state is missing');
assert(core.includes('prepareLobby'), 'Lobby card-clear authority is missing');
assert(core.includes('resetTable(STARTING_STACK)'), 'JOIN does not start a fresh 15,000-chip table');
assert(core.includes("PokerAudio.play('card_shuffle')"), 'Shuffle sound trigger is missing');
assert(core.includes("PokerAudio.play('card_deal')"), 'Deal sound trigger is missing');
assert(core.includes("PokerAudio.play('chip_bet')"), 'Chip sound trigger is missing');
assert(core.includes("PokerAudio.play('win_pot')"), 'Winner sound trigger is missing');
assert(core.includes('navigator.vibrate'), 'Android haptics are missing');
assert(core.includes("window.addEventListener('deviceorientation'"), 'Gyro listener is missing');
assert(core.includes('touchYaw'), 'Touch-drag look offset is missing');
assert(core.includes('adjustFov'), 'Dynamic FOV is missing');
assert(core.includes('seatParallax'), 'Seated lateral parallax is missing');
assert(core.includes('BANKROLL 15,000'), 'Visible bankroll HUD is missing');
assert(core.includes('JOIN TABLE TO RECEIVE CARDS'), 'Lobby no-card instruction is missing');

assert(table.includes('../assets/models/table.glb'), 'Verified GLB table is not first candidate');
assert(table.includes('../assets/table.fbx'), 'Verified FBX fallback is missing');
assert(!table.includes('../assets/table.obj'), 'Unverified OBJ path would generate a failed request');
assert(table.includes('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED'), 'Uploaded table authority name is missing');

assert(join.includes("window.addEventListener('pointerdown'"), 'JOIN capture listener is missing');
assert(join.includes('event.stopImmediatePropagation()'), 'JOIN capture does not block duplicate legacy handlers');
assert(join.includes('visible.length === 1'), 'JOIN gate does not require one visible control');
assert(join.includes("'LEAVE TABLE' : 'JOIN TABLE'"), 'JOIN/LEAVE label authority is missing');

assert(consistency.includes('effectiveTableChips'), 'Settled chip accounting is missing');
assert(consistency.includes('settledHand ? 0 : committedChips'), 'Settled contributions are still double-counted');
assert(consistency.includes('enforceLobbyCardClear'), 'Lobby engine-card cleanup is missing');
assert(consistency.includes('installAuditWrapper'), 'Lobby poker audit wrapper is missing');
assert(consistency.includes('engineHandsCleared'), 'Engine hand-clear QA is missing');

assert(manifest.phase === 363, 'Manifest phase is not 363');
assert(manifest.starting_stack === 15000, 'Manifest starting stack is not 15,000');
assert(manifest.table_bankroll === 90000, 'Manifest table bankroll is not 90,000');
assert(manifest.join_required_before_deal === true, 'Manifest does not require JOIN before dealing');
assert(manifest.cards_hidden_before_join === true, 'Manifest does not hide cards before JOIN');
assert(manifest.force_update === false && manifest.show_update_prompt === false && manifest.manual_update_only === true, 'APK update policy changed');

assert(release.currentGameBuild.includes('PHASE-363'), 'Android release is not Phase 363');
assert(release.tablePolicy.startingStackPerPlayer === 15000, 'Release stack is not 15,000');
assert(release.tablePolicy.tableBankroll === 90000, 'Release table bankroll is not 90,000');
assert(release.tablePolicy.singleJoinLeaveControl === true, 'Release does not require one JOIN/LEAVE control');
assert(release.apkVersionName === '0.1.0-rc1' && release.apkVersionCode === 1, 'APK version changed');
assert(release.forceUpdate === false && release.showUpdatePrompt === false && release.manualUpdateOnly === true, 'APK prompt policy changed');

assert(profile.includes('profileShowroomCanvas'), 'Profile live avatar camera was removed');
assert(profile.includes('../game/avatar.html'), 'Profile no longer connects to the avatar route');
assert(dressingRoom.includes('PHASE-353-VR-AVATAR-DRESSING-ROOM-LIVE-PEDESTAL-LOCK'), 'VR dressing room was removed');
assert(dressingRoom.includes('togglePedestal'), 'Moving avatar pedestal was removed');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-363-ANDROID-CANONICAL-TABLE-JOIN-BANKROLL-AUDIO-LOCK',
  startingStack: manifest.starting_stack,
  tableBankroll: manifest.table_bankroll,
  joinRequired: manifest.join_required_before_deal,
  settledChipAccounting: true,
  lobbyEngineCardsCleared: true,
  audioFallback: manifest.web_audio_synth_fallback,
  gyroTouchHybrid: manifest.gyro_touch_hybrid,
  profileShowroomProtected: true,
  vrDressingRoomProtected: true
}, null, 2));
