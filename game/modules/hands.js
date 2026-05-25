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


const FIRE_LIGHTNING_COLORS = {
  fire: 0xff6a00,
  ember: 0xffb000,
  electric: 0x33e8ff,
  violet: 0xb48cff,
  whiteHot: 0xffffee
};

function createLightningLine(count = 18){
  const geom = new THREE.BufferGeometry();
  const arr = new Float32Array(count * 2 * 3);
  geom.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const mat = new THREE.LineBasicMaterial({
    color: FIRE_LIGHTNING_COLORS.electric,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const line = new THREE.LineSegments(geom, mat);
  line.userData.count = count;
  line.frustumCulled = false;
  return line;
}

function createFireLightningHandGlow(scene, source, handed = "right"){
  const group = new THREE.Group();
  group.name = `SVR_${handed}_fire_lightning_hand_glow`;
  group.visible = false;
  group.userData.source = source;
  group.userData.handedness = handed;

  const ringMats = [
    new THREE.MeshBasicMaterial({ color: FIRE_LIGHTNING_COLORS.fire, transparent: true, opacity: 0.62, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: FIRE_LIGHTNING_COLORS.electric, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending, depthWrite: false }),
    new THREE.MeshBasicMaterial({ color: FIRE_LIGHTNING_COLORS.violet, transparent: true, opacity: 0.50, blending: THREE.AdditiveBlending, depthWrite: false })
  ];
  const rings = [
    new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.006, 8, 42), ringMats[0]),
    new THREE.Mesh(new THREE.TorusGeometry(0.127, 0.005, 8, 42), ringMats[1]),
    new THREE.Mesh(new THREE.TorusGeometry(0.162, 0.004, 8, 42), ringMats[2])
  ];
  rings[0].rotation.x = Math.PI * 0.5;
  rings[1].rotation.y = Math.PI * 0.5;
  rings[2].rotation.z = Math.PI * 0.5;
  rings.forEach(r => {
    r.renderOrder = 40;
    group.add(r);
  });

  const palmOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 18, 18),
    new THREE.MeshBasicMaterial({
      color: FIRE_LIGHTNING_COLORS.ember,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  palmOrb.position.set(0, -0.004, 0.052);
  palmOrb.renderOrder = 41;
  group.add(palmOrb);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.026, 0.13, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: FIRE_LIGHTNING_COLORS.fire,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  flame.position.set(0, 0.005, 0.115);
  flame.rotation.x = -Math.PI * 0.5;
  flame.renderOrder = 41;
  group.add(flame);

  const lightning = createLightningLine(20);
  lightning.renderOrder = 42;
  group.add(lightning);

  const light = new THREE.PointLight(FIRE_LIGHTNING_COLORS.electric, 0.55, 1.35, 2.0);
  light.position.set(0, 0.02, 0.055);
  group.add(light);

  group.userData.rings = rings;
  group.userData.lightning = lightning;
  group.userData.light = light;
  group.userData.palmOrb = palmOrb;
  group.userData.flame = flame;
  scene.add(group);
  return group;
}

function updateFireLightningHandGlow(effect, time = 0){
  const source = effect?.userData?.source;
  const wrist = source?.joints?.wrist;
  if (!wrist){
    effect.visible = false;
    return;
  }
  wrist.updateWorldMatrix?.(true, false);
  wrist.getWorldPosition(effect.position);
  wrist.getWorldQuaternion(effect.quaternion);
  effect.visible = true;

  const handedSign = effect.userData.handedness === "left" ? -1 : 1;
  const pulse = 0.5 + 0.5 * Math.sin(time * 7.0 + handedSign);
  const rings = effect.userData.rings || [];
  rings.forEach((ring, idx)=>{
    ring.rotation.x += 0.012 * (idx + 1) * handedSign;
    ring.rotation.y += 0.018 * (idx + 1);
    ring.rotation.z += 0.010 * (idx + 1) * -handedSign;
    const s = 1.0 + Math.sin(time * (3.1 + idx) + idx) * 0.07;
    ring.scale.setScalar(s);
    ring.material.opacity = [0.55, 0.72, 0.46][idx] + pulse * 0.14;
  });

  if (effect.userData.light) effect.userData.light.intensity = 0.35 + pulse * 0.55;
  if (effect.userData.palmOrb) {
    effect.userData.palmOrb.scale.setScalar(0.86 + pulse * 0.40);
    effect.userData.palmOrb.material.opacity = 0.30 + pulse * 0.28;
  }
  if (effect.userData.flame) {
    effect.userData.flame.scale.set(0.9 + pulse * 0.34, 1.0 + pulse * 0.30, 0.9 + pulse * 0.34);
    effect.userData.flame.material.opacity = 0.25 + pulse * 0.28;
  }

  const line = effect.userData.lightning;
  const pos = line?.geometry?.attributes?.position;
  if (pos){
    const arr = pos.array;
    const count = line.userData.count || 18;
    for (let i = 0; i < count; i++){
      const a = i / count * Math.PI * 2;
      const radius = 0.075 + ((i % 3) * 0.022) + Math.sin(time * 6 + i) * 0.006;
      const x1 = Math.cos(a + time * 1.7) * radius;
      const y1 = Math.sin(a * 1.37 + time * 2.2) * 0.055;
      const z1 = 0.055 + Math.sin(a + time * 2.6) * 0.09;
      const x2 = Math.cos(a + 0.37 + time * 1.9) * (radius + 0.030 + Math.sin(time * 11 + i) * 0.006);
      const y2 = y1 + Math.cos(a * 1.9 + time * 4.1) * 0.035;
      const z2 = z1 + Math.sin(a * 1.2 + time * 5.3) * 0.045;
      const o = i * 6;
      arr[o] = x1; arr[o+1] = y1; arr[o+2] = z1;
      arr[o+3] = x2; arr[o+4] = y2; arr[o+5] = z2;
    }
    pos.needsUpdate = true;
    line.material.color.setHex(pulse > 0.5 ? FIRE_LIGHTNING_COLORS.whiteHot : FIRE_LIGHTNING_COLORS.electric);
    line.material.opacity = 0.55 + pulse * 0.34;
  }
}


export function createHands({ scene, renderer, log = console.log }){
  const handFactory = new XRHandModelFactory();
  const rawHands = [];
  const handModels = [];
  const handDebugGroups = [];
  const controllers = [];
  const controllerProxies = [];
  const handGlowEffects = [];
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
    handGlowEffects.push(createFireLightningHandGlow(scene, hand, i === 0 ? "left" : "right"));
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
      controller.inputSource = evt?.data || controller.inputSource || null;
      const proxy = makeControllerProxy(controller, handed);
      proxy.userData.inputSource = evt?.data || null;
      scene.add(proxy);
      const glow = createFireLightningHandGlow(scene, proxy, handed);
      const debug = makeDebugGroup(proxy);
      controllerProxies.push({ controller, proxy, debug, glow });
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
        rec.glow?.parent?.remove(rec.glow);
        controllerProxies.splice(idx, 1);
      }
    });
  }

  function update(dt = 0.016){
    controllers.forEach(c=>{ if (c) c.visible = false; });
    rawHands.forEach((h, idx)=>{
      if (h) h.visible = true;
    });
    handModels.forEach(m=>{ if (m) m.visible = true; });
    controllerProxies.forEach(({ proxy })=> updateControllerProxy(proxy, dt));
    const t = performance.now() * 0.001;
    handGlowEffects.forEach(effect => updateFireLightningHandGlow(effect, t));
    controllerProxies.forEach(({ glow })=> updateFireLightningHandGlow(glow, t));
    window.SVR_FIRE_LIGHTNING_HANDS = {
      build: "PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK",
      rawGlowCount: handGlowEffects.length,
      controllerGlowCount: controllerProxies.filter(x=>x.glow).length,
      theme: "fire-orange + electric-cyan + SVR-violet"
    };
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
