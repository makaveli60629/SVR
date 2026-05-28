import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const PHASE = 261;
const UPDATED = '2026-05-26 19:07:06';

let scene, camera, renderer, rig, world;
let controllers = [];
let teleportPads = [];
let clock = new THREE.Clock();

boot();

function boot(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050014);

  camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.01, 800);
  camera.position.set(0,1.65,0);

  rig = new THREE.Group();
  rig.name = 'SVR_PLAYER_RIG_PHASE_' + PHASE;
  rig.add(camera);
  scene.add(rig);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth, innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');
  document.body.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer,{
    optionalFeatures:['local-floor','bounded-floor','hand-tracking']
  }));

  renderer.xr.addEventListener('sessionstart',()=>document.body.classList.add('xr-active'));
  renderer.xr.addEventListener('sessionend',()=>document.body.classList.remove('xr-active'));

  lights();
  handsAndControllers();
  loadLobby();

  renderer.setAnimationLoop(loop);
  addEventListener('resize', resize);
}

function loop(){
  const t = clock.getElapsedTime();

  scene.traverse(o=>{
    if(o.userData.spin) o.rotation.y = t * o.userData.spin;
    if(o.userData.float) o.position.y = o.userData.baseY + Math.sin(t*1.8)*0.12;
  });

  renderer.render(scene,camera);
}

function lights(){
  scene.add(new THREE.HemisphereLight(0xffffff,0x8844ff,2.4));
  scene.add(new THREE.AmbientLight(0xffffff,1.2));
  const sun = new THREE.DirectionalLight(0xffffff,2.6);
  sun.position.set(8,14,8);
  scene.add(sun);
}

function glow(color,intensity=2){
  return new THREE.MeshStandardMaterial({
    color,
    emissive:color,
    emissiveIntensity:intensity,
    roughness:.25,
    metalness:.2
  });
}

function mat(color){
  return new THREE.MeshStandardMaterial({color,roughness:.45,metalness:.15});
}

function clearWorld(){
  teleportPads = [];
  if(world) scene.remove(world);
  world = new THREE.Group();
  scene.add(world);
}

function text(msg,x,y,z,w=4){
  const c=document.createElement('canvas');
  c.width=1024;c.height=256;
  const g=c.getContext('2d');
  g.fillStyle='rgba(0,0,20,.82)';
  g.fillRect(0,0,1024,256);
  g.strokeStyle='#00ffff';
  g.lineWidth=10;
  g.strokeRect(10,10,1004,236);
  g.fillStyle='white';
  g.font='bold 54px Arial';
  g.textAlign='center';
  g.textBaseline='middle';
  g.fillText(msg,512,128);
  const tex=new THREE.CanvasTexture(c);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));
  s.position.set(x,y,z);
  s.scale.set(w,.9,1);
  world.add(s);
  return s;
}

function buildRoom(){
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30,30),mat(0x12051f));
  floor.rotation.x=-Math.PI/2;
  world.add(floor);

  const grid = new THREE.GridHelper(30,30,0x00ffff,0x442266);
  grid.position.y=.015;
  world.add(grid);

  [[-14,1.8,-14],[14,1.8,-14],[-14,1.8,14],[14,1.8,14]].forEach((p,i)=>{
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(.28,3.6,.28),glow(i%2?0x8a2cff:0xff39ff,2.5));
    pillar.position.set(...p);
    world.add(pillar);
  });

  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.0,48,48),glow(0xe9edff,1.4));
  moon.name='WORKING_MOON_LOCKED_SKY';
  moon.position.set(-8,7,-12);
  moon.userData.float=true;
  moon.userData.baseY=7;
  world.add(moon);

  const mars = new THREE.Mesh(new THREE.SphereGeometry(.75,48,48),glow(0xff5a2e,1.2));
  mars.name='WORKING_MARS_LOCKED_SKY';
  mars.position.set(8,6,-13);
  mars.userData.float=true;
  mars.userData.baseY=6;
  mars.userData.spin=.25;
  world.add(mars);
}

function portal(label,route,x,z,color){
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.08,64),glow(color,2.8));
  pad.position.set(x,.05,z);
  pad.userData.route=route;
  pad.name='TELEPORT_' + route;
  world.add(pad);
  teleportPads.push(pad);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(.9,.04,16,80),glow(color,3));
  ring.rotation.x=Math.PI/2;
  ring.position.set(x,.16,z);
  world.add(ring);

  text(label,x,1.55,z,2.8);
}

function loadLobby(){
  clearWorld();
  rig.position.set(0,0,0);
  buildRoom();

  text('SVR VR LOBBY — PHASE ' + PHASE,0,3,-5.5,5.8);
  text('MOON + MARS + TELEPORT + CONTROLLER SELECT ACTIVE',0,2.1,-5.5,7.2);

  const spawn = new THREE.Mesh(new THREE.RingGeometry(1.4,1.6,96),glow(0x00ffff,2.4));
  spawn.rotation.x=-Math.PI/2;
  spawn.position.y=.04;
  world.add(spawn);

  portal('POKER','Poker',-4,-3,0xff39ff);
  portal('PGA','PGA',0,-4,0x00ff88);
  portal('VR STORE','Store',4,-3,0xffcc33);
  portal('REIKI','Reiki',-4,3,0x9966ff);
  portal('MARS TEST','Mars',0,4,0xff5a2e);
  portal('SCORPION','Scorpion',4,3,0xff3333);
}

function loadRoute(route){
  if(route==='Lobby'){loadLobby();return;}

  clearWorld();
  rig.position.set(0,0,2.5);
  buildRoom();

  if(route==='Poker'){
    text('POKER ROOM — 6 SEATS',0,3,-4,5);
    const table=new THREE.Mesh(new THREE.CylinderGeometry(1.8,1.8,.24,80),mat(0x0f4a35));
    table.position.set(0,.82,0);
    world.add(table);
    for(let i=0;i<6;i++){
      const a=-Math.PI/2+i*Math.PI*2/6;
      const seat=new THREE.Mesh(new THREE.CylinderGeometry(.35,.42,.45,32),glow(0x9944ff,1.2));
      seat.position.set(Math.cos(a)*2.7,.28,Math.sin(a)*2.7);
      world.add(seat);
    }
  } else if(route==='Store'){
    text('IN-GAME VR STORE',0,3,-4,5);
    ['AVATAR','CHIPS','TABLE','ACCESS'].forEach((name,i)=>{
      const x=-3+i*2;
      const stand=new THREE.Mesh(new THREE.BoxGeometry(1,.6,1),mat(0x26133f));
      stand.position.set(x,.3,0);
      world.add(stand);
      const item=new THREE.Mesh(new THREE.SphereGeometry(.28,32,32),glow([0xffcc33,0x00ff88,0xff39ff,0x00ffff][i],2));
      item.position.set(x,.95,0);
      item.userData.buy=name;
      item.userData.float=true;
      item.userData.baseY=.95;
      world.add(item);
      teleportPads.push(item);
      text(name,x,1.55,-.9,2.2);
    });
    text('BUY ACCESS HOOK NEXT: WEBSITE BACKEND + PLAYER INVENTORY',0,2.15,2.4,6.5);
  } else {
    text(route.toUpperCase() + ' MODULE',0,3,-4,5);
    text('VR GAME AREA LOADED',0,2,-4,4.5);
  }

  portal('BACK LOBBY','Lobby',0,4,0x00ffff);
}

function handsAndControllers(){
  for(let i=0;i<2;i++){
    const controller = renderer.xr.getController(i);
    controller.name='QUEST_CONTROLLER_INPUT_MASKED_' + i;
    controller.visible=false;
    controller.addEventListener('connected',()=>controller.traverse(c=>c.visible=false));
    controller.addEventListener('selectstart',()=>select(controller));
    scene.add(controller);
    controllers.push(controller);

    const grip = renderer.xr.getControllerGrip(i);
    grip.visible=false;
    scene.add(grip);

    const hand = renderer.xr.getHand(i);
    hand.name=i===0?'LEFT_HAND_INPUT':'RIGHT_HAND_INPUT';
    hand.addEventListener('selectstart',()=>select(hand));
    scene.add(hand);
  }
}

function select(source){
  const raycaster = new THREE.Raycaster();
  const matrix = new THREE.Matrix4();
  matrix.identity().extractRotation(source.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(source.matrixWorld);
  raycaster.ray.direction.set(0,0,-1).applyMatrix4(matrix);

  const hits = raycaster.intersectObjects(teleportPads,true);
  if(!hits.length)return;

  let obj = hits[0].object;
  while(obj){
    if(obj.userData.route){
      loadRoute(obj.userData.route);
      return;
    }
    if(obj.userData.buy){
      text('BUY / UNLOCK: ' + obj.userData.buy,0,2.6,2.2,5);
      text('STORE BACKEND CONNECTION NEXT PHASE',0,1.8,2.2,5.5);
      return;
    }
    obj=obj.parent;
  }
}

function resize(){
  camera.aspect=innerWidth/Math.max(innerHeight,1);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}

window.svr = { phase:PHASE, updated:UPDATED, loadRoute };
