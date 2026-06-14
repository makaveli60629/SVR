import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist } from "./gestures.js";
import { constrainLobbyBounds } from "./phase178_bounds.js";

const LABEL = "UPDATE-3.0-PHASE-214-INPLACE-TURN-UPSTAIRS-FLOOR-BEAM-COLOR-LOCK";
const CYAN = 0x7ffcff;
const PURPLE = 0xb55cff;
const GOLD = 0xffd98a;

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X, playerY = 0, playerZ = CONFIG.SPAWN_Z, playerYaw = 0;
  let mode = false, active = null, activeMode = "controller";
  let lastTP = 0, triggerHoldStart = 0, fistHoldStart = 0, pinchHoldStart = 0, snapCooldownUntil = 0;
  let leftHandRef = null, rightHandRef = null, leftControllerRef = null, rightControllerRef = null;
  let wallBlocks = 0;

  const vHead = new THREE.Vector3(), vHeadAfter = new THREE.Vector3(), vForward = new THREE.Vector3();
  const vOrigin = new THREE.Vector3(), vDir = new THREE.Vector3(), vTarget = new THREE.Vector3(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z), vSmooth = new THREE.Vector3(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z);
  const vWrist = new THREE.Vector3(), vIndex = new THREE.Vector3(), qWorld = new THREE.Quaternion();

  function floorHeightAt(x,z){
    const f = window.SVR_PHASE214_FLOOR_HEIGHT || window.SVR_PHASE213_FLOOR_HEIGHT || window.SVR_PHASE212_FLOOR_HEIGHT;
    if (typeof f === "function"){
      const y = Number(f(x,z));
      if (Number.isFinite(y)) return y;
    }
    const ax = Math.abs(x);
    if (ax >= 9.4 && ax <= 19.2 && z <= 9.5 && z >= -0.2) return THREE.MathUtils.clamp(((8.6-z)/8.0)*3.42,0,3.42);
    if (z <= -10.2 && z >= -16.1 && ax <= 19.4) return 3.42;
    if (ax >= 14.8 && ax <= 19.4 && z <= 7.2 && z >= -13.2) return 3.42;
    return 0;
  }
  function solidXZ(x,z){ const p = constrainLobbyBounds(x,z); if(p.blocked) wallBlocks++; return p; }
  function applyReferenceSpace(){
    if (!baseRefSpace || !renderer?.xr?.isPresenting) return false;
    try{
      const halfYaw = -playerYaw * 0.5;
      const xf = new XRRigidTransform({x:-playerX,y:-playerY,z:-playerZ},{x:0,y:Math.sin(halfYaw),z:0,w:Math.cos(halfYaw)});
      renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xf));
      return true;
    }catch(e){ log("[Phase214] reference-space failed", e?.message || e); return false; }
  }
  function setPlayerPose(x,y,z){ const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; playerY=Number.isFinite(y)?y:floorHeightAt(p.x,p.z); return applyReferenceSpace(); }
  function setPlayerXZ(x,z){ const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; playerY=floorHeightAt(playerX,playerZ); return applyReferenceSpace(); }
  function getPlayerPose(){ return {x:playerX,y:playerY,z:playerZ,yaw:playerYaw,wallBlocks}; }
  function setPlayerYaw(yaw){ playerYaw = yaw; return applyReferenceSpace(); }
  function xrHeadPosition(out){ const xr=renderer.xr.getCamera(camera); if(!xr) return false; xr.getWorldPosition(out); return true; }
  function snapTurnInPlace(delta){
    if (!renderer?.xr?.isPresenting){ playerYaw += delta; applyReferenceSpace(); return; }
    xrHeadPosition(vHead);
    playerYaw += delta;
    applyReferenceSpace();
    xrHeadPosition(vHeadAfter);
    const dx = vHead.x - vHeadAfter.x;
    const dz = vHead.z - vHeadAfter.z;
    playerX += dx;
    playerZ += dz;
    playerY = floorHeightAt(playerX, playerZ);
    applyReferenceSpace();
    window.SVR_PHASE214_SNAP_TURN = { build:LABEL, inPlace:true, delta:Number(delta.toFixed(3)), correction:{x:Number(dx.toFixed(3)),z:Number(dz.toFixed(3))}, checkedAt:new Date().toISOString() };
  }

  const targetMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, alphaTest:.18, opacity:.98, side:THREE.DoubleSide, depthWrite:false, depthTest:false });
  const pointer = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.POINTER_SIZE*1.32,CONFIG.POINTER_SIZE*1.32), targetMat);
  pointer.name = "PHASE214_TELEPORT_LOGO_TARGET"; pointer.rotation.x = -Math.PI/2; pointer.renderOrder = 3000; pointer.visible = false; scene.add(pointer);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.74,1.08,96), new THREE.MeshBasicMaterial({color:PURPLE,transparent:true,opacity:.95,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
  ring.name = "PHASE214_TELEPORT_PURPLE_TARGET_RING"; ring.rotation.x = -Math.PI/2; ring.renderOrder = 2999; ring.visible = false; scene.add(ring);
  const beamGeo = new THREE.BufferGeometry();
  const beamMat = new THREE.PointsMaterial({ color:CYAN, size:.13, sizeAttenuation:true, transparent:true, opacity:.96, blending:THREE.AdditiveBlending, depthWrite:false, depthTest:false });
  const beam = new THREE.Points(beamGeo, beamMat); beam.name = "PHASE214_CYAN_PURPLE_GOLD_ARCH_PARTICLE_BEAM"; beam.frustumCulled = false; beam.renderOrder = 3001; beam.visible = false; scene.add(beam);
  const beamLineGeo = new THREE.BufferGeometry();
  const beamLine = new THREE.Line(beamLineGeo, new THREE.LineBasicMaterial({color:GOLD,transparent:true,opacity:.70,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  beamLine.name = "PHASE214_GOLD_CENTER_ARCH_RAY"; beamLine.frustumCulled=false; beamLine.renderOrder=3000; beamLine.visible=false; scene.add(beamLine);
  const glow = new THREE.PointLight(CYAN,0,8,1.8); scene.add(glow);
  const handGlowMat = new THREE.MeshBasicMaterial({ color:CYAN, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  const handGlow = new THREE.Mesh(new THREE.SphereGeometry(.145,20,12), handGlowMat); handGlow.name="PHASE214_HAND_BEAM_GLOW"; handGlow.visible=false; scene.add(handGlow);

  function setLogoTexture(tex){ if(tex){ tex.anisotropy=1; pointer.material.map=tex; pointer.material.needsUpdate=true; } }
  function hideVisuals(){ pointer.visible=false; ring.visible=false; beam.visible=false; beamLine.visible=false; glow.intensity=0; handGlow.visible=false; handGlowMat.opacity=0; }
  function showVisuals(target){ pointer.visible=true; ring.visible=true; pointer.position.copy(target).setY(target.y+.026); ring.position.copy(target).setY(target.y+.018); glow.position.copy(target).setY(target.y+.38); glow.intensity=2.9; }
  function archPoints(origin,target){
    const pts=[], start=origin.clone(), end=target.clone().setY(target.y+.09);
    const dist=start.distanceTo(end);
    const mid=start.clone().lerp(end,.5); mid.y += THREE.MathUtils.clamp(dist*.17,.9,2.8);
    for(let i=0;i<58;i++){
      const u=i/57, a=start.clone().lerp(mid,u), b=mid.clone().lerp(end,u), p=a.lerp(b,u);
      const wave=Math.sin(u*Math.PI*10 + performance.now()*.012)*.026;
      p.x += wave; p.z += Math.cos(u*Math.PI*8 + performance.now()*.01)*.018;
      pts.push(p);
    }
    return pts;
  }
  function updateBeam(origin,target){ if(!origin||!target){beam.visible=false;beamLine.visible=false;return;} const pts=archPoints(origin,target); beamGeo.setFromPoints(pts); beamLineGeo.setFromPoints(pts); beam.visible=true; beamLine.visible=true; }
  function clampTarget(x,z){ const p=solidXZ(x,z); return vTarget.set(p.x,floorHeightAt(p.x,p.z),p.z); }
  function controllerGamepad(proxy){ return proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad || null; }
  function btn(gp,i){ const b=gp?.buttons?.[i]; return Math.max(b?.value||0,b?.pressed?1:0); }
  function triggerValue(proxy){ const gp=controllerGamepad(proxy); return Math.max(btn(gp,0),btn(gp,1),btn(gp,2),btn(gp,3),btn(gp,4),btn(gp,5)); }
  function stick(gp,side="right"){
    if(!gp?.axes?.length) return {x:0,y:0}; let x=0,y=0;
    if(side==="right" && gp.axes.length>=4){ x=gp.axes[2]||0; y=gp.axes[3]||0; if(Math.abs(x)<.01&&Math.abs(y)<.01){x=gp.axes[0]||0;y=gp.axes[1]||0;} }
    else {x=gp.axes[0]||0;y=gp.axes[1]||0;}
    if(Math.abs(x)<.18)x=0;if(Math.abs(y)<.18)y=0;return {x,y};
  }
  function headForward(){ const xr=renderer.xr.getCamera(camera)||camera; const source=xr?.cameras?.[0]||xr; source.getWorldDirection(vForward); vForward.y=0; if(vForward.lengthSq()<1e-5)vForward.set(0,0,-1); return vForward.normalize(); }
  function moveControllers(dt){
    const gpR=controllerGamepad(rightControllerRef), gpL=controllerGamepad(leftControllerRef); const r=stick(gpR,"right"), l=stick(gpL,"left"), now=performance.now();
    if(Math.abs(r.x)>.76 && now>snapCooldownUntil){ snapTurnInPlace(Math.sign(r.x)*Math.PI/4); snapCooldownUntil=now+310; }
    const y=Math.abs(r.y)>.14?r.y:l.y; if(Math.abs(y)<.14)return;
    const f=headForward().clone(), move=-y, speed=3.55;
    setPlayerXZ(playerX + f.x*move*speed*dt, playerZ + f.z*move*speed*dt);
    window.SVR_PHASE214_STICK_MOVE={build:LABEL,move:Number(move.toFixed(3)),forward:{x:Number(f.x.toFixed(3)),z:Number(f.z.toFixed(3))},player:{x:Number(playerX.toFixed(2)),y:Number(playerY.toFixed(2)),z:Number(playerZ.toFixed(2))},checkedAt:new Date().toISOString()};
  }
  function controllerAim(proxy){
    const controller=proxy?.userData?.controller||proxy;if(!controller)return null;controller.updateWorldMatrix?.(true,false);controller.getWorldPosition(vOrigin);controller.getWorldQuaternion(qWorld);
    const a=new THREE.Vector3(0,0,-1).applyQuaternion(qWorld).normalize(), b=new THREE.Vector3(0,0,1).applyQuaternion(qWorld).normalize(), hf=headForward().clone();
    const af=new THREE.Vector3(a.x,0,a.z); if(af.lengthSq()>0)af.normalize(); const bf=new THREE.Vector3(b.x,0,b.z); if(bf.lengthSq()>0)bf.normalize();
    vDir.copy((bf.lengthSq()>0 && bf.dot(hf)>af.dot(hf)+.15)?bf:af); if(vDir.lengthSq()<1e-5)vDir.copy(hf);
    const dist=THREE.MathUtils.clamp(6.2 + triggerValue(proxy)*10.8,6.2,17.0);
    return clampTarget(vOrigin.x+vDir.x*dist,vOrigin.z+vDir.z*dist).clone();
  }
  function handAim(hand){ const wrist=hand?.joints?.wrist,index=hand?.joints?.["index-finger-tip"]; if(!wrist||!index)return null; wrist.updateWorldMatrix?.(true,false); index.updateWorldMatrix?.(true,false); wrist.getWorldPosition(vWrist); index.getWorldPosition(vIndex); vDir.copy(vIndex).sub(vWrist); vDir.y=0; if(vDir.lengthSq()<.005)vDir.copy(headForward()); else vDir.normalize(); const hf=headForward().clone(); if(vDir.dot(hf)<-.1)vDir.multiplyScalar(-1); vOrigin.copy(vIndex).lerp(vWrist,.35); return clampTarget(vOrigin.x+vDir.x*9.5,vOrigin.z+vDir.z*9.5).clone(); }
  function teleportByDelta(target){ if(!renderer?.xr?.isPresenting||!baseRefSpace)return false; try{ const xr=renderer.xr.getCamera(camera); if(!xr)return false; xr.getWorldPosition(vHead); const dx=target.x-vHead.x,dz=target.z-vHead.z; const p=solidXZ(playerX+dx,playerZ+dz); playerX=p.x; playerZ=p.z; playerY=floorHeightAt(playerX,playerZ); return applyReferenceSpace(); }catch(e){ log("[Phase214] teleport failed",e?.message||e); return false; } }
  function toggleMode(preferred="right"){ mode=!mode; if(!mode){active=null;hideVisuals();return false;} active=preferred==="left"?(leftControllerRef||leftHandRef):(rightControllerRef||rightHandRef||leftControllerRef||leftHandRef); activeMode=(active===leftHandRef||active===rightHandRef)?"hand":"controller"; triggerHoldStart=performance.now(); return true; }
  async function onSessionStart(){ const session=renderer.xr.getSession(); if(!session)return; baseRefSpace=await session.requestReferenceSpace("local-floor"); playerX=CONFIG.SPAWN_X;playerY=0;playerZ=CONFIG.SPAWN_Z;playerYaw=0;mode=false;active=null;triggerHoldStart=0;fistHoldStart=0;pinchHoldStart=0;hideVisuals();applyReferenceSpace(); }
  function update({dt=.016,leftHand,rightHand,leftController,rightController,statusCb=()=>{},modeCb=()=>{}}){
    leftHandRef=leftHand;rightHandRef=rightHand;leftControllerRef=leftController;rightControllerRef=rightController;if(renderer?.xr?.isPresenting&&(leftControllerRef||rightControllerRef))moveControllers(dt);
    const now=performance.now(), rc=rightControllerRef||leftControllerRef, hold=triggerValue(rc), leftFist=!!leftHandRef?.joints&&isFist(leftHandRef), rightFist=!!rightHandRef?.joints&&isFist(rightHandRef);
    if(hold>.18&&rc){if(!mode||active!==rc){mode=true;active=rc;activeMode="controller";triggerHoldStart=now;}} else if(!mode&&(rightFist||leftFist)){active=rightFist?rightHandRef:leftHandRef;mode=true;activeMode="hand";fistHoldStart=now;}
    if(!mode||!active){hideVisuals();statusCb((leftControllerRef||rightControllerRef)?"Controllers ready • hold A/grip/trigger for matched arch TP":"Hands ready • fist hold for matched arch TP");modeCb("Phase214 ready");return;}
    const target=activeMode==="controller"?controllerAim(active):handAim(active); if(!target){hideVisuals();return;} vSmooth.lerp(target,vSmooth.distanceTo(target)>1.5?.65:.34); showVisuals(vSmooth); updateBeam(activeMode==="controller"?vOrigin.clone():vWrist.clone(),vSmooth);
    if(activeMode==="hand"){handGlow.position.copy(vWrist);handGlow.visible=true;handGlowMat.opacity=.78;}
    if(activeMode==="controller"){const cur=triggerValue(active),held=triggerHoldStart?now-triggerHoldStart:0;if(cur<=.12&&held>70&&now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){if(teleportByDelta(vSmooth)){lastTP=now;mode=false;active=null;triggerHoldStart=0;hideVisuals();return;}} if(cur<=.12){mode=false;active=null;hideVisuals();return;} statusCb("MATCHED ARCH TP • release to leap");modeCb("cyan purple gold beam");return;}
    const activeFist=active===rightHandRef?rightFist:leftFist, pinch=isPinching(active); if(pinch&&!pinchHoldStart)pinchHoldStart=now; const fistHeld=fistHoldStart?now-fistHoldStart:0,pinchHeld=pinchHoldStart?now-pinchHoldStart:0; if((!activeFist&&fistHeld>80||pinch&&pinchHeld>120)&&now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){if(teleportByDelta(vSmooth)){lastTP=now;mode=false;active=null;fistHoldStart=0;pinchHoldStart=0;hideVisuals();return;}} if(!pinch)pinchHoldStart=0; statusCb("HAND MATCHED ARCH TP"); modeCb("hand beam");
  }
  return {onSessionStart,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled:()=>mode,getState:()=>({mode,activeMode,activeHand:active===rightControllerRef||active===rightHandRef?"right":active?"left":"none",wallBlocks})};
}
