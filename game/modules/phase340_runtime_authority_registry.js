import * as THREE from 'three';

export const BUILD = 'PHASE-340-PLATFORM-CORE-EXTRACTION-AUTHORITY-LOCK';
const TABLE_PRIORITY = [
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
  'PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT',
  'PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED',
  'PHASE326_ANDROID_TABLE_FALLBACK'
];
const LEGACY_OBJECT = /(PHASE212_|PHASE214_|PHASE215_|PHASE323_SURFACE_.*(?:CARD|CHIP)|PHASE331_POT_CHIP|P85_STACK_|P85_POT_CHIP)/i;
const CONTROL_SELECTORS = '#svr326Root,#svrAndroidGamePad,#svrTapMovePanel,#svrAndroidLiteHud,#svrAndroidRecoverView';
const state = {
  build: BUILD,
  claims: new Map(),
  hiddenLegacy: new Set(),
  hiddenTables: new Set(),
  hiddenLogos: new Set(),
  eventCounts: new Map(),
  animationLoopAssignments: 0,
  animationLoopClears: 0,
  governedAt: null
};

function platform() {
  return window.SVR_PLATFORM || document.body?.dataset?.platform || 'desktop';
}
function scene() { return window.__SVR_SCENE__ || null; }
function root() { const s = scene(); return s?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || s; }

function instrumentEvents() {
  if (EventTarget.prototype.__svrPhase340Instrumented) return;
  EventTarget.prototype.__svrPhase340Instrumented = true;
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  const targets = new WeakMap();
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (listener) {
      let byType = targets.get(this);
      if (!byType) { byType = new Map(); targets.set(this, byType); }
      let listeners = byType.get(type);
      if (!listeners) { listeners = new WeakSet(); byType.set(type, listeners); }
      if ((typeof listener === 'function' || typeof listener === 'object') && !listeners.has(listener)) {
        listeners.add(listener);
        state.eventCounts.set(type, (state.eventCounts.get(type) || 0) + 1);
      }
    }
    return add.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function(type, listener, options) {
    return remove.call(this, type, listener, options);
  };
}

function instrumentAnimationLoops() {
  const proto = THREE.WebGLRenderer?.prototype;
  if (!proto || proto.__svrPhase340LoopInstrumented) return;
  proto.__svrPhase340LoopInstrumented = true;
  const original = proto.setAnimationLoop;
  proto.setAnimationLoop = function(callback) {
    if (callback) state.animationLoopAssignments += 1;
    else state.animationLoopClears += 1;
    this.userData = { ...(this.userData || {}), svrPhase340AnimationLoop: Boolean(callback) };
    return original.call(this, callback);
  };
}

function topLevel(items) {
  return items.filter((candidate) => {
    let parent = candidate.parent;
    while (parent) {
      if (items.includes(parent)) return false;
      parent = parent.parent;
    }
    return true;
  });
}

function tableCandidates() {
  const r = root();
  if (!r) return [];
  const values = [];
  for (const name of TABLE_PRIORITY) {
    const object = r.getObjectByName?.(name);
    if (object && !values.includes(object)) values.push(object);
  }
  r.traverse?.((object) => {
    if (!object?.name || values.includes(object)) return;
    if (/TABLE.*(?:FBX|LOCKED|FALLBACK|ROOT)/i.test(object.name) && !/CARD|CHIP|LABEL|POT|BUTTON/i.test(object.name)) values.push(object);
  });
  return topLevel(values);
}

function enforceTableAuthority() {
  const values = tableCandidates();
  if (!values.length) return { authority: null, count: 0, hidden: [] };
  values.sort((a, b) => {
    const ai = TABLE_PRIORITY.indexOf(a.name), bi = TABLE_PRIORITY.indexOf(b.name);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  const authority = values[0];
  authority.visible = true;
  const hidden = [];
  for (const object of values.slice(1)) {
    object.visible = false;
    object.userData = { ...(object.userData || {}), svrPhase340Suppressed: true };
    hidden.push(object.name || object.uuid);
    state.hiddenTables.add(object.name || object.uuid);
  }
  window.SVR_TABLE_AUTHORITY = authority;
  return { authority: authority.name || authority.uuid, count: values.length, hidden };
}

function tableBounds() {
  const object = window.SVR_TABLE_AUTHORITY || tableCandidates()[0];
  if (!object) return null;
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  const center = new THREE.Vector3(), size = new THREE.Vector3();
  box.getCenter(center); box.getSize(size);
  return { object, box, center, size, top: box.max.y };
}

function enforceLogoAuthority() {
  const r = root(), table = tableBounds();
  if (!r || !table) return { count: 0, authority: null, hidden: [] };
  const values = [];
  r.traverse((object) => {
    if (!object?.name || !/LOGO/i.test(object.name) || !object.visible) return;
    const p = new THREE.Vector3();
    object.getWorldPosition(p);
    if (Math.hypot(p.x - table.center.x, p.z - table.center.z) <= Math.max(2.5, table.size.x * 0.8)) values.push({ object, p });
  });
  if (values.length <= 1) return { count: values.length, authority: values[0]?.object?.name || null, hidden: [] };
  const preferred = values.sort((a, b) => {
    const score = (x) => (/PHASE339|PHASE331|CENTER/i.test(x.object.name) ? 100 : 0) - x.p.distanceTo(table.center);
    return score(b) - score(a);
  });
  const authority = preferred[0].object;
  const hidden = [];
  for (const { object } of preferred.slice(1)) {
    object.visible = false;
    hidden.push(object.name || object.uuid);
    state.hiddenLogos.add(object.name || object.uuid);
  }
  return { count: values.length, authority: authority.name || authority.uuid, hidden };
}

function hideLegacyObjects() {
  const r = root();
  if (!r) return 0;
  let hidden = 0;
  r.traverse((object) => {
    if (!object?.name || !LEGACY_OBJECT.test(object.name)) return;
    if (object.visible) hidden += 1;
    object.visible = false;
    state.hiddenLegacy.add(object.name || object.uuid);
  });
  return hidden;
}

function enforceControls() {
  const p = platform();
  const roots = [...document.querySelectorAll(CONTROL_SELECTORS)];
  if (p !== 'android') {
    roots.forEach((element) => element.remove());
    return { roots: 0, move: 0, look: 0, pass: true };
  }
  const primary = document.querySelector('#svr326Root');
  roots.forEach((element) => { if (element !== primary) element.remove(); });
  [...document.querySelectorAll('.svr-stick')].forEach((element) => {
    if (!['svr326Move','svr326Look'].includes(element.id)) element.remove();
  });
  const rootCount = document.querySelectorAll('#svr326Root').length;
  const move = document.querySelectorAll('#svr326Move').length;
  const look = document.querySelectorAll('#svr326Look').length;
  return { roots: rootCount, move, look, pass: rootCount === 1 && move === 1 && look === 1 };
}

function hideCamera3Noise() {
  if (platform() !== 'camera3') return 0;
  const r = root();
  if (!r) return 0;
  const block = /(HUD|STATUS|BADGE|HITBOX|RAYCAST|FEEDBACK|TIMER|PANEL|MARKER|PORTAL|STOREFRONT|BUILDING|SKY|MOON|MARS|CONTROL|DEBUG)/i;
  const keep = /(TABLE|CARD|CHIP|POT|FELT|LOGO|PLAYER|BOT|ERIC|CLAUDIA|DEALER)/i;
  let hidden = 0;
  r.traverse((object) => {
    if (!object?.name || !block.test(object.name) || keep.test(object.name)) return;
    if (object.visible) hidden += 1;
    object.visible = false;
  });
  document.querySelectorAll('body > *:not(#app):not(script):not(style)').forEach((element) => {
    if (element.id !== 'safeStage') element.style.display = 'none';
  });
  return hidden;
}

export function applyRendererBudget(value = platform()) {
  const renderer = window.__SVR_RENDERER__;
  if (!renderer) return false;
  const ratio = value === 'camera3' ? 1 : value === 'android' ? 1.15 : value === 'quest' ? 1.25 : 1.5;
  try { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, ratio)); } catch {}
  if (renderer.shadowMap && ['android','camera3'].includes(value)) renderer.shadowMap.enabled = false;
  renderer.info.autoReset = true;
  return true;
}

export function claimAuthority(key, owner, object = null, priority = 0) {
  const current = state.claims.get(key);
  const next = { key, owner, object, priority, claimedAt: new Date().toISOString() };
  if (!current || priority >= current.priority) {
    if (current?.object && current.object !== object) current.object.visible = false;
    if (object) object.visible = true;
    state.claims.set(key, next);
    return true;
  }
  if (object) object.visible = false;
  return false;
}

export function govern() {
  const tables = enforceTableAuthority();
  const logos = enforceLogoAuthority();
  const controls = enforceControls();
  const legacyHidden = hideLegacyObjects();
  const camera3Hidden = hideCamera3Noise();
  applyRendererBudget();
  state.governedAt = new Date().toISOString();
  return { tables, logos, controls, legacyHidden, camera3Hidden };
}

export function audit() {
  const s = scene(), renderer = window.__SVR_RENDERER__;
  let objects = 0, visibleObjects = 0;
  s?.traverse?.((object) => { objects += 1; if (object.visible) visibleObjects += 1; });
  const governance = govern();
  const info = renderer?.info;
  const result = {
    build: BUILD,
    platform: platform(),
    authorityClaims: [...state.claims.values()].map(({ key, owner, priority }) => ({ key, owner, priority })),
    scene: { objects, visibleObjects },
    tables: governance.tables,
    logos: governance.logos,
    controls: governance.controls,
    hiddenLegacyCount: state.hiddenLegacy.size,
    hiddenDuplicateTableCount: state.hiddenTables.size,
    hiddenDuplicateLogoCount: state.hiddenLogos.size,
    events: Object.fromEntries([...state.eventCounts.entries()].sort()),
    animationLoops: { assignments: state.animationLoopAssignments, clears: state.animationLoopClears },
    renderer: info ? {
      calls: info.render?.calls || 0,
      triangles: info.render?.triangles || 0,
      lines: info.render?.lines || 0,
      points: info.render?.points || 0,
      geometries: info.memory?.geometries || 0,
      textures: info.memory?.textures || 0,
      programs: info.programs?.length || 0
    } : null,
    checkedAt: new Date().toISOString()
  };
  result.pass = governance.controls.pass && governance.tables.count <= 1 && governance.logos.count <= 1;
  window.SVR_PHASE340_AUTHORITY_STATE = result;
  return result;
}

instrumentEvents();
instrumentAnimationLoops();
window.SVR_AUTHORITY_CLAIM = claimAuthority;
window.SVR_PHASE340_GOVERN = govern;
window.SVR_PHASE340_AUTHORITY_AUDIT = audit;
window.SVR_PHASE340_APPLY_RENDERER_BUDGET = applyRendererBudget;
[250, 700, 1400, 2600, 4800].forEach((ms) => setTimeout(govern, ms));
setInterval(govern, 1800);
