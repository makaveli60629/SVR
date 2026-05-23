import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist, aimPoint } from "./gestures.js";
import { triggerValue, nextCameraForwardPosition, shouldSnapTurn } from "./locomotion_lock.js";

const PHASE = "PHASE-106-WORLD-SHIFT-TELEPORT-LOCK";

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let worldShiftX = 0;
  let worldShiftZ = 0;

  const head = new THREE.Vector3();
  const controllerOrigin = new THREE.Vector3();
  const controllerDir = new THREE.Vector3();
  const smoothedTarget = new THREE.Vector3(0, 0, CONFIG.SPAWN_Z);
  const queuedTarget = new THREE.Vector3();

  let mode = false, active = null, activeMode = "hand";
  let cooldownUntil = 0, lastTP = 0, pinchHoldStart = 0, triggerHoldStart = 0, lastAimValid = false, snapCooldownUntil = 0;
  let lastLeftFist = false, lastRightFist = false, committingTeleport = false, queuedTeleport = false, queuedAt = 0, queuedFrames = 0;
  let leftHandRef = null, rightHandRef = null, leftControllerRef = null, rightControllerRef = null;

  function applyReferenceSpace(){
    // Phase 106: DO NOT call renderer.xr.setReferenceSpace for movement/teleport.
    // That reference-space jump is the likely Quest freeze source.
    return true;
  }
  function canShift(obj){
    if (!obj || obj === camera) return false;
    if (obj.userData?.svrNoWorldShift) return false;
    if (obj.type && String(obj.type).includes('Camera')) return false;
    if (obj.parent && obj.parent.userData?.svrNoWorldShift) return false;
    return obj.parent === scene;
  }
  function shiftWorld(dx, dz){
    if (!dx && !dz) return;
    for (const child of [...scene.children]){
      if (!canShift(child)) continue;
      child.position.x -= dx;
      child.position.z -= dz;
    }
    worldShiftX += dx;
    worldShiftZ += dz;
    window.SVR_WORLD_SHIFT_STATE = { phase: PHASE, x: worldShiftX, z: worldShiftZ, lastDx: dx, lastDz: dz };
  }
  function setPlayerPose(x, y, z){
    const nx = THREE.MathUtils.clamp(x, -roomClamp * 1.08, roomClamp * 1.08);
    const nz = THREE.MathUtils.clamp(z, -roomClamp * 1.08, roomClamp * 1.08);
    const dx = nx - playerX, dz = nz - playerZ;
    playerX = nx; playerY = y; playerZ = nz;
    if (renderer?.xr?.isPresenting) shiftWorld(dx, dz); else { camera.position.set(nx, 1.6 + y, nz); }
    return true;
  }
  function setPlayerXZ(x, z){
    const nx = THREE.MathUtils.clamp(x, -roomClamp * 1.08, roomClamp * 1.08);
    const nz = THREE.MathUtils.clamp(z, -roomClamp * 1.08, roomClamp * 1.08);
    const dx = nx - playerX, dz = nz - playerZ;
    playerX = nx; playerZ = nz;
    if (renderer?.xr?.isPresenting) shiftWorld(dx, dz); else { camera.position.x = nx; camera.position.z = nz; }
    return true;
  }
  function setPlayerYaw(nextYaw){ playerYaw = nextYaw; return true; }
  function getPlayerPose(){ return { x: playerX, y: playerY, z: playerZ, yaw: playerYaw, worldShiftX, worldShiftZ }; }
  function isEnabled(){ return mode || queuedTeleport || committingTeleport; }

  const pointer = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.POINTER_SIZE, CONFIG.POINTER_SIZE), new THREE.MeshBasicMaterial({ transparent:false, depthWrite:true, depthTest:true, polygonOffset:true, polygonOffsetFactor:-4, side:THREE.DoubleSide, color:0xffffff, toneMapped:false }));
  pointer.rotation.x = -Math.PI / 2; pointer.position.y = .032; pointer.visible = false; pointer.renderOrder = 92; scene.add(pointer);
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER, CONFIG.RING_OUTER, 72), new THREE.MeshBasicMaterial({ color:0xb48cff, side:THREE.DoubleSide, transparent:false, depthWrite:true, depthTest:true, toneMapped:false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .028; ring.visible = false; ring.renderOrder = 91; scene.add(ring);
  const markerGlow = new THREE.PointLight(0xb48cff, 0, 2.4, 2.0); markerGlow.position.y = .4; scene.add(markerGlow);

  function makeFireGroup(){ const g = new THREE.Group(); g.userData.svrNoWorldShift = true; g.visible = false; const core = new THREE.Mesh(new THREE.SphereGeometry(.052, 12, 8), new THREE.MeshBasicMaterial({ color:0x9b4dff, transparent:false, depthWrite:true, depthTest:true, toneMapped:false })); core.name="purple_fire_core"; core.userData.svrNoWorldShift = true; g.add(core); const light = new THREE.PointLight(0x9b4dff,0,1.5,2); light.name="purple_fire_light"; light.userData.svrNoWorldShift = true; g.add(light); scene.add(g); return g; }
  const leftFire = makeFireGroup(), rightFire = makeFireGroup();
  function updateFireGroup(group, hand, on, t){ const wrist = hand?.joints?.wrist; if(!wrist||!on){group.visible=false;return;} wrist.updateWorldMatrix?.(true,false); wrist.getWorldPosition(group.position); group.position.y += .015; group.visible=true; for(const child of group.children){ if(child.name==='purple_fire_light') child.intensity=.82+Math.sin(t*4)*.12; if(child.name==='purple_fire_core') child.scale.setScalar(1+Math.sin(t*5)*.08); } }
  function setTeleportVisual(on){ markerGlow.intensity = on ? 1.05 : 0; window.SVR_TELEPORT_FIRE_STATE = { phase: PHASE, teleportOn:Boolean(on), activeMode }; }
  function clampTarget(p){ return new THREE.Vector3(THREE.MathUtils.clamp(p.x, -roomClamp, roomClamp), 0, THREE.MathUtils.clamp(p.z, -roomClamp, roomClamp)); }
  function resetTeleportVisuals(){ pointer.visible=false; ring.visible=false; setTeleportVisual(false); lastAimValid=false; pinchHoldStart=0; triggerHoldStart=0; }
  function queueTeleport(target){ if(committingTeleport||queuedTeleport||performance.now()-lastTP<500) return false; if(!target) return false; queuedTarget.copy(target); queuedTeleport=true; queuedAt=performance.now(); queuedFrames=0; mode=false; active=null; resetTeleportVisuals(); cooldownUntil=performance.now()+700; window.SVR_TELEPORT_COMMIT={phase:PHASE,queued:true,method:'world-shift',at:new Date().toISOString()}; return true; }
  function processQueuedTeleport(){ if(!queuedTeleport||committingTeleport) return; queuedFrames++; if(queuedFrames<2||performance.now()-queuedAt<60) return; committingTeleport=true; queuedTeleport=false; try{ const xrCam = renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera; xrCam.getWorldPosition(head); let dx = queuedTarget.x - head.x, dz = queuedTarget.z - head.z; const dist=Math.hypot(dx,dz); if(dist<.12){ lastTP=performance.now(); cooldownUntil=performance.now()+500; return; } const maxStep=2.25; if(dist>maxStep){ const s=maxStep/dist; dx*=s; dz*=s; } setPlayerXZ(playerX + dx, playerZ + dz); lastTP=performance.now(); cooldownUntil=performance.now()+650; window.SVR_TELEPORT_COMMIT={phase:PHASE,ok:true,method:'world-shift',dx,dz,dist:Math.hypot(dx,dz),at:new Date().toISOString()}; }catch(err){ log('[teleport] world shift blink failed',err?.message||err); window.SVR_TELEPORT_COMMIT={phase:PHASE,ok:false,error:err?.message||String(err)}; } finally { resetTeleportVisuals(); setTimeout(()=>{committingTeleport=false;},320); } }
  function movePlayerFromControllers(dt){ if(!renderer?.xr?.isPresenting||committingTeleport||queuedTeleport||mode) return; const snap=shouldSnapTurn(leftControllerRef,rightControllerRef,performance.now()>snapCooldownUntil); if(snap){ playerYaw += snap; snapCooldownUntil=performance.now()+360; } const next=nextCameraForwardPosition({renderer,camera,leftControllerRef,rightControllerRef,playerX,playerZ,roomClamp,dt,speed:1.35}); if(next.moved) setPlayerXZ(next.x,next.z); }
  function controllerAimPoint(proxy){ const controller=proxy?.userData?.controller; if(!controller) return null; controller.updateWorldMatrix?.(true,false); controller.getWorldPosition(controllerOrigin); controller.getWorldDirection(controllerDir); if(controllerDir.y>-.12) controllerDir.y=-.12; controllerDir.normalize(); const t=controllerOrigin.y/(-controllerDir.y); if(!isFinite(t)||t<.12) return null; return new THREE.Vector3(controllerOrigin.x+controllerDir.x*Math.min(t,24),0,controllerOrigin.z+controllerDir.z*Math.min(t,24)); }
  function chooseController(){ return rightControllerRef?.joints ? rightControllerRef : leftControllerRef?.joints ? leftControllerRef : null; }
  function chooseHand(){ return rightHandRef?.joints ? rightHandRef : leftHandRef?.joints ? leftHandRef : null; }
  function turnOnTeleport(nextActive,nextMode){ if(queuedTeleport||committingTeleport) return; mode=true; active=nextActive; activeMode=nextMode; cooldownUntil=performance.now()+140; pinchHoldStart=0; triggerHoldStart=0; }
  function toggleMode(preferred='right'){ if(queuedTeleport||committingTeleport) return false; if(mode){ mode=false; active=null; resetTeleportVisuals(); return false; } const ctrl=preferred==='left'?(leftControllerRef?.joints?leftControllerRef:chooseController()):(rightControllerRef?.joints?rightControllerRef:chooseController()); const hand=preferred==='left'?(leftHandRef?.joints?leftHandRef:chooseHand()):(rightHandRef?.joints?rightHandRef:chooseHand()); if(ctrl) turnOnTeleport(ctrl,'controller'); else if(hand) turnOnTeleport(hand,'hand'); return mode; }
  async function onSessionStart(){ const session=renderer.xr.getSession(); if(!session) return; baseRefSpace=await session.requestReferenceSpace('local-floor'); playerYaw=0; playerX=CONFIG.SPAWN_X; playerY=0; playerZ=CONFIG.SPAWN_Z; mode=false; active=null; queuedTeleport=false; committingTeleport=false; resetTeleportVisuals(); window.SVR_TELEPORT_COMMIT={phase:PHASE,method:'world-shift',session:'started'}; }
  function setLogoTexture(tex){ if(tex){ tex.anisotropy=2; pointer.material.map=tex; pointer.material.needsUpdate=true; } }
  function update({dt=.016,leftHand,rightHand,leftController,rightController,statusCb=()=>{},modeCb=()=>{}}){ const now=performance.now(); leftHandRef=leftHand; rightHandRef=rightHand; leftControllerRef=leftController; rightControllerRef=rightController; processQueuedTeleport(); movePlayerFromControllers(Math.min(dt,.03)); const leftFist=!!leftHandRef?.joints&&isFist(leftHandRef), rightFist=!!rightHandRef?.joints&&isFist(rightHandRef); if(!queuedTeleport&&!committingTeleport){ if(leftFist&&!lastLeftFist&&now>cooldownUntil){ mode&&active===leftHandRef?(mode=false,active=null,resetTeleportVisuals()):turnOnTeleport(leftHandRef,'hand'); } if(rightFist&&!lastRightFist&&now>cooldownUntil){ mode&&active===rightHandRef?(mode=false,active=null,resetTeleportVisuals()):turnOnTeleport(rightHandRef,'hand'); } } lastLeftFist=leftFist; lastRightFist=rightFist; const leftTrigger=triggerValue(leftControllerRef), rightTrigger=triggerValue(rightControllerRef); if(!mode&&!queuedTeleport&&!committingTeleport&&now>cooldownUntil){ if(rightTrigger>.30&&rightControllerRef?.joints) turnOnTeleport(rightControllerRef,'controller'); else if(leftTrigger>.30&&leftControllerRef?.joints) turnOnTeleport(leftControllerRef,'controller'); } if(mode&&activeMode==='controller'&&!active?.joints) active=chooseController()||chooseHand(); if(mode&&activeMode==='hand'&&!active?.joints) active=chooseHand()||chooseController(); if(active===leftControllerRef||active===rightControllerRef) activeMode='controller'; if(active===leftHandRef||active===rightHandRef) activeMode='hand'; const t=now*.001; updateFireGroup(leftFire,leftHandRef,mode&&activeMode==='hand'&&active===leftHandRef,t); updateFireGroup(rightFire,rightHandRef,mode&&activeMode==='hand'&&active===rightHandRef,t); if(queuedTeleport||committingTeleport){ resetTeleportVisuals(); statusCb('World-shift teleport committing…'); modeCb('No XR reference-space jump'); return; } if(!leftHandRef?.joints&&!rightHandRef?.joints&&!leftControllerRef?.joints&&!rightControllerRef?.joints){ resetTeleportVisuals(); statusCb('Waiting for hands or controllers…'); modeCb('Input: not tracked'); return; } if(!mode||!active){ resetTeleportVisuals(); statusCb((leftControllerRef||rightControllerRef)?'Move locked • hold trigger/A to aim teleport':'Teleport off • fist turns purple fire on'); modeCb('World-shift locomotion'); return; } setTeleportVisual(true); const aim=activeMode==='controller'?controllerAimPoint(active):aimPoint(active); if(!aim){ pointer.visible=false; ring.visible=false; statusCb(activeMode==='controller'?'Aim down, then release trigger/A':'Purple fire on • aim down, release pinch'); modeCb(activeMode==='controller'?'Controller teleport armed':'Hand teleport armed'); return; } const target=clampTarget(aim); if(!lastAimValid) smoothedTarget.copy(target); else smoothedTarget.lerp(target,.18); lastAimValid=true; pointer.visible=true; ring.visible=true; pointer.position.copy(smoothedTarget).setY(.032); ring.position.copy(smoothedTarget).setY(.028); markerGlow.position.copy(smoothedTarget).setY(.34); if(activeMode==='controller'){ const trigger=triggerValue(active), was=!!active.userData._wasTrigger; if(trigger>.22&&!was) triggerHoldStart=now; const held=triggerHoldStart?now-triggerHoldStart:0; if(was&&trigger<=.18&&held>120) queueTeleport(smoothedTarget); if(trigger<=.18) triggerHoldStart=0; active.userData._wasTrigger=trigger>.22; statusCb('Release trigger/A for world-shift teleport'); modeCb('Controller teleport armed'); return; } const pinch=isPinching(active), wasPinching=!!active.userData._wasPinching; if(pinch&&!wasPinching) pinchHoldStart=now; const held=pinchHoldStart?now-pinchHoldStart:0; if(wasPinching&&!pinch&&held>120) queueTeleport(smoothedTarget); if(!pinch) pinchHoldStart=0; active.userData._wasPinching=pinch; statusCb('Purple fire on • release pinch for world-shift teleport'); modeCb('Hand teleport armed'); }
  return { onSessionStart,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled,getState:()=>({mode:mode||queuedTeleport||committingTeleport,activeHand:active===rightHandRef||active===rightControllerRef?'right':active===leftHandRef||active===leftControllerRef?'left':'none',activeMode}) };
}
