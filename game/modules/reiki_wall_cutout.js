import * as THREE from "three";

const BUILD = "PHASE-109-REIKI-WALL-CUTOUT-LOCK";

function isDarkMaterial(mat) {
  const list = Array.isArray(mat) ? mat : [mat];
  return list.some((m) => {
    if (!m) return false;
    const c = m.color;
    if (!c) return false;
    return (c.r + c.g + c.b) < 0.22 && (m.opacity === undefined || m.opacity > 0.35);
  });
}

function fadeMaterial(mat) {
  const list = Array.isArray(mat) ? mat : [mat];
  list.forEach((m) => {
    if (!m) return;
    m.transparent = true;
    m.opacity = 0.035;
    m.depthWrite = false;
    m.needsUpdate = true;
  });
}

export function applyReikiWallCutout(scene, { log = console.log } = {}) {
  if (!scene || scene.userData.SVR_PHASE109_REIKI_WALL_CUTOUT) return null;
  const center = new THREE.Vector3(19.95, 0, 0);
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const c = new THREE.Vector3();
  const hidden = [];

  scene.updateMatrixWorld(true);
  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry || !obj.visible) return;
    const n = String(obj.name || "");
    if (/table|chair|card|chip|bot|dealer|poker|portal|planet|moon|mars|hologram|chakra|plant|rope|pole|carpet|glass|sign/i.test(n)) return;
    if (!isDarkMaterial(obj.material)) return;
    box.setFromObject(obj);
    box.getSize(size);
    box.getCenter(c);

    const nearReiki = c.distanceTo(center) < 12.5 || (c.x > 12 && c.x < 26 && c.z > -8 && c.z < 8);
    const wallLike = size.y > 2.5 && Math.max(size.x, size.z) > 5.0;
    if (nearReiki && wallLike) {
      obj.userData.SVR_PHASE109_WALL_CUTOUT_ORIGINAL_VISIBLE = obj.visible;
      obj.name = n ? `${n}_SVR_PHASE109_FADED` : "SVR_PHASE109_FADED_REIKI_BLACK_WALL";
      fadeMaterial(obj.material);
      obj.renderOrder = -10;
      hidden.push(obj.name);
    }
  });

  const old = document.getElementById("svr-position-panel");
  if (old) {
    old.textContent = `SVR POSITION PANEL\n${BUILD}\nBlack storefront wall faded/cut out\nMeshes corrected: ${hidden.length}`;
  }
  scene.userData.SVR_PHASE109_REIKI_WALL_CUTOUT = { build: BUILD, hidden };
  window.SVR_PHASE109_REIKI_WALL_CUTOUT = scene.userData.SVR_PHASE109_REIKI_WALL_CUTOUT;
  log?.("Phase 109 Reiki wall cutout applied", hidden);
  return scene.userData.SVR_PHASE109_REIKI_WALL_CUTOUT;
}
