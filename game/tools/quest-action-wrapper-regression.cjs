const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fn(file,name){const source=fs.readFileSync('game/modules/'+file,'utf8');const start=source.indexOf('function '+name+'('),brace=source.indexOf('{',start);let end=brace,depth=1;while(depth){end++;if(source[end]==='{')depth++;if(source[end]==='}')depth--;}return source.slice(start,end+1)}
let calls=0,now=2000;const snapshot={handNo:1,phase:'preflop',currentBet:20,you:{bet:0,stack:1000},need:20};
const window={SVR_POKER_ACTION:()=>{calls++;return true}};
const context=vm.createContext({window,performance:{now:()=>now},snapshot:()=>snapshot,pokerSnapshot:()=>snapshot});
vm.runInContext('var wrappedPokerAction,originalPokerAction,wrappedAction,originalAction,lastPhysicalAt=0,lastActionKey="",lastActionAt=0,blockedActions=0;'+fn('phase334_table_layout_gesture_poker_lock.js','wrapPokerAction')+fn('phase335_oculus_acceptance_gameplay_stability_lock.js','wrapAction'),context);
vm.runInContext('wrapPokerAction();wrapAction()',context);const installed=window.SVR_POKER_ACTION;
for(let i=0;i<100;i++)vm.runInContext('wrapPokerAction();wrapAction()',context);
assert.equal(window.SVR_POKER_ACTION,installed,'periodic guards must preserve the installed wrapper chain');
assert.equal(window.SVR_POKER_ACTION('checkcall'),true);assert.equal(calls,1,'accepted action reaches the engine exactly once');
assert.equal(window.SVR_POKER_ACTION('checkcall'),false);assert.equal(calls,1,'same-turn double press is rejected');
snapshot.handNo++;now+=600;assert.equal(window.SVR_POKER_ACTION('checkcall'),true);assert.equal(calls,2,'next hand input stays usable');
console.log('PASS: stable action wrapper chain, one engine call per accepted action, double-press rejection and next-hand input.');
