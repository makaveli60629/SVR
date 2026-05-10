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

async function loadGloveTexture(){
  const loader = new THREE.TextureLoader();
  try{
    const tex = await loader.loadAsync('./assets/texture/glove_diffuse.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }catch(_err){
    return null;
  }
}

function ensureGloveGear(handRoot, gloveTex, handed = 'left'){
  if (!handRoot || handRoot.userData._gloveGear) return;
  const side = handed === 'right' ? -1 : 1;
  const mat = new THREE.MeshStandardMaterial({ map: gloveTex || null, color: gloveTex ? 0xffffff : 0x1b1014, roughness: 0.82, metalness: 0.06, side: THREE.DoubleSide });
  const trim = new THREE.MeshStandardMaterial({ color: 0x2a0f1a, roughness: 0.46, metalness: 0.22, emissive: 0x12050a, emissiveIntensity: 0.06 });
  const grp = new THREE.Group();
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.031, 0.050, 18, 1, true), mat);
  cuff.rotation.z = Math.PI * 0.5;
  cuff.position.set(0, -0.002, -0.028);
  grp.add(cuff);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.004, 8, 20), trim);
  ring.rotation.y = Math.PI * 0.5;
  ring.position.copy(cuff.position);
  grp.add(ring);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.018, 0.080), mat);
  top.position.set(0.0, 0.006, 0.028);
  top.rotation.x = -0.14;
  grp.add(top);
  const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.010, 0.030), trim);
  knuckle.position.set(0.0, 0.011, 0.060);
  knuckle.rotation.x = -0.16;
  grp.add(knuckle);
  const sidePlate = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.048), trim);
  sidePlate.position.set(0.026 * side, 0.004, 0.028);
  sidePlate.rotation.z = 0.08 * side;
  grp.add(sidePlate);
  handRoot.add(grp);
  handRoot.userData._gloveGear = grp;
}

function updateControllerProxy(proxy){
  const controller = proxy?.userData?.controller;
  if (!controller) return;
  controller.updateWorldMatrix(true, false);
  controller.getWorldPosition(proxy.position);
  controller.getWorldQuaternion(proxy.quaternion);

  const gp = controller.inputSource?.gamepad;
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
  let gloveTexture = null;
  loadGloveTexture().then((t)=>{ gloveTexture = t; });

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
      const proxy = makeControllerProxy(controller, handed);
      proxy.userData.inputSource = evt?.data || null;
      scene.add(proxy);
      const debug = makeDebugGroup(proxy);
      controllerProxies.push({ controller, proxy, debug });
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
        rec.proxy.parent?.remove(rec.proxy);
        controllerProxies.splice(idx, 1);
      }
    });
  }

  function update(dt = 0.016){
    controllers.forEach(c=>{ if (c) c.visible = false; });
    rawHands.forEach((h, idx)=>{
      if (h) h.visible = true;
      if (h) ensureGloveGear(h, gloveTexture, h.userData.handedness || (idx === 0 ? 'left' : 'right'));
    });
    handModels.forEach(m=>{ if (m) m.visible = true; });
    controllerProxies.forEach(({ proxy })=> updateControllerProxy(proxy, dt));
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
    getLeft: ()=> leftHand?.joints ? leftHand : (leftControllerProxy?.joints ? leftControllerProxy : rawHands[0] || null),
    getRight: ()=> rightHand?.joints ? rightHand : (rightControllerProxy?.joints ? rightControllerProxy : rawHands[1] || rawHands[0] || null),
    toggleDebug,
    updateDebug,
    update
  };
}
