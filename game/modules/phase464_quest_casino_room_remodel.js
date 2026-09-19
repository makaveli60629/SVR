/* PHASE-464-QUEST-CASINO-ROOM-REMODEL */
import * as THREE from "three";
export const BUILD="PHASE-464-QUEST-CASINO-ROOM-REMODEL";
const q=new URLSearchParams(location.search);
const ACTIVE=q.get("platform")==="quest"||q.get("tableonly")==="1"||/Quest|Oculus|Meta Quest/i.test(navigator.userAgent||"");
let root=null;
function mat(color,emissive=0,intensity=.08,roughness=.65,metalness=.12){return new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:intensity,roughness,metalness});}
function label(title,sub){
 const c=document.createElement("canvas");c.width=1000;c.height=360;const x=c.getContext("2d");x.fillStyle="#070812";x.fillRect(0,0,1000,360);x.strokeStyle="#b98cff";x.lineWidth=10;x.strokeRect(18,18,964,324);x.textAlign="center";x.textBaseline="middle";x.fillStyle="#fff";x.font="900 70px system-ui";x.fillText(title,500,132);x.fillStyle="#ffd98a";x.font="800 30px system-ui";x.fillText(sub,500,235);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function addBox(name,s,p,m,parent){const o=new THREE.Mesh(new THREE.BoxGeometry(s.x,s.y,s.z),m);o.name=name;o.position.copy(p);o.castShadow=false;o.receiveShadow=false;parent.add(o);return o;}
function install(){
 if(!ACTIVE)return false;
 const scene=window.__SVR_SCENE__,renderer=window.__SVR_RENDERER__,runtime=window.SVR_LOBBY_DEALER_MODULE||window.SVR_APPROVED_DEALER_TABLE_MODULE;
 if(!scene||!runtime?.table?.table||!runtime?.dealer?.group)return false;
 scene.getObjectByName("PHASE464_QUEST_CASINO_ROOM")?.removeFromParent();
 const tableBox=new THREE.Box3().setFromObject(runtime.table.table,true),center=tableBox.getCenter(new THREE.Vector3()),size=tableBox.getSize(new THREE.Vector3());
 root=new THREE.Group();root.name="PHASE464_QUEST_CASINO_ROOM";root.userData={build:BUILD,noTableCover:true,noUnderTableBlocker:true};scene.add(root);
 const wall=mat(0x262432),trim=mat(0x4b245f,0x2e0b49,.35,.38,.28),gold=mat(0x72562c,0x352207,.24,.38,.6),floor=mat(0x0b0d14,0x050408,.05,.8,.12);
 const marginX=Math.max(4.1,size.x*.5+2.1),marginZ=Math.max(3.2,size.z*.5+2.0);
 addBox("PHASE464_Q_FLOOR",new THREE.Vector3(marginX*2,.06,marginZ*2),new THREE.Vector3(center.x,.015,center.z),floor,root);
 for(const x of[-marginX,marginX])addBox("PHASE464_Q_SIDE_WALL",new THREE.Vector3(.10,3.4,marginZ*2),new THREE.Vector3(center.x+x,1.7,center.z),wall,root);
 const backZ=center.z-marginZ;addBox("PHASE464_Q_DEALER_WALL",new THREE.Vector3(marginX*2,3.4,.10),new THREE.Vector3(center.x,1.7,backZ),wall,root);
 for(const x of[-marginX+.55,marginX-.55]){addBox("PHASE464_Q_COLUMN",new THREE.Vector3(.34,2.8,.34),new THREE.Vector3(center.x+x,1.4,backZ+.26),gold,root);}
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.3),new THREE.MeshBasicMaterial({map:label("SVR POKER","QUEST PRIVATE TABLE"),side:THREE.DoubleSide}));
 sign.position.set(center.x,2.25,backZ+.065);sign.rotation.y=Math.PI;root.add(sign);
 for(const x of[-marginX+.8,marginX-.8]){const strip=addBox("PHASE464_Q_UPLIGHT",new THREE.Vector3(.055,2.2,.055),new THREE.Vector3(center.x+x,1.5,backZ+.18),trim,root);strip.material.emissiveIntensity=.75;}
 const hemi=new THREE.HemisphereLight(0xffffff,0x2d2434,1.2);root.add(hemi);
 const key=new THREE.PointLight(0xffedd2,1.65,7.5,1.7);key.position.set(center.x+2.0,2.9,center.z+1.2);root.add(key);
 const fill=new THREE.PointLight(0xcabaff,1.1,7,1.8);fill.position.set(center.x-2.1,2.5,center.z+.2);root.add(fill);
 if(renderer){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;}
 const clearance=tableBox.clone().expandByScalar(.16);let interference=0;for(const child of root.children){if(!child.isMesh||/FLOOR/.test(child.name))continue;const b=new THREE.Box3().setFromObject(child,true);if(b.intersectsBox(clearance))interference++;}
 window.SVR_PHASE464_QUEST_ROOM={build:BUILD,installed:true,interference,noTableCover:true,noUnderTableBlocker:true,resourceSlots:["dealer.primary","poker-table.primary","texture.felt-main"],checkedAt:new Date().toISOString()};
 return interference===0;
}
async function boot(){if(!ACTIVE)return false;for(let i=0;i<180;i++){if(install())return true;await new Promise(r=>setTimeout(r,100));}return false;}
window.SVR_PHASE464_QUEST_ROOM_INSTALL=install;window.SVR_PHASE464_QUEST_ROOM_READY=boot();
