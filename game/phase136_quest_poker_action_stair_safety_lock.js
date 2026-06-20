import * as THREE from "three";

const LABEL = "PHASE-136-QUEST-POKER-ACTION-STAIR-SAFETY-LOCK";
const ROOT = "PHASE136_QUEST_POKER_ACTION_STAIR_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;
const PURPLE = 0x9b4dff;

const ACTIONS = [
  { key:"fold", label:"FOLD", color:RED, x:-2.42 },
  { key:"check", label:"CHECK", color:CYAN, x:-1.45 },
  { key:"call", label:"CALL", color:GREEN, x:-.48 },
  { key:"raise", label:"RAISE", color:GOLD, x:.48 },
  { key:"all_in", label:"ALL-IN", color:0xffffff, x:1.45 },
  { key:"next", label:"NEXT", color:PURPLE, x:2.42 }
];

const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const tmpDir = new THREE.Vector3();
let lastPinch = false;
let armedHandAction = null;
let lastControllerButtons = [false,false];
let selectionCount = 0;
let hoverAction = null;
let actionTarget = null;

function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function removeDuplicateTable(scene){ let removed=0; let dup=scene?.getObjectByName?.(DUP); while(dup){ dup.parent?.remove(dup); removed++; dup=scene.getObjectByName(DUP); } return removed; }
function selectable(scene){ const arr=[]; scene?.traverse?.((o)=>{ if(o.visible!==false && o.userData?.phase136PokerActionSelectable) arr.push(o); }); return arr; }
function actionFrom(obj){ let o=obj; while(o){ if(o.userData?.phase136PokerAction) return o.userData.phase136PokerAction; o=o.parent; } return null; }
function dispatch(action, source="phase136"){
  const rec=ACTIONS.find(a=>a.key===action);
  if(!rec) return false;
  selectionCount++;
  window.SVR_PHASE136_LAST_POKER_ACTION = { action:rec.key, label:rec.label, source, selectionCount, checkedAt:new Date().toISOString() };
  window.dispatchEvent(new CustomEvent("svr-poker-player-action", { detail:{ action:rec.key, source, phase:136 } }));
  pulseAction(rec.key);
  return true;
}
function pulseAction(key){
  const scene=window.__SVR_SCENE__;
  scene?.traverse?.((o)=>{
    if(o.userData?.phase136PokerAction===key && o.material){
      o.userData.phase136PulseUntil = performance.now()+380;
    }
  });
}
function tex(label,color){
  const c=document.createElement("canvas"); c.width=520; c.height=260; const x=c.getContext("2d");
  const hex=`#${color.toString(16).padStart(6,"0")}`;
  const bg=x.createLinearGradient(0,0,c.width,c.height); bg.addColorStop(0,"#03050b"); bg.addColorStop(.55,"#130617"); bg.addColorStop(1,"#02040a");
  x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="rgba(255,217,138,.88)"; x.lineWidth=10; x.strokeRect(16,16,c.width-32,c.height-32);
  x.strokeStyle=hex; x.lineWidth=7; x.strokeRect(42,42,c.width-84,c.height-84);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=hex; x.shadowBlur=18;
  x.fillStyle="#fff8df"; x.font="900 58px system-ui,Arial"; x.fillText(label,c.width/2,118,c.width-70);
  x.shadowBlur=6; x.fillStyle="#bffcff"; x.font="800 24px system-ui,Arial"; x.fillText("AIM + SELECT",c.width/2,186,c.width-60);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
function addActionRail(scene){
  const root=scene.getObjectByName(ROOT);
  const rail=new THREE.Group(); rail.name="PHASE136_VR_POKER_ACTION_RAIL"; rail.position.set(0,0,2.05); root.add(rail);
  const base=new THREE.Mesh(new THREE.BoxGeometry(5.75,.08,.18),new THREE.MeshStandardMaterial({color:0x080812,roughness:.42,metalness:.18,emissive:CYAN,emissiveIntensity:.035}));
  base.name="PHASE136_ACTION_RAIL_BASE"; base.position.set(0,.82,.03); rail.add(base);
  ACTIONS.forEach(a=>{
    const g=new THREE.Group(); g.name=`PHASE136_VR_ACTION_BUTTON_${a.key.toUpperCase()}`; g.position.set(a.x,1.06,0); g.userData.phase136PokerAction=a.key; rail.add(g);
    const hit=new THREE.Mesh(new THREE.BoxGeometry(.88,.58,.22),new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:.10,depthWrite:false}));
    hit.name=`PHASE136_VR_ACTION_HITBOX_${a.key.toUpperCase()}`; hit.userData.phase136PokerAction=a.key; hit.userData.phase136PokerActionSelectable=true; hit.renderOrder=930; g.add(hit);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(.78,.40),new THREE.MeshBasicMaterial({map:tex(a.label,a.color),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    face.name=`PHASE136_VR_ACTION_LABEL_${a.key.toUpperCase()}`; face.position.set(0,0,.118); face.userData.phase136PokerAction=a.key; face.userData.phase136PokerActionSelectable=true; face.renderOrder=935; g.add(face);
    const glow=new THREE.Mesh(new THREE.RingGeometry(.38,.45,48),new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
    glow.name=`PHASE136_VR_ACTION_HOVER_RING_${a.key.toUpperCase()}`; glow.position.set(0,0,.13); glow.userData.phase136PokerAction=a.key; glow.renderOrder=934; g.add(glow);
  });
  const hintTex=hintTexture();
  const hint=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.55),new THREE.MeshBasicMaterial({map:hintTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  hint.name="PHASE136_SMALL_VR_POKER_HINT"; hint.position.set(0,1.72,.02); hint.renderOrder=936; rail.add(hint);
  actionTarget=new THREE.Mesh(new THREE.RingGeometry(.15,.22,48),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  actionTarget.name="PHASE136_ACTION_AIM_TARGET_RING"; actionTarget.visible=false; actionTarget.renderOrder=940; root.add(actionTarget);
}
function hintTexture(){
  const c=document.createElement("canvas"); c.width=900; c.height=240; const x=c.getContext("2d");
  x.fillStyle="rgba(0,0,0,.70)"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="#7ffcff"; x.lineWidth=8; x.strokeRect(20,20,c.width-40,c.height-40);
  x.textAlign="center"; x.textBaseline="middle"; x.fillStyle="#fff8df"; x.font="900 38px system-ui,Arial"; x.fillText("QUEST: AIM CONTROLLER OR HAND",c.width/2,80,c.width-70);
  x.fillStyle="#bffcff"; x.font="800 28px system-ui,Arial"; x.fillText("Trigger / select / pinch release chooses poker action",c.width/2,150,c.width-70);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function installPointer(scene){
  if(window.SVR_PHASE136_POINTER_INSTALLED) return;
  window.SVR_PHASE136_POINTER_INSTALLED=true;
  window.addEventListener("pointerdown", ev=>{
    const renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__, canvas=renderer?.domElement||document.querySelector("canvas");
    if(!renderer||!camera||!canvas) return;
    const r=canvas.getBoundingClientRect();
    mouse.x=((ev.clientX-r.left)/Math.max(r.width,1))*2-1;
    mouse.y=-((ev.clientY-r.top)/Math.max(r.height,1))*2+1;
    ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObjects(selectable(scene),true).find(h=>actionFrom(h.object));
    if(hit){ ev.preventDefault?.(); dispatch(actionFrom(hit.object),"phase136-pointer"); }
  },{passive:false});
}
function getControllerRay(controller){
  controller.updateMatrixWorld(true);
  controller.getWorldPosition(tmpA);
  tmpDir.set(0,0,-1).applyQuaternion(controller.getWorldQuaternion(tmpQ)).normalize();
  ray.set(tmpA,tmpDir); ray.far=9; return ray;
}
function installController(scene){
  const renderer=window.__SVR_RENDERER__;
  if(!renderer?.xr || window.SVR_PHASE136_CONTROLLER_INSTALLED) return;
  window.SVR_PHASE136_CONTROLLER_INSTALLED=true;
  function bind(i){
    const c=renderer.xr.getController?.(i);
    if(!c || c.userData.phase136PokerBound) return;
    c.userData.phase136PokerBound=true;
    const fire=(source)=>{
      const hit=getControllerRay(c).intersectObjects(selectable(scene),true).find(h=>actionFrom(h.object));
      if(hit) dispatch(actionFrom(hit.object),source);
    };
    c.addEventListener("selectstart",()=>fire("phase136-controller-selectstart"));
    c.addEventListener("selectend",()=>fire("phase136-controller-selectend"));
    c.addEventListener("squeezestart",()=>fire("phase136-controller-squeezestart"));
  }
  bind(0); bind(1);
  renderer.xr.addEventListener?.("sessionstart",()=>{ setTimeout(()=>{bind(0);bind(1);},200); });
}
function gamepadPressed(controller){
  const gp=controller?.userData?.gamepad || controller?.userData?.inputSource?.gamepad || null;
  if(!gp?.buttons?.length) return false;
  return gp.buttons.some((b,i)=>i<6 && (b?.pressed || Number(b?.value||0)>.55));
}
function getJoint(hand,name){ return hand?.joints?.[name] || hand?.getObjectByName?.(name) || null; }
function hands(){
  const renderer=window.__SVR_RENDERER__; const arr=[];
  try{ const h0=renderer?.xr?.getHand?.(0), h1=renderer?.xr?.getHand?.(1); if(h0) arr.push(h0); if(h1) arr.push(h1); }catch{}
  (window.__SVR_XR_HANDS__||window.SVR_XR_HANDS||[]).forEach(h=>{ if(h&&!arr.includes(h)) arr.push(h); });
  return arr;
}
function pinching(hand){
  const t=getJoint(hand,"thumb-tip"), i=getJoint(hand,"index-finger-tip"); if(!t||!i) return false;
  t.getWorldPosition(tmpA); i.getWorldPosition(tmpB); return tmpA.distanceTo(tmpB)<.038;
}
function handRay(hand){
  const wrist=getJoint(hand,"wrist")||hand, index=getJoint(hand,"index-finger-tip")||hand;
  wrist.getWorldPosition(tmpA); index.getWorldPosition(tmpB);
  tmpDir.copy(tmpB).sub(tmpA);
  if(tmpDir.lengthSq()<.0001) hand.getWorldDirection(tmpDir); else tmpDir.normalize();
  ray.set(tmpA,tmpDir); ray.far=9; return ray;
}
function installLoop(scene){
  if(window.SVR_PHASE136_LOOP_INSTALLED) return;
  window.SVR_PHASE136_LOOP_INSTALLED=true;
  const tick=()=>{
    const renderer=window.__SVR_RENDERER__;
    const objects=selectable(scene);
    let hit=null, source="none";
    try{
      for(let i=0;i<2;i++){
        const c=renderer?.xr?.getController?.(i);
        if(c){ const h=getControllerRay(c).intersectObjects(objects,true).find(x=>actionFrom(x.object)); if(h){ hit=h; source=`controller${i}`; break; } }
      }
    }catch{}
    let pin=false;
    if(!hit){
      for(const hnd of hands()){
        if(!hnd?.visible) continue;
        const h=handRay(hnd).intersectObjects(objects,true).find(x=>actionFrom(x.object));
        if(h){ hit=h; source="hand"; }
        if(pinching(hnd)) pin=true;
      }
    }else{
      for(const hnd of hands()) if(hnd?.visible && pinching(hnd)) pin=true;
    }
    hoverAction = hit ? actionFrom(hit.object) : null;
    window.SVR_PHASE136_POKER_ACTION_HOVER = !!hoverAction;
    window.SVR_PHASE136_BLOCK_TELEPORT_FOR_POKER_ACTION = !!hoverAction && pin;
    if(actionTarget){ actionTarget.visible=!!hit; if(hit) actionTarget.position.copy(hit.point); }
    if(pin && hoverAction) armedHandAction=hoverAction;
    if(lastPinch && !pin && armedHandAction){ dispatch(armedHandAction,"phase136-hand-pinch-release"); armedHandAction=null; }
    if(!pin && !hoverAction) armedHandAction=null;
    lastPinch=pin;
    try{
      for(let i=0;i<2;i++){
        const c=renderer?.xr?.getController?.(i); const pressed=gamepadPressed(c);
        if(pressed && !lastControllerButtons[i] && hoverAction) dispatch(hoverAction,`phase136-gamepad-button-${i}`);
        lastControllerButtons[i]=pressed;
      }
    }catch{}
    scene.traverse?.(o=>{
      if(!o.userData?.phase136PokerAction || !o.material) return;
      const active=o.userData.phase136PokerAction===hoverAction;
      const pulse=o.userData.phase136PulseUntil && performance.now()<o.userData.phase136PulseUntil;
      if(o.material.opacity!==undefined && /HOVER_RING|HITBOX/i.test(String(o.name||""))) o.material.opacity = active || pulse ? .44 : .12;
    });
    window.SVR_PHASE136_POKER_ACTION_LOOP_STATUS={build:LABEL,hoverAction,source,pinching:pin,armedHandAction,selectionCount,checkedAt:new Date().toISOString()};
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function addStairs(scene){
  const root=scene.getObjectByName(ROOT);
  const mat=new THREE.MeshStandardMaterial({color:0x8b0b1a,roughness:.58,metalness:.05,emissive:0x2a0206,emissiveIntensity:.08});
  const railMat=new THREE.MeshStandardMaterial({color:GOLD,roughness:.38,metalness:.3,emissive:GOLD,emissiveIntensity:.04});
  const configs=[{name:"LEFT",x:-14.4,z:4.75,ry:0},{name:"RIGHT",x:14.4,z:4.75,ry:0}];
  configs.forEach(c=>{
    const g=new THREE.Group(); g.name=`PHASE136_SOLID_RED_CARPET_STAIR_${c.name}`; g.position.set(c.x,0,c.z); g.rotation.y=c.ry; root.add(g);
    for(let i=0;i<8;i++){
      const step=new THREE.Mesh(new THREE.BoxGeometry(4.3,.10,.62),mat);
      step.name=`PHASE136_STAIR_STEP_${c.name}_${i}`; step.position.set(0,.06+i*.18,-i*.52); step.userData.phase136WalkableStair=true; g.add(step);
    }
    const ramp=new THREE.Mesh(new THREE.BoxGeometry(4.36,.05,4.35),mat); ramp.name=`PHASE136_STAIR_CONTINUOUS_WALK_SURFACE_${c.name}`; ramp.position.set(0,.72,-1.85); ramp.rotation.x=-.32; ramp.userData.phase136WalkableStair=true; ramp.material.transparent=true; ramp.material.opacity=.88; g.add(ramp);
    [-2.28,2.28].forEach(x=>{ const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.12,4.7),railMat); rail.name=`PHASE136_STAIR_GOLD_RAIL_${c.name}`; rail.position.set(x,.78,-1.8); rail.rotation.x=-.32; g.add(rail); });
  });
  const balcony=new THREE.Mesh(new THREE.BoxGeometry(30,.08,4.2),mat); balcony.name="PHASE136_UPSTAIRS_RED_CARPET_BALCONY_SURFACE"; balcony.position.set(0,3.46,-12.1); balcony.userData.phase136WalkableStair=true; root.add(balcony);
}
function cleanOldActionClutter(scene){
  let hidden=0;
  scene?.traverse?.(o=>{
    const n=String(o.name||"");
    if(/PHASE124.*HOTKEY|PRESS_R|PRESS R|WAITING.*CARD|PHASE123.*STATUS|PHASE122.*STATUS/i.test(n)){ o.visible=false; hidden++; }
  });
  return hidden;
}
function qa(scene){
  return {build:LABEL,oneTable:!scene?.getObjectByName?.(DUP),actionButtons:count(scene,/PHASE136_VR_ACTION_BUTTON/i),hitboxes:count(scene,/PHASE136_VR_ACTION_HITBOX/i),controllerInstalled:!!window.SVR_PHASE136_CONTROLLER_INSTALLED,loopInstalled:!!window.SVR_PHASE136_LOOP_INSTALLED,pointerInstalled:!!window.SVR_PHASE136_POINTER_INSTALLED,stairs:count(scene,/PHASE136_STAIR|PHASE136_UPSTAIRS/i),lastAction:window.SVR_PHASE136_LAST_POKER_ACTION||null,hover:window.SVR_PHASE136_POKER_ACTION_LOOP_STATUS||null,movementControl:!!window.SVR_PHASE135_PLAYABILITY_MOVEMENT_CONTROL_LOCK,siteTouched:false,checkedAt:new Date().toISOString()};
}
function install(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  const removedDuplicateTable=removeDuplicateTable(scene);
  const hiddenOld=cleanOldActionClutter(scene);
  addActionRail(scene);
  addStairs(scene);
  installPointer(scene);
  installController(scene);
  installLoop(scene);
  window.SVR_PHASE136_QUEST_POKER_ACTION_STAIR_SAFETY_LOCK={build:LABEL,active:true,removedDuplicateTable,hiddenOld,vrPokerActionRail:true,stairsAdded:true,siteTouched:false,publicRootTouched:false,pokerLogicTouched:false,movementTouched:false,watchTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE136_POKER_ACTION_STAIR_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach(d=>setTimeout(install,d));
