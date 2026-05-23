import * as THREE from "three";

const PHASE = "PHASE-132-FLOOR-PERFORMANCE-RUNTIME-REPAIR-LOCK";

function isInsideNamedParent(obj, name){
  let p = obj;
  while (p){
    if (p.name === name) return true;
    p = p.parent;
  }
  return false;
}

function makeCasinoFloorTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const x = c.getContext("2d");
  const bg = x.createRadialGradient(512,512,60,512,512,620);
  bg.addColorStop(0,"#273061");
  bg.addColorStop(.32,"#151d3d");
  bg.addColorStop(.72,"#090d22");
  bg.addColorStop(1,"#050712");
  x.fillStyle = bg;
  x.fillRect(0,0,1024,1024);

  x.lineWidth = 4;
  for (let i = 0; i <= 1024; i += 128){
    x.strokeStyle = "rgba(127,245,199,.32)";
    x.beginPath(); x.moveTo(i,0); x.lineTo(i,1024); x.stroke();
    x.beginPath(); x.moveTo(0,i); x.lineTo(1024,i); x.stroke();
  }
  x.lineWidth = 2;
  for (let i = 64; i <= 1024; i += 128){
    x.strokeStyle = "rgba(180,140,255,.20)";
    x.beginPath(); x.moveTo(i,0); x.lineTo(i,1024); x.stroke();
    x.beginPath(); x.moveTo(0,i); x.lineTo(1024,i); x.stroke();
  }

  x.strokeStyle = "rgba(246,226,127,.42)";
  x.lineWidth = 10;
  x.beginPath(); x.arc(512,512,392,0,Math.PI*2); x.stroke();
  x.strokeStyle = "rgba(127,245,199,.38)";
  x.lineWidth = 7;
  x.beginPath(); x.arc(512,512,240,0,Math.PI*2); x.stroke();

  x.font = "900 54px system-ui, Arial";
  x.textAlign = "center";
  x.fillStyle = "rgba(246,226,127,.55)";
  x.fillText("SVR",512,500);
  x.font = "800 28px system-ui, Arial";
  x.fillStyle = "rgba(127,245,199,.50)";
  x.fillText("LOBBY FLOOR",512,542);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2,2);
  tex.anisotropy = 2;
  return tex;
}

function ensureHardFloor(parent, radius = 24){
  if (!parent) return null;
  let group = parent.getObjectByName("SVR_PHASE132_HARD_LOBBY_FLOOR");
  if (group) return group;

  group = new THREE.Group();
  group.name = "SVR_PHASE132_HARD_LOBBY_FLOOR";
  parent.add(group);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.05, radius * 2.05, 1, 1),
    new THREE.MeshBasicMaterial({
      map: makeCasinoFloorTexture(),
      color: 0xffffff,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      fog: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -8,
      polygonOffsetUnits: -8
    })
  );
  floor.name = "SVR_PHASE132_VISIBLE_FLOOR_PLANE";
  floor.rotation.x = -Math.PI * 0.5;
  floor.position.y = 0.026;
  floor.renderOrder = 80;
  group.add(floor);

  const outerRing = new THREE.Mesh(
    new THREE.RingGeometry(radius * .96, radius * 1.02, 128),
    new THREE.MeshBasicMaterial({ color:0x00f5d4, transparent:true, opacity:.50, side:THREE.DoubleSide, depthWrite:false, fog:false, toneMapped:false })
  );
  outerRing.name = "SVR_PHASE132_FLOOR_OUTER_RING";
  outerRing.rotation.x = -Math.PI * 0.5;
  outerRing.position.y = 0.045;
  outerRing.renderOrder = 82;
  group.add(outerRing);

  const tableSafe = new THREE.Mesh(
    new THREE.RingGeometry(6.25, 7.55, 96),
    new THREE.MeshBasicMaterial({ color:0xf6e27f, transparent:true, opacity:.22, side:THREE.DoubleSide, depthWrite:false, fog:false, toneMapped:false })
  );
  tableSafe.name = "SVR_PHASE132_TABLE_SPAWN_EXCLUSION_RING";
  tableSafe.rotation.x = -Math.PI * 0.5;
  tableSafe.position.y = 0.052;
  tableSafe.renderOrder = 83;
  group.add(tableSafe);

  return group;
}

function hideDuplicateLowPlanets(root){
  if (!root) return 0;
  let hidden = 0;
  root.traverse((obj)=>{
    if (!obj?.isMesh || isInsideNamedParent(obj, "SVR_PHASE130_ORBIT_SKY_SYSTEM")) return;
    const geo = obj.geometry;
    const radius = geo?.parameters?.radius;
    if (geo?.type === "SphereGeometry" && radius >= 2 && radius <= 12 && obj.position.y > 30){
      obj.visible = false;
      hidden += 1;
    }
  });
  return hidden;
}

function reduceExpensiveAtmosphere(root){
  if (!root) return { lights:0, sprites:0, meshes:0 };
  const counts = { lights:0, sprites:0, meshes:0 };
  root.traverse((obj)=>{
    if (!obj) return;
    if (obj.isLight){
      if (!obj.userData._svrOriginalIntensity) obj.userData._svrOriginalIntensity = obj.intensity || 1;
      obj.intensity = Math.min(obj.intensity || 0, obj.userData._svrOriginalIntensity * 0.34, 2.8);
      obj.castShadow = false;
      counts.lights += 1;
    }
    if (obj.isSprite && !isInsideNamedParent(obj, "SVR_PHASE130_ORBIT_SKY_SYSTEM")){
      if (obj.material && "opacity" in obj.material) obj.material.opacity = Math.min(obj.material.opacity || 0.18, 0.045);
      counts.sprites += 1;
    }
    if (obj.isMesh){
      obj.castShadow = false;
      obj.receiveShadow = false;
      counts.meshes += 1;
      if (obj.material){
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m)=>{
          if (!m) return;
          if ("envMapIntensity" in m) m.envMapIntensity = Math.min(m.envMapIntensity || 0.15, 0.10);
          if ("metalness" in m) m.metalness = Math.min(m.metalness || 0, 0.35);
          m.needsUpdate = true;
        });
      }
    }
  });
  return counts;
}

export function installLobbyRuntimeRepair({ scene, worldRoot, radius = 24, camera = null, renderer = null } = {}){
  const parent = worldRoot || scene;
  const state = {
    phase: PHASE,
    siteTouched: false,
    floor: false,
    duplicatePlanetsHidden: 0,
    reductions: null,
    lastUpdate: null
  };

  function apply(){
    const floor = ensureHardFloor(parent, radius);
    state.floor = Boolean(floor);
    state.duplicatePlanetsHidden = hideDuplicateLowPlanets(parent) + hideDuplicateLowPlanets(scene);
    state.reductions = reduceExpensiveAtmosphere(parent);
    if (renderer){
      try { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.48)); } catch {}
      try { renderer.xr?.setFramebufferScaleFactor?.(0.48); } catch {}
      try { renderer.xr?.setFoveation?.(1.0); } catch {}
    }
    if (camera){
      camera.near = 0.09;
      camera.far = 1700;
      camera.updateProjectionMatrix?.();
    }
    state.lastUpdate = new Date().toISOString();
    window.SVR_PHASE132_LOBBY_RUNTIME_REPAIR = state;
    return state;
  }

  function update(){
    const floor = parent?.getObjectByName?.("SVR_PHASE132_HARD_LOBBY_FLOOR");
    if (floor){
      floor.visible = true;
      floor.children.forEach((child)=>{ child.visible = true; });
    }
  }

  apply();
  return { phase: PHASE, state, apply, update };
}
