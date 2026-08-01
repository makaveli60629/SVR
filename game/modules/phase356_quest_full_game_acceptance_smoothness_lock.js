import { state, players } from './phase336_authoritative_engine.js';

export const BUILD = 'PHASE-356-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK';
const PARAMS = new URLSearchParams(location.search);
const ACTIVE = (window.SVR_PLATFORM || '').toLowerCase() === 'quest'
  || PARAMS.get('platform') === 'quest'
  || /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || '');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let running = false;
let lastResult = null;
let installedAt = null;
let governedAt = null;

function platformState() { return window.SVR_PHASE340_PLATFORM_STATE || {}; }
function loadedModules() { return [...(platformState().loaded || []), ...(platformState().deferredLoaded || [])]; }

function safeWalk(root, visitor, limit = 14000) {
  if (typeof window.SVR_PHASE356_SAFE_WALK === 'function') return window.SVR_PHASE356_SAFE_WALK(root, visitor, limit);
  if (!root) return 0;
  const stack = [root];
  const seen = new Set();
  let count = 0;
  while (stack.length && count < limit) {
    const object = stack.pop();
    if (!object || seen.has(object)) continue;
    seen.add(object);
    count += 1;
    try { visitor(object); } catch {}
    const children = Array.isArray(object.children) ? object.children : [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child && child !== object && !seen.has(child)) stack.push(child);
    }
  }
  return count;
}

function configureRenderer() {
  const renderer = window.__SVR_RENDERER__;
  if (!renderer) return null;
  const ratio = Math.min(Number(devicePixelRatio || 1), 1.25);
  try { renderer.setPixelRatio(ratio); } catch {}
  try { renderer.shadowMap.enabled = false; } catch {}
  try { renderer.xr.enabled = true; } catch {}
  governedAt ||= new Date().toISOString();
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

function sceneObjects() {
  const scene = window.__SVR_SCENE__;
  const names = [];
  safeWalk(scene, (object) => names.push(String(object.name || '')));
  return { scene, names };
}

function tableAudit() {
  const { scene, names } = sceneObjects();
  const qa = window.SVR_PHASE334_TABLE_QA?.() || window.SVR_PHASE335_TABLE_QA?.() || null;
  const table = names.find((name) => /PHASE356_QUEST_TABLE_FALLBACK|PHASE159_ACTUAL_UPLOADED_TABLE|PHASE159_FBX_TABLE|PHASE200_INTENDED_LOBBY_POKER_TABLE|PHASE341_CANONICAL_TABLE/i.test(name)) || null;
  const logo = names.find((name) => /PHASE334_CENTER_LOGO_ROOT|PHASE331_SVR_TABLE_CENTER_LOGO|PHASE341_CANONICAL_CENTER_LOGO/i.test(name)) || null;
  const potDisplay = names.find((name) => /PHASE331_UPRIGHT_TRANSLUCENT_POT_DISPLAY|PHASE333.*POT|P85_POT_LABEL/i.test(name)) || null;
  const holeMeshes = names.filter((name) => /^(?:P85_HAND_0_[01]|PHASE341_HOLE_0_[01])$/i.test(name)).length;
  const communityMeshes = names.filter((name) => /^(?:P85_COMM_\d+|PHASE341_COMMUNITY_[0-4])$/i.test(name)).length;
  return {
    scene: Boolean(scene), table, logo, potDisplay, holeMeshes, communityMeshes, phase334: qa,
    pass: Boolean(scene && table && logo && potDisplay && holeMeshes >= 2 && communityMeshes >= 5)
  };
}

function inputAudit() {
  const renderer = window.__SVR_RENDERER__;
  const loaded = loadedModules();
  const handsModule = loaded.some((path) => path.endsWith('phase331_quest_meta_hands_table_interaction_lock.js'));
  const gestureModule = loaded.some((path) => path.endsWith('phase334_table_layout_gesture_poker_lock.js'));
  const stabilityModule = loaded.some((path) => path.endsWith('phase335_oculus_acceptance_gameplay_stability_lock.js'));
  const getHand = typeof renderer?.xr?.getHand === 'function';
  const getController = typeof renderer?.xr?.getController === 'function';
  const androidRoots = document.querySelectorAll('#svr347Root,#svr343Root,#svr326Root,#svr339Root,[data-svr-android-controller],.svr-android-controller').length;
  const result = {
    handsPrimary: handsModule && gestureModule && getHand,
    controllerFallback: getController,
    stabilityModule,
    androidRoots,
    snapTurnDegrees: 45,
    forwardReference: 'headset-look-direction',
    teleportContract: 'hold-to-aim-release-to-teleport',
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
    const loaded = loadedModules();
    const ready = Boolean(
      window.__SVR_RENDERER__ && window.__SVR_SCENE__ && window.__SVR_CAMERA__
      && typeof window.SVR_POKER_ACTION === 'function'
      && typeof window.SVR_RESET_POKER_TABLE === 'function'
      && typeof window.SVR_POKER_NEXT_HAND === 'function'
      && window.SVR_PHASE356_POKER_BOOT_QA?.().pass === true
      && loaded.some((path) => path.endsWith('phase334_table_layout_gesture_poker_lock.js'))
      && loaded.some((path) => path.endsWith('phase335_oculus_acceptance_gameplay_stability_lock.js'))
    );
    window.SVR_PHASE356_PROGRESS = {
      stage: 'waiting-runtime', elapsedMs: Math.round(performance.now() - started), loaded: loaded.length,
      failed: platformState().failed || [], ready, at: new Date().toISOString()
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
  let handledSequence = -1;
  try {
    window.SVR_POKER_QA_PASSIVE_BOTS = true;
    window.SVR_RESET_POKER_TABLE(1000);
    while (performance.now() - started < timeoutMs) {
      const phase = String(state.phase || 'idle').toLowerCase();
      if (!phases.includes(phase)) phases.push(phase);
      communityMax = Math.max(communityMax, state.community?.length || 0);
      holeCards = Math.max(holeCards, players.find((player) => player.human)?.hand?.length || 0);
      if (state.waitingHuman && Number(state.actionSeq || 0) !== handledSequence) {
        const action = chooseAction();
        if (action) {
          handledSequence = Number(state.actionSeq || 0);
          window.SVR_POKER_ACTION(action);
        }
      }
      if (phase === 'showdown') {
        await wait(180);
        const settlement = settlementAudit();
        const pass = ['preflop', 'flop', 'turn', 'river', 'showdown'].every((item) => phases.includes(item))
          && communityMax === 5 && holeCards === 2 && settlement.pass;
        return { pass, phases, communityMax, holeCards, settlement, elapsedMs: +(performance.now() - started).toFixed(1) };
      }
      await wait(40);
    }
    return { pass: false, timeout: true, phases, communityMax, holeCards, settlement: settlementAudit(), elapsedMs: +(performance.now() - started).toFixed(1) };
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
    build: BUILD, platform: 'quest', startedAt: new Date().toISOString(), browserStackAcceptance: true,
    physicalQuestSessionTested: false, runtimeReady: false, startupMs: null, input: null, table: null,
    renderer: null, hand: null, nextHand: null, failedModules: [], deferredFailedModules: [], pass: false, error: null
  };
  try {
    report.runtimeReady = await waitForRuntime(Number(options.runtimeTimeoutMs || 120000));
    report.startupMs = Number(platformState().totalMs || (performance.now() - started).toFixed(1));
    if (!report.runtimeReady) throw new Error(`QUEST_RUNTIME_TIMEOUT:${JSON.stringify(window.SVR_PHASE356_PROGRESS || {})}`);
    report.renderer = configureRenderer();
    report.input = inputAudit();
    report.hand = await driveFullHand(Number(options.handTimeoutMs || 75000));
    report.table = tableAudit();
    if (report.hand?.pass) {
      const previous = Number(state.handNo || 0);
      const accepted = window.SVR_POKER_NEXT_HAND();
      for (let index = 0; index < 50 && Number(state.handNo || 0) <= previous; index += 1) await wait(100);
      report.nextHand = { accepted: accepted !== false, previous, current: Number(state.handNo || 0), advanced: Number(state.handNo || 0) > previous };
    }
    report.failedModules = [...(platformState().failed || [])];
    report.deferredFailedModules = [...(platformState().deferredFailed || [])];
    report.physicalQuestSessionTested = Boolean(window.__SVR_RENDERER__?.xr?.isPresenting);
    report.pass = report.runtimeReady
      && report.startupMs <= Number(options.startupBudgetMs || 45000)
      && report.input?.pass === true && report.table?.pass === true
      && report.renderer?.xrEnabled === true && report.renderer?.shadows === false
      && report.hand?.pass === true && report.nextHand?.advanced === true
      && report.failedModules.length === 0;
  } catch (error) {
    report.error = String(error?.stack || error?.message || error);
  } finally {
    report.finishedAt = new Date().toISOString();
    report.elapsedMs = +(performance.now() - started).toFixed(1);
    running = false;
    lastResult = report;
    window.SVR_PHASE356_ACCEPTANCE_RESULT = report;
    window.dispatchEvent(new CustomEvent('svr:phase356-acceptance', { detail: report }));
  }
  return report;
}

function qa() {
  removeAndroidControls();
  const currentPlatform = platformState();
  const result = {
    build: BUILD, active: ACTIVE, installedAt, governedAt, renderer: configureRenderer(), input: inputAudit(),
    table: tableAudit(), pokerBoot: window.SVR_PHASE356_POKER_BOOT_QA?.() || null,
    platform: {
      build: currentPlatform.build,
      platform: currentPlatform.platform,
      loaded: [...(currentPlatform.loaded || [])],
      failed: [...(currentPlatform.failed || [])],
      deferredLoaded: [...(currentPlatform.deferredLoaded || [])],
      deferredFailed: [...(currentPlatform.deferredFailed || [])],
      totalMs: currentPlatform.totalMs,
      readyAt: currentPlatform.readyAt
    },
    fullGameAcceptance: lastResult,
    checkedAt: new Date().toISOString()
  };
  result.pass = result.active && result.input.pass && result.table.pass && result.pokerBoot?.pass === true
    && result.renderer?.xrEnabled === true && result.renderer?.shadows === false;
  window.SVR_PHASE356_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE) return;
  installedAt = new Date().toISOString();
  removeAndroidControls();
  configureRenderer();
  [300, 900, 1800, 3600].forEach((delay) => setTimeout(() => {
    removeAndroidControls();
    configureRenderer();
  }, delay));
  const interval = setInterval(() => {
    removeAndroidControls();
    configureRenderer();
    if (!document.documentElement.isConnected) clearInterval(interval);
  }, 1800);
  window.SVR_PHASE356_QA = qa;
  window.SVR_PHASE356_RUN_QUEST_FULL_GAME_ACCEPTANCE = runAcceptance;
  window.SVR_PHASE356_STATE = {
    build: BUILD, active: true, handsPrimary: true, controllerFallback: true, snapTurnDegrees: 45,
    forwardReference: 'headset-look-direction', fullGameBrowserAcceptance: true,
    physicalQuestInputAcceptanceRequired: true, installedAt
  };
  if (PARAMS.get('acceptance') === '1') setTimeout(() => runAcceptance(), 700);
}

install();
