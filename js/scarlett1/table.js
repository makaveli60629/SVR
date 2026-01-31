import * as THREE from "three";
export function createTable(){
 const g=new THREE.Group();
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1,.9,.2,32),
  new THREE.MeshStandardMaterial({color:0x0b0f14,metalness:.6,roughness:.4}));
 base.position.y=.1;g.add(base);
 const top=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.12,48),
  new THREE.MeshStandardMaterial({color:0x111822}));
 top.scale.set(2.2,1,1.1);top.position.y=.78;g.add(top);
 const rail=new THREE.Mesh(new THREE.TorusGeometry(.72,.02,12,64),
  new THREE.MeshStandardMaterial({emissive:0x2bd6ff,emissiveIntensity:2}));
 rail.scale.set(2.2,1,1.1);rail.rotation.x=Math.PI/2;rail.position.y=.86;g.add(rail);
 const seats=[];
 [[-1,1.6],[0,1.6],[1,1.6],[-1,-1.6],[0,-1.6],[1,-1.6]].forEach(p=>{
  const a=new THREE.Group();a.position.set(p[0],0,p[1]);a.lookAt(0,0,0);
  seats.push(a);g.add(a);
 });
 return{g,seats};
}
