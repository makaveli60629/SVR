const ACTIONS = new Set(['check','call','bet','raise','fold','all-in']);

export const PHASE447_BUILD = 'PHASE-447-PROFESSIONAL-ACTION-STATE-CONTRACT';
export const PROTOCOL_VERSION = 1;

export function createActionCommand(input) {
  const command = {
    protocolVersion: PROTOCOL_VERSION,
    tableId: String(input.tableId || ''),
    sessionId: String(input.sessionId || ''),
    clientActionId: String(input.clientActionId || ''),
    expectedSequence: Number(input.expectedSequence),
    action: String(input.action || '').toLowerCase(),
    amount: Number(input.amount || 0),
    sentAt: Number(input.sentAt)
  };
  validateActionCommand(command);
  return Object.freeze(command);
}

export function validateActionCommand(command) {
  if (command.protocolVersion !== PROTOCOL_VERSION) throw new Error('unsupported-protocol');
  for (const key of ['tableId','sessionId','clientActionId']) {
    if (!command[key] || command[key].length > 128) throw new Error('invalid-' + key);
  }
  if (!Number.isSafeInteger(command.expectedSequence) || command.expectedSequence < 0) throw new Error('invalid-sequence');
  if (!ACTIONS.has(command.action)) throw new Error('invalid-action');
  if (!Number.isSafeInteger(command.amount) || command.amount < 0) throw new Error('invalid-amount');
  if (!Number.isSafeInteger(command.sentAt) || command.sentAt <= 0) throw new Error('invalid-sentAt');
  if ((command.action === 'bet' || command.action === 'raise') && command.amount <= 0) throw new Error('amount-required');
  if (!['bet','raise'].includes(command.action) && command.amount !== 0) throw new Error('unexpected-amount');
  return true;
}

export function reconcileAction(state, reply) {
  if (!state || !Number.isSafeInteger(state.sequence)) throw new Error('invalid-state');
  if (!reply || reply.clientActionId !== state.pendingActionId) throw new Error('action-mismatch');
  if (reply.accepted === false) {
    return Object.freeze({...state, phase:'rejected', pendingActionId:null, reason:String(reply.reason || 'rejected')});
  }
  if (!Number.isSafeInteger(reply.sequence) || reply.sequence <= state.sequence) throw new Error('stale-sequence');
  return Object.freeze({
    ...state,
    sequence: reply.sequence,
    phase:'accepted',
    pendingActionId:null,
    reason:null,
    snapshot: reply.snapshot ?? state.snapshot
  });
}

export function beginAction(state, command) {
  validateActionCommand(command);
  if (state.pendingActionId) throw new Error('action-already-pending');
  if (command.expectedSequence !== state.sequence) throw new Error('sequence-mismatch');
  return Object.freeze({...state, phase:'pending', pendingActionId:command.clientActionId, reason:null});
}
