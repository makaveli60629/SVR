import * as THREE from "three";

const LABEL = "PHASE-88-VR-CARD-CHIP-INTERACTION-LOCK";
const ROOT = "PHASE88_VR_CARD_CHIP_INTERACTION_ROOT";
const TABLE_Y = 0.82;
const TABLE_Z = -2.95;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const PINK = 0xff5b8c;
const WHITE = 0xffffff;

const CHIP_ACTIONS = [
  { key:"call", label:"CALL", x:-1.15, z:1.15, color:GREEN },
  { key:"raise", label:"RAISE", x:-0.38, z:1.15, color:GOLD },
  { key:"all_in", label:"ALL-IN", x:0.38, z:1.15, color:WHITE },
  { key:"fold", label:"FOLD", x:1.15, z:1.15, color:PINK }
];

function makeTexture(title, subtitle="", color="#7ffcff", dark=false){
  const c=document.createElement("canvas"); c.width=512; c.height=300;
  const ctx=c.getContext("2d");
  ctx.fillStyle=dark?"#05070d":"#f9fbff"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=color; ctx.lineWidth=10; ctx.strokeRect(18,18,476,264);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle=dark?"#ffffff":"#05070d"; ctx.font="900 54px system-ui,Arial"; ctx.fillText(title,256,118);
  if(subtitle){ ctx.fillStyle=color; ctx.font="800 25px system-ui,Arial"; ctx.fillText(subtitle,256,194); }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}

function makeCard(name, label, x, z, hidden=false){
  const tex=makeTexture(label, hidden?"PINCH TO PEEK":"YOUR CARD", hidden?"#ffd98a":"#7ffcff", hidden);
  const card=new THREE.Mesh(new THREE.PlaneGeometry(.42,.62), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, transparent:true, depthWrite:false }));
  card.name=name; card.rotation.x=-Math.PI/2; card.position.set(x,TABLE_Y+0.035,z); card.renderOrder=260;
  card.userData.phase88Selectable=true; card.userData.phase88Type="card"; card.userData.phase88Hidden=hidden; card.userData.phase88Label=label;
  return card;
}

function makeChipPad(action){
  const g=new THREE.Group(); g.name=`PHASE88_CHIP_ACTION_${action.key.toUpperCase()}`; g.position.set(action.x,TABLE_Y+0.045,TABLE_Z+action.z);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.20,.32,48), new THREE.MeshBasicMaterial({ color:action.color, transparent:true, opacity:.66, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  ring.name=`${g.name}_RING`; ring.rotation.x=-Math.PI/2; ring.userData.phase88Selectable=true; ring.userData.phase88Type="chipAction"; ring.userData.phase88Action=action.key; ring.renderOrder=275;
  const tex=makeTexture(action.label,"PINCH / SELECT",`#${action.color.toString(16).padStart(6,"0")}`,true);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(.58,.34), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, transparent:true, depthWrite:false }));
  label.name=`${g.name}_LABEL`; label.position.set(0,.42,-.10); label.userData.phase88Selectable=true; label.userData.phase88Type="chipAction"; label.userData.phase88Action=action.key; label.renderOrder=278;
  g.add(ring,label);
  g.userData.phase88Action=action.key;
  return g;
}

function makeChipStack(name,x,z,color,count=6){
  const g=new THREE.Group(); g.name=name; g.position.set(x,TABLE_Y+0.03,z);
  const mat=new THREE.MeshStandardMaterial({ color, roughness:.42, metalness:.10, emissive:color, emissiveIntensity:.05 });
  for(let i=0;i<count;i++){
    const chip=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.026,32),mat);
    chip.name=`${name}_CHIP_${i}`; chip.position.y=i*.028; chip.renderOrder=240; g.add(chip);
  }
  g.userData.phase88ChipStack=true;
  return g;
}

function emitPoker(action, source="phase88"){
  const payload={ build:LABEL, action, source, tableKey:"lobby-main", seatId:"SOUTH_PLAYER", playMoneyOnly:true, createdAt:new Date().toISOString() };
  window.SVR_PHASE88_LAST_CARD_CHIP_ACTION=payload;
  try{ window.dispatchEvent(new CustomEvent("svr-poker-player-action",{detail:payload})); }catch{}
  try{ window.dispatchEvent(new CustomEvent("svr-card-chip-action",{detail:payload})); }catch{}
  return payload;
}

function handleHit(obj){
  if(!obj?.userData?.phase88Selectable) return false;
  if(obj.userData.phase88Type==="chipAction"){
    emitPoker(obj.userData.phase88Action,"chip-pad");
    return true;
  }
  if(obj.userData.phase88Type==="card"){
    const root=window.__SVR_SCENE__?.getObjectByName(ROOT);
    root?.traverse?.((child)=>{
      if(child.userData?.phase88Type==="card" && child.userData.phase88Hidden){
        child.material.map?.dispose?.();
        child.material.map=makeTexture(child.userData.phase88Label,"YOUR CARD","#7ffcff",false);
        child.material.needsUpdate=true;
        child.userData.phase88Hidden=false;
      }
    });
    window.SVR_PHASE88_CARD_PEEK={ build:LABEL, active:true, peekedAt:new Date().toISOString() };
    return true;
  }
  return false;
}

function installPointer(scene,camera,renderer){
  if(window.__SVR_PHASE88_POINTER__) return;
  window.__SVR_PHASE88_POINTER__=true;
  const ray=new THREE.Raycaster(); const mouse=new THREE.Vector2();
  const selectables=()=>{ const arr=[]; scene.traverse(o=>{ if(o.visible!==false && o.userData?.phase88Selectable) arr.push(o); }); return arr; };
  renderer.domElement.addEventListener("pointerdown",e=>{
    const r=renderer.domElement.getBoundingClientRect(); mouse.x=((e.clientX-r.left)/Math.max(r.width,1))*2-1; mouse.y=-((e.clientY-r.top)/Math.max(r.height,1))*2+1;
    ray.setFromCamera(mouse,camera); const hit=ray.intersectObjects(selectables(),true)[0];
    if(hit?.object && handleHit(hit.object)) e.preventDefault?.();
  },{passive:false});
  function bindController(i){
    const c=renderer.xr?.getController?.(i); if(!c || c.userData.phase88Bound) return; c.userData.phase88Bound=true;
    c.addEventListener("selectend",()=>{
      const origin=new THREE.Vector3(); const dir=new THREE.Vector3(0,0,-1); const q=new THREE.Quaternion();
      c.updateMatrixWorld(true); c.getWorldPosition(origin); c.getWorldQuaternion(q); dir.applyQuaternion(q).normalize(); ray.set(origin,dir);
      const hit=ray.intersectObjects(selectables(),true)[0]; if(hit?.object) handleHit(hit.object);
    });
  }
  renderer.xr?.addEventListener?.("sessionstart",()=>{ bindController(0); bindController(1); }); bindController(0); bindController(1);
}

function build(scene){
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; root.position.set(0,0,0); scene.add(root);
  const pstate=window.SVR_PHASE86_POKER_STATE || {};
  const user=(pstate.players||[]).find(p=>p.isUser) || { cards:["A♠","K♠"] };
  root.add(makeCard("PHASE88_PLAYER_CARD_LEFT", user.cards?.[0] || "A♠", -.34, TABLE_Z+.58, false));
  root.add(makeCard("PHASE88_PLAYER_CARD_RIGHT", user.cards?.[1] || "K♠", .14, TABLE_Z+.58, false));
  const community=pstate.community || [];
  for(let i=0;i<5;i++) root.add(makeCard(`PHASE88_COMMUNITY_CARD_${i+1}`, community[i] || "SVR", -1.06+i*.53, TABLE_Z-.10, !community[i]));
  root.add(makeChipStack("PHASE88_PLAYER_CHIP_STACK", -1.45, TABLE_Z+.68, GOLD, 8));
  root.add(makeChipStack("PHASE88_POT_CHIP_STACK", 1.45, TABLE_Z-.10, CYAN, Math.min(10, 4+Math.floor((pstate.pot||75)/200))));
  CHIP_ACTIONS.forEach(a=>root.add(makeChipPad(a)));
  root.traverse(o=>{ o.userData.phase88Root=true; });
  return root;
}

function install(){
  const scene=window.__SVR_SCENE__; const renderer=window.__SVR_RENDERER__; const camera=window.__SVR_CAMERA__||scene?.userData?._camera;
  if(!scene||!renderer||!camera) return false;
  build(scene); installPointer(scene,camera,renderer);
  window.SVR_PHASE88_VR_CARD_CHIP_INTERACTION_LOCK={
    build:LABEL,
    active:true,
    selectableCards:true,
    selectableChipPads:true,
    actions:CHIP_ACTIONS.map(a=>a.key),
    emits:"svr-poker-player-action / svr-card-chip-action",
    playMoneyOnly:true,
    siteTouched:false,
    lobbyRedesignTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL; window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>140) clearInterval(timer); },300);
window.addEventListener("svr-poker-core-action",()=>setTimeout(install,50));
[800,1800,3600,7200,12000].forEach(d=>setTimeout(install,d));
