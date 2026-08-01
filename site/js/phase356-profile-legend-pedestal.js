import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const BUILD = 'PHASE-356-PROFILE-LEGEND-LIVE-PEDESTAL-LOCK';
const stage = document.getElementById('profileShowroom');
const oldCanvas = document.getElementById('profileShowroomCanvas');

if (!stage || document.getElementById('phase356LegendCanvas')) {
  window.SVR_PHASE356_PROFILE_LEGEND_STATE = { build: BUILD, active: false, reason: 'stage-missing-or-already-mounted' };
} else {
  const style = document.createElement('style');
  style.id = 'phase356-profile-legend-style';
  style.textContent = `
    #profileShowroom{position:relative!important;isolation:isolate!important;min-height:520px!important;background:radial-gradient(circle at 50% 38%,rgba(73,34,115,.36),rgba(2,4,11,.98) 70%)!important;overflow:hidden!important}
    #phase356LegendCanvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:block;touch-action:none}
    #profileShowroom .showroom-overlay,#profileShowroom .showroom-hint{position:absolute;z-index:4}
    #profileShowroom .showroom-overlay{inset:0;pointer-events:none}
    #profileShowroom .showroom-controls{pointer-events:auto}
    #profileShowroom .showroom-hint{left:50%;bottom:8px;transform:translateX(-50%);width:min(92%,620px);text-align:center}
    .phase356-legend-plaque{position:absolute;z-index:3;left:50%;top:66%;transform:translate(-50%,-50%);pointer-events:none;text-align:center;border:1px solid rgba(255,217,138,.72);border-radius:14px;background:rgba(3,5,13,.78);padding:8px 18px;box-shadow:0 0 30px rgba(127,252,255,.16);backdrop-filter:blur(8px)}
    .phase356-legend-plaque strong{display:block;color:#fff;font:900 clamp(13px,2vw,18px) Orbitron,system-ui;letter-spacing:.12em}.phase356-legend-plaque span{color:#ffd98a;font:800 11px Rajdhani,system-ui;letter-spacing:.15em}
    @media(max-width:600px){#profileShowroom{min-height:580px!important}.phase356-legend-plaque{top:61%;padding:7px 13px}.phase356-legend-plaque strong{font-size:12px}.phase356-legend-plaque span{font-size:9px}}
  `;
  document.head.appendChild(style);

  const canvas = document.createElement('canvas');
  canvas.id = 'phase356LegendCanvas';
  canvas.setAttribute('aria-label', 'Rotating SVR legend avatar on a live pedestal');
  stage.prepend(canvas);

  const plaque = document.createElement('div');
  plaque.className = 'phase356-legend-plaque';
  plaque.innerHTML = '<strong>SVR LEGEND</strong><span>FOUNDING PLAYER DISPLAY</span>';
  stage.appendChild(plaque);

  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches === true;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03050d, 0.055);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 40);
  camera.position.set(0, 1.6, 4.8);

  const displayRoot = new THREE.Group();
  displayRoot.name = 'PHASE356_PROFILE_LEGEND_DISPLAY_ROOT';
  scene.add(displayRoot);
  const avatarRoot = new THREE.Group();
  avatarRoot.name = 'PHASE356_PROFILE_LEGEND_AVATAR_ROOT';
  displayRoot.add(avatarRoot);

  scene.add(new THREE.HemisphereLight(0xd7fbff, 0x14051f, 1.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(2.8, 4.4, 3.2);
  scene.add(key);
  const cyan = new THREE.PointLight(0x7ffcff, 4.4, 9);
  cyan.position.set(-2.5, 1.8, 1.3);
  scene.add(cyan);
  const purple = new THREE.PointLight(0x9b5cff, 5.1, 8);
  purple.position.set(2.5, 2.4, -1.3);
  scene.add(purple);
  const gold = new THREE.PointLight(0xffd98a, 3.0, 6);
  gold.position.set(0, 0.55, 2.1);
  scene.add(gold);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.8, 64),
    new THREE.MeshStandardMaterial({ color: 0x03050b, roughness: 0.58, metalness: 0.38 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.28;
  scene.add(floor);

  const pedestal = new THREE.Group();
  pedestal.name = 'PHASE356_LEGEND_PEDESTAL';
  displayRoot.add(pedestal);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.34, 0.38, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b0f1b, roughness: 0.33, metalness: 0.72 })
  );
  base.position.y = -0.06;
  pedestal.add(base);
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.08, 0.12, 64),
    new THREE.MeshStandardMaterial({ color: 0x161c2d, roughness: 0.22, metalness: 0.82, emissive: 0x101d35, emissiveIntensity: 0.55 })
  );
  top.position.y = 0.19;
  pedestal.add(top);
  const goldRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.13, 0.032, 12, 96),
    new THREE.MeshBasicMaterial({ color: 0xffd98a, toneMapped: false })
  );
  goldRing.rotation.x = Math.PI / 2;
  goldRing.position.y = 0.25;
  pedestal.add(goldRing);
  const scanRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.38, 0.018, 10, 96),
    new THREE.MeshBasicMaterial({ color: 0x7ffcff, transparent: true, opacity: 0.66, toneMapped: false })
  );
  scanRing.rotation.x = Math.PI / 2;
  scanRing.position.y = 0.28;
  pedestal.add(scanRing);

  const backdrop = new THREE.Mesh(
    new THREE.RingGeometry(1.75, 1.79, 96),
    new THREE.MeshBasicMaterial({ color: 0x8f5cff, transparent: true, opacity: 0.42, side: THREE.DoubleSide, toneMapped: false })
  );
  backdrop.position.set(0, 1.5, -0.75);
  scene.add(backdrop);

  function proceduralLegend() {
    const group = new THREE.Group();
    group.name = 'PHASE356_PROCEDURAL_LEGEND_FALLBACK';
    const skin = new THREE.MeshStandardMaterial({ color: 0xc7a482, roughness: 0.7 });
    const suit = new THREE.MeshStandardMaterial({ color: 0x10182b, roughness: 0.43, metalness: 0.15 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x7ffcff, emissive: 0x164b55, emissiveIntensity: 0.9, roughness: 0.35 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16), skin);
    head.position.y = 1.73;
    group.add(head);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.31, 0.72, 8, 16), suit);
    body.position.y = 1.16;
    group.add(body);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 8, 32, Math.PI), accent);
    collar.rotation.set(Math.PI / 2, 0, Math.PI);
    collar.position.y = 1.5;
    group.add(collar);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.58, 6, 12), suit);
      arm.position.set(side * 0.39, 1.18, 0);
      arm.rotation.z = side * 0.12;
      group.add(arm);
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.72, 6, 12), suit);
      leg.position.set(side * 0.16, 0.47, 0);
      group.add(leg);
    }
    avatarRoot.add(group);
    return group;
  }

  function normalizeModel(model) {
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        material.roughness = Math.max(0.38, Number(material.roughness ?? 0.55));
        material.metalness = Math.min(0.25, Number(material.metalness ?? 0.08));
      });
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = 1.92 / Math.max(0.01, size.y);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -box.min.y * scale + 0.26, -center.z * scale);
    avatarRoot.add(model);
    return model;
  }

  let avatar = null;
  let loadError = null;
  let rotating = true;
  let dragging = false;
  let previousX = 0;
  let targetRotation = 0;
  let renderedFrames = 0;
  let lastRender = 0;

  function status(text, mode = 'LEGEND LIVE') {
    const label = document.getElementById('showroomStatus');
    const name = document.getElementById('showroomAvatarName');
    const outfit = document.getElementById('showroomOutfit');
    const pill = document.getElementById('modePill');
    if (label) label.textContent = text;
    if (name) name.textContent = 'SVR Legend — Eric';
    if (outfit) outfit.textContent = 'Founding Legend • Gold Pedestal • Temporary Default Avatar';
    if (pill) pill.textContent = mode;
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(440, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  async function loadLegend() {
    status('Loading the temporary SVR legend avatar…', 'LOADING LEGEND');
    try {
      const model = await new Promise((resolve, reject) => {
        new FBXLoader().load('/game/assets/models/eric/eric.fbx', resolve, undefined, reject);
      });
      avatar = normalizeModel(model);
      status('Legend avatar is live. Drag to rotate or use the pedestal control.');
    } catch (error) {
      loadError = String(error?.message || error);
      avatar = proceduralLegend();
      status('Legend pedestal is live with the lightweight backup avatar.', 'LEGEND BACKUP');
    }
    stage.classList.add('is-ready');
    stage.classList.remove('is-fallback');
    if (oldCanvas) oldCanvas.style.visibility = 'hidden';
    window.dispatchEvent(new CustomEvent('svr:phase356-profile-legend-ready', { detail: snapshot() }));
  }

  function snapshot() {
    return {
      build: BUILD,
      active: true,
      avatarLoaded: Boolean(avatar),
      fallbackUsed: avatar?.name === 'PHASE356_PROCEDURAL_LEGEND_FALLBACK',
      pedestal: pedestal.name,
      rotating,
      renderedFrames,
      loadError,
      pixelRatio: renderer.getPixelRatio(),
      checkedAt: new Date().toISOString()
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    previousX = event.clientX;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    targetRotation += (event.clientX - previousX) * 0.008;
    previousX = event.clientX;
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  document.getElementById('showroomRotate')?.addEventListener('click', () => {
    rotating = !rotating;
    const button = document.getElementById('showroomRotate');
    if (button) button.textContent = rotating ? 'Pause Rotation' : 'Resume Rotation';
  }, { capture: true });
  document.getElementById('showroomReset')?.addEventListener('click', () => {
    targetRotation = 0;
    displayRoot.rotation.y = 0;
    camera.position.set(0, 1.6, 4.8);
    camera.lookAt(0, 1.05, 0);
  }, { capture: true });

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();
  camera.lookAt(0, 1.05, 0);
  loadLegend();

  renderer.setAnimationLoop((time) => {
    if (document.hidden || time - lastRender < (coarse ? 34 : 20)) return;
    lastRender = time;
    if (rotating && !dragging && !reduced) targetRotation += 0.0027;
    displayRoot.rotation.y += (targetRotation - displayRoot.rotation.y) * 0.075;
    avatarRoot.position.y = reduced ? 0 : Math.sin(time * 0.00115) * 0.018;
    scanRing.rotation.z = time * -0.00024;
    backdrop.rotation.z = time * 0.00004;
    renderer.render(scene, camera);
    renderedFrames += 1;
    if (renderedFrames % 120 === 0) window.SVR_PHASE356_PROFILE_LEGEND_STATE = snapshot();
  });

  window.SVR_PHASE356_PROFILE_LEGEND_QA = () => {
    const result = snapshot();
    result.pass = Boolean(result.avatarLoaded && result.pedestal && result.pixelRatio <= 1.21);
    return result;
  };
  window.SVR_PHASE356_PROFILE_LEGEND_STATE = snapshot();
}
