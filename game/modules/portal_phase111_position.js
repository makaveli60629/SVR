import * as THREE from "three";

const BUILD = "PHASE-111-CHIP-DRIVE-PORTALS-POSITION-LOCK";
const TARGET_X = -13.59;
const TARGET_Z = 12.11;

function makeText(title, sub) {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 260;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#02090b");
  g.addColorStop(1, "#04231f");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(140,255,242,.95)";
  x.lineWidth = 8;
  x.strokeRect(18, 18, c.width - 36, c.height - 36);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff";
  x.font = "900 54px system-ui,Arial";
  x.fillText(title, c.width / 2, 92, c.width - 70);
  x.fillStyle = "#cafff8";
  x.font = "800 30px system-ui,Arial";
  x.fillText(sub, c.width / 2, 162, c.width - 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function faceCenter(obj) {
  obj.lookAt(new THREE.Vector3(0, 1.4, 0));
}

function movePortal(scene, objectName, xOffset) {
  const portal = scene.getObjectByName(objectName);
  if (!portal) return false;
  portal.position.set(TARGET_X + xOffset, 0, TARGET_Z);
  faceCenter(portal);
  portal.userData.SVR_PHASE111_POSITIONED = true;
  return true;
}

function marker(scene) {
  const old = scene.getObjectByName("SVR_PHASE111_PORTAL_MARKER");
  if (old) return old;
  const root = new THREE.Group();
  root.name = "SVR_PHASE111_PORTAL_MARKER";
  root.position.set(TARGET_X, 0, TARGET_Z);
  faceCenter(root);
  scene.add(root);
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.25, .045, 72),
    new THREE.MeshBasicMaterial({ color: 0x0b7068, transparent: true, opacity: .34, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  pad.position.y = .026;
  root.add(pad);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 1.05),
    new THREE.MeshBasicMaterial({ map: makeText("TRAINING PORTALS", "Drive + Chip/Putt here"), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  sign.position.set(0, 2.85, .20);
  root.add(sign);
  root.userData.tick = t => { pad.material.opacity = .27 + Math.sin(t * .002) * .07; };
  return root;
}

export function applyPhase111PortalPosition(scene, { log = console.log } = {}) {
  if (!scene) return null;
  const driveOk = movePortal(scene, "SVR_UPDATE3_PORTAL_pgaDrive", -1.35);
  const chipOk = movePortal(scene, "SVR_UPDATE3_PORTAL_chipPutt", 1.35);
  const root = marker(scene);
  scene.userData.SVR_PHASE111_PORTAL_POSITION = { build: BUILD, driveOk, chipOk, x: TARGET_X, z: TARGET_Z };
  window.SVR_PHASE111_PORTAL_POSITION = scene.userData.SVR_PHASE111_PORTAL_POSITION;
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    root?.userData?.tick?.(performance.now());
  };
  log?.("Phase 111 portals positioned", scene.userData.SVR_PHASE111_PORTAL_POSITION);
  return scene.userData.SVR_PHASE111_PORTAL_POSITION;
}
