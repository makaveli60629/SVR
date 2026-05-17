import * as THREE from "three";
import { NPC_AVATAR_REGISTRY, NPC_SCENE_SPAWNS, SVR_AVATAR_NPC_PHASE } from "./avatar_asset_registry.js";

const tmpV = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

function makeLabel(text){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.strokeStyle = "rgba(150,255,214,0.7)";
  ctx.lineWidth = 4;
  roundRect(ctx, 14, 18, 484, 88, 24);
  ctx.fill();
  ctx.stroke();
  ctx.font = "bold 42px system-ui, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f3fff8";
  ctx.fillText(text, 256, 62);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const spr = new THREE.Sprite(mat);
  spr.scale.set(1.1, 0.28, 1);
  spr.position.y = 2.05;
  return spr;
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeFallbackAvatar(def, labelText){
  const root = new THREE.Group();
  root.name = `SVR_FALLBACK_NPC_${def.id}`;
  const color = def.fallbackColor || 0xffffff;
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.04 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x15131c, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6a47a, roughness: 0.82 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.72, 8, 16), bodyMat);
  body.position.y = 1.03;
  root.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), skinMat);
  head.position.y = 1.68;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.185, 18, 8), darkMat);
  hair.position.y = 1.76;
  hair.scale.set(1, 0.45, 1);
  root.add(hair);

  const armGeo = new THREE.CapsuleGeometry(0.045, 0.55, 6, 10);
  const legGeo = new THREE.CapsuleGeometry(0.055, 0.62, 6, 10);
  const armL = new THREE.Mesh(armGeo, skinMat);
  const armR = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.29, 1.12, 0.02); armR.position.set(0.29, 1.12, 0.02);
  armL.rotation.z = 0.28; armR.rotation.z = -0.28;
  root.add(armL, armR);
  const legL = new THREE.Mesh(legGeo, darkMat);
  const legR = new THREE.Mesh(legGeo, darkMat);
  legL.position.set(-0.10, 0.38, 0); legR.position.set(0.10, 0.38, 0);
  root.add(legL, legR);

  root.userData._proceduralParts = { armL, armR, legL, legR, head };
  root.add(makeLabel(labelText || def.displayName || def.id));
  return root;
}

async function loadRuntimeTexture(url, normalUrl){
  const loader = new THREE.TextureLoader();
  const map = await loader.loadAsync(url).catch(()=>null);
  const normalMap = normalUrl ? await loader.loadAsync(normalUrl).catch(()=>null) : null;
  if (map) map.colorSpace = THREE.SRGBColorSpace;
  return { map, normalMap };
}

async function loadFbxAvatar(def, labelText, log){
  let FBXLoader;
  try {
    ({ FBXLoader } = await import("three/addons/loaders/FBXLoader.js"));
  } catch (err){
    log?.("[Phase84] FBXLoader unavailable; using procedural NPC fallback", err?.message || err);
    return makeFallbackAvatar(def, labelText);
  }

  const loader = new FBXLoader();
  const group = await loader.loadAsync(def.fbx).catch((err)=>{
    log?.(`[Phase84] Failed to load ${def.fbx}; fallback created`, err?.message || err);
    return null;
  });
  if (!group) return makeFallbackAvatar(def, labelText);

  group.name = `SVR_RIGGED_NPC_${def.id}`;
  group.scale.setScalar(def.scale || 0.01);
  group.traverse((obj)=>{
    if (obj.isMesh){
      obj.castShadow = false;
      obj.receiveShadow = false;
      if (Array.isArray(obj.material)) obj.material.forEach((m)=>{ if (m) m.needsUpdate = true; });
      else if (obj.material) obj.material.needsUpdate = true;
    }
  });

  // Light texture override. If the FBX material paths resolve naturally, this is harmless.
  try {
    const tex = await loadRuntimeTexture(def.diffuse, def.normal);
    group.traverse((obj)=>{
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m)=>{
        if (!m) return;
        if (tex.map && !m.map) m.map = tex.map;
        if (tex.normalMap && !m.normalMap) m.normalMap = tex.normalMap;
        m.roughness = Math.max(0.55, m.roughness ?? 0.7);
        m.needsUpdate = true;
      });
    });
  } catch {}

  group.add(makeLabel(labelText || def.displayName || def.id));
  return group;
}

function placeRoot(root, spawn){
  const p = spawn.position || spawn.path?.[0] || { x: 0, y: 0, z: 0 };
  root.position.set(p.x || 0, p.y || 0, p.z || 0);
  if (spawn.lookAt){
    tmpLook.set(spawn.lookAt.x || 0, spawn.lookAt.y || 1.4, spawn.lookAt.z || 0);
    root.lookAt(tmpLook);
  }
}

export function createNpcAvatarSystem({ scene, log } = {}){
  const root = new THREE.Group();
  root.name = `SVR_NPC_AVATAR_SYSTEM_${SVR_AVATAR_NPC_PHASE}`;
  scene.add(root);

  const actors = [];
  const state = {
    phase: SVR_AVATAR_NPC_PHASE,
    ready: false,
    actors,
    enabled: true,
    source: "assets.zip optimized runtime intake"
  };

  async function boot(){
    for (const spawn of NPC_SCENE_SPAWNS){
      const def = NPC_AVATAR_REGISTRY[spawn.avatar];
      if (!def) continue;
      const actorRoot = new THREE.Group();
      actorRoot.name = `SVR_NPC_SLOT_${spawn.id}`;
      placeRoot(actorRoot, spawn);
      root.add(actorRoot);

      const fallback = makeFallbackAvatar(def, spawn.label);
      actorRoot.add(fallback);

      actors.push({
        spawn,
        def,
        root: actorRoot,
        model: fallback,
        pathIndex: 1,
        phaseOffset: Math.random() * 10,
        loaded: false
      });

      loadFbxAvatar(def, spawn.label, log).then((loaded)=>{
        if (!loaded) return;
        actorRoot.remove(fallback);
        actorRoot.add(loaded);
        const actor = actors.find(a => a.root === actorRoot);
        if (actor){ actor.model = loaded; actor.loaded = !loaded.name.includes("FALLBACK"); }
      });
    }
    state.ready = true;
    window.SVR_NPC_AVATAR_SYSTEM = state;
    log?.(`[Phase84] NPC avatar system booted: ${actors.length} avatar slots`);
  }

  boot();

  function update(dt){
    if (!state.enabled) return;
    const now = performance.now() * 0.001;
    for (const actor of actors){
      const { spawn, root: actorRoot, model } = actor;
      if (spawn.mode === "walk_loop" && spawn.path?.length > 1){
        const target = spawn.path[actor.pathIndex % spawn.path.length];
        tmpV.set(target.x || 0, target.y || 0, target.z || 0);
        const pos = actorRoot.position;
        const dist = pos.distanceTo(tmpV);
        if (dist < 0.08){
          actor.pathIndex = (actor.pathIndex + 1) % spawn.path.length;
        } else {
          const step = Math.min(dist, (spawn.speed || 0.35) * dt);
          pos.lerp(tmpV, step / Math.max(dist, 0.0001));
          const look = tmpV.clone();
          look.y = pos.y;
          actorRoot.lookAt(look);
        }
      }
      const bob = Math.sin(now * 3.0 + actor.phaseOffset) * 0.012;
      if (model) model.position.y = bob;
      const parts = model?.userData?._proceduralParts;
      if (parts){
        const s = Math.sin(now * 4.0 + actor.phaseOffset);
        parts.armL.rotation.x = s * 0.22;
        parts.armR.rotation.x = -s * 0.22;
        parts.legL.rotation.x = -s * 0.18;
        parts.legR.rotation.x = s * 0.18;
        parts.head.rotation.y = Math.sin(now * 1.2 + actor.phaseOffset) * 0.1;
      }
    }
  }

  function setEnabled(on){ state.enabled = !!on; root.visible = state.enabled; }
  function dispose(){ root.removeFromParent(); }

  return { update, setEnabled, dispose, state, root };
}
