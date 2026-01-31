
import * as THREE from "three";
export function createWorld(){
 const scene=new THREE.Scene();
 scene.fog=new THREE.Fog(0x05070a,5,45);
 const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,200);
 const renderer=new THREE.WebGLRenderer({antialias:true});
 renderer.setSize(innerWidth,innerHeight);
 renderer.xr.enabled=true;
 document.body.appendChild(renderer.domElement);
 const playerRoot=new THREE.Group();scene.add(playerRoot);
 playerRoot.position.set(0,0,3);
 const head=new THREE.Group();head.position.y=1.6;playerRoot.add(head);head.add(camera);
 scene.add(new THREE.AmbientLight(0x88aaff,.3));
 const d=new THREE.DirectionalLight(0xffffff,.9);d.position.set(5,8,3);scene.add(d);
 const floor=new THREE.Mesh(new THREE.CircleGeometry(30,64),
  new THREE.MeshStandardMaterial({color:0x05070a,roughness:.9}));
 floor.rotation.x=-Math.PI/2;scene.add(floor);
 addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
 return{scene,camera,renderer,playerRoot};
}
