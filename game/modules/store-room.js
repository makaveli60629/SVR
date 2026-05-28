import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";
bootPrivateScene({ title:"SVR STORE PORTAL", subtitle:"PRIVATE STORE ROOM • WEBSITE PORTAL", accent:0xb48cff, build:({scene})=>{
  const portal=new THREE.Mesh(new THREE.BoxGeometry(4.2,2.4,.08),new THREE.MeshStandardMaterial({color:0x1d123a,emissive:0x5b27ff,emissiveIntensity:.18,roughness:.4})); portal.position.set(0,1.65,-2.8); scene.add(portal);
  const url="https://svrpoker.com/site/store.html"; scene.userData.storeUrl=url;
}});
