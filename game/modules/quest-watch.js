(function () {
  const THREE = AFRAME.THREE;

  const WATCH_LAYOUT = {
    title: 'SVR POKER',
    subtitle: 'QUEST WRIST UI',
    pot: '15,200',
    stack: '68,500',
    cards: ['A♠', 'K♠'],
    board: ['9♥', '7♠', '10♦', '6♣'],
    buttons: ['FOLD', 'CALL', 'RAISE', 'ALL IN']
  };

  const V0 = new THREE.Vector3();
  const V1 = new THREE.Vector3();
  const V2 = new THREE.Vector3();
  const V3 = new THREE.Vector3();
  const Q0 = new THREE.Quaternion();
  const Q1 = new THREE.Quaternion();
  const M0 = new THREE.Matrix4();
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  const LOCAL_SCALE = new THREE.Vector3(1, 1, 1);

  function isQuestBrowser() {
    return /OculusBrowser|Quest/i.test(navigator.userAgent || '');
  }

  function sceneInVR(scene) {
    return !!scene && scene.is && scene.is('vr-mode');
  }

  function setDiag() {}

  function getCanvas() {
    return document.getElementById('watchCanvas');
  }

  function drawWatchUI(state) {
    const canvas = getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#040406');
    bg.addColorStop(1, '#111923');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#8f44ff';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = '#d9b7ff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(state.title, 34, 60);

    ctx.fillStyle = '#8aa6c8';
    ctx.font = '24px Arial';
    ctx.fillText(state.subtitle, 36, 94);

    ctx.fillStyle = '#00ffa2';
    ctx.font = 'bold 60px Arial';
    ctx.fillText(state.stack, 360, 110);

    ctx.fillStyle = '#ffd84e';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('POT ' + state.pot, 36, 144);

    ctx.fillStyle = '#1a7a3a';
    ctx.fillRect(24, 162, w - 48, 90);
    ctx.strokeStyle = '#7be2a0';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 162, w - 48, 90);

    const cardW = 92;
    const cardH = 126;
    const cardY = 138;
    const startX = 88;
    state.board.forEach(function (card, i) {
      const x = startX + i * 118;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, cardY, cardW, cardH);
      ctx.strokeStyle = '#202020';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, cardY, cardW, cardH);
      ctx.fillStyle = /♥|♦/.test(card) ? '#d92d2d' : '#101010';
      ctx.font = 'bold 44px Arial';
      ctx.fillText(card, x + 14, cardY + 74);
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('HAND', 36, 322);

    state.cards.forEach(function (card, i) {
      const x = 120 + i * 112;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, 270, 92, 96);
      ctx.strokeStyle = '#202020';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, 270, 92, 96);
      ctx.fillStyle = /♥|♦/.test(card) ? '#d92d2d' : '#101010';
      ctx.font = 'bold 42px Arial';
      ctx.fillText(card, x + 16, 330);
    });

    const buttonColors = ['#3751ff', '#14b36b', '#f2a300', '#d92d2d'];
    state.buttons.forEach(function (label, i) {
      const x = 390 + i * 150;
      const y = 282;
      const width = i === 3 ? 152 : 132;
      ctx.fillStyle = buttonColors[i];
      ctx.fillRect(x, y, width, 62);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, 62);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(label, x + 18, y + 39);
    });
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

  function objectHasTrackedPose(obj, cameraObj) {
    if (!obj) return false;
    obj.getWorldPosition(V0);
    if (!isFinite(V0.x) || !isFinite(V0.y) || !isFinite(V0.z)) return false;
    if (V0.lengthSq() === 0) return false;
    if (V0.y < 0.25) return false;
    if (cameraObj) {
      cameraObj.getWorldPosition(V1);
      const d = V0.distanceTo(V1);
      if (d > 1.2 || d < 0.06) return false;
    }
    return true;
  }

  function buildBasisFromBones(wristObj, indexObj, pinkyObj, side) {
    if (!wristObj || !indexObj || !pinkyObj) return null;

    wristObj.getWorldPosition(V0);
    indexObj.getWorldPosition(V1);
    pinkyObj.getWorldPosition(V2);

    const acrossPalm = V1.clone().sub(V2);
    if (acrossPalm.lengthSq() < 1e-8) return null;
    acrossPalm.normalize();

    const wristToKnuckles = V1.clone().add(V2).multiplyScalar(0.5).sub(V0);
    if (wristToKnuckles.lengthSq() < 1e-8) return null;
    wristToKnuckles.normalize();

    const palmNormal = new THREE.Vector3().crossVectors(acrossPalm, wristToKnuckles).normalize();
    if (side === 'left') acrossPalm.multiplyScalar(-1);

    const xAxis = acrossPalm;
    const yAxis = wristToKnuckles.clone().multiplyScalar(-1);
    const zAxis = palmNormal;
    M0.makeBasis(xAxis, yAxis, zAxis);
    return new THREE.Quaternion().setFromRotationMatrix(M0);
  }

  function buildWatchWorldPose(el, cache, side) {
    const cameraObj = el.sceneEl && el.sceneEl.camera && el.sceneEl.camera.el && el.sceneEl.camera.el.object3D;
    const sideSign = side === 'left' ? 1 : -1;

    if (cache.wristObj && objectHasTrackedPose(cache.wristObj, cameraObj)) {
      cache.wristObj.getWorldPosition(V0);
      let wristQ = null;
      if (cache.indexObj && cache.pinkyObj && objectHasTrackedPose(cache.indexObj, cameraObj) && objectHasTrackedPose(cache.pinkyObj, cameraObj)) {
        wristQ = buildBasisFromBones(cache.wristObj, cache.indexObj, cache.pinkyObj, side);
      }
      if (!wristQ) {
        cache.wristObj.getWorldQuaternion(Q0);
        wristQ = Q0.clone();
      }

      const adjust = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.55, 0.10 * sideSign, 1.64 * sideSign, 'YXZ'));
      const worldQ = wristQ.multiply(adjust);
      const offset = new THREE.Vector3(0.040 * sideSign, -0.008, -0.045).applyQuaternion(worldQ);
      const worldP = V0.clone().add(offset);
      return { position: worldP, quaternion: worldQ, mode: 'wrist-bone' };
    }

    const wristPose = getJointPose(el, 'wrist');
    const indexPose = getJointPose(el, 'index-finger-metacarpal');
    const pinkyPose = getJointPose(el, 'pinky-finger-metacarpal');
    if (wristPose && indexPose && pinkyPose) {
      const wt = wristPose.transform;
      const it = indexPose.transform;
      const pt = pinkyPose.transform;

      const wrist = new THREE.Vector3(wt.position.x, wt.position.y, wt.position.z);
      const index = new THREE.Vector3(it.position.x, it.position.y, it.position.z);
      const pinky = new THREE.Vector3(pt.position.x, pt.position.y, pt.position.z);
      const acrossPalm = index.clone().sub(pinky).normalize().multiplyScalar(side === 'left' ? -1 : 1);
      const wristToKnuckles = index.clone().add(pinky).multiplyScalar(0.5).sub(wrist).normalize();
      const palmNormal = new THREE.Vector3().crossVectors(acrossPalm, wristToKnuckles).normalize();
      M0.makeBasis(acrossPalm, wristToKnuckles.clone().multiplyScalar(-1), palmNormal);
      const worldQ = new THREE.Quaternion().setFromRotationMatrix(M0);
      const offset = new THREE.Vector3(0.040 * sideSign, -0.008, -0.045).applyQuaternion(worldQ);
      return { position: wrist.add(offset), quaternion: worldQ, mode: 'xr-wrist' };
    }

    return null;
  }

  AFRAME.registerComponent('quest-hand-gate', {
    init: function () {
      const el = this.el;
      const scene = el.sceneEl;
      const sync = function () {
        el.object3D.visible = isQuestBrowser() && sceneInVR(scene);
      };
      scene.addEventListener('enter-vr', sync);
      scene.addEventListener('exit-vr', sync);
      setTimeout(sync, 0);
    }
  });

  AFRAME.registerComponent('forearm-watch', {
    schema: {
      side: { default: 'left' }
    },

    init: function () {
      if (this.data.side !== 'left') return;

      drawWatchUI(WATCH_LAYOUT);

      const root = document.createElement('a-entity');
      root.setAttribute('class', 'forearm-watch-root');
      root.setAttribute('visible', 'false');

      const shell = document.createElement('a-box');
      shell.setAttribute('width', '0.176');
      shell.setAttribute('height', '0.064');
      shell.setAttribute('depth', '0.012');
      shell.setAttribute('color', '#080808');
      shell.setAttribute('material', 'metalness:0.88; roughness:0.3');
      root.appendChild(shell);

      const glass = document.createElement('a-plane');
      glass.setAttribute('width', '0.158');
      glass.setAttribute('height', '0.051');
      glass.setAttribute('position', '0 0 0.007');
      glass.setAttribute('material', 'src:#watchCanvas; shader:flat; transparent:false; side:double');
      root.appendChild(glass);

      const leftClamp = document.createElement('a-box');
      leftClamp.setAttribute('width', '0.022');
      leftClamp.setAttribute('height', '0.086');
      leftClamp.setAttribute('depth', '0.018');
      leftClamp.setAttribute('position', '-0.098 0 0');
      leftClamp.setAttribute('color', '#111111');
      root.appendChild(leftClamp);

      const rightClamp = document.createElement('a-box');
      rightClamp.setAttribute('width', '0.022');
      rightClamp.setAttribute('height', '0.086');
      rightClamp.setAttribute('depth', '0.018');
      rightClamp.setAttribute('position', '0.098 0 0');
      rightClamp.setAttribute('color', '#111111');
      root.appendChild(rightClamp);

      const glow = document.createElement('a-plane');
      glow.setAttribute('width', '0.166');
      glow.setAttribute('height', '0.056');
      glow.setAttribute('position', '0 0 0.004');
      glow.setAttribute('material', 'color:#7f37ff; shader:flat; opacity:0.12; transparent:true; side:double');
      root.appendChild(glow);

      this.el.sceneEl.appendChild(root);
      this.root = root;
      this.rootObj = root.object3D;
      this.cache = { wristObj: null, indexObj: null, pinkyObj: null };
      this.frames = 0;
      this.lastMode = '';
    },

    tick: function () {
      if (!this.rootObj) return;
      const scene = this.el.sceneEl;
      const active = isQuestBrowser() && sceneInVR(scene);
      this.rootObj.visible = active;
      if (!active) return;

      if ((!this.cache.wristObj || !this.cache.indexObj || !this.cache.pinkyObj) && this.frames % 20 === 0) {
        const rootObj = this.el.object3D;
        this.cache.wristObj = findNamedBone(rootObj, [/^wrist$/, /wrist/, /hand_wrist/, /b_l_wrist/, /leftwrist/]);
        this.cache.indexObj = findNamedBone(rootObj, [/index.*metacarpal/, /index.*proximal/, /index.*knuckle/, /b_l_index1/]);
        this.cache.pinkyObj = findNamedBone(rootObj, [/pinky.*metacarpal/, /little.*metacarpal/, /pinky.*proximal/, /b_l_pinky1/]);
      }
      this.frames += 1;

      const pose = buildWatchWorldPose(this.el, this.cache, this.data.side);
      if (!pose) {
        this.rootObj.visible = false;
        this.lastMode = 'waiting';
        return;
      }

      if (this.rootObj.parent !== scene.object3D) {
        scene.object3D.add(this.rootObj);
      }
      this.rootObj.visible = true;
      this.rootObj.position.copy(pose.position);
      this.rootObj.quaternion.copy(pose.quaternion);
      this.rootObj.scale.copy(LOCAL_SCALE);
      this.lastMode = pose.mode;
    }
  });

  window.SVRWatchUI = {
    setState: function (nextState) {
      Object.assign(WATCH_LAYOUT, nextState || {});
      drawWatchUI(WATCH_LAYOUT);
    }
  };
})();
