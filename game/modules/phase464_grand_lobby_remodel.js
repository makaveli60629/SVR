/* PHASE-464-GRAND-LOBBY-REMODEL */
import * as THREE from "three";
export const BUILD="PHASE-464-GRAND-LOBBY-REMODEL";
function material(color,emissive=0,intensity=.12,metalness=.18,roughness=.58){return new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:intensity,metalness,roughness});}
function box(root,name,sx,sy,sz,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);m.name=name;m.position.set(x,y,z);root.add(m);return m;}
function label(text,color="#7ffcff"){const c=document.createElement("canvas");c.width=768;c.height=256;const x=c.getContext("2d");x.fillStyle="#050812";x.fillRect(0,0,c.width,c.height);x.strokeStyle=color;x.lineWidth=10;x.strokeRect(12,12,c.width-24,c.height-24);x.fillStyle="#fff";x.font="900 54px system-ui";x.textAlign="center";x.textBaseline="middle";x.fillText(text,c.width/2,c.height/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function installPhase464GrandLobbyRemodel({scene,world}={}){
 if(!scene||scene.getObjectByName("PHASE464_GRAND_LOBBY_REMODEL")) return scene?.getObjectByName("PHASE464_GRAND_LOBBY_REMODEL")||null;
 const root=new THREE.Group();root.name="PHASE464_GRAND_LOBBY_REMODEL";root.userData={build:BUILD,modular:true,unityReady:true};scene.add(root);
 const dark=material(0x0d1018,0x05060b,.18,.24,.5), trim=material(0x332043,0x6d28d9,.42,.42,.35), gold=material(0x6d5427,0x3e2704,.25,.72,.3), cyan=material(0x173944,0x1ea6b8,.38,.38,.32);
 box(root,"PHASE464_CENTRAL_RUNWAY",7,.05,18,0,.03,-2,dark);
 for(const x of[-7.5,7.5]){for(const z of[-9,-3,3,9]) box(root,`PHASE464_COLUMN_${x}_${z}`,.65,4.2,.65,x,2.1,z,dark);}
 box(root,"PHASE464_CEILING_RING_N",16,.12,.32,0,4.15,-7.2,trim);box(root,"PHASE464_CEILING_RING_S",16,.12,.32,0,4.15,7.2,trim);
 box(root,"PHASE464_CEILING_RING_E",.32,.12,14.1,7.85,4.15,0,trim);box(root,"PHASE464_CEILING_RING_W",.32,.12,14.1,-7.85,4.15,0,trim);
 const destinations=[["REIKI",world?.sceneTargets?.reiki],["PGA",world?.sceneTargets?.pga],["SVR STORE",world?.sceneTargets?.store],["SCORPION",world?.sceneTargets?.scorpion]];
 destinations.forEach(([name,target],i)=>{if(!target?.pos)return;const g=new THREE.Group();g.name=`PHASE464_PORTAL_${name.replace(/\s/g,"_")}`;g.position.set(target.pos.x,.18,target.pos.z+.5);const base=new THREE.Mesh(new THREE.CylinderGeometry(.85,1.05,.18,32),i%2?cyan:gold);g.add(base);const p=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.52),new THREE.MeshBasicMaterial({map:label(name),transparent:true,side:THREE.DoubleSide}));p.position.set(0,1.35,0);p.lookAt(0,1.35,6);g.add(p);root.add(g);});
 const hemi=new THREE.HemisphereLight(0xe8f8ff,0x17101f,1.25);hemi.name="PHASE464_LOBBY_AMBIENT";root.add(hemi);
 [[-5,3,1.2],[5,3,1.2],[-5,3,-7],[5,3,-7]].forEach((p,i)=>{const l=new THREE.PointLight(i<2?0x7ffcff:0xa77cff,1.05,10,1.7);l.position.set(...p);root.add(l);});
 window.SVR_PHASE464_LOBBY={build:BUILD,installed:true,portalCount:destinations.filter(([,t])=>t?.pos).length,checkedAt:new Date().toISOString()};
 return root;
}
