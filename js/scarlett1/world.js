// SCARLETT ONE v4.0.5 — World (VR/js/scarlett1/world.js)
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OculusHandModel } from 'https://unpkg.com/three@0.160.0/examples/jsm/objects/OculusHandModel.js';

let hand1, hand2;
let canTurn = true;

const texturePath = 'assets/textures/';

function loadMat(fileName, fallbackColor = 0x333333, repeat = 4) {
  const mat = new THREE.MeshStandardMaterial({
    color: fallbackColor,
    roughness: 0.35,
    metalness: 0.12
  });

  const loader = new THREE.TextureLoader();
  const url = texturePath + fileName;

  loader.load(
    url,
    (tex) => {
      console.log('[textures] loaded:', fileName);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      mat.map = tex;
      mat.needsUpdate = true;
    },
    undefined,
    () => console.warn('[textures] missing (fallback used):', fileName)
  );

  return mat;
}

export function createWorld(scene, camera, renderer, playerGroup) {
  scene.background = new THREE.Color(0x070a14);
  scene.fog = new THREE.Fog(0x070a14, 6, 140);

  scene.add(new THREE.AmbientLight(0xffffff, 1.05));

  const sun = new THREE.DirectionalLight(0x00ffff, 1.35);
  sun.position.set(6, 12, 6);
  scene.add(sun);

  const mag = new THREE.PointLight(0xff00ff, 0.85, 30, 2);
  mag.position.set(-4, 3, -4);
  scene.add(mag);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    loadMat('floor.jpg', 0x1a1a1a, 6)
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(100, 100, 0x00ff88, 0x112233);
  grid.position.y = 0.01;
  scene.add(grid);

  const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cubeMat = new THREE.MeshNormalMaterial();
  for (let i = -2; i <= 2; i += 2) {
    const c = new THREE.Mesh(cubeGeo, cubeMat);
    c.position.set(i, 1.5, -3);
    scene.add(c);
  }

  const monoMat = loadMat('wall.jpg', 0x222244, 2);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 0.5), monoMat);
    const ang = (i / 6) * Math.PI * 2;
    const r = 18;
    m.position.set(Math.cos(ang) * r, 3, Math.sin(ang) * r);
    m.lookAt(0, 3, 0);
    scene.add(m);
  }

  hand1 = renderer.xr.getHand(0);
  hand1.add(new OculusHandModel(hand1));
  playerGroup.add(hand1);

  hand2 = renderer.xr.getHand(1);
  hand2.add(new OculusHandModel(hand2));
  playerGroup.add(hand2);

  camera.position.set(0, 1.6, 2);
  camera.lookAt(0, 1.4, -3);

  console.log('[world] ready. Texture root:', texturePath);
}

export function updateWorld(delta, playerGroup) {
  if (!hand1 || !hand1.visible) return;

  const moveSpeed = 3.0;
  const hPos = hand1.position;

  if (hPos.z < -0.15) {
    playerGroup.translateZ(-moveSpeed * delta);
  } else if (hPos.z > 0.15) {
    playerGroup.translateZ(moveSpeed * delta);
  }

  if (canTurn) {
    if (hPos.x > 0.15) {
      playerGroup.rotation.y -= Math.PI / 4;
      canTurn = false;
      setTimeout(() => (canTurn = true), 450);
    } else if (hPos.x < -0.15) {
      playerGroup.rotation.y += Math.PI / 4;
      canTurn = false;
      setTimeout(() => (canTurn = true), 450);
    }
  }
}
