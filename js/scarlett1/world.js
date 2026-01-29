import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { makeCasinoFloorTexture } from './modules/floorTexture.js';

function addMegaLights(scene, outerR){
  // Base lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a2a, 1.9));
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(10, 18, 10);
  scene.add(key);

  // Ring of point lights around deck
  const count = 16;
  for (let i=0;i<count;i++){
    const a = (i/count)*Math.PI*2;
    const p = new THREE.PointLight(0xffffff, 0.55, 40, 2.0);
    p.position.set(Math.cos(a)*(outerR*0.28), 6.5, Math.sin(a)*(outerR*0.28));
    scene.add(p);
  }

  // Pit down-lights
  const pitCount = 10;
  for (let i=0;i<pitCount;i++){
    const a = (i/pitCount)*Math.PI*2;
    const p = new THREE.PointLight(0x88aaff, 0.35, 25, 2.2);
    p.position.set(Math.cos(a)*7.0, 0.5, Math.sin(a)*7.0);
    scene.add(p);
  }
}

function addRailWithGap(scene, holeR, { entranceAngle=Math.PI/2, gapAngle=Math.PI/6 } = {}){
  // Rim glow with same gap
  const rimArc = Math.PI*2 - gapAngle;
  const rimGeom = new THREE.TorusGeometry(holeR + 0.05, 0.14, 18, 220, rimArc);
  const rim = new THREE.Mesh(rimGeom, new THREE.MeshStandardMaterial({
    color: 0x0b2b6f, emissive: 0x0b2b6f, emissiveIntensity: 2.2, roughness: 0.6
  }));
  rim.name = "PitRim";
  rim.rotation.x = Math.PI/2;
  // Align gap center to entranceAngle
  rim.rotation.y = entranceAngle - (Math.PI*2 - gapAngle/2);
  rim.position.y = 0.02;
  scene.add(rim);

  // Top rail tube with same gap
  const railGeom = new THREE.TorusGeometry(holeR + 0.55, 0.06, 10, 180, rimArc);
  const rail = new THREE.Mesh(railGeom, new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.7 }));
  rail.name = "PitRailTop";
  rail.rotation.x = Math.PI/2;
  rail.rotation.y = rim.rotation.y;
  rail.position.y = 1.0;
  scene.add(rail);

  // Posts (skip in the gap)
  const posts = 28;
  const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 16);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.7 });
  const postGroup = new THREE.Group();
  postGroup.name = "PitRailPosts";
  for (let i=0;i<posts;i++){
    const a = (i/posts)*Math.PI*2;
    // normalize angle to [-pi,pi] around entranceAngle
    let d = a - entranceAngle;
    while (d > Math.PI) d -= Math.PI*2;
    while (d < -Math.PI) d += Math.PI*2;
    if (Math.abs(d) < gapAngle/2) continue; // leave entrance gap
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(Math.cos(a)*(holeR+0.55), 0.55, Math.sin(a)*(holeR+0.55));
    postGroup.add(post);
  }
  scene.add(postGroup);

  return { rim, rail, postGroup, entranceAngle, gapAngle };
}

function addStraightStairs(scene, holeR, pitDepthY, { entranceAngle=Math.PI/2 } = {}){
  const group = new THREE.Group();
  group.name = "PitStairs";

  const stepCount = 18;
  const stairWidth = 1.6;
  const stairDepth = 0.55;
  const topY = 0.0;
  const bottomY = pitDepthY + 0.05;

  const totalDrop = topY - bottomY;
  const riser = totalDrop / stepCount;

  const stairMat = new THREE.MeshStandardMaterial({ color: 0x2b2b36, roughness: 0.9, metalness: 0.05 });
  const treadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.85, metalness: 0.1 });

  for (let i=0;i<stepCount;i++){
    const h = Math.max(0.08, riser);
    const step = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, h, stairDepth), stairMat);
    const y = topY - (i+0.5)*riser;
    // Steps extend inward from the rim toward center
    step.position.set(0, y, -i*(stairDepth*0.92));
    group.add(step);

    const tread = new THREE.Mesh(new THREE.BoxGeometry(stairWidth*0.98, Math.min(0.03, h*0.4), stairDepth*0.98), treadMat);
    tread.position.set(0, y + h/2 - 0.015, -i*(stairDepth*0.92));
    group.add(tread);
  }

  // Place at rim at entrance angle and face inward
  const dist = holeR + 0.10; // starts just outside rim then steps go inward
  group.position.set(Math.cos(entranceAngle)*dist, 0, Math.sin(entranceAngle)*dist);
  group.rotation.y = -entranceAngle + Math.PI; // face center

  scene.add(group);
  return group;
}

function addPokerTable8(scene, pitDepthY){
  const group = new THREE.Group();
  group.name = "PokerTableArea";
  group.position.y = pitDepthY;

  // Pedestal
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.9, 2.6, 84),
    new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.75, metalness: 0.1 })
  );
  pedestal.position.y = 1.3;
  group.add(pedestal);

  // Table top
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.15, 2.15, 0.26, 96),
    new THREE.MeshStandardMaterial({ color: 0x0a6b33, roughness: 0.95 })
  );
  table.position.y = 2.65;
  group.add(table);

  // Rail
  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2.25, 0.14, 18, 200),
    new THREE.MeshStandardMaterial({ color: 0x1a0f0a, roughness: 0.85 })
  );
  rail.position.y = 2.78;
  rail.rotation.x = Math.PI/2;
  group.add(rail);

  // 8 divots
  const divotMat = new THREE.MeshStandardMaterial({ color: 0x064a24, roughness: 1.0 });
  const dR = 1.55;
  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const divot = new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.03,36), divotMat);
    divot.position.set(Math.cos(a)*dR, 2.79, Math.sin(a)*dR);
    group.add(divot);

    // Simple chair block
    const chair = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.85, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x14141b, roughness: 0.9 })
    );
    chair.position.set(Math.cos(a)*3.25, 0.42, Math.sin(a)*3.25);
    chair.lookAt(0, chair.position.y, 0);
    group.add(chair);
  }

  scene.add(group);
  return group;
}

function addGuard(scene, holeR, { entranceAngle=Math.PI/2 } = {}){
  // Placeholder guard "avatar" (swap with GLB later)
  const guard = new THREE.Group();
  guard.name = "RailGuard";

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f1016, roughness: 0.7, metalness: 0.25 });
  const emissiveMat = new THREE.MeshStandardMaterial({ color: 0x222244, emissive: 0x3b57ff, emissiveIntensity: 1.8 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.28), bodyMat);
  torso.position.y = 1.2;
  guard.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), bodyMat);
  head.position.y = 1.75;
  guard.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.05), emissiveMat);
  visor.position.set(0, 1.75, 0.20);
  guard.add(visor);

  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), bodyMat);
  leg1.position.set(-0.12, 0.55, 0);
  const leg2 = leg1.clone();
  leg2.position.x = 0.12;
  guard.add(leg1); guard.add(leg2);

  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), bodyMat);
  arm1.position.set(-0.35, 1.25, 0);
  const arm2 = arm1.clone();
  arm2.position.x = 0.35;
  guard.add(arm1); guard.add(arm2);

  // Place by rail gap, slightly to the side
  const dist = holeR + 0.95;
  const offsetAngle = entranceAngle + 0.22; // stands just to the right of entrance
  guard.position.set(Math.cos(offsetAngle)*dist, 0, Math.sin(offsetAngle)*dist);
  guard.lookAt(0, 1.2, 0);

  scene.add(guard);
  return guard;
}

export function buildWorld(scene, opts = {}) {
  const holeR = opts.holeRadius ?? 6;
  const outerR = opts.outerRadius ?? 60;
  const pitDepthY = opts.pitY ?? -2.0;
  const wallDepth = opts.wallDepth ?? 16.0;

  const entranceAngle = opts.entranceAngle ?? Math.PI/2; // +Z
  const gapAngle = opts.gapAngle ?? (Math.PI/5); // 36 degrees gap

  addMegaLights(scene, outerR);

  // Upper ring deck (no cap possible)
  const tex = makeCasinoFloorTexture();
  const deckGeo = new THREE.RingGeometry(holeR, outerR, 180, 1);
  deckGeo.rotateX(-Math.PI/2);
  const deck = new THREE.Mesh(deckGeo, new THREE.MeshStandardMaterial({
    map: tex, color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide
  }));
  deck.name = "UpperObservationDeck";
  deck.position.y = 0;
  scene.add(deck);

  // Pit wall
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(holeR, holeR, wallDepth, 200, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 1.0, side: THREE.DoubleSide })
  );
  wall.name = "PitWall";
  wall.position.y = -wallDepth/2 + 0.05;
  scene.add(wall);

  // Pit floor
  const pitFloor = new THREE.Mesh(
    new THREE.CircleGeometry(holeR, 180).rotateX(-Math.PI/2),
    new THREE.MeshStandardMaterial({ color: 0x07070c, roughness: 1.0 })
  );
  pitFloor.name = "PitFloor";
  pitFloor.position.y = pitDepthY;
  scene.add(pitFloor);

  // Rail with entrance gap
  const rail = addRailWithGap(scene, holeR, { entranceAngle, gapAngle });

  // Stairs aligned with entrance
  const stairs = addStraightStairs(scene, holeR, pitDepthY, { entranceAngle });

  // Table + 8 chairs in pit
  const tableArea = addPokerTable8(scene, pitDepthY);

  // Guard at entrance
  const guard = addGuard(scene, holeR, { entranceAngle });

  // Fog for depth
  scene.fog = new THREE.Fog(0x050509, 3.0, 55.0);

  return { holeR, outerR, pitDepthY, wallDepth, entranceAngle, gapAngle, rail, stairs, tableArea, guard };
}
