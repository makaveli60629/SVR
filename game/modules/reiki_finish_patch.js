import * as THREE from "three";

const PATCH_NAME = "SVR_Phase98SV_Surgical_Fix_02_Reiki_Hologram_Sidewall";
const REIKI_COLOR = 0x7fffd4;
const RED_CARPET = 0x7b1024;
const SILVER = 0xd8dee8;

// Screenshot showed the hologram on the wrong-facing wall. Move it onto the opposite side wall of the Reiki storefront.
const SIDE_WALL_X = 17.72;
const SIDE_WALL_Z = -5.45;
const SIDE_WALL_YAW = Math.PI / 2;

function makeLabelTexture(title, subtitle = "", color = "#7fffd4") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,.78)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 56px Arial";
  ctx.fillText(String(title).toUpperCase(), 512, 145);
  if (subtitle) {
    ctx.shadowBlur = 5;
    ctx.fillStyle = color;
    ctx.font = "800 28px Arial";
    ctx.fillText(String(subtitle).toUpperCase(), 512, 238);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function addLabel(root) {
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.72, 0.58),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture("AWAITING APPROVAL", "Reiki hologram"),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  label.position.set(SIDE_WALL_X + 0.02, 0.86, SIDE_WALL_Z + 0.86);
  label.rotation.y = SIDE_WALL_YAW;
  label.name = "SVR_Reiki_Minimal_Approval_Label";
  root.add(label);
}

function addCarpet(root) {
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 1.42),
    new THREE.MeshBasicMaterial({ color: RED_CARPET, transparent: true, opacity: 0.54, side: THREE.DoubleSide, depthWrite: false })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(20.35, 0.064, -5.03);
  carpet.name = "SVR_Reiki_Minimal_Red_Carpet";
  root.add(carpet);
}

function addSilverPost(root, x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.82, 18),
    new THREE.MeshStandardMaterial({ color: SILVER, metalness: 0.9, roughness: 0.16 })
  );
  pole.position.set(x, 0.41, z);
  pole.name = "SVR_Reiki_Minimal_Silver_Post";
  root.add(pole);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.096, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xf6f8ff, metalness: 0.95, roughness: 0.1 })
  );
  cap.position.set(x, 0.86, z);
  cap.name = "SVR_Reiki_Minimal_Silver_Post_Cap";
  root.add(cap);
}

function addRope(root, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, len, 16),
    new THREE.MeshBasicMaterial({ color: 0x9b1025 })
  );
  rope.position.set((x1 + x2) / 2, 0.72, (z1 + z2) / 2);
  rope.rotation.z = Math.PI / 2;
  rope.rotation.y = Math.atan2(dx, dz);
  rope.name = "SVR_Reiki_Minimal_Red_Rope";
  root.add(rope);
}

function addRails(root) {
  const leftA = [17.5, -3.92], leftB = [17.5, -6.28];
  const rightA = [23.2, -3.92], rightB = [23.2, -6.28];
  [leftA, leftB, rightA, rightB].forEach(([x,z]) => addSilverPost(root, x, z));
  addRope(root, leftA[0], leftA[1], leftB[0], leftB[1]);
  addRope(root, rightA[0], rightA[1], rightB[0], rightB[1]);
}

function addGlassHint(root) {
  const glassMat = new THREE.MeshBasicMaterial({ color: REIKI_COLOR, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false });
  const side = new THREE.Mesh(new THREE.PlaneGeometry(3.85, 2.35), glassMat);
  side.position.set(SIDE_WALL_X - 0.03, 1.68, SIDE_WALL_Z);
  side.rotation.y = SIDE_WALL_YAW;
  side.name = "SVR_Reiki_Minimal_Side_Glass_Hint";
  root.add(side);
}

function worldPositionOf(object) {
  const p = new THREE.Vector3();
  object.getWorldPosition(p);
  return p;
}

function findExistingVideo(scene) {
  let found = null;
  scene.traverse((object) => {
    if (found || !object.isMesh || !object.material) return;
    const map = object.material.map;
    const image = map?.image;
    const isVideo = image && typeof image.play === "function" && typeof image.pause === "function";
    if (!isVideo) return;
    const p = worldPositionOf(object);
    const nearKnownReiki = Math.abs(Math.abs(p.x) - 20.35) < 5.8 && Math.abs(p.z + 7.05) < 3.2;
    if (nearKnownReiki) {
      found = { mesh: object, texture: map, video: image, parent: object.parent };
    }
  });
  return found;
}

function hideOldHologramPieces(scene, videoParent) {
  if (videoParent) {
    for (const child of videoParent.children) child.visible = false;
  }
  scene.traverse((object) => {
    if (!object.isMesh) return;
    const name = String(object.name || "");
    if (name.startsWith("SVR_Reiki_Minimal") || name.startsWith("SVR_Phase98S")) return;
    const p = worldPositionOf(object);
    const nearOldPatch = Math.abs(Math.abs(p.x) - 20.35) < 8.0 && Math.abs(p.z + 5.2) < 4.2 && /Reiki|Riki|Hologram|Rope|Carpet|Glass|Approval/i.test(name);
    const nearVideoWall = Math.abs(Math.abs(p.x) - 20.35) < 5.8 && Math.abs(p.z + 7.05) < 3.2;
    if (nearOldPatch || nearVideoWall) object.visible = false;
  });
}

function addCleanHologram(scene, videoTexture) {
  const root = new THREE.Group();
  root.name = PATCH_NAME;
  scene.add(root);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.95, 1.68),
    new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
      opacity: 1,
      depthWrite: false
    })
  );
  screen.position.set(SIDE_WALL_X, 1.82, SIDE_WALL_Z);
  screen.rotation.y = SIDE_WALL_YAW;
  screen.name = "SVR_Reiki_Minimal_Single_Hologram";
  root.add(screen);

  const edgeMat = new THREE.LineBasicMaterial({ color: REIKI_COLOR, transparent: true, opacity: 0.72 });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.04, 1.77)), edgeMat);
  edge.position.copy(screen.position);
  edge.rotation.copy(screen.rotation);
  edge.name = "SVR_Reiki_Minimal_Hologram_Edge";
  root.add(edge);

  const glow = new THREE.PointLight(REIKI_COLOR, 0.08, 2.8, 2.0);
  glow.position.set(SIDE_WALL_X + 0.45, 1.78, SIDE_WALL_Z);
  glow.name = "SVR_Reiki_Minimal_Soft_Light";
  root.add(glow);

  addLabel(root);
  addCarpet(root);
  addRails(root);
  addGlassHint(root);
  return root;
}

function primeVideoWithoutGlobalAudio(video) {
  const unlock = () => {
    try {
      video.muted = true;
      video.volume = 0;
      video.play?.().catch?.(() => {});
    } catch {}
  };
  unlock();
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}

export function installReikiFinishPatch({ scene }) {
  if (!scene || scene.getObjectByName(PATCH_NAME)) return false;
  const oldGroups = [
    "SVR_Phase98SV_Surgical_Fix_01_Reiki_Hologram_Flip",
    "SVR_Phase98SO_Reiki_Minimal_Presentation_Polish",
    "SVR_Phase98SG_Reiki_Audio_Containment_Patch"
  ];
  oldGroups.forEach((n) => { const g = scene.getObjectByName(n); if (g) g.visible = false; });
  const existing = findExistingVideo(scene);
  if (!existing?.texture) return false;
  hideOldHologramPieces(scene, existing.parent);
  addCleanHologram(scene, existing.texture);
  if (existing.video) primeVideoWithoutGlobalAudio(existing.video);
  window.SVR_REIKI_FINISH_PATCH = {
    phase: "98S-V",
    surgicalFix: "02",
    status: "installed",
    hologram: "moved-to-opposite-sidewall-of-storefront",
    sidewallPosition: { x: SIDE_WALL_X, y: 1.82, z: SIDE_WALL_Z, yaw: 90 },
    presentationSafe: true,
    globalSpawnAudioBlocked: true,
    proximityAudioControllerPreserved: true
  };
  return true;
}

export function autoInstallReikiFinishPatch() {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const scene = window.SVR_SCENE;
    if (scene && installReikiFinishPatch({ scene })) window.clearInterval(timer);
    if (attempts > 120) window.clearInterval(timer);
  }, 250);
}

autoInstallReikiFinishPatch();
