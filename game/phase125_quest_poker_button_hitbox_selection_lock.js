import * as THREE from "three";

const LABEL = "PHASE-125-QUEST-POKER-BUTTON-HITBOX-SELECTION-LOCK";
const ROOT = "PHASE125_QUEST_POKER_BUTTON_HITBOX_ROOT";
const TARGET = "PHASE125_QUEST_POKER_BUTTON_TARGET_RING";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;
const PURPLE = 0x9b4dff;

const ACTIONS = [
  { key:"fold", label:"FOLD", color:RED, x:-2.65 },
  { key:"check", label:"CHECK", color:CYAN, x:-1.58 },
  { key:"call", label:"CALL", color:GREEN, x:-.52 },
  { key:"raise", label:"RAISE", color:GOLD, x:.52 },
  { key:"all_in", label:"ALL-IN", color:0xffffff, x:1.58 },
  { key:"next", label:"NEXT", color:PURPLE, x:2.65 }
];

const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
let lastPinch = false;
let armed = null;
let currentTarget = null;
let pulse = 0;
let eventCount = 0;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene.getObjectByName(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function glow(color, opacity=.26){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function buttonTexture(label, color){
  const c=document.createElement("canvas"); c.width=640; c.height=300; const x=c.getContext("2d");
  const hex=`#${color.toString(16).padStart(6,"0")}`;
  const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#03050b"); g.addColorStop(.55,"#120617"); g.addColorStop(1,"#02040a");
  x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="rgba(255,217,138,.82)"; x.lineWidth=12; x.strokeRect(18,18,c.width-36,c.height-36);
  x.strokeStyle=hex; x.lineWidth=8; x.strokeRect(48,48,c.width-96,c.height-96);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=hex; x.shadowBlur=20;
  x.fillStyle="#fff8df"; x.font="900 62px system-ui,Arial"; x.fillText(label,c.width/2,145,c.width-80);
  x.shadowBlur=7; x.fillStyle="#bffcff"; x.font="800 24px system-ui,Arial"; x.fillText("PINCH / SELECT / TAP",c.width/2,222,c.width-70);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}
function selectable(scene){
  const arr=[];
  scene?.traverse?.((o)=>{ if(o.visible !== false && o.userData?.phase125PokerSelectable) arr.push(o); });
  return arr;
}
function dispatch(action, source="phase125-selection"){
  const rec = ACTIONS.find((a)=>a.key===action);
  if(!rec) return false;
  eventCount++;
  window.SVR_PHASE125_LAST_SELECTION = { action:rec.key, label:rec.label, source, eventCount, checkedAt:new Date().toISOString() };
  window.dispatchEvent(new CustomEvent("svr-poker-player-action", { detail:{ action:rec.key, source, phase:125 } }));
  return true;
}
function addButtons(scene){
  const root=scene.getObjectByName(ROOT);
  const baseZ=1.12;
  ACTIONS.forEach((a,i)=>{
    const group=new THREE.Group();
    group.name=`PHASE125_QUEST_SAFE_ACTION_HITBOX_${a.label.replace(/[^A-Z0-9]/g,"_")}`;
    group.position.set(a.x,.52,baseZ);
    group.userData.phase125PokerAction=a.key;
    group.userData.phase125PokerSelectable=true;
    root.add(group);
    const pad=new THREE.Mesh(new THREE.BoxGeometry(.94,.16,.56),new THREE.MeshStandardMaterial({color:0x070810,roughness:.55,metalness:.18,emissive:a.color,emissiveIntensity:.08,transparent:true,opacity:.88}));
    pad.name=`PHASE125_QUEST_ACTION_HITBOX_PAD_${a.label}`;
    pad.userData.phase125PokerAction=a.key;
    pad.userData.phase125PokerSelectable=true;
    pad.renderOrder=830;
    group.add(pad);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(.86,.40),new THREE.MeshBasicMaterial({map:buttonTexture(a.label,a.color),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    screen.name=`PHASE125_QUEST_ACTION_HITBOX_LABEL_${a.label}`;
    screen.position.set(0,.095,.012);
    screen.rotation.x=-Math.PI/2;
    screen.userData.phase125PokerAction=a.key;
    screen.userData.phase125PokerSelectable=true;
    screen.renderOrder=835;
    group.add(screen);
    const halo=new THREE.Mesh(new THREE.RingGeometry(.43,.50,48),glow(a.color,.18));
    halo.name=`PHASE125_QUEST_ACTION_HITBOX_HALO_${a.label}`;
    halo.position.set(0,.102,0);
    halo.rotation.x=-Math.PI/2;
    halo.userData.phase125PokerAction=a.key;
    halo.userData.phase125PokerSelectable=true;
    halo.renderOrder=834;
    group.add(halo);
  });
  const target=new THREE.Mesh(new THREE.RingGeometry(.28,.38,64),glow(GOLD,.9));
  target.name=TARGET;
  target.position.set(0,.86,1.12);
  target.rotation.x=-Math.PI/2;
  target.visible=false;
  target.renderOrder=850;
  root.add(target);
}
function findActionFromObject(obj){
  let o=obj;
  while(o){ if(o.userData?.phase125PokerAction) return o.userData.phase125PokerAction; o=o.parent; }
  return null;
}
function activateObject(obj, source){
  const action=findActionFromObject(obj);
  if(!action) return false;
  return dispatch(action, source);
}
function installPointer(scene){
  if(window.SVR_PHASE125_POINTER_INSTALLED) return;
  window.SVR_PHASE125_POINTER_INSTALLED=true;
  window.addEventListener("pointerdown",(ev)=>{
    const renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__;
    const canvas=renderer?.domElement || document.querySelector("canvas");
    if(!renderer || !camera || !canvas) return;
    const r=canvas.getBoundingClientRect();
    mouse.x=((ev.clientX-r.left)/Math.max(r.width,1))*2-1;
    mouse.y=-((ev.clientY-r.top)/Math.max(r.height,1))*2+1;
    ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObjects(selectable(scene),true).find((h)=>findActionFromObject(h.object));
    if(hit){ ev.preventDefault?.(); activateObject(hit.object,"phase125-pointer"); }
  },{passive:false});
}
function installControllerSelect(scene){
  const renderer=window.__SVR_RENDERER__;
  if(!renderer?.xr) return;
  const rc=new THREE.Raycaster();
  const origin=new THREE.Vector3();
  const dir=new THREE.Vector3(0,0,-1);
  function bind(i){
    const controller=renderer.xr.getController?.(i);
    if(!controller || controller.userData.phase125PokerBound) return;
    controller.userData.phase125PokerBound=true;
    controller.addEventListener("selectend",()=>{
      controller.updateMatrixWorld(true);
      controller.getWorldPosition(origin);
      dir.set(0,0,-1).applyQuaternion(controller.getWorldQuaternion(tmpQ)).normalize();
      rc.set(origin,dir); rc.far=10;
      const hit=rc.intersectObjects(selectable(scene),true).find((h)=>findActionFromObject(h.object));
      if(hit) activateObject(hit.object,"phase125-controller");
    });
  }
  bind(0); bind(1);
  renderer.xr.addEventListener?.("sessionstart",()=>{bind(0);bind(1);});
}
function getJoint(hand,name){ return hand?.joints?.[name] || hand?.getObjectByName?.(name) || null; }
function getHands(){
  const renderer=window.__SVR_RENDERER__;
  const hands=[];
  try{ const h0=renderer?.xr?.getHand?.(0), h1=renderer?.xr?.getHand?.(1); if(h0) hands.push(h0); if(h1) hands.push(h1); }catch{}
  const extra=window.__SVR_XR_HANDS__ || window.SVR_XR_HANDS || [];
  extra.forEach((h)=>{ if(h && !hands.includes(h)) hands.push(h); });
  return hands;
}
function handPinching(hand){
  const t=getJoint(hand,"thumb-tip"), i=getJoint(hand,"index-finger-tip");
  if(!t || !i) return false;
  t.getWorldPosition(tmpA); i.getWorldPosition(tmpB);
  return tmpA.distanceTo(tmpB)<.035;
}
function handAimRay(hand){
  const wrist=getJoint(hand,"wrist") || hand;
  const index=getJoint(hand,"index-finger-tip") || hand;
  wrist.getWorldPosition(tmpA); index.getWorldPosition(tmpB);
  const dir=tmpB.clone().sub(tmpA);
  if(dir.lengthSq()<.00001) hand.getWorldDirection(dir); else dir.normalize();
  ray.set(tmpA,dir); ray.far=10;
  return ray;
}
function installHands(scene){
  if(window.SVR_PHASE125_HAND_LOOP_INSTALLED) return;
  window.SVR_PHASE125_HAND_LOOP_INSTALLED=true;
  const tick=()=>{
    const live=window.__SVR_SCENE__;
    if(!live){ requestAnimationFrame(tick); return; }
    const target=live.getObjectByName(TARGET);
    const objects=selectable(live);
    let hit=null, pinching=false;
    for(const hand of getHands()){
      if(!hand?.visible) continue;
      const result=handAimRay(hand).intersectObjects(objects,true).find((h)=>findActionFromObject(h.object));
      if(result) hit=result;
      if(handPinching(hand)) pinching=true;
    }
    currentTarget=hit?.object || null;
    if(target){
      target.visible=!!hit;
      if(hit){ target.position.copy(hit.point); pulse+=.08; target.scale.setScalar(1+Math.sin(pulse)*.08); }
    }
    const action=currentTarget ? findActionFromObject(currentTarget) : null;
    if(pinching && action) armed=action;
    if(lastPinch && !pinching && armed){ dispatch(armed,"phase125-hand-pinch"); armed=null; }
    if(!pinching && !action) armed=null;
    lastPinch=pinching;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible=true;
      o.userData.phase125CoreProtected=true;
      if(o.isMesh){ o.frustumCulled=false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function cleanUi(){
  document.title="Scarlett Poker VR";
  const s=document.getElementById("safeStatus"); if(s) s.textContent="Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent="SCARLETT POKER VR"; });
}
function qa(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    hitboxPads: count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD/i),
    hitboxLabels: count(scene,/PHASE125_QUEST_ACTION_HITBOX_LABEL/i),
    pointer: !!window.SVR_PHASE125_POINTER_INSTALLED,
    handLoop: !!window.SVR_PHASE125_HAND_LOOP_INSTALLED,
    controllerReady: !!window.__SVR_RENDERER__?.xr,
    lastSelection: window.SVR_PHASE125_LAST_SELECTION || null,
    phase122Feedback: !!window.SVR_PHASE122_POKER_TABLE_ACTION_FEEDBACK_FOCUS_LOCK,
    phase123Display: !!window.SVR_PHASE123_POKER_TURN_POT_DISPLAY_FEEDBACK_LOCK,
    phase124Hotkeys: !!window.SVR_PHASE124_POKER_ACTION_ACCESSIBILITY_HOTKEY_LOCK,
    actionObjects: count(scene,/ACTION|PHASE111_ACTION_PAD|PHASE112|PHASE124/i),
    ready: !scene?.getObjectByName?.(DUP) && count(scene,/PHASE125_QUEST_ACTION_HITBOX_PAD/i) >= 6 && !!window.SVR_PHASE125_POINTER_INSTALLED && !!window.SVR_PHASE125_HAND_LOOP_INSTALLED
  };
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable=removeDuplicateTable(scene);
  addButtons(scene);
  const protectedObjects=protectCore(scene);
  installPointer(scene);
  installControllerSelect(scene);
  installHands(scene);
  const report=qa(scene);
  window.SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK={ build:LABEL, active:true, questPokerHitboxes:true, largeHitTargets:true, removedDuplicateTable, protectedObjects, report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, portalRoutesTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE125_HITBOX_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
