import * as THREE from 'three';

export const BUILD = 'PHASE-374-ANDROID-JOIN-TABLE-APP-RECOVERY-LOCK';

const ACTIVE = (window.SVR_PLATFORM || document.body?.dataset?.platform || '').toLowerCase() === 'android'
  || /\/game\/android\.html$/i.test(location.pathname)
  || (/Android/i.test(navigator.userAgent || '') && !/Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ''));

const state = {
  build: BUILD,
  active: ACTIVE,
  installed: false,
  joined: false,
  dealUnlocked: false,
  blockedDeals: 0,
  guardedApis: [],
  tableReady: false,
  emergencyTableCreated: false,
  emergencyTableReplaced: false,
  duplicateSeatControlsHidden: 0,
  joinLabelRepairs: 0,
  lowPowerApplications: 0,
  longFrameGaps: 0,
  lastFrameGapMs: 0,
  lastError: null,
  checkedAt: null
};

const TABLE_NAMES = [
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
  'PHASE363_ANDROID_CANONICAL_TABLE_CONTAINER',
  'PHASE358_QUEST_UPLOADED_ASSET_CONTAINER',
  'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED',
  'PHASE326_ANDROID_TABLE_FALLBACK'
];

const DEAL_APIS = [
  'SVR_RESET_POKER_TABLE',
  'SVR_POKER_NEXT_HAND',
  'SVR_PHASE336_START_HAND',
  'SVR_PHASE355_PLAY_FULL_HAND'
];

const originals = new Map();
let emergencyTable = null;
let observer = null;
let repairTimer = 0;
let frameAt = performance.now();
let lowPowerApplied = false;

const joinedNow = () => Boolean(
  window.SVR_PHASE363_JOINED_IMMEDIATE
  ?? window.SVR_PHASE363_STATE?.joined
  ?? window.SVR_PHASE369_ANDROID_STATE?.joined
);

function publish(reason = 'state') {
  state.joined = joinedNow();
  state.dealUnlocked = state.joined;
  state.tableReady = Boolean(locateTable());
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE374_ANDROID_STATE = { ...state, reason };
  return window.SVR_PHASE374_ANDROID_STATE;
}

function locateActualTable() {
  const scene = window.__SVR_SCENE__;
  let table = window.SVR_TABLE_AUTHORITY;
  if (table?.isObject3D && table !== emergencyTable) return table;
  for (const name of TABLE_NAMES) {
    table = scene?.getObjectByName?.(name);
    if (table?.isObject3D && table !== emergencyTable) return table;
  }
  return null;
}

function locateTable() {
  const actual = locateActualTable();
  if (actual) {
    actual.visible = true;
    window.SVR_TABLE_AUTHORITY = actual;
    if (emergencyTable?.parent) {
      emergencyTable.removeFromParent();
      emergencyTable = null;
      state.emergencyTableReplaced = true;
    }
    return actual;
  }
  if (emergencyTable?.isObject3D) {
    emergencyTable.visible = true;
    window.SVR_TABLE_AUTHORITY = emergencyTable;
    return emergencyTable;
  }
  return null;
}

function material(color, roughness = 0.55, metalness = 0.08) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function createEmergencyTable() {
  if (!ACTIVE || emergencyTable?.isObject3D || locateActualTable()) return locateTable();
  const scene = window.__SVR_SCENE__;
  if (!scene?.isScene) return null;

  const root = new THREE.Group();
  root.name = 'PHASE374_ANDROID_EMERGENCY_TABLE';

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 0.22, 64),
    material(0x100817, 0.42, 0.24)
  );
  base.scale.z = 0.68;
  base.position.y = 0.58;
  root.add(base);

  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(1.93, 1.93, 0.09, 64),
    material(0x071d22, 0.88, 0.02)
  );
  felt.scale.z = 0.67;
  felt.position.y = 0.74;
  root.add(felt);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.15, 14, 96),
    material(0x25102e, 0.36, 0.18)
  );
  rail.rotation.x = Math.PI / 2;
  rail.scale.z = 0.68;
  rail.position.y = 0.79;
  root.add(rail);

  const logoRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.025, 8, 72),
    new THREE.MeshBasicMaterial({ color: 0xffd98a, toneMapped: false })
  );
  logoRing.rotation.x = Math.PI / 2;
  logoRing.scale.z = 0.68;
  logoRing.position.y = 0.795;
  root.add(logoRing);

  for (const [x, z] of [[-1.35, -0.55], [1.35, -0.55], [-1.35, 0.55], [1.35, 0.55]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.62, 18), material(0x151820, 0.44, 0.55));
    leg.position.set(x, 0.27, z);
    root.add(leg);
  }

  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = false;
  });

  scene.add(root);
  emergencyTable = root;
  window.SVR_TABLE_AUTHORITY = root;
  state.emergencyTableCreated = true;
  state.tableReady = true;
  queueMicrotask(() => {
    window.SVR_PHASE364_ALIGN_TABLE?.();
    window.SVR_PHASE340_GOVERN?.();
  });
  return root;
}

function applyRendererBudget(reason = 'phase374') {
  if (lowPowerApplied && reason !== 'manual') return false;
  try {
    const renderer = window.__SVR_RENDERER__;
    window.SVR_PHASE340_APPLY_RENDERER_BUDGET?.('android');
    renderer?.setPixelRatio?.(Math.min(0.95, window.devicePixelRatio || 1));
    if (renderer?.shadowMap) renderer.shadowMap.enabled = false;
    document.body.classList.add('svr374-performance-safe');
    lowPowerApplied = true;
    state.lowPowerApplications += 1;
    return true;
  } catch (error) {
    state.lastError = String(error?.message || error);
    return false;
  }
}

function installDealGuards() {
  for (const name of DEAL_APIS) {
    const current = window[name];
    if (typeof current !== 'function' || current.__svrPhase374Guard === BUILD) continue;
    if (!originals.has(name)) originals.set(name, current.bind(window));
    const original = originals.get(name);
    const guarded = (...args) => {
      if (!joinedNow() && !state.dealUnlocked) {
        state.blockedDeals += 1;
        publish(`blocked:${name}`);
        return false;
      }
      return original(...args);
    };
    guarded.__svrPhase374Guard = BUILD;
    guarded.__svrPhase374Original = original;
    window[name] = guarded;
    if (!state.guardedApis.includes(name)) state.guardedApis.push(name);
  }
}

function joinButton() {
  return document.getElementById('svr372Primary') || document.getElementById('svr369Join');
}

function hideLegacySeatControls() {
  const authority = joinButton();
  const joined = joinedNow();
  let hidden = 0;

  if (authority && !joined) {
    authority.hidden = false;
    authority.disabled = false;
    authority.removeAttribute('aria-hidden');
    authority.setAttribute('aria-label', 'Join poker table now');
    try { authority.inert = false; } catch {}
    if (String(authority.textContent || '').trim() !== 'JOIN NOW') {
      authority.textContent = 'JOIN NOW';
      state.joinLabelRepairs += 1;
    }
  }

  for (const button of document.querySelectorAll('button')) {
    if (button === authority || button.closest('#runtimeRecovery') || button.id === 'startRuntimeBtn') continue;
    const label = String(button.textContent || '').trim().toUpperCase();
    const legacy = ['SIT', 'SEAT', 'SIT DOWN', 'SIT AT TABLE', 'PLAY GAME', 'JOIN TABLE', 'JOIN NOW'].includes(label);
    if (!legacy) continue;
    if (joined && label === 'LEAVE TABLE') continue;
    button.hidden = true;
    button.setAttribute('aria-hidden', 'true');
    try { button.inert = true; } catch {}
    hidden += 1;
  }

  const legacySeat = document.querySelector('#svr347Actions [data-ui="seat"]');
  if (legacySeat) {
    if (joined) {
      legacySeat.hidden = false;
      legacySeat.disabled = false;
      legacySeat.textContent = 'LEAVE TABLE';
      legacySeat.removeAttribute('aria-hidden');
      try { legacySeat.inert = false; } catch {}
    } else {
      legacySeat.hidden = true;
      legacySeat.setAttribute('aria-hidden', 'true');
      try { legacySeat.inert = true; } catch {}
    }
  }

  state.duplicateSeatControlsHidden = Math.max(state.duplicateSeatControlsHidden, hidden);
}

function syncJoinState(reason = 'sync') {
  const joined = joinedNow();
  state.joined = joined;
  state.dealUnlocked = joined;
  document.body.classList.toggle('svr374-awaiting-join', !joined);
  document.body.classList.toggle('svr374-joined', joined);
  hideLegacySeatControls();
  installDealGuards();
  publish(reason);
}

function installStyle() {
  if (document.getElementById('svr374-style')) return;
  const style = document.createElement('style');
  style.id = 'svr374-style';
  style.textContent = `
    body.svr374-awaiting-join #svr347Root{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    #svr372Primary,#svr369Join{min-height:54px!important;font-size:18px!important;letter-spacing:.04em!important}
    body.svr374-performance-safe canvas{image-rendering:auto}
  `;
  document.head.appendChild(style);
}

function frameWatch(now) {
  const gap = now - frameAt;
  frameAt = now;
  if (gap > 1800) {
    state.longFrameGaps += 1;
    state.lastFrameGapMs = Math.round(gap);
    applyRendererBudget('long-frame-gap');
  }
  requestAnimationFrame(frameWatch);
}

function qa() {
  const table = locateTable();
  const authority = joinButton();
  const visibleJoinControls = [...document.querySelectorAll('button')].filter((button) => {
    if (button.hidden || !button.offsetParent) return false;
    const label = String(button.textContent || '').trim().toUpperCase();
    return ['JOIN NOW', 'JOIN TABLE', 'SIT', 'SEAT', 'PLAY GAME'].includes(label);
  });
  const result = {
    ...state,
    joined: joinedNow(),
    dealUnlocked: state.dealUnlocked,
    tableReady: Boolean(table?.isObject3D && table.visible),
    tableName: table?.name || null,
    joinAuthorityPresent: Boolean(authority),
    joinAuthorityText: authority?.textContent?.trim() || null,
    visibleJoinControls: visibleJoinControls.length,
    pass: Boolean(
      ACTIVE
      && table?.isObject3D
      && authority
      && (joinedNow() || String(authority.textContent || '').trim() === 'JOIN NOW')
      && (joinedNow() || visibleJoinControls.length === 1)
      && !state.lastError
    ),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE374_ANDROID_QA_STATE = result;
  return result;
}

function install() {
  if (!ACTIVE || state.installed) return;
  state.installed = true;
  document.body.dataset.build = BUILD;
  document.body.dataset.release = BUILD;
  installStyle();
  applyRendererBudget('startup');
  installDealGuards();
  syncJoinState('install');

  observer = new MutationObserver(() => {
    hideLegacySeatControls();
    installDealGuards();
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  repairTimer = window.setInterval(() => {
    const actual = locateActualTable();
    if (actual) locateTable();
    else if (!locateTable()) createEmergencyTable();
    installDealGuards();
    syncJoinState('repair');
  }, 500);

  window.setTimeout(() => {
    if (!locateActualTable()) createEmergencyTable();
  }, 9000);

  window.addEventListener('svr:phase363-immediate-join-state', (event) => {
    state.dealUnlocked = Boolean(event.detail?.joined);
    syncJoinState(event.detail?.reason || 'join-event');
  });
  window.addEventListener('svr:phase372-core-ready', () => syncJoinState('core-ready'));
  window.addEventListener('pageshow', () => syncJoinState('pageshow'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncJoinState('visible');
  });

  window.SVR_PHASE374_APPLY_LOW_POWER = () => applyRendererBudget('manual');
  window.SVR_PHASE374_ANDROID_QA = qa;
  requestAnimationFrame(frameWatch);
  publish('ready');
  window.dispatchEvent(new CustomEvent('svr:phase374-android-ready', { detail: qa() }));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();

window.addEventListener('beforeunload', () => {
  observer?.disconnect?.();
  clearInterval(repairTimer);
}, { once: true });
