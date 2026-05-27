import * as THREE from "three";

export const CELESTIAL_LOCK_VERSION = "PHASE-85-TRUE-LOBBY-KIOSK-SCORPION-CELESTIAL-LOCK";

export function createCelestialLock({ scene, R = 30, wallHeight = 7, moon, mars, moonHalo, marsHalo, moonGlow, marsGlow } = {}){
  const base = {
    moon: new THREE.Vector3(-86, wallHeight + 92, -(R + 226)),
    mars: new THREE.Vector3(122, wallHeight + 108, -(R + 276))
  };

  function tuneOrb(mesh, kind){
    if (!mesh) return;
    mesh.frustumCulled = false;
    mesh.visible = true;
    mesh.renderOrder = 2;
    if (mesh.material){
      mesh.material.depthTest = true;
      mesh.material.depthWrite = true;
      mesh.material.toneMapped = true;
      mesh.material.emissiveIntensity = kind === 'moon' ? 0.18 : 0.22;
      if (kind === 'moon'){
        mesh.material.color?.set?.(0xffffff);
        mesh.material.emissive?.set?.(0x29384f);
      } else {
        mesh.material.color?.set?.(0xff8a58);
        mesh.material.emissive?.set?.(0x4a1508);
      }
      mesh.material.needsUpdate = true;
    }
  }

  tuneOrb(moon, 'moon');
  tuneOrb(mars, 'mars');
  if (moonHalo){ moonHalo.frustumCulled = false; moonHalo.visible = true; moonHalo.scale.set(58,58,1); moonHalo.material.depthTest = false; }
  if (marsHalo){ marsHalo.frustumCulled = false; marsHalo.visible = true; marsHalo.scale.set(38,38,1); marsHalo.material.depthTest = false; }
  if (moonGlow){ moonGlow.visible = true; moonGlow.intensity = 3.25; moonGlow.distance = 720; }
  if (marsGlow){ marsGlow.visible = true; marsGlow.intensity = 2.15; marsGlow.distance = 520; }

  const lockedObjects = { moon, mars, moonHalo, marsHalo, moonGlow, marsGlow, base };
  scene.userData.SVR_CELESTIAL_LOCK = {
    phase: CELESTIAL_LOCK_VERSION,
    rule: 'Moon and Mars stay high above skyline and reused by private rooms.',
    base
  };
  return lockedObjects;
}

export function tickCelestialLock(lock, t = 0, dt = 0){
  if (!lock) return;
  const moonPos = lock.base.moon.clone().add(new THREE.Vector3(Math.sin(t*0.018)*7.0, Math.sin(t*0.06)*1.2, Math.cos(t*0.012)*4.0));
  const marsPos = lock.base.mars.clone().add(new THREE.Vector3(Math.sin(t*0.014+1.1)*8.0, Math.sin(t*0.05+0.7)*1.0, Math.cos(t*0.011+0.3)*4.2));
  if (lock.moon){ lock.moon.position.copy(moonPos); lock.moon.visible = true; lock.moon.rotation.y += dt*0.08; }
  if (lock.mars){ lock.mars.position.copy(marsPos); lock.mars.visible = true; lock.mars.rotation.y += dt*0.06; }
  if (lock.moonHalo){ lock.moonHalo.position.copy(moonPos); lock.moonHalo.visible = true; lock.moonHalo.material.opacity = 0.075 + 0.018 * (0.5 + 0.5*Math.sin(t*0.24)); }
  if (lock.marsHalo){ lock.marsHalo.position.copy(marsPos); lock.marsHalo.visible = true; lock.marsHalo.material.opacity = 0.052 + 0.018 * (0.5 + 0.5*Math.sin(t*0.28)); }
  if (lock.moonGlow) lock.moonGlow.position.copy(moonPos);
  if (lock.marsGlow) lock.marsGlow.position.copy(marsPos);
}
