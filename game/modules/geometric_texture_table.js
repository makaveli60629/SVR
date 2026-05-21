// PHASE-93-STANDALONE-GEOMETRIC-TEXTURE-TABLE
// Game-side only. This is NOT the Scorpion storefront proxy.
// It creates a separate geometric display table using uploaded texture maps when available.
// It is safe to lazy-load after the lobby renders.

import * as THREE from "three";

const PHASE = "PHASE-93-STANDALONE-GEOMETRIC-TEXTURE-TABLE";
const TEXTURE_BASE = "./assets/textures/scorpion/";
const MAPS = {
  bareMetal: "scorpion_bare_metal_512.jpg",
  concrete: "scorpion_concrete_512.jpg",
  bronzeTile: "scorpion_bronze_tile_512.jpg",
  rawWood: "scorpion_raw_wood_512.jpg",
  ochreFabric: "scorpion_ochre_fabric_512.jpg",
  blackFabric: "scorpion_black_fabric_512.jpg",
  patternCarpet: "scorpion_pattern_carpet_512.jpg",
  vipCarpet: "scorpion_vip_carpet_512.jpg",
  lightWood: "scorpion_light_wood_512.jpg"
};

function safeLog(log, ...args){ try { (log || console.log)(...args); } catch {} }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function fallbackMaterial(color, opts = {}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.78,
    metalness: opts.metalness ?? 0.08,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: THREE.DoubleSide
  });
}

function makeCanvasLabel(title, subtitle){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 1024, 512);
  g.addColorStop(0, "#05070e");
  g.addColorStop(0.50, "#221036");
  g.addColorStop(1, "#05070e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(127,245,199,.88)";
  ctx.lineWidth = 16;
  ctx.strokeRect(32, 32, 960, 448);
  ctx.strokeStyle = "rgba(208,92,255,.72)";
  ctx.lineWidth = 6;
  ctx.strokeRect(62, 62, 900, 388);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "900 62px system-ui, Arial";
  ctx.fillText(title, 512, 215);
  ctx.fillStyle = "#7ff5c7";
  ctx.font = "800 32px system-ui, Arial";
  ctx.fillText(subtitle, 512, 292);
  ctx.fillStyle = "#f6e27f";
  ctx.font = "900 23px system-ui, Arial";
  ctx.fillText("GEOMETRIC TEXTURE TABLE • MAP PROXY", 512, 366);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function materialFromTexture(texture, fallbackColor, opts = {}){
  if (!texture) return fallbackMaterial(fallbackColor, opts);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(opts.repeatX ?? 1, opts.repeatY ?? 1);
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: opts.tint ?? 0xffffff,
    roughness: opts.roughness ?? 0.80,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    side: THREE.DoubleSide
  });
}

async function loadTextureSafe(loader, key){
  const file = MAPS[key];
  if (!file) return null;
  return await new Promise((resolve)=>{
    loader.load(TEXTURE_BASE + file, (tex)=>resolve(tex), undefined, ()=>resolve(null));
  });
}

function addBox(parent, name, mat, scale, pos, rot = null){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);
  mesh.name = name;
  mesh.scale.copy(scale);
  mesh.position.copy(pos);
  if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, name, mat, radiusTop, radiusBottom, height, segments, pos, rot = null){
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat);
  mesh.name = name;
  mesh.position.copy(pos);
  if (rot) mesh.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function addPlane(parent, name, mat, width, depth, pos){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.name = name;
  mesh.position.copy(pos);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 5;
  parent.add(mesh);
  return mesh;
}

function resolvePlacement(sceneTargets = {}, tableCenter = null){
  // Not Scorpion. Put it as a neutral material-demo table near a side/vendor area.
  const src = sceneTargets.sponsor_wall || sceneTargets.sponsor || sceneTargets.pga_hub || sceneTargets.pga || sceneTargets.lobby;
  const base = src?.pos?.isVector3 ? src.pos.clone() : new THREE.Vector3(4.35, 0, -1.85);
  const look = tableCenter?.isVector3 ? tableCenter.clone() : (src?.look?.isVector3 ? src.look.clone() : new THREE.Vector3(0, 1.2, 0));
  base.x += base.x >= 0 ? -1.25 : 1.25;
  base.z += 0.72;
  base.y = 0;
  return { pos: base, look };
}

function faceToward(group, target){
  const flat = target?.clone ? target.clone() : new THREE.Vector3(0,0,0);
  flat.y = group.position.y;
  group.lookAt(flat);
}

export async function installGeometricTextureTable({ scene, sceneTargets = {}, tableCenter = null, log = console.log } = {}){
  try {
    if (!scene) return null;
    if (scene.getObjectByName("SVR_Phase93_Geometric_Texture_Table")) return scene.getObjectByName("SVR_Phase93_Geometric_Texture_Table");

    const loader = new THREE.TextureLoader();
    const loaded = {};
    await Promise.all(Object.keys(MAPS).map(async key => { loaded[key] = await loadTextureSafe(loader, key); }));

    const mats = {
      floor: materialFromTexture(loaded.patternCarpet || loaded.vipCarpet, 0x15101e, { repeatX: 2.5, repeatY: 1.6, roughness: 0.96 }),
      body: materialFromTexture(loaded.rawWood, 0x8a5a35, { repeatX: 1.6, repeatY: 1.1, roughness: 0.78 }),
      top: materialFromTexture(loaded.lightWood || loaded.rawWood, 0xb58b62, { repeatX: 1.8, repeatY: 1.2, roughness: 0.72 }),
      rail: materialFromTexture(loaded.bronzeTile || loaded.bareMetal, 0x87522c, { repeatX: 2.2, repeatY: 1.0, roughness: 0.62, metalness: loaded.bronzeTile ? 0.18 : 0.42 }),
      felt: materialFromTexture(loaded.blackFabric, 0x050507, { repeatX: 2.2, repeatY: 1.4, roughness: 0.98 }),
      metal: materialFromTexture(loaded.bareMetal, 0x9b9da3, { repeatX: 1.0, repeatY: 1.0, roughness: 0.46, metalness: 0.62 }),
      concrete: materialFromTexture(loaded.concrete, 0x56585c, { repeatX: 1.4, repeatY: 1.2, roughness: 0.94 }),
      accentFabric: materialFromTexture(loaded.ochreFabric, 0xb39654, { repeatX: 1.3, repeatY: 1.0, roughness: 0.96 }),
      glow: new THREE.MeshBasicMaterial({ color: 0x7ff5c7, transparent: true, opacity: 0.86, depthWrite: false }),
      sign: new THREE.MeshStandardMaterial({ map: makeCanvasLabel("GEOMETRIC TABLE", "map-textured prototype"), roughness: 0.68, emissive: 0x061a14, emissiveIntensity: 0.12 })
    };

    const { pos, look } = resolvePlacement(sceneTargets, tableCenter);
    const group = new THREE.Group();
    group.name = "SVR_Phase93_Geometric_Texture_Table";
    group.position.copy(pos);
    faceToward(group, look);

    addPlane(group, "GeoTable_MapCarpet_Base", mats.floor, 3.9, 2.4, new THREE.Vector3(0, 0.018, 0));
    addBox(group, "GeoTable_Concrete_BackPlinth", mats.concrete, new THREE.Vector3(2.9, 0.44, 0.16), new THREE.Vector3(0, 0.24, -0.86));
    addBox(group, "GeoTable_Metal_CenterPedestal", mats.metal, new THREE.Vector3(0.72, 0.58, 0.50), new THREE.Vector3(0, 0.36, 0));
    addCylinder(group, "GeoTable_Octagon_WoodTop", mats.top, 1.08, 1.02, 0.14, 8, new THREE.Vector3(0, 0.76, 0), { y: Math.PI / 8 });
    addCylinder(group, "GeoTable_Octagon_BlackFabricInset", mats.felt, 0.82, 0.80, 0.026, 8, new THREE.Vector3(0, 0.845, 0), { y: Math.PI / 8 });
    addCylinder(group, "GeoTable_BronzeRail", mats.rail, 1.15, 1.09, 0.07, 8, new THREE.Vector3(0, 0.91, 0), { y: Math.PI / 8 });

    const legPositions = [
      [-0.82, -0.47], [0.82, -0.47], [-0.82, 0.47], [0.82, 0.47]
    ];
    for (const [x,z] of legPositions){
      addCylinder(group, "GeoTable_BareMetal_AngledLeg", mats.metal, 0.055, 0.075, 0.72, 8, new THREE.Vector3(x, 0.39, z), { z: x > 0 ? -0.18 : 0.18 });
    }

    addBox(group, "GeoTable_OchreFabric_FrontPanel", mats.accentFabric, new THREE.Vector3(1.55, 0.38, 0.045), new THREE.Vector3(0, 0.48, 0.70));
    addBox(group, "GeoTable_MapSign", mats.sign, new THREE.Vector3(2.55, 0.70, 0.045), new THREE.Vector3(0, 1.64, -0.92), { x: -0.10 });

    const trimRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.012, 8, 64), mats.glow);
    trimRing.name = "GeoTable_NeonTrim_Ring";
    trimRing.position.set(0, 0.965, 0);
    trimRing.rotation.x = Math.PI / 2;
    trimRing.renderOrder = 20;
    group.add(trimRing);

    const mapNames = [
      ["BareMetal", mats.metal], ["Concrete", mats.concrete], ["Bronze", mats.rail],
      ["Wood", mats.body], ["Ochre", mats.accentFabric], ["BlackFabric", mats.felt]
    ];
    mapNames.forEach(([name, material], i)=>{
      const x = -1.28 + i * 0.51;
      addBox(group, `GeoTable_MapProxy_${name}`, material, new THREE.Vector3(0.38, 0.28, 0.035), new THREE.Vector3(x, 1.14, -0.77), { x: -0.08 });
    });

    scene.add(group);

    const state = {
      phase: PHASE,
      installed: true,
      standalone: true,
      notScorpion: true,
      mainPokerTableReplaced: false,
      lobbyReplaced: false,
      mapTexturesAttempted: Object.keys(MAPS),
      mapTexturesLoaded: Object.entries(loaded).filter(([,tex])=>!!tex).map(([key])=>key),
      mapTexturesMissing: Object.entries(loaded).filter(([,tex])=>!tex).map(([key])=>key),
      objectName: group.name,
      note: "Standalone geometric texture table. It is not placed by Scorpion and does not replace the main poker table."
    };
    window.SVR_PHASE93_GEOMETRIC_TEXTURE_TABLE = state;
    safeLog(log, "[SVR]", PHASE, "installed", state);
    return group;
  } catch (err){
    window.SVR_PHASE93_GEOMETRIC_TEXTURE_TABLE = {
      phase: PHASE,
      installed: false,
      failed: true,
      recovered: true,
      message: err?.message || String(err),
      stack: err?.stack || null
    };
    try { console.warn("[SVR] Geometric texture table skipped safely", err); } catch {}
    return null;
  }
}
