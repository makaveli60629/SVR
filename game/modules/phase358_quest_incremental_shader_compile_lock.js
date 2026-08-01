import * as THREE from 'three';

export const BUILD = 'PHASE-358-QUEST-INCREMENTAL-SHADER-COMPILE-LOCK';

const params = new URLSearchParams(location.search);
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'quest'
  || params.get('platform') === 'quest'
  || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  restored: false,
  compileCallsDeferred: 0,
  compileAsyncCallsDeferred: 0,
  installedAt: null,
  restoredAt: null
};

const prototype = THREE.WebGLRenderer?.prototype;
let originalCompile = null;
let originalCompileAsync = null;

function install() {
  if (!ACTIVE || !prototype || state.installed) return state;
  state.installed = true;
  state.installedAt = new Date().toISOString();
  originalCompile = prototype.compile;
  originalCompileAsync = prototype.compileAsync;

  prototype.compile = function phase358QuestDeferredCompile() {
    state.compileCallsDeferred += 1;
    return this;
  };

  prototype.compileAsync = async function phase358QuestDeferredCompileAsync() {
    state.compileAsyncCallsDeferred += 1;
    return this;
  };

  window.SVR_PHASE358_QUEST_SHADER_STATE = state;
  return state;
}

function restore() {
  if (!state.installed || state.restored || !prototype) return state;
  if (typeof originalCompile === 'function') prototype.compile = originalCompile;
  if (typeof originalCompileAsync === 'function') prototype.compileAsync = originalCompileAsync;
  else delete prototype.compileAsync;
  state.restored = true;
  state.restoredAt = new Date().toISOString();
  window.SVR_PHASE358_QUEST_SHADER_STATE = state;
  return state;
}

function qa() {
  return {
    ...state,
    incrementalDuringCriticalBoot: state.installed,
    originalsRestoredAfterReady: state.restored,
    pass: !ACTIVE || state.installed
  };
}

if (ACTIVE) {
  install();
  window.addEventListener('svr:platform-ready', () => setTimeout(restore, 0), { once: true });
  setTimeout(() => {
    if (window.SVR_PLATFORM_READY === true) restore();
  }, 15000);
}

window.SVR_PHASE358_QUEST_SHADER_QA = qa;
window.SVR_PHASE358_QUEST_SHADER_RESTORE = restore;
