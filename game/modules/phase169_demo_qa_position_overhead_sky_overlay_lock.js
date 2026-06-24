import * as THREE from "three";

const LABEL = "PHASE-169-DEMO-QA-POSITION-SKY-OVERLAY-MODULE-LOCK";
const SKY_ROOT = "PHASE169_MODULAR_MOON_MARS_SKY_ROOT";
const PANEL_ID = "svr-phase169-position-panel";
const OLD_PLANET_NAMES = new Set([
  "PHASE200_SINGLE_VISIBLE_MOON_LOCKED",
  "PHASE200_SINGLE_VISIBLE_MARS_LOCKED",
  "PHASE262_SINGLE_VISIBLE_MOON_LOCKED",
  "PHASE262_SINGLE_VISIBLE_MARS_LOCKED",
  "PHASE221_MOON_TEXTURE_POLISH_LOCK",
  "PHASE160_ORBITAL_MOON",
  "PHASE160_ORBITAL_MARS"
]);
const OVERLAY_NAME_TEST = /(face|black|vignette|iris|fade|oculus).*overlay|overlay.*(face|black|vignette|iris|fade|oculus)|black.*screen|screen.*black/i;

let camera = null;
let renderer = null;
let scene = null;
let root = null;
let panel = null;
let panelVisible = true;
let overhead = false;
let savedPose = null;
let overheadHeight = 9.5;
let lastMouse = { x:0, y:0, floor:null };
let lastClick = null;
let moon = null;
let mars = null;
let started = false;

function isQuest(){ return /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ""); }
function isAndroid(){ return /Android/i.test(navigator.userAgent || ""); }
function isDesktopPanelAllowed(){ return !isQuest() && !isAndroid() && window.self === window.top; }
function sceneRoot(s){ return s?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || s; }
function fixed(n, d=2){ return Number.isFinite(n) ? Number(n).toFixed(d) : "--"; }
function deg(r){ return fixed(THREE.MathUtils.radToDeg(r),1); }
function nowIso(){ return new Date().toISOString(); }

function makeTexture(kind){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const base = kind === "mars" ? ["#8d2e1f", "#bf6540", "#3b110d"] : ["#d8d6ce", "#8d8c86", "#f2f0e7"];
  const g = x.createRadialGradient(370,210,40,512,256,520);
  g.addColorStop(0, base[2]); g.addColorStop(.36, base[1]); g.addColorStop(1, base[0]);
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  for(let i=0;i<(kind === "mars" ? 160 : 240);i++){
    const px = Math.random()*c.width, py = Math.random()*c.height;
    const r = Math.random()*(kind === "mars" ? 42 : 28)+4;
    x.globalAlpha = kind === "mars" ? .18 : .22;
    x.fillStyle = kind === "mars" ? (Math.random()>.5?"#401006":"#e08c58") : (Math.random()>.5?"#5d5d5b":"#ffffff");
    x.beginPath(); x.ellipse(px,py,r,r*(.42+Math.random()*.55),Math.random()*Math.PI,0,Math.PI*2); x.fill();
  }
  x.globalAlpha = kind === "mars" ? .22 : .12;
  x.fillStyle = kind === "mars" ? "#ffd2a0" : "#ffffff";
  for(let i=0;i<12;i++) x.fillRect(Math.random()*c.width, Math.random()*c.height, 180+Math.random()*260, 4+Math.random()*18);
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}
function purgeOldPlanets(rootObj){
  const kill=[];
  rootObj?.traverse?.(o=>{
    const n = String(o.name || "");
    if(OLD_PLANET_NAMES.has(n) || /SINGLE_VISIBLE_(MOON|MARS)|ORBITAL_(MOON|MARS)|MOON_TEXTURE|GEOMETRY_SKY.*(MOON|MARS)/i.test(n)) kill.push(o);
  });
  [...new Set(kill)].forEach(o=>o.parent?.remove(o));
  if(rootObj?.userData){ delete rootObj.userData.moon; delete rootObj.userData.mars; }
  return kill.length;
}
function createStarfield(group){
  const geo = new THREE.BufferGeometry(); const pts=[];
  for(let i=0;i<1800;i++){
    const r = 48 + Math.random()*62; const a = Math.random()*Math.PI*2; const y = 8 + Math.random()*33;
    pts.push(Math.cos(a)*r,y,Math.sin(a)*r);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts,3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color:0xffffff, size:.045, sizeAttenuation:true, transparent:true, opacity:.82 }));
  stars.name = "PHASE169_MODULAR_STARFIELD_CLEAN_NO_OVERLAY";
  group.add(stars);
  const lineMat = new THREE.LineBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.22 });
  for(let i=0;i<7;i++){
    const g = new THREE.BufferGeometry(); const p=[]; const bx = -22 + i*7; const bz = -38 - i*1.7;
    for(let j=0;j<4;j++) p.push(bx+j*1.4, 15+Math.sin(j+i)*1.1, bz-j*.8);
    g.setAttribute("position", new THREE.Float32BufferAttribute(p,3));
    const line = new THREE.Line(g,lineMat); line.name = `PHASE169_CONSTELLATION_LINE_${i+1}`; group.add(line);
  }
}
function installSky(){
  const rootObj = sceneRoot(scene); if(!rootObj) return null;
  const removed = purgeOldPlanets(rootObj);
  const old = rootObj.getObjectByName?.(SKY_ROOT); if(old) old.parent?.remove(old);
  const g = new THREE.Group(); g.name = SKY_ROOT; rootObj.add(g);
  createStarfield(g);
  moon = new THREE.Mesh(new THREE.SphereGeometry(1.75,64,40), new THREE.MeshStandardMaterial({ map:makeTexture("moon"), roughness:.82, metalness:.02, emissive:0x151515, emissiveIntensity:.18 }));
  moon.name = "PHASE169_MODULAR_TEXTURED_MOON_LOCKED"; moon.position.set(-4.8,13.8,-25.0); g.add(moon);
  const moonHalo = new THREE.Mesh(new THREE.SphereGeometry(1.93,48,24), new THREE.MeshBasicMaterial({ color:0xdde8ff, transparent:true, opacity:.14, side:THREE.BackSide, depthWrite:false }));
  moonHalo.name = "PHASE169_MODULAR_MOON_ATMOSPHERIC_GLOW"; moon.add(moonHalo);
  mars = new THREE.Mesh(new THREE.SphereGeometry(.62,48,30), new THREE.MeshStandardMaterial({ map:makeTexture("mars"), roughness:.78, metalness:.02, emissive:0x1d0803, emissiveIntensity:.16 }));
  mars.name = "PHASE169_MODULAR_TEXTURED_MARS_ORBITING_MOON_LOCKED"; g.add(mars);
  root = g;
  window.SVR_PHASE169_SKY_AUDIT = { build:LABEL, modularSky:true, oldPlanetsRemoved:removed, oneMoon:true, oneMars:true, moon:moon.name, mars:mars.name, siteTouched:false, checkedAt:nowIso() };
  return window.SVR_PHASE169_SKY_AUDIT;
}
function tickSky(){
  if(!root || !moon || !mars) return;
  const t = performance.now()*.001;
  moon.rotation.y = t*.032;
  const orbit = 2.65;
  mars.position.set(moon.position.x + Math.cos(t*.22)*orbit, moon.position.y + .58 + Math.sin(t*.31)*.32, moon.position.z + Math.sin(t*.22)*orbit);
  mars.rotation.y = t*.18;
}

function purgeBlackOverlays(){
  const selectors = ["#bootFallback","#svrPhaseBadge",".phase-label",".face-overlay",".black-overlay",".vignette",".iris",".fade",".oculus-overlay","[data-overlay='black']","[data-svr-overlay]"];
  let dom = 0;
  for(const sel of selectors){
    document.querySelectorAll(sel).forEach(el=>{
      if(el.id === PANEL_ID) return;
      el.style.display = "none"; el.style.opacity = "0"; el.style.visibility = "hidden"; el.style.pointerEvents = "none"; dom++;
    });
  }
  document.body?.classList?.add("svr-no-black-face-overlay","svr-xr-clean-view","phase169-overlay-purged");
  let mesh = 0;
  scene?.traverse?.(o=>{
    const n = String(o.name || "");
    if(OVERLAY_NAME_TEST.test(n)){
      o.visible = false;
      o.parent?.remove?.(o);
      mesh++;
    }
  });
  window.SVR_PHASE169_OVERLAY_AUDIT = { build:LABEL, domHidden:dom, sceneMeshesRemoved:mesh, xrOverlayPurge:true, note:"In-game black/vignette/face overlays are hidden; hardware FOV edges cannot be removed by code.", checkedAt:nowIso() };
  return window.SVR_PHASE169_OVERLAY_AUDIT;
}

function makePanel(){
  if(!isDesktopPanelAllowed()) return null;
  let el = document.getElementById(PANEL_ID);
  if(el) return el;
  el = document.createElement("div"); el.id = PANEL_ID;
  el.style.cssText = "position:fixed;left:10px;top:10px;z-index:2147483647;width:310px;max-width:calc(100vw - 20px);padding:10px 12px;border:1px solid rgba(127,252,255,.75);border-radius:12px;background:rgba(0,0,0,.78);color:#dff;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre;pointer-events:none;box-shadow:0 0 22px rgba(127,252,255,.16)";
  document.body.appendChild(el); return el;
}
function updateFloorTarget(ev){
  if(!renderer || !camera) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const mx = ev ? ev.clientX : lastMouse.x; const my = ev ? ev.clientY : lastMouse.y;
  lastMouse.x = mx; lastMouse.y = my;
  const ndc = new THREE.Vector2(((mx-rect.left)/rect.width)*2-1, -(((my-rect.top)/rect.height)*2-1));
  const ray = new THREE.Raycaster(); ray.setFromCamera(ndc,camera);
  const plane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const hit = new THREE.Vector3();
  if(ray.ray.intersectPlane(plane,hit)) lastMouse.floor = hit;
}
function cameraAngles(){
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion,"YXZ");
  return { yaw:e.y, pitch:e.x };
}
function copyPosition(){
  if(!camera) return;
  const a = cameraAngles();
  const hit = lastClick || lastMouse.floor;
  const text = `camera=(${fixed(camera.position.x)}, ${fixed(camera.position.y)}, ${fixed(camera.position.z)}) yaw=${deg(a.yaw)} pitch=${deg(a.pitch)} target=${hit?`(${fixed(hit.x)}, 0, ${fixed(hit.z)})`:"none"}`;
  navigator.clipboard?.writeText?.(text);
  window.SVR_PHASE169_LAST_COPIED_POSITION = text;
}
function toggleOverhead(){
  if(!camera || !isDesktopPanelAllowed()) return;
  overhead = !overhead;
  if(overhead){
    savedPose = { pos:camera.position.clone(), quat:camera.quaternion.clone() };
    camera.position.set(0, overheadHeight, 7.5); camera.lookAt(0,0.2,0.75);
  }else if(savedPose){
    camera.position.copy(savedPose.pos); camera.quaternion.copy(savedPose.quat);
  }
}
function setOverheadHeight(delta){
  overheadHeight = THREE.MathUtils.clamp(overheadHeight + delta, 2.2, 22);
  if(overhead && camera){ camera.position.y = overheadHeight; camera.lookAt(0,0.2,0.75); }
}
function updatePanel(){
  if(!panel || !camera) return;
  panel.style.display = panelVisible ? "block" : "none";
  const a = cameraAngles(); const f = lastMouse.floor; const c = lastClick;
  panel.textContent = [
    "SVR POSITION DISPLAY — laptop only",
    `build: ${LABEL}`,
    `camera x:${fixed(camera.position.x)} y:${fixed(camera.position.y)} z:${fixed(camera.position.z)}`,
    `yaw:${deg(a.yaw)} pitch:${deg(a.pitch)}`,
    `mouse floor: ${f?`x:${fixed(f.x)} z:${fixed(f.z)}`:"--"}`,
    `last click:  ${c?`x:${fixed(c.x)} z:${fixed(c.z)}`:"--"}`,
    `overhead: ${overhead?"ON":"OFF"} height:${fixed(overheadHeight,1)}`,
    "keys: P panel | B bird view | PgUp/PgDn height | Shift+C copy"
  ].join("\n");
}
function installPositionTools(){
  if(!isDesktopPanelAllowed()) return false;
  panel = makePanel();
  renderer?.domElement?.addEventListener("pointermove", updateFloorTarget, { passive:true });
  renderer?.domElement?.addEventListener("pointerdown", ev=>{ updateFloorTarget(ev); if(lastMouse.floor) lastClick = lastMouse.floor.clone(); }, { passive:true });
  window.addEventListener("keydown", ev=>{
    if(ev.code === "KeyP") panelVisible = !panelVisible;
    if(ev.code === "KeyB") toggleOverhead();
    if(ev.code === "PageUp") setOverheadHeight(.5);
    if(ev.code === "PageDown") setOverheadHeight(-.5);
    if(ev.shiftKey && ev.code === "KeyC") copyPosition();
  });
  return true;
}
function install(){
  scene = window.__SVR_SCENE__; camera = window.__SVR_CAMERA__; renderer = window.__SVR_RENDERER__;
  if(!scene || !camera || !renderer) return false;
  const sky = installSky();
  const panelOn = installPositionTools();
  const overlay = purgeBlackOverlays();
  window.SVR_PHASE169_DEMO_QA_POSITION_SKY_OVERLAY_MODULE_LOCK = {
    build:LABEL, active:true, modulized:true, indexLoadsModuleOnly:true, laptopPositionPanel:panelOn, overheadView:true, noFlyMode:true, modularMoonMars:true, blackOverlayPurge:true, sky, overlay, siteTouched:false, checkedAt:nowIso()
  };
  window.SVR_RUN_PHASE169_POSITION_AUDIT = ()=>window.SVR_PHASE169_DEMO_QA_POSITION_SKY_OVERLAY_MODULE_LOCK;
  window.SVR_RUN_PHASE169_OVERLAY_AUDIT = ()=>window.SVR_PHASE169_OVERLAY_AUDIT;
  window.SVR_RUN_PHASE169_SKY_AUDIT = ()=>window.SVR_PHASE169_SKY_AUDIT;
  window.SVR_LOCKED_FINAL_BUILD = LABEL; window.SVR_LIVE_BUILD_POINTER = LABEL;
  if(!started){
    started = true;
    setInterval(()=>{ purgeBlackOverlays(); tickSky(); updatePanel(); }, 250);
  }
  return true;
}

[120,300,700,1300,2500,5000,9000].forEach(ms=>setTimeout(install,ms));
install();
