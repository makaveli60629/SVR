import * as THREE from "three";

const PATCH_NAME = "SVR_Phase98SE_Reiki_Finish_Patch";
const REIKI_COLOR = 0x7fffd4;
const RED_CARPET = 0x7b1024;
const SILVER = 0xd8dee8;

function makeLabelTexture(title, subtitle = "", color = "#7fffd4") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px Arial";
  ctx.fillText(String(title).toUpperCase(), 512, 145);
  if (subtitle) {
    ctx.shadowBlur = 6;
    ctx.fillStyle = color;
    ctx.font = "800 30px Arial";
    ctx.fillText(String(subtitle).toUpperCase(), 512, 240);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function addLabel(root) {
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(3.65, 0.82),
    new THREE.MeshBasicMaterial({
      map: makeLabelTexture("AWAITING APPROVAL", "Reiki hologram"),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  label.position.set(20.35, 0.70, -6.86);
  label.rotation.y = 0;
  label.name = "SVR_Reiki_Clean_Hologram_Label";
  root.add(label);
}

function addCarpet(root) {
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(12.9, 2.78),
    new THREE.MeshBasicMaterial({ color: RED_CARPET, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(20.0, 0.061, -4.94);
  carpet.name = "SVR_Reiki_Red_Carpet_Final_Overlay";
  root.add(carpet);
}

function addSilverRope(root, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, len, 18),
    new THREE.MeshBasicMaterial({ color: 0x9b1025 })
  );
  rope.position.set((x1 + x2) / 2, 0.86, (z1 + z2) / 2);
  rope.rotation.z = Math.PI / 2;
  rope.rotation.y = Math.atan2(dx, dz);
  rope.name = "SVR_Reiki_Final_Red_Rope";
  root.add(rope);

  for (const [x, z] of [[x1, z1], [x2, z2]]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 1.08, 20),
      new THREE.MeshStandardMaterial({ color: SILVER, metalness: 0.92, roughness: 0.14 })
    );
    pole.position.set(x, 0.54, z);
    pole.name = "SVR_Reiki_Final_Silver_Post";
    root.add(pole);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 20, 14),
      new THREE.MeshStandardMaterial({ color: 0xf6f8ff, metalness: 0.95, roughness: 0.1 })
    );
    cap.position.set(x, 1.10, z);
    cap.name = "SVR_Reiki_Final_Silver_Post_Cap";
    root.add(cap);
  }
}

function addRails(root) {
  addSilverRope(root, 13.8, -2.04, 17.9, -2.04);
  addSilverRope(root, 21.8, -2.04, 25.9, -2.04);
  addSilverRope(root, 13.8, -2.95, 13.8, -7.05);
  addSilverRope(root, 25.9, -2.95, 25.9, -7.05);
}

function addGlassHint(root) {
  const glassMat = new THREE.MeshBasicMaterial({ color: REIKI_COLOR, transparent: true, opacity: 0.095, side: THREE.DoubleSide, depthWrite: false });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(4.95, 3.1), glassMat);
  left.position.set(13.0, 1.72, -4.85);
  left.rotation.y = Math.PI / 2;
  left.name = "SVR_Reiki_Final_Left_Glass";
  root.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(4.95, 3.1), glassMat);
  right.position.set(26.75, 1.72, -4.85);
  right.rotation.y = -Math.PI / 2;
  right.name = "SVR_Reiki_Final_Right_Glass";
  root.add(right);
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
    if (Math.abs(p.x - 20.35) < 4.5 && Math.abs(p.z + 7.05) < 2.2) {
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
    if (!object.isMesh || object.name?.startsWith("SVR_Reiki_Clean")) return;
    const p = worldPositionOf(object);
    const nearOldLabel = Math.abs(p.x - 20.35) < 2.5 && Math.abs(p.y - 0.68) < 0.45 && Math.abs(p.z + 6.92) < 0.7;
    if (nearOldLabel) object.visible = false;
  });
}

function addCleanHologram(scene, videoTexture) {
  const root = new THREE.Group();
  root.name = PATCH_NAME;
  scene.add(root);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 2.18),
    new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
      opacity: 1,
      depthWrite: false
    })
  );
  screen.position.set(20.35, 1.88, -7.04);
  screen.rotation.y = 0;
  screen.name = "SVR_Reiki_Clean_Single_Hologram";
  root.add(screen);

  const edgeMat = new THREE.LineBasicMaterial({ color: REIKI_COLOR, transparent: true, opacity: 0.82 });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.0, 2.26)), edgeMat);
  edge.position.copy(screen.position);
  edge.rotation.copy(screen.rotation);
  edge.name = "SVR_Reiki_Clean_Hologram_Edge";
  root.add(edge);

  const glow = new THREE.PointLight(REIKI_COLOR, 0.28, 5.5, 2.0);
  glow.position.set(20.35, 1.8, -6.36);
  glow.name = "SVR_Reiki_Clean_Soft_Light";
  root.add(glow);

  addLabel(root);
  addCarpet(root);
  addRails(root);
  addGlassHint(root);
  return root;
}

function primeAudio(video) {
  const unlock = () => {
    try {
      video.muted = false;
      video.volume = 1;
      video.play?.().catch?.(() => {});
    } catch {}
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}

export function installReikiFinishPatch({ scene }) {
  if (!scene || scene.getObjectByName(PATCH_NAME)) return false;
  const existing = findExistingVideo(scene);
  if (!existing?.texture) return false;
  hideOldHologramPieces(scene, existing.parent);
  addCleanHologram(scene, existing.texture);
  if (existing.video) primeAudio(existing.video);
  window.SVR_REIKI_FINISH_PATCH = {
    phase: "98S-E",
    status: "installed",
    hologram: "single-flat-inward-facing",
    backgroundPanelRemoved: true,
    uShapeRemoved: true,
    audioPrimedOnUserGesture: true
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
