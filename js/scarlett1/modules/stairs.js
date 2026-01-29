
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/**
 * stairs.js — slide-in / slide-out stairs into the pit
 * Usage:
 *   const stairs = addPitStairs(scene, { pitRadius: 6.4, topY: -0.1, bottomY: -10 });
 *   // call stairs.update(dt) each frame
 *   stairs.toggle(); // slide in/out
 */
export function addPitStairs(scene, opts = {}) {
  const pitRadius = opts.pitRadius ?? 6.4;
  const width = opts.width ?? 1.2;
  const stepCount = opts.stepCount ?? 14;

  const topY = opts.topY ?? -0.1;
  const bottomY = opts.bottomY ?? -10.5;

  // Stairs slide from outside rim to inside rim
  const outX = pitRadius + 3.0;
  const inX  = pitRadius - 0.6;

  const group = new THREE.Group();
  scene.add(group);

  // rail glow
  const railMat = new THREE.MeshStandardMaterial({ color: 0x0b2b6f, emissive: 0x0b2b6f, emissiveIntensity: 1.6, roughness: 0.6 });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0x1c1c26, roughness: 0.95 });

  // Build steps as thin boxes descending
  const stair = new THREE.Group();
  group.add(stair);

  const totalDrop = Math.max(2.0, (topY - bottomY));
  for (let i = 0; i < stepCount; i++) {
    const t = i / (stepCount - 1);
    const y = topY - t * totalDrop;
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.12, 0.5),
      sideMat
    );
    step.position.set(0, y, -i * 0.45);
    stair.add(step);

    // Edge strip (helps read steps in VR)
    const lip = new THREE.Mesh(new THREE.BoxGeometry(width, 0.03, 0.52), railMat);
    lip.position.set(0, y + 0.065, -i * 0.45 + 0.02);
    stair.add(lip);
  }

  // Position stairs: face toward center, start OUTSIDE
  stair.position.set(outX, 0, 0);
  stair.rotation.y = Math.PI / 2;

  // Animation state
  let targetX = outX;
  let vel = 0;
  const spring = 22;     // snappy
  const damping = 8.5;
  let isIn = false;

  function toggle() {
    isIn = !isIn;
    targetX = isIn ? inX : outX;
  }

  function setIn(on) {
    isIn = !!on;
    targetX = isIn ? inX : outX;
  }

  function update(dt) {
    // critically damped-ish spring
    const x = stair.position.x;
    const a = (targetX - x) * spring - vel * damping;
    vel += a * dt;
    stair.position.x = x + vel * dt;
  }

  return { group, stair, toggle, setIn, update };
}
