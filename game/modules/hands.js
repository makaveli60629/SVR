import * as THREE from "three";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";

const SKIN_TEXTURE_URLS = [
  "./assets/texture/arms_body_c.jpg",
  "./assets/models/eric/rp_eric_rigged_001_dif.jpg",
  "./assets/models/claudia/rp_claudia_rigged_002_dif.jpg"
];

function makeProxyJoint(name){
  const obj = new THREE.Object3D();
  obj.name = name;
  return obj;
}

function makeSkinMaterial(){
  return new THREE.MeshStandardMaterial({
    color: 0xd9a47f,
    roughness: 0.58,
    metalness: 0.02,
    emissive: 0x120906,
    emissiveIntensity: 0.015
  });
}

function loadSkinTexture(targets, renderer){
  const loader = new THREE.TextureLoader();
  let index = 0;
  const tryNext = ()=>{
    if (index >= SKIN_TEXTURE_URLS.length) return;
    const url = SKIN_TEXTURE_URLS[index++];
    loader.load(url, (tex)=>{
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer?.capabilities?.getMaxAnisotropy?.() ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
      for (const mat of targets){
        if (!mat) continue;
        mat.map = tex;
        mat.color?.set?.(0xffffff);
        mat.needsUpdate = true;
      }
    }, undefined, tryNext);
  };
  tryNext();
}

function makeControllerProxy(controller, handed = "right", skinMat){
  const proxy = new THREE.Group();
  proxy.name = `svr-${handed}-native-hand-controller-proxy`;
  proxy.userData.controller = controller;
  proxy.userData.handedness = handed;
  proxy.visible = true;
  proxy.joints = {
    wrist: makeProxyJoint("wrist"),
    "thumb-tip": makeProxyJoint("thumb-tip"),
    "index-finger-tip": makeProxyJoint("index-finger-tip"),
    "middle-finger-tip": makeProxyJoint("middle-finger-tip"),
    "ring-finger-tip": makeProxyJoint("ring-finger-tip"),
    "pinky-finger-tip": makeProxyJoint("pinky-finger-tip"),
    "index-finger-metacarpal": makeProxyJoint("index-finger-metacarpal"),
    "pinky-finger-metacarpal": makeProxyJoint("pinky-finger-metacarpal")
  };
  Object.values(proxy.joints).forEach(j=>proxy.add(j));

  const visual = new THREE.Group();
  visual.name = "textured-hand-visual";
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 18, 12), skinMat);
  palm.scale.set(0.78, 0.42, 1.15);
  palm.position.set(0, -0.005, 0.028);
  visual.add(palm);

  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.024, 0.075, 16), skinMat);
  wrist.rotation.x = Math.PI / 2;
  wrist.position.set(0, -0.006, -0.025);
  visual.add(wrist);

  const side = handed === "left" ? -1 : 1;
  const fingerOffsets = [0.020, 0.008, -0.005, -0.017];
  fingerOffsets.forEach((x, i)=>{
    const len = [0.060, 0.070, 0.064, 0.052][i];
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0085, len, 12), skinMat);
    finger.rotation.x = Math.PI / 2;
    finger.position.set(x * side, 0.002, 0.073 + i * 0.001);
    visual.add(finger);
  });
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.046, 12), skinMat);
  thumb.rotation.set(Math.PI / 2, 0, side * 0.64);
  thumb.position.set(0.035 * side, -0.014, 0.040);
  visual.add(thumb);
  proxy.add(visual);
  proxy.userData.visual = visual;
  return proxy;
}

function setModelSkin(model, skinMat){
  model.traverse?.((obj)=>{
    if (!obj.isMesh) return;
    obj.visible = true;
    obj.frustumCulled = false;
    obj.material = skinMat;
    obj.castShadow = false;
    obj.receiveShadow = false;
  });
}

function updateControllerProxy(proxy){
  const controller = proxy?.userData?.controller;
  if (!controller) return;
  controller.visible = false;
  controller.updateWorldMatrix(true, false);
  controller.getWorldPosition(proxy.position);
  controller.getWorldQuaternion(proxy.quaternion);
  proxy.visible = true;

  const gp = proxy?.userData?.inputSource?.gamepad || controller.inputSource?.gamepad || null;
  proxy.userData.gamepad = gp || null;
  const trigger = gp?.buttons?.[0]?.value || 0;
  const squeeze = gp?.buttons?.[1]?.value || 0;
  const side = proxy.userData.handedness === "left" ? -1 : 1;
  const curl = THREE.MathUtils.lerp(0, 1, Math.max(trigger, squeeze));
  const fist = squeeze > 0.35;

  proxy.userData.trigger = trigger;
  proxy.userData.squeeze = squeeze;
  proxy.joints.wrist.position.set(0, 0, 0);
  proxy.joints["index-finger-metacarpal"].position.set(0.014 * side, 0.002, 0.030);
  proxy.joints["pinky-finger-metacarpal"].position.set(-0.020 * side, -0.002, 0.026);

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

  const v = proxy.userData.visual;
  if (v){
    const curlRot = -0.22 * Math.max(trigger, squeeze);
    v.children.forEach((child, idx)=>{
      if (idx >= 2) child.rotation.y = curlRot * side;
    });
  }
}

export function createHands({ scene, renderer, log = console.log }){
  const handFactory = new XRHandModelFactory();
  const rawHands = [];
  const handModels = [];
  const handDebugGroups = [];
  const controllers = [];
  const controllerProxies = [];
  const skinMat = makeSkinMaterial();
  loadSkinTexture([skinMat], renderer);
  let leftHand = null;
  let rightHand = null;
  let leftControllerProxy = null;
  let rightControllerProxy = null;
  let debugOn = false;

  function makeDebugGroup(parent){
    const group = new THREE.Group();
    group.visible = false;
    const keys = ["wrist", "thumb-tip", "index-finger-tip", "middle-finger-tip", "ring-finger-tip", "pinky-finger-tip"];
    for (const key of keys){
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xb48cff })
      );
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
    hand.add(model);
    setModelSkin(model, skinMat);
    handModels.push(model);
    handDebugGroups.push(makeDebugGroup(hand));

    hand.addEventListener("connected", (evt)=>{
      const handed = evt?.data?.handedness || "unknown";
      hand.userData.handedness = handed;
      setModelSkin(model, skinMat);
      if (handed === "left") leftHand = hand;
      if (handed === "right") rightHand = hand;
      log("Native hand connected", i, handed);
    });

    hand.addEventListener("disconnected", ()=>{
      if (leftHand === hand) leftHand = null;
      if (rightHand === hand) rightHand = null;
    });

    const controller = renderer.xr.getController(i);
    controller.visible = false;
    scene.add(controller);
    controllers.push(controller);

    controller.addEventListener("connected", (evt)=>{
      const handed = evt?.data?.handedness || evt?.data?.gamepad?.hand || (i === 0 ? "left" : "right");
      controller.visible = false;
      controller.inputSource = evt?.data || controller.inputSource || null;
      const proxy = makeControllerProxy(controller, handed, skinMat);
      proxy.userData.inputSource = evt?.data || null;
      scene.add(proxy);
      const debug = makeDebugGroup(proxy);
      controllerProxies.push({ controller, proxy, debug });
      if (handed === "left") leftControllerProxy = proxy;
      if (handed === "right") rightControllerProxy = proxy;
      log("Controller connected as hidden hand proxy", i, handed);
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
    });
  }

  function update(dt = 0.016){
    controllers.forEach(c=>{ if (c) c.visible = false; });
    rawHands.forEach((h)=>{ if (h) h.visible = true; });
    handModels.forEach(m=>{ if (m) { m.visible = true; setModelSkin(m, skinMat); } });
    controllerProxies.forEach(({ proxy, controller })=>{
      if (controller) controller.visible = false;
      // If a matching native hand is active, keep the proxy available for input but visually hidden.
      const handed = proxy.userData.handedness;
      const nativeActive = handed === "left" ? !!leftHand : handed === "right" ? !!rightHand : false;
      updateControllerProxy(proxy, dt);
      proxy.userData.visual.visible = !nativeActive;
    });
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
