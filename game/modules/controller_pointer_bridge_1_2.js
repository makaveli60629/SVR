import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-3H-CONTROLLER-POINTER-TARGET-POLISH";

function getGamepad(controller) {
  return controller?.inputSource?.gamepad || controller?.userData?.inputSource?.gamepad || null;
}

function buttonPressed(gp) {
  if (!gp?.buttons?.length) return false;
  return (gp.buttons[0]?.value || 0) > 0.55 || (gp.buttons[1]?.value || 0) > 0.70 || (gp.buttons[3]?.value || 0) > 0.75;
}

function makeRay(color = 0x00ffcc) {
  const group = new THREE.Group();
  group.name = "SVR_CONTROLLER_POINTER_RAY";
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const geo = new THREE.CylinderGeometry(0.007, 0.002, 7.0, 10, 1, true);
  geo.rotateX(Math.PI / 2);
  const beam = new THREE.Mesh(geo, mat);
  beam.name = "SVR_CONTROLLER_POINTER_BEAM";
  beam.position.z = -3.5;
  group.add(beam);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }));
  dot.name = "SVR_CONTROLLER_POINTER_DOT";
  dot.position.z = -7.0;
  group.add(dot);
  group.visible = true;
  return group;
}

function makeHoverTexture(title, sub = "PRESS TRIGGER") {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 220;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "rgba(0,8,12,.96)");
  g.addColorStop(1, "rgba(20,8,34,.94)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(140,255,242,.88)";
  x.lineWidth = 8;
  x.strokeRect(12, 12, c.width - 24, c.height - 24);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(0,255,230,.62)";
  x.shadowBlur = 14;
  x.fillStyle = "#ffffff";
  x.font = "900 42px system-ui,Arial";
  x.fillText(title, c.width / 2, 82, c.width - 56);
  x.shadowBlur = 4;
  x.fillStyle = "#dffff8";
  x.font = "900 28px system-ui,Arial";
  x.fillText(sub, c.width / 2, 145, c.width - 56);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function friendlyName(obj) {
  const n = String(obj?.name || "");
  if (/PREV|LEFT/i.test(n)) return "SLIDE LEFT";
  if (/NEXT|RIGHT/i.test(n)) return "SLIDE RIGHT";
  if (/ACTIVATE|ACTION/i.test(n)) return "ACTION";
  if (/DAILY|GIVEAWAY/i.test(n)) return "DAILY GIVEAWAY";
  if (/STORE/i.test(n)) return "SVR STORE";
  if (/REIKI/i.test(n)) return "REIKI";
  if (/PGA/i.test(n)) return "PGA";
  if (/SCORPION/i.test(n)) return "SCORPION";
  if (/PORTAL/i.test(n)) return "PORTAL";
  if (/BUTTON/i.test(n)) return "BUTTON";
  return "INTERACT";
}

function targetEligible(obj) {
  if (!obj?.visible) return false;
  const n = String(obj.name || "");
  return !!(
    obj.userData?.activate ||
    /SVR_RICI_UPDATE_101_(PREV_BUTTON|NEXT_BUTTON|ACTIVATE_BUTTON)/i.test(n) ||
    /SVR_STORE_CAROUSEL_(PREV_BUTTON|NEXT_BUTTON|ACTION_BUTTON)/i.test(n) ||
    /SVR_PORTAL_BUTTON_|SVR_UPDATE3_PORTAL_|portal-click-surface/i.test(n) ||
    /DAILY_GIVEAWAY|INTERACTION_RING/i.test(n)
  );
}

export function applyControllerPointerBridge12(scene, { log = console.log } = {}) {
  const renderer = window.SVR_RENDERER;
  if (!scene || !renderer || scene.getObjectByName("SVR_CONTROLLER_POINTER_BRIDGE_LOCK")) return null;

  const lock = new THREE.Group();
  lock.name = "SVR_CONTROLLER_POINTER_BRIDGE_LOCK";
  scene.add(lock);

  const controllers = [renderer.xr.getController(0), renderer.xr.getController(1)].filter(Boolean);
  const rays = new Map();
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let lastActivate = 0;
  let targetCache = [];
  let targetCacheAt = 0;

  const hover = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 0.46),
    new THREE.MeshBasicMaterial({ map: makeHoverTexture("INTERACT"), transparent: true, opacity: 0.96, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  );
  hover.name = "SVR_CONTROLLER_POINTER_HOVER_LABEL";
  hover.visible = false;
  hover.renderOrder = 950;
  scene.add(hover);

  controllers.forEach((controller, i) => {
    const ray = makeRay(i === 0 ? 0x8fffea : 0x00ffcc);
    controller.add(ray);
    rays.set(controller, ray);
    controller.visible = true;
    controller.addEventListener("connected", (evt) => {
      controller.inputSource = evt?.data || controller.inputSource || null;
      ray.visible = true;
    });
    controller.addEventListener("disconnected", () => { ray.visible = false; });
  });

  function collectTargets(force = false) {
    const now = performance.now();
    if (!force && now - targetCacheAt < 450 && targetCache.length) return targetCache;
    const targets = [];
    scene.traverse((obj) => { if (targetEligible(obj)) targets.push(obj); });
    targetCache = targets;
    targetCacheAt = now;
    return targets;
  }

  function activate(obj) {
    let node = obj;
    while (node) {
      if (typeof node.userData?.activate === "function") {
        node.userData.activate();
        return true;
      }
      node = node.parent;
    }
    return false;
  }

  function updateHover(hit, controller) {
    if (!hit) { hover.visible = false; return; }
    hover.visible = true;
    hover.material.map = makeHoverTexture(friendlyName(hit.object));
    hover.material.needsUpdate = true;
    hover.position.copy(hit.point);
    hover.position.y += 0.18;
    const cam = scene.userData?._camera || window.SVR_CAMERA;
    if (cam) hover.lookAt(cam.position);
    window.SVR_CONTROLLER_POINTER_HOVER = { target: hit.object.name || hit.object.type, controller: controller.inputSource?.handedness || "controller" };
  }

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    if (!renderer.xr.isPresenting) return;
    const targets = collectTargets();
    const now = performance.now();
    let bestHit = null;
    let bestController = null;
    controllers.forEach((controller) => {
      const ray = rays.get(controller);
      if (!ray) return;
      ray.visible = true;
      controller.updateWorldMatrix(true, false);
      controller.getWorldPosition(origin);
      controller.getWorldDirection(dir);
      dir.normalize();
      raycaster.set(origin, dir);
      raycaster.far = 9.0;
      const hit = targets.length ? raycaster.intersectObjects(targets, true)[0] : null;
      if (hit && (!bestHit || hit.distance < bestHit.distance)) { bestHit = hit; bestController = controller; }
      const beam = ray.getObjectByName("SVR_CONTROLLER_POINTER_BEAM");
      const dot = ray.getObjectByName("SVR_CONTROLLER_POINTER_DOT");
      const dist = hit?.distance ? Math.min(7.0, Math.max(0.35, hit.distance)) : 7.0;
      if (beam) { beam.scale.y = dist / 7.0; beam.position.z = -dist / 2; beam.material.opacity = hit ? 0.94 : 0.42; }
      if (dot) { dot.position.z = -dist; dot.material.color.setHex(hit ? 0xffffaa : 0xffffff); dot.scale.setScalar(hit ? 1.42 : 1.0); }

      const gp = getGamepad(controller);
      const pressed = buttonPressed(gp);
      const wasPressed = !!controller.userData._svrPointerPressed;
      if (pressed && !wasPressed && hit && now - lastActivate > 220) {
        if (activate(hit.object)) {
          lastActivate = now;
          window.SVR_CONTROLLER_POINTER_LAST_HIT = hit.object.name || hit.object.type;
          collectTargets(true);
        }
      }
      controller.userData._svrPointerPressed = pressed;
    });
    updateHover(bestHit, bestController);
  };

  window.SVR_CONTROLLER_POINTER_BRIDGE = { build: BUILD, controllers: controllers.length, active: true, targetCache: true, hoverLabel: true, storeButtons: true, reikiButtons: true, portalCards: true };
  log?.("Controller pointer bridge 1.3H loaded", window.SVR_CONTROLLER_POINTER_BRIDGE);
  return lock;
}
