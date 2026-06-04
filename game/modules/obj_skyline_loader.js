import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const BUILD = "PHASE-84-OBJ-SKYLINE-BACKGROUND-TEST-LOCK";
const MODEL_PATHS = [
  "./assets/models/skyline/buildings_sprite.obj",
  "./assets/models/skyline/skyline_03.obj",
  "./assets/models/skyline/skyline_04.obj"
];

function setObjectMaterial(object, material, accentMaterial) {
  let meshIndex = 0;
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = true;
    child.material = (meshIndex % 7 === 0 ? accentMaterial : material).clone();
    meshIndex += 1;
  });
}

function boxSize(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

function normalizeBuilding(object, targetHeight = 34) {
  object.updateMatrixWorld(true);
  const { size, center } = boxSize(object);
  if (size.y > 0.0001) object.scale.multiplyScalar(targetHeight / size.y);
  object.updateMatrixWorld(true);
  const after = boxSize(object);
  object.position.x -= after.center.x;
  object.position.z -= after.center.z;
  object.position.y -= after.box.min.y;
  return object;
}

function cloneForSkyline(source, index, total) {
  const clone = source.clone(true);
  clone.name = `SVR_PHASE84_OBJ_SKYLINE_BUILDING_${index + 1}`;
  const angle = (-130 + (260 / Math.max(1, total - 1)) * index) * THREE.MathUtils.DEG2RAD;
  const radius = 78 + (index % 3) * 11;
  const heightBoost = 0.86 + (index % 4) * 0.13;
  clone.scale.multiplyScalar(heightBoost);
  clone.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  clone.lookAt(0, 8, 0);
  clone.rotation.y += Math.PI;
  clone.userData.phase84Skyline = true;
  return clone;
}

function addFallbackSkyline(group) {
  const dark = new THREE.MeshStandardMaterial({ color: 0x07111b, roughness: 0.88, metalness: 0.02, emissive: 0x061c2a, emissiveIntensity: 0.16 });
  const accent = new THREE.MeshBasicMaterial({ color: 0x3edbff, transparent: true, opacity: 0.20, depthWrite: false });
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const radius = 86 + (i % 5) * 4;
    const h = 12 + (i % 9) * 3.2;
    const w = 3 + (i % 4) * 1.1;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.72), dark.clone());
    mesh.name = `SVR_PHASE84_FALLBACK_SKYLINE_${i + 1}`;
    mesh.position.set(Math.cos(angle) * radius, h * 0.5, Math.sin(angle) * radius);
    mesh.lookAt(0, h * 0.5, 0);
    group.add(mesh);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.82, h * 0.62), accent.clone());
    glow.position.set(0, h * 0.1, -w * 0.37);
    mesh.add(glow);
  }
}

export async function applyObjSkylineBackground(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE84_OBJ_SKYLINE_BACKGROUND_LOCK")) return null;

  const group = new THREE.Group();
  group.name = "SVR_PHASE84_OBJ_SKYLINE_BACKGROUND_LOCK";
  group.userData.build = BUILD;
  scene.add(group);

  const loader = new OBJLoader();
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x07121e,
    roughness: 0.92,
    metalness: 0.04,
    emissive: 0x061a28,
    emissiveIntensity: 0.22,
    side: THREE.DoubleSide
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b1c2d,
    roughness: 0.82,
    metalness: 0.08,
    emissive: 0x1a70aa,
    emissiveIntensity: 0.38,
    side: THREE.DoubleSide
  });

  const sources = [];
  for (const path of MODEL_PATHS) {
    try {
      const obj = await loader.loadAsync(path);
      obj.name = `SVR_PHASE84_SOURCE_${path.split("/").pop()}`;
      setObjectMaterial(obj, baseMaterial, accentMaterial);
      normalizeBuilding(obj, 28 + sources.length * 4);
      sources.push(obj);
      log?.("Phase 84 OBJ skyline loaded", path);
    } catch (err) {
      log?.("Phase 84 OBJ skyline miss", path, err?.message || err);
    }
  }

  if (!sources.length) {
    addFallbackSkyline(group);
  } else {
    const placements = Math.min(9, sources.length * 3);
    for (let i = 0; i < placements; i++) {
      const source = sources[i % sources.length];
      const clone = cloneForSkyline(source, i, placements);
      group.add(clone);
    }
  }

  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 960;
  labelCanvas.height = 230;
  const ctx = labelCanvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.72)";
  ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  ctx.strokeStyle = "rgba(140,255,242,.86)";
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, labelCanvas.width - 36, labelCanvas.height - 36);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#eaffff";
  ctx.font = "900 44px system-ui,Arial";
  ctx.fillText("OBJ SKYLINE TEST", labelCanvas.width / 2, 82, labelCanvas.width - 80);
  ctx.font = "700 27px system-ui,Arial";
  ctx.fillText("uploaded buildings used as distant background only", labelCanvas.width / 2, 142, labelCanvas.width - 80);
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.72),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  label.name = "SVR_PHASE84_OBJ_SKYLINE_STATUS_LABEL";
  label.position.set(0, 8.2, -31.5);
  label.renderOrder = 180;
  group.add(label);

  window.SVR_PHASE84_OBJ_SKYLINE = { build: BUILD, modelCount: sources.length, placementCount: group.children.length };
  scene.userData.SVR_PHASE84_OBJ_SKYLINE = window.SVR_PHASE84_OBJ_SKYLINE;
  log?.("Phase 84 OBJ skyline background active", window.SVR_PHASE84_OBJ_SKYLINE);
  return group;
}
