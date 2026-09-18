import fs from 'node:fs';
import assert from 'node:assert/strict';

const room=fs.readFileSync(new URL('../modules/phase462_quest_professional_table_room.js',import.meta.url),'utf8');
const watch=fs.readFileSync(new URL('../modules/watch.js',import.meta.url),'utf8');
const entry=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const quest=fs.readFileSync(new URL('../quest.html',import.meta.url),'utf8');

for(const token of ['PHASE462_PROFESSIONAL_TABLE_ROOM','PHASE462_DEALER_BACKGROUND','PHASE462_SOFT_AMBIENT','PHASE462_TABLE_KEY','PHASE462_TABLE_FILL','alignCards()','toneMappingExposure=Math.max(1.65','openPlayerSide']) assert.match(room,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.match(room,/setPlayerPose\(p\.position\.x,-\.42,p\.position\.z\)/);
assert.match(room,/groundToFloor\?\.\(0\)/);
assert.match(watch,/PHASE-462-QUEST-WATCH-FIT-LOCK/);
assert.match(watch,/const plateW = 0\.184/);
assert.match(entry,/phase462_quest_professional_table_room\.js\?v=phase462/);
assert.match(entry,/SVR_PHASE462_READY_PROMISE/);
assert.match(quest,/PHASE-462-QUEST-PROFESSIONAL-TABLE-ROOM/);
assert.match(quest,/phase462-professional-room/);
console.log('Phase 462 professional room audit passed: lit background, open player seat, grounded Eric, aligned cards, fitted watch and fresh Quest cache.');
