(function () {
  const THREE = AFRAME.THREE;
  const V0 = new THREE.Vector3();
  const V1 = new THREE.Vector3();
  const V2 = new THREE.Vector3();
  const V3 = new THREE.Vector3();
  const Q0 = new THREE.Quaternion();
  const Q1 = new THREE.Quaternion();
  const M0 = new THREE.Matrix4();

  const DEVICE_LAYOUT = {
    left: {
      forearmOffset: 0.096,
      liftOffset: 0.026,
      lateralOffset: -0.002,
      length: 0.196,
      width: 0.078,
      depth: 0.012,
      clampDepth: 0.018,
      screenInset: 0.0022
    }
  };

  window.SVRForearmDeviceLayout = DEVICE_LAYOUT;

  function isQuestBrowser() {
    return /OculusBrowser|Quest/i.test(navigator.userAgent || '');
  }

  function sceneInVR(scene) {
    return !!scene && scene.is && scene.is('vr-mode');
  }

  function getXRFrame(scene) {
    return (scene && scene.frame) || (scene && scene.renderer && scene.renderer.xr && scene.renderer.xr.getFrame && scene.renderer.xr.getFrame()) || null;
  }

  function getReferenceSpace(scene, handComp, trackedWebXR) {
    return (handComp && handComp.referenceSpace) ||
      (trackedWebXR && trackedWebXR.system && trackedWebXR.system.referenceSpace) ||
      (scene && scene.renderer && scene.renderer.xr && scene.renderer.xr.getReferenceSpace && scene.renderer.xr.getReferenceSpace()) ||
      null;
  }

  function getController(el) {
    const tracked = el.components['tracked-controls'];
    const trackedWebXR = el.components['tracked-controls-webxr'];
    return (tracked && tracked.controller) || (trackedWebXR && trackedWebXR.controller) || null;
  }

  function getJointPose(el, jointName) {
    const scene = el.sceneEl;
    const handComp = el.components['hand-tracking-controls'];
    const trackedWebXR = el.components['tracked-controls-webxr'];
    const controller = getController(el);
    const hand = controller && controller.hand;
    const frame = getXRFrame(scene);
    const referenceSpace = getReferenceSpace(scene, handComp, trackedWebXR);
    if (!frame || !hand || !hand.get || !referenceSpace) return null;
    const joint = hand.get(jointName);
    if (!joint) return null;
    const pose = frame.getJointPose(joint, referenceSpace);
    return pose && pose.transform ? pose : null;
  }

  function findNamedBone(root, patterns) {
    let found = null;
    if (!root) return null;
    root.traverse(function (obj) {
      if (found) return;
      const name = String(obj.name || '').toLowerCase();
      for (let i = 0; i < patterns.length; i++) {
        if (patterns[i].test(name)) {
          found = obj;
          break;
        }
      }
    });
    return found;
  }

  function getBasisPose(wrist, index, pinky, cameraObj, side) {
    const midpoint = V3.copy(index).add(pinky).multiplyScalar(0.5);
    const forearmDir = wrist.clone().sub(midpoint).normalize();
    let acrossPalm = index.clone().sub(pinky).normalize();
    let faceNormal = new THREE.Vector3().crossVectors(acrossPalm, forearmDir).normalize();

    if (cameraObj) {
      cameraObj.getWorldPosition(V0);
      if (faceNormal.dot(V0.sub(wrist)) < 0) faceNormal.multiplyScalar(-1);
    }

    acrossPalm = new THREE.Vector3().crossVectors(faceNormal, forearmDir).normalize();
    if (side === 'right') acrossPalm.multiplyScalar(-1);

    M0.makeBasis(forearmDir, acrossPalm, faceNormal);
    return {
      position: wrist,
      quaternion: new THREE.Quaternion().setFromRotationMatrix(M0),
      forearmDir: forearmDir,
      acrossPalm: acrossPalm,
      faceNormal: faceNormal
    };
  }

  function computeWorldPose(el, cache, side) {
    const cameraObj = el.sceneEl && el.sceneEl.camera && el.sceneEl.camera.el && el.sceneEl.camera.el.object3D;
    const layout = DEVICE_LAYOUT[side] || DEVICE_LAYOUT.left;

    if (cache.wristObj && cache.indexObj && cache.pinkyObj) {
      cache.wristObj.getWorldPosition(V0);
      cache.indexObj.getWorldPosition(V1);
      cache.pinkyObj.getWorldPosition(V2);
      const pose = getBasisPose(V0.clone(), V1.clone(), V2.clone(), cameraObj, side);
      pose.position = pose.position.clone()
        .add(pose.forearmDir.clone().multiplyScalar(layout.forearmOffset))
        .add(pose.faceNormal.clone().multiplyScalar(layout.liftOffset))
        .add(pose.acrossPalm.clone().multiplyScalar(layout.lateralOffset));
      return pose;
    }

    const wristPose = getJointPose(el, 'wrist');
    const indexPose = getJointPose(el, 'index-finger-metacarpal');
    const pinkyPose = getJointPose(el, 'pinky-finger-metacarpal');
    if (wristPose && indexPose && pinkyPose) {
      const wrist = new THREE.Vector3(wristPose.transform.position.x, wristPose.transform.position.y, wristPose.transform.position.z);
      const index = new THREE.Vector3(indexPose.transform.position.x, indexPose.transform.position.y, indexPose.transform.position.z);
      const pinky = new THREE.Vector3(pinkyPose.transform.position.x, pinkyPose.transform.position.y, pinkyPose.transform.position.z);
      const pose = getBasisPose(wrist, index, pinky, cameraObj, side);
      pose.position = pose.position.clone()
        .add(pose.forearmDir.clone().multiplyScalar(layout.forearmOffset))
        .add(pose.faceNormal.clone().multiplyScalar(layout.liftOffset))
        .add(pose.acrossPalm.clone().multiplyScalar(layout.lateralOffset));
      return pose;
    }

    return null;
  }

  function makeDeviceEntity(layout) {
    const root = document.createElement('a-entity');
    root.setAttribute('class', 'svr-forearm-device');
    root.setAttribute('visible', 'false');

    const body = document.createElement('a-box');
    body.setAttribute('width', String(layout.length));
    body.setAttribute('height', String(layout.width));
    body.setAttribute('depth', String(layout.depth));
    body.setAttribute('radius', '0.012');
    body.setAttribute('color', '#08090d');
    body.setAttribute('material', 'metalness:0.9; roughness:0.24');
    root.appendChild(body);

    const bezel = document.createElement('a-box');
    bezel.setAttribute('width', String(layout.length - 0.010));
    bezel.setAttribute('height', String(layout.width - 0.010));
    bezel.setAttribute('depth', String(layout.depth + 0.001));
    bezel.setAttribute('position', '0 0 0.0005');
    bezel.setAttribute('color', '#121319');
    bezel.setAttribute('material', 'metalness:0.85; roughness:0.32');
    root.appendChild(bezel);

    const screen = document.createElement('a-plane');
    screen.setAttribute('width', String(layout.length - 0.018));
    screen.setAttribute('height', String(layout.width - 0.018));
    screen.setAttribute('position', `0 0 ${layout.depth / 2 + layout.screenInset}`);
    screen.setAttribute('rotation', '0 0 180');
    screen.setAttribute('material', 'src:#watchCanvas; shader:flat; side:double; transparent:false');
    root.appendChild(screen);

    const glow = document.createElement('a-plane');
    glow.setAttribute('width', String(layout.length - 0.012));
    glow.setAttribute('height', String(layout.width - 0.012));
    glow.setAttribute('position', `0 0 ${layout.depth / 2 + 0.0005}`);
    glow.setAttribute('rotation', '0 0 180');
    glow.setAttribute('material', 'color:#8e43ff; shader:flat; opacity:0.10; transparent:true; side:double');
    root.appendChild(glow);

    const clampLeft = document.createElement('a-box');
    clampLeft.setAttribute('width', '0.020');
    clampLeft.setAttribute('height', String(layout.width + 0.020));
    clampLeft.setAttribute('depth', String(layout.clampDepth));
    clampLeft.setAttribute('position', `${-(layout.length / 2) + 0.012} 0 0`);
    clampLeft.setAttribute('color', '#0e0f13');
    root.appendChild(clampLeft);

    const clampRight = document.createElement('a-box');
    clampRight.setAttribute('width', '0.020');
    clampRight.setAttribute('height', String(layout.width + 0.020));
    clampRight.setAttribute('depth', String(layout.clampDepth));
    clampRight.setAttribute('position', `${(layout.length / 2) - 0.012} 0 0`);
    clampRight.setAttribute('color', '#0e0f13');
    root.appendChild(clampRight);

    ['-1', '1'].forEach(function (s, i) {
      const button = document.createElement('a-cylinder');
      button.setAttribute('radius', '0.0052');
      button.setAttribute('height', '0.028');
      button.setAttribute('rotation', '90 0 0');
      button.setAttribute('position', `${s * (layout.length * 0.10)} ${layout.width * 0.58} 0`);
      button.setAttribute('color', i === 0 ? '#6e42ff' : '#b02020');
      root.appendChild(button);
    });

    return root;
  }

  AFRAME.registerComponent('forearm-device', {
    schema: { side: { default: 'left' } },
    init: function () {
      if (this.data.side !== 'left') return;
      if (window.SVRWatchUI && window.SVRWatchUI.draw) window.SVRWatchUI.draw();
      const layout = DEVICE_LAYOUT[this.data.side] || DEVICE_LAYOUT.left;
      this.root = makeDeviceEntity(layout);
      this.el.appendChild(this.root);
      this.rootObj = this.root.object3D;
      this.cache = { wristObj: null, indexObj: null, pinkyObj: null };
      this.frames = 0;
    },
    tick: function () {
      if (!this.rootObj) return;
      const active = isQuestBrowser() && sceneInVR(this.el.sceneEl);
      this.rootObj.visible = active;
      if (!active) return;

      if ((!this.cache.wristObj || !this.cache.indexObj || !this.cache.pinkyObj) && this.frames % 20 === 0) {
        const rootObj = this.el.object3D;
        this.cache.wristObj = findNamedBone(rootObj, [/^wrist$/, /wrist/, /hand_wrist/, /b_l_wrist/, /leftwrist/]);
        this.cache.indexObj = findNamedBone(rootObj, [/index.*metacarpal/, /index.*proximal/, /index.*knuckle/, /b_l_index1/]);
        this.cache.pinkyObj = findNamedBone(rootObj, [/pinky.*metacarpal/, /little.*metacarpal/, /pinky.*proximal/, /b_l_pinky1/]);
      }
      this.frames += 1;

      const pose = computeWorldPose(this.el, this.cache, this.data.side);
      if (!pose) {
        this.rootObj.visible = false;
        return;
      }

      const parentObj = this.el.object3D;
      const localPos = parentObj.worldToLocal(pose.position.clone());
      parentObj.getWorldQuaternion(Q0);
      Q1.copy(Q0).invert().multiply(pose.quaternion);

      this.rootObj.visible = true;
      this.rootObj.position.copy(localPos);
      this.rootObj.quaternion.copy(Q1);
    }
  });
})();
