import * as THREE from "three";

const PHASE = "PHASE-144-RIGHT-CONTROLLER-ONLY-TELEPORT-FREEZE-ISOLATION-LOCK";
const RIGHT_ONLY = true;

function tagDynamic(obj){ if(obj) obj.userData.svrNoWorldShift = true; return obj; }
function makeProxyJoint(name){ const obj = new THREE.Object3D(); obj.name = name; obj.userData.svrNoWorldShift = true; return obj; }
function makeControllerProxy(controller, handed = "right"){
  const proxy = tagDynamic(new THREE.Group());
  proxy.name = `SVR_PHASE144_${String(handed).toUpperCase()}_CONTROLLER_PROXY`;
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
function updateControllerProxy(proxy){
  const controller = proxy?.userData?.controller;
  if (!controller) return;
  controller.visible = false;
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
  const rawHands = [];
  const handDebugGroups = [];
  const controllers = [];
  const controllerProxies = [];
  let leftControllerProxy = null;
  let rightControllerProxy = null;
  let debugOn = false;

  function makeDebugGroup(parent){
    const group = tagDynamic(new THREE.Group());
    group.visible = false;
    const keys = ["wrist", "thumb-tip", "index-finger-tip", "middle-finger-tip", "ring-finger-tip", "pinky-finger-tip"];
    for (const key of keys){
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00ffff, depthTest:false, depthWrite:false }));
      mesh.userData.jointKey = key;
      mesh.userData.svrNoWorldShift = true;
      group.add(mesh);
    }
    parent.add(group);
    return group;
  }

  for (let i = 0; i < 2; i++){
    const hand = tagDynamic(renderer.xr.getHand(i));
    hand.visible = false;
    scene.add(hand);
    rawHands.push(hand);
    hand.addEventListener("connected", (evt)=>{
      hand.visible = false;
      log("Hand tracking disabled for Phase 144 controller-only freeze isolation", i, evt?.data?.handedness || "unknown");
    });
    hand.addEventListener("disconnected", ()=>{});

    const controller = tagDynamic(renderer.xr.getController(i));
    controller.visible = false;
    scene.add(controller);
    controllers.push(controller);
    controller.addEventListener("connected", (evt)=>{
      const handed = evt?.data?.handedness || evt?.data?.gamepad?.hand || (i === 0 ? "left" : "right");
      controller.inputSource = evt?.data || controller.inputSource || null;
      controller.visible = false;
      if (RIGHT_ONLY && handed !== "right"){
        log("Left controller ignored for Phase 144", i, handed);
        return;
      }
      const proxy = makeControllerProxy(controller, handed);
      proxy.userData.inputSource = evt?.data || null;
      scene.add(proxy);
      const debug = makeDebugGroup(proxy);
      controllerProxies.push({ controller, proxy, debug });
      if (handed === "left") leftControllerProxy = proxy;
      if (handed === "right") rightControllerProxy = proxy;
      log("Right controller proxy connected for Phase 144", i, handed);
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
    rawHands.forEach(h=>{ if (h) h.visible = false; });
    controllerProxies.forEach(({ proxy })=> updateControllerProxy(proxy, dt));
  }
  function updateDebug(){
    const sources = controllerProxies.map(x=>x.proxy);
    const groups = controllerProxies.map(x=>x.debug);
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
  window.SVR_XR_DYNAMIC_TAG_LOCK = { phase:PHASE, controllerOnly:true, rightControllerOnly:RIGHT_ONLY, handTrackingDisabled:true, reason:"hand freezes reported" };
  return {
    getLeft: ()=> null,
    getRight: ()=> rightControllerProxy || null,
    getLeftHand: ()=> null,
    getRightHand: ()=> null,
    getLeftController: ()=> null,
    getRightController: ()=> rightControllerProxy || null,
    toggleDebug,
    updateDebug,
    update
  };
}
