import * as THREE from "three";
import { NPC_AVATAR_REGISTRY, NPC_SCENE_SPAWNS, SVR_AVATAR_NPC_PHASE } from "./avatar_asset_registry.js";
import { detectNpcSceneKey, shouldSpawnInScene, placeActorRoot, updateActorMotion } from "./npc_motion_controller.js";

const PHASE_126 = "PHASE-126-NPC-AVATAR-PROFESSIONAL-POLISH-LOCK";

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
  spr.position.y = 2.12;
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

function makeEye(x){
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshBasicMaterial({ color: 0x101018 }));
  eye.position.set(x, 1.70, 0.158);
  return eye;
}
function makeCardProp(){
  const mat = new THREE.MeshBasicMaterial({ color: 0xf7f4ff, side: THREE.DoubleSide });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.105), mat);
  card.name = "SVR_NPC_CARD_PROP";
  card.position.set(0, -0.33, 0.04);
  card.rotation.x = -0.65;
  return card;
}
function makeChipProp(){
  const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 18), new THREE.MeshStandardMaterial({ color: 0xff6b7f, roughness: 0.55, metalness: 0.05 }));
  chip.name = "SVR_NPC_CHIP_PROP";
  chip.position.set(0, -0.32, 0.05);
  chip.rotation.x = Math.PI / 2;
  return chip;
}

function makeFallbackAvatar(def, labelText){
  const root = new THREE.Group();
  root.name = `SVR_PHASE126_PROCEDURAL_NPC_${def.id}`;
  const color = def.fallbackColor || 0xffffff;
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.05, emissive: 0x050509, emissiveIntensity: 0.02 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x10131f, roughness: 0.78, metalness: 0.06 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6a47a, roughness: 0.82 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x15131c, roughness: 0.8 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x08090d, roughness: 0.84 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.76, 8, 18), bodyMat);
  torso.position.y = 1.03;
  torso.scale.set(0.86, 1.05, 0.62);
  root.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.52, 0.11), vestMat);
  vest.position.set(0, 1.08, 0.065);
  root.add(vest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.12, 12), skinMat);
  neck.position.y = 1.48;
  root.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14), skinMat);
  head.position.y = 1.70;
  head.scale.set(0.92, 1.05, 0.88);
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.187, 18, 8), darkMat);
  hair.position.y = 1.79;
  hair.scale.set(1.0, 0.42, 0.92);
  root.add(hair);
  root.add(makeEye(-0.055), makeEye(0.055));

  const shoulderGeo = new THREE.SphereGeometry(0.066, 12, 8);
  const shoulderL = new THREE.Mesh(shoulderGeo, bodyMat);
  const shoulderR = shoulderL.clone();
  shoulderL.position.set(-0.245, 1.36, 0.02);
  shoulderR.position.set(0.245, 1.36, 0.02);
  root.add(shoulderL, shoulderR);

  const armGeo = new THREE.CapsuleGeometry(0.043, 0.52, 6, 12);
  const handGeo = new THREE.SphereGeometry(0.052, 10, 8);
  const armL = new THREE.Mesh(armGeo, skinMat);
  const armR = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.31, 1.08, 0.04); armR.position.set(0.31, 1.08, 0.04);
  armL.rotation.z = 0.26; armR.rotation.z = -0.26;
  const handL = new THREE.Mesh(handGeo, skinMat);
  const handR = new THREE.Mesh(handGeo, skinMat);
  handL.position.set(-0.34, 0.78, 0.08); handR.position.set(0.34, 0.78, 0.08);
  root.add(armL, armR, handL, handR);

  const legGeo = new THREE.CapsuleGeometry(0.055, 0.62, 6, 10);
  const legL = new THREE.Mesh(legGeo, darkMat);
  const legR = new THREE.Mesh(legGeo, darkMat);
  legL.position.set(-0.10, 0.38, 0); legR.position.set(0.10, 0.38, 0);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), shoeMat);
  const shoeR = shoeL.clone();
  shoeL.position.set(-0.10, 0.05, 0.055); shoeR.position.set(0.10, 0.05, 0.055);
  root.add(legL, legR, shoeL, shoeR);

  const cardL = makeCardProp();
  cardL.position.set(-0.34, 0.73, 0.12);
  const chipR = makeChipProp();
  chipR.position.set(0.34, 0.74, 0.12);
  root.add(cardL, chipR);

  root.userData._proceduralParts = { armL, armR, legL, legR, head, handL, handR, cardL, chipR, torso };
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
    log?.("[Phase126] FBXLoader unavailable; using polished procedural NPC fallback", err?.message || err);
    return makeFallbackAvatar(def, labelText);
  }

  const group = await new FBXLoader().loadAsync(def.fbx).catch((err)=>{
    log?.(`[Phase126] Failed to load ${def.fbx}; polished fallback created`, err?.message || err);
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

export function createNpcAvatarSystem({ scene, seats = [], tableCenter = { x: 0, y: 0, z: 0 }, currentScene = null, maxActors = 6, log } = {}){
  if (!scene) throw new Error("createNpcAvatarSystem requires a THREE.Scene");
  const sceneKey = detectNpcSceneKey(currentScene);
  const root = new THREE.Group();
  root.name = `SVR_NPC_AVATAR_SYSTEM_${SVR_AVATAR_NPC_PHASE}_${sceneKey}`;
  scene.add(root);

  const spawns = NPC_SCENE_SPAWNS.filter(spawn => shouldSpawnInScene(spawn, sceneKey)).slice(0, maxActors);
  const actors = [];
  const state = {
    phase: PHASE_126,
    registryPhase: SVR_AVATAR_NPC_PHASE,
    ready: false,
    actors,
    sceneKey,
    enabled: true,
    source: "Phase126 professional procedural fallback + rigged FBX runtime candidates",
    spawnCount: spawns.length,
    siteTouched: false
  };

  async function boot(){
    for (const spawn of spawns){
      const def = NPC_AVATAR_REGISTRY[spawn.avatar];
      if (!def) continue;
      const actorRoot = new THREE.Group();
      actorRoot.name = `SVR_NPC_SLOT_${spawn.id}`;
      placeActorRoot(actorRoot, spawn, seats, tableCenter);
      if (spawn.scaleBoost) actorRoot.scale.setScalar(spawn.scaleBoost);
      root.add(actorRoot);

      const fallback = makeFallbackAvatar(def, spawn.label);
      actorRoot.add(fallback);
      const actor = { spawn, def, root: actorRoot, model: fallback, pathIndex: 1, phaseOffset: Math.random() * 10, loaded: false };
      actors.push(actor);

      loadFbxAvatar(def, spawn.label, log).then((loaded)=>{
        if (!loaded) return;
        actorRoot.remove(fallback);
        actorRoot.add(loaded);
        actor.model = loaded;
        actor.loaded = !loaded.name.includes("FALLBACK") && !loaded.name.includes("PROCEDURAL");
      });
    }
    state.ready = true;
    window.SVR_NPC_AVATAR_SYSTEM = state;
    window.SVR_PHASE126_NPC_AVATAR_POLISH = state;
    log?.(`[Phase126] NPC professional avatar polish booted: ${actors.length} avatar slots for ${sceneKey}`);
  }

  boot();

  function update(dt){
    if (!state.enabled) return;
    const now = performance.now() * 0.001;
    for (const actor of actors) updateActorMotion(actor, dt, now);
  }

  function setEnabled(on){ state.enabled = !!on; root.visible = state.enabled; }
  function dispose(){ root.removeFromParent(); }

  return { update, setEnabled, dispose, state, root };
}
