import assert from 'node:assert/strict';
import {
  PHASE447_BUILD,
  createActionCommand,
  beginAction,
  reconcileAction
} from '../labs/pro-playtest/phase447-state-contract.js';

const base = Object.freeze({sequence:41,phase:'eligible',pendingActionId:null,snapshot:{pot:300}});
const command = createActionCommand({
  tableId:'lab-table-1',sessionId:'session-1',clientActionId:'action-42',
  expectedSequence:41,action:'raise',amount:200,sentAt:1770000000000
});
const pending = beginAction(base, command);
assert.equal(pending.phase, 'pending');
assert.throws(() => beginAction(pending, command), /action-already-pending/);

const accepted = reconcileAction(pending, {
  clientActionId:'action-42',accepted:true,sequence:42,snapshot:{pot:500}
});
assert.equal(accepted.sequence, 42);
assert.equal(accepted.snapshot.pot, 500);
assert.equal(base.sequence, 41);

const rejected = reconcileAction(pending, {
  clientActionId:'action-42',accepted:false,reason:'turn-expired'
});
assert.equal(rejected.phase, 'rejected');
assert.equal(rejected.reason, 'turn-expired');

assert.throws(() => createActionCommand({...command,clientActionId:'x',action:'fold',amount:1}), /unexpected-amount/);
assert.throws(() => reconcileAction(pending,{clientActionId:'action-42',accepted:true,sequence:41}), /stale-sequence/);

console.log(PHASE447_BUILD + ' audit passed.');
