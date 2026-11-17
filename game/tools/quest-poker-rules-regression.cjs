const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let timers = new Map(), serial = 0;
const keys = {};
const context = vm.createContext({console, performance, Date, Math, Map, Set,
  window: {SVR_POKER_QA_PASSIVE_BOTS:true, dispatchEvent(){}, addEventListener(){}},
  document: {addEventListener(type, fn){keys[type] = fn}},
  localStorage: {getItem(){return null},setItem(){},removeItem(){}},
  CustomEvent: class {constructor(type,init){this.type=type;this.detail=init?.detail}},
  setTimeout(fn){const id=++serial;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}
});
for (const file of ['phase336_poker_evaluator.js','phase336_authoritative_engine.js']) {
  vm.runInContext(fs.readFileSync('game/modules/'+file,'utf8').replace(/^import .*;$/gm,'').replace(/export /g,''), context);
}
const run = s=>vm.runInContext(s,context);
run('boot()');
const original = run('JSON.stringify({hand:state.handNo,deck:state.deck,players})');
assert.equal(run('startHand()'),false);
keys.keydown({key:'h'});
assert.equal(run('JSON.stringify({hand:state.handNo,deck:state.deck,players})'),original,'NEXT and H cannot destroy an active hand');
function closedTurn(stack=1000) {
  timers.clear();
  run(`players.forEach(p=>{p.folded=true;p.hand=[];p.contributed=0;p.bet=0;p.acted=false;p.allIn=false});
    Object.assign(players[0],{folded:false,hand:[{v:14,s:'S'},{v:14,s:'H'}],stack:${stack},bet:100,contributed:100,raiseClosed:true});
    Object.assign(players[1],{folded:false,hand:[{v:13,s:'S'},{v:13,s:'H'}],stack:1000,bet:150,contributed:150,raiseClosed:false});
    Object.assign(state,{phase:'preflop',current:0,currentBet:150,minRaise:100,waitingHuman:true});`);
}
for (const input of ["'allin'","{type:'bet',raiseTo:400}","{type:'physical-bet',amount:400}","{type:'raise',raiseTo:400}"]) {
  closedTurn();const before=run('JSON.stringify({players,state})');
  assert.equal(run('action('+input+')'),false,input+' must respect closed raising');
  assert.equal(run('JSON.stringify({players,state})'),before,'rejected action must preserve chips and turn');
}
closedTurn(25);
assert.ok(run('legal().includes("allin")'),'a short all-in call remains legal');
assert.equal(run('action("allin")'),true);
assert.equal(run('players[0].contributed'),125);
assert.equal(run('resetTable(1000)'),true,'deliberate reset can start a fresh table');
for(let hand=0;hand<100;hand++) {
  let steps=0;
  while(run('state.phase')!=='showdown') {
    assert.ok(++steps<1000,'hand must terminate');
    if(run('state.waitingHuman')) assert.equal(run('action("checkcall")'),true);
    else {const entry=timers.entries().next().value;assert.ok(entry,'bot turn must have a timer');timers.delete(entry[0]);entry[1]();}
  }
  assert.equal(run('players.reduce((s,p)=>s+p.stack,0)'),6000,'settlement conserves all chips');
  assert.equal(run('state.community.length'),5);
  assert.equal(run('state.burn.length'),3);
  assert.equal(run('new Set([...state.deck,...state.burn,...state.community,...players.flatMap(p=>p.hand)].map(c=>c.id)).size'),52,'each card occurs once');
  if(hand<99) assert.equal(run('startHand()'),true);
}
console.log('PASS: active-hand restart protection, closed raising across all input paths, short all-in calls, explicit reset, and 100 complete hands with chip/card conservation.');
