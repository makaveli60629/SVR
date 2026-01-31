
import * as THREE from "three";
import { log, setTop } from "./ui.js";

export function createWorld(){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x05070a);
  scene.fog=new THREE.Fog(0x05070a,5,45);

  const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,200);

  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.xr.enabled=true;
  document.body.appendChild(renderer.domElement);

  const playerRoot=new THREE.Group();
  scene.add(playerRoot);
  playerRoot.position.set(0,0,3);

  const head=new THREE.Group();
  head.position.y=1.6;
  playerRoot.add(head);
  head.add(camera);

  scene.add(new THREE.AmbientLight(0x88aaff,.35));
  const d=new THREE.DirectionalLight(0xffffff,.9);
  d.position.set(5,8,3);
  scene.add(d);

  const floor=new THREE.Mesh(
    new THREE.CircleGeometry(30,64),
    new THREE.MeshStandardMaterial({color:0x05070a,roughness:.95,metalness:0.0})
  );
  floor.rotation.x=-Math.PI/2;
  scene.add(floor);

  // Debug "you should see this" cube
  const debugCube=new THREE.Mesh(
    new THREE.BoxGeometry(.25,.25,.25),
    new THREE.MeshStandardMaterial({color:0x222244,emissive:0x2bd6ff,emissiveIntensity:1.2})
  );
  debugCube.position.set(0,1.6,1.25);
  playerRoot.add(debugCube);

  addEventListener("resize",()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  setTop("World ready (look for neon cube)");
  log("Renderer XR enabled: "+renderer.xr.enabled);

  return {scene,camera,renderer,playerRoot};
}
