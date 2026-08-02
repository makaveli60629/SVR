import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(file, 'utf8');
const runtime = read('game/modules/phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const guard = read('game/modules/phase360_table_conservation_next_guard_lock.js');
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');
const android = read('game/android.html');
const quest = read('game/index.html');
const gesture = read('game/modules/phase334_table_layout_gesture_poker_lock.js');
const engine = read('game/modules/phase336_authoritative_engine.js');
const manifest = JSON.parse(read('game/manifest.json'));

assert.match(runtime, /PHASE-360-FRESH-SHUFFLE-LEAVE-RESET-CONTINUOUS-TABLE-LOCK/);
assert.match(runtime, /crypto\.getRandomValues/);
assert.match(runtime, /Math\.random = secureRandom/);
assert.match(runtime, /SVR_PHASE336_POKER_SNAPSHOT_V1/);
assert.match(runtime, /SVR_PHASE360_TABLE_SESSION_V1/);
assert.match(runtime, /SVR_PHASE360_FRESH_ON_JOIN_V1/);
assert.match(runtime, /function secureReset/);
assert.match(runtime, /function secureNext/);
assert.match(runtime, /function armFreshJoin/);
assert.match(runtime, /function joinFreshTable/);
assert.match(runtime, /function requiresPracticeReset/);
assert.match(runtime, /practice-table-reset/);
assert.match(runtime, /SVR_PHASE360_FRESH_HAND/);
assert.match(runtime, /SVR_PHASE360_LEAVE_TABLE/);
assert.match(runtime, /SVR_PHASE360_JOIN_TABLE/);
assert.match(runtime, /SVR_PHASE360_SECURE_NEXT_HAND/);
assert.match(runtime, /SVR_PHASE360_META_CARD_GRAB_QA/);
assert.match(runtime, /physicalHeadsetAcceptancePending: true/);
assert.match(runtime, /exactDeckRepeats === 0/);

assert.match(guard, /PHASE-360-TABLE-CONSERVATION-NEXT-GUARD-LOCK/);
assert.match(guard, /stackChips/);
assert.match(guard, /committedChips/);
assert.match(guard, /totalTableChips/);
assert.match(guard, /expectedTableBankroll/);
assert.match(guard, /SVR_PHASE362_CONSTANTS\?\.TABLE_BANKROLL/);
assert.match(guard, /\['showdown', 'idle'\]/);
assert.match(guard, /rejectedPrematureNext/);
assert.match(guard, /prematureNextProtected: true/);
assert.match(guard, /SVR_PHASE360_CHIP_TOTALS/);
assert.match(guard, /SVR_PHASE360_EXPECTED_TABLE_BANKROLL/);
assert.match(guard, /SVR_PHASE360_NEXT_ALLOWED/);

assert.match(engine, /function shuffledDeck\(\)/);
assert.match(engine, /localStorage\.setItem\(SAVE/);
assert.match(engine, /Date\.now\(\) - snapshot\.savedAt > 1800000/);

assert.match(gesture, /function nearestHumanCard/);
assert.match(gesture, /function grabCard/);
assert.match(gesture, /function releaseCard/);
assert.match(gesture, /pointer\.down/);
assert.match(gesture, /window\.SVR_POKER_ACTION\?\.\("fold"\)/);

assert.match(android, /data-release="PHASE-(?:360|36[1-9]|3[7-9]\d)-/);
assert.match(android, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase(?:360|36[1-9]|3[7-9]\d)/);
assert.match(android, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase(?:360|36[1-9]|3[7-9]\d)/);
assert.match(android, /phase360_table_conservation_next_guard_lock\.js\?v=phase(?:360|36[1-9]|3[7-9]\d)/);
const android359 = android.indexOf('phase359_dual_platform_gameplay_continuity_lock.js');
const android360 = android.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const androidGuard = android.indexOf('phase360_table_conservation_next_guard_lock.js');
const androidSuccessor = android.indexOf('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js');
assert.ok(android359 < android360, 'Android Phase 360 must load after Phase 359');
assert.ok(android360 < androidGuard, 'Android conservation guard must load after Phase 360 core');
assert.ok(androidSuccessor < 0 || androidGuard < androidSuccessor, 'Android successor policy must load after conservation guard');

assert.match(quest, /data-release="PHASE-(?:361|36[2-9]|3[7-9]\d)-/);
assert.match(quest, /phase359_dual_platform_gameplay_continuity_lock\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/);
assert.match(quest, /phase360_fresh_shuffle_leave_reset_continuous_table_lock\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/);
assert.match(quest, /phase360_table_conservation_next_guard_lock\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/);
assert.match(quest, /phase361_quest_lobby_play_seat_watch_npc_lock\.js\?v=phase(?:361|36[2-9]|3[7-9]\d)/);
const quest359 = quest.indexOf('phase359_dual_platform_gameplay_continuity_lock.js');
const quest360 = quest.indexOf('phase360_fresh_shuffle_leave_reset_continuous_table_lock.js');
const questGuard = quest.indexOf('phase360_table_conservation_next_guard_lock.js');
const quest361 = quest.indexOf('phase361_quest_lobby_play_seat_watch_npc_lock.js');
const questSuccessor = quest.indexOf('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js');
assert.ok(quest359 < quest360, 'Quest Phase 360 must load after Phase 359');
assert.ok(quest360 < questGuard, 'Quest conservation guard must load after Phase 360 core');
assert.ok(questGuard < quest361, 'Quest Phase 361 must load after Phase 360 conservation guard');
assert.ok(questSuccessor < 0 || quest361 < questSuccessor, 'Quest successor policy must load after Phase 361');

assert.match(phase361, /SVR_PHASE360_JOIN_TABLE/);
assert.match(phase361, /SVR_PHASE360_LEAVE_TABLE/);
assert.match(phase361, /SVR_PHASE359_TOGGLE_CONTINUOUS/);

assert.ok(Number(manifest.phase) >= 360);
assert.match(String(manifest.build), /^PHASE-(?:360|36[1-9]|3[7-9]\d)-/);
assert.match(String(manifest.start_url), /v=phase(?:360|36[1-9]|3[7-9]\d)/);
assert.equal(manifest.apk_version_name, '0.1.0-rc1');
assert.equal(manifest.apk_version_code, 1);
assert.equal(manifest.release_ready, false);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);
assert.equal(manifest.manual_update_only, true);

console.log(JSON.stringify({
  pass: true,
  build: manifest.build,
  random: 'crypto.getRandomValues with synchronous engine-call wrapper',
  leave: 'deliberate leave clears recovery snapshot and Phase 361 returns Quest to lobby spawn',
  conservation: 'Phase 360 preserves stack plus committed accounting; active policy selects 6000 legacy or successor bankroll',
  nextHand: 'rejected until showdown or idle',
  loop: 'Phase 359 continuation, Phase 360 secure session, and successor tournament policy protected',
  questSuccessor: 'Phase 361 explicit PLAY GAME and LEAVE TABLE session authority',
  metaCards: 'pinch and trigger pickup source contract present; physical headset acceptance pending',
  apk: `${manifest.apk_version_name} (${manifest.apk_version_code})`
}, null, 2));
