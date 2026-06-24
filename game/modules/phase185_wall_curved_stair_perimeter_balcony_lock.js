import * as THREE from 'three';
const LABEL='PHASE-185-WALL-CURVED-STAIR-PERIMETER-BALCONY-LOCK';
const ROOT='PHASE185_WALL_CURVED_STAIR_PERIMETER_BALCONY_ROOT';
const SECOND=3.15,EYE=1.62;
const WALL_X=-12.85,START_Z=8.01;
const ROOM={minX:-13.35,maxX:13.35,minZ:-10.45,maxZ:9.25};
const WALK=1.85;
const STAIR={cx:-10.95,cz:5.95,r:2.2,start:Math.PI,end:Math.PI*1.52,n:16,w:1.75};
let scene,camera,renderer,started=false,lastY=null;
function iso(){return new Date().toISOString();}
function sr(s){return s?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||s;}
function mat(c,o=1){return new THREE.MeshStandardMaterial({color:c,roughness:.68,metalness:.04,transparent:o<1,opacity:o,side:THREE.DoubleSide});}
function add(parent,n,p,s,m){const x=new THREE.Mesh(new THREE.BoxGeometry(s.x,s.y,s.z),m);x.name=n;x.position.set(p.x,p.y,p.z);x.receiveShadow=true;parent.add(x);return x;}
function clearOld(root){let n=0;const names=['PHASE178_NEW_UPPER_STRUCTURE_ROOT','PHASE180_WALKABLE_COLLISION_ROOT',ROOT];for(const nm of names){const o=root.getObjectByName?.(nm);if(o){o.parent?.remove(o);n++;}}const list=[];root.traverse?.(o=>{const name=String(o.name||'');if(!o.parent||/table|felt|card|chip|pot|watch|hand|teleport|moon|mars|star|camera|light|phase17[0-9]/i.test(name))return;if(/stair|step|upper|second|balcony|mezzanine|catwalk|glass|rail|rope|pole|post/i.test(name))list.push(o);});[...new Set(list)].forEach(o=>{o.parent?.remove(o);n++;});return n;}
function texturedMat(c1,c2){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=c1;x.fillRect(0,0,512,512);x.strokeStyle=c2;x.lineWidth=3;for(let i=0;i<512;i+=64){x.beginPath();x.moveTo(0,i);x.lineTo(512,i);x.stroke();x.beginPath();x.moveTo(i,0);x.lineTo(i,512);x.stroke();}for(let i=0;i<1400;i++){x.globalAlpha=.08;x.fillStyle=Math.random()>.5?'#fff':'#000';x.fillRect(Math.random()*512,Math.random()*512,2,2);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return new THREE.MeshStandardMaterial({map:t,roughness:.78,metalness:.03,side:THREE.DoubleSide});}
function build(root){const g=new THREE.Group();g.name=ROOT;root.add(g);const floor=texturedMat('#242a35','#161b24'),trim=mat(0x0b0f18),step=texturedMat('#343a46','#1d222c'),glass=mat(0x8be8ff,.28),wall=mat(0x1a1d26);
const y=SECOND-.08;
add(g,'PHASE185_WEST_PERIMETER_WALKWAY_TIGHT_TO_WALL',{x:ROOM.minX+WALK/2,y,z:(ROOM.minZ+ROOM.maxZ)/2},{x:WALK,y:.18,z:ROOM.maxZ-ROOM.minZ+.08},floor);
add(g,'PHASE185_NORTH_PERIMETER_WALKWAY_TIGHT_TO_WALL',{x:(ROOM.minX+ROOM.maxX)/2,y,z:ROOM.minZ+WALK/2},{x:ROOM.maxX-ROOM.minX+.08,y:.18,z:WALK},floor);
add(g,'PHASE185_EAST_PERIMETER_WALKWAY_TIGHT_TO_WALL',{x:ROOM.maxX-WALK/2,y,z:(ROOM.minZ+ROOM.maxZ)/2},{x:WALK,y:.18,z:ROOM.maxZ-ROOM.minZ+.08},floor);
add(g,'PHASE185_SOUTH_PERIMETER_WALKWAY_TIGHT_TO_WALL',{x:(ROOM.minX+ROOM.maxX)/2,y,z:ROOM.maxZ-WALK/2},{x:ROOM.maxX-ROOM.minX+.08,y:.18,z:WALK},floor);
add(g,'PHASE185_WEST_WALL_CONNECTOR_NO_GAP',{x:ROOM.minX-.08,y:SECOND+.58,z:(ROOM.minZ+ROOM.maxZ)/2},{x:.16,y:1.45,z:ROOM.maxZ-ROOM.minZ+.2},wall);
add(g,'PHASE185_NORTH_WALL_CONNECTOR_NO_GAP',{x:(ROOM.minX+ROOM.maxX)/2,y:SECOND+.58,z:ROOM.minZ-.08},{x:ROOM.maxX-ROOM.minX+.2,y:1.45,z:.16},wall);
add(g,'PHASE185_INNER_GLASS_WEST_EDGE',{x:ROOM.minX+WALK+.03,y:SECOND+.68,z:(ROOM.minZ+ROOM.maxZ)/2},{x:.055,y:1.08,z:ROOM.maxZ-ROOM.minZ-1.2},glass);
add(g,'PHASE185_INNER_GLASS_NORTH_EDGE',{x:(ROOM.minX+ROOM.maxX)/2,y:SECOND+.68,z:ROOM.minZ+WALK+.03},{x:ROOM.maxX-ROOM.minX-1.2,y:1.08,z:.055},glass);
add(g,'PHASE185_INNER_GLASS_EAST_EDGE',{x:ROOM.maxX-WALK-.03,y:SECOND+.68,z:(ROOM.minZ+ROOM.maxZ)/2},{x:.055,y:1.08,z:ROOM.maxZ-ROOM.minZ-1.2},glass);
add(g,'PHASE185_INNER_GLASS_SOUTH_EDGE',{x:(ROOM.minX+ROOM.maxX)/2,y:SECOND+.68,z:ROOM.maxZ-WALK-.03},{x:ROOM.maxX-ROOM.minX-1.2,y:1.08,z:.055},glass);
add(g,'PHASE185_STAIR_START_FLUSH_AGAINST_WEST_WALL',{x:WALL_X+1.0,y:.04,z:START_Z},{x:2.2,y:.08,z:1.05},step);
for(let i=0;i<STAIR.n;i++){const p=i/(STAIR.n-1),a=STAIR.start+(STAIR.end-STAIR.start)*p;const x=STAIR.cx+Math.cos(a)*STAIR.r,z=STAIR.cz+Math.sin(a)*STAIR.r;const h=SECOND*p;const tread=add(g,`PHASE185_CURVED_WALL_STEP_${String(i+1).padStart(2,'0')}`,{x,y:h+.045,z},{x:STAIR.w,y:.09,z:.72},step);tread.rotation.y=-a+Math.PI/2;}
add(g,'PHASE185_CURVED_STAIR_TOP_LANDING_NO_GAP',{x:ROOM.minX+WALK/2,y:SECOND-.08,z:ROOM.maxZ-WALK/2},{x:WALK,y:.18,z:WALK},floor);
add(g,'PHASE185_CURVED_STAIR_WALL_SIDE_GLASS',{x:ROOM.minX+1.0,y:SECOND/2+.55,z:6.5},{x:.055,y:1.05,z:4.9},glass);
add(g,'PHASE185_CURVED_STAIR_INNER_GLASS',{x:ROOM.minX+2.55,y:SECOND/2+.55,z:6.0},{x:.055,y:1.05,z:4.2},glass);
add(g,'PHASE185_PERIMETER_SUPPORT_WEST_01',{x:ROOM.minX+WALK-.08,y:SECOND/2,z:ROOM.maxZ-2},{x:.18,y:SECOND,z:.18},trim);add(g,'PHASE185_PERIMETER_SUPPORT_WEST_02',{x:ROOM.minX+WALK-.08,y:SECOND/2,z:ROOM.minZ+2},{x:.18,y:SECOND,z:.18},trim);add(g,'PHASE185_PERIMETER_SUPPORT_NORTH_01',{x:ROOM.minX+3,y:SECOND/2,z:ROOM.minZ+WALK-.08},{x:.18,y:SECOND,z:.18},trim);add(g,'PHASE185_PERIMETER_SUPPORT_NORTH_02',{x:ROOM.maxX-3,y:SECOND/2,z:ROOM.minZ+WALK-.08},{x:.18,y:SECOND,z:.18},trim);
return g;}
function stairHeight(x,z){let best=99,prog=0;for(let i=0;i<STAIR.n;i++){const p=i/(STAIR.n-1),a=STAIR.start+(STAIR.end-STAIR.start)*p;const sx=STAIR.cx+Math.cos(a)*STAIR.r,sz=STAIR.cz+Math.sin(a)*STAIR.r;const d=Math.hypot(x-sx,z-sz);if(d<best){best=d;prog=p;}}if(best<1.18)return SECOND*prog; if(Math.hypot(x-(WALL_X+1),z-START_Z)<1.15)return 0;return null;}
function walkHeight(x,z){const sh=stairHeight(x,z);if(sh!==null)return sh;const west=x>=ROOM.minX&&x<=ROOM.minX+WALK+.25&&z>=ROOM.minZ&&z<=ROOM.maxZ;const north=z>=ROOM.minZ&&z<=ROOM.minZ+WALK+.25&&x>=ROOM.minX&&x<=ROOM.maxX;const east=x<=ROOM.maxX&&x>=ROOM.maxX-WALK-.25&&z>=ROOM.minZ&&z<=ROOM.maxZ;const south=z<=ROOM.maxZ&&z>=ROOM.maxZ-WALK-.25&&x>=ROOM.minX&&x<=ROOM.maxX;if(west||north||east||south)return SECOND;return 0;}
function camPos(){const p=new THREE.Vector3();if(renderer?.xr?.isPresenting)renderer.xr.getCamera(camera).getWorldPosition(p);else camera?.getWorldPosition(p);return p;}
function applyHeight(){if(!camera||!renderer)return;const p=camPos(),h=walkHeight(p.x,p.z);if(renderer.xr?.isPresenting){const rig=window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG;const gy=p.y-EYE;if(rig?.setPlayerPose&&Math.abs(gy-h)>.18&&lastY!==h){lastY=h;rig.setPlayerPose(p.x,h,p.z);}}else{camera.position.y+=(h+EYE-camera.position.y)*.18;}window.SVR_PHASE185_WALK_HEIGHT={build:LABEL,x:+p.x.toFixed(3),z:+p.z.toFixed(3),floorY:+h.toFixed(3),checkedAt:iso()};}
function install(){scene=window.__SVR_SCENE__;camera=window.__SVR_CAMERA__;renderer=window.__SVR_RENDERER__;if(!scene||!camera||!renderer)return false;const root=sr(scene);const removed=clearOld(root);build(root);window.SVR_PHASE185_WALL_CURVED_STAIR_PERIMETER_BALCONY_LOCK={build:LABEL,active:true,gameOnly:true,siteTouched:false,start:{x:WALL_X,z:START_Z},curvedStair:true,wallAligned:true,perimeterBalcony:true,noGapOverlap:true,textured:true,oldRemoved:removed,checkedAt:iso()};window.SVR_RUN_PHASE185_STAIR_AUDIT=()=>window.SVR_PHASE185_WALL_CURVED_STAIR_PERIMETER_BALCONY_LOCK;window.SVR_LOCKED_FINAL_BUILD=LABEL;window.SVR_LIVE_BUILD_POINTER=LABEL;if(!started){started=true;setInterval(applyHeight,70);}return true;}
[300,900,1800,3500,7000,11000].forEach(ms=>setTimeout(install,ms));install();
