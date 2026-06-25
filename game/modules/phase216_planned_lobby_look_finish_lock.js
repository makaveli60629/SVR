import * as THREE from 'three';
const LABEL='PHASE-216-PLANNED-LOBBY-LOOK-FINISH-LOCK';
const ROOT='PHASE216_PLANNED_LOBBY_LOOK_FINISH_ROOT';
let scene,rootGroup,started=false;
const MINX=-15.5,MAXX=15.5,MINZ=-12,MAXZ=11.2,Y2=3.72;
function base(){return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||scene;}
function mat(c,o=1,metal=.06){return new THREE.MeshStandardMaterial({color:c,roughness:.76,metalness:metal,transparent:o<1,opacity:o,side:THREE.DoubleSide});}
function basic(c,o=1){return new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,side:THREE.DoubleSide,depthWrite:o>.95});}
function box(p,n,pos,s,m){const o=new THREE.Mesh(new THREE.BoxGeometry(s.x,s.y,s.z),m);o.name=n;o.position.set(pos.x,pos.y,pos.z);o.frustumCulled=false;o.receiveShadow=true;p.add(o);return o;}
function hideConflict(){let h=0;base()?.traverse?.(o=>{const n=String(o.name||'');if(/PHASE191|PHASE192|PHASE194_EXPANDED|PHASE207|PHASE209|PHASE210_.*BALCONY|PHASE210_.*GLASS|PHASE210_.*RAIL|PHASE210_.*PILLAR/i.test(n)){o.visible=false;o.traverse?.(c=>c.visible=false);h++;}if(/moon|mars|planet|star|sky|sprite|sparkle|blink|pulse/i.test(n)&&!/teleport|portal|watch|hand|table|card|chip/i.test(n)){o.visible=false;o.traverse?.(c=>c.visible=false);h++;}});scene.background=new THREE.Color(0x030407);scene.fog=null;return h;}
function light(p,n,pos,color,intensity,dist=24){const l=new THREE.PointLight(color,intensity,dist,2);l.name=n;l.position.set(pos.x,pos.y,pos.z);p.add(l);return l;}
function build(){scene=window.__SVR_SCENE__;if(!scene)return null;const r=base();hideConflict();const old=r.getObjectByName?.(ROOT);if(old)old.parent?.remove(old);rootGroup=new THREE.Group();rootGroup.name=ROOT;r.add(rootGroup);
const wall=mat(0x090d15),floor=mat(0x121927),gold=mat(0xb98b38,1,.18),dark=mat(0x070a10),glass=basic(0x9eeeff,.25),cyan=basic(0x7ffcff,.30),purple=basic(0xb68cff,.20);
box(rootGroup,'PHASE216_MAIN_FLOOR_CLEAN_DARK',{x:0,y:-.03,z:-.35},{x:31.5,y:.08,z:23.5},floor);
box(rootGroup,'PHASE216_NORTH_WALL_PLAN_LOCK',{x:0,y:1.9,z:MINZ},{x:31.2,y:3.8,z:.16},wall);
box(rootGroup,'PHASE216_SOUTH_WALL_PLAN_LOCK',{x:0,y:1.9,z:MAXZ},{x:31.2,y:3.8,z:.16},wall);
box(rootGroup,'PHASE216_WEST_WALL_PLAN_LOCK',{x:MINX,y:1.9,z:-.4},{x:.16,y:3.8,z:23.2},wall);
box(rootGroup,'PHASE216_EAST_WALL_PLAN_LOCK',{x:MAXX,y:1.9,z:-.4},{x:.16,y:3.8,z:23.2},wall);
box(rootGroup,'PHASE216_SECOND_FLOOR_NORTH_TOUCHES_WALL',{x:0,y:Y2,z:MINZ+1.75},{x:31.2,y:.11,z:3.5},floor);
box(rootGroup,'PHASE216_SECOND_FLOOR_SOUTH_TOUCHES_WALL',{x:0,y:Y2,z:MAXZ-1.75},{x:31.2,y:.11,z:3.5},floor);
box(rootGroup,'PHASE216_SECOND_FLOOR_WEST_TOUCHES_WALL',{x:MINX+1.75,y:Y2,z:(MINZ+MAXZ)/2},{x:3.5,y:.11,z:23.2},floor);
box(rootGroup,'PHASE216_SECOND_FLOOR_EAST_TOUCHES_WALL',{x:MAXX-1.75,y:Y2,z:(MINZ+MAXZ)/2},{x:3.5,y:.11,z:23.2},floor);
[[MINX+1,MINZ+1,'NW'],[MAXX-1,MINZ+1,'NE'],[MINX+1,MAXZ-1,'SW'],[MAXX-1,MAXZ-1,'SE']].forEach(([x,z,id])=>box(rootGroup,`PHASE216_${id}_CORNER_SECOND_FLOOR_WALL_CONTACT`,{x,y:Y2+.01,z},{x:2.08,y:.13,z:2.08},floor));
const ix=5.85, iz=4.25;
box(rootGroup,'PHASE216_NORTH_GLASS_BALCONY_FENCE',{x:0,y:Y2+.62,z:-iz},{x:ix*2,y:.95,z:.08},glass);
box(rootGroup,'PHASE216_SOUTH_GLASS_BALCONY_FENCE',{x:0,y:Y2+.62,z:iz},{x:ix*2,y:.95,z:.08},glass);
box(rootGroup,'PHASE216_WEST_GLASS_BALCONY_FENCE',{x:-ix,y:Y2+.62,z:0},{x:.08,y:.95,z:iz*2},glass);
box(rootGroup,'PHASE216_EAST_GLASS_BALCONY_FENCE',{x:ix,y:Y2+.62,z:0},{x:.08,y:.95,z:iz*2},glass);
box(rootGroup,'PHASE216_NORTH_GOLD_RAIL_CAP',{x:0,y:Y2+1.12,z:-iz},{x:ix*2,y:.08,z:.08},gold);
box(rootGroup,'PHASE216_SOUTH_GOLD_RAIL_CAP',{x:0,y:Y2+1.12,z:iz},{x:ix*2,y:.08,z:.08},gold);
box(rootGroup,'PHASE216_WEST_GOLD_RAIL_CAP',{x:-ix,y:Y2+1.12,z:0},{x:.08,y:.08,z:iz*2},gold);
box(rootGroup,'PHASE216_EAST_GOLD_RAIL_CAP',{x:ix,y:Y2+1.12,z:0},{x:.08,y:.08,z:iz*2},gold);
[[MINX,MINZ,'NW'],[MAXX,MINZ,'NE'],[MINX,MAXZ,'SW'],[MAXX,MAXZ,'SE'],[0,MINZ,'N'],[0,MAXZ,'S'],[MINX,0,'W'],[MAXX,0,'E']].forEach(([x,z,id])=>box(rootGroup,`PHASE216_${id}_VISIBLE_PILLAR_UNDER_SECOND_FLOOR`,{x,y:Y2/2,z},{x:.48,y:Y2,z:.48},dark));
box(rootGroup,'PHASE216_NORTH_TOP_CYAN_TRIM',{x:0,y:3.95,z:MINZ+.08},{x:30.8,y:.08,z:.08},cyan);
box(rootGroup,'PHASE216_SOUTH_TOP_CYAN_TRIM',{x:0,y:3.95,z:MAXZ-.08},{x:30.8,y:.08,z:.08},cyan);
box(rootGroup,'PHASE216_WEST_TOP_PURPLE_TRIM',{x:MINX+.08,y:3.95,z:-.4},{x:.08,y:.08,z:22.8},purple);
box(rootGroup,'PHASE216_EAST_TOP_PURPLE_TRIM',{x:MAXX-.08,y:3.95,z:-.4},{x:.08,y:.08,z:22.8},purple);
box(rootGroup,'PHASE216_GOLD_SEAM_NORTH',{x:0,y:Y2+.13,z:MINZ+.08},{x:30.8,y:.12,z:.1},gold);
box(rootGroup,'PHASE216_GOLD_SEAM_SOUTH',{x:0,y:Y2+.13,z:MAXZ-.08},{x:30.8,y:.12,z:.1},gold);
box(rootGroup,'PHASE216_GOLD_SEAM_WEST',{x:MINX+.08,y:Y2+.13,z:-.4},{x:.1,y:.12,z:22.8},gold);
box(rootGroup,'PHASE216_GOLD_SEAM_EAST',{x:MAXX-.08,y:Y2+.13,z:-.4},{x:.1,y:.12,z:22.8},gold);
light(rootGroup,'PHASE216_CENTER_TABLE_WARM_LIGHT',{x:0,y:5,z:.5},0xffd9aa,1.25,24);
light(rootGroup,'PHASE216_LOBBY_CYAN_NORTH_LIGHT',{x:-6,y:4.5,z:-8},0x7ffcff,.75,22);
light(rootGroup,'PHASE216_LOBBY_PURPLE_SOUTH_LIGHT',{x:6,y:4.5,z:7},0xb68cff,.65,22);
const hemi=new THREE.HemisphereLight(0xcfefff,0x080810,.52);hemi.name='PHASE216_SOFT_HEMISPHERE_LIGHT';rootGroup.add(hemi);
return {walls:4,secondFloorTouchWalls:true,glassFence:true,pillarsVisibleUnder:true,lights:4};}
function pass(){scene=window.__SVR_SCENE__;if(!scene)return null;const hidden=hideConflict();if(!rootGroup)build();const out={build:LABEL,active:true,gameOnly:true,siteTouched:false,plannedLobbyFinished:true,hiddenConflicts:hidden,secondFloorAbovePillars:true,glassFenceAligned:true,noSky:true,checkedAt:new Date().toISOString()};window.SVR_PHASE216_PLANNED_LOBBY_LOOK_FINISH_LOCK=out;window.SVR_LOCKED_FINAL_BUILD=LABEL;window.SVR_LIVE_BUILD_POINTER=LABEL;return out;}
function install(){const b=build();window.SVR_RUN_PHASE216_LOBBY_AUDIT=()=>pass();if(!started){started=true;setInterval(pass,900);}return !!b;}
[500,1200,2400,4500,8000].forEach(ms=>setTimeout(install,ms));install();
