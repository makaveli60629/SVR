// Phase 161 — Geometry Table Removed + FBX Floor Alignment Lock
// Game-side only. Keeps lobby structure, removes old procedural table fallback, and pins uploaded FBX table to the floor.

const LABEL = 'PHASE-161-GEOMETRY-TABLE-REMOVED-FBX-FLOOR-LOCK';
const FLOOR_Y = 0.02;
const CHECK_MS = 300;
const STOP_AFTER_MS = 24000;

const GEOMETRY_TABLE_PREFIXES = [
  'PHASE155_ENHANCED_REAL_TABLE_FALLBACK',
  'PHASE155_RESTORED_ASSET_TABLE',
  'PHASE155_TABLE_',
  'PHASE156_TABLE2_',
  'PHASE157_STABLE_',
  'PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT'
];

const KEEP_PREFIXES = [
  'PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT',
  'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED',
  'PHASE159_SEAT_GUIDE_ROOT',
  'PHASE159_OPEN_PLAYER_STOOL',
  'PHASE159_BOT_STOOL_',
  'PHASE142_PLAYABLE_POKER_CORE_ROOT',
  'PHASE142_COMPACT_POKER_STATE_PANEL'
];

function scene(){ return window.__SVR_SCENE__ || null; }
function root(){
  const s = scene();
  return s?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || s;
}
function isKeepName(name){ return KEEP_PREFIXES.some(p => name.startsWith(p)); }
function isGeometryTableName(name){ return GEOMETRY_TABLE_PREFIXES.some(p => name.startsWith(p)); }
function removeGeometryTables(){
  const r = root();
  if (!r?.traverse) return 0;
  const kill = [];
  r.traverse(o => {
    const name = String(o.name || '');
    if (!name || isKeepName(name)) return;
    if (isGeometryTableName(name)) kill.push(o);
  });
  let removed = 0;
  kill.forEach(o => {
    if (o?.parent && !isKeepName(String(o.name || ''))) {
      o.parent.remove(o);
      removed++;
    }
  });
  return removed;
}
function findFbxTable(){
  const r = root();
  if (!r?.traverse) return null;
  let found = r.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED') || null;
  if (found) return found;
  r.traverse(o => {
    const n = String(o.name || '').toLowerCase();
    if (!found && n.includes('fbx') && n.includes('table')) found = o;
  });
  return found;
}
function bounds(obj){
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}
function maybeFlatten(obj){
  if (!window.THREE || !obj) return { changed:false, reason:'three-missing' };
  let b = bounds(obj);
  const maxFoot = Math.max(b.size.x, b.size.z, 0.001);
  if (b.size.y <= maxFoot * 0.72) return { changed:false, reason:'already-flat' };

  const baseRotation = obj.rotation.clone();
  const rotations = [
    [0,0,0],[-Math.PI/2,0,0],[Math.PI/2,0,0],[0,0,Math.PI/2],[0,0,-Math.PI/2],
    [-Math.PI/2,Math.PI/2,0],[Math.PI/2,Math.PI/2,0],[0,Math.PI/2,Math.PI/2],[0,Math.PI/2,-Math.PI/2]
  ];
  let best = null;
  for (const [x,y,z] of rotations) {
    obj.rotation.set(x,y,z);
    obj.updateMatrixWorld(true);
    const bb = bounds(obj);
    const footprint = Math.max(bb.size.x, bb.size.z, 0.001);
    const score = bb.size.y / footprint;
    if (!best || score < best.score) best = { x,y,z,score,size:bb.size.clone() };
  }
  if (best && best.score < (b.size.y / maxFoot)) {
    obj.rotation.set(best.x,best.y,best.z);
    return { changed:true, reason:'flattened', score:+best.score.toFixed(4) };
  }
  obj.rotation.copy(baseRotation);
  return { changed:false, reason:'kept-existing' };
}
function alignFbxToFloor(){
  if (!window.THREE) return null;
  const table = findFbxTable();
  if (!table) return null;
  const flat = maybeFlatten(table);
  let b = bounds(table);
  const deltaY = FLOOR_Y - b.box.min.y;
  if (Number.isFinite(deltaY) && Math.abs(deltaY) > 0.003) {
    table.position.y += deltaY;
    table.updateMatrixWorld(true);
    b = bounds(table);
  }
  table.visible = true;
  table.traverse?.(o => {
    if (!o.isMesh) return;
    o.visible = true;
    o.castShadow = false;
    o.receiveShadow = true;
    o.frustumCulled = false;
  });
  return {
    name: table.name || 'fbx-table',
    floorY: FLOOR_Y,
    minY: +b.box.min.y.toFixed(4),
    size: { x:+b.size.x.toFixed(3), y:+b.size.y.toFixed(3), z:+b.size.z.toFixed(3) },
    position: { x:+table.position.x.toFixed(3), y:+table.position.y.toFixed(3), z:+table.position.z.toFixed(3) },
    rotation: { x:+table.rotation.x.toFixed(3), y:+table.rotation.y.toFixed(3), z:+table.rotation.z.toFixed(3) },
    flatten: flat
  };
}
function tick(){
  const removed = removeGeometryTables();
  const fbx = alignFbxToFloor();
  window.SVR_PHASE161_GEOMETRY_TABLE_REMOVED_FBX_FLOOR_LOCK = {
    build: LABEL,
    active: true,
    geometryTableRemoved: true,
    removedLastTick: removed,
    fbxFloorAligned: !!fbx,
    fbx,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_RUN_PHASE161_TABLE_AUDIT = () => window.SVR_PHASE161_GEOMETRY_TABLE_REMOVED_FBX_FLOOR_LOCK;
  return window.SVR_PHASE161_GEOMETRY_TABLE_REMOVED_FBX_FLOOR_LOCK;
}

let started = Date.now();
[80, 250, 700, 1200, 2000, 3500, 6000].forEach(ms => setTimeout(tick, ms));
const timer = setInterval(() => {
  tick();
  if (Date.now() - started > STOP_AFTER_MS) clearInterval(timer);
}, CHECK_MS);
tick();
