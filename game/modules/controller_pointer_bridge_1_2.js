import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-2-CONTROLLER-POINTER-BRIDGE";

function getGamepad(controller) {
  return controller?.inputSource?.gamepad || controller?.userData?.inputSource?.gamepad || null;
}

function buttonPressed(gp) {
  if (!gp?.buttons?.length) return false;
  return (gp.buttons[0]?.value || 0) > 0.55 || (gp.buttons[1]?.value || 0) > 0.70;
}

function makeRay(color = 0x00ffcc) {
  const group = new THREE.Group();
  group.name = "SVR_CONTROLLER_POINTER_RAY";
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, depthWrite: false });
  const geo = new THREE.CylinderGeometry(0.006, 0.002, 6.0, 10, 1, true);
  geo.rotateX(Math.PI / 2);
  const beam = new THREE.Mesh(geo, mat);
  beam.name = "SVR_CONTROLLER_POINTER_BEAM";
  beam.position.z = -3.0;
  group.add(beam);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }));
  dot.name = "SVR_CONTROLLER_POINTER_DOT";
  dot.position.z = -6.0;
  group.add(dot);
  group.visible = true;
  return group;
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

  function collectTargets() {
    const targets = [];
    scene.traverse((obj) => {
      if (!obj?.visible) return;
      if (obj.userData?.activate || /SVR_RICI_UPDATE_101_(PREV_BUTTON|NEXT_BUTTON|ACTIVATE_BUTTON)|portal-click-surface|PORTAL|BUTTON/i.test(obj.name || "")) {
        targets.push(obj);
      }
    });
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

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    if (!renderer.xr.isPresenting) return;
    const targets = collectTargets();
    const now = performance.now();
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
      const beam = ray.getObjectByName("SVR_CONTROLLER_POINTER_BEAM");
      const dot = ray.getObjectByName("SVR_CONTROLLER_POINTER_DOT");
      const dist = hit?.distance ? Math.min(6.0, Math.max(0.35, hit.distance)) : 6.0;
      if (beam) { beam.scale.y = dist / 6.0; beam.position.z = -dist / 2; beam.material.opacity = hit ? 0.92 : 0.45; }
      if (dot) { dot.position.z = -dist; dot.material.color.setHex(hit ? 0xffffaa : 0xffffff); dot.scale.setScalar(hit ? 1.35 : 1.0); }

      const gp = getGamepad(controller);
      const pressed = buttonPressed(gp);
      const wasPressed = !!controller.userData._svrPointerPressed;
      if (pressed && !wasPressed && hit && now - lastActivate > 220) {
        if (activate(hit.object)) {
          lastActivate = now;
          window.SVR_CONTROLLER_POINTER_LAST_HIT = hit.object.name || hit.object.type;
        }
      }
      controller.userData._svrPointerPressed = pressed;
    });
  };

  window.SVR_CONTROLLER_POINTER_BRIDGE = { build: BUILD, controllers: controllers.length, active: true };
  log?.("Controller pointer bridge loaded", window.SVR_CONTROLLER_POINTER_BRIDGE);
  return lock;
}
