import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist } from "./gestures.js";
import { openPrivateScene } from "./scene_portal_router.js";

const PHASE161 = "PHASE-161-FORWARD-ONLY-FIST-TELEPORT-LOCK";
const PORTAL_MAGNET_RADIUS = 1.55;
const PORTAL_ACTIVATE_RADIUS = 0.92;
const HAND_STEP = 7.2;

export function createTeleportRig({ scene, renderer, camera, roomClamp, log = console.log }){
  let baseRefSpace = null;
  let playerX = CONFIG.SPAWN_X;
  let playerY = 0;
  let playerZ = CONFIG.SPAWN_Z;
  let playerYaw = 0;
  let teleportEnabled = true;
  let leftHandRef = null;
  let rightHandRef = null;
  let leftControllerRef = null;
  let rightControllerRef = null;
  let active = null;
  let activeMode = "none";
  let lastHoldActive = false;
  let holdStart = 0;
  let lastTP = 0;
  let snapCooldownUntil = 0;
  let lastPortalKey = null;
  let lastPortalAt = 0;

  const sourcePos = new THREE.Vector3();
  const sourceDir = new THREE.Vector3();
  const targetPos = new THREE.Vector3();
  const smoothTarget = new THREE.Vector3(0,0,CONFIG.SPAWN_Z);
  const head = new THREE.Vector3();
  const forward = new THREE.Vector3(0,0,-1);
  const lastGoodForward = new THREE.Vector3(0,0,-1);
  const tmpPortal = new THREE.Vector3();

  function xrCam(){ try { return renderer.xr.getCamera(camera) || camera; } catch(_){ return camera; } }
  function headPos(out = head){ try { xrCam().getWorldPosition(out); } catch(_){ out.set(playerX,1.6,playerZ); } return out; }
  function rawCameraForward(out = forward){
    try { xrCam().getWorldDirection(out); } catch(_){ out.copy(lastGoodForward); }
    out.y = 0;
    if(out.lengthSq() < 0.0001) out.copy(lastGoodForward);
    out.normalize();
    lastGoodForward.copy(out);
    return out;
  }
  function clampXZ(v){ const c = typeof roomClamp === "number" ? roomClamp : 18; v.x = THREE.MathUtils.clamp(v.x,-c,c); v.z = THREE.MathUtils.clamp(v.z,-c,c); v.y = 0; return v; }

  function applyReferenceSpace(){
    if(!baseRefSpace || !renderer?.xr?.isPresenting) return false;
    try{
      const h = -playerYaw * 0.5;
      const xf = new XRRigidTransform({x:-playerX,y:-playerY,z:-playerZ},{x:0,y:Math.sin(h),z:0,w:Math.cos(h)});
      renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xf));
      return true;
    }catch(err){ log("[phase161 teleport] reference-space failed", err?.message || err); return false; }
  }
  function setPlayerPose(x,y,z){ playerX=x; playerY=y; playerZ=z; return applyReferenceSpace(); }
  function setPlayerXZ(x,z){ playerX=x; playerZ=z; return applyReferenceSpace(); }
  function setPlayerYaw(v){ playerYaw=v; return applyReferenceSpace(); }
  function getPlayerPose(){ return {x:playerX,y:playerY,z:playerZ,yaw:playerYaw}; }

  const pointer = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.POINTER_SIZE,CONFIG.POINTER_SIZE), new THREE.MeshBasicMaterial({transparent:true,alphaTest:.25,depthWrite:false,side:THREE.DoubleSide,opacity:.98,color:0xffffff}));
  pointer.rotation.x = -Math.PI/2; pointer.position.y=.04; pointer.renderOrder=300; pointer.visible=false; scene.add(pointer);
  const ring = new THREE.Mesh(new THREE.RingGeometry(CONFIG.RING_INNER,CONFIG.RING_OUTER*1.22,64), new THREE.MeshBasicMaterial({color:0xb48cff,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.rotation.x = -Math.PI/2; ring.position.y=.036; ring.renderOrder=299; ring.visible=false; scene.add(ring);
  const glow = new THREE.PointLight(0xb48cff,0,7,2); scene.add(glow);
  const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color:0xf1eaff,transparent:true,opacity:.95,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending}));
  line.renderOrder=298; line.visible=false; scene.add(line);
  const tube = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({color:0xb48cff,transparent:true,opacity:.30,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending}));
  tube.renderOrder=297; tube.visible=false; scene.add(tube);

  function hide(){ pointer.visible=false; ring.visible=false; line.visible=false; tube.visible=false; glow.intensity=0; }
  function show(target, portal){
    const activePortal = !!portal?.active;
    pointer.visible=ring.visible=true;
    pointer.position.copy(target).setY(.04); ring.position.copy(target).setY(.036); glow.position.copy(target).setY(.45);
    glow.intensity = activePortal ? 4.6 : 2.35;
    const color = activePortal ? 0x78ff9f : 0xb48cff;
    ring.material.color.setHex(color); glow.color.setHex(color); tube.material.color.setHex(color);
  }
  function draw(origin,target){
    const pts=[]; for(let i=0;i<14;i++){ const f=i/13; pts.push(new THREE.Vector3(THREE.MathUtils.lerp(origin.x,target.x,f),THREE.MathUtils.lerp(origin.y,.12,f)+Math.sin(f*Math.PI)*.70,THREE.MathUtils.lerp(origin.z,target.z,f))); }
    line.geometry.setFromPoints(pts);
    const old=tube.geometry; tube.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.052,8,false); old?.dispose?.();
    line.visible=tube.visible=true;
  }

  function nearestPortal(target){
    let best=null;
    scene.traverse(o=>{
      const key=o?.userData?.portalKey; if(!key || !o.visible) return;
      o.getWorldPosition(tmpPortal); const d=Math.hypot(tmpPortal.x-target.x,tmpPortal.z-target.z); if(d>PORTAL_MAGNET_RADIUS) return;
      if(!best || d<best.dist) best={key,dist:d,point:new THREE.Vector3(tmpPortal.x,0,tmpPortal.z),active:d<=PORTAL_ACTIVATE_RADIUS};
    });
    return best;
  }

  function controllerGamepad(p){ return p?.userData?.gamepad || p?.userData?.inputSource?.gamepad || p?.userData?.controller?.inputSource?.gamepad || null; }
  function b(gp,i){ return gp?.buttons?.[i]?.value || 0; }
  function holdController(p){ const gp=controllerGamepad(p); return gp ? Math.max(b(gp,0),b(gp,1),b(gp,3),b(gp,4),b(gp,5),b(gp,6)) : 0; }
  function holdHand(h){ return h?.joints && (isFist(h)||isPinching(h)) ? 1 : 0; }
  function stick(gp, side){ if(!gp?.axes?.length) return {x:0,y:0}; const a=gp.axes; const pairs=side==='right'?[[2,3],[0,1]]:[[0,1],[2,3]]; let best={x:0,y:0,s:0}; for(const [ix,iy] of pairs){ const x=a[ix]||0,y=a[iy]||0,s=Math.abs(x)+Math.abs(y); if(s>best.s) best={x,y,s}; } return {x:Math.abs(best.x)<.13?0:best.x,y:Math.abs(best.y)<.13?0:best.y}; }
  function activeHold(){
    if(holdController(rightControllerRef)>.18) return {source:rightControllerRef,mode:"controller"};
    if(holdController(leftControllerRef)>.18) return {source:leftControllerRef,mode:"controller"};
    if(holdHand(rightHandRef)>.5) return {source:rightHandRef,mode:"hand"};
    if(holdHand(leftHandRef)>.5) return {source:leftHandRef,mode:"hand"};
    return null;
  }

  function fingertip(hand){ const tip=hand?.joints?.["index-finger-tip"] || hand?.joints?.wrist; if(!tip) return false; tip.getWorldPosition(sourcePos); return true; }
  function handForwardFromPlacement(){
    const h=headPos(new THREE.Vector3());
    const camF = rawCameraForward(new THREE.Vector3());
    const handF = new THREE.Vector3(sourcePos.x - h.x, 0, sourcePos.z - h.z);
    const hasHandFront = handF.lengthSq() > 0.018;
    if(hasHandFront){
      handF.normalize();
      // If WebXR/camera reports backward on this device, correct it against the real hand-in-front vector.
      if(camF.dot(handF) < -0.15) camF.negate();
      const blended = handF.multiplyScalar(0.72).add(camF.multiplyScalar(0.28));
      if(blended.lengthSq() < 0.0001) return handF.normalize();
      return blended.normalize();
    }
    return camF.normalize();
  }
  function handTarget(hand){
    if(!fingertip(hand)) return null;
    const f=handForwardFromPlacement();
    lastPortalKey=null;
    // Phase 161: destination is projected from the fingertip and guarded against inverted camera/hand polarity.
    targetPos.set(sourcePos.x + f.x * HAND_STEP, 0, sourcePos.z + f.z * HAND_STEP);
    clampXZ(targetPos);
    const portal=nearestPortal(targetPos);
    if(portal){ const strength=portal.active?.82:.36; targetPos.lerp(portal.point,strength); if(portal.active){ lastPortalKey=portal.key; lastPortalAt=performance.now(); } }
    return targetPos.clone();
  }
  function controllerTarget(proxy){
    const c=proxy?.userData?.controller; if(!c) return null; c.getWorldPosition(sourcePos); c.getWorldDirection(sourceDir); if(sourceDir.y>-0.06) sourceDir.y=-.28; sourceDir.normalize(); const t=sourcePos.y/(-sourceDir.y); if(!Number.isFinite(t)||t<.08) return null; return clampXZ(new THREE.Vector3(sourcePos.x+sourceDir.x*Math.min(t,140),0,sourcePos.z+sourceDir.z*Math.min(t,140)));
  }
  function moveControllers(dt){
    const lg=controllerGamepad(leftControllerRef), rg=controllerGamepad(rightControllerRef); if(!lg&&!rg) return;
    const ls=lg?stick(lg,'left'):{x:0,y:0}, rs=rg?stick(rg,'right'):{x:0,y:0};
    const turnX=Math.abs(rs.x)>.14?rs.x:ls.x, moveY=Math.abs(rs.y)>.13?rs.y:ls.y;
    if(Math.abs(turnX)>.72 && performance.now()>snapCooldownUntil){ playerYaw+=Math.sign(turnX)*(Math.PI/4); applyReferenceSpace(); snapCooldownUntil=performance.now()+260; }
    if(Math.abs(moveY)<.13) return;
    const f=rawCameraForward(new THREE.Vector3()); const dir=-moveY; const c=typeof roomClamp==='number'?roomClamp:18;
    setPlayerXZ(THREE.MathUtils.clamp(playerX+f.x*dir*2.65*dt,-c,c),THREE.MathUtils.clamp(playerZ+f.z*dir*2.65*dt,-c,c));
  }
  function jumpTo(target){
    if(!renderer.xr.isPresenting || !baseRefSpace) return false;
    const h=headPos(new THREE.Vector3()); const dx=target.x-h.x, dz=target.z-h.z; const prev={x:playerX,y:playerY,z:playerZ,yaw:playerYaw};
    playerX+=dx; playerZ+=dz; if(!applyReferenceSpace()){ playerX=prev.x; playerY=prev.y; playerZ=prev.z; playerYaw=prev.yaw; applyReferenceSpace(); return false; } return true;
  }
  function finish(statusCb,modeCb){
    const now=performance.now(); const held=holdStart?now-holdStart:999;
    if(activeMode==='hand' && lastPortalKey && now-lastPortalAt<950 && held>90){ const key=lastPortalKey; hide(); setTimeout(()=>openPrivateScene(key),80); statusCb(`Portal selected: ${key}`); modeCb('Portal quick-select'); lastPortalKey=null; return true; }
    const ok=held>70 && now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS && jumpTo(smoothTarget); if(ok) lastTP=now+240; hide(); statusCb(ok?'Teleport complete':'Teleport reset'); modeCb('Teleport off'); return ok;
  }

  async function onSessionStart(){ const s=renderer.xr.getSession(); if(!s) return; baseRefSpace=await s.requestReferenceSpace('local-floor'); playerYaw=0; setPlayerPose(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z); hide(); console.log(`[${PHASE161}] active`); }
  function setLogoTexture(tex){ if(tex){ tex.anisotropy=4; pointer.material.map=tex; pointer.material.needsUpdate=true; } }
  function toggleMode(){ teleportEnabled=!teleportEnabled; if(!teleportEnabled) hide(); return teleportEnabled; }
  function isEnabled(){ return teleportEnabled; }

  function update({dt=.016,leftHand,rightHand,leftController,rightController,statusCb=()=>{},modeCb=()=>{}}){
    leftHandRef=leftHand; rightHandRef=rightHand; leftControllerRef=leftController; rightControllerRef=rightController;
    if(renderer.xr.isPresenting && (leftControllerRef||rightControllerRef)) moveControllers(dt);
    const hold=activeHold(); const holding=!!hold;
    if(lastHoldActive && !holding){ finish(statusCb,modeCb); lastHoldActive=false; active=null; activeMode='none'; return; }
    if(!teleportEnabled){ hide(); statusCb('Teleport disabled'); modeCb('Teleport OFF'); return; }
    if(!holding){ hide(); holdStart=0; statusCb((leftControllerRef||rightControllerRef)?'Controllers ready • hold trigger/A/grip to teleport':'Hands ready • Phase 161 forward-only hand aim'); modeCb((leftControllerRef||rightControllerRef)?'Controllers ready':'Hands ready'); lastHoldActive=false; return; }
    if(!lastHoldActive || active!==hold.source){ holdStart=performance.now(); smoothTarget.copy(headPos(new THREE.Vector3())); }
    active=hold.source; activeMode=hold.mode; lastHoldActive=true;
    const target=hold.mode==='controller'?controllerTarget(hold.source):handTarget(hold.source); if(!target){ hide(); return; }
    smoothTarget.lerp(target,.75); if(smoothTarget.lengthSq()<.01) smoothTarget.copy(target);
    const portal=hold.mode==='hand'?nearestPortal(smoothTarget):null; show(smoothTarget,portal); draw(sourcePos,smoothTarget);
    if(hold.mode==='hand' && lastPortalKey){ statusCb(`PORTAL READY • release to enter ${lastPortalKey}`); modeCb('Hands: PORTAL QUICK-SELECT'); }
    else { statusCb(hold.mode==='hand'?'HAND TP • forward-only fingertip aim • release to leap':'CONTROLLER TP • release to teleport'); modeCb(hold.mode==='hand'?'Hands: PHASE161 FORWARD AIM':'Controllers: TELEPORT AIM'); }
  }

  return { onSessionStart,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled,getState:()=>({mode:!!lastHoldActive,activeMode,portalKey:lastPortalKey}) };
}
