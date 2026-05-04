(function () {
  const THREE = AFRAME.THREE;
  const V0 = new THREE.Vector3();
  const V1 = new THREE.Vector3();
  const V2 = new THREE.Vector3();
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
    return (scene && scene.frame) ||
      (scene && scene.renderer && scene.renderer.xr && scene.renderer.xr.getFrame && scene.renderer.xr.getFrame()) || null;
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
        if (patterns[i].test(name)) { found = obj; break; }
      }
    });
    return found;
  }

  function getBasisPose(wrist, index, pinky, cameraObj, side) {
    const V3 = new THREE.Vector3();
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

  function computeVRPose(el, cache, side) {
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

  // ── Build the physical watch device ─────────────────────────────────────
  function makeDeviceEntity(layout) {
    const root = document.createElement('a-entity');
    root.setAttribute('class', 'svr-forearm-device');

    const body = document.createElement('a-box');
    body.setAttribute('width', String(layout.length));
    body.setAttribute('height', String(layout.width));
    body.setAttribute('depth', String(layout.depth));
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

  // ── Desktop/browser floating watch panel ──────────────────────────────────
  // Always visible in non-VR mode — floats in front of the camera
  function createDesktopWatch(scene) {
    const watchEl = document.createElement('a-entity');
    watchEl.setAttribute('id', 'desktopWatch');

    const panel = document.createElement('a-plane');
    panel.setAttribute('width', '1.28');
    panel.setAttribute('height', '0.512');
    panel.setAttribute('material', 'src:#watchCanvas; shader:flat; transparent:false; side:double');
    watchEl.appendChild(panel);

    // Frame border
    const frame = document.createElement('a-box');
    frame.setAttribute('width', '1.32');
    frame.setAttribute('height', '0.55');
    frame.setAttribute('depth', '0.012');
    frame.setAttribute('position', '0 0 -0.007');
    frame.setAttribute('color', '#08090d');
    frame.setAttribute('material', 'metalness:0.9; roughness:0.2');
    watchEl.appendChild(frame);

    // Purple glow overlay
    const glow = document.createElement('a-plane');
    glow.setAttribute('width', '1.32');
    glow.setAttribute('height', '0.55');
    glow.setAttribute('position', '0 0 0.002');
    glow.setAttribute('material', 'color:#7f2aff; shader:flat; opacity:0.07; transparent:true; side:double');
    watchEl.appendChild(glow);

    // Corner buttons
    const btns = [
      { pos: '-0.68 0.29 0.008', color: '#6e42ff', label: '●' },
      { pos:  '0.68 0.29 0.008', color: '#b02020', label: '●' }
    ];
    btns.forEach(b => {
      const btn = document.createElement('a-sphere');
      btn.setAttribute('radius', '0.022');
      btn.setAttribute('position', b.pos);
      btn.setAttribute('color', b.color);
      btn.setAttribute('material', 'emissive:' + b.color + '; emissiveIntensity:0.6; metalness:0.8');
      watchEl.appendChild(btn);
    });

    // Label
    const labelEl = document.createElement('a-text');
    labelEl.setAttribute('value', '[ TELEPORT WATCH ]');
    labelEl.setAttribute('align', 'center');
    labelEl.setAttribute('color', '#9b6eff');
    labelEl.setAttribute('width', '1.2');
    labelEl.setAttribute('position', '0 -0.31 0.01');
    labelEl.setAttribute('font', 'monoid');
    watchEl.appendChild(labelEl);

    watchEl.setAttribute('position', '0 -0.28 -1.2');
    watchEl.setAttribute('rotation', '-12 0 0');
    watchEl.setAttribute('visible', 'false');

    // Append to camera rig so it moves with the player
    const rig = document.getElementById('rig');
    if (rig) {
      rig.appendChild(watchEl);
    } else {
      scene.appendChild(watchEl);
    }
    return watchEl;
  }

  // ── Teleport destination UI ────────────────────────────────────────────────
  function makeDestinationTexture(destinations, selected) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 512, 256);
    bg.addColorStop(0, '#03040a');
    bg.addColorStop(1, '#0d1420');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#9b5bff';
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 502, 246);

    ctx.fillStyle = '#f4d5ff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⌚ TELEPORT WATCH', 256, 38);

    destinations.forEach((dest, i) => {
      const x = 34 + i * 120;
      const y = 62;
      const isSelected = i === selected;
      ctx.fillStyle = isSelected ? '#6e42ff' : 'rgba(110,66,255,0.22)';
      ctx.beginPath();
      ctx.roundRect(x, y, 100, 60, 10);
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ffffff' : '#7b52cc';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = isSelected ? 'bold 14px Arial' : '13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(dest.icon, x + 50, y + 24);
      ctx.fillText(dest.name, x + 50, y + 50);
    });

    // Status bar
    ctx.fillStyle = 'rgba(0,255,160,0.1)';
    ctx.fillRect(10, 138, 492, 48);
    ctx.strokeStyle = 'rgba(0,255,160,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 138, 492, 48);
    ctx.fillStyle = '#00ffa0';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('▶ SELECT DESTINATION  |  RAISE WRIST TO ACTIVATE', 22, 168);

    // Quick stats
    ctx.fillStyle = '#8ab4ff';
    ctx.font = '16px Arial';
    ctx.fillText('POT: $15,200', 22, 216);
    ctx.fillStyle = '#00f0a2';
    ctx.fillText('STACK: $68,500', 180, 216);
    ctx.fillStyle = '#ffd75a';
    ctx.fillText('BLINDS: 200/400', 360, 216);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  AFRAME.registerComponent('forearm-device', {
    schema: { side: { default: 'left' } },

    init: function () {
      if (this.data.side !== 'left') return;

      // Draw the watch UI canvas immediately
      if (window.SVRWatchUI && window.SVRWatchUI.draw) window.SVRWatchUI.draw();

      const layout = DEVICE_LAYOUT[this.data.side] || DEVICE_LAYOUT.left;

      // ── VR wrist device ──────────────────────────────────────────────────
      this.root = makeDeviceEntity(layout);
      this.root.setAttribute('visible', 'false');
      this.el.appendChild(this.root);
      this.rootObj = this.root.object3D;
      this.cache = { wristObj: null, indexObj: null, pinkyObj: null };
      this.frames = 0;

      // ── Desktop floating watch panel ─────────────────────────────────────
      this.desktopWatch = createDesktopWatch(this.el.sceneEl);

      // ── Teleport destinations ────────────────────────────────────────────
      this.destinations = [
        { name: 'TABLE',   icon: '🃏', pos: [0, 1.62, 6.15]   },
        { name: 'LOBBY',   icon: '🏛',  pos: [0, 1.62, 0]      },
        { name: 'STORE',   icon: '🛒',  pos: [-8, 1.62, -3]    },
        { name: 'ROOFTOP', icon: '🌙',  pos: [0, 8.0,  -6]     }
      ];
      this.selectedDest = 0;
      this.watchVisible = true;

      // ── Key binding for desktop: T = toggle watch, [/] = cycle destinations ──
      this._onKey = this._onKey.bind(this);
      window.addEventListener('keydown', this._onKey);

      // Draw the teleport UI
      this._refreshDesktopWatch();

      // Show the desktop watch after scene loads
      const self = this;
      this.el.sceneEl.addEventListener('loaded', function () {
        self._updateDesktopVisibility();
        // Redraw watch after logo loads
        const logo = document.getElementById('logoMain');
        if (logo) logo.addEventListener('load', function () {
          if (window.SVRWatchUI) window.SVRWatchUI.draw();
        }, { once: true });
      });

      // VR enter/exit handling
      this.el.sceneEl.addEventListener('enter-vr', this._updateDesktopVisibility.bind(this));
      this.el.sceneEl.addEventListener('exit-vr', this._updateDesktopVisibility.bind(this));
    },

    remove: function () {
      window.removeEventListener('keydown', this._onKey);
    },

    _onKey: function (e) {
      const key = e.key.toLowerCase();
      if (key === 't') {
        this.watchVisible = !this.watchVisible;
        this._updateDesktopVisibility();
      } else if (key === '[' || key === 'arrowleft') {
        this.selectedDest = (this.selectedDest + this.destinations.length - 1) % this.destinations.length;
        this._refreshDesktopWatch();
      } else if (key === ']' || key === 'arrowright') {
        this.selectedDest = (this.selectedDest + 1) % this.destinations.length;
        this._refreshDesktopWatch();
      } else if (key === 'enter' || key === 'f') {
        this._teleport();
      }
    },

    _teleport: function () {
      const dest = this.destinations[this.selectedDest];
      const rig = document.getElementById('rig');
      if (rig && dest) {
        rig.setAttribute('position', `${dest.pos[0]} ${dest.pos[1]} ${dest.pos[2]}`);
        // Flash the watch
        const self = this;
        if (this.desktopWatch) {
          const dw = this.desktopWatch;
          dw.object3D.visible = false;
          setTimeout(function () {
            dw.object3D.visible = self.watchVisible && !sceneInVR(self.el.sceneEl);
          }, 300);
        }
      }
    },

    _refreshDesktopWatch: function () {
      if (!this.desktopWatch) return;
      const THREE = AFRAME.THREE;
      const tex = makeDestinationTexture(this.destinations, this.selectedDest);
      const panel = this.desktopWatch.querySelector('a-plane');
      if (panel) {
        panel.setAttribute('material', 'src:#watchCanvas; shader:flat; transparent:false; side:double');
      }
      // Also update the watch canvas with teleport info
      const canvas = document.getElementById('watchCanvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        // Draw small teleport overlay in corner of watch HUD
        if (window.SVRWatchUI) window.SVRWatchUI.draw();
        ctx.save();
        ctx.fillStyle = 'rgba(110,66,255,0.18)';
        ctx.beginPath();
        ctx.roundRect(810, 240, 430, 58, 10);
        ctx.fill();
        ctx.strokeStyle = '#9b5bff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#c8a8ff';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('⌚ WARP: ' + this.destinations[this.selectedDest].icon + ' ' + this.destinations[this.selectedDest].name, 828, 276);
        ctx.fillStyle = '#7fd2ff';
        ctx.font = '14px Arial';
        ctx.fillText('[T] TOGGLE  [←/→] CYCLE  [F/ENTER] JUMP', 828, 296);
        ctx.restore();
        // Force texture update
        const glassEl = document.querySelector('.svr-forearm-device a-plane');
        if (glassEl && glassEl.components && glassEl.components.material) {
          const mat = glassEl.components.material.material;
          if (mat && mat.map) mat.map.needsUpdate = true;
        }
      }
    },

    _updateDesktopVisibility: function () {
      if (!this.desktopWatch) return;
      const inVR = sceneInVR(this.el.sceneEl);
      this.desktopWatch.setAttribute('visible', (!inVR && this.watchVisible) ? 'true' : 'false');
    },

    tick: function () {
      if (!this.rootObj) return;
      const inVR = sceneInVR(this.el.sceneEl);
      const onQuest = isQuestBrowser();

      // Desktop watch: always show unless VR mode
      if (this.desktopWatch) {
        const showDesktop = !inVR && this.watchVisible;
        if (this.desktopWatch.object3D) {
          this.desktopWatch.object3D.visible = showDesktop;
        }
      }

      // VR wrist device: only Quest in VR
      const vrActive = onQuest && inVR;
      this.rootObj.visible = vrActive;
      if (!vrActive) return;

      // Bone tracking
      if ((!this.cache.wristObj || !this.cache.indexObj || !this.cache.pinkyObj) && this.frames % 20 === 0) {
        const rootObj = this.el.object3D;
        this.cache.wristObj = findNamedBone(rootObj, [/^wrist$/, /wrist/, /hand_wrist/, /b_l_wrist/, /leftwrist/]);
        this.cache.indexObj = findNamedBone(rootObj, [/index.*metacarpal/, /index.*proximal/, /index.*knuckle/, /b_l_index1/]);
        this.cache.pinkyObj = findNamedBone(rootObj, [/pinky.*metacarpal/, /little.*metacarpal/, /pinky.*proximal/, /b_l_pinky1/]);
      }
      this.frames += 1;

      const pose = computeVRPose(this.el, this.cache, this.data.side);
      if (!pose) { this.rootObj.visible = false; return; }

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
