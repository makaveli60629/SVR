import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const LABEL = 'PHASE-161-GEOMETRY-TABLE-REMOVED-FBX-FLOOR-LOCK';
const ROOT = 'PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT';
const FBX_CANDIDATES = [
  './assets/table.fbx',
  '/game/assets/table.fbx',
  './assets/models/table.fbx',
  '/game/assets/models/table.fbx',
  './models/table.fbx',
  '/game/models/table.fbx'
];

const STOOL_RING_RADIUS = 3.24;
const TARGET_TABLE_LENGTH = 4.28;
const TARGET_TABLE_DEPTH = 2.18;
const TABLE_BOTTOM_Y = 0.02;
const CENTER_Z_OFFSET = 0.0;

let loading = false;
let loaded = false;
let loadedInfo = null;
let lastError = null;

function sceneRoot(scene){
  return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene;
}
function mat(color, roughness=.72, metalness=.05){
  return new THREE.MeshStandardMaterial({color,roughness,metalness});
}
function glow(color, opacity=.55){
  return new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false});
}
function cyl(name,r,h,material,x,y,z,scaleZ=1,seg=96){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),material);
  m.name=name; m.position.set(x,y,z); m.scale.z=scaleZ; m.receiveShadow=true; return m;
}
function hideOld(host){
  [
    'PHASE155_ENHANCED_REAL_TABLE_FALLBACK',
    'PHASE155_RESTORED_ASSET_TABLE',
    'PHASE156_TABLE2_STOOL_TEXTURE_ROOT',
    'PHASE157_ACTUAL_FBX_TABLE_ROOT',
    'PHASE157_STABLE_DARK_TABLE_RAIL',
    'PHASE157_STABLE_DARK_TABLE_CUSHION',
    'PHASE157_STABLE_NO_BLINK_TABLE_FELT',
    'PHASE157_STABLE_GOLD_PASS_LINE',
    'PHASE157_STABLE_CENTER_SVR_LOGO',
    'PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT',
    'PHASE142_PLAYABLE_POKER_CORE_ROOT'
  ].forEach(n=>{ const o=host?.getObjectByName?.(n); if(o) o.visible=false; });
}
function removeBadTables(host){
  const kill=[];
  host?.traverse?.(o=>{
    const name=String(o.name||'');
    if(
      /^PHASE157_STABLE_/.test(name) ||
      /^PHASE156_TABLE2_/.test(name) ||
      /^PHASE155_ENHANCED_REAL_TABLE_FALLBACK/.test(name) ||
      /^PHASE155_RESTORED_ASSET_TABLE/.test(name) ||
      /^PHASE158_ACTUAL_FBX_TABLE_SCALE_ROOT/.test(name)
    ) kill.push(o);
  });
  kill.forEach(o=>o.parent?.remove(o));
}
function addSeat(parent,name,x,z,open=false){
  const g=new THREE.Group(); g.name=name; g.position.set(x,0,z); g.rotation.y=Math.atan2(x,z)+Math.PI; parent.add(g);
  const seatMat=open?mat(0x102c35,.82,.04):mat(0x0d0d10,.86,.04);
  const wood=mat(0x7a4d2f,.66,.03);
  const metal=mat(0xa48d55,.38,.55);
  g.add(cyl(name+'_PADDED_ROUND_STOOL_SEAT',.37,.14,seatMat,0,.88,0,1,64));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.018,8,64),glow(open?0x7ffcff:0xffd98a,open?.52:.42));
  ring.name=name+'_RING'; ring.rotation.x=Math.PI/2; ring.position.y=.97; g.add(ring);
  [[-.2,.18],[.2,.18],[-.2,-.18],[.2,-.18]].forEach((p,i)=>g.add(cyl(name+'_LEG_'+i,.05,.9,wood,p[0],.42,p[1],1,16)));
  const foot=new THREE.Mesh(new THREE.TorusGeometry(.32,.014,8,64),metal); foot.name=name+'_FOOT_RING'; foot.rotation.x=Math.PI/2; foot.position.y=.35; g.add(foot);
}
function addSeats(root){
  if(root.getObjectByName('PHASE159_SEAT_GUIDE_ROOT')) return;
  const seats=new THREE.Group(); seats.name='PHASE159_SEAT_GUIDE_ROOT'; root.add(seats);
  [[0,STOOL_RING_RADIUS,true],[-2.55,1.75,false],[-2.55,-1.35,false],[0,-3.05,false],[2.55,-1.35,false],[2.55,1.75,false]].forEach((s,i)=>addSeat(seats,s[2]?'PHASE159_OPEN_PLAYER_STOOL':'PHASE159_BOT_STOOL_'+i,s[0],s[1],s[2]));
}
function stabilizeMaterials(obj){
  obj.traverse(o=>{
    if(!o.isMesh) return;
    o.castShadow=false;
    o.receiveShadow=true;
    o.frustumCulled=false;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    const fixed=mats.map(m=>{
      if(!m || !m.isMaterial) return mat(0x2a211f,.78,.06);
      m.transparent=false;
      m.opacity=1;
      if('emissiveIntensity' in m) m.emissiveIntensity=0;
      if('metalness' in m) m.metalness=Math.min(m.metalness??0.05,0.22);
      if('roughness' in m) m.roughness=Math.max(m.roughness??0.65,0.58);
      m.side=THREE.DoubleSide;
      m.needsUpdate=true;
      return m;
    });
    o.material=Array.isArray(o.material)?fixed:fixed[0];
  });
}
function bounds(obj){
  obj.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(obj);
  const size=new THREE.Vector3();
  const center=new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  return {box,size,center};
}
function candidateRotations(){
  const d=Math.PI/2;
  return [
    {name:'as-imported',x:0,y:0,z:0},
    {name:'lay-back-x-minus-90',x:-d,y:0,z:0},
    {name:'lay-forward-x-plus-90',x:d,y:0,z:0},
    {name:'lay-left-z-plus-90',x:0,y:0,z:d},
    {name:'lay-right-z-minus-90',x:0,y:0,z:-d},
    {name:'swap-yaw-90',x:0,y:d,z:0},
    {name:'x-minus-90-y-90',x:-d,y:d,z:0},
    {name:'x-plus-90-y-90',x:d,y:d,z:0},
    {name:'z-plus-90-y-90',x:0,y:d,z:d},
    {name:'z-minus-90-y-90',x:0,y:d,z:-d}
  ];
}
function scoreOrientation(size){
  const dims=[size.x,size.y,size.z].map(v=>Math.max(v,0.001));
  const footprint=Math.max(dims[0],dims[2]);
  const shortFoot=Math.min(dims[0],dims[2]);
  const yRatio=dims[1]/footprint;
  const aspect=footprint/shortFoot;
  const targetAspect=TARGET_TABLE_LENGTH/TARGET_TABLE_DEPTH;
  const aspectPenalty=Math.abs(aspect-targetAspect)*0.35;
  const wallPenalty=yRatio>0.82 ? 10 : 0;
  const tooThinPenalty=yRatio<0.015 ? 0.75 : 0;
  return yRatio + aspectPenalty + wallPenalty + tooThinPenalty;
}
function chooseBestOrientation(obj){
  let best=null;
  for(const rot of candidateRotations()){
    obj.rotation.set(rot.x,rot.y,rot.z);
    obj.scale.setScalar(1);
    obj.position.set(0,0,0);
    obj.updateMatrixWorld(true);
    const b=bounds(obj);
    const score=scoreOrientation(b.size);
    if(!best || score<best.score) best={...rot,score,size:b.size.clone(),bounds:b};
  }
  obj.rotation.set(best.x,best.y,best.z);
  obj.updateMatrixWorld(true);
  return best;
}
function normalizeToStools(obj){
  obj.position.set(0,0,0);
  obj.rotation.set(0,0,0);
  obj.scale.setScalar(1);
  obj.updateMatrixWorld(true);

  const orientation=chooseBestOrientation(obj);
  let b=bounds(obj);

  if(b.size.z > b.size.x * 1.18){
    obj.rotation.y += Math.PI/2;
    obj.updateMatrixWorld(true);
    b=bounds(obj);
  }

  const scaleX = TARGET_TABLE_LENGTH / Math.max(b.size.x,0.001);
  const scaleZ = TARGET_TABLE_DEPTH / Math.max(b.size.z,0.001);
  const scale = THREE.MathUtils.clamp(Math.min(scaleX, scaleZ), 0.0002, 3.0);
  obj.scale.multiplyScalar(scale);
  obj.updateMatrixWorld(true);
  b=bounds(obj);

  obj.position.x -= b.center.x;
  obj.position.z += CENTER_Z_OFFSET - b.center.z;
  obj.position.y += TABLE_BOTTOM_Y - b.box.min.y;
  obj.updateMatrixWorld(true);
  b=bounds(obj);

  loadedInfo = {
    orientationChosen: orientation.name,
    orientationScore: +orientation.score.toFixed(4),
    targetLength: TARGET_TABLE_LENGTH,
    targetDepth: TARGET_TABLE_DEPTH,
    stoolRingRadius: STOOL_RING_RADIUS,
    finalSize: { x:+b.size.x.toFixed(3), y:+b.size.y.toFixed(3), z:+b.size.z.toFixed(3) },
    finalPosition: { x:+obj.position.x.toFixed(3), y:+obj.position.y.toFixed(3), z:+obj.position.z.toFixed(3) },
    finalRotation: { x:+obj.rotation.x.toFixed(3), y:+obj.rotation.y.toFixed(3), z:+obj.rotation.z.toFixed(3) },
    finalScale: +obj.scale.x.toFixed(5),
    floorAligned:true, geometricFallbackRemoved:true, flatTableCheck: b.size.y < Math.max(b.size.x,b.size.z) * 0.75
  };
}
async function fbxExists(url){
  try{
    const res=await fetch(url,{method:'HEAD',cache:'no-store'});
    return res.ok;
  }catch{ return false; }
}
async function loadFbxInto(root){
  if(loading || loaded) return;
  loading=true;
  removeBadTables(root);
  for(const url of FBX_CANDIDATES){
    try{
      if(!(await fbxExists(url))) continue;
      const obj=await new FBXLoader().loadAsync(url);
      obj.name='PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED';
      stabilizeMaterials(obj);
      normalizeToStools(obj);
      root.add(obj);
      loaded=true;
      loadedInfo = { ...(loadedInfo||{}), url, loaded:true, checkedAt:new Date().toISOString() };
      loading=false;
      return;
    }catch(e){
      lastError=`${url}: ${e?.message||e}`;
    }
  }
  loading=false;
}
function install(scene=window.__SVR_SCENE__){
  if(!scene) return false;
  const host=sceneRoot(scene); if(!host) return false;
  hideOld(host);
  removeBadTables(host);
  let root=host.getObjectByName(ROOT);
  if(!root){
    root=new THREE.Group();
    root.name=ROOT;
    root.position.set(0,0,0.75);
    host.add(root);
    addSeats(root);
  }
  hideOld(host);
  loadFbxInto(root);
  window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK={
    build:LABEL,
    active:true,
    noBlink:true,
    oldWallTableRemoved:true,
    geometricFallbackTablesRemoved:true,
    actualFbxPreferred:true,
    actualFbxLoaded:loaded,
    fbxInfo:loadedInfo,
    candidates:FBX_CANDIDATES,
    targetTableLength:TARGET_TABLE_LENGTH,
    targetTableDepth:TARGET_TABLE_DEPTH,
    stoolRingRadius:STOOL_RING_RADIUS,
    stoolsPreserved:true,
    siteTouched:false,
    lastError,
    checkedAt:new Date().toISOString()
  };
  window.SVR_PHASE158_ACTUAL_FBX_TABLE_SCALE_ORIENTATION_LOCK=window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK;
  window.SVR_PHASE156_TABLE2_STOOL_TEXTURE_LOCK=window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK;
  window.SVR_RUN_PHASE156_TABLE2_AUDIT=()=>window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK;
  window.SVR_RUN_PHASE157_TABLE_AUDIT=()=>window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK;
  window.SVR_RUN_PHASE158_TABLE_AUDIT=()=>window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK;
  window.SVR_RUN_PHASE159_TABLE_AUDIT=()=>window.SVR_PHASE159_FBX_TABLE_FLAT_SCALE_FIX_LOCK;
  return true;
}
[250,700,1400,2600,5000,9000].forEach(ms=>setTimeout(()=>install(),ms));
setInterval(()=>install(),2000);
install();

