
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { buildWorld } from './world.js';
import { Diagnostics } from './diagnostics.js';
export class Spine{
 constructor(o){this.mountId=o.mountId;this.scene=new THREE.Scene();
 this.camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,200);
 this.camera.position.set(0,1.65,8);
 this.renderer=new THREE.WebGLRenderer({antialias:true});
 this.renderer.setSize(innerWidth,innerHeight);}
 start(){
  document.getElementById(this.mountId).appendChild(this.renderer.domElement);
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x222244,1));
  buildWorld(this.scene); Diagnostics.mount();
  this.renderer.setAnimationLoop(()=>this.renderer.render(this.scene,this.camera));
 }
}
