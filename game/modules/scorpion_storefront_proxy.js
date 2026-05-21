// PHASE-89-SCORPION-STOREFRONT-MATERIAL-PROXY-LOCK
// Game-side only. Adds a lightweight second-table/material proxy display beside the
// Scorpion storefront without replacing the main poker table, lobby, or private room.

import * as THREE from "three";

const PHASE = "PHASE-89-SCORPION-STOREFRONT-MATERIAL-PROXY-LOCK";
const BASE = "./assets/textures/scorpion/";

function makeLabelTexture(title, subtitle = ""){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0,0,1024,512);
  g.addColorStop(0,"#07040b");
  g.addColorStop(.52,"#230719");
  g.addColorStop(1,"#09030c");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle = "rgba(255,107,127,.72)";
  ctx.lineWidth = 18;
  ctx.strokeRect(28,28,968,456);
  ctx.strokeStyle = "rgba(246,226,127,.52)";
  ctx.lineWidth = 5;
  ctx.strokeRect(56,56,912,400);
  ctx.fillStyle = "#ff6b7f";
  ctx.font = "900 66px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.fillText(title,512,226);
  ctx.fillStyle = "#7ff5c7";
  ctx.font = "800 30px system-ui, Arial";
  ctx.fillText(subtitle,512,292);
  ctx.fillStyle = "rgba(246,226,127,.92)";
  ctx.font = "900 24px system-ui, Arial";
  ctx.fillText("SVR • MODULAR PROXY • PRIVATE ROOM READY",512,364);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function loadTexture(path, repeatX=1, repeatY=1){
  const texture = new THREE.TextureLoader().load(BASE + path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  return texture;
}

function makeMat(mapName, color, repeatX=1, repeatY=1, options = {}){
  const map = loadTexture(mapName, repeatX, repeatY);
  return new THREE.MeshStandardMaterial({
    map,
    color,
    roughness: options.roughness ?? .86,
    metalness: options.metalness ?? .05,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    side: THREE.DoubleSide
  });
}

function addPlane(parent, name, mat, sx, sz, pos, rotX = -Math.PI / 2){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), mat);
  mesh.name = name;
  mesh.position.copy(pos);
  mesh.rotation.x = rotX;
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  mesh.renderOrder = 6;
  parent.add(mesh);
  return mesh;
}

function addBox(parent, name, mat, scale, pos){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mat);
  mesh.name = name;
  mesh.scale.copy(scale);
  mesh.position.copy(pos);
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  parent.add(mesh);
  return mesh;
}

function resolveAnchor(sceneTargets = {}){
  const rec = sceneTargets.scorpion_room || sceneTargets.scorpionRoom || sceneTargets.scorpion || sceneTargets.sponsor_wall || sceneTargets.sponsor || sceneTargets.lobby;
  const pos = rec?.pos?.isVector3 ? rec.pos.clone() : new THREE.Vector3(-4.6, 0, -2.55);
  const look = rec?.look?.isVector3 ? rec.look.clone() : new THREE.Vector3(0, 1.2, 0);
  // Keep it near the storefront, not in the main walkway or table center.
  pos.x += pos.x >= 0 ? -0.95 : 0.95;
  pos.z += 0.38;
  pos.y = 0;
  return { pos, look };
}

function faceGroupToward(group, target){
  const flat = target.clone ? target.clone() : new THREE.Vector3(0,0,0);
  flat.y = group.position.y;
  group.lookAt(flat);
}

export function installScorpionStorefrontProxy({ scene, sceneTargets = {}, log = console.log } = {}){
  if (!scene || scene.getObjectByName("SVR_Phase89_Scorpion_Storefront_Proxy")) return null;

  const tex = {
    concrete: makeMat("scorpion_concrete_512.jpg", 0xffffff, 2, 2, { roughness: .94 }),
    metal: makeMat("scorpion_bare_metal_512.jpg", 0xd8d8d8, 1.25, 1.25, { roughness: .54, metalness: .58 }),
    bronze: makeMat("scorpion_bronze_tile_512.jpg", 0xffd0a2, 1.1, 1.1, { roughness: .62, metalness: .32 }),
    rawWood: makeMat("scorpion_raw_wood_512.jpg", 0xffffff, 1.6, 1, { roughness: .82 }),
    lightWood: makeMat("scorpion_light_wood_512.jpg", 0xffffff, 1.4, 1, { roughness: .78 }),
    blackFabric: makeMat("scorpion_black_fabric_512.jpg", 0xffffff, 1.8, 1.4, { roughness: .98 }),
    ochreFabric: makeMat("scorpion_ochre_fabric_512.jpg", 0xffffff, 1.2, 1.2, { roughness: .96 }),
    patternCarpet: makeMat("scorpion_pattern_carpet_512.jpg", 0xffffff, 1.4, 1.4, { roughness: .97 }),
    vipCarpet: makeMat("scorpion_vip_carpet_512.jpg", 0xffffff, 2.0, 1.0, { roughness: .97 })
  };

  const { pos, look } = resolveAnchor(sceneTargets);
  const group = new THREE.Group();
  group.name = "SVR_Phase89_Scorpion_Storefront_Proxy";
  group.position.copy(pos);
  faceGroupToward(group, look);

  // Storefront rug / safe footprint marker.
  addPlane(group, "ScorpionProxy_VIP_Carpet", tex.patternCarpet, 3.35, 2.05, new THREE.Vector3(0, .012, 0));
  addPlane(group, "ScorpionProxy_Entry_Runner", tex.vipCarpet, 1.55, 1.84, new THREE.Vector3(0, .018, .06));

  // Second table proxy: intentionally low-poly and lightweight until .max is converted to GLB.
  addBox(group, "ScorpionProxy_TableBase", tex.metal, new THREE.Vector3(.78,.48,.46), new THREE.Vector3(0,.28,0));
  addBox(group, "ScorpionProxy_TableTop_Wood", tex.rawWood, new THREE.Vector3(1.72,.10,1.02), new THREE.Vector3(0,.66,0));
  addBox(group, "ScorpionProxy_TableFelt_Black", tex.blackFabric, new THREE.Vector3(1.46,.025,.78), new THREE.Vector3(0,.725,0));
  addBox(group, "ScorpionProxy_TableRail_Bronze_Front", tex.bronze, new THREE.Vector3(1.82,.11,.08), new THREE.Vector3(0,.76,.56));
  addBox(group, "ScorpionProxy_TableRail_Bronze_Back", tex.bronze, new THREE.Vector3(1.82,.11,.08), new THREE.Vector3(0,.76,-.56));
  addBox(group, "ScorpionProxy_TableRail_Bronze_Left", tex.bronze, new THREE.Vector3(.08,.11,1.02), new THREE.Vector3(-.95,.76,0));
  addBox(group, "ScorpionProxy_TableRail_Bronze_Right", tex.bronze, new THREE.Vector3(.08,.11,1.02), new THREE.Vector3(.95,.76,0));

  // Material sample boards attached to storefront side.
  const boardMat = new THREE.MeshStandardMaterial({ map: makeLabelTexture("SCORPION TABLE", "material proxy / second table"), roughness: .72, emissive: 0x14020a, emissiveIntensity: .12 });
  const sign = addBox(group, "ScorpionProxy_Header_Sign", boardMat, new THREE.Vector3(2.52,.82,.045), new THREE.Vector3(0,1.74,-.84));
  sign.rotation.x = -0.12;

  const swatches = [
    ["Bare Metal", tex.metal, -1.18],
    ["Concrete", tex.concrete, -.58],
    ["Ochre Fabric", tex.ochreFabric, .02],
    ["Light Wood", tex.lightWood, .62],
    ["Black Felt", tex.blackFabric, 1.22]
  ];
  for (const [name, mat, x] of swatches){
    const s = addBox(group, "ScorpionProxy_MaterialSwatch_" + name.replace(/\s+/g,"_"), mat, new THREE.Vector3(.46,.34,.035), new THREE.Vector3(x,1.16,-.78));
    s.rotation.x = -0.08;
  }

  // Thin scorpion accent marker, procedural only.
  const accentMat = new THREE.MeshBasicMaterial({ color: 0xff6b7f, transparent:true, opacity:.86 });
  const sting = new THREE.Mesh(new THREE.TorusGeometry(.23,.015,8,42,Math.PI*1.35), accentMat);
  sting.name = "ScorpionProxy_Accent_Stinger";
  sting.position.set(.72,.86,.0);
  sting.rotation.set(Math.PI/2, 0, -0.8);
  group.add(sting);

  scene.add(group);

  const state = {
    phase: PHASE,
    installed: true,
    siteTouched: false,
    lobbyReplaced: false,
    mainTableReplaced: false,
    rawMaxLoaded: false,
    note: "Uses optimized uploaded texture maps as lightweight Scorpion storefront proxy. table 2.max reserved for GLB conversion."
  };
  window.SVR_PHASE89_SCORPION_STOREFRONT_PROXY = state;
  log?.("[SVR]", PHASE, "installed", state);
  return group;
}
