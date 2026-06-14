import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isFist } from "./gestures.js";
import { constrainLobbyBounds } from "./phase178_bounds.js";

const LABEL = "UPDATE-3.1-G-HANDS-FIST-TELEPORT-ARC-REALIGN-LOCK";
const CYAN = 0x7ffcff;
const PURPLE = 0xb55cff;
const GOLD = 0xffd98a;
const STAND_EYE_Y = 1.62;

function particleTexture(){
  const c = document.createElement("canvas");
  c.width = 64; c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32,32,2,32,32,31);
  g.addColorStop(0,"rgba(255,255,255,1)");
  g.addColorStop(.32,"rgba(127,252,255,.88)");
  g.addColorStop(.72,"rgba(181,92,255,.42)");
  g.addColorStop(1,"rgba(181,92,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,64,64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createTeleportRig({ scene, renderer, camera, roomClamp, log=console.log }){
  let baseRefSpace=null, playerX=CONFIG.SPAWN_X, playerY=0, playerZ=CONFIG.SPAWN_Z, playerYaw=0;
  let seated=false, mode=false, active=null, activeMode="hand";
  let lastTP=0, triggerHoldStart=0, fistHoldStart=0, snapCooldownUntil=0;
  let aimDist=6.2, leftHandRef=null, rightHandRef=null, leftControllerRef=null, rightControllerRef=null, wallBlocks=0;
  const vHead=new THREE.Vector3(), vHead2=new THREE.Vector3(), vForward=new THREE.Vector3(), vYawForward=new THREE.Vector3(), vOrigin=new THREE.Vector3(), vDir=new THREE.Vector3(), vTarget=new THREE.Vector3(), vSmooth=new THREE.Vector3(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z), vWrist=new THREE.Vector3(), vIndex=new THREE.Vector3(), qWorld=new THREE.Quaternion();

  function floorHeightAt(x,z){
    const f=window.SVR_PHASE227_FLOOR_HEIGHT||window.SVR_PHASE226_FLOOR_HEIGHT||window.SVR_PHASE224_FLOOR_HEIGHT||window.SVR_PHASE215_FLOOR_HEIGHT||window.SVR_PHASE214_FLOOR_HEIGHT||window.SVR_PHASE213_FLOOR_HEIGHT||window.SVR_PHASE212_FLOOR_HEIGHT;
    if(typeof f==="function"){const y=Number(f(x,z)); if(Number.isFinite(y)) return y;}
    const ax=Math.abs(x);
    if(ax>=9.2&&ax<=19.6&&z<=9.8&&z>=-0.35) return THREE.MathUtils.clamp(((8.65-z)/8.15)*3.42,0,3.42);
    if(z<=-9.85&&z>=-16.55&&ax<=20.0) return 3.42;
    if(ax>=14.5&&ax<=20.0&&z<=7.55&&z>=-13.65) return 3.42;
    return 0;
  }
  function solidXZ(x,z){const p=constrainLobbyBounds(x,z); if(p.blocked)wallBlocks++; return p;}
  function applyReferenceSpace(){
    if(!baseRefSpace||!renderer?.xr?.isPresenting) return false;
    try{const h=-playerYaw*.5; const xf=new XRRigidTransform({x:-playerX,y:-playerY,z:-playerZ},{x:0,y:Math.sin(h),z:0,w:Math.cos(h)}); renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xf)); return true;}catch(e){log("[3.1-G] ref failed",e?.message||e); return false;}
  }
  function xrHead(out){const xr=renderer.xr.getCamera(camera); if(!xr)return false; xr.getWorldPosition(out); return true;}
  function targetStandingY(){return floorHeightAt(playerX,playerZ) + STAND_EYE_Y;}
  function maintainStanding(){
    if(seated || !renderer?.xr?.isPresenting || !baseRefSpace) return;
    if(!xrHead(vHead)) return;
    const desired=targetStandingY();
    const err=desired-vHead.y;
    if(Math.abs(err)>0.035){playerY += THREE.MathUtils.clamp(err,-0.08,0.08); playerY=THREE.MathUtils.clamp(playerY,floorHeightAt(playerX,playerZ)-.35,floorHeightAt(playerX,playerZ)+1.45); applyReferenceSpace();}
    window.SVR_PHASE227_STANDING_LOCK={build:LABEL,standing:!seated,headY:Number(vHead.y.toFixed(2)),targetY:Number(desired.toFixed(2)),playerY:Number(playerY.toFixed(2)),checkedAt:new Date().toISOString()};
  }
  function setPlayerPose(x,y,z){const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; seated=Number.isFinite(y)&&y<-.25; playerY=seated?y:floorHeightAt(playerX,playerZ); return applyReferenceSpace();}
  function setPlayerXZ(x,z){const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; if(!seated) playerY=floorHeightAt(playerX,playerZ); return applyReferenceSpace();}
  function getPlayerPose(){return {x:playerX,y:playerY,z:playerZ,yaw:playerYaw,seated,aimDist,wallBlocks};}
  function setPlayerYaw(yaw){playerYaw=yaw;return applyReferenceSpace();}
  function snapTurnInPlace(delta){
    if(!renderer?.xr?.isPresenting){playerYaw+=delta;applyReferenceSpace();return;}
    xrHead(vHead); playerYaw += delta; applyReferenceSpace();
    for(let i=0;i<3;i++){xrHead(vHead2); const dx=vHead.x-vHead2.x, dz=vHead.z-vHead2.z; playerX+=dx; playerZ+=dz; if(!seated)playerY=floorHeightAt(playerX,playerZ); applyReferenceSpace(); if(Math.hypot(dx,dz)<.012)break;}
    window.SVR_PHASE227_SNAP_TURN={build:LABEL,yaw:Number(playerYaw.toFixed(3)),inPlace:true,checkedAt:new Date().toISOString()};
  }

  const pTex = particleTexture();
  const pointer=new THREE.Mesh(new THREE.CircleGeometry(CONFIG.POINTER_SIZE*.82,64),new THREE.MeshBasicMaterial({color:CYAN,map:pTex,transparent:true,alphaTest:.06,opacity:.88,side:THREE.DoubleSide,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  pointer.name="UPDATE31G_ROUND_TELEPORT_LOGO_TARGET"; pointer.rotation.x=-Math.PI/2; pointer.renderOrder=4000; pointer.visible=false; scene.add(pointer);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.62,1.08,128),new THREE.MeshBasicMaterial({color:PURPLE,transparent:true,opacity:.90,side:THREE.DoubleSide,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  ring.name="UPDATE31G_PURPLE_CYAN_TARGET_RING"; ring.rotation.x=-Math.PI/2; ring.visible=false; ring.renderOrder=3999; scene.add(ring);

  const beamGeo=new THREE.BufferGeometry();
  const beam=new THREE.Points(beamGeo,new THREE.PointsMaterial({map:pTex,color:CYAN,size:.185,sizeAttenuation:true,transparent:true,alphaTest:.04,opacity:.88,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  beam.name="UPDATE31G_ROUND_CYAN_PARTICLE_TELEPORT_ARC"; beam.frustumCulled=false; beam.visible=false; beam.renderOrder=4001; scene.add(beam);
  const beam2Geo=new THREE.BufferGeometry();
  const beam2=new THREE.Points(beam2Geo,new THREE.PointsMaterial({map:pTex,color:PURPLE,size:.115,sizeAttenuation:true,transparent:true,alphaTest:.04,opacity:.70,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  beam2.name="UPDATE31G_ROUND_PURPLE_PARTICLE_TELEPORT_ARC"; beam2.frustumCulled=false; beam2.visible=false; beam2.renderOrder=4002; scene.add(beam2);
  const lineGeo=new THREE.BufferGeometry();
  const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:GOLD,transparent:true,opacity:.32,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  line.name="UPDATE31G_SOFT_GOLD_ARC_SPINE"; line.visible=false; line.renderOrder=4000; scene.add(line);
  const glow=new THREE.PointLight(CYAN,0,8,1.8); scene.add(glow);
  const auraGeo=new THREE.BufferGeometry();
  const aura=new THREE.Points(auraGeo,new THREE.PointsMaterial({map:pTex,color:CYAN,size:.095,sizeAttenuation:true,transparent:true,alphaTest:.04,opacity:.0,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  aura.name="UPDATE31G_CYAN_PURPLE_FIST_ACTIVE_AURA"; aura.visible=false; scene.add(aura);

  function setLogoTexture(tex){if(tex){tex.anisotropy=1; pointer.material.map=tex; pointer.material.needsUpdate=true;}}
  function hideVisuals(){pointer.visible=false;ring.visible=false;beam.visible=false;beam2.visible=false;line.visible=false;glow.intensity=0;aura.visible=false;aura.material.opacity=0;}
  function showVisuals(t){pointer.visible=true;ring.visible=true;pointer.position.copy(t).setY(t.y+.026);ring.position.copy(t).setY(t.y+.018);glow.position.copy(t).setY(t.y+.38);glow.intensity=2.5;}
  function archPts(o,t){const pts=[],start=o.clone(),end=t.clone().setY(t.y+.1),dist=start.distanceTo(end),mid=start.clone().lerp(end,.5); mid.y+=THREE.MathUtils.clamp(dist*.18,1.0,3.1); for(let i=0;i<84;i++){const u=i/83,a=start.clone().lerp(mid,u),b=mid.clone().lerp(end,u),p=a.lerp(b,u); const flare=Math.sin(u*Math.PI*14+performance.now()*.012)*.018; p.x+=flare;p.z+=Math.cos(u*Math.PI*10+performance.now()*.010)*.016; pts.push(p);} return pts;}
  function updateBeam(o,t){if(!o||!t){beam.visible=false;beam2.visible=false;line.visible=false;return;}const pts=archPts(o,t);beamGeo.setFromPoints(pts);beam2Geo.setFromPoints(pts.filter((_,i)=>i%2===0));lineGeo.setFromPoints(pts);beam.visible=true;beam2.visible=true;line.visible=true;}
  function updateAura(origin){
    if(!origin){aura.visible=false;return;}
    const now=performance.now()*.004, pts=[];
    for(let i=0;i<36;i++){
      const a=i/36*Math.PI*2+now*(i%2?.55:-.35), r=.10+(i%5)*.011;
      pts.push(new THREE.Vector3(origin.x+Math.cos(a)*r, origin.y+Math.sin(now+i)*.035, origin.z+Math.sin(a)*r));
    }
    auraGeo.setFromPoints(pts); aura.visible=true; aura.material.opacity=.82;
  }
  function clampTarget(x,z){const p=solidXZ(x,z);return vTarget.set(p.x,floorHeightAt(p.x,p.z),p.z);}
  function gp(proxy){return proxy?.userData?.gamepad||proxy?.userData?.inputSource?.gamepad||proxy?.userData?.controller?.inputSource?.gamepad||null;}
  function b(g,i){const q=g?.buttons?.[i];return Math.max(q?.value||0,q?.pressed?1:0);}
  function triggerValue(proxy){const g=gp(proxy);return Math.max(b(g,0),b(g,1),b(g,2),b(g,3),b(g,4),b(g,5));}
  function stick(g,side="right"){if(!g?.axes?.length)return{x:0,y:0};let x=0,y=0;if(side==="right"&&g.axes.length>=4){x=g.axes[2]||0;y=g.axes[3]||0;if(Math.abs(x)<.01&&Math.abs(y)<.01){x=g.axes[0]||0;y=g.axes[1]||0;}}else{x=g.axes[0]||0;y=g.axes[1]||0;}if(Math.abs(x)<.18)x=0;if(Math.abs(y)<.18)y=0;return{x,y};}
  function headForward(){const xr=renderer.xr.getCamera(camera)||camera,src=xr?.cameras?.[0]||xr;src?.updateWorldMatrix?.(true,false);src.getWorldDirection(vForward);vForward.y=0;if(vForward.lengthSq()<1e-5)vForward.set(0,0,-1);return vForward.normalize();}
  function yawForward(){vYawForward.set(Math.sin(playerYaw),0,-Math.cos(playerYaw)); if(vYawForward.lengthSq()<1e-5)vYawForward.set(0,0,-1); return vYawForward.normalize();}
  function movementForward(){const f=headForward().clone(); if(f.lengthSq()<1e-5) return yawForward().clone(); window.SVR_PHASE227_MOVE_FORWARD_SOURCE={build:LABEL,source:"xr-head-camera",x:Number(f.x.toFixed(3)),z:Number(f.z.toFixed(3)),checkedAt:new Date().toISOString()}; return f;}
  function magneticTarget(t){let best=null,bestD=2.85; scene.traverse(o=>{ if(!o?.userData?.svrMagnetTarget && !/^UPDATE31[DFG]_MAGNET_/i.test(String(o.name||""))) return; const p=new THREE.Vector3(); o.getWorldPosition(p); const d=Math.hypot(p.x-t.x,p.z-t.z); if(d<bestD){bestD=d; best=p;} }); if(!best){ window.SVR_PHASE227_MAGNETIC_LOCK=null; return null; } const target=clampTarget(best.x,best.z).clone(); window.SVR_PHASE227_MAGNETIC_LOCK={build:LABEL,active:true,x:Number(target.x.toFixed(2)),z:Number(target.z.toFixed(2)),dist:Number(bestD.toFixed(2)),checkedAt:new Date().toISOString()}; return target;}
  function aimAxisDistance(gR,gL,r,l,dt){const candidates=[r.y,l.y,r.x,l.x].filter(v=>Math.abs(v)>.14); if(!candidates.length) return; const v=candidates.sort((a,b)=>Math.abs(b)-Math.abs(a))[0]; aimDist=THREE.MathUtils.clamp(aimDist+(-v)*13.5*dt,1.2,26.0); window.SVR_PHASE227_AIM_DISTANCE=Number(aimDist.toFixed(2));}
  function moveControllers(dt){const gR=gp(rightControllerRef),gL=gp(leftControllerRef),r=stick(gR,"right"),l=stick(gL,"left"),now=performance.now(); if(mode){aimAxisDistance(gR,gL,r,l,dt);return;} if(Math.abs(r.x)>.76&&now>snapCooldownUntil){snapTurnInPlace(Math.sign(r.x)*Math.PI/4);snapCooldownUntil=now+320;} const y=Math.abs(r.y)>.14?r.y:l.y;if(Math.abs(y)<.14)return; const f=movementForward().clone(),move=-y,speed=4.15; setPlayerXZ(playerX+f.x*move*speed*dt,playerZ+f.z*move*speed*dt); window.SVR_PHASE227_MOVE_VECTOR={build:LABEL,x:Number(f.x.toFixed(3)),z:Number(f.z.toFixed(3)),yaw:Number(playerYaw.toFixed(3)),checkedAt:new Date().toISOString()};}
  function controllerAim(proxy){const c=proxy?.userData?.controller||proxy;if(!c)return null;c.updateWorldMatrix?.(true,false);c.getWorldPosition(vOrigin);c.getWorldQuaternion(qWorld);const a=new THREE.Vector3(0,0,-1).applyQuaternion(qWorld).normalize(),bb=new THREE.Vector3(0,0,1).applyQuaternion(qWorld).normalize(),hf=headForward().clone();const af=new THREE.Vector3(a.x,0,a.z);if(af.lengthSq()>0)af.normalize();const bf=new THREE.Vector3(bb.x,0,bb.z);if(bf.lengthSq()>0)bf.normalize();vDir.copy((bf.lengthSq()>0&&bf.dot(hf)>af.dot(hf)+.15)?bf:af);if(vDir.lengthSq()<1e-5)vDir.copy(hf);const t=clampTarget(vOrigin.x+vDir.x*aimDist,vOrigin.z+vDir.z*aimDist).clone();return magneticTarget(t)||t;}
  function handDirectionFromWrist(wrist,index){
    wrist.updateWorldMatrix?.(true,false); wrist.getWorldPosition(vWrist); wrist.getWorldQuaternion(qWorld);
    let best=new THREE.Vector3(0,0,-1).applyQuaternion(qWorld), hf=headForward().clone();
    const axes=[new THREE.Vector3(0,0,-1),new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0),new THREE.Vector3(0,-1,0)].map(a=>a.applyQuaternion(qWorld));
    axes.forEach(a=>{const flat=new THREE.Vector3(a.x,0,a.z); if(flat.lengthSq()>.001){flat.normalize(); if(flat.dot(hf)>best.dot(hf)) best.copy(flat);}});
    if(index){index.updateWorldMatrix?.(true,false); index.getWorldPosition(vIndex); const finger=vIndex.clone().sub(vWrist); finger.y=0; if(finger.lengthSq()>.003){finger.normalize(); if(finger.dot(hf)>-.25) best.lerp(finger,.55).normalize();}}
    best.y=0; if(best.lengthSq()<.001) best.copy(hf); return best.normalize();
  }
  function handAim(h){const wrist=h?.joints?.wrist,index=h?.joints?.["index-finger-tip"]; if(!wrist)return null; const dir=handDirectionFromWrist(wrist,index); vDir.copy(dir); vOrigin.copy(vWrist); const t=clampTarget(vOrigin.x+vDir.x*aimDist,vOrigin.z+vDir.z*aimDist).clone(); return magneticTarget(t)||t;}
  function teleportByDelta(target){if(!renderer?.xr?.isPresenting||!baseRefSpace)return false;try{const xr=renderer.xr.getCamera(camera);if(!xr)return false;xr.getWorldPosition(vHead);const p=solidXZ(playerX+(target.x-vHead.x),playerZ+(target.z-vHead.z));playerX=p.x;playerZ=p.z;if(!seated)playerY=floorHeightAt(playerX,playerZ);window.SVR_PHASE227_LAST_TELEPORT={build:LABEL,targetX:Number(target.x.toFixed(2)),targetZ:Number(target.z.toFixed(2)),playerX:Number(playerX.toFixed(2)),playerZ:Number(playerZ.toFixed(2)),checkedAt:new Date().toISOString()};return applyReferenceSpace();}catch(e){log("[3.1-G] teleport failed",e?.message||e);return false;}}
  function toggleMode(preferred="right"){mode=!mode;if(!mode){active=null;hideVisuals();return false;}aimDist=6.2;active=preferred==="left"?(leftControllerRef||leftHandRef):(rightHandRef||leftHandRef||rightControllerRef||leftControllerRef);activeMode=(active===leftHandRef||active===rightHandRef)?"hand":"controller";triggerHoldStart=performance.now();return true;}
  async function onSessionStart(){const session=renderer.xr.getSession();if(!session)return;baseRefSpace=await session.requestReferenceSpace("local-floor");playerX=CONFIG.SPAWN_X;playerY=0;playerZ=CONFIG.SPAWN_Z;playerYaw=0;seated=false;mode=false;active=null;aimDist=6.2;hideVisuals();applyReferenceSpace();setTimeout(maintainStanding,250);}
  function update({dt=.016,leftHand,rightHand,leftController,rightController,statusCb=()=>{},modeCb=()=>{}}){
    leftHandRef=leftHand; rightHandRef=rightHand; leftControllerRef=leftController; rightControllerRef=rightController; maintainStanding();
    const handsAvailable=!!(leftHandRef?.joints||rightHandRef?.joints);
    if(renderer?.xr?.isPresenting&&(leftControllerRef||rightControllerRef)&&!handsAvailable) moveControllers(dt);
    const now=performance.now(), rc=rightControllerRef||leftControllerRef, hold=triggerValue(rc), lf=!!leftHandRef?.joints&&isFist(leftHandRef), rf=!!rightHandRef?.joints&&isFist(rightHandRef);
    if(handsAvailable){
      const fistHand = rf ? rightHandRef : (lf ? leftHandRef : null);
      const activeFist = active === rightHandRef ? rf : active === leftHandRef ? lf : false;
      if(!mode && fistHand){ mode=true; active=fistHand; activeMode="hand"; fistHoldStart=now; aimDist=6.2; }
      if(!mode || !active){ hideVisuals(); statusCb("Ready • make fist to aim, release fist to leap"); modeCb("hands fist teleport"); return; }
      const target=handAim(active); if(!target){ hideVisuals(); return; }
      vSmooth.lerp(target,vSmooth.distanceTo(target)>1.5?.70:.42); showVisuals(vSmooth); updateBeam(vWrist.clone(),vSmooth); updateAura(vWrist.clone());
      const held=fistHoldStart?now-fistHoldStart:0;
      if(!activeFist && held>90 && now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){ if(teleportByDelta(vSmooth)){lastTP=now; mode=false; active=null; fistHoldStart=0; hideVisuals(); return;} }
      if(!activeFist && held<=90){ mode=false; active=null; fistHoldStart=0; hideVisuals(); return; }
      statusCb("Fist TP ON • release fist to leap"); modeCb(window.SVR_PHASE227_MAGNETIC_LOCK?"magnet target":"fist particle arc"); return;
    }
    if(renderer?.xr?.isPresenting&&(leftControllerRef||rightControllerRef)) moveControllers(dt);
    if(hold>.18&&rc){ if(!mode||active!==rc){mode=true;active=rc;activeMode="controller";triggerHoldStart=now;aimDist=6.2;} }
    if(!mode||!active){hideVisuals();statusCb((leftControllerRef||rightControllerRef)?"Ready • hold grip/trigger, stick adjusts close/far":"Ready • fist teleport");modeCb("standing lock");return;}
    const target=controllerAim(active); if(!target){hideVisuals();return;} vSmooth.lerp(target,vSmooth.distanceTo(target)>1.5?.70:.38); showVisuals(vSmooth); updateBeam(vOrigin.clone(),vSmooth);
    const cur=triggerValue(active),held=triggerHoldStart?now-triggerHoldStart:0; if(cur<=.12&&held>70&&now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){if(teleportByDelta(vSmooth)){lastTP=now;mode=false;active=null;hideVisuals();return;}} if(cur<=.12){mode=false;active=null;hideVisuals();return;} statusCb("Grip TP • any stick close/far • release to leap"); modeCb(window.SVR_PHASE227_MAGNETIC_LOCK?"magnet target":"controller particle arc");
  }
  return {onSessionStart,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled:()=>mode,getState:()=>({mode,activeMode,seated,aimDist,wallBlocks})};
}
