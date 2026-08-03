import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(file, 'utf8');
const runtime = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const guard = read('game/modules/phase360_table_conservation_next_guard_lock.js');
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');
const phase363 = read('game/modules/phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js');
const android = read('game/android.html');
const quest = read('game/index.html');
const gesture = read('game/modules/phase334_table_layout_gesture_poker_lock.js');
const engine = read('game/modules/phase336_authoritative_engine.js');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));

for (const pattern of [
  /PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK/,
  /crypto\.getRandomValues/,
  /Math\.random = secureRandom/,
  /SVR_PHASE336_POKER_SNAPSHOT_V1/,
  /SVR_PHASE360_TABLE_SESSION_V1/,
  /SVR_PHASE360_FRESH_ON_JOIN_V1/,
  /function secureReset/,
  /function secureNext/,
  /function armFreshJoin/,
  /function joinFreshTable/,
  /function requiresPracticeReset/,
  /practice-table-reset/,
  /SVR_PHASE360_FRESH_HAND/,
  /SVR_PHASE360_LEAVE_TABLE/,
  /SVR_PHASE360_JOIN_TABLE/,
  /SVR_PHASE360_SECURE_NEXT_HAND/,
  /SVR_PHASE360_META_CARD_GRAB_QA/,
  /physicalHeadsetAcceptancePending: true/,
  /exactDeckRepeats === 0/
]) assert.match(runtime, pattern);
for (const pattern of [
  /PHASE-360-TABLE-CONSERVATION-NEXT-GUARD-LOCK/,
  /stackChips/,
  /committedChips/,
  /totalTableChips/,
  /expectedTableBankroll/,
  /SVR_PHASE362_CONSTANTS\?\.TABLE_BANKROLL/,
  /\['showdown', 'idle'\]/,
  /rejectedPrematureNext/,
  /prematureNextProtected: true/,
  /SVR_PHASE360_CHIP_TOTALS/,
  /SVR_PHASE360_EXPECTED_TABLE_BANKROLL/,
  /SVR_PHASE360_NEXT_ALLOWED/
]) assert.match(guard, pattern);
assert.match(engine, /function shuffledDeck\(\)/);
assert.match(engine, /localStorage\.setItem\(SAVE/);
assert.match(engine, /Date\.now\(\) - snapshot\.savedAt > 1800000/);
for (const pattern of [/function nearestHumanCard/, /function grabCard/, /function releaseCard/, /pointer\.down/, /window\.SVR_POKER_ACTION\?\.\("fold"\)/]) assert.match(gesture, pattern);

// Android remains JOIN-gated and does not auto-run the Quest/desktop session modules.
assert.match(android, /data-release="PHASE-(?:363|3[6-9]\d)-/);
for (const module of [
  'phase363_android_canonical_table_asset_lock.js',
  'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js',
  'phase363_android_join_control_capture_lock.js'
]) assert.match(android, new RegExp(`${module.replaceAll('.', '\\.')}\\?v=phase(?:363|3[6-9]\\d)`));
assert.doesNotMatch(android, /phase359_dual_platform_gameplay_continuity_lock\.js/);
assert.doesNotMatch(android, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js/);
assert.doesNotMatch(android, /phase360_table_conservation_next_guard_lock\.js/);
for (const pattern of [
  /const STARTING_STACK = 15000/,
  /const TABLE_BANKROLL = STARTING_STACK \* players\.length/,
  /clearSavedHand/,
  /resetTable\(STARTING_STACK\)/,
  /function prepareLobby/,
  /function joinTable/,
  /function leaveTable/
]) assert.match(phase363, pattern);
assert.equal(release.tablePolicy.startingStackPerPlayer, 15000);
assert.equal(release.tablePolicy.tableBankroll, 90000);
assert.equal(release.tablePolicy.freshTableOnLeaveRejoin, true);

assert.match(quest, /data-release="PHASE-(?:361|3[6-9]\d)-/);
for (const module of [
  'phase359_dual_platform_gameplay_continuity_lock.js',
  'phase360_fresh_shuffle_leave_reset_continuous_table_lock.js',
  'phase360_table_conservation_next_guard_lock.js',
  'phase361_quest_lobby_play_seat_watch_npc_lock.js'
]) assert.match(quest, new RegExp(`${module.replaceAll('.', '\\.')}\\?v=phase(?:361|3[6-9]\\d)`));
const questOrder = [
  'phase359_dual_platform_gameplay_continuity_lock.js',
  'phase360_fresh_shuffle_leave_reset_continuous_table_lock.js',
  'phase360_table_conservation_next_guard_lock.js',
  'phase361_quest_lobby_play_seat_watch_npc_lock.js'
].map((token) => quest.indexOf(token));
assert.ok(questOrder.every((index) => index >= 0) && questOrder.every((index, i) => i === 0 || index > questOrder[i - 1]), 'Quest Phase 359-361 load order invalid');
const questSuccessor = quest.indexOf('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js');
assert.ok(questSuccessor < 0 || questOrder.at(-1) < questSuccessor, 'Quest successor policy must load after Phase 361');

for (const pattern of [/SVR_PHASE360_JOIN_TABLE/, /SVR_PHASE360_LEAVE_TABLE/, /SVR_PHASE359_TOGGLE_CONTINUOUS/]) assert.match(phase361, pattern);

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

console.log(JSON.stringify({
  pass: true,
  build: manifest.build,
  random: 'phase360 crypto shuffle preserved for Quest and desktop',
  androidLeave: 'phase363 deliberate leave clears cards and restores fresh 15,000-chip JOIN state',
  androidConservation: 'phase363 requires 90,000 total test chips',
  questConservation: 'phase360 stack plus committed accounting preserved',
  nextHand: 'Phase 336 and protected platform policies remain authoritative',
  metaCards: 'pinch and trigger pickup source contract present; physical headset acceptance pending',
  geometrySuccessor: 'phase364 table-floor-spawn-seat alignment',
  apk: `${manifest.apk_version_name} (${manifest.apk_version_code})`
}, null, 2));
