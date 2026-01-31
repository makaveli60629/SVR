
import * as THREE from "three";

export function createTable(){
  const g=new THREE.Group();

  const matBase=new THREE.MeshStandardMaterial({color:0x0b0f14,metalness:.65,roughness:.35});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1,.9,.2,32), matBase);
  base.position.y=.1; g.add(base);

  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,.58,32), matBase);
  pillar.position.y=.2+.58/2; g.add(pillar);

  const top=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.12,64),
    new THREE.MeshStandardMaterial({color:0x111822,metalness:.25,roughness:.45})
  );
  top.scale.set(2.2,1,1.1); top.position.y=.78; g.add(top);

  const felt=new THREE.Mesh(new THREE.CylinderGeometry(.64,.64,.03,64),
    new THREE.MeshStandardMaterial({color:0x090d12,roughness:.95,metalness:0})
  );
  felt.scale.set(2.08,1,1.02); felt.position.y=.78+.07; g.add(felt);

  const rail=new THREE.Mesh(new THREE.TorusGeometry(.72,.02,12,80),
    new THREE.MeshStandardMaterial({color:0x111111,emissive:0x2bd6ff,emissiveIntensity:2.2,roughness:.3,metalness:.4})
  );
  rail.scale.set(2.2,1,1.1); rail.rotation.x=Math.PI/2; rail.position.y=.86; g.add(rail);

  const seats=[];
  [[-1,1.6],[0,1.6],[1,1.6],[-1,-1.6],[0,-1.6],[1,-1.6]].forEach(p=>{
    const a=new THREE.Group();
    a.position.set(p[0],0,p[1]);
    a.lookAt(0,0,0);
    seats.push(a);
    g.add(a);
  });

  return {g,seats};
}
