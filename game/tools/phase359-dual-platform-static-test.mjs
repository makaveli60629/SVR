import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const continuity = read('game/modules/phase359_dual_platform_gameplay_continuity_lock.js');
const shuffle = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');
const indexText = read('game/index.html');
const androidText = read('game/android.html');
const androidRelease = JSON.parse(read('game/android-release.json'));
const questRelease = JSON.parse(read('game/quest-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));

assert.match(continuity, /PHASE-359-DUAL-PLATFORM-GAMEPLAY-CONTINUITY-LOCK/);
assert.match(continuity, /phase336_authoritative_engine\.js/);
assert.match(continuity, /CONTINUOUS_DELAY_MS\s*=\s*9000/);
assert.match(continuity, /PHASE359_QUEST_WINNER_CARDS_AMOUNT_PANEL/);
assert.match(continuity, /NEXT HAND IN/);
assert.match(continuity, /SVR_PHASE359_NEXT_HAND/);
assert.match(continuity, /SVR_PHASE359_TOGGLE_CONTINUOUS/);
assert.match(continuity, /left-input-moves-left-right-input-moves-right/);
assert.match(continuity, /headset-look-direction/);
assert.match(continuity, /hold-to-aim-release-to-teleport/);

assert.match(shuffle, /PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK/);
assert.match(shuffle, /crypto\.getRandomValues/);
assert.match(shuffle, /SVR_PHASE336_POKER_SNAPSHOT_V1/);
assert.match(shuffle, /SVR_PHASE360_FRESH_ON_JOIN_V1/);
assert.match(shuffle, /function secureNext/);
assert.match(shuffle, /function armFreshJoin/);
assert.match(shuffle, /function joinFreshTable/);
assert.match(shuffle, /practice-table-reset/);
assert.match(shuffle, /SVR_PHASE360_META_CARD_GRAB_QA/);
assert.match(shuffle, /physicalHeadsetAcceptancePending: true/);

assert.match(phase361, /PHASE-361-QUEST-LOBBY-PLAY-SEAT-WATCH-NPC-LOCK/);
assert.match(phase361, /PLAY GAME/);
assert.match(phase361, /LEAVE TABLE/);
assert.match(phase361, /SVR_PHASE360_JOIN_TABLE/);
assert.match(phase361, /SVR_PHASE360_LEAVE_TABLE/);

assert.match(indexText, /data-build="PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK"/);
assert.match(indexText, /data-release="PHASE-361-QUEST-LOBBY-PLAY-SEAT-WATCH-NPC-LOCK"/);
assert.match(indexText, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase361/);
assert.match(indexText, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase361/);
assert.match(indexText, /phase361_quest_lobby_play_seat_watch_npc_lock\.js\?v=phase361/);
assert.ok(indexText.indexOf('await bootPlatform()') < indexText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js'));
assert.ok(indexText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js') < indexText.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js'));
assert.ok(indexText.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js') < indexText.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js'));

assert.match(androidText, /data-build="PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK"/);
assert.match(androidText, /data-release="PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK"/);
assert.match(androidText, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase360/);
assert.match(androidText, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase360/);
assert.ok(androidText.indexOf('phase357_android_table_status_showdown_ante_lock.js') < androidText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js'));
assert.ok(androidText.indexOf('phase359_dual_platform_gameplay_continuity_lock.js') < androidText.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js'));

assert.equal(questRelease.phase, 361);
assert.equal(questRelease.browserAcceptance.passed, true);
assert.equal(questRelease.browserAcceptance.baseGameplayCertification, 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK');
assert.equal(questRelease.browserAcceptance.uploadedTable, 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED');
assert.equal(questRelease.browserAcceptance.fallbackTablePresent, false);
assert.equal(questRelease.browserAcceptance.handsPrimary, true);
assert.equal(questRelease.browserAcceptance.controllerFallback, true);
assert.equal(questRelease.browserAcceptance.holeCards, 2);
assert.equal(questRelease.browserAcceptance.communityCards, 5);
assert.equal(questRelease.browserAcceptance.nextHand.advanced, true);
assert.equal(questRelease.phase361SessionContract.startsStandingInLobby, true);
assert.equal(questRelease.phase361SessionContract.leaveTableButtonRequired, true);

assert.equal(androidRelease.browserAcceptance.passed, true);
assert.equal(androidRelease.browserAcceptance.holeCards, 2);
assert.equal(androidRelease.browserAcceptance.communityCards, 5);
assert.equal(androidRelease.browserAcceptance.winnerRecorded, true);
assert.equal(androidRelease.browserAcceptance.settledPotRecorded, true);
assert.equal(androidRelease.browserAcceptance.nextHandAdvanced, true);
assert.equal(androidRelease.browserAcceptance.singleControllerPassed, true);
assert.equal(androidRelease.browserAcceptance.legacyControllerRoots, 0);

assert.equal(manifest.phase, 360);
assert.equal(manifest.build, 'PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK');
assert.match(manifest.start_url, /v=phase360/);
assert.equal(manifest.apk_version_name, '0.1.0-rc1');
assert.equal(manifest.apk_version_code, 1);
assert.equal(manifest.release_ready, false);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);
assert.equal(manifest.manual_update_only, true);

const tablePath = path.join(root, 'game/assets/table.fbx');
assert.equal(fs.existsSync(tablePath), true, 'game/assets/table.fbx must exist');
assert.ok(fs.statSync(tablePath).size > 1024, 'uploaded table FBX must be non-empty');

console.log(JSON.stringify({
  build: manifest.build,
  android: 'phase357 protected with phase360 Android successor',
  quest: 'phase358 gameplay protected with phase361 lobby/seat successor',
  continuity: 'phase359 protected',
  shuffle: 'phase360 secure-session protected',
  uploadedTableFbx: fs.statSync(tablePath).size,
  continuousDelayMs: 9000,
  apk: `${manifest.apk_version_name} (${manifest.apk_version_code})`,
  pass: true
}, null, 2));
