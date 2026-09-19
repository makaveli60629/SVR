/* PHASE-464-QUEST-REMODEL-FINISH */
import * as THREE from "three";
export const BUILD="PHASE-464-QUEST-REMODEL-FINISH";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let root=null;
function add(scene){
 if(root?.parent)return root;
 const base=scene.getObjectByName("PHASE462_PROFESSIONAL_TABLE_ROOM"); if(!base)return null;
 root=new THREE.Group();root.name="PHASE464_QUEST_REMODEL_FINISH";root.userData={build:BUILD,tableAuthorityUntouched:true};scene.add(root);
 const wall=new THREE.MeshStandardMaterial({color:0x16131e,roughness:.72,metalness:.12,emissive:0x12091d,emissiveIntensity:.18});
 const accent=new THREE.MeshStandardMaterial({color:0x3b2656,roughness:.34,metalness:.38,emissive:0x5825a8,emissiveIntensity:.34});
 for(const x of[-3.6,3.6]){const p=new THREE.Mesh(new THREE.BoxGeometry(.22,2.7,4.8),wall);p.position.set(x,1.35,-.35);root.add(p);const a=new THREE.Mesh(new THREE.BoxGeometry(.06,.07,3.8),accent);a.position.set(x+(x<0?.15:-.15),1.7,-.35);root.add(a);}
 const crown=new THREE.Mesh(new THREE.TorusGeometry(2.35,.035,12,72),accent);crown.position.set(0,2.75,-2.9);crown.rotation.x=Math.PI/2;root.add(crown);
 const soft=new THREE.HemisphereLight(0xf4f7ff,0x21162d,.55);soft.name="PHASE464_QUEST_SOFT_FILL";root.add(soft);
 const seatGlow=new THREE.PointLight(0x7ffcff,.42,4.2,2);seatGlow.position.set(0,1.25,2.4);root.add(seatGlow);
 return root;
}
async function install(){
 const start=performance.now();while(performance.now()-start<30000){const scene=window.__SVR_SCENE__;if(scene&&add(scene))break;await sleep(100);}
 const q=()=>({build:BUILD,installed:Boolean(root?.parent),tableAuthorityUntouched:true,oneRemodelRoot:root?.parent?1:0,checkedAt:new Date().toISOString()});
 window.SVR_PHASE464_QUEST_QA=q;return q();
}
window.SVR_PHASE464_QUEST_READY_PROMISE=install();
