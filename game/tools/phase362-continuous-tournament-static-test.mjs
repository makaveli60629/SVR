import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('game/modules/phase362_continuous_10000_turn_clock_rejoin_reset_lock.js');
const settlement = read('game/modules/phase362_settlement_accounting_clear_lock.js');
const questEntry = read('game/index.html');
const androidEntry = read('game/android.html');
const manifest = JSON.parse(read('game/manifest.json'));
const androidRelease = JSON.parse(read('game/android-release.json'));
const questRelease = JSON.parse(read('game/quest-release.json'));
const phase361 = read('game/modules/phase361_quest_lobby_play_seat_watch_npc_lock.js');

assert.match(runtime, /STARTING_STACK\s*=\s*10000/);
assert.match(runtime, /TABLE_BANKROLL\s*=\s*STARTING_STACK\s*\*\s*players\.length/);
assert.match(runtime, /TURN_MS\s*=\s*15000/);
assert.match(runtime, /action\('fold'\)/);
assert.match(runtime, /player\.human\s*=\s*true/);
assert.match(runtime, /champion-reset/);
assert.match(runtime, /rejoin-reset/);
assert.match(runtime, /fundedPlayers\(\)\.length/);
assert.match(runtime, /SVR_PHASE362_RESET_TOURNAMENT/);
assert.match(runtime, /SVR_PHASE362_TIMEOUT_CURRENT/);
assert.match(runtime, /PHASE362_QUEST_TURN_CLOCK/);
assert.match(runtime, /svr362TurnClock/);
assert.match(runtime, /crypto\?\.getRandomValues|crypto\.getRandomValues/);

assert.match(settlement, /PHASE-362-SETTLEMENT-ACCOUNTING-CLEAR-LOCK/);
assert.match(settlement, /settledShowdown/);
assert.match(settlement, /player\.contributed = 0/);
assert.match(settlement, /player\.bet = 0/);
assert.match(settlement, /state\.settledPot/);
assert.match(settlement, /state\.winners/);
assert.match(settlement, /SVR_PHASE362_SETTLEMENT_QA/);
assert.match(settlement, /svr:phase362-settlement-accounting-cleared/);

assert.match(questEntry, /phase362_continuous_10000_turn_clock_rejoin_reset_lock\.js\?v=phase362/);
assert.match(questEntry, /phase362_settlement_accounting_clear_lock\.js\?v=phase362/);
assert.ok(
  questEntry.indexOf('phase362_settlement_accounting_clear_lock.js')
    > questEntry.indexOf('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js'),
  'Quest settlement correction must load after Phase 362 policy'
);
assert.match(questEntry, /SVR_PHASE362_LEAVE_TABLE/);
assert.match(questEntry, /SVR_PHASE361_STATE\?\.seated/);
assert.match(androidEntry, /phase362_continuous_10000_turn_clock_rejoin_reset_lock\.js\?v=phase362/);
assert.match(androidEntry, /phase362_settlement_accounting_clear_lock\.js\?v=phase362/);
assert.ok(
  androidEntry.indexOf('phase362_settlement_accounting_clear_lock.js')
    > androidEntry.indexOf('phase362_continuous_10000_turn_clock_rejoin_reset_lock.js'),
  'Android settlement correction must load after Phase 362 policy'
);
assert.match(androidEntry, /SVR_PHASE362_LEAVE_TABLE/);
assert.match(androidEntry, /SVR_PHASE347_STATE\?\.seated/);

assert.equal(manifest.phase, 362);
assert.equal(manifest.starting_stack, 10000);
assert.equal(manifest.table_bankroll, 60000);
assert.equal(manifest.turn_seconds, 15);
assert.equal(manifest.auto_fold_on_timeout, true);
assert.equal(manifest.continuous_until_one_funded_player, true);
assert.equal(manifest.fresh_table_on_leave_rejoin, true);
assert.equal(manifest.apk_version_name, '0.1.0-rc1');
assert.equal(manifest.apk_version_code, 1);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);
assert.equal(manifest.manual_update_only, true);

assert.equal(androidRelease.tablePolicy.startingStackPerPlayer, 10000);
assert.equal(androidRelease.tablePolicy.tableBankroll, 60000);
assert.equal(androidRelease.tablePolicy.turnSeconds, 15);
assert.equal(androidRelease.tablePolicy.autoFoldOnTimeout, true);
assert.equal(androidRelease.forceUpdate, false);
assert.equal(androidRelease.showUpdatePrompt, false);
assert.equal(androidRelease.manualUpdateOnly, true);
assert.equal(questRelease.phase, 362);
assert.equal(questRelease.tablePolicy.startingStackPerPlayer, 10000);
assert.equal(questRelease.tablePolicy.tableBankroll, 60000);
assert.equal(questRelease.tablePolicy.turnSeconds, 15);
assert.equal(questRelease.tablePolicy.autoFoldOnTimeout, true);

assert.match(phase361, /SVR_PHASE361_PLAY_GAME/);
assert.match(phase361, /SVR_PHASE361_LEAVE_TABLE/);
assert.match(phase361, /setMovementAllowed\(true\)/);
assert.match(phase361, /setMovementAllowed\(false\)/);

console.log(JSON.stringify({
  pass: true,
  build: manifest.build,
  startingStack: manifest.starting_stack,
  tableBankroll: manifest.table_bankroll,
  turnSeconds: manifest.turn_seconds,
  settlementAccounting: 'completed bets and contributions cleared after recorded payout',
  questPlayAndLeavePreserved: true,
  apkPolicyPreserved: true
}, null, 2));
