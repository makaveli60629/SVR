import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { createFuturisticTable } from './modules/futuristicTable.js';

/**
 * FULL RESTORE (SAFE) - NO-GLTF HOTFIX
 * Purpose: Restore visuals + interaction WITHOUT any GLTFLoader imports (those can hard-fail on mobile due to bare "three" specifiers).
 * Avatars are replaced with lightweight placeholder bots until we re-introduce GLTF safely.
 */

function addMegaLights(scene, outerR){
  const g = new THREE.Group(); g.name="MegaLights";
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dir = new THREE.DirectionalLight(0xffffff, 0.65);
  dir.position.set(8, 14, 10);
  g.add(dir);

  const top = new THREE.PointLight(0xffffff, 1.2, 140);
  top.position.set(0, 10.5, 0);
  g.add(top);

  for (let i=0;i<14;i++){
    const a=(i/14)*Math.PI*2;
    const p=new THREE.PointLight(0x8a2be2, 1.1, 70);
    p.position.set(Math.cos(a)*(outerR*0.55), 6.0, Math.sin(a)*(outerR*0.55));
    g.add(p);
  }
  scene.add(g);
  return g;
}

function addDeck(scene, holeR, outerR){
  const deck = new THREE.Mesh(
    new THREE.RingGeometry(holeR, outerR, 180, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 1.0, metalness: 0.05, side: THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI/2;
  deck.position.y = 0;
  deck.name="UpperDeck";
  scene.add(deck);

  const grid = new THREE.GridHelper(outerR*2, 80, 0x2a2a44, 0x141422);
  grid.position.y = 0.01;
  scene.add(grid);
  return deck;
}

function addPit(scene, holeR, pitY){
  const pit = new THREE.Mesh(
    new THREE.CircleGeometry(holeR, 180),
    new THREE.MeshStandardMaterial({ color: 0x07070f, roughness: 1.0, metalness: 0.02, side: THREE.DoubleSide })
  );
  pit.rotation.x = -Math.PI/2;
  pit.position.y = pitY;
  pit.name="PitFloor";
  scene.add(pit);
  return pit;
}

function addLobbyShell(scene, outerR){
  const g = new THREE.Group(); g.name="LobbyShell";
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x05050b, roughness: 0.95, side: THREE.DoubleSide });
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, 10.5, 200, 1, true), wallMat);
  outerWall.position.y = 5.25;
  g.add(outerWall);
  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(outerR-0.7, outerR-0.7, 10.5, 200, 1, true), wallMat);
  innerWall.position.y = 5.25;
  g.add(innerWall);

  const ceiling = new THREE.Mesh(
    new THREE.RingGeometry(6.0, outerR, 200, 1),
    new THREE.MeshStandardMaterial({ color: 0x040409, roughness: 1.0, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = -Math.PI/2;
  ceiling.position.y = 10.5;
  g.add(ceiling);

  const neonMat = new THREE.MeshStandardMaterial({ color: 0x8a2be2, emissive: 0x8a2be2, emissiveIntensity: 1.25, roughness: 0.5 });
  for (let i=0;i<3;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(outerR-1.6-i*1.0, 0.07, 12, 240), neonMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 9.9 - i*0.7;
    g.add(ring);
  }

  scene.add(g);
  return g;
}

function addDoorsAndJumbotrons(scene, outerR){
  const g = new THREE.Group(); g.name="DoorsAndScreens";
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x0f0f18, roughness: 0.9 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0d0d14, roughness: 0.85, metalness: 0.15 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.95, roughness: 0.55 });

  const screenR = outerR - 0.75;
  const angles = [0, (2*Math.PI)/3, (4*Math.PI)/3];
  angles.forEach((a, i)=>{
    const door = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.8, 0.18), doorMat);
    door.position.set(Math.cos(a)*(screenR-0.15), 2.0, Math.sin(a)*(screenR-0.15));
    door.lookAt(0,2.0,0);
    door.name = i===0 ? "Door_Store" : `Door_${i}`;
    g.add(door);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(7.6, 4.3, 0.24), frameMat);
    frame.position.set(Math.cos(a)*screenR, 6.2, Math.sin(a)*screenR);
    frame.lookAt(0,6.2,0);
    g.add(frame);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.9), screenMat);
    screen.position.set(Math.cos(a)*(screenR-0.14), 6.2, Math.sin(a)*(screenR-0.14));
    screen.lookAt(0,6.2,0);
    screen.name = "Jumbotron";
    g.add(screen);
  });

  scene.add(g);
  return g;
}

function addRail(scene, holeR, entranceAngle){
  const g = new THREE.Group(); g.name="Rail";
  const railY = 1.0;
  const postMat = new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.8 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: 0.6, metalness: 0.25 });

  const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 12);
  const topGeo = new THREE.TorusGeometry(holeR+0.85, 0.04, 10, 220);
  const midGeo = new THREE.TorusGeometry(holeR+0.85, 0.03, 10, 220);

  const top = new THREE.Mesh(topGeo, railMat);
  top.rotation.x = Math.PI/2;
  top.position.y = railY;
  g.add(top);

  const mid = new THREE.Mesh(midGeo, railMat);
  mid.rotation.x = Math.PI/2;
  mid.position.y = railY-0.35;
  g.add(mid);

  const count = 64;
  const gap = Math.PI/10;
  for (let i=0;i<count;i++){
    const a = (i/count)*Math.PI*2;
    const da = Math.atan2(Math.sin(a-entranceAngle), Math.cos(a-entranceAngle));
    if (Math.abs(da) < gap) continue;
    const p = new THREE.Mesh(postGeo, postMat);
    p.position.set(Math.cos(a)*(holeR+0.85), 0.5, Math.sin(a)*(holeR+0.85));
    g.add(p);
  }

  scene.add(g);
  return g;
}

function addStairs(scene, holeR, pitY, entranceAngle){
  const g = new THREE.Group(); g.name="Stairs";
  const steps = 14;
  const stepH = (0 - pitY) / steps;
  const stepD = 0.28;
  const w = 1.25;

  const mat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.95 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x8a2be2, emissive: 0x8a2be2, emissiveIntensity: 0.8, roughness: 0.5 });

  const startR = holeR + 0.75;
  for (let i=0;i<steps;i++){
    const s = new THREE.Mesh(new THREE.BoxGeometry(w, stepH*0.95, stepD), mat);
    const t = i/(steps-1);
    const y = 0 - t*(0 - pitY) - stepH*0.5;
    const r = startR - t*1.25;
    s.position.set(Math.cos(entranceAngle)*r, y, Math.sin(entranceAngle)*r);
    s.rotation.y = -entranceAngle;
    g.add(s);
  }

  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.04, (0-pitY)+0.2, 0.04), railMat);
  railL.position.set(Math.cos(entranceAngle)*(startR-0.15), (0+pitY)/2+0.1, Math.sin(entranceAngle)*(startR-0.15));
  railL.rotation.y = -entranceAngle;
  g.add(railL);

  const railR = railL.clone();
  railR.position.set(Math.cos(entranceAngle)*(startR+0.15), (0+pitY)/2+0.1, Math.sin(entranceAngle)*(startR+0.15));
  g.add(railR);

  scene.add(g);
  return g;
}

function addBalcony(scene, outerR, entranceAngle){
  const g = new THREE.Group(); g.name="Balcony";
  const y = 6.8;
  const inner = outerR-6.0;
  const outer = outerR-2.5;

  const deck = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 200, 1),
    new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 1.0, metalness: 0.05, side: THREE.DoubleSide })
  );
  deck.rotation.x = -Math.PI/2;
  deck.position.y = y;
  g.add(deck);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(outer-0.35, 0.05, 10, 240),
    new THREE.MeshStandardMaterial({ color: 0x1a1a26, roughness: 0.5, metalness: 0.3 })
  );
  rail.rotation.x = Math.PI/2;
  rail.position.y = y+1.0;
  g.add(rail);

  const gap = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.5), new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent:true, opacity:0.35 }));
  const r = outer-0.35;
  gap.position.set(Math.cos(entranceAngle)*r, y+0.05, Math.sin(entranceAngle)*r);
  gap.rotation.y = -entranceAngle;
  g.add(gap);

  scene.add(g);
  return g;
}

function addStorePad(scene, outerR, storeAngle){
  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 48),
    new THREE.MeshBasicMaterial({ color: 0x8a2be2, transparent:true, opacity:0.55 })
  );
  pad.rotation.x = -Math.PI/2;
  pad.position.set(Math.cos(storeAngle)*(outerR-2.0), 0.02, Math.sin(storeAngle)*(outerR-2.0));
  pad.name = "STORE_PAD";
  scene.add(pad);
  return pad;
}

function spawnPlaceholderPlayers(scene, center, y, radius){
  const g = new THREE.Group(); g.name="Players";
  const capGeo = new THREE.CapsuleGeometry(0.22, 0.85, 6, 12);
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x2b5cff, roughness:0.8 }),
    new THREE.MeshStandardMaterial({ color: 0xff3b7a, roughness:0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x00c2ff, roughness:0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x7cff4a, roughness:0.8 }),
  ];
  for (let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2;
    const m=new THREE.Mesh(capGeo, mats[i%4]);
    m.position.set(center.x+Math.cos(a)*radius, y+0.45, center.z+Math.sin(a)*radius);
    m.lookAt(center.x, y+0.45, center.z);
    m.name=`PLAYER_${i}`;
    g.add(m);
  }
  scene.add(g);
  return g;
}

function spawnPlaceholderGuard(scene, holeR, entranceAngle){
  const geo = new THREE.CapsuleGeometry(0.26, 0.95, 6, 12);
  const mat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive:0x8a2be2, emissiveIntensity:0.25 });
  const m = new THREE.Mesh(geo, mat);
  const r = holeR + 0.55;
  m.position.set(Math.cos(entranceAngle)*r, 0.6, Math.sin(entranceAngle)*r);
  m.rotation.y = -entranceAngle + Math.PI;
  m.name="GUARD_PLACEHOLDER";
  scene.add(m);
  return m;
}

export function initWorld(ctx){
  const { scene, camera, log } = ctx;

  const holeR = 6.0;
  const outerR = 70.0;
  const pitY  = -1.65;
  const entranceAngle = Math.PI/2;
  const storeAngle = 0;

  addMegaLights(scene, outerR);
  addDeck(scene, holeR, outerR);
  addPit(scene, holeR, pitY);
  addLobbyShell(scene, outerR);
  addDoorsAndJumbotrons(scene, outerR);
  addRail(scene, holeR, entranceAngle);
  addStairs(scene, holeR, pitY, entranceAngle);
  addBalcony(scene, outerR, entranceAngle);

  const storePad = addStorePad(scene, outerR, storeAngle);

  const tableY = pitY + 0.35;
  const table = createFuturisticTable(scene, { tableY, tableRadius: 2.95, chairRadius: 4.10 });
  table.group.position.set(0, tableY, 0);

  // Placeholders (no GLTF)
  spawnPlaceholderPlayers(scene, new THREE.Vector3(0,0,0), pitY, 4.8);
  spawnPlaceholderGuard(scene, holeR, entranceAngle);

  camera.position.set(0, 1.6, 14);
  camera.lookAt(0, 1.4, 0);

  log('[boot] stadium built ✅ (no-gltf)');
  const interactables = [storePad];

  return {
    updates:[(dt)=>{ if (table?.update) table.update(dt); }],
    interactables,
    onStorePad: ()=>{
      const el = document.getElementById('storePanel');
      if (!el) return;
      el.style.display = (el.style.display==='none' || !el.style.display) ? 'block' : 'none';
    }
  };
}
