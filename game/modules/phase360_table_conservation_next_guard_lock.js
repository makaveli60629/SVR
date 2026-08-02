import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-360-TABLE-CONSERVATION-NEXT-GUARD-LOCK';
const WRAPPED = Symbol.for('SVR_PHASE360_WRAPPED');
const GUARD = Symbol.for('SVR_PHASE360_NEXT_GUARD');
let installed = false;
let rejectedPrematureNext = 0;

function chipTotals() {
  const stackChips = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const committedChips = players.reduce((sum, player) => sum + Number(player.contributed || 0), 0);
  return {
    stackChips,
    committedChips,
    totalTableChips: stackChips + committedChips
  };
}

function nextAllowed() {
  return ['showdown', 'idle'].includes(String(state.phase || '').toLowerCase());
}

function guardNext(original, source) {
  if (typeof original !== 'function' || original[GUARD]) return original;
  const guarded = function phase360GuardedNext(...args) {
    if (!nextAllowed()) {
      rejectedPrematureNext += 1;
      window.SVR_PHASE360_LAST_REJECTED_NEXT = {
        build: BUILD,
        source,
        phase: String(state.phase || 'idle'),
        handNo: Number(state.handNo || 0),
        at: new Date().toISOString()
      };
      return false;
    }
    return original.apply(this, args);
  };
  guarded[GUARD] = true;
  guarded[WRAPPED] = true;
  guarded.phase360Original = original;
  return guarded;
}

function installNextGuards() {
  window.SVR_POKER_NEXT_HAND = guardNext(window.SVR_POKER_NEXT_HAND, 'global-next-hand');
  window.SVR_PHASE360_SECURE_NEXT_HAND = guardNext(window.SVR_PHASE360_SECURE_NEXT_HAND, 'phase360-secure-next');
}

function installQaGuard() {
  const originalQa = window.SVR_PHASE360_QA;
  if (typeof originalQa !== 'function' || originalQa[GUARD]) return;
  const guardedQa = function phase360ConservationQa() {
    const result = originalQa() || {};
    const totals = chipTotals();
    Object.assign(result, totals, {
      rejectedPrematureNext,
      prematureNextProtected: true,
      nextAllowed: nextAllowed()
    });
    result.pass = Boolean(
      result.active
      && result.nextHandWrapped
      && result.resetWrapped
      && Number(result.fundedPlayers || 0) >= 2
      && totals.totalTableChips === 6000
      && Number(result.exactDeckRepeats || 0) === 0
      && (result.platform !== 'android' || (result.androidLeaveWrapped && result.androidSitWrapped))
      && (result.platform !== 'quest' || result.metaCardGrab?.phase334Loaded)
    );
    window.SVR_PHASE360_QA_STATE = result;
    return result;
  };
  guardedQa[GUARD] = true;
  window.SVR_PHASE360_QA = guardedQa;
}

function install() {
  if (installed) return;
  if (typeof window.SVR_PHASE360_QA !== 'function') {
    setTimeout(install, 80);
    return;
  }
  installed = true;
  installNextGuards();
  installQaGuard();
  const timer = setInterval(() => {
    installNextGuards();
    installQaGuard();
  }, 500);
  window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
  window.SVR_PHASE360_CHIP_TOTALS = chipTotals;
  window.SVR_PHASE360_NEXT_ALLOWED = nextAllowed;
  window.SVR_PHASE360_CONSERVATION_GUARD = {
    build: BUILD,
    installedAt: new Date().toISOString(),
    chipTotals
  };
}

install();
