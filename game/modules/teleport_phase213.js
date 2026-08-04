import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist } from "./gestures.js";
import { constrainLobbyBounds } from "./phase178_bounds.js";

const LABEL = "UPDATE-3.0-PHASE-213-STAIR-INPUT-BEAM-FACE-FINAL-LOCK";
const UP = new THREE.Vector3(0,1,0);

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let mode = false;
  let active = null;
  let activeMode = "controller";
  let lastTP = 0;
  let triggerHoldStart = 0;
  let pinchHoldStart = 0;
  let fistHoldStart = 0;
  let snapCooldownUntil = 0;
  let wallBlocks = 0;
  let leftHandRef = null, rightHandRef = null, leftControllerRef = null, rightControllerRef = null;

  const vHead = new THREE.Vector3();
  const vHeadDir = new THREE.Vector3();
  const vOrigin = new THREE.Vector3();
  const vDir = new THREE.Vector3();
  const vTarget = new THREE.Vector3(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z);
  const vSmooth = new THREE.Vector3(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z);
  const vWrist = new THREE.Vector3();
  const vIndex = new THREE.Vector3();
  const qWorld = new THREE.Quaternion();

  function floorHeightAt(x,z){
    const f = window.SVR_PHASE213_FLOOR_HEIGHT || window.SVR_PHASE212_FLOOR_HEIGHT || window.SVR_PHASE211_FLOOR_HEIGHT || window.SVR_PHASE209_FLOOR_HEIGHT;
    if (typeof f === "function"){
      const y = Number(f(x,z));
      if (Number.isFinite(y)) return y;
    }
    const ax = Math.abs(x);
    if (ax >= 10.6 && ax <= 17.8 && z <= 8.9 && z >= 0.35){
      const t = THREE.MathUtils.clamp((8.25 - z) / 7.45, 0, 1);
      return THREE.MathUtils.clamp(t * 3.42, 0, 3.42);
    }
    if (z <= -10.75 && z >= -15.5 && ax <= 18.6) return 3.42;
    if (ax >= 15.0 && ax <= 18.65 && z <= 6.8 && z >= -12.6) return 3.42;
    return 0;
  }
  function solidXZ(x,z){
    const p = constrainLobbyBounds(x,z);
    if (p.blocked) wallBlocks++;
    return p;
  }
  function applyReferenceSpace(){
    if (!baseRefSpace || !renderer?.xr?.isPresenting) return false;
    try{
      const halfYaw = -playerYaw * 0.5;
      const xform = new XRRigidTransform(
        { x:-playerX, y:-playerY, z:-playerZ },
        { x:0, y:Math.sin(halfYaw), z:0, w:Math.cos(halfYaw) }
      );
      renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xform));
      return true;
    }catch(e){ log("[Phase213] reference space failed", e?.message || e); return false; }
  }
  function setPlayerPose(x,y,z){ const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; playerY=Number.isFinite(y)?y:floorHeightAt(p.x,p.z); return applyReferenceSpace(); }
  function setPlayerXZ(x,z){ const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; playerY=floorHeightAt(playerX,playerZ); return applyReferenceSpace(); }
  function moveByWorldDelta(dx,dz){
    const c = Math.cos(playerYaw), s = Math.sin(playerYaw);
    const localX = dx * c - dz * s;
    const localZ = dx * s + dz * c;
    return setPlayerXZ(playerX + localX, playerZ + localZ);
  }
  function setPlayerYaw(nextYaw){ playerYaw=nextYaw; return applyReferenceSpace(); }
  function getPlayerPose(){ return { x:playerX, y:playerY, z:playerZ, yaw:playerYaw, wallBlocks }; }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE * 1.22, CONFIG.POINTER_SIZE * 1.22),
    new THREE.MeshBasicMaterial({ transparent:true, alphaTest:0.20, depthWrite:false, depthTest:false, side:THREE.DoubleSide, opacity:0.98, color:0xffffff })
  );
  pointer.name = "PHASE213_TELEPORT_SVR_LOGO_TARGET";
  pointer.rotation.x = -Math.PI/2;
  pointer.renderOrder = 2000;
  pointer.visible = false;
  scene.add(pointer);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.72,1.02,96), new THREE.MeshBasicMaterial({ color:0xb55cff, transparent:true, opacity:0.95, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false }));
  ring.name = "PHASE213_TELEPORT_TARGET_RING";
  ring.rotation.x = -Math.PI/2;
  ring.renderOrder = 1999;
  ring.visible = false;
  scene.add(ring);

  const beamGeo = new THREE.BufferGeometry();
  const beamMat = new THREE.PointsMaterial({ color:0x8fffff, size:0.105, sizeAttenuation:true, transparent:true, opacity:0.96, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending });
  const beam = new THREE.Points(beamGeo, beamMat);
  beam.name = "PHASE213_PARTICLE_BEAM_TELEPORT_RAY";
  beam.frustumCulled = false;
  beam.renderOrder = 2001;
  beam.visible = false;
  scene.add(beam);

  const glow = new THREE.PointLight(0x8fffff,0,7.5,1.8);
  scene.add(glow);
  const handGlowMat = new THREE.MeshBasicMaterial({ color:0x8fffff, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  const handGlow = new THREE.Mesh(new THREE.SphereGeometry(0.14,20,12), handGlowMat);
  handGlow.name = "PHASE213_HAND_TELEPORT_GLOW";
  handGlow.visible = false;
  scene.add(handGlow);

  function setLogoTexture(tex){ if(tex){ tex.anisotropy=1; pointer.material.map=tex; pointer.material.needsUpdate=true; } }
  function hideVisuals(){ pointer.visible=false; ring.visible=false; beam.visible=false; glow.intensity=0; handGlow.visible=false; handGlowMat.opacity=0; }
  function showVisuals(target){ pointer.visible=true; ring.visible=true; pointer.position.copy(target).setY(target.y+0.025); ring.position.copy(target).setY(target.y+0.018); glow.position.copy(target).setY(target.y+0.38); glow.intensity=2.7; }
  function updateBeam(origin,target){
    if(!origin || !target){ beam.visible=false; return; }
    const pts=[];
    const start=origin.clone();
    const end=target.clone().setY(target.y+0.08);
    const mid=start.clone().lerp(end,0.5); mid.y += Math.min(2.4, Math.max(0.75, start.distanceTo(end)*0.13));
    for(let i=0;i<44;i++){
      const u=i/43;
      const a=start.clone().lerp(mid,u);
      const b=mid.clone().lerp(end,u);
      const p=a.lerp(b,u);
      p.x += Math.sin(u*44.0 + performance.now()*0.012)*0.018;
      p.z += Math.cos(u*39.0 + performance.now()*0.010)*0.018;
      pts.push(p);
    }
    beamGeo.setFromPoints(pts);
    beam.visible=true;
  }
  function clampTarget(x,z){ const p=solidXZ(x,z); return vTarget.set(p.x,floorHeightAt(p.x,p.z),p.z); }

  function controllerGamepad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
  function btn(gp,i){ const b=gp?.buttons?.[i]; return Math.max(b?.value||0,b?.pressed?1:0); }
  function triggerValue(proxy){ const gp=controllerGamepad(proxy); return Math.max(btn(gp,0),btn(gp,1),btn(gp,2),btn(gp,3),btn(gp,4),btn(gp,5)); }
  function stick(gp, side="right"){
    if(!gp?.axes?.length) return {x:0,y:0};
    let x=0,y=0;
    if(side==="right" && gp.axes.length>=4){ x=gp.axes[2]||0; y=gp.axes[3]||0; if(Math.abs(x)<0.01 && Math.abs(y)<0.01){ x=gp.axes[0]||0; y=gp.axes[1]||0; } }
    else { x=gp.axes[0]||0; y=gp.axes[1]||0; }
    if(Math.abs(x)<0.18) x=0; if(Math.abs(y)<0.18) y=0;
    return {x,y};
  }
  function headForward(){
    const xrCam = renderer.xr.getCamera(camera) || camera;
    const source = xrCam?.cameras?.[0] || xrCam;
    source.getWorldDirection(vHeadDir);
    vHeadDir.y=0;
    if(vHeadDir.lengthSq()<1e-5) vHeadDir.set(0,0,-1);
    return vHeadDir.normalize();
  }
  function moveControllers(dt){
    const gpR=controllerGamepad(rightControllerRef), gpL=controllerGamepad(leftControllerRef);
    const r=stick(gpR,"right"), l=stick(gpL,"left");
    const now=performance.now();
    if(Math.abs(r.x)>0.76 && now>snapCooldownUntil){ playerYaw += Math.sign(r.x)*(Math.PI/4); applyReferenceSpace(); snapCooldownUntil=now+300; }
    const y=Math.abs(r.y)>0.14?r.y:l.y;
    if(Math.abs(y)<0.14) return;
    const f=headForward().clone();
    const move=-y;
    const speed = 3.55;
    moveByWorldDelta(f.x*move*speed*dt, f.z*move*speed*dt);
    window.SVR_PHASE213_STICK_MOVE = { build:LABEL, y:Number(y.toFixed(3)), forward:{x:Number(f.x.toFixed(3)),z:Number(f.z.toFixed(3))}, player:{x:Number(playerX.toFixed(2)),y:Number(playerY.toFixed(2)),z:Number(playerZ.toFixed(2))}, checkedAt:new Date().toISOString() };
  }

  function controllerAim(proxy){
    const controller = proxy?.userData?.controller || proxy;
    if(!controller) return null;
    controller.updateWorldMatrix?.(true,false);
    controller.getWorldPosition(vOrigin);
    controller.getWorldQuaternion(qWorld);
    const a = new THREE.Vector3(0,0,-1).applyQuaternion(qWorld).normalize();
    const b = new THREE.Vector3(0,0,1).applyQuaternion(qWorld).normalize();
    const hf = headForward().clone();
    const af = new THREE.Vector3(a.x,0,a.z); if(af.lengthSq()>0) af.normalize();
    const bf = new THREE.Vector3(b.x,0,b.z); if(bf.lengthSq()>0) bf.normalize();
    vDir.copy((bf.lengthSq()>0 && bf.dot(hf)>af.dot(hf)+0.15)?bf:af);
    if(vDir.lengthSq()<1e-5) vDir.copy(hf);
    const hold = triggerValue(proxy);
    const dist = THREE.MathUtils.clamp(5.8 + hold*8.8, 5.8, 14.6);
    return clampTarget(vOrigin.x + vDir.x*dist, vOrigin.z + vDir.z*dist).clone();
  }
  function handAim(hand){
    const wrist=hand?.joints?.wrist; const index=hand?.joints?.["index-finger-tip"];
    if(!wrist || !index) return null;
    wrist.updateWorldMatrix?.(true,false); index.updateWorldMatrix?.(true,false);
    wrist.getWorldPosition(vWrist); index.getWorldPosition(vIndex);
    vDir.copy(vIndex).sub(vWrist); vDir.y=0;
    if(vDir.lengthSq()<0.005) vDir.copy(headForward()); else vDir.normalize();
    const hf=headForward().clone(); if(vDir.dot(hf)<-0.10) vDir.multiplyScalar(-1);
    vOrigin.copy(vIndex).lerp(vWrist,0.35);
    return clampTarget(vOrigin.x+vDir.x*8.5, vOrigin.z+vDir.z*8.5).clone();
  }
  function teleportByDelta(target){
    if(!renderer?.xr?.isPresenting || !baseRefSpace) return false;
    try{
      const xrCam=renderer.xr.getCamera(camera); if(!xrCam) return false;
      xrCam.getWorldPosition(vHead);
      const dx=target.x-vHead.x, dz=target.z-vHead.z;
      const c=Math.cos(playerYaw), s=Math.sin(playerYaw);
      const localX=dx*c - dz*s;
      const localZ=dx*s + dz*c;
      const p=solidXZ(playerX+localX,playerZ+localZ);
      playerX=p.x; playerZ=p.z; playerY=floorHeightAt(playerX,playerZ);
      return applyReferenceSpace();
    }catch(e){ log("[Phase213] teleport failed", e?.message||e); return false; }
  }
  function toggleMode(preferred="right"){
    mode=!mode;
    if(!mode){ active=null; hideVisuals(); return false; }
    active = preferred==="left" ? (leftControllerRef||leftHandRef) : (rightControllerRef||rightHandRef||leftControllerRef||leftHandRef);
    activeMode = active===leftHandRef || active===rightHandRef ? "hand" : "controller";
    triggerHoldStart=performance.now(); return true;
  }
  async function onSessionStart(){
    const session=renderer.xr.getSession(); if(!session) return;
    baseRefSpace=await session.requestReferenceSpace("local-floor");
    playerX=CONFIG.SPAWN_X; playerY=0; playerZ=CONFIG.SPAWN_Z; playerYaw=0;
    mode=false; active=null; triggerHoldStart=0; pinchHoldStart=0; fistHoldStart=0; hideVisuals(); applyReferenceSpace();
  }
  function update({dt=0.016,leftHand,rightHand,leftController,rightController,statusCb=()=>{},modeCb=()=>{}}){
    leftHandRef=leftHand; rightHandRef=rightHand; leftControllerRef=leftController; rightControllerRef=rightController;
    if(renderer?.xr?.isPresenting && (leftControllerRef||rightControllerRef)) moveControllers(dt);
    const now=performance.now();
    const rc=rightControllerRef||leftControllerRef;
    const hold=triggerValue(rc);
    const leftFist=!!leftHandRef?.joints && isFist(leftHandRef);
    const rightFist=!!rightHandRef?.joints && isFist(rightHandRef);
    if(hold>0.18 && rc){ if(!mode || active!==rc){ mode=true; active=rc; activeMode="controller"; triggerHoldStart=now; } }
    else if(!mode && (rightFist||leftFist)){ active=rightFist?rightHandRef:leftHandRef; mode=true; activeMode="hand"; fistHoldStart=now; }
    if(!mode||!active){ hideVisuals(); statusCb((leftControllerRef||rightControllerRef)?"Controllers ready • hold A/grip/trigger for particle teleport":"Hands ready • fist hold for teleport"); modeCb("Phase213 input ready"); return; }
    const target = activeMode==="controller" ? controllerAim(active) : handAim(active);
    if(!target){ hideVisuals(); return; }
    vSmooth.lerp(target, vSmooth.distanceTo(target)>1.5?0.65:0.34);
    showVisuals(vSmooth);
    const origin = activeMode==="controller" ? vOrigin.clone() : vWrist.clone();
    updateBeam(origin, vSmooth);
    if(activeMode==="hand"){ handGlow.position.copy(origin); handGlow.visible=true; handGlowMat.opacity=0.76; }
    if(activeMode==="controller"){
      const cur=triggerValue(active);
      const held=triggerHoldStart?now-triggerHoldStart:0;
      if(cur<=0.12 && held>70 && now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){ if(teleportByDelta(vSmooth)){ lastTP=now; mode=false; active=null; triggerHoldStart=0; hideVisuals(); statusCb("TELEPORT COMPLETE"); return; } }
      if(cur<=0.12){ mode=false; active=null; hideVisuals(); return; }
      statusCb("PARTICLE TP ARMED • release to leap"); modeCb("Particle beam TP"); return;
    }
    const activeFist = active===rightHandRef ? rightFist : leftFist;
    const pinch = isPinching(active);
    if(pinch && !pinchHoldStart) pinchHoldStart=now;
    const fistHeld=fistHoldStart?now-fistHoldStart:0;
    const pinchHeld=pinchHoldStart?now-pinchHoldStart:0;
    if((!activeFist && fistHeld>80 || pinch && pinchHeld>120) && now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){ if(teleportByDelta(vSmooth)){ lastTP=now; mode=false; active=null; fistHoldStart=0; pinchHoldStart=0; hideVisuals(); return; } }
    if(!pinch) pinchHoldStart=0;
    statusCb("HAND PARTICLE TP ARMED • release fist or pinch"); modeCb("Hand beam TP");
  }
  return { onSessionStart,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled:()=>mode,getState:()=>({mode,activeMode,activeHand:active===rightControllerRef||active===rightHandRef?"right":active?"left":"none",wallBlocks}) };
}
