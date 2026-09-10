import assert from 'node:assert/strict';
import fs from 'node:fs';

const deploy=fs.readFileSync('.github/workflows/deploy.yml','utf8');
const game=fs.readFileSync('game/index.html','utf8');
const seat=fs.readFileSync('game/modules/phase446_quest_lab_table_seat_lock.js','utf8');
const teleport=fs.readFileSync('game/modules/phase449_quest_clean_boot_teleport_height_lock.js','utf8');

assert.doesNotMatch(deploy,/test -s publish\/game\/tools\//);
assert.doesNotMatch(deploy,/\(cd publish && node game\/tools\//);
assert.match(deploy,/phase449-quest-clean-boot-audit\.mjs/);
assert.match(deploy,/questAutomaticLobbyBoot": false/);
assert.match(deploy,/questDirectTableRoom": true/);
assert.match(deploy,/questLobbyEnabled": false/);
assert.match(deploy,/questPokerControlsPreserved": true/);

for (const authority of [
  'phase359_dual_platform_gameplay_continuity_lock.js',
  'phase360_fresh_shuffle_leave_reset_continuous_table_lock.js',
  'phase360_table_conservation_next_guard_lock.js',
  'phase365_quest_vr_button_dedupe_lock.js',
  'phase396_quest_seated_clean_table_deal_lock.js',
  'phase449_quest_clean_boot_teleport_height_lock.js',
  'phase453_quest_direct_table_room_lock.js'
]) assert.match(game,new RegExp(authority.replaceAll('.','\\.')));

const clutterPattern=seat.match(/const TABLE_CLUTTER = \/(.+)\/i;/)?.[1]||'';
for(const item of ['CARD','CHIP','POT','LABEL','INTERACTION']) assert.equal(clutterPattern.split('|').includes(item),false);
for(const flag of ['SVR_TELEPORT_ENABLED','SVR_HAND_TELEPORT_ENABLED','SVR_WATCH_TELEPORT_ENABLED','SVR_GRIP_TELEPORT_ENABLED']) assert.match(teleport,new RegExp(flag));

console.log('PHASE-450-DEPLOY-GAMEPLAY-RECOVERY audit passed.');
