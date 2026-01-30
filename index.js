import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { initWorld } from './js/scarlett1/world.js';

const diag=document.getElementById('diag');
const log=m=>diag.textContent+=m+'\n';
log('[boot] html loaded');

const r=new THREE.WebGLRenderer({antialias:true});
r.setSize(innerWidth,innerHeight);
r.xr.enabled=true;
document.getElementById('stage').appendChild(r.domElement);

const s=new THREE.Scene();
const c=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,1000);
const clock=new THREE.Clock();
let updates=[];

initWorld({THREE:THREE,scene:s,camera:c,log}).then(w=>updates=w.updates||[]);

r.setAnimationLoop(()=>{
  const dt=clock.getDelta();
  updates.forEach(f=>f(dt));
  r.render(s,c);
});

window.SCARLETT={
  enterVR:async()=>{const ses=await navigator.xr.requestSession('immersive-vr');r.xr.setSession(ses);},
  resetSpawn:()=>c.position.set(0,1.6,6),
  hideHUD:()=>document.body.classList.add('hud-hidden'),
  showHUD:()=>document.body.classList.remove('hud-hidden'),
  copyReport:()=>navigator.clipboard.writeText(diag.textContent)
};
log('[boot] JS LOADED');
