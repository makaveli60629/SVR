/* PHASE-464-UNIFIED-LOBBY-REMODEL */
import * as THREE from "three";
export const BUILD="PHASE-464-UNIFIED-LOBBY-REMODEL";

function material(color,emissive=0,intensity=.08,roughness=.7,metalness=.08){
  return new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:intensity,roughness,metalness});
}
function canvasLabel(title,subtitle,color="#7ffcff"){
  const c=document.createElement("canvas"); c.width=900;c.height=360;const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,"#060912");g.addColorStop(1,"#180826");x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=color;x.lineWidth=10;x.strokeRect(20,20,860,320);x.textAlign="center";x.textBaseline="middle";
  x.fillStyle="#fff";x.font="900 58px system-ui";x.fillText(title,450,135,800);x.fillStyle=color;x.font="800 27px system-ui";x.fillText(subtitle||"",450,235,800);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function box(root,name,size,pos,mat,rotY=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),mat);m.name=name;m.position.copy(pos);m.rotation.y=rotY;m.castShadow=false;m.receiveShadow=false;root.add(m);return m;
}
function addPortal(root,key,title,subtitle,pos,look,color){
  const group=new THREE.Group();group.name=`PHASE464_PORTAL_${key.toUpperCase()}`;group.position.copy(pos);if(look)group.lookAt(look.x,1.7,look.z);
  const frame=material(color,Math.floor(color*.22),.35,.35,.5);
  box(group,"FRAME_TOP",new THREE.Vector3(3.2,.18,.20),new THREE.Vector3(0,2.9,0),frame);
  box(group,"FRAME_L",new THREE.Vector3(.18,3.0,.20),new THREE.Vector3(-1.52,1.48,0),frame);
  box(group,"FRAME_R",new THREE.Vector3(.18,3.0,.20),new THREE.Vector3(1.52,1.48,0),frame);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.7,1.08),new THREE.MeshBasicMaterial({map:canvasLabel(title,subtitle),transparent:true,side:THREE.DoubleSide}));
  sign.position.set(0,2.0,.13);group.add(sign);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.035,10,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
  ring.rotation.x=Math.PI/2;ring.position.set(0,.05,-.45);group.add(ring);
  group.userData={svrPortal:true,target:key,build:BUILD};root.add(group);return group;
}
function addPlanter(root,x,z,scale=1){
  const pot=box(root,"PHASE464_PLANTER",new THREE.Vector3(.7,.48,.7),new THREE.Vector3(x,.24,z),material(0x28212e,0x16051f,.12,.55,.25));
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,1.1,8),material(0x4e3827));trunk.position.set(x,.98,z);trunk.userData.resourceSlot="prop.tree.primary";root.add(trunk);
  for(const y of[1.25,1.55,1.85]){const crown=new THREE.Mesh(new THREE.ConeGeometry(.6*scale,.75,10),material(0x1f5e42,0x072518,.12,.9));crown.position.set(x,y,z);crown.userData.resourceSlot="prop.bush.primary";root.add(crown);}
  return pot;
}
async function loadResourceManifest(){
  try{
    const res=await fetch("https://api.svrpoker.com/api/game/resources/manifest",{cache:"no-store"});
    const data=await res.json(); if(!res.ok||data.ok===false)throw new Error(data.error||`HTTP ${res.status}`);
    window.SVR_RESOURCE_MANIFEST_V3=data; return data;
  }catch(error){window.SVR_RESOURCE_MANIFEST_V3={ok:false,error:String(error?.message||error),resources:[]};return window.SVR_RESOURCE_MANIFEST_V3;}
}
export function installPhase464UnifiedLobbyRemodel({scene,sceneTargets={}}={}){
  if(!scene)return null;
  scene.getObjectByName("PHASE464_UNIFIED_LOBBY_REMODEL")?.removeFromParent();
  const root=new THREE.Group();root.name="PHASE464_UNIFIED_LOBBY_REMODEL";root.userData={build:BUILD,modular:true,unityMigrationReady:true};scene.add(root);
  const dark=material(0x0b0c14,0x06020b,.08,.76,.12), purple=material(0x301647,0x25063f,.32,.42,.32), gold=material(0x6f572c,0x2c1d05,.25,.42,.58);
  box(root,"PHASE464_GRAND_AXIS",new THREE.Vector3(9.5,.035,18),new THREE.Vector3(0,.025,-1.8),dark);
  box(root,"PHASE464_CENTER_INLAY",new THREE.Vector3(4.4,.045,11.5),new THREE.Vector3(0,.052,-1.0),purple);
  for(const x of[-7.4,7.4])for(const z of[-8,-2,4]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.24,.32,4.6,16),gold);col.position.set(x,2.3,z);root.add(col);}
  const portals=[
    ["reiki","REIKI / WELLNESS","Private approval-safe room",sceneTargets.reiki,new THREE.Vector3(-12,1.7,-16),0x7ffcff],
    ["pga","PGA DRIVE","Golf training room",sceneTargets.pga,new THREE.Vector3(-6,1.7,-16),0x8dffb4],
    ["store","SVR STORE","Avatar gear + game items",sceneTargets.store,new THREE.Vector3(6,1.7,-16),0xffd98a],
    ["scorpion","SCORPION ROOM","Private poker overlook",sceneTargets.scorpion,new THREE.Vector3(12,1.7,-16),0xa77cff]
  ];
  for(const [key,title,sub,target,look,color] of portals){if(target?.pos)addPortal(root,key,title,sub,target.pos.clone().add(new THREE.Vector3(0,0,.35)),look,color);}
  addPortal(root,"chip-putt","CHIP + PUTT","Short-game training",new THREE.Vector3(-15,0,-2.5),new THREE.Vector3(-19,1.7,-2.5),0x79ff9a);
  addPortal(root,"smoker-lounge","SOCIAL LOUNGE","Private member lounge",new THREE.Vector3(15,0,-2.5),new THREE.Vector3(19,1.7,-2.5),0xff8fa7);
  for(const [x,z] of [[-10,6],[10,6],[-10,-6],[10,-6],[-15,6],[15,6]])addPlanter(root,x,z,.85);
  const ambient=new THREE.HemisphereLight(0xe9e6ff,0x181020,.85);ambient.name="PHASE464_LOBBY_AMBIENT";root.add(ambient);
  for(const x of[-5,5]){const light=new THREE.PointLight(x<0?0x7ffcff:0xa77cff,1.0,9,1.7);light.position.set(x,2.8,1);root.add(light);}
  loadResourceManifest();
  window.SVR_PHASE464_LOBBY={build:BUILD,installed:true,portalCount:6,resourceSlots:["prop.tree.primary","prop.bush.primary","lobby-environment.primary"],checkedAt:new Date().toISOString()};
  return root;
}
