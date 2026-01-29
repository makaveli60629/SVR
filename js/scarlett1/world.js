import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { makeCasinoFloorTexture } from './modules/floorTexture.js';

export function buildWorld(scene, opts = {}) {
  const holeR = opts.holeRadius ?? 6;
  const outerR = opts.outerRadius ?? 60;
  const pitDepthY = opts.pitY ?? -2.0;
  const wallDepth = opts.wallDepth ?? 14.0;

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a2a, 1.55));
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(7, 14, 7);
  scene.add(key);

  // Upper ring deck (no cap possible)
  const tex = makeCasinoFloorTexture();
  const deckGeo = new THREE.RingGeometry(holeR, outerR, 160, 1);
  deckGeo.rotateX(-Math.PI/2);
  const deck = new THREE.Mesh(deckGeo, new THREE.MeshStandardMaterial({
    map: tex, color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide
  }));
  deck.name = "UpperObservationDeck";
  deck.position.y = 0;
  scene.add(deck);

  // Pit wall
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, wallDepth, 180, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 1.0, side: THREE.DoubleSide })
  );
  wall.name = "PitWall";
  wall.position.y = -wallDepth/2 + 0.05;
  scene.add(wall);

  // Pit floor
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(holeR, 160).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 1.0 })
  );
  pitFloor.name = "PitFloor";
  pitFloor.position.y = pitDepthY;
  scene.add(pitFloor);

  // Rim glow + simple rail
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(holeR + 0.05, 0.14, 18, 220),
    new THREE.MeshStandardMaterial({ color: 0x0b2b6f, emissive: 0x0b2b6f, emissiveIntensity: 2.1, roughness: 0.6 })
  );
  rim.name = "PitRim";
  rim.rotation.x = Math.PI/2;
  rim.position.y = 0.02;
  scene.add(rim);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(holeR + 0.55, 0.06, 10, 160),
    new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.7 })
  );
  rail.rotation.x = Math.PI/2;
  rail.position.y = 1.0;
  scene.add(rail);

  // Corner pillars (visual reference)
  const pillarGeo = new THREE.BoxGeometry(1, 15, 1);
  const positions = [
    [15, 5, 15], [-15, 5, 15], [15, 5, -15], [-15, 5, -15]
  ];
  for (const [x,y,z] of positions){
    const m = new THREE.Mesh(pillarGeo, new THREE.MeshStandardMaterial({ color: 0x8A2BE2, emissive: 0x220044 }));
    m.position.set(x,y,z);
    scene.add(m);
  }

  scene.fog = new THREE.Fog(0x050509, 3.0, 40.0);

  return { holeR, outerR, pitDepthY, wallDepth };
}
