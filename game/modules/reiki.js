import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";
bootPrivateScene({ title:"REIKI ROOM", subtitle:"SVR AWAITING APPROVAL • PRIVATE MEDITATION SCENE", accent:0xff4058, build:({scene})=>{
  const red = new THREE.MeshBasicMaterial({color:0xff334f, transparent:true, opacity:.42, side:THREE.DoubleSide});
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.15,1.55,96), red); ring.rotation.x=-Math.PI/2; ring.position.y=.04; scene.add(ring);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.35,32,16), new THREE.MeshStandardMaterial({color:0xffd7df, emissive:0xff304f, emissiveIntensity:.7})); orb.position.set(0,1.25,0); scene.add(orb);
  const trunkMat = new THREE.MeshStandardMaterial({color:0x52301e, roughness:.8}); const leafMat = new THREE.MeshStandardMaterial({color:0x133d2a, roughness:.75});
  for(let i=0;i<18;i++){ const a=i/18*Math.PI*2, r=5.2+Math.sin(i)*.8; const g=new THREE.Group(); g.position.set(Math.cos(a)*r,0,Math.sin(a)*r-1.2); const tr=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1.5,8),trunkMat); tr.position.y=.75; const le=new THREE.Mesh(new THREE.SphereGeometry(.55,12,8),leafMat); le.position.y=1.65; g.add(tr,le); scene.add(g); }
}});
