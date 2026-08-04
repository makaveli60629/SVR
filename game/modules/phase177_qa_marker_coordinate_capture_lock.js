import * as THREE from "three";

const LABEL = "PHASE-177-QA-MARKER-COORDINATE-CAPTURE-LOCK";
const ROOT_NAME = "PHASE177_QA_MARKER_COORDINATE_CAPTURE_ROOT";
const PANEL_ID = "svr-phase177-qa-marker-panel";
const TABLE_NAMES = ["PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT", "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED"];

let scene = null;
let camera = null;
let renderer = null;
let root = null;
let panel = null;
let markersVisible = true;
let lastAudit = null;
let started = false;

function isQuest(){ return /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || ""); }
function isAndroid(){ return /Android/i.test(navigator.userAgent || ""); }
function qaAllowed(){
  const params = new URLSearchParams(location.search);
  return (!isQuest() && !isAndroid()) || params.get("qa") === "1" || params.has("markers");
}
function sceneRoot(s){ return s?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || s; }
function fixed(n, d=3){ return Number.isFinite(n) ? Number(n.toFixed(d)) : null; }
function posObj(v){ return v ? { x:fixed(v.x), y:fixed(v.y), z:fixed(v.z) } : null; }
function nowIso(){ return new Date().toISOString(); }
function findByNames(rootObj, names){
  for(const n of names){
    const o = rootObj?.getObjectByName?.(n);
    if(o) return o;
  }
  return null;
}
function boxRecord(obj){
  if(!obj) return null;
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  if(!Number.isFinite(box.max.y)) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center); box.getSize(size);
  return { center, size, min:box.min.clone(), max:box.max.clone() };
}
function getWorldPositionByName(rootObj, name){
  const o = rootObj?.getObjectByName?.(name);
  if(!o) return null;
  const p = new THREE.Vector3();
  o.getWorldPosition(p);
  return p;
}
function makeTextTexture(title, sub){
  const c = document.createElement("canvas"); c.width = 768; c.height = 256;
  const x = c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  x.fillStyle = "rgba(0,0,0,.72)"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(127,252,255,.86)"; x.lineWidth = 8; x.strokeRect(12,12,c.width-24,c.height-24);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#ffffff"; x.font = "900 44px system-ui,Arial"; x.fillText(title,c.width/2,92,c.width-52);
  x.fillStyle = "#ffd98a"; x.font = "800 28px system-ui,Arial"; x.fillText(sub,c.width/2,158,c.width-52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function createMarker(parent, name, p, color, label){
  const g = new THREE.Group(); g.name = `PHASE177_MARKER_${name}`; g.position.copy(p);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.20,.30,48), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.85, side:THREE.DoubleSide, depthWrite:false }));
  ring.name = `${g.name}_FLOOR_RING`; ring.rotation.x = -Math.PI/2; ring.position.y = .025; g.add(ring);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.3,12), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.65 }));
  pole.name = `${g.name}_VERTICAL_REFERENCE`; pole.position.y = .65; g.add(pole);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.08,18,12), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.90 }));
  cap.name = `${g.name}_CAP`; cap.position.y = 1.32; g.add(cap);
  const text = new THREE.Mesh(new THREE.PlaneGeometry(1.6,.54), new THREE.MeshBasicMaterial({ map:makeTextTexture(label, `x ${fixed(p.x,2)} y ${fixed(p.y,2)} z ${fixed(p.z,2)}`), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  text.name = `${g.name}_LABEL`; text.position.y = 1.72; text.rotation.x = -0.12; g.add(text);
  parent.add(g);
  return g;
}
function removeOld(rootObj){
  const old = rootObj?.getObjectByName?.(ROOT_NAME);
  if(old) old.parent?.remove(old);
}
function installMarkers(audit){
  const rootObj = sceneRoot(scene);
  if(!rootObj || !qaAllowed()) return false;
  removeOld(rootObj);
  root = new THREE.Group(); root.name = ROOT_NAME; root.visible = markersVisible; rootObj.add(root);
  const tableCenter = audit.table?.center ? new THREE.Vector3(audit.table.center.x, audit.table.maxY || 0, audit.table.center.z) : null;
  const felt = audit.felt ? new THREE.Vector3(audit.felt.x, audit.felt.y, audit.felt.z) : null;
  const logo = audit.floorLogo ? new THREE.Vector3(audit.floorLogo.x, audit.floorLogo.y, audit.floorLogo.z) : null;
  const moon = audit.moon ? new THREE.Vector3(audit.moon.x, audit.moon.y, audit.moon.z) : null;
  const mars = audit.mars ? new THREE.Vector3(audit.mars.x, audit.mars.y, audit.mars.z) : null;
  if(tableCenter) createMarker(root,"TABLE_CENTER",tableCenter,0x7ffcff,"TABLE CENTER");
  if(felt) createMarker(root,"FELT_CENTER",felt,0x8dffb4,"FELT CENTER");
  if(logo) createMarker(root,"FLOOR_LOGO",logo,0xffd98a,"FLOOR LOGO");
  if(moon) createMarker(root,"MOON_REF",moon,0xdde8ff,"MOON REF");
  if(mars) createMarker(root,"MARS_REF",mars,0xff7b45,"MARS REF");
  return true;
}
function makePanel(){
  if(!qaAllowed()) return null;
  let el = document.getElementById(PANEL_ID);
  if(el) return el;
  el = document.createElement("div");
  el.id = PANEL_ID;
  el.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:2147483647;width:370px;max-width:calc(100vw - 20px);padding:10px 12px;border:1px solid rgba(255,217,138,.75);border-radius:12px;background:rgba(0,0,0,.80);color:#fff;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre;pointer-events:none";
  document.body.appendChild(el);
  return el;
}
function collectAudit(){
  const rootObj = sceneRoot(scene);
  const table = findByNames(rootObj, TABLE_NAMES);
  const tableBox = boxRecord(table);
  const feltPos = getWorldPositionByName(rootObj,"PHASE174_TABLE_FELT_LEATHER_ALIGNMENT_LOCK") || getWorldPositionByName(rootObj,"PHASE172_TABLE_FELT_FIT_LOCK");
  const logoPos = getWorldPositionByName(rootObj,"PHASE174_LOBBY_FLOOR_LOGO_LOCK") || getWorldPositionByName(rootObj,"PHASE172_LOBBY_FLOOR_LOGO_LOCK");
  const moonPos = getWorldPositionByName(rootObj,"PHASE174_REALISTIC_TEXTURED_MOON_DOUBLE_SIZE_HIGH") || getWorldPositionByName(rootObj,"PHASE169_MODULAR_TEXTURED_MOON_LOCKED");
  const marsPos = getWorldPositionByName(rootObj,"PHASE174_REALISTIC_TEXTURED_MARS_HIGH") || getWorldPositionByName(rootObj,"PHASE169_MODULAR_TEXTURED_MARS_ORBITING_MOON_LOCKED");
  const teleport = window.SVR_PHASE170_TELEPORT_AIM_COMMIT_LOCK || null;
  const phase176 = window.SVR_PHASE176_LIVE_QA_AUTHORITY_LOCK || null;
  return {
    build: LABEL,
    active: true,
    gameOnly: true,
    siteTouched: false,
    markersAllowed: qaAllowed(),
    markersVisible,
    table: tableBox ? { name:table.name, center:posObj(tableBox.center), size:posObj(tableBox.size), minY:fixed(tableBox.min.y), maxY:fixed(tableBox.max.y) } : null,
    felt: posObj(feltPos),
    floorLogo: posObj(logoPos),
    moon: posObj(moonPos),
    mars: posObj(marsPos),
    teleportFloorLocked: !!teleport?.floorLocked,
    teleportStable: !!teleport?.stableHandTeleport,
    liveQaActive: !!phase176,
    checkedAt: nowIso()
  };
}
function updatePanel(){
  if(!panel || !lastAudit) return;
  panel.style.display = markersVisible ? "block" : "none";
  const lines = [
    "SVR QA MARKER COORDINATE CAPTURE",
    `build: ${LABEL}`,
    `markers: ${markersVisible ? "ON" : "OFF"}`,
    `table: ${lastAudit.table ? `x ${lastAudit.table.center.x} y ${lastAudit.table.maxY} z ${lastAudit.table.center.z}` : "missing"}`,
    `felt:  ${lastAudit.felt ? `x ${lastAudit.felt.x} y ${lastAudit.felt.y} z ${lastAudit.felt.z}` : "missing"}`,
    `logo:  ${lastAudit.floorLogo ? `x ${lastAudit.floorLogo.x} y ${lastAudit.floorLogo.y} z ${lastAudit.floorLogo.z}` : "missing"}`,
    `moon:  ${lastAudit.moon ? `x ${lastAudit.moon.x} y ${lastAudit.moon.y} z ${lastAudit.moon.z}` : "missing"}`,
    `mars:  ${lastAudit.mars ? `x ${lastAudit.mars.x} y ${lastAudit.mars.y} z ${lastAudit.mars.z}` : "missing"}`,
    `teleport: floorLock=${lastAudit.teleportFloorLocked} stable=${lastAudit.teleportStable}`,
    "keys: M markers | Shift+M copy audit"
  ];
  panel.textContent = lines.join("\n");
}
function runAudit(){
  if(!scene) return null;
  lastAudit = collectAudit();
  installMarkers(lastAudit);
  if(panel) updatePanel();
  if(root) root.visible = markersVisible && qaAllowed();
  window.SVR_PHASE177_QA_MARKER_COORDINATE_CAPTURE_LOCK = lastAudit;
  window.SVR_RUN_PHASE177_QA_MARKER_AUDIT = () => window.SVR_PHASE177_QA_MARKER_COORDINATE_CAPTURE_LOCK || lastAudit;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  return lastAudit;
}
function install(){
  scene = window.__SVR_SCENE__;
  camera = window.__SVR_CAMERA__;
  renderer = window.__SVR_RENDERER__;
  if(!scene || !camera || !renderer) return false;
  panel = makePanel();
  if(!started){
    started = true;
    window.addEventListener("keydown", ev => {
      if(ev.code === "KeyM" && !ev.shiftKey){ markersVisible = !markersVisible; if(root) root.visible = markersVisible; runAudit(); }
      if(ev.code === "KeyM" && ev.shiftKey){ navigator.clipboard?.writeText?.(JSON.stringify(runAudit(), null, 2)); }
    });
    setInterval(runAudit, 5000);
  }
  runAudit();
  return true;
}

[300,900,1600,3000,6000,10000].forEach(ms => setTimeout(install, ms));
install();
