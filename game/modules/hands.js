import * as THREE from "three";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";

const PHASE = "PHASE-174-HAND-TEXT-TEXTURE-WATCH-POLISH";
const BASE_LEFT = new THREE.Color(0x7ff5c7);
const BASE_RIGHT = new THREE.Color(0xb48cff);
const PURPLE_GLOW = new THREE.Color(0xb648ff);
const PURPLE_EMISSIVE = new THREE.Color(0x7a22ff);

function makeProxyJoint(name){
  const obj = new THREE.Object3D();
  obj.name = name;
  return obj;
}

function makeTextCanvasTexture(label = "SVR", sub = "READY"){
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  function draw(nextLabel = label, nextSub = sub, active = false){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, active ? "rgba(68,12,105,0.96)" : "rgba(8,12,24,0.86)");
    grad.addColorStop(1, active ? "rgba(180,72,255,0.82)" : "rgba(22,10,42,0.84)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect?.(8, 8, 240, 112, 22);
    if (!ctx.roundRect){
      ctx.rect(8, 8, 240, 112);
    }
    ctx.fill();
    ctx.strokeStyle = active ? "rgba(255,255,255,0.92)" : "rgba(180,140,255,0.72)";
    ctx.lineWidth = active ? 7 : 4;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 50px system-ui, Arial";
    ctx.fillText(nextLabel, 128, 50);
    ctx.fillStyle = active ? "#f6e27f" : "#7ff5c7";
    ctx.font = "bold 26px system-ui, Arial";
    ctx.fillText(nextSub, 128, 91);
    tex.needsUpdate = true;
  }

  draw(label, sub, false);
  return { texture: tex, draw };
}

function createHandTextPlane(handed = "right"){
  const layer = makeTextCanvasTexture("SVR", "READY");
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.086, 0.043),
    new THREE.MeshBasicMaterial({ map: layer.texture, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  mesh.name = `svr-${handed}-hand-text-texture`;
  mesh.visible = false;
  mesh.renderOrder = 84;
  mesh.userData.textLayer = layer;
  return mesh;
}

function createHandMaterial(handed = "right"){
  return new THREE.MeshStandardMaterial({
    color: handed === "left" ? BASE_LEFT.clone() : BASE_RIGHT.clone(),
    roughness: 0.32,
    metalness: 0.18,
    transparent: true,
    opacity: 0.92,
    emissive: handed === "left" ? new THREE.Color(0x07251c) : new THREE.Color(0x150728),
    emissiveIntensity: 0.16
  });
}

function createProxyMaterial(handed = "right"){
  return new THREE.MeshStandardMaterial({
    color: handed === "left" ? new THREE.Color(0x58e7c1) : BASE_RIGHT.clone(),
    roughness: 0.28,
    metalness: 0.24,
    transparent: true,
    opacity: 0.78,
    emissive: handed === "left" ? new THREE.Color(0x06372a) : new THREE.Color(0x241044),
    emissiveIntensity: 0.34
  });
}

function setMaterialGlow(material, handed, active){
  if (!material) return;
  if (active){
    material.color.copy(PURPLE_GLOW);
    material.emissive.copy(PURPLE_EMISSIVE);
    material.emissiveIntensity = 1.85;
    material.opacity = 1.0;
  } else {
    material.color.copy(handed === "left" ? BASE_LEFT : BASE_RIGHT);
    material.emissive.setHex(handed === "left" ? 0x07251c : 0x150728);
    material.emissiveIntensity = 0.16;
    material.opacity = 0.92;
  }
}

function setProxyGlow(proxy, active){
  const handed = proxy?.userData?.handedness || "right";
  const mat = proxy?.userData?.visualMaterial;
  if (!mat) return;
  if (active){
    mat.color.copy(PURPLE_GLOW);
    mat.emissive.copy(PURPLE_EMISSIVE);
    mat.emissiveIntensity = 2.0;
    mat.opacity = 1.0;
  } else {
    mat.color.setHex(handed === "left" ? 0x58e7c1 : 0xb48cff);
    mat.emissive.setHex(handed === "left" ? 0x06372a : 0x241044);
    mat.emissiveIntensity = 0.30;
    mat.opacity = 0.76;
  }
}

function updateTextPlane(mesh, active, label = "SVR", sub = "READY"){
  if (!mesh) return;
  mesh.visible = !!active;
  if (mesh.userData._lastLabel !== label || mesh.userData._lastSub !== sub || mesh.userData._lastActive !== active){
    mesh.userData.textLayer?.draw?.(label, sub, active);
    mesh.userData._lastLabel = label;
    mesh.userData._lastSub = sub;
    mesh.userData._lastActive = active;
  }
}

function applyMaterialToHandModel(model, material){
  if (!model || !material || model.userData._svrMaterialApplied) return false;
  let applied = false;
  model.traverse?.((obj)=>{
    if (!obj?.isMesh) return;
    obj.material = material;
    obj.castShadow = false;
    obj.receiveShadow = false;
    applied = true;
  });
  if (applied) model.userData._svrMaterialApplied = true;
  return applied;
}

function makeControllerProxy(controller, handed = "right"){
  const proxy = new THREE.Group();
  proxy.userData.controller = controller;
  proxy.userData.handedness = handed;
  proxy.visible = false;
  proxy.joints = {
    wrist: makeProxyJoint("wrist"),
    "thumb-tip": makeProxyJoint("thumb-tip"),
    "index-finger-tip": makeProxyJoint("index-finger-tip"),
    "middle-finger-tip": makeProxyJoint("middle-finger-tip"),
    "ring-finger-tip": makeProxyJoint("ring-finger-tip"),
    "pinky-finger-tip": makeProxyJoint("pinky-finger-tip")
  };
  Object.values(proxy.joints).forEach(j=>proxy.add(j));

  const palmMat = createProxyMaterial(handed);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 14), palmMat);
  palm.name = `svr-${handed}-controller-hand-palm`;
  palm.visible = false;
  proxy.userData.visualPalm = palm;
  proxy.userData.visualMaterial = palmMat;
  proxy.add(palm);

  const textPlane = createHandTextPlane(handed);
  textPlane.position.set(0, 0.034, 0.065);
  textPlane.rotation.x = -0.45;
  proxy.userData.textPlane = textPlane;
  proxy.add(textPlane);
  return proxy;
}

function updateControllerProxy(proxy){
  const controller = proxy?.userData?.controller;
  if (!controller) return;
  controller.updateWorldMatrix(true, false);
  controller.getWorldPosition(proxy.position);
  controller.getWorldQuaternion(proxy.quaternion);

  const activeState = window.SVR_ACTIVE_TELEPORT_HAND || {};
  const handed = proxy.userData.handedness || "right";
  const activeProxy = activeState.glow === "purple" && (activeState.active === `${handed}-controller` || activeState.active === handed);

  const gp = proxy?.userData?.inputSource?.gamepad || controller.inputSource?.gamepad || null;
  proxy.userData.gamepad = gp || null;
  const trigger = gp?.buttons?.[0]?.value || 0;
  const squeeze = gp?.buttons?.[1]?.value || 0;
  const side = handed === "left" ? -1 : 1;
  const curl = THREE.MathUtils.lerp(0, 1, Math.max(trigger, squeeze));
  const fist = squeeze > 0.35;

  proxy.userData.trigger = trigger;
  proxy.userData.squeeze = squeeze;
  proxy.joints.wrist.position.set(0, 0, 0);

  if (proxy.userData.visualPalm){
    proxy.userData.visualPalm.visible = false;
    proxy.userData.visualPalm.position.set(0, 0, 0.018);
    setProxyGlow(proxy, activeProxy);
    const mat = proxy.userData.visualMaterial;
    if (mat && !activeProxy){
      mat.emissiveIntensity = fist ? 0.58 : trigger > 0.18 ? 0.46 : 0.26;
      mat.opacity = fist ? 0.88 : 0.74;
    }
  }
  updateTextPlane(proxy.userData.textPlane, activeProxy, "TP ON", "SVR");

  if (fist){
    proxy.joints["thumb-tip"].position.set(0.016 * side, -0.005, 0.012);
    proxy.joints["index-finger-tip"].position.set(0.011 * side, -0.001, 0.018);
    proxy.joints["middle-finger-tip"].position.set(0.003 * side, -0.002, 0.017);
    proxy.joints["ring-finger-tip"].position.set(-0.006 * side, -0.002, 0.015);
    proxy.joints["pinky-finger-tip"].position.set(-0.014 * side, -0.002, 0.013);
  } else {
    proxy.joints["thumb-tip"].position.set(0.026 * side, -0.012, 0.031 - trigger * 0.014);
    proxy.joints["index-finger-tip"].position.set(0.012 * side, 0.001, 0.074 - curl * 0.034);
    proxy.joints["middle-finger-tip"].position.set(0.003 * side, 0.001, 0.082 - curl * 0.030);
    proxy.joints["ring-finger-tip"].position.set(-0.008 * side, 0.0, 0.076 - curl * 0.024);
    proxy.joints["pinky-finger-tip"].position.set(-0.018 * side, -0.002, 0.068 - curl * 0.02);
  }

  if (trigger > 0.18){
    const pinchZ = 0.038 - trigger * 0.01;
    proxy.joints["thumb-tip"].position.set(0.015 * side, -0.006, pinchZ);
    proxy.joints["index-finger-tip"].position.set(0.011 * side, -0.001, pinchZ + 0.004);
  }
}

export function createHands({ scene, renderer, log = console.log }){
  const handFactory = new XRHandModelFactory();
  const rawHands = [];
  const handModels = [];
  const handDebugGroups = [];
  const controllers = [];
  const controllerProxies = [];
  const handTextPlanes = { left: null, right: null };
  const materials = { left: createHandMaterial("left"), right: createHandMaterial("right"), unknown: createHandMaterial("right") };
  let leftHand = null;
  let rightHand = null;
  let leftControllerProxy = null;
  let rightControllerProxy = null;
  let debugOn = false;
  let materialApplyCount = 0;

  window.SVR_HAND_MATERIAL_STATE = {
    phase: PHASE,
    active: true,
    appliedModels: 0,
    controllerProxyVisuals: false,
    leftHandTracked: false,
    rightHandTracked: false,
    controllerFallback: true,
    teleportGlowActive: "none",
    teleportGlowColor: "off",
    handTextTexture: true,
    note: "Purple glow and TP ON hand text follow window.SVR_ACTIVE_TELEPORT_HAND."
  };

  function makeDebugGroup(parent){
    const group = new THREE.Group();
    group.visible = false;
    const keys = ["wrist", "thumb-tip", "index-finger-tip", "middle-finger-tip", "ring-finger-tip", "pinky-finger-tip"];
    for (const key of keys){
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), new THREE.MeshBasicMaterial({ color: 0xb48cff }));
      mesh.userData.jointKey = key;
      group.add(mesh);
    }
    parent.add(group);
    return group;
  }

  for (let i = 0; i < 2; i++){
    const hand = renderer.xr.getHand(i);
    hand.visible = true;
    scene.add(hand);
    rawHands.push(hand);
    const model = handFactory.createHandModel(hand, "mesh");
    model.visible = true;
    model.userData._svrHandIndex = i;
    hand.add(model);
    handModels.push(model);
    handDebugGroups.push(makeDebugGroup(hand));

    const guessedHanded = i === 0 ? "left" : "right";
    const textPlane = createHandTextPlane(guessedHanded);
    textPlane.position.set(guessedHanded === "left" ? -0.028 : 0.028, 0.015, 0.055);
    textPlane.rotation.set(-0.95, 0, guessedHanded === "left" ? 0.18 : -0.18);
    hand.add(textPlane);
    hand.userData.textPlane = textPlane;

    hand.addEventListener("connected", (evt)=>{
      const handed = evt?.data?.handedness || "unknown";
      hand.userData.handedness = handed;
      if (handed === "left") { leftHand = hand; handTextPlanes.left = textPlane; }
      if (handed === "right") { rightHand = hand; handTextPlanes.right = textPlane; }
      const applied = applyMaterialToHandModel(model, materials[handed] || materials.unknown);
      if (applied) materialApplyCount++;
      window.SVR_HAND_MATERIAL_STATE.appliedModels = materialApplyCount;
      window.SVR_HAND_MATERIAL_STATE.leftHandTracked = !!leftHand;
      window.SVR_HAND_MATERIAL_STATE.rightHandTracked = !!rightHand;
      log("Hand connected", i, handed, applied ? "material-polished-textured" : "material-pending");
    });

    hand.addEventListener("disconnected", ()=>{
      if (leftHand === hand) leftHand = null;
      if (rightHand === hand) rightHand = null;
      window.SVR_HAND_MATERIAL_STATE.leftHandTracked = !!leftHand;
      window.SVR_HAND_MATERIAL_STATE.rightHandTracked = !!rightHand;
    });

    const controller = renderer.xr.getController(i);
    controller.visible = false;
    scene.add(controller);
    controllers.push(controller);

    controller.addEventListener("connected", (evt)=>{
      const handed = evt?.data?.handedness || evt?.data?.gamepad?.hand || (i === 0 ? "left" : "right");
      controller.inputSource = evt?.data || controller.inputSource || null;
      const proxy = makeControllerProxy(controller, handed);
      proxy.userData.inputSource = evt?.data || null;
      scene.add(proxy);
      const debug = makeDebugGroup(proxy);
      controllerProxies.push({ controller, proxy, debug });
      if (handed === "left") leftControllerProxy = proxy;
      if (handed === "right") rightControllerProxy = proxy;
      window.SVR_HAND_MATERIAL_STATE.controllerProxyVisuals = true;
      log("Controller connected", i, handed, "proxy-hand-material-texture-ready");
    });

    controller.addEventListener("disconnected", ()=>{
      const idx = controllerProxies.findIndex(x=>x.controller === controller);
      if (idx >= 0){
        const rec = controllerProxies[idx];
        if (rec.proxy === leftControllerProxy) leftControllerProxy = null;
        if (rec.proxy === rightControllerProxy) rightControllerProxy = null;
        rec.proxy.parent?.remove(rec.proxy);
        controllerProxies.splice(idx, 1);
      }
      window.SVR_HAND_MATERIAL_STATE.controllerProxyVisuals = controllerProxies.length > 0;
    });
  }

  function updateHandGlow(){
    const activeState = window.SVR_ACTIVE_TELEPORT_HAND || {};
    const active = activeState.glow === "purple" ? activeState.active : "none";
    setMaterialGlow(materials.left, "left", active === "left");
    setMaterialGlow(materials.right, "right", active === "right");
    setMaterialGlow(materials.unknown, "right", active === "right" || active === "left");
    updateTextPlane(handTextPlanes.left, active === "left", "TP ON", "SVR");
    updateTextPlane(handTextPlanes.right, active === "right", "TP ON", "SVR");
    window.SVR_HAND_MATERIAL_STATE.teleportGlowActive = active || "none";
    window.SVR_HAND_MATERIAL_STATE.teleportGlowColor = active === "none" ? "off" : "purple";
  }

  function update(dt = 0.016){
    updateHandGlow();
    controllers.forEach(c=>{ if (c) c.visible = false; });
    rawHands.forEach((h)=>{ if (h) h.visible = true; });
    handModels.forEach((m, idx)=>{
      if (!m) return;
      m.visible = true;
      const handed = rawHands[idx]?.userData?.handedness || "unknown";
      if (applyMaterialToHandModel(m, materials[handed] || materials.unknown)) materialApplyCount++;
    });
    controllerProxies.forEach(({ proxy })=> updateControllerProxy(proxy, dt));
    window.SVR_HAND_MATERIAL_STATE.appliedModels = materialApplyCount;
    window.SVR_HAND_MATERIAL_STATE.leftHandTracked = !!leftHand;
    window.SVR_HAND_MATERIAL_STATE.rightHandTracked = !!rightHand;
    window.SVR_HAND_MATERIAL_STATE.controllerProxyVisuals = controllerProxies.length > 0;
  }

  function updateDebug(){
    const sources = [...rawHands, ...controllerProxies.map(x=>x.proxy)];
    const groups = [...handDebugGroups, ...controllerProxies.map(x=>x.debug)];
    for (let i = 0; i < sources.length; i++){
      const hand = sources[i];
      const group = groups[i];
      if (!group) continue;
      group.visible = debugOn;
      if (!debugOn) continue;
      for (const child of group.children){
        const joint = hand.joints?.[child.userData.jointKey];
        child.visible = !!joint;
        if (joint) joint.getWorldPosition(child.position);
      }
    }
  }

  function toggleDebug(){
    debugOn = !debugOn;
    [...handDebugGroups, ...controllerProxies.map(x=>x.debug)].forEach(group=>{ if (group) group.visible = debugOn; });
    return debugOn;
  }

  return {
    getLeft: ()=> leftHand?.joints ? leftHand : (leftControllerProxy || rawHands[0] || null),
    getRight: ()=> rightHand?.joints ? rightHand : (rightControllerProxy || rawHands[1] || rawHands[0] || null),
    getLeftHand: ()=> leftHand?.joints ? leftHand : null,
    getRightHand: ()=> rightHand?.joints ? rightHand : null,
    getLeftController: ()=> leftControllerProxy || null,
    getRightController: ()=> rightControllerProxy || null,
    toggleDebug,
    updateDebug,
    update
  };
}
