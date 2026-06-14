import * as THREE from "three";
import { CONFIG } from "./config.js";
import { isPinching, isFist } from "./gestures.js";
import { constrainLobbyBounds } from "./phase178_bounds.js";

const LABEL = "UPDATE-3.1-D-QUEST-ALIGNMENT-CONTROL-OVERLAY-FIX";
const CYAN=0x7ffcff, PURPLE=0xb55cff, GOLD=0xffd98a;
const STAND_EYE_Y = 1.62;

export function createTeleportRig({ scene, renderer, camera, roomClamp, log=console.log }){
  let baseRefSpace=null, playerX=CONFIG.SPAWN_X, playerY=0, playerZ=CONFIG.SPAWN_Z, playerYaw=0;
  let seated=false, mode=false, active=null, activeMode="controller";
  let lastTP=0, triggerHoldStart=0, fistHoldStart=0, pinchHoldStart=0, snapCooldownUntil=0;
  let aimDist=6.2, leftHandRef=null, rightHandRef=null, leftControllerRef=null, rightControllerRef=null, wallBlocks=0;
  const vHead=new THREE.Vector3(), vHead2=new THREE.Vector3(), vForward=new THREE.Vector3(), vYawForward=new THREE.Vector3(), vOrigin=new THREE.Vector3(), vDir=new THREE.Vector3(), vTarget=new THREE.Vector3(), vSmooth=new THREE.Vector3(CONFIG.SPAWN_X,0,CONFIG.SPAWN_Z), vWrist=new THREE.Vector3(), vIndex=new THREE.Vector3(), qWorld=new THREE.Quaternion();

  function floorHeightAt(x,z){
    const f=window.SVR_PHASE224_FLOOR_HEIGHT||window.SVR_PHASE215_FLOOR_HEIGHT||window.SVR_PHASE214_FLOOR_HEIGHT||window.SVR_PHASE213_FLOOR_HEIGHT||window.SVR_PHASE212_FLOOR_HEIGHT;
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
    try{const h=-playerYaw*.5; const xf=new XRRigidTransform({x:-playerX,y:-playerY,z:-playerZ},{x:0,y:Math.sin(h),z:0,w:Math.cos(h)}); renderer.xr.setReferenceSpace(baseRefSpace.getOffsetReferenceSpace(xf)); return true;}catch(e){log("[3.1-D] ref failed",e?.message||e); return false;}
  }
  function xrHead(out){const xr=renderer.xr.getCamera(camera); if(!xr)return false; xr.getWorldPosition(out); return true;}
  function targetStandingY(){return floorHeightAt(playerX,playerZ) + STAND_EYE_Y;}
  function maintainStanding(){
    if(seated || !renderer?.xr?.isPresenting || !baseRefSpace) return;
    if(!xrHead(vHead)) return;
    const desired=targetStandingY();
    const err=desired-vHead.y;
    if(Math.abs(err)>0.035){playerY += THREE.MathUtils.clamp(err,-0.08,0.08); playerY=THREE.MathUtils.clamp(playerY,floorHeightAt(playerX,playerZ)-.35,floorHeightAt(playerX,playerZ)+1.45); applyReferenceSpace();}
    window.SVR_PHASE224_STANDING_LOCK={build:LABEL,standing:!seated,headY:Number(vHead.y.toFixed(2)),targetY:Number(desired.toFixed(2)),playerY:Number(playerY.toFixed(2)),checkedAt:new Date().toISOString()};
  }
  function setPlayerPose(x,y,z){const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; seated=Number.isFinite(y)&&y<-.25; playerY=seated?y:floorHeightAt(playerX,playerZ); return applyReferenceSpace();}
  function setPlayerXZ(x,z){const p=solidXZ(x,z); playerX=p.x; playerZ=p.z; if(!seated) playerY=floorHeightAt(playerX,playerZ); return applyReferenceSpace();}
  function getPlayerPose(){return {x:playerX,y:playerY,z:playerZ,yaw:playerYaw,seated,aimDist,wallBlocks};}
  function setPlayerYaw(yaw){playerYaw=yaw;return applyReferenceSpace();}
  function snapTurnInPlace(delta){
    if(!renderer?.xr?.isPresenting){playerYaw+=delta;applyReferenceSpace();return;}
    xrHead(vHead); playerYaw += delta; applyReferenceSpace();
    for(let i=0;i<3;i++){xrHead(vHead2); const dx=vHead.x-vHead2.x, dz=vHead.z-vHead2.z; playerX+=dx; playerZ+=dz; if(!seated)playerY=floorHeightAt(playerX,playerZ); applyReferenceSpace(); if(Math.hypot(dx,dz)<.012)break;}
    window.SVR_PHASE224_SNAP_TURN={build:LABEL,yaw:Number(playerYaw.toFixed(3)),inPlace:true,checkedAt:new Date().toISOString()};
  }

  const pointer=new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.POINTER_SIZE*1.28,CONFIG.POINTER_SIZE*1.28),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,alphaTest:.18,opacity:.98,side:THREE.DoubleSide,depthWrite:false,depthTest:false})); pointer.name="UPDATE31D_TELEPORT_LOGO_TARGET"; pointer.rotation.x=-Math.PI/2; pointer.renderOrder=4000; pointer.visible=false; scene.add(pointer);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.62,1.08,128),new THREE.MeshBasicMaterial({color:PURPLE,transparent:true,opacity:.96,side:THREE.DoubleSide,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending})); ring.name="UPDATE31D_PURPLE_GOLD_TARGET_RING"; ring.rotation.x=-Math.PI/2; ring.visible=false; ring.renderOrder=3999; scene.add(ring);
  const beamGeo=new THREE.BufferGeometry(); const beam=new THREE.Points(beamGeo,new THREE.PointsMaterial({color:CYAN,size:.145,sizeAttenuation:true,transparent:true,opacity:.88,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending})); beam.name="UPDATE31D_CONTINUOUS_CYAN_PARTICLE_ARCH_BEAM"; beam.frustumCulled=false; beam.visible=false; beam.renderOrder=4001; scene.add(beam);
  const lineGeo=new THREE.BufferGeometry(); const line=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:GOLD,transparent:true,opacity:.78,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending})); line.name="UPDATE31D_GOLD_FLARE_CENTER_BEAM"; line.visible=false; line.renderOrder=4000; scene.add(line);
  const glow=new THREE.PointLight(CYAN,0,8,1.8); scene.add(glow);
  const handGlowMat=new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}); const handGlow=new THREE.Mesh(new THREE.SphereGeometry(.15,20,12),handGlowMat); handGlow.visible=false; scene.add(handGlow);
  function setLogoTexture(tex){if(tex){tex.anisotropy=1; pointer.material.map=tex; pointer.material.needsUpdate=true;}}
  function hideVisuals(){pointer.visible=false;ring.visible=false;beam.visible=false;line.visible=false;glow.intensity=0;handGlow.visible=false;handGlowMat.opacity=0;}
  function showVisuals(t){pointer.visible=true;ring.visible=true;pointer.position.copy(t).setY(t.y+.026);ring.position.copy(t).setY(t.y+.018);glow.position.copy(t).setY(t.y+.38);glow.intensity=3.0;}
  function archPts(o,t){const pts=[],start=o.clone(),end=t.clone().setY(t.y+.1),dist=start.distanceTo(end),mid=start.clone().lerp(end,.5); mid.y+=THREE.MathUtils.clamp(dist*.18,1.0,3.1); for(let i=0;i<96;i++){const u=i/95,a=start.clone().lerp(mid,u),b=mid.clone().lerp(end,u),p=a.lerp(b,u); const flare=Math.sin(u*Math.PI*16+performance.now()*.018)*.014; p.x+=flare;p.z+=Math.cos(u*Math.PI*14+performance.now()*.014)*.012; pts.push(p);} return pts;}
  function updateBeam(o,t){if(!o||!t){beam.visible=false;line.visible=false;return;}const pts=archPts(o,t);beamGeo.setFromPoints(pts);lineGeo.setFromPoints(pts);beam.visible=true;line.visible=true;}
  function clampTarget(x,z){const p=solidXZ(x,z);return vTarget.set(p.x,floorHeightAt(p.x,p.z),p.z);}
  function gp(proxy){return proxy?.userData?.gamepad||proxy?.userData?.inputSource?.gamepad||proxy?.userData?.controller?.inputSource?.gamepad||null;}
  function b(g,i){const q=g?.buttons?.[i];return Math.max(q?.value||0,q?.pressed?1:0);}
  function triggerValue(proxy){const g=gp(proxy);return Math.max(b(g,0),b(g,1),b(g,2),b(g,3),b(g,4),b(g,5));}
  function stick(g,side="right"){if(!g?.axes?.length)return{x:0,y:0};let x=0,y=0;if(side==="right"&&g.axes.length>=4){x=g.axes[2]||0;y=g.axes[3]||0;if(Math.abs(x)<.01&&Math.abs(y)<.01){x=g.axes[0]||0;y=g.axes[1]||0;}}else{x=g.axes[0]||0;y=g.axes[1]||0;}if(Math.abs(x)<.18)x=0;if(Math.abs(y)<.18)y=0;return{x,y};}
  function headForward(){const xr=renderer.xr.getCamera(camera)||camera,src=xr?.cameras?.[0]||xr;src?.updateWorldMatrix?.(true,false);src.getWorldDirection(vForward);vForward.y=0;if(vForward.lengthSq()<1e-5)vForward.set(0,0,-1);return vForward.normalize();}
  function yawForward(){vYawForward.set(Math.sin(playerYaw),0,-Math.cos(playerYaw)); if(vYawForward.lengthSq()<1e-5)vYawForward.set(0,0,-1); return vYawForward.normalize();}
  function movementForward(){const h=headForward().clone(), y=yawForward().clone(); return Math.abs(playerYaw)>.001 && h.dot(y)<.55 ? y : h;}
  function magneticTarget(t){
    let best=null,bestD=2.35;
    scene.traverse(o=>{ if(!o?.userData?.svrMagnetTarget && !/^UPDATE31D_MAGNET_/i.test(String(o.name||""))) return; const p=new THREE.Vector3(); o.getWorldPosition(p); const d=Math.hypot(p.x-t.x,p.z-t.z); if(d<bestD){bestD=d; best=p;} });
    if(!best){ window.SVR_PHASE224_MAGNETIC_LOCK=null; return null; }
    const target=clampTarget(best.x,best.z).clone();
    window.SVR_PHASE224_MAGNETIC_LOCK={build:LABEL,active:true,x:Number(target.x.toFixed(2)),z:Number(target.z.toFixed(2)),dist:Number(bestD.toFixed(2)),checkedAt:new Date().toISOString()};
    return target;
  }
  function moveControllers(dt){
    const gR=gp(rightControllerRef),gL=gp(leftControllerRef),r=stick(gR,"right"),l=stick(gL,"left"),now=performance.now();
    if(mode){const y=Math.abs(r.y)>.14?r.y:l.y; if(Math.abs(y)>.14)aimDist=THREE.MathUtils.clamp(aimDist + (-y)*12.0*dt,1.4,24.0); window.SVR_PHASE224_AIM_DISTANCE=Number(aimDist.toFixed(2)); return;}
    if(Math.abs(r.x)>.76&&now>snapCooldownUntil){snapTurnInPlace(Math.sign(r.x)*Math.PI/4);snapCooldownUntil=now+320;}
    const y=Math.abs(r.y)>.14?r.y:l.y;if(Math.abs(y)<.14)return;
    const f=movementForward().clone(),move=-y,speed=4.15;
    setPlayerXZ(playerX+f.x*move*speed*dt,playerZ+f.z*move*speed*dt);
    window.SVR_PHASE224_MOVE_VECTOR={build:LABEL,x:Number(f.x.toFixed(3)),z:Number(f.z.toFixed(3)),yaw:Number(playerYaw.toFixed(3)),checkedAt:new Date().toISOString()};
  }
  function controllerAim(proxy){const c=proxy?.userData?.controller||proxy;if(!c)return null;c.updateWorldMatrix?.(true,false);c.getWorldPosition(vOrigin);c.getWorldQuaternion(qWorld);const a=new THREE.Vector3(0,0,-1).applyQuaternion(qWorld).normalize(),bb=new THREE.Vector3(0,0,1).applyQuaternion(qWorld).normalize(),hf=headForward().clone();const af=new THREE.Vector3(a.x,0,a.z);if(af.lengthSq()>0)af.normalize();const bf=new THREE.Vector3(bb.x,0,bb.z);if(bf.lengthSq()>0)bf.normalize();vDir.copy((bf.lengthSq()>0&&bf.dot(hf)>af.dot(hf)+.15)?bf:af);if(vDir.lengthSq()<1e-5)vDir.copy(hf);const t=clampTarget(vOrigin.x+vDir.x*aimDist,vOrigin.z+vDir.z*aimDist).clone();return magneticTarget(t)||t;}
  function handAim(h){const wrist=h?.joints?.wrist,index=h?.joints?.["index-finger-tip"];if(!wrist||!index)return null;wrist.updateWorldMatrix?.(true,false);index.updateWorldMatrix?.(true,false);wrist.getWorldPosition(vWrist);index.getWorldPosition(vIndex);vDir.copy(vIndex).sub(vWrist);vDir.y=0;if(vDir.lengthSq()<.005)vDir.copy(headForward());else vDir.normalize();const hf=headForward().clone();if(vDir.dot(hf)<-.1)vDir.multiplyScalar(-1);vOrigin.copy(vIndex).lerp(vWrist,.35);const t=clampTarget(vOrigin.x+vDir.x*aimDist,vOrigin.z+vDir.z*aimDist).clone();return magneticTarget(t)||t;}
  function teleportByDelta(target){if(!renderer?.xr?.isPresenting||!baseRefSpace)return false;try{const xr=renderer.xr.getCamera(camera);if(!xr)return false;xr.getWorldPosition(vHead);const p=solidXZ(playerX+(target.x-vHead.x),playerZ+(target.z-vHead.z));playerX=p.x;playerZ=p.z;if(!seated)playerY=floorHeightAt(playerX,playerZ);return applyReferenceSpace();}catch(e){log("[3.1-D] teleport failed",e?.message||e);return false;}}
  function toggleMode(preferred="right"){mode=!mode;if(!mode){active=null;hideVisuals();return false;}aimDist=6.2;active=preferred==="left"?(leftControllerRef||leftHandRef):(rightControllerRef||rightHandRef||leftControllerRef||leftHandRef);activeMode=(active===leftHandRef||active===rightHandRef)?"hand":"controller";triggerHoldStart=performance.now();return true;}
  async function onSessionStart(){const session=renderer.xr.getSession();if(!session)return;baseRefSpace=await session.requestReferenceSpace("local-floor");playerX=CONFIG.SPAWN_X;playerY=0;playerZ=CONFIG.SPAWN_Z;playerYaw=0;seated=false;mode=false;active=null;aimDist=6.2;hideVisuals();applyReferenceSpace();setTimeout(maintainStanding,250);}
  function update({dt=.016,leftHand,rightHand,leftController,rightController,statusCb=()=>{},modeCb=()=>{}}){leftHandRef=leftHand;rightHandRef=rightHand;leftControllerRef=leftController;rightControllerRef=rightController;maintainStanding();if(renderer?.xr?.isPresenting&&(leftControllerRef||rightControllerRef))moveControllers(dt);const now=performance.now(),rc=rightControllerRef||leftControllerRef,hold=triggerValue(rc),lf=!!leftHandRef?.joints&&isFist(leftHandRef),rf=!!rightHandRef?.joints&&isFist(rightHandRef);if(hold>.18&&rc){if(!mode||active!==rc){mode=true;active=rc;activeMode="controller";triggerHoldStart=now;aimDist=6.2;}}else if(!mode&&(rf||lf)){active=rf?rightHandRef:leftHandRef;mode=true;activeMode="hand";fistHoldStart=now;aimDist=6.2;}if(!mode||!active){hideVisuals();statusCb((leftControllerRef||rightControllerRef)?"Ready • hold grip/trigger, stick adjusts close/far":"Ready • fist teleport");modeCb("standing lock");return;}const target=activeMode==="controller"?controllerAim(active):handAim(active);if(!target){hideVisuals();return;}vSmooth.lerp(target,vSmooth.distanceTo(target)>1.5?.70:.38);showVisuals(vSmooth);updateBeam(activeMode==="controller"?vOrigin.clone():vWrist.clone(),vSmooth);if(activeMode==="hand"){handGlow.position.copy(vWrist);handGlow.visible=true;handGlowMat.opacity=.78;}if(activeMode==="controller"){const cur=triggerValue(active),held=triggerHoldStart?now-triggerHoldStart:0;if(cur<=.12&&held>70&&now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){if(teleportByDelta(vSmooth)){lastTP=now;mode=false;active=null;hideVisuals();return;}}if(cur<=.12){mode=false;active=null;hideVisuals();return;}statusCb("Grip TP • right stick close/far • release to leap");modeCb(window.SVR_PHASE224_MAGNETIC_LOCK?"magnet target":"continuous beam");return;}const af=active===rightHandRef?rf:lf,pinch=isPinching(active);if(pinch&&!pinchHoldStart)pinchHoldStart=now;const fh=fistHoldStart?now-fistHoldStart:0,ph=pinchHoldStart?now-pinchHoldStart:0;if((!af&&fh>80||pinch&&ph>120)&&now-lastTP>CONFIG.TELEPORT_COOLDOWN_MS){if(teleportByDelta(vSmooth)){lastTP=now;mode=false;active=null;fistHoldStart=0;pinchHoldStart=0;hideVisuals();return;}}if(!pinch)pinchHoldStart=0;}
  return {onSessionStart,setLogoTexture,update,setPlayerPose,setPlayerXZ,getPlayerPose,setPlayerYaw,toggleMode,isEnabled:()=>mode,getState:()=>({mode,activeMode,seated,aimDist,wallBlocks})};
}
