import assert from 'node:assert/strict';
import {
  PHASE448_BUILD,
  TABLE_TELEPORT_ENABLED,
  normalizeQuestIntent,
  createIntentGate,
  createFrameMonitor,
  evaluateSeatedComfort
} from '../labs/pro-playtest/phase448-quest-comfort-input.js';

assert.equal(TABLE_TELEPORT_ENABLED,false);
const gate=createIntentGate({debounceMs:180});
const first=gate.accept({source:'right-controller',action:'select',targetId:'call',at:1000,pressure:1});
assert.equal(first.accepted,true);
assert.equal(gate.accept({source:'right-controller',action:'select',targetId:'call',at:1100,pressure:1}).reason,'debounced');
assert.throws(()=>normalizeQuestIntent({source:'headset',action:'select',targetId:'fold',at:1000}),/invalid-source/);

const monitor=createFrameMonitor({windowSize:10,targetHz:72});
[10,11,12,13,12,11,10,12,13,11].forEach(ms=>monitor.sample(ms));
assert.equal(monitor.snapshot().withinBudget,true);
monitor.sample(30);
assert.equal(monitor.snapshot().withinBudget,false);

assert.equal(evaluateSeatedComfort({eyeHeight:1.58,seatDrift:.02,faceObstructionDistance:.8,teleportEnabled:false}).pass,true);
const unsafe=evaluateSeatedComfort({eyeHeight:1.9,seatDrift:.2,faceObstructionDistance:.2,teleportEnabled:true});
assert.deepEqual(unsafe.failures,['eye-height','seat-drift','face-obstruction','teleport-enabled']);
console.log(PHASE448_BUILD+' audit passed.');
