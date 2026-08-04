import * as THREE from 'three';
const LABEL='PHASE-180-WALKABLE-COLLISION-LOCK';
const ROOT='PHASE180_WALKABLE_COLLISION_ROOT';
const SECOND=3.15, EYE=1.62;
const STAIR={x:-6.8,w:2.25,z0:3.4,z1:-6.05,n:18};
const BAL={x:0,z:-7.35,w:12.6,d:2.85};
let scene,camera,renderer,root,started=false,lastY=null;
function iso(){return new Date().toISOString();}
function sr(s){return s?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||s;}
function mat(c,o=.12){return new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,side:THREE.DoubleSide,depthWrite:false});}
function add(parent,n,p,s){const m=new THREE.Mesh(new THREE.BoxGeometry(s.x,s.y,s.z),mat(0x7ffcff,.10));m.name=n;m.position.set(p.x,p.y,p.z);m.visible=false;parent.add(m);return m;}
function build(){const r=sr(scene); if(!r)return false; const old=r.getObjectByName?.(ROOT); if(old)old.parent?.remove(old); root=new THREE.Group(); root.name=ROOT; r.add(root); add(root,'PHASE180_BALCONY_FRONT_BLOCK',{x:BAL.x,y:SECOND+.72,z:BAL.z+BAL.d/2+.33},{x:BAL.w,y:1.6,z:.28}); add(root,'PHASE180_BALCONY_LEFT_BLOCK',{x:-BAL.w/2-.33,y:SECOND+.72,z:BAL.z},{x:.28,y:1.6,z:BAL.d}); add(root,'PHASE180_BALCONY_RIGHT_BLOCK',{x:BAL.w/2+.33,y:SECOND+.72,z:BAL.z},{x:.28,y:1.6,z:BAL.d}); add(root,'PHASE180_STAIR_LEFT_BLOCK',{x:STAIR.x-STAIR.w/2-.32,y:SECOND/2+.5,z:(STAIR.z0+STAIR.z1)/2},{x:.28,y:2.2,z:Math.abs(STAIR.z1-STAIR.z0)}); add(root,'PHASE180_STAIR_RIGHT_BLOCK',{x:STAIR.x+STAIR.w/2+.32,y:SECOND/2+.5,z:(STAIR.z0+STAIR.z1)/2},{x:.28,y:2.2,z:Math.abs(STAIR.z1-STAIR.z0)}); return true;}
function hAt(x,z){if(Math.abs(x-STAIR.x)<STAIR.w/2+.2&&z<=Math.max(STAIR.z0,STAIR.z1)&&z>=Math.min(STAIR.z0,STAIR.z1)){const p=(STAIR.z0-z)/(STAIR.z0-STAIR.z1);return THREE.MathUtils.clamp(p,0,1)*SECOND;} if(Math.abs(x-BAL.x)<BAL.w/2&&Math.abs(z-BAL.z)<BAL.d/2+.25)return SECOND; return 0;}
function camPos(){const p=new THREE.Vector3(); if(renderer?.xr?.isPresenting)renderer.xr.getCamera(camera).getWorldPosition(p); else camera?.getWorldPosition(p); return p;}
function tick(){if(!camera||!renderer)return; const p=camPos(),h=hAt(p.x,p.z); if(renderer.xr?.isPresenting){const rig=window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG; const gy=p.y-EYE; if(rig?.setPlayerPose&&Math.abs(gy-h)>.18&&lastY!==h){lastY=h; rig.setPlayerPose(p.x,h,p.z);}}else{camera.position.y+=(h+EYE-camera.position.y)*.2;} window.SVR_PHASE180_WALKABLE_COLLISION_LOCK={build:LABEL,active:true,gameOnly:true,siteTouched:false,walkHeight:h,barriers:true,checkedAt:iso()};}
function install(){scene=window.__SVR_SCENE__; camera=window.__SVR_CAMERA__; renderer=window.__SVR_RENDERER__; if(!scene||!camera||!renderer)return false; build(); if(!started){started=true; setInterval(tick,70);} window.SVR_RUN_PHASE180_COLLISION_AUDIT=()=>window.SVR_PHASE180_WALKABLE_COLLISION_LOCK; window.SVR_LOCKED_FINAL_BUILD=LABEL; window.SVR_LIVE_BUILD_POINTER=LABEL; return true;}
[300,900,1800,3500,7000].forEach(ms=>setTimeout(install,ms)); install();
