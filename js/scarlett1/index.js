import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
export const Scarlett1={start};
function start(){
const hud=document.getElementById('hud');
const log=m=>hud.textContent+='\n'+m;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x060912);
const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.05,200);
camera.position.set(0,1.6,6);
const rig=new THREE.Group();rig.add(camera);scene.add(rig);
const r=new THREE.WebGLRenderer({antialias:true});
r.setSize(innerWidth,innerHeight);document.body.appendChild(r.domElement);
scene.add(new THREE.AmbientLight(0xffffff,.9));
const d=new THREE.DirectionalLight(0xffffff,2);d.position.set(5,10,5);scene.add(d);
const floor=new THREE.Mesh(new THREE.CircleGeometry(12,64),new THREE.MeshStandardMaterial({color:0x111820}));
floor.rotation.x=-Math.PI/2;scene.add(floor);
const table=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,.4,48),new THREE.MeshStandardMaterial({color:0x0a3a2a}));
table.position.y=.2;scene.add(table);
const joy=document.getElementById('joystick'),knob=document.getElementById('joyKnob');
let v={x:0,y:0},a=false,c={x:0,y:0};
joy.onpointerdown=e=>{a=true;const r=joy.getBoundingClientRect();c={x:r.left+r.width/2,y:r.top+r.height/2}};
joy.onpointermove=e=>{if(!a)return;v.x=-(e.clientX-c.x)/45;v.y=-(e.clientY-c.y)/45;knob.style.transform=`translate(calc(-50%+${v.x*45}px),calc(-50%+${v.y*45}px))`};
joy.onpointerup=()=>{a=false;v={x:0,y:0};knob.style.transform='translate(-50%,-50%)'};
const clk=new THREE.Clock();
r.setAnimationLoop(()=>{
const dt=clk.getDelta();
const f=new THREE.Vector3();camera.getWorldDirection(f);f.y=0;f.normalize();
const rt=new THREE.Vector3().crossVectors(f,new THREE.Vector3(0,1,0)).normalize();
rig.position.addScaledVector(f,v.y*3*dt);
rig.position.addScaledVector(rt,v.x*3*dt);
r.render(scene,camera);
});
log('Phase 3 ready');
}
