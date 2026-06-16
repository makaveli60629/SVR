import * as THREE from "three";

const LABEL = "PHASE-101U-QUEST-CONTROLLER-PORTAL-TELEPORT-QA-LOCK";
const ROOT = "PHASE101U_QUEST_CONTROLLER_PORTAL_QA_ROOT";

window.SVR_PHASE101U_QUEST_QA = {
  build: LABEL,
  active: true,
  purpose: "Quest/controller portal selection and teleport smoke QA without changing core locomotion.",
  lateLoadSafe: true,
  bootTouched: false,
  siteTouched: false,
  checkedAt: new Date().toISOString(),
  selections: []
};

function setStatus(message){
  const status = document.getElementById("status");
  if(status) status.textContent = message;
  window.SVR_PHASE101U_QUEST_QA.lastStatus = message;
  window.SVR_PHASE101U_QUEST_QA.checkedAt = new Date().toISOString();
}
function makeBeamMaterial(color = 0x7ffcff, opacity = 0.42){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
}
function makeControllerBeam(name, color){
  const group = new THREE.Group();
  group.name = name;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 5.2, 12), makeBeamMaterial(color, 0.34));
  beam.name = `${name}_BEAM`;
  beam.rotation.x = -Math.PI / 2;
  beam.position.z = -2.6;
  group.add(beam);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 12), makeBeamMaterial(color, 0.78));
  tip.name = `${name}_TIP`;
  tip.position.z = -5.2;
  group.add(tip);
  group.visible = false;
  return group;
}
function portalObjects(scene){
  const list = [];
  scene.traverse((obj) => {
    if(obj?.userData?.portalKey || obj?.userData?.clickable) list.push(obj);
  });
  return list;
}
function getControllerForward(controller){
  const forward = new THREE.Vector3(0,0,-1);
  forward.applyQuaternion(controller.quaternion).normalize();
  return forward;
}
function selectPortalFromObject(obj, source){
  if(!obj?.userData?.portalKey) return null;
  const payload = {
    key: obj.userData.portalKey,
    label: obj.userData.portalLabel || obj.userData.portalKey,
    target: obj.userData.portalTarget || "pending",
    source,
    build: LABEL,
    selectedAt: new Date().toISOString()
  };
  window.SVR_PHASE101U_LAST_CONTROLLER_PORTAL = payload;
  window.SVR_PHASE101U_QUEST_QA.selections.push(payload);
  window.SVR_PHASE101U_QUEST_QA.selections = window.SVR_PHASE101U_QUEST_QA.selections.slice(-20);
  setStatus(`${payload.label} selected by ${source} • target: ${payload.target}`);
  try { window.dispatchEvent(new CustomEvent("svr-portal-selected", { detail: payload })); } catch {}
  return payload;
}
function addPortalSelectFallbacks(){
  if(window.__SVR_PHASE101U_KEYS_INSTALLED__) return;
  window.__SVR_PHASE101U_KEYS_INSTALLED__ = true;
  const map = {
    KeyP: { portalKey:"pga", portalLabel:"PGA", portalTarget:"driving-range" },
    KeyW: { portalKey:"wellness", portalLabel:"WELLNESS", portalTarget:"meditation-room" },
    KeyS: { portalKey:"store", portalLabel:"STORE", portalTarget:"store-preview" },
    KeyC: { portalKey:"scorpion", portalLabel:"SCORPION", portalTarget:"private-room" }
  };
  window.addEventListener("keydown", (event) => {
    if(!map[event.code]) return;
    selectPortalFromObject({ userData: map[event.code] }, "keyboard-fallback");
  });
}
function installQuestControllers(scene, renderer){
  if(!renderer?.xr || window.__SVR_PHASE101U_CONTROLLER_INSTALLED__) return false;
  window.__SVR_PHASE101U_CONTROLLER_INSTALLED__ = true;
  const root = scene.getObjectByName(ROOT) || new THREE.Group();
  root.name = ROOT;
  if(!root.parent) scene.add(root);

  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  const controllers = [];
  for(let i=0;i<2;i++){
    const controller = renderer.xr.getController(i);
    controller.name = `PHASE101U_XR_CONTROLLER_${i}`;
    const beam = makeControllerBeam(`PHASE101U_CONTROLLER_${i}_PORTAL_RAY`, i === 0 ? 0xb55cff : 0x7ffcff);
    controller.add(beam);
    root.add(controller);
    controllers.push({ controller, beam, index:i, lastHit:null });

    controller.addEventListener("connected", () => {
      beam.visible = true;
      window.SVR_PHASE101U_QUEST_QA.controllersConnected = (window.SVR_PHASE101U_QUEST_QA.controllersConnected || 0) + 1;
      runQa();
    });
    controller.addEventListener("disconnected", () => {
      beam.visible = false;
      runQa();
    });
    controller.addEventListener("selectstart", () => {
      const hit = raycastPortal(controller, `controller-${i}`);
      if(hit) selectPortalFromObject(hit.object, `controller-${i}-selectstart`);
    });
    controller.addEventListener("squeezestart", () => {
      const hit = raycastPortal(controller, `controller-${i}`);
      if(hit) selectPortalFromObject(hit.object, `controller-${i}-squeezestart`);
    });
  }

  function raycastPortal(controller, source){
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0,0,-1).applyMatrix4(tempMatrix).normalize();
    const hits = raycaster.intersectObjects(portalObjects(scene), true);
    const hit = hits.find((item) => item.object?.userData?.portalKey);
    window.SVR_PHASE101U_QUEST_QA.lastRaycast = {
      source,
      hit: !!hit,
      key: hit?.object?.userData?.portalKey || null,
      distance: hit?.distance || null,
      checkedAt: new Date().toISOString()
    };
    return hit || null;
  }

  function frameProbe(){
    controllers.forEach((entry) => {
      if(!entry.controller.visible && !renderer.xr.isPresenting) return;
      const hit = raycastPortal(entry.controller, `controller-${entry.index}-frame`);
      entry.beam.visible = !!renderer.xr.isPresenting;
      if(hit){
        entry.beam.scale.z = Math.max(0.2, Math.min(1, hit.distance / 5.2));
        entry.lastHit = hit.object.userData.portalKey;
      }else{
        entry.beam.scale.z = 1;
        entry.lastHit = null;
      }
    });
  }

  const previousTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt) => {
    previousTick?.(dt);
    frameProbe();
  };

  window.SVR_PHASE101U_QUEST_QA.controllersInstalled = true;
  return true;
}
function runTeleportQa(){
  const qa = window.SVR_PHASE101U_QUEST_QA;
  qa.teleport = {
    movementModule: !!window.SVR_PHASE101J_LOCOMOTION || !!window.SVR_PHASE101J_SMOKE,
    rayForwardLock: !!window.SVR_PHASE101J_SMOKE?.rayForwardLock || !!window.SVR_PHASE101J_LOCOMOTION?.teleportRayForwardLock,
    headForwardMove: !!window.SVR_PHASE101J_SMOKE?.headForwardMove || !!window.SVR_PHASE101J_MOVE_VECTOR,
    lastForwardLock: window.SVR_PHASE101J_AIM_FORWARD_LOCK || null,
    lastTeleport: window.SVR_PHASE101J_LAST_TELEPORT || null,
    checkedAt: new Date().toISOString()
  };
  return qa.teleport;
}
function runQa(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const checks = {
    scene: !!scene,
    renderer: !!renderer,
    xr: !!renderer?.xr,
    phase101t: !!window.SVR_PHASE101T_LOBBY_QA?.active,
    portalObjects: scene ? portalObjects(scene).filter((o) => o.userData.portalKey).length >= 4 : false,
    controllerInstall: !!window.__SVR_PHASE101U_CONTROLLER_INSTALLED__,
    teleportQa: true,
    bootReleased: !!window.SVR_GAME_READY || !!window.__SVR_GAME_READY__
  };
  const teleport = runTeleportQa();
  checks.teleportModule = teleport.movementModule;
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
  window.SVR_PHASE101U_QUEST_QA.checks = checks;
  window.SVR_PHASE101U_QUEST_QA.failed = failed;
  window.SVR_PHASE101U_QUEST_QA.status = failed.length ? "needs-review" : "ready";
  window.SVR_PHASE101U_QUEST_QA.checkedAt = new Date().toISOString();
  return window.SVR_PHASE101U_QUEST_QA;
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);
  addPortalSelectFallbacks();
  installQuestControllers(scene, renderer);
  runQa();
  setStatus("Phase 101U Quest controller portal QA armed");
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_RELEASE_BOOT?.("phase101u-quest-controller-portal-qa-ready");
  return true;
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if(install() || tries > 80) clearInterval(timer);
}, 250);
setTimeout(install, 2500);
setTimeout(install, 5500);
setTimeout(install, 9500);
window.SVR_RUN_PHASE101U_QA = runQa;
