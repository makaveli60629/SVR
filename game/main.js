import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { makeWorld } from './modules/world.js';
import { makeControls } from './modules/controls.js';
import { makeTeleport } from './modules/teleport.js';
import { makeWatch } from './modules/watch.js';

const app=document.getElementById('app'), statusEl=document.getElementById('status'), inputEl=document.getElementById('input'), logEl=document.getElementById('log');
const log=(...a)=>{logEl.textContent+=a.join(' ')+'\n';};
const status=t=>statusEl.textContent=t;
const input=t=>inputEl.textContent=t;

const scene=new THREE.Scene(); scene.background=new THREE.Color(0x050009); scene.fog=new THREE.FogExp2(0x050009,.018);
const player=new THREE.Group(); scene.add(player);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,220); camera.position.set(0,1.6,0); player.add(camera);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'}); renderer.xr.enabled=true; renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.15)); renderer.setSize(innerWidth,innerHeight); renderer.setClearColor(0x050009,1); app.appendChild(renderer.domElement);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

const world=makeWorld(scene);
const SAFE={x:0,z:5.8};
function resetSpawn(){player.position.set(SAFE.x,0,SAFE.z);camera.position.set(0,1.6,0);camera.lookAt(0,1.25,-1.2);status('Safe spawn: outside table, facing table.');}
resetSpawn();

makeControls({player,camera,dom:renderer.domElement,clamp:world.clamp});
makeInputModels();
const teleport=makeTeleport({scene,renderer,player,camera,clamp:world.clamp,status});
const watch=makeWatch({scene,renderer,camera,player,getState:()=>({teleport:teleport.enabled(),cash:50000,seat:'Standing'})});

function makeInputModels(){
 const cf=new XRControllerModelFactory(), hf=new XRHandModelFactory(), rig=new THREE.Group(); player.add(rig);
 for(let i=0;i<2;i++){
  const c=renderer.xr.getController(i); c.add(makeRay(i?0xc07cff:0x9c4dff)); c.add(makeGlove(i?'right':'left')); c.addEventListener('connected',e=>input('Input: '+(e.data?.handedness||'controller')+' tracked')); rig.add(c);
  const g=renderer.xr.getControllerGrip(i); g.add(cf.createControllerModel(g)); rig.add(g);
  const h=renderer.xr.getHand(i); h.add(hf.createHandModel(h,'mesh')); h.add(makeGlove(i?'right':'left',.65)); h.addEventListener('connected',()=>input('Input: Meta hand tracked')); rig.add(h);
 }
}
function makeRay(color){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-5)]);return new THREE.Line(geo,new THREE.LineBasicMaterial({color,transparent:true,opacity:.75}));}
function makeGlove(side='right',s=1){const g=new THREE.Group(), skin=new THREE.MeshStandardMaterial({color:0xd8b6ff,emissive:0x7a29d8,emissiveIntensity:.18,roughness:.42,transparent:true,opacity:.96}), dark=new THREE.MeshStandardMaterial({color:0x1a0b2c,emissive:0x50158a,emissiveIntensity:.25});const palm=new THREE.Mesh(new THREE.BoxGeometry(.09*s,.045*s,.13*s),dark);palm.position.z=-.018*s;const k=new THREE.Mesh(new THREE.SphereGeometry(.044*s,16,12),skin);k.position.set(0,.002*s,-.088*s);g.add(palm,k);[-.044,-.016,.016,.044].forEach(x=>{const f=new THREE.Mesh(new THREE.CylinderGeometry(.01*s,.01*s,.12*s,10),skin);f.position.set(x*s,.014*s,-.158*s);f.rotation.x=1.25;g.add(f);});return g;}

document.getElementById('reset').onclick=resetSpawn;
document.getElementById('nav').onclick=()=>document.body.classList.toggle('routesOff');
document.getElementById('logs').onclick=()=>logEl.style.display=logEl.style.display==='block'?'none':'block';
document.querySelectorAll('.route').forEach(b=>b.onclick=()=>{if(b.dataset.url) location.href=new URL(b.dataset.url,location.href); else jump(b.dataset.jump);});
function jump(k){const t=world.targets[k]||world.targets.lobby; player.position.set(t.x,0,t.z); camera.position.y=t.y||1.6; camera.lookAt(t.lx||0,t.ly||1.2,t.lz||-1.2); status('Route: '+k);}
document.addEventListener('keydown',e=>{if(e.code==='KeyR')resetSpawn(); if(e.code==='Digit1')jump('lobby'); if(e.code==='Digit2')jump('seat'); if(e.code==='Digit3')jump('reiki'); if(e.code==='Digit4')jump('pga');});

const vr=document.getElementById('vr');
if(navigator.xr){navigator.xr.isSessionSupported('immersive-vr').then(ok=>{vr.textContent=ok?'Enter VR':'Desktop Preview'; if(ok)vr.onclick=async()=>{const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','hand-tracking']});renderer.xr.setReferenceSpaceType('local-floor');await renderer.xr.setSession(s);};});} else {vr.textContent='Desktop Preview';}
renderer.xr.addEventListener('sessionstart',()=>{input('Input: XR active');status('VR active: Meta hands/controllers enabled.');});
renderer.xr.addEventListener('sessionend',()=>{input('Input: Desktop ready');status('Desktop preview ready.');});

function safety(){const dx=player.position.x-world.table.x,dz=player.position.z-world.table.z,d=Math.hypot(dx,dz); if(d<2.85){const a=Math.atan2(dz||1,dx);player.position.x=world.table.x+Math.cos(a)*3.3;player.position.z=world.table.z+Math.sin(a)*3.3;status('Auto-corrected: outside table.');}}
status('Ready. Phase 254: UI cleaned, spawn safe, Meta hands active.'); input('Input: Desktop ready');
renderer.setAnimationLoop((t)=>{teleport.update();watch.update();world.update(t);safety();renderer.render(scene,camera);});
