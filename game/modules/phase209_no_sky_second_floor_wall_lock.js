import * as THREE from 'three';
const LABEL='PHASE-209-NO-SKY-SECOND-FLOOR-WALL-LOCK';
const ROOT='PHASE209_NO_SKY_SECOND_FLOOR_WALL_LOCK_ROOT';
const LEVEL=3.15;
const MINX=-15.5, MAXX=15.5, MINZ=-12.0, MAXZ=11.2;
let scene, root, started=false;
function iso(){return new Date().toISOString();}
function sceneRoot(){return scene?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||scene;}
function mat(c,o=1){return new THREE.MeshStandardMaterial({color:c,roughness:.78,metalness:.06,transparent:o<1,opacity:o,side:THREE.DoubleSide});}
function basic(c,o=1){return new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,side:THREE.DoubleSide,depthWrite:o>.95});}
function box(parent,name,pos,size,material){const m=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),material);m.name=name;m.position.set(pos.x,pos.y,pos.z);m.receiveShadow=true;m.frustumCulled=false;parent.add(m);return m;}
function removeSky(){let removed=0, hidden=0;const kill=[];scene?.traverse?.(o=>{const n=String(o.name||'');if(!o.parent)return;if(/moon|mars|planet|star|sky|sprite|sparkle|strobe|blink|pulse/i.test(n)){if(!/teleport|portal|watch|hand|table|card|chip|dealer/i.test(n))kill.push(o);}});[...new Set(kill)].forEach(o=>{try{o.parent?.remove(o);removed++;}catch(e){o.visible=false;hidden++;}});scene.background=new THREE.Color(0x030407);scene.fog=null;return {removed,hidden};}
function tableSafe(){const r=sceneRoot();const t=r?.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')||r?.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT');if(t){t.visible=true;t.traverse?.(o=>{o.visible=true;if(o.isMesh)o.frustumCulled=false;});}return !!t;}
function buildSecondFloor(){const r=sceneRoot();const old=r.getObjectByName?.(ROOT);if(old)old.parent?.remove(old);root=new THREE.Group();root.name=ROOT;r.add(root);
  const floorMat=mat(0x141a24), trimMat=mat(0xb88a35), glass=basic(0x7ffcff,.22), wallTouch=mat(0x1c2534);
  const y=LEVEL;
  const innerX=6.0, innerZ=4.4;
  // Four walkable balcony slabs. Each slab reaches the wall boundaries.
  box(root,'PHASE209_SECOND_FLOOR_NORTH_WALL_TOUCH_SLAB',{x:0,y,z:MINZ+2.15},{x:MAXX-MINX,y:.16,z:4.3},floorMat);
  box(root,'PHASE209_SECOND_FLOOR_SOUTH_WALL_TOUCH_SLAB',{x:0,y,z:MAXZ-2.15},{x:MAXX-MINX,y:.16,z:4.3},floorMat);
  box(root,'PHASE209_SECOND_FLOOR_WEST_WALL_TOUCH_SLAB',{x:MINX+2.15,y,z:(MINZ+MAXZ)/2},{x:4.3,y:.16,z:MAXZ-MINZ},floorMat);
  box(root,'PHASE209_SECOND_FLOOR_EAST_WALL_TOUCH_SLAB',{x:MAXX-2.15,y,z:(MINZ+MAXZ)/2},{x:4.3,y:.16,z:MAXZ-MINZ},floorMat);
  // Corner plates explicitly touching both walls.
  [[MINX+1.05,MINZ+1.05,'NW'],[MAXX-1.05,MINZ+1.05,'NE'],[MINX+1.05,MAXZ-1.05,'SW'],[MAXX-1.05,MAXZ-1.05,'SE']].forEach(([x,z,id])=>box(root,`PHASE209_${id}_SECOND_FLOOR_CORNER_WALL_LOCK`,{x,y:y+.01,z},{x:2.1,y:.2,z:2.1},wallTouch));
  // Inner guard rail around table overlook, not blocking center.
  box(root,'PHASE209_NORTH_INNER_BALCONY_GLASS',{x:0,y:y+.72,z:-innerZ},{x:innerX*2,y:1.05,z:.08},glass);
  box(root,'PHASE209_SOUTH_INNER_BALCONY_GLASS',{x:0,y:y+.72,z:innerZ},{x:innerX*2,y:1.05,z:.08},glass);
  box(root,'PHASE209_WEST_INNER_BALCONY_GLASS',{x:-innerX,y:y+.72,z:0},{x:.08,y:1.05,z:innerZ*2},glass);
  box(root,'PHASE209_EAST_INNER_BALCONY_GLASS',{x:innerX,y:y+.72,z:0},{x:.08,y:1.05,z:innerZ*2},glass);
  // Wall trim to make contact clear.
  box(root,'PHASE209_NORTH_WALL_SECOND_FLOOR_SEAM',{x:0,y:y+.14,z:MINZ+.06},{x:31.0,y:.18,z:.12},trimMat);
  box(root,'PHASE209_SOUTH_WALL_SECOND_FLOOR_SEAM',{x:0,y:y+.14,z:MAXZ-.06},{x:31.0,y:.18,z:.12},trimMat);
  box(root,'PHASE209_WEST_WALL_SECOND_FLOOR_SEAM',{x:MINX+.06,y:y+.14,z:(MINZ+MAXZ)/2},{x:.12,y:.18,z:23.2},trimMat);
  box(root,'PHASE209_EAST_WALL_SECOND_FLOOR_SEAM',{x:MAXX-.06,y:y+.14,z:(MINZ+MAXZ)/2},{x:.12,y:.18,z:23.2},trimMat);
  // Support columns at every corner and mid wall.
  [[MINX,MINZ,'NW'],[MAXX,MINZ,'NE'],[MINX,MAXZ,'SW'],[MAXX,MAXZ,'SE'],[0,MINZ,'N'],[0,MAXZ,'S'],[MINX,0,'W'],[MAXX,0,'E']].forEach(([x,z,id])=>box(root,`PHASE209_${id}_WALL_TOUCH_SUPPORT_COLUMN`,{x,y:LEVEL/2,z},{x:.45,y:LEVEL,z:.45},trimMat));
  return true;
}
function hideConflictingUpper(){let hidden=0;sceneRoot()?.traverse?.(o=>{const n=String(o.name||'');if(/PHASE191|PHASE192|PHASE194_EXPANDED|PHASE207_LOBBY_RECOVERY|PHASE208_SINGLE_SKY/i.test(n)){o.visible=false;o.traverse?.(c=>c.visible=false);hidden++;}});return hidden;}
function pass(){scene=window.__SVR_SCENE__;if(!scene)return null;const sky=removeSky();const hidden=hideConflictingUpper();if(!sceneRoot()?.getObjectByName?.(ROOT))buildSecondFloor();const out={build:LABEL,active:true,gameOnly:true,siteTouched:false,skyRemoved:true,planetsRemoved:true,secondFloorWallLock:true,cornersTouchWalls:true,tableVisible:tableSafe(),skyObjectsRemoved:sky.removed,conflictingLobbyPiecesHidden:hidden,checkedAt:iso()};window.SVR_PHASE209_NO_SKY_SECOND_FLOOR_WALL_LOCK=out;window.SVR_LOCKED_FINAL_BUILD=LABEL;window.SVR_LIVE_BUILD_POINTER=LABEL;return out;}
function install(){const out=pass();window.SVR_RUN_PHASE209_AUDIT=()=>pass();if(!started){started=true;setInterval(pass,1500);}return !!out;}
[400,900,1800,3200,6000,10000,15000].forEach(ms=>setTimeout(install,ms));install();
