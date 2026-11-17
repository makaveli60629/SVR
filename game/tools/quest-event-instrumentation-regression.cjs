const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
// Isolate the actual instrumentation function so this check does not alter Node's EventTarget.
class Target {
  constructor(){this.listeners=new Map()}
  addEventListener(type,fn){this.listeners.set(type,fn)}
  removeEventListener(type,fn){if(this.listeners.get(type)===fn)this.listeners.delete(type)}
}
const window=new Target();
const context=vm.createContext({EventTarget:Target,window,state:{eventCounts:new Map()}});
const source=fs.readFileSync('game/modules/phase340_runtime_authority_registry.js','utf8');
const fn=source.slice(source.indexOf('function instrumentEvents()'),source.indexOf('function instrumentAnimationLoops()'));
vm.runInContext('"use strict";'+fn+`;instrumentEvents();
  const addEventListener=EventTarget.prototype.addEventListener;
  const removeEventListener=EventTarget.prototype.removeEventListener;
  const listener=()=>{};
  addEventListener('beforeunload',listener,{once:true});
  removeEventListener('beforeunload',listener);
  const target=new EventTarget();target.addEventListener('local',listener);
  window.testTarget=target;`,context);
assert.equal(window.listeners.size,0,'unqualified removal must use the window receiver');
assert.ok(window.testTarget.listeners.has('local'),'explicit targets must keep their own listeners');
assert.equal(context.state.eventCounts.get('beforeunload'),1);
console.log('PASS: strict module window event registration/removal and explicit EventTarget receivers.');
