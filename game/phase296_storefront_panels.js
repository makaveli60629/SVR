import * as THREE from "three";
const LABEL="PHASE-296-STOREFRONT-PANEL-VISUALS";
const DATA=[[-12,-16.02,0xb55cff],[-6,-16.02,0x7ffcff],[0,-16.02,0xffd98a],[6,-16.02,0x8dffb4],[12,-16.02,0xff5b8c],[15.75,5.8,0xa77cff]];
function apply(){
 const scene=window.__SVR_SCENE__; if(!scene) return false;
 const old=scene.getObjectByName("PHASE296_PANEL_ROOT"); if(old) old.parent?.remove(old);
 const root=new THREE.Group(); root.name="PHASE296_PANEL_ROOT"; scene.add(root);
 DATA.forEach((d,i)=>{const [x,z,color]=d; const g=new THREE.Group(); g.name=`PHASE296_PANEL_${i+1}`; g.position.set(x,0,z); if(i===5) g.rotation.y=-Math.PI/2; root.add(g); const box=new THREE.Mesh(new THREE.BoxGeometry(3.55,1.75,.08),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.72,side:THREE.DoubleSide})); box.position.y=2.72; g.add(box); const pad=new THREE.Mesh(new THREE.RingGeometry(.75,.98,60),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.54,side:THREE.DoubleSide})); pad.rotation.x=-Math.PI/2; pad.position.set(0,.045,1.72); g.add(pad);});
 window.SVR_PHASE296_STOREFRONT_PANEL_VISUALS={build:LABEL,active:true,count:DATA.length,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
 return true;
}
apply(); let n=0; const t=setInterval(()=>{n++; if(apply()||n>90) clearInterval(t);},250);
