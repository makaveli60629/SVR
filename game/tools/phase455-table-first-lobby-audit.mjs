import assert from 'node:assert/strict';
import fs from 'node:fs';

const quest = fs.readFileSync('game/quest.html', 'utf8');
const game = fs.readFileSync('game/index.html', 'utf8');
const room = fs.readFileSync('game/modules/phase455_quest_table_first_lobby.js', 'utf8');

assert.match(quest, /PHASE-455-QUEST-TABLE-FIRST-BOOT/);
assert.match(quest, /tableonly:'1'/);
assert.doesNotMatch(quest, /low power|recovery needed|phase three|73 stable lobby/i);
assert.match(game, /role="progressbar"/);
assert.match(game, /phase455_quest_table_first_lobby\.js/);
assert.match(game, /Table ready\. Enter VR\./);
assert.doesNotMatch(game, /Recovery mode is restoring/);
assert.match(room, /PHASE444_SINGLE_HEADS_UP_PLAYER/);
assert.match(room, /SVR_PHASE390_DIRECT_FRONT_SEAT/);
assert.match(room, /state\.duplicates === 0/);
assert.match(room, /SVR_TELEPORT_DISABLED = true/);

console.log('Phase 455 table-first lobby audit: 12/12 passed');
