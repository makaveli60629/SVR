import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const continuity = read('game/modules/phase359_dual_platform_gameplay_continuity_lock.js');
const shuffle = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');
const phase363 = read('game/modules/phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const indexText = read('game/index.html');
const androidText = read('game/android.html');
const androidRelease = JSON.parse(read('game/android-release.json'));
const questRelease = JSON.parse(read('game/quest-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));

for (const pattern of [
  /PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK/,
  /phase336_authoritative_engine\.js/,
  /CONTINUOUS_DELAY_MS\s*=\s*9000/,
  /PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL/,
  /NEXT HAND IN/,
  /SVR_PHASE359_NEXT_HAND/,
  /SVR_PHASE359_TOGGLE_CONTINUOUS/,
  /left-input-moves-left-right-input-moves-right/,
  /headset-look-direction/,
  /hold-to-aim-release-to-teleport/
]) assert.match(continuity, pattern);
for (const pattern of [
  /PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK/,
  /crypto\.getRandomValues/,
  /SVR_PHASE336_POKER_SNAPSHOT_V1/,
  /SVR_PHASE360_FRESH_ON_JOIN_V1/,
  /function secureNext/,
  /function armFreshJoin/,
  /function joinFreshTable/,
  /practice-table-reset/,
  /SVR_PHASE360_META_CARD_GRAB_QA/,
  /physicalHeadsetAcceptancePending: true/
]) assert.match(shuffle, pattern);
for (const pattern of [/PHASE-361-QUEST-LOBBY-PLAY-SEAT-WATCH-NPC-LOCK/, /PLAY GAME/, /LEAVE TABLE/, /SVR_PHASE360_JOIN_TABLE/, /SVR_PHASE360_LEAVE_TABLE/]) assert.match(phase361, pattern);

assert.match(indexText, /data-build="PHASE-(?:358|3[6-9]\d)-/);
assert.match(indexText, /data-release="PHASE-(?:361|3[6-9]\d)-/);
assert.match(indexText, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase(?:361|3[6-9]\d)/);
assert.match(indexText, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase(?:361|3[6-9]\d)/);
assert.match(indexText, /phase361_quest_lobby_play_seat_watch_npc_lock\.js\?v=phase(?:361|3[6-9]\d)/);
assert.ok(indexText.indexOf('await bootPlatform()') < indexText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js'));
assert.ok(indexText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js') < indexText.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js'));
assert.ok(indexText.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js') < indexText.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js'));
const questSuccessorIndex = indexText.indexOf('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js');
assert.ok(questSuccessorIndex < 0 || questSuccessorIndex > indexText.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js'));

assert.match(androidText, /data-build="PHASE-(?:363|3[6-9]\d)-/);
assert.match(androidText, /data-release="PHASE-(?:363|3[6-9]\d)-/);
for (const module of [
  'phase363_android_canonical_table_asset_lock.js',
  'phase357_android_table_status_showdown_ante_lock.js',
  'phase357_android_direct_camera_seat_fix.js',
  'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js',
  'phase363_android_join_control_capture_lock.js'
]) assert.match(androidText, new RegExp(`${module.replaceAll('.', '\\.')}\\?v=phase(?:363|3[6-9]\\d)`));
assert.doesNotMatch(androidText, /phase359_dual_platform_gameplay_continuity_lock\.js/);
assert.doesNotMatch(androidText, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js/);
assert.doesNotMatch(androidText, /phase362_continuous_10000_turn_clock_rejoin_reset_lock\.js/);
assert.ok(androidText.indexOf("await bootPlatform({forcedPlatform:'android'})") < androidText.indexOf('phase363_android_canonical_table_asset_lock.js'));
assert.ok(androidText.indexOf('phase363_android_canonical_table_asset_lock.js') < androidText.indexOf('phase357_android_table_status_showdown_ante_lock.js'));
assert.ok(androidText.indexOf('phase357_android_direct_camera_seat_fix.js') < androidText.indexOf('phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js'));
assert.ok(androidText.indexOf('phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js') < androidText.indexOf('phase363_android_join_control_capture_lock.js'));
for (const pattern of [/const STARTING_STACK = 15000/, /function prepareLobby/, /function joinTable/, /function leaveTable/]) assert.match(phase363, pattern);

assert.ok(Number(questRelease.phase) >= 361);
assert.equal(questRelease.browserAcceptance.passed, true);
assert.equal(questRelease.browserAcceptance.baseGameplayCertification, 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK');
assert.equal(questRelease.browserAcceptance.uploadedTable, 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED');
assert.equal(questRelease.browserAcceptance.fallbackTablePresent, false);
assert.equal(questRelease.browserAcceptance.handsPrimary, true);
assert.equal(questRelease.browserAcceptance.controllerFallback, true);
assert.equal(questRelease.browserAcceptance.holeCards, 2);
assert.equal(questRelease.browserAcceptance.communityCards, 5);
assert.equal(questRelease.browserAcceptance.nextHand.advanced, true);
const questSession = questRelease.phase361SessionContract || questRelease.sessionContract;
assert.equal(questSession.startsStandingInLobby, true);
assert.equal(questSession.leaveTableButtonRequired, true);

// Later Android presentation phases may replace the top-level acceptance object.
// Preserve the actual gameplay certifications and current table policy instead.
assert.equal(androidRelease.protectedAuthorities?.fullGameAcceptance, 'PHASE-354');
assert.equal(androidRelease.protectedAuthorities?.androidTableStatus, 'PHASE-357');
assert.equal(androidRelease.protectedAuthorities?.androidIntegratedFlow, 'PHASE-363');
assert.equal(androidRelease.controllerAuthority, 'PHASE-347-ANDROID-SINGLE-CONTROLLER-SEATED-GAMEPLAY-APK-RELEASE-LOCK');
assert.equal(androidRelease.androidExperience?.singleController, true);
assert.equal(androidRelease.tablePolicy.startingStackPerPlayer, 15000);
assert.equal(androidRelease.tablePolicy.tableBankroll, 90000);
assert.equal(androidRelease.tablePolicy.joinRequiredBeforeDeal, true);
assert.equal(androidRelease.tablePolicy.cardsHiddenBeforeJoin, true);
assert.equal(androidRelease.tablePolicy.singleJoinLeaveControl, true);
assert.equal(androidRelease.gameplayPolicy?.raiseControlRequired, true);
assert.deepEqual(androidRelease.gameplayPolicy?.streetOrder, ['preflop', 'flop', 'turn', 'river', 'showdown']);
const currentAcceptance = androidRelease.phase365Acceptance || androidRelease.phase363Acceptance;
assert.equal(currentAcceptance?.passed === true || currentAcceptance?.pending === true, true);
if (currentAcceptance?.passed === true) assert.equal(currentAcceptance?.browserAcceptancePassed, true);
assert.equal(androidRelease.realDeviceValidation?.pending, true);
assert.equal(androidRelease.realDeviceValidation?.ownerPlaytestRequired, true);

assert.ok(Number(manifest.phase) >= 363);
assert.match(String(manifest.build), /^PHASE-(?:363|3[6-9]\d)-/);
assert.match(String(manifest.start_url), /v=phase(?:363|3[6-9]\d)/);
assert.equal(manifest.starting_stack, 15000);
assert.equal(manifest.table_bankroll, 90000);
assert.equal(manifest.join_required_before_deal, true);
assert.equal(manifest.apk_version_name, '0.1.0-rc1');
assert.equal(manifest.apk_version_code, 1);
assert.equal(manifest.release_ready, false);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);
assert.equal(manifest.manual_update_only, true);

const tablePath = path.join(root, 'game/assets/table.fbx');
const tableGlbPath = path.join(root, 'game/assets/models/table.glb');
assert.equal(fs.existsSync(tablePath), true, 'game/assets/table.fbx must exist');
assert.equal(fs.existsSync(tableGlbPath), true, 'game/assets/models/table.glb must exist');
assert.ok(fs.statSync(tablePath).size > 1024, 'uploaded table FBX must be non-empty');
assert.ok(fs.statSync(tableGlbPath).size > 1024, 'uploaded table GLB must be non-empty');

console.log(JSON.stringify({
  build: manifest.build,
  android: 'phase347 controller, phase357 seating, phase363 JOIN-gated 15,000-chip policy and phase365 presentation protected',
  androidBrowserAcceptance: currentAcceptance?.passed === true ? 'passed' : 'pending',
  androidPhysicalDeviceValidation: 'pending-owner-playtest',
  quest: 'phase358 gameplay and phase361 lobby/seat protected with phase364 geometry successor',
  continuity: 'phase359 preserved for Quest/desktop',
  shuffle: 'phase360 preserved for Quest/desktop',
  uploadedTableFbx: fs.statSync(tablePath).size,
  uploadedTableGlb: fs.statSync(tableGlbPath).size,
  successorTableBankroll: manifest.table_bankroll,
  apk: `${manifest.apk_version_name} (${manifest.apk_version_code})`,
  pass: true
}, null, 2));
