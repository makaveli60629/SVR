import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist } from "./gestures.js";
import { openPrivateScene } from "./scene_portal_router.js";

const PHASE = "PHASE-164-CAMERA-FORWARD-HAND-TELEPORT-LOCK";
const MAGNET_RADIUS = 1.55;
const ACTIVE_RADIUS = 0.92;
const HAND_STEP = 7.6;
const SETTLE_MS = 180;

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
  let settleUntil = 0;
  let lastPortalKey = null;
  let lastPortalAt = 0;

  const sourcePos = new THREE.Vector3();
  const sourceDir = new THREE.Vector3();
  const targetPos = new THREE.Vector3();
  const smoothTarget = new THREE.Vector3(0,0,CONFIG.SPAWN_Z);
  const lastForward = new THREE.Vector3(0,0,-1);
  const head = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const portalPos = new THREE.Vector3();

  function xrCam(){ try { return renderer.xr.getCamera(camera) || camera; } catch(_){ return camera; } }
  function headPos(out = head){ try { xrCam().getWorldPosition(out); } catch(_){ out.set(playerX,1.6,playerZ); } return out; }
  function cameraForward(out = sourceDir){
    try { xrCam().getWorldDirection(out); } catch(_){ out.copy(lastForward); }
    out.y = 0;
    if(out.lengthSq() < 0.0001) out.copy(lastForward);
    out.normalize();
    lastForward.copy(out);
    return out;
  }
  function clampXZ(v){
    const c = typeof roomClamp === "number" ? roomClamp : 18;
    v.x = THREE.MathUtils.clamp(v.x,-c,c);
    v.z = THREE.MathUtils.clamp(v.z,-c,c);
    v.y = 0;
    return v;
  }
  function clearBuffers(){
    lastPortalKey = null;
    lastPortalAt = 0;
    holdStart = 0;
    active = null;
    activeMode = "none";
    lastHoldActive = false;
    smoothTarget.copy(headPos(new THREE.Vector3())).setY(0);
  }
  function applyReferenceSpace(){
    if(!baseRefSpace || !renderer?.xr?.isPresenting) return false;
    try{
      const h = -playerYaw * 0.5;
      const xf = new XRRigidTransform({x:-playerX,y:-playerY,z:-playerZ},{x:0,y:Math.sin(h),z:0,w:Math.cos(h)});
      renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xf));
      return true;
    }catch(err){
      log("[phase164 teleport] reference-space failed", err?.message || err);
      return false;
    }
  }

  const pointer = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.POINTER_SIZE,CONFIG.POINTER_SIZE),
    new THREE.MeshBasicMaterial({transparent:true,alphaTest:.25,depthWrite:false,side:THREE.DoubleSide,opacity:.98,color:0xffffff})
  );
  pointer.rotation.x = -Math.PI/2;
  pointer.position.y = .04;
  pointer.renderOrder = 300;
  pointer.visible = false;
  scene.add(pointer);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(CONFIG.RING_INNER,CONFIG.RING_OUTER*1.30,72),
    new THREE.MeshBasicMaterial({color:0xb48cff,transparent:true,opacity:.94,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})
  );
  ring.rotation.x = -Math.PI/2;
  ring.position.y = .036;
  ring.renderOrder = 299;
  ring.visible = false;
  scene.add(ring);

  const glow = new THREE.PointLight(0xb48cff,0,8,2);
  scene.add(glow);

  const line = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({color:0xf1eaff,transparent:true,opacity:.96,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending})
  );
  line.renderOrder = 298;
  line.visible = false;
  scene.add(line);

  const tube = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({color:0xb48cff,transparent:true,opacity:.44,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending})
  );
  tube.renderOrder = 297;
  tube.visible = false;
  scene.add(tube);

  function setPlayerPose(x,y,z){ playerX=x; playerY=y; playerZ=z; return applyReferenceSpace(); }
  function setPlayerXZ(x,z){ playerX=x; playerZ=z; return applyReferenceSpace(); }
  function setPlayerYaw(v){ playerYaw=v; return applyReferenceSpace(); }
  function getPlayerPose(){ return {x:playerX,y:playerY,z:playerZ,yaw:playerYaw}; }
  function hide(){ pointer.visible=false; ring.visible=false; line.visible=false; tube.visible=false; glow.intensity=0; }

  function markerYaw(target){
    const h = headPos(tmp);
    const dx = target.x - h.x;
    const dz = target.z - h.z;
    if(Math.abs(dx)+Math.abs(dz) > 0.001) pointer.rotation.z = Math.atan2(dx,dz);
  }
  function show(target, portal){
    const activePortal = !!portal?.active;
    pointer.visible = true;
    ring.visible = true;
    pointer.position.copy(target).setY(.04);
    ring.position.copy(target).setY(.036);
    glow.position.copy(target).setY(.45);
    markerYaw(target);
    glow.intensity = activePortal ? 4.9 : 2.55;
    const color = activePortal ? 0x78ff9f : 0xb48cff;
    ring.material.color.setHex(color);
    glow.color.setHex(color);
    tube.material.color.setHex(color);
  }
  function draw(origin,target){
    const pts=[];
    for(let i=0;i<16;i++){
      const f=i/15;
      pts.push(new THREE.Vector3(
        THREE.MathUtils.lerp(origin.x,target.x,f),
        THREE.MathUtils.lerp(origin.y,.12,f)+Math.sin(f*Math.PI)*.74,
        THREE.MathUtils.lerp(origin.z,target.z,f)
      ));
    }
    line.geometry.setFromPoints(pts);
    const old = tube.geometry;
    tube.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),18,.07,10,false);
    old?.dispose?.();
    line.visible = true;
    tube.visible = true;
  }
  function nearestPortal(target){
    let best = null;
    scene.traverse(o=>{
      const key = o?.userData?.portalKey;
      if(!key || !o.visible) return;
      o.getWorldPosition(portalPos);
      const d = Math.hypot(portalPos.x-target.x,portalPos.z-target.z);
      if(d > MAGNET_RADIUS) return;
      if(!best || d < best.dist) best = {key,dist:d,point:new THREE.Vector3(portalPos.x,0,portalPos.z),active:d<=ACTIVE_RADIUS};
    });
    return best;
  }

  function controllerGamepad(p){ return p?.userData?.gamepad || p?.userData?.inputSource?.gamepad || p?.userData?.controller?.inputSource?.gamepad || null; }
  function buttonValue(gp,i){ return gp?.buttons?.[i]?.value || 0; }
  function holdController(p){
    const gp = controllerGamepad(p);
    return gp ? Math.max(buttonValue(gp,0),buttonValue(gp,1),buttonValue(gp,3),buttonValue(gp,4),buttonValue(gp,5),buttonValue(gp,6)) : 0;
  }
  function holdHand(h){ return h?.joints && (isFist(h)||isPinching(h)) ? 1 : 0; }
  function activeHold(){
    if(holdController(rightControllerRef)>.18) return {source:rightControllerRef,mode:"controller"};
    if(holdController(leftControllerRef)>.18) return {source:leftControllerRef,mode:"controller"};
    if(holdHand(rightHandRef)>.5) return {source:rightHandRef,mode:"hand"};
    if(holdHand(leftHandRef)>.5) return {source:leftHandRef,mode:"hand"};
    return null;
  }
  function stick(gp, side){
    if(!gp?.axes?.length) return {x:0,y:0};
    const a = gp.axes;
    const pairs = side==='right' ? [[2,3],[0,1]] : [[0,1],[2,3]];
    let best = {x:0,y:0,s:0};
    for(const [ix,iy] of pairs){
      const x = a[ix] || 0;
      const y = a[iy] || 0;
      const s = Math.abs(x)+Math.abs(y);
      if(s > best.s) best = {x,y,s};
    }
    return {x:Math.abs(best.x)<.13?0:best.x,y:Math.abs(best.y)<.13?0:best.y};
  }
  function moveControllers(dt){
    const lg = controllerGamepad(leftControllerRef);
    const rg = controllerGamepad(rightControllerRef);
    if(!lg && !rg) return;
    const ls = lg ? stick(lg,'left') : {x:0,y:0};
    const rs = rg ? stick(rg,'right') : {x:0,y:0};
    const turnX = Math.abs(rs.x)>.14 ? rs.x : ls.x;
    const moveY = Math.abs(rs.y)>.13 ? rs.y : ls.y;
    if(Math.abs(turnX)>.72 && performance.now()>snapCooldownUntil){
      playerYaw += Math.sign(turnX)*(Math.PI/4);
      applyReferenceSpace();
      snapCooldownUntil = performance.now()+260;
    }
    if(Math.abs(moveY)<.13) return;
    const f = cameraForward(new THREE.Vector3());
    const dir = -moveY;
    const c = typeof roomClamp === "number" ? roomClamp : 18;
    setPlayerXZ(THREE.MathUtils.clamp(playerX+f.x*dir*2.65*dt,-c,c),THREE.MathUtils.clamp(playerZ+f.z*dir*2.65*dt,-c,c));
  }

  function jointWorld(hand,names,out){
    for(const n of names){
      const j = hand?.joints?.[n];
      if(j?.getWorldPosition){ j.getWorldPosition(out); return true; }
    }
    return false;
  }
  function setSourceFromHand(hand){
    if(jointWorld(hand,["index-finger-tip","index-tip","wrist"],sourcePos)) return true;
    return false;
  }
  function handTarget(hand){
    if(!setSourceFromHand(hand)) return null;
    lastPortalKey = null;

    // Phase 164: do NOT trust Quest hand forward matrices for teleport direction.
    // The destination is always projected in the headset/camera forward direction from the fingertip origin.
    // This prevents the logo from firing behind the player when hand tracking reports inverted joints.
    const dir = cameraForward(new THREE.Vector3());
    targetPos.set(sourcePos.x + dir.x * HAND_STEP, 0, sourcePos.z + dir.z * HAND_STEP);
    clampXZ(targetPos);

    const portal = nearestPortal(targetPos);
    if(portal){
      const strength = portal.active ? .82 : .36;
      targetPos.lerp(portal.point,strength);
      if(portal.active){ lastPortalKey = portal.key; lastPortalAt = performance.now(); }
    }
    return targetPos.clone();
  }
  function controllerTarget(proxy){
    const c = proxy?.userData?.controller;
    if(!c) return null;
    c.getWorldPosition(sourcePos);
    c.getWorldDirection(sourceDir);
    if(sourceDir.y > -0.06) sourceDir.y = -0.28;
    sourceDir.normalize();
    const t = sourcePos.y / (-sourceDir.y);
    if(!Number.isFinite(t)||t<.08) return null;
    return clampXZ(new THREE.Vector3(sourcePos.x+sourceDir.x*Math.min(t,140),0,sourcePos.z+sourceDir.z*Math.min(t,140)));
  }
  function jumpTo(target){
    if(!renderer.xr.isPresenting || !baseRefSpace) return false;
    const h = headPos(new THREE.Vector3());
    const dx = target.x-h.x;
    const dz = target.z-h.z;
    const prev = {x:playerX,y:playerY,z:playerZ,yaw:playerYaw};
    playerX += dx;
    playerZ += dz;
    if(!applyReferenceSpace()){
      playerX=prev.x; playerY=prev.y; playerZ=prev.z; playerYaw=prev.yaw;
      applyReferenceSpace();
      return false;
    }
    settleUntil = performance.now() + SETTLE_MS;
    smoothTarget.copy(headPos(new THREE.Vector3())).setY(0);
    return true;
  }
  function finish(statusCb,modeCb){
    const now = performance.now();
    const held = holdStart ? now-holdStart : 999;
    if(activeMode==='hand' && lastPortalKey && now-lastPortalAt<950 && held>90){
      const key = lastPortalKey;
      hide();
      clearBuffers();
      settleUntil = performance.now() + SETTLE_MS;
      setTimeout(()=>openPrivateScene(key),80);
      statusCb(`Portal selected: ${key}`);
      modeCb('Portal quick-select');
      return true;
    }
    const ok = held>70 && now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS && jumpTo(smoothTarget);
    if(ok) lastTP = now+240;
    hide();
    clearBuffers();
    statusCb(ok ? 'Teleport complete' : 'Teleport reset');
    modeCb('Teleport off');
    return ok;
  }

  async function onSessionStart(){
    const s = renderer.xr.getSession();
    if(!s) return;
    baseRefSpace = await s.requestReferenceSpace('local-floor');
    playerYaw = 0;
    setPlayerPose(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z);
    hide();
    clearBuffers();
    console.log(`[${PHASE}] active`);
  }
  function setLogoTexture(tex){ if(tex){ tex.anisotropy=4; pointer.material.map=tex; pointer.material.needsUpdate=true; } }
  function toggleMode(){ teleportEnabled=!teleportEnabled; if(!teleportEnabled){ hide(); clearBuffers(); } return teleportEnabled; }
  function isEnabled(){ return teleportEnabled; }
  function update({dt=.016,leftHand,rightHand,leftController,rightController,statusCb=()=>{},modeCb=()=>{}}){
    leftHandRef = leftHand;
    rightHandRef = rightHand;
    leftControllerRef = leftController;
    rightControllerRef = rightController;
    if(renderer.xr.isPresenting && (leftControllerRef||rightControllerRef)) moveControllers(dt);
    if(performance.now() < settleUntil){ hide(); return; }

    const hold = activeHold();
    const holding = !!hold;
    if(lastHoldActive && !holding){ finish(statusCb,modeCb); return; }
    if(!teleportEnabled){ hide(); statusCb('Teleport disabled'); modeCb('Teleport OFF'); return; }
    if(!holding){
      hide();
      holdStart = 0;
      statusCb((leftControllerRef||rightControllerRef) ? 'Controllers ready • hold trigger/A/grip to teleport' : 'Hands ready • Phase 164 camera-forward teleport aim');
      modeCb((leftControllerRef||rightControllerRef) ? 'Controllers ready' : 'Hands ready');
      lastHoldActive = false;
      active = null;
      activeMode = 'none';
      return;
    }
    if(!lastHoldActive || active !== hold.source){
      holdStart = performance.now();
      smoothTarget.copy(headPos(new THREE.Vector3())).setY(0);
    }
    active = hold.source;
    activeMode = hold.mode;
    lastHoldActive = true;

    const target = hold.mode === 'controller' ? controllerTarget(hold.source) : handTarget(hold.source);
    if(!target){ hide(); return; }
    smoothTarget.lerp(target,.86);
    if(smoothTarget.lengthSq()<.01) smoothTarget.copy(target);
    const portal = hold.mode === 'hand' ? nearestPortal(smoothTarget) : null;
    show(smoothTarget,portal);
    draw(sourcePos,smoothTarget);
    if(hold.mode==='hand' && lastPortalKey){
      statusCb(`PORTAL READY • release to enter ${lastPortalKey}`);
      modeCb('Hands: PORTAL QUICK-SELECT');
    } else {
      statusCb(hold.mode==='hand' ? 'HAND TP • Phase 164 camera-forward aim • release to leap' : 'CONTROLLER TP • release to teleport');
      modeCb(hold.mode==='hand' ? 'Hands: PHASE164 CAMERA-FORWARD' : 'Controllers: TELEPORT AIM');
    }
  }

  return { onSessionStart,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled,getState:()=>({mode:!!lastHoldActive,activeMode,portalKey:lastPortalKey,phase:PHASE}) };
}
