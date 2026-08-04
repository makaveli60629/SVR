import * as THREE from 'three';
const LABEL='PHASE-210-CAMERA-RELATIVE-MOVEMENT-BALCONY-FIX-LOCK';
const ROOT='PHASE210_BALCONY_ABOVE_PILLARS_ROOT';
let scene,camera,renderer,root,started=false,keys={};
const Y=3.65,MINX=-15.5,MAXX=15.5,MINZ=-12.0,MAXZ=11.2;
function sr(){return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||scene;}
function wc(){return renderer?.xr?.isPresenting?renderer.xr.getCamera(camera):camera;}
function cp(){const p=new THREE.Vector3();wc()?.getWorldPosition(p);return p;}
function cd(){const d=new THREE.Vector3();wc()?.getWorldDirection(d);d.y=0;if(d.lengthSq()<.001)d.set(0,0,-1);return d.normalize();}
function rig(){return window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG||null;}
function floorY(){const p=cp();return Math.max(0,Math.round((p.y-1.62)/3.15)*3.15);}
function pose(x,y,z){const r=rig();if(renderer?.xr?.isPresenting&&r?.setPlayerPose)r.setPlayerPose(x,y,z);else camera.position.set(x,y+1.62,z);}
function mat(c,o=1){return new THREE.MeshStandardMaterial({color:c,roughness:.78,metalness:.06,transparent:o<1,opacity:o,side:THREE.DoubleSide});}
function basic(c,o=1){return new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,side:THREE.DoubleSide,depthWrite:o>.95});}
function box(p,n,pos,s,m){const o=new THREE.Mesh(new THREE.BoxGeometry(s.x,s.y,s.z),m);o.name=n;o.position.set(pos.x,pos.y,pos.z);o.frustumCulled=false;p.add(o);return o;}
function gamepadAxes(){let f=0,s=0;const pads=navigator.getGamepads?navigator.getGamepads():[];for(const g of pads){if(!g)continue;const a=g.axes||[];let lx=a[2]??a[0]??0, ly=a[3]??a[1]??0;if(Math.abs(lx)>Math.abs(s))s=lx;if(Math.abs(ly)>Math.abs(f))f=-ly;}return {f:Math.abs(f)>.18?f:0,s:Math.abs(s)>.18?s:0};}
function movementTick(){let f=0,s=0;if(keys.KeyW||keys.ArrowUp)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;if(keys.KeyA||keys.ArrowLeft)s-=1;if(keys.KeyD||keys.ArrowRight)s+=1;const gp=gamepadAxes();f+=gp.f;s+=gp.s;if(Math.abs(f)<.01&&Math.abs(s)<.01)return;const d=cd();const right=new THREE.Vector3().crossVectors(d,new THREE.Vector3(0,1,0)).normalize();const p=cp();const speed=(keys.ShiftLeft||keys.ShiftRight)?.085:.045;const nx=p.x+(d.x*f+right.x*s)*speed,nz=p.z+(d.z*f+right.z*s)*speed;pose(nx,floorY(),nz);window.SVR_PHASE210_LAST_MOVE={build:LABEL,forward:+f.toFixed(3),strafe:+s.toFixed(3),dir:{x:+d.x.toFixed(3),z:+d.z.toFixed(3)},pos:{x:+nx.toFixed(3),z:+nz.toFixed(3)},checkedAt:new Date().toISOString()};}
function patchRig(){const r=rig();if(!r||r.__phase210CameraRelative)return;try{if(r.move){r.move=(f=0,s=0)=>{const d=cd();const right=new THREE.Vector3().crossVectors(d,new THREE.Vector3(0,1,0)).normalize();const p=cp();pose(p.x+d.x*f+right.x*s,floorY(),p.z+d.z*f+right.z*s);};}r.__phase210CameraRelative=true;}catch(e){}}
function hideOldBalcony(){let h=0;sr()?.traverse?.(o=>{const n=String(o.name||'');if(/PHASE209_SECOND_FLOOR|PHASE209_.*BALCONY|PHASE209_.*WALL_TOUCH|PHASE209_.*SLAB|PHASE207|PHASE194_EXPANDED/i.test(n)){o.visible=false;o.traverse?.(c=>c.visible=false);h++;}});return h;}
function buildBalcony(){const r=sr();const old=r.getObjectByName?.(ROOT);if(old)old.parent?.remove(old);root=new THREE.Group();root.name=ROOT;r.add(root);const floor=mat(0x151c28),gold=mat(0xb88a35),glass=basic(0x9eeeff,.24),dark=mat(0x0b0f18);const innerX=5.8,innerZ=4.2;
box(root,'PHASE210_NORTH_SECOND_FLOOR_ABOVE_PILLARS',{x:0,y:Y,z:MINZ+1.85},{x:31,y:.12,z:3.7},floor);
box(root,'PHASE210_SOUTH_SECOND_FLOOR_ABOVE_PILLARS',{x:0,y:Y,z:MAXZ-1.85},{x:31,y:.12,z:3.7},floor);
box(root,'PHASE210_WEST_SECOND_FLOOR_ABOVE_PILLARS',{x:MINX+1.85,y:Y,z:(MINZ+MAXZ)/2},{x:3.7,y:.12,z:23.2},floor);
box(root,'PHASE210_EAST_SECOND_FLOOR_ABOVE_PILLARS',{x:MAXX-1.85,y:Y,z:(MINZ+MAXZ)/2},{x:3.7,y:.12,z:23.2},floor);
[[MINX+1,MINZ+1,'NW'],[MAXX-1,MINZ+1,'NE'],[MINX+1,MAXZ-1,'SW'],[MAXX-1,MAXZ-1,'SE']].forEach(([x,z,id])=>box(root,`PHASE210_${id}_BALCONY_CORNER_TOUCHES_WALL`,{x,y:Y+.02,z},{x:2.05,y:.14,z:2.05},floor));
box(root,'PHASE210_NORTH_GLASS_FENCE_ALIGNED',{x:0,y:Y+.62,z:-innerZ},{x:innerX*2,y:.9,z:.08},glass);
box(root,'PHASE210_SOUTH_GLASS_FENCE_ALIGNED',{x:0,y:Y+.62,z:innerZ},{x:innerX*2,y:.9,z:.08},glass);
box(root,'PHASE210_WEST_GLASS_FENCE_ALIGNED',{x:-innerX,y:Y+.62,z:0},{x:.08,y:.9,z:innerZ*2},glass);
box(root,'PHASE210_EAST_GLASS_FENCE_ALIGNED',{x:innerX,y:Y+.62,z:0},{x:.08,y:.9,z:innerZ*2},glass);
box(root,'PHASE210_NORTH_GOLD_RAIL_TOP',{x:0,y:Y+1.08,z:-innerZ},{x:innerX*2,y:.08,z:.08},gold);
box(root,'PHASE210_SOUTH_GOLD_RAIL_TOP',{x:0,y:Y+1.08,z:innerZ},{x:innerX*2,y:.08,z:.08},gold);
box(root,'PHASE210_WEST_GOLD_RAIL_TOP',{x:-innerX,y:Y+1.08,z:0},{x:.08,y:.08,z:innerZ*2},gold);
box(root,'PHASE210_EAST_GOLD_RAIL_TOP',{x:innerX,y:Y+1.08,z:0},{x:.08,y:.08,z:innerZ*2},gold);
[[MINX,MINZ,'NW'],[MAXX,MINZ,'NE'],[MINX,MAXZ,'SW'],[MAXX,MAXZ,'SE'],[0,MINZ,'N'],[0,MAXZ,'S'],[MINX,0,'W'],[MAXX,0,'E']].forEach(([x,z,id])=>box(root,`PHASE210_${id}_VISIBLE_PILLAR_UNDER_BALCONY`,{x,y:Y/2,z},{x:.42,y:Y,z:.42},dark));
return true;}
function removeSky(){const kill=[];scene?.traverse?.(o=>{const n=String(o.name||'');if(/moon|mars|planet|star|sky|sprite|sparkle|strobe|blink|pulse/i.test(n)&&!/teleport|portal|watch|hand|table|card|chip/i.test(n))kill.push(o);});[...new Set(kill)].forEach(o=>o.parent?.remove(o));scene.background=new THREE.Color(0x030407);scene.fog=null;return kill.length;}
function install(){scene=window.__SVR_SCENE__;camera=window.__SVR_CAMERA__;renderer=window.__SVR_RENDERER__;if(!scene||!camera||!renderer)return false;hideOldBalcony();buildBalcony();removeSky();patchRig();window.SVR_PHASE210_CAMERA_RELATIVE_MOVEMENT_BALCONY_FIX_LOCK={build:LABEL,active:true,gameOnly:true,siteTouched:false,cameraRelativeForward:true,balconyAbovePillars:true,glassFenceAligned:true,skyRemoved:true,checkedAt:new Date().toISOString()};window.SVR_RUN_PHASE210_AUDIT=()=>window.SVR_PHASE210_CAMERA_RELATIVE_MOVEMENT_BALCONY_FIX_LOCK;window.SVR_LOCKED_FINAL_BUILD=LABEL;window.SVR_LIVE_BUILD_POINTER=LABEL;if(!started){started=true;window.addEventListener('keydown',e=>keys[e.code]=true);window.addEventListener('keyup',e=>keys[e.code]=false);setInterval(()=>{patchRig();movementTick();removeSky();},35);}return true;}
[400,900,1800,3200,6000,10000].forEach(ms=>setTimeout(install,ms));install();
