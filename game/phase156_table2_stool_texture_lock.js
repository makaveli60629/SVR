import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const LABEL = 'PHASE-157-ACTUAL-FBX-TABLE-NO-BLINK-LOCK';
const ROOT = 'PHASE157_ACTUAL_FBX_TABLE_ROOT';
const FBX_CANDIDATES = [
  './assets/table.fbx',
  '/game/assets/table.fbx',
  './models/table.fbx',
  '/game/models/table.fbx'
];

function sceneRoot(scene){ return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT') || scene; }
function mat(color, roughness=.72, metalness=.05){ return new THREE.MeshStandardMaterial({color,roughness,metalness}); }
function glow(color, opacity=.55){ return new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}); }
function cyl(name,r,h,material,x,y,z,scaleZ=1,seg=96){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),material); m.name=name; m.position.set(x,y,z); m.scale.z=scaleZ; m.receiveShadow=true; return m; }
function box(name,sx,sy,sz,material,x,y,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material); m.name=name; m.position.set(x,y,z); m.receiveShadow=true; return m; }
function hideOld(host){
  [
    'PHASE155_ENHANCED_REAL_TABLE_FALLBACK',
    'PHASE156_TABLE2_STOOL_TEXTURE_ROOT',
    'PHASE142_PLAYABLE_POKER_CORE_ROOT'
  ].forEach(n=>{ const o=host.getObjectByName(n); if(o) o.visible=false; });
}
function addSeat(parent,name,x,z,open=false){
  const g=new THREE.Group(); g.name=name; g.position.set(x,0,z); g.rotation.y=Math.atan2(x,z)+Math.PI; parent.add(g);
  const seatMat=open?mat(0x102c35,.82,.04):mat(0x0d0d10,.86,.04);
  const wood=mat(0x7a4d2f,.66,.03);
  const metal=mat(0xa48d55,.38,.55);
  g.add(cyl(name+'_PADDED_ROUND_STOOL_SEAT',.37,.14,seatMat,0,.88,0,1,64));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.018,8,64),glow(open?0x7ffcff:0xffd98a,open?.52:.42)); ring.name=name+'_RING'; ring.rotation.x=Math.PI/2; ring.position.y=.97; g.add(ring);
  [[-.2,.18],[.2,.18],[-.2,-.18],[.2,-.18]].forEach((p,i)=>g.add(cyl(name+'_LEG_'+i,.05,.9,wood,p[0],.42,p[1],1,16)));
  const foot=new THREE.Mesh(new THREE.TorusGeometry(.32,.014,8,64),metal); foot.name=name+'_FOOT_RING'; foot.rotation.x=Math.PI/2; foot.position.y=.35; g.add(foot);
}
function stableFallback(root){
  const rail=mat(0x1a1016,.78,.07), felt=mat(0x101412,.88,.02), leather=mat(0x231414,.72,.05), wood=mat(0x6a4328,.65,.03), gold=glow(0xffd98a,.62);
  root.add(cyl('PHASE157_STABLE_DARK_TABLE_RAIL',2.68,.30,rail,0,.82,0,.58,128));
  root.add(cyl('PHASE157_STABLE_DARK_TABLE_CUSHION',2.38,.16,leather,0,1.03,0,.54,128));
  root.add(cyl('PHASE157_STABLE_NO_BLINK_TABLE_FELT',2.10,.055,felt,0,1.15,0,.50,128));
  const pass=new THREE.Mesh(new THREE.TorusGeometry(2.02,.024,8,150),gold); pass.name='PHASE157_STABLE_GOLD_PASS_LINE'; pass.scale.z=.50; pass.rotation.x=Math.PI/2; pass.position.y=1.185; root.add(pass);
  const logo=new THREE.Mesh(new THREE.CircleGeometry(.44,64),glow(0x7ffcff,.26)); logo.name='PHASE157_STABLE_CENTER_SVR_LOGO'; logo.rotation.x=-Math.PI/2; logo.position.y=1.193; root.add(logo);
  [[-1.45,-.55],[-.45,-.62],[.45,-.62],[1.45,-.55]].forEach((p,i)=>root.add(cyl('PHASE157_STABLE_TABLE_LEG_'+i,.07,.95,wood,p[0],.44,p[1],1,18)));
}
async function loadFbxInto(root){
  if(window.SVR_PHASE157_TABLE_FBX_LOADING || window.SVR_PHASE157_TABLE_FBX_LOADED) return;
  window.SVR_PHASE157_TABLE_FBX_LOADING=true;
  for(const url of FBX_CANDIDATES){
    try{
      const res=await fetch(url,{method:'HEAD',cache:'no-store'});
      if(!res.ok) continue;
      const obj=await new FBXLoader().loadAsync(url);
      obj.name='PHASE157_ACTUAL_UPLOADED_TABLE_FBX_MODEL';
      obj.position.set(0,.02,0);
      obj.rotation.set(0,Math.PI,0);
      obj.scale.setScalar(0.018);
      let meshCount=0;
      obj.traverse(o=>{
        if(o.isMesh){
          meshCount++;
          o.castShadow=false;
          o.receiveShadow=true;
          o.frustumCulled=false;
          if(!o.material) o.material=mat(0x201713,.72,.04);
        }
      });
      root.add(obj);
      window.SVR_PHASE157_TABLE_FBX_LOADED={url,meshCount,loaded:true,checkedAt:new Date().toISOString()};
      window.SVR_PHASE157_TABLE_FBX_LOADING=false;
      return;
    }catch(e){ window.SVR_PHASE157_LAST_FBX_ERROR=`${url}: ${e?.message||e}`; }
  }
  window.SVR_PHASE157_TABLE_FBX_LOADING=false;
}
function install(scene=window.__SVR_SCENE__){
  if(!scene) return false;
  const host=sceneRoot(scene); if(!host) return false;
  hideOld(host);
  let root=host.getObjectByName(ROOT);
  if(!root){
    root=new THREE.Group(); root.name=ROOT; root.position.set(0,0,0.75); host.add(root);
    stableFallback(root);
    [[0,3.24,true],[-2.55,1.75,false],[-2.55,-1.35,false],[0,-3.05,false],[2.55,-1.35,false],[2.55,1.75,false]].forEach((s,i)=>addSeat(root,s[2]?'PHASE157_OPEN_PLAYER_STOOL':'PHASE157_BOT_STOOL_'+i,s[0],s[1],s[2]));
    loadFbxInto(root);
  }
  window.SVR_PHASE156_TABLE2_STOOL_TEXTURE_LOCK={build:LABEL,active:true,noBlink:true,rebuildLoopDisabled:true,actualFbxPreferred:true,candidates:FBX_CANDIDATES,fbxLoaded:!!window.SVR_PHASE157_TABLE_FBX_LOADED,fbxInfo:window.SVR_PHASE157_TABLE_FBX_LOADED||null,stableFallbackVisible:!window.SVR_PHASE157_TABLE_FBX_LOADED,stoolsAdded:6,siteTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE156_TABLE2_AUDIT=()=>window.SVR_PHASE156_TABLE2_STOOL_TEXTURE_LOCK;
  window.SVR_RUN_PHASE157_TABLE_AUDIT=()=>window.SVR_PHASE156_TABLE2_STOOL_TEXTURE_LOCK;
  return true;
}
[350,900,1800,3500].forEach(ms=>setTimeout(()=>install(),ms));
install();
