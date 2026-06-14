import * as THREE from "three";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";

function makeProxyJoint(name){
  const obj = new THREE.Object3D();
  obj.name = name;
  return obj;
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
  return proxy;
}

function makeControllerVisual(handed = "right"){
  const root = new THREE.Group();
  root.name = handed === "right" ? "PHASE226_RIGHT_QUEST_CONTROLLER_VISIBLE_MODEL" : "PHASE226_LEFT_QUEST_CONTROLLER_VISIBLE_MODEL";
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.145, 0.045),
    new THREE.MeshStandardMaterial({ color:0xd8dce8, roughness:.5, metalness:.08, emissive:0x111827, emissiveIntensity:.05 })
  );
  shell.name = "PHASE226_CONTROLLER_BODY";
  shell.position.set(0, -0.035, -0.018);
  root.add(shell);

  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, 0.028, 0.052),
    new THREE.MeshStandardMaterial({ color:0xf4f6fb, roughness:.42, metalness:.04 })
  );
  face.name = "PHASE226_CONTROLLER_FACE_PLATE";
  face.position.set(0, 0.056, -0.026);
  root.add(face);

  const grip = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.025, 0.105, 6, 12),
    new THREE.MeshStandardMaterial({ color:0x1e2430, roughness:.75, metalness:.02 })
  );
  grip.name = "PHASE226_CONTROLLER_GRIP";
  grip.position.set(0, -0.112, 0.000);
  grip.rotation.x = 0.10;
  root.add(grip);

  const trigger = new THREE.Mesh(
    new THREE.BoxGeometry(0.040, 0.033, 0.010),
    new THREE.MeshStandardMaterial({ color:0x10151f, roughness:.66 })
  );
  trigger.name = "PHASE226_CONTROLLER_TRIGGER";
  trigger.position.set(0, 0.012, -0.060);
  root.add(trigger);

  const thumb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.010, 18),
    new THREE.MeshStandardMaterial({ color:0x2b3344, roughness:.62 })
  );
  thumb.name = "PHASE226_CONTROLLER_THUMBSTICK";
  thumb.rotation.x = Math.PI / 2;
  thumb.position.set(handed === "right" ? -0.019 : 0.019, 0.074, -0.020);
  root.add(thumb);

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.022, 0.027, 32),
    new THREE.MeshBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.34, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending })
  );
  glow.name = "PHASE226_CONTROLLER_CYAN_STATUS_RING";
  glow.position.set(0, 0.090, -0.021);
  glow.rotation.x = Math.PI / 2;
  root.add(glow);

  root.visible = false;
  root.scale.setScalar(1.0);
  return root;
}

function attachGlove(){
  // Phase 197: no visible glove/proxy overlay. Keep real WebXR hand mesh only.
  window.SVR_PHASE197_HAND_OVERLAY_DISABLED = true;
  return null;
}

function updateControllerProxy(proxy){
  const controller = proxy?.userData?.controller;
  if (!controller) return;
  controller.updateWorldMatrix(true, false);
  controller.getWorldPosition(proxy.position);
  controller.getWorldQuaternion(proxy.quaternion);

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
  let leftHand = null;
  let rightHand = null;
  let leftControllerProxy = null;
  let rightControllerProxy = null;
  let debugOn = false;
  window.SVR_PHASE197_HAND_OVERLAY_DISABLED = true;
  window.SVR_PHASE226_RIGHT_CONTROLLER_VISIBLE = true;

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
    attachGlove(hand, i === 0 ? "left" : "right");
    handModels.push(model);
    handDebugGroups.push(makeDebugGroup(hand));

    hand.addEventListener("connected", (evt)=>{
      const handed = evt?.data?.handedness || "unknown";
      hand.userData.handedness = handed;
      if (handed === "left") leftHand = hand;
      if (handed === "right") rightHand = hand;
      log("Hand connected", i, handed);
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
      controller.inputSource = evt?.data || controller.inputSource || null;
      const proxy = makeControllerProxy(controller, handed);
      proxy.userData.inputSource = evt?.data || null;
      scene.add(proxy);
      attachGlove(proxy, handed);
      proxy.visible = false;
      const debug = makeDebugGroup(proxy);
      const visual = makeControllerVisual(handed);
      controller.add(visual);
      controller.userData.phase226Visual = visual;
      controllerProxies.push({ controller, proxy, debug, visual, handed });
      if (handed === "left") leftControllerProxy = proxy;
      if (handed === "right") rightControllerProxy = proxy;
      log("Controller connected", i, handed);
    });

    controller.addEventListener("disconnected", ()=>{
      const idx = controllerProxies.findIndex(x=>x.controller === controller);
      if (idx >= 0){
        const rec = controllerProxies[idx];
        if (rec.proxy === leftControllerProxy) leftControllerProxy = null;
        if (rec.proxy === rightControllerProxy) rightControllerProxy = null;
        rec.visual?.parent?.remove(rec.visual);
        rec.proxy.parent?.remove(rec.proxy);
        controllerProxies.splice(idx, 1);
      }
    });
  }

  function update(dt = 0.016){
    controllers.forEach(c=>{
      if (!c) return;
      const visual = c.userData?.phase226Visual;
      const handed = c.inputSource?.handedness || visual?.name?.includes("RIGHT") ? "right" : "left";
      c.visible = true;
      if (visual) visual.visible = handed === "right";
    });
    rawHands.forEach(h=>{ if (h) h.visible = true; });
    handModels.forEach(m=>{ if (m) m.visible = true; });
    controllerProxies.forEach(({ proxy })=>{ proxy.visible = false; updateControllerProxy(proxy, dt); });
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
