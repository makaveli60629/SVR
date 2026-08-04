import * as THREE from "three";

const LABEL = "PHASE-128-ADMIN-PLAYER-PRESENCE-PILLS-PREVIEW-LOCK";
const ROOT = "PHASE128_ADMIN_PLAYER_PRESENCE_PILLS_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;
const PURPLE = 0x9b4dff;
const WHITE = 0xffffff;

const PILLS = [
  { key:"admin", label:"ADMIN", sub:"ONLINE", x:-4.6, y:.78, z:5.4, color:GOLD, role:"admin" },
  { key:"you", label:"YOU", sub:"LOCAL PLAYER", x:0, y:.78, z:2.05, color:CYAN, role:"player" },
  { key:"p2", label:"PLAYER 2", sub:"BOT SEAT", x:-2.95, y:.78, z:-.55, color:PURPLE, role:"bot" },
  { key:"p3", label:"PLAYER 3", sub:"BOT SEAT", x:-2.3, y:.78, z:-3.25, color:GOLD, role:"bot" },
  { key:"p4", label:"PLAYER 4", sub:"BOT SEAT", x:0, y:.78, z:-4.75, color:GREEN, role:"bot" },
  { key:"p5", label:"PLAYER 5", sub:"BOT SEAT", x:2.3, y:.78, z:-3.25, color:GOLD, role:"bot" },
  { key:"p6", label:"PLAYER 6", sub:"BOT SEAT", x:2.95, y:.78, z:-.55, color:PURPLE, role:"bot" }
];

let state = {
  lastAction:"READY",
  actingKey:"you",
  pulse:0,
  onlineCount:PILLS.length,
  checkedAt:null
};
const pillGroups = new Map();
let boardMesh = null;
let boardCanvas = null;
let boardTexture = null;

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene?.getObjectByName?.(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function glow(color, opacity=.22){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function capsuleGroup(color){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.92,28), new THREE.MeshStandardMaterial({ color:0x090a10, roughness:.42, metalness:.2, emissive:color, emissiveIntensity:.10 }));
  body.name = "PHASE128_PRESENCE_PILL_BODY";
  body.position.y = .02;
  g.add(body);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.22,24,12), body.material);
  top.name = "PHASE128_PRESENCE_PILL_TOP";
  top.position.y = .48;
  g.add(top);
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(.22,24,12), body.material);
  bottom.name = "PHASE128_PRESENCE_PILL_BOTTOM";
  bottom.position.y = -.44;
  g.add(bottom);
  const halo = new THREE.Mesh(new THREE.RingGeometry(.33,.43,64), glow(color,.32));
  halo.name = "PHASE128_PRESENCE_PILL_FLOOR_HALO";
  halo.position.y = -.5;
  halo.rotation.x = -Math.PI/2;
  halo.renderOrder = 900;
  g.add(halo);
  g.userData.halo = halo;
  return g;
}
function labelTexture(label, sub, color){
  const c = document.createElement("canvas"); c.width = 640; c.height = 300; const x = c.getContext("2d");
  const hex = `#${color.toString(16).padStart(6,"0")}`;
  x.fillStyle = "rgba(0,0,0,.72)"; x.fillRect(0,0,c.width,c.height);
  const grad = x.createLinearGradient(0,0,c.width,c.height); grad.addColorStop(0,"rgba(255,255,255,.04)"); grad.addColorStop(1,"rgba(127,252,255,.07)");
  x.fillStyle = grad; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.82)"; x.lineWidth = 10; x.strokeRect(18,18,c.width-36,c.height-36);
  x.strokeStyle = hex; x.lineWidth = 6; x.strokeRect(48,48,c.width-96,c.height-96);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = hex; x.shadowBlur = 18;
  x.fillStyle = "#fff8df"; x.font = "900 54px system-ui,Arial"; x.fillText(label,c.width/2,118,c.width-70);
  x.shadowBlur = 8; x.fillStyle = "#bffcff"; x.font = "800 28px system-ui,Arial"; x.fillText(sub,c.width/2,190,c.width-80);
  x.fillStyle = "#8dffb4"; x.font = "800 20px system-ui,Arial"; x.fillText("PRESENCE PREVIEW",c.width/2,238,c.width-80);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
}
function boardTex(){
  if(!boardCanvas){ boardCanvas = document.createElement("canvas"); boardCanvas.width = 1200; boardCanvas.height = 560; }
  const c = boardCanvas, x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,c.width,c.height); bg.addColorStop(0,"#02040a"); bg.addColorStop(.55,"#120617"); bg.addColorStop(1,"#02040a");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(255,217,138,.88)"; x.lineWidth = 14; x.strokeRect(28,28,c.width-56,c.height-56);
  x.strokeStyle = "#7ffcff"; x.lineWidth = 8; x.strokeRect(72,72,c.width-144,c.height-144);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = "#7ffcff"; x.shadowBlur = 22;
  x.fillStyle = "#fff8df"; x.font = "900 62px system-ui,Arial"; x.fillText("SVR PRESENCE",c.width/2,105,c.width-120);
  x.shadowBlur = 8;
  x.fillStyle = "#8dffb4"; x.font = "900 42px system-ui,Arial"; x.fillText("ADMIN ONLINE",c.width/2,195,c.width-120);
  x.fillStyle = "#ffd98a"; x.font = "900 36px system-ui,Arial"; x.fillText(`${state.onlineCount} PRESENCE PILLS ACTIVE`,c.width/2,280,c.width-120);
  x.fillStyle = "#bffcff"; x.font = "800 30px system-ui,Arial"; x.fillText(`LAST TABLE ACTION: ${String(state.lastAction||"READY").toUpperCase().replace("_","-")}`,c.width/2,355,c.width-120);
  x.fillStyle = "#ffffff"; x.font = "800 24px system-ui,Arial"; x.fillText("MULTIPLAYER PREVIEW ONLY • NETWORKING NOT CLAIMED LIVE",c.width/2,435,c.width-120);
  if(!boardTexture){ boardTexture = new THREE.CanvasTexture(c); boardTexture.colorSpace = THREE.SRGBColorSpace; boardTexture.anisotropy = 4; }
  boardTexture.needsUpdate = true;
  return boardTexture;
}
function addPresence(scene){
  const root = scene.getObjectByName(ROOT);
  PILLS.forEach((p)=>{
    const g = capsuleGroup(p.color);
    g.name = `PHASE128_PRESENCE_PILL_${p.key.toUpperCase()}`;
    g.position.set(p.x,p.y,p.z);
    g.userData.phase128PresencePill = true;
    g.userData.phase128Role = p.role;
    g.userData.phase128Key = p.key;
    root.add(g);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.35,.62), new THREE.MeshBasicMaterial({ map:labelTexture(p.label,p.sub,p.color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    label.name = `PHASE128_PRESENCE_LABEL_${p.key.toUpperCase()}`;
    label.position.set(0,.98,0);
    label.renderOrder = 910;
    label.userData.phase128PresencePill = true;
    g.add(label);
    g.userData.label = label;
    pillGroups.set(p.key,g);
  });
  boardMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8,2.25), new THREE.MeshBasicMaterial({ map:boardTex(), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  boardMesh.name = "PHASE128_ADMIN_ONLINE_MULTIPLAYER_PREVIEW_BOARD";
  boardMesh.position.set(-6.05,2.55,7.1);
  boardMesh.rotation.y = .48;
  boardMesh.renderOrder = 915;
  boardMesh.userData.phase128PresencePill = true;
  root.add(boardMesh);
}
function updatePresenceFromAction(action){
  const a = String(action || "ready").toLowerCase();
  state.lastAction = a;
  state.actingKey = a === "next" ? "admin" : "you";
  state.pulse = 1;
  state.checkedAt = new Date().toISOString();
  boardTex();
  window.SVR_PHASE128_LAST_PRESENCE_ACTION = { action:a, actingKey:state.actingKey, onlineCount:state.onlineCount, checkedAt:state.checkedAt };
}
function installEventListener(){
  if(window.SVR_PHASE128_PRESENCE_EVENT_LISTENER_INSTALLED) return;
  window.SVR_PHASE128_PRESENCE_EVENT_LISTENER_INSTALLED = true;
  window.addEventListener("svr-poker-player-action", (e)=>updatePresenceFromAction(e?.detail?.action || "ready"));
}
function animate(){
  if(window.SVR_PHASE128_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE128_ANIMATION_LOOP_INSTALLED = true;
  const tick = ()=>{
    const t = performance.now()*.001;
    if(state.pulse > 0) state.pulse = Math.max(0,state.pulse-.018);
    pillGroups.forEach((g,key)=>{
      const p = PILLS.find((x)=>x.key===key);
      const active = key === state.actingKey;
      const amp = active ? state.pulse : 0;
      g.position.y = p.y + Math.sin(t*1.4 + p.x)*.035 + amp*.10;
      g.rotation.y += active ? .016 : .004;
      if(g.userData.halo?.material){
        g.userData.halo.material.opacity = (active ? .34 : .16) + amp*.32;
        g.userData.halo.scale.setScalar(1 + Math.sin(t*2.4+p.x)*.03 + amp*.24);
      }
      if(g.userData.label){ g.userData.label.lookAt(0,1.55,7.0); }
    });
    if(boardMesh){ boardMesh.lookAt(0,1.55,7.0); boardMesh.position.y = 2.55 + Math.sin(t*1.2)*.025; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects = 0;
  scene?.traverse?.((o)=>{
    const n = String(o.name || "");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|PHASE125|PHASE126|PHASE127|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible = true;
      o.userData.phase128CoreProtected = true;
      if(o.isMesh){ o.frustumCulled = false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function cleanUi(){
  document.title = "Scarlett Poker VR";
  const s = document.getElementById("safeStatus"); if(s) s.textContent = "Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent = "SCARLETT POKER VR"; });
}
function qa(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    presencePills: count(scene,/PHASE128_PRESENCE_PILL_/i),
    presenceLabels: count(scene,/PHASE128_PRESENCE_LABEL_/i),
    adminBoard: !!scene?.getObjectByName?.("PHASE128_ADMIN_ONLINE_MULTIPLAYER_PREVIEW_BOARD"),
    eventListener: !!window.SVR_PHASE128_PRESENCE_EVENT_LISTENER_INSTALLED,
    lastPresenceAction: window.SVR_PHASE128_LAST_PRESENCE_ACTION || null,
    phase127RoundFlow: !!window.SVR_PHASE127_POKER_ROUND_FLOW_DEALER_PROMPT_LOCK,
    phase125Hitboxes: !!window.SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK,
    pokerObjects: count(scene,/POKER|TABLE|CARD|CHIP/i),
    watchObjects: count(scene,/WATCH/i),
    portalRoutes: !!window.SVR_PHASE116_PORTAL_ROUTE_ACTIVATION_NAVIGATION_LOCK,
    visualOnly: true,
    networkingClaimedLive: false,
    ready: !scene?.getObjectByName?.(DUP) && count(scene,/PHASE128_PRESENCE_PILL_/i) >= 7 && !!scene?.getObjectByName?.("PHASE128_ADMIN_ONLINE_MULTIPLAYER_PREVIEW_BOARD")
  };
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable = removeDuplicateTable(scene);
  pillGroups.clear();
  addPresence(scene);
  const protectedObjects = protectCore(scene);
  installEventListener();
  animate();
  const report = qa(scene);
  window.SVR_PHASE128_ADMIN_PLAYER_PRESENCE_PILLS_PREVIEW_LOCK = {
    build: LABEL,
    active:true,
    presencePills:true,
    multiplayerPreviewOnly:true,
    networkingClaimedLive:false,
    removedDuplicateTable,
    protectedObjects,
    report,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    portalRoutesTouched:false,
    watchTouched:false,
    movementTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE128_PRESENCE_QA = () => qa(scene);
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
