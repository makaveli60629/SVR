import * as THREE from "three";

const PATCH_NAME = "SVR_Phase98SV_Surgical_Fix_01_Reiki_Hologram_Flip";
const REIKI_COLOR = 0x7fffd4;
const RED_CARPET = 0x7b1024;
const SILVER = 0xd8dee8;
const INWARD_FACE_YAW = Math.PI;

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
    new THREE.PlaneGeometry(3.15, 0.68),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture("AWAITING APPROVAL", "Reiki hologram"),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  label.position.set(20.35, 0.82, -6.76);
  label.rotation.y = INWARD_FACE_YAW;
  label.name = "SVR_Reiki_Minimal_Approval_Label";
  root.add(label);
}

function addCarpet(root) {
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 1.62),
    new THREE.MeshBasicMaterial({ color: RED_CARPET, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(20.35, 0.064, -5.03);
  carpet.name = "SVR_Reiki_Minimal_Red_Carpet";
  root.add(carpet);
}

function addSilverPost(root, x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.046, 0.046, 0.88, 18),
    new THREE.MeshStandardMaterial({ color: SILVER, metalness: 0.9, roughness: 0.16 })
  );
  pole.position.set(x, 0.44, z);
  pole.name = "SVR_Reiki_Minimal_Silver_Post";
  root.add(pole);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xf6f8ff, metalness: 0.95, roughness: 0.1 })
  );
  cap.position.set(x, 0.91, z);
  cap.name = "SVR_Reiki_Minimal_Silver_Post_Cap";
  root.add(cap);
}

function addRope(root, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, len, 16),
    new THREE.MeshBasicMaterial({ color: 0x9b1025 })
  );
  rope.position.set((x1 + x2) / 2, 0.76, (z1 + z2) / 2);
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
  const glassMat = new THREE.MeshBasicMaterial({ color: REIKI_COLOR, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.55), glassMat);
  back.position.set(20.35, 1.72, -7.16);
  back.rotation.y = INWARD_FACE_YAW;
  back.name = "SVR_Reiki_Minimal_Back_Glass_Hint";
  root.add(back);
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
    if (Math.abs(p.x - 20.35) < 4.8 && Math.abs(p.z + 7.05) < 2.4) {
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
    const nearOldPatch = Math.abs(p.x - 20.35) < 7.2 && Math.abs(p.z + 5.2) < 3.8 && /Reiki|Riki|Hologram|Rope|Carpet|Glass|Approval/i.test(name);
    const nearOldLabel = Math.abs(p.x - 20.35) < 2.5 && Math.abs(p.y - 0.68) < 0.55 && Math.abs(p.z + 6.92) < 0.9;
    if (nearOldPatch || nearOldLabel) object.visible = false;
  });
}

function addCleanHologram(scene, videoTexture) {
  const root = new THREE.Group();
  root.name = PATCH_NAME;
  scene.add(root);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.25, 1.86),
    new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.FrontSide,
      toneMapped: false,
      transparent: true,
      opacity: 1,
      depthWrite: false
    })
  );
  screen.position.set(20.35, 1.86, -7.02);
  screen.rotation.y = INWARD_FACE_YAW;
  screen.name = "SVR_Reiki_Minimal_Single_Hologram";
  root.add(screen);

  const edgeMat = new THREE.LineBasicMaterial({ color: REIKI_COLOR, transparent: true, opacity: 0.72 });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.34, 1.95)), edgeMat);
  edge.position.copy(screen.position);
  edge.rotation.copy(screen.rotation);
  edge.name = "SVR_Reiki_Minimal_Hologram_Edge";
  root.add(edge);

  const glow = new THREE.PointLight(REIKI_COLOR, 0.10, 3.0, 2.0);
  glow.position.set(20.35, 1.8, -6.48);
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
  const oldG = scene.getObjectByName("SVR_Phase98SO_Reiki_Minimal_Presentation_Polish") || scene.getObjectByName("SVR_Phase98SG_Reiki_Audio_Containment_Patch");
  if (oldG) oldG.visible = false;
  const existing = findExistingVideo(scene);
  if (!existing?.texture) return false;
  hideOldHologramPieces(scene, existing.parent);
  addCleanHologram(scene, existing.texture);
  if (existing.video) primeVideoWithoutGlobalAudio(existing.video);
  window.SVR_REIKI_FINISH_PATCH = {
    phase: "98S-V",
    surgicalFix: "01",
    status: "installed",
    hologram: "flipped-180-frontside-inward-facing",
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
