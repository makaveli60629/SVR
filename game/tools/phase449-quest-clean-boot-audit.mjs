import assert from 'node:assert/strict';
import fs from 'node:fs';

const game = fs.readFileSync('game/index.html','utf8');
const quest = fs.readFileSync('game/quest.html','utf8');
const lock = fs.readFileSync('game/modules/phase449_quest_clean_boot_teleport_height_lock.js','utf8');
const seat = fs.readFileSync('game/modules/phase446_quest_lab_table_seat_lock.js','utf8');

assert.match(game,/Loading SVR Poker lobby automatically/);
assert.match(game,/Ready\. Enter VR/);
assert.doesNotMatch(game,/\.quest-direct #safeStage/);
assert.match(game,/phase449_quest_clean_boot_teleport_height_lock\.js/);
assert.match(quest,/phase449/);
for (const flag of ['SVR_TELEPORT_ENABLED','SVR_HAND_TELEPORT_ENABLED','SVR_WATCH_TELEPORT_ENABLED','SVR_GRIP_TELEPORT_ENABLED','SVR_TABLE_TRAVEL_ENABLED','SVR_MOVEMENT_ENABLED','SVR_LOCOMOTION_ENABLED']) assert.match(lock,new RegExp(flag));
assert.match(lock,/Object\.defineProperty/);
assert.match(seat,/TARGET_EYE_ABOVE_TABLE/);
assert.match(seat,/seatY/);
assert.match(game,/quest-ready/);
assert.match(seat,/PLAYER_RAIL_GAP = 0\.16/);
assert.match(seat,/svrPhase452TurnedForEric/);
assert.match(seat,/QUEST_TABLE_SCALE_TRIM = 0\.96/);
assert.match(seat,/PHASE441_TABLE_SAFE_DECALS/);
assert.match(seat,/clearFloatingTableLines/);
const clutterPattern = seat.match(/const TABLE_CLUTTER = \/(.+)\/i;/)?.[1] || '';
for (const gameplayName of ['CARD','CHIP','POT','LABEL','INTERACTION']) assert.equal(clutterPattern.split('|').includes(gameplayName),false,'cleanup must preserve '+gameplayName);
assert.doesNotMatch(game,/>RETRY GAME<\/button>/);
console.log('PHASE-449-QUEST-CLEAN-AUTO-BOOT-TELEPORT-HEIGHT-LOCK audit passed.');
