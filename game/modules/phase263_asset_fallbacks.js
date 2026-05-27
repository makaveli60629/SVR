/*
 * SVR Phase 263 — Missing Asset Fallback Lobby Render Lock
 * Prevents black/empty lobby when optional GLB/OBJ/FBX assets are missing.
 */
import * as THREE from "three";

const BUILD = "PHASE-267-JS-NEWLINE-BOOT-RENDER-REPAIR-LOCK";

function makeMat(color, roughness = 0.8, metalness = 0.05){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addLabel(scene, text, position, scale = 1){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(160,255,220,0.9)";
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = "#eafff7";
  ctx.font = "bold 58px system-ui, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6 * scale, 0.65 * scale), mat);
  mesh.position.set(position.x, position.y, position.z);
  mesh.rotation.y = position.ry || 0;
  mesh.name = "phase263_label_" + text.replace(/\s+/g, "_").toLowerCase();
  scene.add(mesh);
  return mesh;
}

function createFallbackPokerTable(scene){
  if (!scene || scene.getObjectByName("phase263_fallback_poker_table")) return null;

  const group = new THREE.Group();
  group.name = "phase263_fallback_poker_table";

  const feltMat = makeMat(0x083b30, 0.95, 0.02);
  const railMat = makeMat(0x170914, 0.72, 0.2);
  const goldMat = makeMat(0xd7a43b, 0.45, 0.35);

  const table = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.16, 96), feltMat);
  table.position.y = 0.82;
  table.scale.z = 0.68;
  table.name = "poker_table_felt_phase263";
  group.add(table);

  const rail = new THREE.Mesh(new THREE.TorusGeometry(2.28, 0.12, 12, 96), railMat);
  rail.position.y = 0.93;
  rail.scale.z = 0.68;
  rail.rotation.x = Math.PI / 2;
  rail.name = "poker_table_padded_rail_phase263";
  group.add(rail);

  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.42, 64), goldMat);
  logo.position.set(0, 0.925, 0);
  logo.rotation.x = -Math.PI / 2;
  logo.name = "SVR_table_logo_phase263";
  group.add(logo);

  const passLineMat = new THREE.MeshBasicMaterial({ color: 0xffe29b, transparent: true, opacity: 0.9 });
  const passLine = new THREE.Mesh(new THREE.RingGeometry(1.34, 1.36, 96), passLineMat);
  passLine.position.set(0, 0.932, 0);
  passLine.rotation.x = -Math.PI / 2;
  passLine.scale.z = 0.62;
  passLine.name = "pass_bet_line_phase263";
  group.add(passLine);

  // Flat chips
  const chipColors = [0xffffff, 0xe23b3b, 0x2f7cff, 0x2bbf6a, 0x111111];
  for (let i = 0; i < 20; i++){
    const c = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.018, 32),
      makeMat(chipColors[i % chipColors.length], 0.55, 0.08)
    );
    c.rotation.x = Math.PI / 2;
    c.position.set(-1.1 + (i % 5) * 0.16, 0.96 + Math.floor(i / 5) * 0.019, 0.9);
    c.name = "chip_phase263_$" + [1,5,25,100,500][i % 5];
    c.userData.isChip = true;
    c.userData.grabbable = true;
    group.add(c);
  }

  // Readable community cards
  const cardMat = makeMat(0xf8f8ff, 0.72, 0.02);
  for (let i = 0; i < 5; i++){
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.012, 0.36), cardMat);
    card.position.set(-0.56 + i * 0.28, 0.965, -0.22);
    card.name = "community_card_phase263_" + (i + 1);
    card.userData.isCard = true;
    group.add(card);
  }

  scene.add(group);
  return group;
}

function createFallbackLegend(scene){
  if (!scene || scene.getObjectByName("phase263_fallback_legend")) return null;

  const group = new THREE.Group();
  group.name = "phase263_fallback_legend";
  group.position.set(3.8, 0, -2.8);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.9, 8, 16), makeMat(0x4a2cff, 0.75, 0.12));
  body.position.y = 1.05;
  body.name = "legend_placeholder_body_phase263";
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), makeMat(0xe6c2a8, 0.7, 0.02));
  head.position.y = 1.68;
  head.name = "legend_placeholder_head_phase263";
  group.add(head);

  scene.add(group);
  addLabel(scene, "LEGEND PLACEHOLDER", { x: 3.8, y: 2.15, z: -2.8, ry: -0.6 }, 0.72);
  return group;
}

function createFallbackPlant(scene){
  if (!scene || scene.getObjectByName("phase263_fallback_plant")) return null;

  const group = new THREE.Group();
  group.name = "phase263_fallback_plant";
  group.position.set(-3.8, 0, -2.6);

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.32, 24), makeMat(0x5b3025, 0.8, 0.02));
  pot.position.y = 0.16;
  group.add(pot);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 12), makeMat(0x1e8a4a, 0.8, 0));
  stem.position.y = 0.68;
  group.add(stem);

  for (let i = 0; i < 8; i++){
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 8), makeMat(0x25b86a, 0.88, 0));
    const a = i * Math.PI * 2 / 8;
    leaf.position.set(Math.cos(a) * 0.18, 1.0 + (i % 2) * 0.12, Math.sin(a) * 0.18);
    leaf.scale.set(1.1, 0.25, 0.55);
    group.add(leaf);
  }

  scene.add(group);
  return group;
}

function createFallbackSittingPose(scene){
  if (!scene || scene.getObjectByName("phase263_fallback_sitting_pose")) return null;

  const group = new THREE.Group();
  group.name = "phase263_fallback_sitting_pose";
  group.position.set(0, 0, 1.65);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 6, 12), makeMat(0x20243a, 0.75, 0.08));
  torso.position.y = 1.05;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), makeMat(0xd8b08f, 0.72, 0.02));
  head.position.y = 1.48;
  group.add(head);

  scene.add(group);
  return group;
}

export function applyPhase263AssetFallbacks(scene){
  const result = {
    build: BUILD,
    table: !!createFallbackPokerTable(scene),
    legend: !!createFallbackLegend(scene),
    plant: !!createFallbackPlant(scene),
    sittingPose: !!createFallbackSittingPose(scene),
    at: new Date().toISOString()
  };

  window.SVR_PHASE263_ASSET_FALLBACKS = result;
  try {
    window.dispatchEvent(new CustomEvent("svr_phase263_asset_fallbacks_applied", { detail: result }));
  } catch(_) {}

  return result;
}







