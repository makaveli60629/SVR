import {
  state,
  players,
  action as authoritativeAction,
  resetTable,
  startHand
} from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-380-QUEST-ORIGINAL-TABLE-FULL-GAME-ACCEPTANCE-LOCK';
const PARAMS = new URLSearchParams(location.search);
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'quest'
  || PARAMS.get('platform') === 'quest'
  || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let running = false;
let lastResult = null;

function platformState() { return window.SVR_PHASE340_PLATFORM_STATE || {}; }
function loadedModules() { return [...(platformState().loaded || []), ...(platformState().deferredLoaded || [])]; }

function walk(root, visitor, limit = 20000) {
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  while (stack.length && seen.size < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    try { visitor(object); } catch {}
    for (const child of object.children || []) if (child && child !== object) stack.push(child);
  }
  return seen.size;
}

function sceneNames() {
  const names = [];
  walk(window.__SVR_SCENE__, (object) => names.push(String(object.name || '')));
  return names;
}

function configureRenderer() {
  const renderer = window.__SVR_RENDERER__;
  if (!renderer) return null;
  const ratio = Math.min(Number(devicePixelRatio || 1), 1.25);
  try { renderer.setPixelRatio(ratio); } catch {}
  try { renderer.shadowMap.enabled = false; } catch {}
  try { renderer.xr.enabled = true; } catch {}
  return {
    pixelRatio: renderer.getPixelRatio?.() || ratio,
    shadows: Boolean(renderer.shadowMap?.enabled),
    xrEnabled: Boolean(renderer.xr?.enabled),
    calls: Number(renderer.info?.render?.calls || 0),
    triangles: Number(renderer.info?.render?.triangles || 0),
    geometries: Number(renderer.info?.memory?.geometries || 0),
    textures: Number(renderer.info?.memory?.textures || 0)
  };
}

function removeAndroidControls() {
  let removed = 0;
  for (const selector of ['#svr347Root','#svr343Root','#svr326Root','#svr339Root','[data-svr-android-controller]','.svr-android-controller','.virtual-stick']) {
    for (const element of document.querySelectorAll(selector)) {
      element.remove();
      removed += 1;
    }
  }
  return removed;
}

function tableAudit() {
  const qa = window.SVR_PHASE380_ORIGINAL_TABLE_QA?.() || null;
  const names = sceneNames();
  const currentAuthority = window.SVR_TABLE_AUTHORITY?.name || null;
  const table = names.find((name) => name === 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY') || null;
  const fallbackPresent = names.includes('PHASE379_PROCEDURAL_TABLE_AUTHORITY') || names.includes('PHASE358_QUEST_TABLE_FALLBACK');
  const logo = names.find((name) => /PHASE334_CENTER_LOGO_ROOT|PHASE331_SVR_TABLE_CENTER_LOGO|PHASE341_CANONICAL_CENTER_LOGO/i.test(name)) || null;
  const potDisplay = names.find((name) => /PHASE333_PHASE358_QUEST_POT_DISPLAY_AUTHORITY|PHASE358_QUEST_RAISED_TRANSLUCENT_POT_DISPLAY/i.test(name)) || null;
  const result = {
    table,
    currentAuthority,
    uploadedTableAuthority: qa?.authorityIsOriginal === true && currentAuthority === 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY',
    originalQa: qa,
    fallbackPresent,
    logo,
    potDisplay
  };
  result.pass = Boolean(window.__SVR_SCENE__ && result.table && result.uploadedTableAuthority && !fallbackPresent && logo && potDisplay && qa?.pass === true);
  return result;
}

function inputAudit() {
  const renderer = window.__SVR_RENDERER__;
  const loaded = loadedModules();
  const result = {
    handsPrimary: loaded.some((path) => path.endsWith('phase331_quest_meta_hands_table_interaction_lock.js')) && typeof renderer?.xr?.getHand === 'function',
    controllerFallback: typeof renderer?.xr?.getController === 'function',
    stabilityModule: loaded.some((path) => path.endsWith('phase335_oculus_acceptance_gameplay_stability_lock.js')),
    androidRoots: document.querySelectorAll('#svr347Root,#svr343Root,#svr326Root,#svr339Root,[data-svr-android-controller],.svr-android-controller').length,
    snapTurnDegrees: 45,
    forwardReference: 'headset-look-direction',
    teleportContract: 'hold-to-aim-release-to-teleport',
    seatedTeleportLocked: window.SVR_PHASE373_QA?.()?.seatedTeleportBlocked !== false,
    physicalQuestSessionTested: Boolean(renderer?.xr?.isPresenting)
  };
  result.pass = result.handsPrimary && result.controllerFallback && result.stabilityModule && result.androidRoots === 0;
  return result;
}

function settlementAudit() {
  const totalStacks = players.reduce((sum, player) => sum + Number(player.stack || 0), 0);
  const fundedPlayers = players.filter((player) => Number(player.stack || 0) > 0).length;
  return {
    winners: (state.winners || []).map((winner) => ({ name: winner.name, amount: winner.amount, label: winner.label })),
    settledPot: Number(state.settledPot || 0),
    totalStacks,
    fundedPlayers,
    pass: (state.winners || []).length > 0 && Number(state.settledPot || 0) > 0 && totalStacks === 6000 && fundedPlayers >= 2
  };
}

function chooseAction() {
  const human = players.find((player) => player.human);
  if (!human || human.folded || human.allIn || human.stack <= 0) return null;
  return Math.max(0, Number(state.currentBet || 0) - Number(human.bet || 0)) > 0 ? 'call' : 'check';
}

async function waitForRuntime(timeoutMs = 120000) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    removeAndroidControls();
    configureRenderer();
    window.SVR_PHASE380_ORIGINAL_TABLE_REASSERT?.('quest-acceptance-wait');
    const loaded = loadedModules();
    const ready = Boolean(
      window.__SVR_RENDERER__ && window.__SVR_SCENE__ && window.__SVR_CAMERA__
      && typeof window.SVR_POKER_ACTION === 'function'
      && typeof window.SVR_RESET_POKER_TABLE === 'function'
      && typeof window.SVR_POKER_NEXT_HAND === 'function'
      && window.SVR_PHASE380_ORIGINAL_TABLE_QA?.().pass === true
      && window.SVR_PHASE358_POKER_BOOT_QA?.().pass === true
      && loaded.some((path) => path.endsWith('phase334_table_layout_gesture_poker_lock.js'))
      && loaded.some((path) => path.endsWith('phase335_oculus_acceptance_gameplay_stability_lock.js'))
    );
    window.SVR_PHASE380_QUEST_ACCEPTANCE_PROGRESS = {
      stage: 'waiting-runtime',
      elapsedMs: Math.round(performance.now() - started),
      loaded: loaded.length,
      failed: platformState().failed || [],
      originalTable: window.SVR_PHASE380_ORIGINAL_TABLE_QA?.() || null,
      ready,
      at: new Date().toISOString()
    };
    if (ready) return true;
    await wait(150);
  }
  return false;
}

async function driveFullHand(timeoutMs = 75000) {
  const previousPassive = window.SVR_POKER_QA_PASSIVE_BOTS;
  const started = performance.now();
  const phases = [];
  let communityMax = 0;
  let holeCards = 0;
  let humanActions = 0;
  let lastSubmittedTurnKey = null;
  try {
    window.SVR_POKER_QA_PASSIVE_BOTS = true;
    resetTable(1000);
    while (performance.now() - started < timeoutMs) {
      const phase = String(state.phase || 'idle').toLowerCase();
      if (!phases.includes(phase)) phases.push(phase);
      communityMax = Math.max(communityMax, state.community?.length || 0);
      holeCards = Math.max(holeCards, players.find((player) => player.human)?.hand?.length || 0);
      if (state.waitingHuman) {
        const human = players[state.current];
        const turnKey = [state.handNo, phase, state.actionSeq, state.current, human?.bet, state.currentBet].join(':');
        if (turnKey !== lastSubmittedTurnKey) {
          const action = chooseAction();
          if (action && authoritativeAction(action) !== false) {
            humanActions += 1;
            lastSubmittedTurnKey = turnKey;
          }
        }
      }
      if (phase === 'showdown') {
        await wait(220);
        const settlement = settlementAudit();
        return {
          pass: ['preflop', 'flop', 'turn', 'river', 'showdown'].every((item) => phases.includes(item)) && communityMax === 5 && holeCards === 2 && settlement.pass,
          phases,
          communityMax,
          holeCards,
          humanActions,
          settlement,
          elapsedMs: +(performance.now() - started).toFixed(1)
        };
      }
      await wait(40);
    }
    return { pass: false, timeout: true, phases, communityMax, holeCards, humanActions, settlement: settlementAudit(), elapsedMs: +(performance.now() - started).toFixed(1) };
  } finally {
    if (previousPassive === undefined) delete window.SVR_POKER_QA_PASSIVE_BOTS;
    else window.SVR_POKER_QA_PASSIVE_BOTS = previousPassive;
  }
}

async function runAcceptance(options = {}) {
  if (!ACTIVE) return { build: BUILD, pass: false, error: 'QUEST_ONLY' };
  if (running) return lastResult || { build: BUILD, pass: false, running: true };
  running = true;
  const started = performance.now();
  const report = {
    build: BUILD,
    platform: 'quest',
    startedAt: new Date().toISOString(),
    browserStackAcceptance: true,
    physicalQuestSessionTested: false,
    runtimeReady: false,
    startupMs: null,
    input: null,
    table: null,
    renderer: null,
    hand: null,
    nextHand: null,
    failedModules: [],
    deferredFailedModules: [],
    pass: false,
    error: null
  };
  try {
    report.runtimeReady = await waitForRuntime(Number(options.runtimeTimeoutMs || 120000));
    report.startupMs = Number(platformState().totalMs || (performance.now() - started).toFixed(1));
    if (!report.runtimeReady) throw new Error(`QUEST_RUNTIME_TIMEOUT:${JSON.stringify(window.SVR_PHASE380_QUEST_ACCEPTANCE_PROGRESS || {})}`);
    report.renderer = configureRenderer();
    report.input = inputAudit();
    report.hand = await driveFullHand(Number(options.handTimeoutMs || 75000));
    report.table = tableAudit();
    if (report.hand?.pass) {
      const previous = Number(state.handNo || 0);
      const accepted = startHand();
      for (let index = 0; index < 50 && Number(state.handNo || 0) <= previous; index += 1) await wait(100);
      report.nextHand = { accepted: accepted !== false, previous, current: Number(state.handNo || 0), advanced: Number(state.handNo || 0) > previous };
    }
    report.failedModules = [...(platformState().failed || [])];
    report.deferredFailedModules = [...(platformState().deferredFailed || [])];
    report.physicalQuestSessionTested = Boolean(window.__SVR_RENDERER__?.xr?.isPresenting);
    report.pass = report.runtimeReady
      && report.startupMs <= Number(options.startupBudgetMs || 45000)
      && report.input?.pass === true
      && report.table?.pass === true
      && report.renderer?.xrEnabled === true
      && report.renderer?.shadows === false
      && report.hand?.pass === true
      && report.nextHand?.advanced === true
      && report.failedModules.length === 0;
  } catch (error) {
    report.error = String(error?.stack || error?.message || error);
  } finally {
    report.finishedAt = new Date().toISOString();
    report.elapsedMs = +(performance.now() - started).toFixed(1);
    running = false;
    lastResult = report;
    window.SVR_PHASE380_QUEST_ACCEPTANCE_RESULT = report;
    window.SVR_PHASE358_ACCEPTANCE_RESULT = report;
    window.dispatchEvent(new CustomEvent('svr:phase358-acceptance', { detail: report }));
    window.dispatchEvent(new CustomEvent('svr:phase380-quest-acceptance', { detail: report }));
  }
  return report;
}

function installGlobals() {
  window.SVR_PHASE380_RUN_QUEST_FULL_GAME_ACCEPTANCE = runAcceptance;
  window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE = runAcceptance;
  window.SVR_PHASE380_QUEST_ACCEPTANCE_QA = () => ({ build: BUILD, active: ACTIVE, lastResult, table: tableAudit(), input: inputAudit(), renderer: configureRenderer(), checkedAt: new Date().toISOString() });
}

installGlobals();
window.addEventListener('svr:platform-ready', installGlobals);
window.addEventListener('svr:phase380-original-table-ready', installGlobals);
[500, 1500, 3500, 7000].forEach((delay) => setTimeout(installGlobals, delay));
if (ACTIVE && PARAMS.get('acceptance') === '1' && PARAMS.get('manual') !== '1') setTimeout(() => runAcceptance(), 900);
