import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-4D-QUEST-CONTROLLER-LASER-CAROUSEL-FALLBACK";

function getGamepad(controller) {
  return controller?.inputSource?.gamepad || controller?.userData?.inputSource?.gamepad || null;
}
function btn(gp, i) { return gp?.buttons?.[i]?.value || 0; }
function triggerPressed(gp) { return btn(gp, 0) > 0.55; }
function gripPressed(gp) { return btn(gp, 1) > 0.55; }
function actionPressed(gp) { return btn(gp, 3) > 0.70 || btn(gp, 4) > 0.70 || btn(gp, 5) > 0.70; }
function buttonPressed(gp) { return triggerPressed(gp) || gripPressed(gp) || actionPressed(gp); }
function handed(controller) { return controller?.inputSource?.handedness || controller?.userData?.inputSource?.handedness || "controller"; }

function activeZoneApi() {
  if (window.SVR_PGA_INTERACTION_ACTIVE && window.SVR_PGA_CAROUSEL_14) return { label: "PGA Golf", api: window.SVR_PGA_CAROUSEL_14 };
  if (window.SVR_STORE_INTERACTION_ACTIVE && window.SVR_STORE_CAROUSEL_12) return { label: "SVR Store", api: window.SVR_STORE_CAROUSEL_12 };
  if (window.SVR_REIKI_INTERACTION_ACTIVE && window.SVR_RICI_UPDATE_101_CAROUSEL) return { label: "Reiki", api: window.SVR_RICI_UPDATE_101_CAROUSEL };
  return null;
}

function makeRay(color = 0x00ffcc) {
  const group = new THREE.Group();
  group.name = "SVR_CONTROLLER_POINTER_RAY";
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const geo = new THREE.CylinderGeometry(0.009, 0.003, 9.0, 10, 1, true);
  geo.rotateX(Math.PI / 2);
  const beam = new THREE.Mesh(geo, mat);
  beam.name = "SVR_CONTROLLER_POINTER_BEAM";
  beam.position.z = -4.5;
  group.add(beam);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.98, depthWrite: false, toneMapped: false }));
  dot.name = "SVR_CONTROLLER_POINTER_DOT";
  dot.position.z = -9.0;
  group.add(dot);
  group.visible = true;
  return group;
}
function makeHoverTexture(title, sub = "TRIGGER = SELECT") {
  const c = document.createElement("canvas");
  c.width = 720; c.height = 250;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "rgba(0,8,12,.96)"); g.addColorStop(1, "rgba(20,8,34,.94)");
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(140,255,242,.88)"; x.lineWidth = 8; x.strokeRect(12, 12, c.width - 24, c.height - 24);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = "rgba(0,255,230,.62)"; x.shadowBlur = 14;
  x.fillStyle = "#ffffff"; x.font = "900 44px system-ui,Arial"; x.fillText(title, c.width / 2, 88, c.width - 56);
  x.shadowBlur = 4; x.fillStyle = "#dffff8"; x.font = "900 27px system-ui,Arial"; x.fillText(sub, c.width / 2, 155, c.width - 56);
  x.fillStyle = "rgba(255,255,255,.62)"; x.font = "800 19px system-ui,Arial"; x.fillText("left trigger=previous • right trigger=next • grip/A=action", c.width / 2, 205, c.width - 50);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
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
  return !!(obj.userData?.activate || /SVR_RICI_UPDATE_101_(PREV_BUTTON|NEXT_BUTTON|ACTIVATE_BUTTON)/i.test(n) || /SVR_STORE_CAROUSEL_(PREV_BUTTON|NEXT_BUTTON|ACTION_BUTTON)/i.test(n) || /SVR_PGA_CAROUSEL_(PREV_BUTTON|NEXT_BUTTON|ACTION_BUTTON)/i.test(n) || /SVR_PORTAL_BUTTON_|SVR_UPDATE3_PORTAL_|portal-click-surface/i.test(n) || /DAILY_GIVEAWAY|INTERACTION_RING/i.test(n));
}

export function applyControllerPointerBridge12(scene, { log = console.log } = {}) {
  const renderer = window.SVR_RENDERER;
  if (!scene || !renderer || scene.getObjectByName("SVR_CONTROLLER_POINTER_BRIDGE_LOCK")) return null;

  const lock = new THREE.Group(); lock.name = "SVR_CONTROLLER_POINTER_BRIDGE_LOCK"; scene.add(lock);
  const controllers = [renderer.xr.getController(0), renderer.xr.getController(1)].filter(Boolean);
  const rays = new Map();
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3();
  let lastActivate = 0, targetCache = [], targetCacheAt = 0;

  const hover = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.54), new THREE.MeshBasicMaterial({ map: makeHoverTexture("INTERACT"), transparent: true, opacity: 0.96, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  hover.name = "SVR_CONTROLLER_POINTER_HOVER_LABEL"; hover.visible = false; hover.renderOrder = 950; scene.add(hover);

  controllers.forEach((controller, i) => {
    const ray = makeRay(i === 0 ? 0x8fffea : 0x00ffcc);
    controller.add(ray); rays.set(controller, ray); controller.visible = true;
    controller.addEventListener("connected", (evt) => { controller.inputSource = evt?.data || controller.inputSource || null; ray.visible = true; });
    controller.addEventListener("disconnected", () => { ray.visible = false; });
  });

  function collectTargets(force = false) {
    const now = performance.now();
    if (!force && now - targetCacheAt < 350 && targetCache.length) return targetCache;
    const targets = [];
    scene.traverse((obj) => { if (targetEligible(obj)) targets.push(obj); });
    targetCache = targets; targetCacheAt = now; return targets;
  }
  function activate(obj) {
    let node = obj;
    while (node) { if (typeof node.userData?.activate === "function") { node.userData.activate(); return true; } node = node.parent; }
    return false;
  }
  function zoneFallback(controller, gp) {
    const zone = activeZoneApi();
    if (!zone) return false;
    const hand = handed(controller);
    if (gripPressed(gp) || actionPressed(gp)) { zone.api.activate?.(); window.SVR_CONTROLLER_POINTER_LAST_ZONE_ACTION = { zone: zone.label, action: "activate", hand, at: Date.now() }; return true; }
    if (triggerPressed(gp)) {
      if (hand === "left") { zone.api.prev?.(); window.SVR_CONTROLLER_POINTER_LAST_ZONE_ACTION = { zone: zone.label, action: "prev", hand, at: Date.now() }; }
      else { zone.api.next?.(); window.SVR_CONTROLLER_POINTER_LAST_ZONE_ACTION = { zone: zone.label, action: "next", hand, at: Date.now() }; }
      return true;
    }
    return false;
  }
  function updateHover(hit, controller) {
    const zone = activeZoneApi();
    if (!hit && !zone) { hover.visible = false; return; }
    hover.visible = true;
    hover.material.map = makeHoverTexture(hit ? friendlyName(hit.object) : `${zone.label.toUpperCase()} CONTROLS`, hit ? "TRIGGER = SELECT" : "LEFT TRIGGER PREV • RIGHT TRIGGER NEXT");
    hover.material.needsUpdate = true;
    if (hit) hover.position.copy(hit.point); else {
      const cam = scene.userData?._camera || window.SVR_CAMERA;
      if (cam) { cam.getWorldPosition(hover.position); hover.position.add(new THREE.Vector3(0, -0.18, -1.6).applyQuaternion(cam.quaternion)); }
      else hover.position.set(0, 1.65, -2.0);
    }
    hover.position.y += 0.18;
    const cam = scene.userData?._camera || window.SVR_CAMERA;
    if (cam) hover.lookAt(cam.position);
    window.SVR_CONTROLLER_POINTER_HOVER = { target: hit?.object?.name || zone?.label || "none", controller: controller?.inputSource?.handedness || "controller" };
  }

  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    if (!renderer.xr.isPresenting) return;
    const targets = collectTargets();
    const now = performance.now();
    let bestHit = null, bestController = null;
    controllers.forEach((controller) => {
      const ray = rays.get(controller); if (!ray) return;
      ray.visible = true; controller.updateWorldMatrix(true, false); controller.getWorldPosition(origin); controller.getWorldDirection(dir); dir.normalize();
      raycaster.set(origin, dir); raycaster.far = 11.0;
      const hit = targets.length ? raycaster.intersectObjects(targets, true)[0] : null;
      if (hit && (!bestHit || hit.distance < bestHit.distance)) { bestHit = hit; bestController = controller; }
      const beam = ray.getObjectByName("SVR_CONTROLLER_POINTER_BEAM");
      const dot = ray.getObjectByName("SVR_CONTROLLER_POINTER_DOT");
      const dist = hit?.distance ? Math.min(9.0, Math.max(0.35, hit.distance)) : 9.0;
      if (beam) { beam.scale.y = dist / 9.0; beam.position.z = -dist / 2; beam.material.opacity = hit ? 0.96 : (activeZoneApi() ? 0.70 : 0.42); }
      if (dot) { dot.position.z = -dist; dot.material.color.setHex(hit ? 0xffffaa : (activeZoneApi() ? 0x8fffea : 0xffffff)); dot.scale.setScalar(hit ? 1.5 : (activeZoneApi() ? 1.25 : 1.0)); }
      const gp = getGamepad(controller);
      const pressed = buttonPressed(gp);
      const wasPressed = !!controller.userData._svrPointerPressed;
      if (pressed && !wasPressed && now - lastActivate > 240) {
        if ((hit && activate(hit.object)) || zoneFallback(controller, gp)) {
          lastActivate = now;
          window.SVR_CONTROLLER_POINTER_LAST_HIT = hit?.object?.name || "zone-fallback";
          collectTargets(true);
        }
      }
      controller.userData._svrPointerPressed = pressed;
    });
    updateHover(bestHit, bestController || controllers[0]);
  };

  window.SVR_CONTROLLER_POINTER_BRIDGE = { build: BUILD, controllers: controllers.length, active: true, laserAlwaysOn: true, zoneFallbackControls: true, reikiControls: true, storeControls: true, pgaControls: true, portalCards: true };
  log?.("Controller pointer bridge 1.4D loaded", window.SVR_CONTROLLER_POINTER_BRIDGE);
  return lock;
}
