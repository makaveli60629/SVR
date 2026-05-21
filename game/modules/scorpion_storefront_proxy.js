// PHASE-90-SCORPION-STOREFRONT-PROXY-BOOT-SAFE
// Game-side only. Emergency boot-safe replacement for the Phase 89 texture proxy.
// This version does NOT load external texture files. It uses procedural materials only
// so missing/cached texture paths can never blackscreen the game.

import * as THREE from "three";

const PHASE = "PHASE-90-SCORPION-STOREFRONT-PROXY-BOOT-SAFE";

function safeLog(log, ...args){
  try { (log || console.log)(...args); } catch {}
}

function mat(color, options = {}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.84,
    metalness: options.metalness ?? 0.08,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: !!options.transparent,
    opacity: options.opacity ?? 1,
    side: THREE.DoubleSide
  });
}

function makeLabelTexture(title, subtitle = ""){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 1024, 512);
  g.addColorStop(0, "#07040b");
  g.addColorStop(0.52, "#230719");
  g.addColorStop(1, "#09030c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = "rgba(255,107,127,.78)";
  ctx.lineWidth = 18;
  ctx.strokeRect(28, 28, 968, 456);
  ctx.strokeStyle = "rgba(246,226,127,.56)";
  ctx.lineWidth = 5;
  ctx.strokeRect(56, 56, 912, 400);
  ctx.fillStyle = "#ff6b7f";
  ctx.font = "900 66px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, 512, 220);
  ctx.fillStyle = "#7ff5c7";
  ctx.font = "800 30px system-ui, Arial";
  ctx.fillText(subtitle, 512, 292);
  ctx.fillStyle = "rgba(246,226,127,.92)";
  ctx.font = "900 24px system-ui, Arial";
  ctx.fillText("BOOT-SAFE MATERIAL PROXY", 512, 364);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function addBox(parent, name, material, scale, pos){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.name = name;
  mesh.scale.copy(scale);
  mesh.position.copy(pos);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

function addPlane(parent, name, material, sx, sz, pos){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), material);
  mesh.name = name;
  mesh.position.copy(pos);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 6;
  parent.add(mesh);
  return mesh;
}

function resolveAnchor(sceneTargets = {}){
  const rec = sceneTargets.scorpion_room || sceneTargets.scorpionRoom || sceneTargets.scorpion || sceneTargets.sponsor_wall || sceneTargets.sponsor || sceneTargets.lobby;
  const pos = rec?.pos?.isVector3 ? rec.pos.clone() : new THREE.Vector3(-4.6, 0, -2.55);
  const look = rec?.look?.isVector3 ? rec.look.clone() : new THREE.Vector3(0, 1.2, 0);
  pos.x += pos.x >= 0 ? -0.95 : 0.95;
  pos.z += 0.38;
  pos.y = 0;
  return { pos, look };
}

function faceGroupToward(group, target){
  const flat = target?.clone ? target.clone() : new THREE.Vector3(0, 0, 0);
  flat.y = group.position.y;
  group.lookAt(flat);
}

export function installScorpionStorefrontProxy({ scene, sceneTargets = {}, log = console.log } = {}){
  try {
    if (!scene) return null;
    if (scene.getObjectByName("SVR_Phase90_Scorpion_Storefront_Proxy") || scene.getObjectByName("SVR_Phase89_Scorpion_Storefront_Proxy")) return null;

    const materials = {
      carpet: mat(0x16101c, { roughness: 0.96 }),
      runner: mat(0x2b1720, { roughness: 0.92 }),
      metal: mat(0x9a9ca2, { roughness: 0.55, metalness: 0.55 }),
      bronze: mat(0x7a4a2c, { roughness: 0.64, metalness: 0.28 }),
      wood: mat(0x8b5a34, { roughness: 0.82 }),
      felt: mat(0x09090d, { roughness: 0.98 }),
      concrete: mat(0x55575a, { roughness: 0.94 }),
      ochre: mat(0xb49654, { roughness: 0.96 }),
      lightWood: mat(0xb78b62, { roughness: 0.78 }),
      accent: new THREE.MeshBasicMaterial({ color: 0xff6b7f, transparent: true, opacity: 0.88, depthWrite: false })
    };

    const { pos, look } = resolveAnchor(sceneTargets);
    const group = new THREE.Group();
    group.name = "SVR_Phase90_Scorpion_Storefront_Proxy";
    group.position.copy(pos);
    faceGroupToward(group, look);

    addPlane(group, "ScorpionProxy_BootSafe_Carpet", materials.carpet, 3.35, 2.05, new THREE.Vector3(0, 0.012, 0));
    addPlane(group, "ScorpionProxy_BootSafe_Runner", materials.runner, 1.55, 1.84, new THREE.Vector3(0, 0.018, 0.06));

    addBox(group, "ScorpionProxy_TableBase", materials.metal, new THREE.Vector3(0.78, 0.48, 0.46), new THREE.Vector3(0, 0.28, 0));
    addBox(group, "ScorpionProxy_TableTop_Wood", materials.wood, new THREE.Vector3(1.72, 0.10, 1.02), new THREE.Vector3(0, 0.66, 0));
    addBox(group, "ScorpionProxy_TableFelt_Black", materials.felt, new THREE.Vector3(1.46, 0.025, 0.78), new THREE.Vector3(0, 0.725, 0));
    addBox(group, "ScorpionProxy_TableRail_Front", materials.bronze, new THREE.Vector3(1.82, 0.11, 0.08), new THREE.Vector3(0, 0.76, 0.56));
    addBox(group, "ScorpionProxy_TableRail_Back", materials.bronze, new THREE.Vector3(1.82, 0.11, 0.08), new THREE.Vector3(0, 0.76, -0.56));
    addBox(group, "ScorpionProxy_TableRail_Left", materials.bronze, new THREE.Vector3(0.08, 0.11, 1.02), new THREE.Vector3(-0.95, 0.76, 0));
    addBox(group, "ScorpionProxy_TableRail_Right", materials.bronze, new THREE.Vector3(0.08, 0.11, 1.02), new THREE.Vector3(0.95, 0.76, 0));

    const signMat = new THREE.MeshStandardMaterial({
      map: makeLabelTexture("SCORPION TABLE", "second table proxy"),
      roughness: 0.72,
      emissive: 0x14020a,
      emissiveIntensity: 0.14
    });
    const sign = addBox(group, "ScorpionProxy_Header_Sign", signMat, new THREE.Vector3(2.52, 0.82, 0.045), new THREE.Vector3(0, 1.74, -0.84));
    sign.rotation.x = -0.12;

    const swatches = [
      ["Bare_Metal", materials.metal, -1.18],
      ["Concrete", materials.concrete, -0.58],
      ["Ochre_Fabric", materials.ochre, 0.02],
      ["Light_Wood", materials.lightWood, 0.62],
      ["Black_Felt", materials.felt, 1.22]
    ];
    for (const [name, material, x] of swatches){
      const swatch = addBox(group, "ScorpionProxy_MaterialSwatch_" + name, material, new THREE.Vector3(0.46, 0.34, 0.035), new THREE.Vector3(x, 1.16, -0.78));
      swatch.rotation.x = -0.08;
    }

    const sting = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.015, 8, 42, Math.PI * 1.35), materials.accent);
    sting.name = "ScorpionProxy_Accent_Stinger";
    sting.position.set(0.72, 0.86, 0);
    sting.rotation.set(Math.PI / 2, 0, -0.8);
    group.add(sting);

    scene.add(group);

    const state = {
      phase: PHASE,
      installed: true,
      bootSafe: true,
      externalTexturesLoaded: false,
      siteTouched: false,
      lobbyReplaced: false,
      mainTableReplaced: false,
      rawMaxLoaded: false,
      note: "Emergency boot-safe proxy. Uploaded texture maps are reserved for a safer async texture pass after boot is confirmed."
    };
    window.SVR_PHASE90_SCORPION_STOREFRONT_PROXY = state;
    window.SVR_PHASE89_SCORPION_STOREFRONT_PROXY = state;
    safeLog(log, "[SVR]", PHASE, "installed", state);
    return group;
  } catch (err) {
    window.SVR_PHASE90_SCORPION_STOREFRONT_PROXY_ERROR = {
      phase: PHASE,
      message: err?.message || String(err),
      stack: err?.stack || null,
      recovered: true
    };
    try { console.warn("[SVR] Scorpion storefront proxy skipped safely", err); } catch {}
    return null;
  }
}
