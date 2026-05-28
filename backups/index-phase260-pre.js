import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const PHASE = 259;
const START_SCENE = 'Lobby';
const VR_READY = true;
const POKER_SEATS = 6;

let scene, camera, renderer, rig, currentGroup;

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd7ff);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 500);
  camera.position.set(0, 1.65, 0);

  rig = new THREE.Group();
  rig.name = 'scarlett-player-rig';
  rig.add(camera);
  scene.add(rig);

  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  if (VR_READY) {
    const vrButton = VRButton.createButton(renderer, { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] }); document.body.appendChild(vrButton); renderer.xr.addEventListener('sessionstart', () => document.body.classList.add('xr-active')); renderer.xr.addEventListener('sessionend', () => document.body.classList.remove('xr-active'));
  }

  addLights();
  addRoom();
  maskControllers();
  connectButtons();
  loadRoute(START_SCENE);

  renderer.setAnimationLoop(() => renderer.render(scene, camera));
  window.addEventListener('resize', resize);
}

function addLights() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b67ff, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(8, 12, 8);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
}

function addRoom() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ color:0x14051f, roughness:.5 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const purple = new THREE.MeshStandardMaterial({
    color:0xb23cff,
    emissive:0xb23cff,
    emissiveIntensity:2.2
  });

  const positions = [[-6.8,1.75,-6.8],[6.8,1.75,-6.8],[-6.8,1.75,6.8],[6.8,1.75,6.8]];
  positions.forEach((p, i) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(.16,3.5,.16), purple);
    pillar.name = 'vertical-gradient-purple-trim-' + (i + 1);
    pillar.position.set(p[0], p[1], p[2]);
    scene.add(pillar);
  });

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(.55, 32, 32),
    new THREE.MeshStandardMaterial({ color:0xfff0c9, emissive:0xffe6a0, emissiveIntensity:1.2 })
  );
  moon.name = 'locked-outer-skybox-moon';
  moon.position.set(-8, 7, -10);
  scene.add(moon);
}

function maskControllers() {
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    controller.visible = false;
    controller.name = 'masked-controller-' + i;
    controller.addEventListener('connected', () => {
      controller.visible = false;
      controller.traverse(child => child.visible = false);
    });
    scene.add(controller);

    const grip = renderer.xr.getControllerGrip(i);
    grip.visible = false;
    grip.name = 'hidden-controller-grip-' + i;
    scene.add(grip);

    const hand = renderer.xr.getHand(i);
    hand.name = i === 0 ? 'left-hand-only' : 'right-hand-only';
    scene.add(hand);
  }
}

function connectButtons() {
  document.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => loadRoute(btn.dataset.route));
  });
}

function clearRoute() {
  if (currentGroup) scene.remove(currentGroup);
  currentGroup = new THREE.Group();
  scene.add(currentGroup);
}

function loadRoute(route) {
  clearRoute();
  document.getElementById('status').textContent = 'Current Scene: ' + route;

  if (route === 'Lobby') buildLobby();
  else if (route === 'Seat') buildPoker();
  else buildModule(route);
}

function makeText(message, x, y, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(10,0,25,.78)';
  ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle = '#d952ff';
  ctx.lineWidth = 8;
  ctx.strokeRect(8,8,1008,240);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message,512,128);

  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true }));
  sprite.position.set(x,y,z);
  sprite.scale.set(3.4,.85,1);
  currentGroup.add(sprite);
  return sprite;
}

function buildLobby() {
  rig.position.set(0,0,0);
  makeText('VR LOBBY HUB', 0, 2.4, -3);
  makeText('LOOK AROUND: STORE / POKER / GAMES ARE INSIDE VR', 0, 1.5, -3);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.3,1.45,64),
    new THREE.MeshStandardMaterial({ color:0x6dffb6, emissive:0x6dffb6, emissiveIntensity:1.5 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = .03;
  currentGroup.add(ring);
}

function buildPoker() {
  rig.position.set(0,0,2.8);
  makeText('POKER PIT | EXACTLY 6 SEATS', 0, 2.5, -2.5);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75,1.75,.22,72),
    new THREE.MeshStandardMaterial({ color:0x0f4a35, roughness:.4 })
  );
  table.position.set(0,.8,0);
  table.userData.seatCount = POKER_SEATS;
  currentGroup.add(table);

  for (let i = 0; i < POKER_SEATS; i++) {
    const angle = -Math.PI / 2 + i * Math.PI * 2 / POKER_SEATS;
    const seat = new THREE.Mesh(
      new THREE.CylinderGeometry(.3,.36,.4,28),
      new THREE.MeshStandardMaterial({ color:0x351858 })
    );
    seat.position.set(Math.cos(angle)*2.5,.25,Math.sin(angle)*2.5);
    seat.name = 'poker-seat-' + (i + 1);
    currentGroup.add(seat);
  }

  makeText('Dealer silent. Winner text displays for 10 seconds.', 0, 1.45, 2.4);
}

function buildModule(route) {
  rig.position.set(0,0,0);
  makeText(route.toUpperCase() + ' IN-GAME MODULE', 0, 2.4, -3);
  makeText('Module placeholder loaded from Lobby route.', 0, 1.45, -3);
}

function resize() {
  camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.scarlett = { loadRoute };

