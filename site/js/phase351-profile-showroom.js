import { account } from './phase345-demo-activity-persistence.js?v=phase351';

const BUILD = 'PHASE-351-PROFILE-3D-SHOWROOM-LOCK';
const canvas = document.getElementById('profileShowroomCanvas');
const stage = document.getElementById('profileShowroom');
let viewer = null;
let catalog = null;
let roomRoot = null;
let status = 'fallback-ready';
let lastError = null;
let lastSignature = '';
let attempts = 0;
let rotating = true;
let resizeObserver = null;

function timeout(promise, milliseconds, label) {
  let timer = 0;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), milliseconds); })
  ]).finally(() => clearTimeout(timer));
}

function ensureResizeObserver() {
  if ('ResizeObserver' in window) return;
  window.ResizeObserver = class ResizeObserverFallback {
    constructor(callback) { this.callback = callback; this.handler = () => callback([]); }
    observe() { window.addEventListener('resize', this.handler); setTimeout(this.handler, 0); }
    disconnect() { window.removeEventListener('resize', this.handler); }
    unobserve() {}
  };
}

function setStatus(next, message, retry = false) {
  status = next;
  const label = document.getElementById('showroomStatus');
  const retryButton = document.getElementById('showroomRetry');
  if (label) label.textContent = message;
  if (retryButton) retryButton.hidden = !retry;
  stage?.classList.toggle('is-ready', next === '3d-ready');
  stage?.classList.toggle('is-fallback', next !== '3d-ready');
  window.SVR_PHASE351_PROFILE_SHOWROOM_STATE = snapshot();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawFallback(profile = account.snapshot().profile || {}) {
  if (!canvas) return;
  const width = Math.max(320, Math.round(canvas.clientWidth || 960));
  const height = Math.max(360, Math.round(canvas.clientHeight || 560));
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#11172a');
  background.addColorStop(.48, '#050817');
  background.addColorStop(1, '#010207');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = 'rgba(127,252,255,.17)';
  context.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const x = width * (i / 11);
    context.beginPath();
    context.moveTo(width / 2, height * .48);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const y = height * (.52 + i * .06);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.shadowBlur = 28;
  context.shadowColor = '#7ffcff';
  context.strokeStyle = '#7ffcff';
  context.lineWidth = 3;
  roundedRect(context, width * .16, height * .09, width * .68, height * .28, 28);
  context.stroke();
  context.shadowBlur = 0;
  context.fillStyle = 'rgba(4,8,20,.82)';
  roundedRect(context, width * .165, height * .095, width * .67, height * .27, 26);
  context.fill();
  context.textAlign = 'center';
  context.fillStyle = '#ffffff';
  context.font = `900 ${Math.max(28, width * .052)}px system-ui`;
  context.fillText('SVR', width / 2, height * .235);
  context.fillStyle = '#ffd98a';
  context.font = `900 ${Math.max(12, width * .019)}px system-ui`;
  context.fillText('PLAYER SHOWROOM', width / 2, height * .29);

  const centerX = width / 2;
  const platformY = height * .87;
  const platformWidth = Math.min(width * .34, 330);
  context.fillStyle = 'rgba(6,12,25,.92)';
  context.beginPath();
  context.ellipse(centerX, platformY, platformWidth, 34, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#7ffcff';
  context.lineWidth = 3;
  context.shadowBlur = 18;
  context.shadowColor = '#7ffcff';
  context.stroke();
  context.shadowBlur = 0;

  const avatarHeight = Math.min(height * .53, 300);
  const baseY = platformY - 18;
  context.fillStyle = '#20283c';
  context.strokeStyle = '#b68cff';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, baseY - avatarHeight * .83, avatarHeight * .095, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#11172a';
  roundedRect(context, centerX - avatarHeight * .13, baseY - avatarHeight * .72, avatarHeight * .26, avatarHeight * .38, avatarHeight * .07);
  context.fill();
  context.stroke();
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(centerX - avatarHeight * .07, baseY - avatarHeight * .34);
  context.lineTo(centerX - avatarHeight * .09, baseY);
  context.moveTo(centerX + avatarHeight * .07, baseY - avatarHeight * .34);
  context.lineTo(centerX + avatarHeight * .09, baseY);
  context.moveTo(centerX - avatarHeight * .12, baseY - avatarHeight * .66);
  context.lineTo(centerX - avatarHeight * .23, baseY - avatarHeight * .39);
  context.moveTo(centerX + avatarHeight * .12, baseY - avatarHeight * .66);
  context.lineTo(centerX + avatarHeight * .23, baseY - avatarHeight * .39);
  context.stroke();

  context.fillStyle = 'rgba(0,0,0,.58)';
  roundedRect(context, 18, height - 58, Math.min(width - 36, 430), 38, 12);
  context.fill();
  context.textAlign = 'left';
  context.fillStyle = '#dffcff';
  context.font = '800 13px system-ui';
  context.fillText(`${profile.displayName || 'Player'} • showroom fallback ready`, 34, height - 34);
}

function logoTexture(THREE) {
  const source = document.createElement('canvas');
  source.width = 1024;
  source.height = 360;
  const context = source.getContext('2d');
  const glow = context.createLinearGradient(0, 0, source.width, 0);
  glow.addColorStop(0, '#7ffcff');
  glow.addColorStop(.5, '#ffffff');
  glow.addColorStop(1, '#b68cff');
  context.fillStyle = 'rgba(0,0,0,0)';
  context.fillRect(0, 0, source.width, source.height);
  context.textAlign = 'center';
  context.shadowBlur = 34;
  context.shadowColor = '#7ffcff';
  context.fillStyle = glow;
  context.font = '900 180px system-ui';
  context.fillText('SVR', source.width / 2, 190);
  context.shadowBlur = 16;
  context.shadowColor = '#ffd98a';
  context.fillStyle = '#ffd98a';
  context.font = '900 58px system-ui';
  context.fillText('PLAYER SHOWROOM', source.width / 2, 278);
  const texture = new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addShowroom(viewerInstance, THREE) {
  if (roomRoot) roomRoot.removeFromParent?.();
  roomRoot = new THREE.Group();
  roomRoot.name = 'PHASE351_PROFILE_3D_SHOWROOM_ROOT';
  viewerInstance.scene.add(roomRoot);

  viewerInstance.scene.background = new THREE.Color(0x02040b);
  viewerInstance.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  viewerInstance.renderer.toneMappingExposure = 1.16;
  viewerInstance.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
  viewerInstance.camera.position.set(0, 1.35, 4.75);
  viewerInstance.controls.target.set(0, .95, 0);
  viewerInstance.controls.minDistance = 2.25;
  viewerInstance.controls.maxDistance = 6.25;
  viewerInstance.controls.minPolarAngle = Math.PI * .18;
  viewerInstance.controls.maxPolarAngle = Math.PI * .66;
  viewerInstance.controls.enablePan = false;

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x090d19, roughness: .72, metalness: .22 });
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x141a2c, roughness: .42, metalness: .48 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x05070e, roughness: .38, metalness: .5 });
  const cyanMaterial = new THREE.MeshBasicMaterial({ color: 0x7ffcff, toneMapped: false });
  const purpleMaterial = new THREE.MeshBasicMaterial({ color: 0x8f5cff, toneMapped: false });
  const goldMaterial = new THREE.MeshBasicMaterial({ color: 0xffd98a, toneMapped: false });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), floorMaterial);
  floor.name = 'PHASE351_SHOWROOM_FLOOR';
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -.13, .35);
  roomRoot.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(6.8, 4.3, .16), wallMaterial);
  backWall.name = 'PHASE351_SHOWROOM_BACK_WALL';
  backWall.position.set(0, 1.95, -2.35);
  roomRoot.add(backWall);

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(.14, 4.3, 5.2), wallMaterial);
    wall.name = `PHASE351_SHOWROOM_SIDE_WALL_${side}`;
    wall.position.set(side * 3.35, 1.95, .15);
    roomRoot.add(wall);

    const pillar = new THREE.Mesh(new THREE.BoxGeometry(.22, 3.55, .28), panelMaterial);
    pillar.position.set(side * 2.45, 1.63, -2.18);
    roomRoot.add(pillar);

    const strip = new THREE.Mesh(new THREE.BoxGeometry(.035, 3.18, .04), side < 0 ? cyanMaterial : purpleMaterial);
    strip.position.set(side * 2.44, 1.65, -2.01);
    roomRoot.add(strip);
  }

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(6.8, .12, 5.2), panelMaterial);
  ceiling.position.set(0, 4.08, .15);
  roomRoot.add(ceiling);

  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.85, 1.0),
    new THREE.MeshBasicMaterial({ map: logoTexture(THREE), transparent: true, depthWrite: false, toneMapped: false })
  );
  logo.name = 'PHASE351_SHOWROOM_WALL_LOGO';
  logo.position.set(0, 2.65, -2.24);
  roomRoot.add(logo);

  const screenGeometry = new THREE.PlaneGeometry(1.15, .72);
  for (const side of [-1, 1]) {
    const screen = new THREE.Mesh(screenGeometry, new THREE.MeshStandardMaterial({ color: 0x071426, emissive: side < 0 ? 0x0d7380 : 0x35136a, emissiveIntensity: 1.1, roughness: .2, metalness: .35 }));
    screen.position.set(side * 1.9, 1.7, -2.22);
    roomRoot.add(screen);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.27, .84, .07), panelMaterial);
    frame.position.set(side * 1.9, 1.7, -2.29);
    roomRoot.add(frame);
  }

  const frontRail = new THREE.Mesh(new THREE.TorusGeometry(1.35, .018, 10, 96, Math.PI), goldMaterial);
  frontRail.rotation.set(Math.PI / 2, 0, 0);
  frontRail.position.set(0, .02, .2);
  roomRoot.add(frontRail);

  for (let i = -3; i <= 3; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(.018, .006, 5.4), i % 2 ? purpleMaterial : cyanMaterial);
    line.position.set(i * .72, -.065, .35);
    line.material = line.material.clone();
    line.material.transparent = true;
    line.material.opacity = .18;
    roomRoot.add(line);
  }

  const key = new THREE.SpotLight(0xffffff, 7.5, 10, Math.PI * .24, .55, 1.2);
  key.position.set(2.1, 3.7, 2.8);
  key.target.position.set(0, 1, 0);
  roomRoot.add(key, key.target);
  const fill = new THREE.PointLight(0x7ffcff, 5.2, 8);
  fill.position.set(-2.4, 1.9, 1.2);
  roomRoot.add(fill);
  const rim = new THREE.PointLight(0x8f5cff, 5.8, 8);
  rim.position.set(2.5, 2.3, -1.25);
  roomRoot.add(rim);
  const gold = new THREE.PointLight(0xffd98a, 3.5, 6);
  gold.position.set(0, .65, 2.0);
  roomRoot.add(gold);

  viewerInstance.resize?.();
}

function resolveOutfit(profile) {
  const saved = profile?.equippedOutfit;
  return saved && Object.keys(saved).length ? saved : catalog?.defaultOutfit || {};
}

async function ensure(force = false) {
  if (!canvas) return null;
  attempts += 1;
  lastError = null;
  drawFallback(account.snapshot().profile || {});
  setStatus('loading-account', 'Preparing your profile showroom…');
  try {
    ensureResizeObserver();
    await timeout(account.bootstrap(), 6500, 'ACCOUNT');
    const profile = account.snapshot().profile;
    if (!profile) {
      setStatus('profile-required', 'Create or sign in to a profile to enter the showroom.', false);
      return null;
    }

    if (!catalog || force) {
      const response = await timeout(fetch('/site/data/avatar-catalog.json?v=phase351', { cache: 'no-store' }), 6500, 'CATALOG');
      if (!response.ok) throw new Error(`AVATAR_CATALOG_${response.status}`);
      catalog = await response.json();
    }

    setStatus('loading-3d', 'Opening the 3D showroom…');
    const module = await timeout(import('./phase346-avatar-viewer.js?v=phase351'), 9000, 'SHOWROOM_MODULE');
    const { SVRAvatarViewer } = module;
    const THREE = await timeout(import('three'), 9000, 'THREE_MODULE');

    if (force && viewer) {
      viewer.dispose?.();
      viewer = null;
      roomRoot = null;
    }
    if (!viewer) {
      viewer = new SVRAvatarViewer({ canvas, catalog, autoRotate: true, compact: false });
      addShowroom(viewer, THREE);
    }

    const outfit = resolveOutfit(profile);
    const model = catalog.avatarModels.find((entry) => entry.id === outfit.modelId) || catalog.avatarModels[0];
    const modelUrl = profile.avatarUrl || new URL(model.assetUrl, location.origin).href;
    const signature = JSON.stringify({ modelUrl, outfit });
    if (force || signature !== lastSignature) {
      lastSignature = signature;
      setStatus('loading-avatar', `Loading ${model.label || 'player avatar'}…`);
      await timeout(viewer.loadModel(modelUrl, Number(model.targetHeightMeters || 1.72)), 14000, 'AVATAR_MODEL');
      viewer.applyOutfit(outfit);
    }

    rotating = true;
    viewer.autoRotate = true;
    const rotateButton = document.getElementById('showroomRotate');
    if (rotateButton) rotateButton.textContent = 'Pause Rotation';
    const name = document.getElementById('showroomAvatarName');
    const outfitLabel = document.getElementById('showroomOutfit');
    if (name) name.textContent = profile.displayName || 'Player';
    if (outfitLabel) outfitLabel.textContent = [model.label, outfit.palette, outfit.top].filter(Boolean).join(' • ');
    setStatus('3d-ready', viewer.fallbackUsed ? '3D showroom ready with fallback avatar.' : '3D showroom ready. Drag to rotate and scroll to zoom.');
    window.dispatchEvent(new CustomEvent('svr:profile-showroom-ready', { detail: snapshot() }));
    return viewer;
  } catch (error) {
    lastError = String(error?.message || error);
    drawFallback(account.snapshot().profile || {});
    setStatus('fallback-ready', 'Showroom fallback ready. Retry 3D when the connection is stable.', true);
    window.SVR_PHASE351_PROFILE_SHOWROOM_ERROR = lastError;
    return null;
  }
}

function snapshot() {
  return {
    build: BUILD,
    active: Boolean(canvas),
    status,
    attempts,
    viewerReady: Boolean(viewer),
    modelLoaded: Boolean(viewer?.modelLoaded),
    fallbackUsed: Boolean(viewer?.fallbackUsed || status !== '3d-ready'),
    roomReady: Boolean(roomRoot),
    roomName: roomRoot?.name || null,
    rotating,
    lastError,
    profile: Boolean(account.snapshot().profile),
    viewer: viewer?.audit?.() || null,
    checkedAt: new Date().toISOString()
  };
}

async function qa() {
  await ensure();
  const result = snapshot();
  result.pass = Boolean(result.active && result.profile && (result.roomReady || result.fallbackUsed));
  window.SVR_PHASE351_PROFILE_SHOWROOM_QA_STATE = result;
  return result;
}

function bindControls() {
  document.getElementById('showroomRotate')?.addEventListener('click', () => {
    rotating = !rotating;
    if (viewer) viewer.autoRotate = rotating;
    document.getElementById('showroomRotate').textContent = rotating ? 'Pause Rotation' : 'Resume Rotation';
  });
  document.getElementById('showroomReset')?.addEventListener('click', () => viewer?.resetView?.());
  document.getElementById('showroomRetry')?.addEventListener('click', () => ensure(true));
  document.getElementById('showroomFullscreen')?.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await stage?.requestFullscreen?.();
      else await document.exitFullscreen?.();
    } catch (error) {
      lastError = String(error?.message || error);
    }
  });
}

if (canvas) {
  drawFallback();
  bindControls();
  resizeObserver = new (window.ResizeObserver || class {
    constructor(callback) { this.callback = callback; }
    observe() { window.addEventListener('resize', this.callback); }
  })(() => {
    if (viewer) viewer.resize?.();
    else drawFallback(account.snapshot().profile || {});
  });
  resizeObserver.observe(stage || canvas);
  ensure().catch(() => undefined);
  window.addEventListener('svr:account-change', () => ensure().catch(() => undefined));
  window.addEventListener('svr:avatar-outfit-preview', () => ensure().catch(() => undefined));
}

window.SVR_PHASE351_PROFILE_SHOWROOM_QA = qa;
window.SVR_PHASE351_PROFILE_SHOWROOM_RETRY = () => ensure(true);
window.SVR_PHASE351_PROFILE_SHOWROOM_RESET = () => viewer?.resetView?.();
window.SVR_PHASE351_PROFILE_SHOWROOM_STATE = snapshot();

window.SVR_PHASE350_PROFILE_AVATAR_QA = qa;
window.SVR_PHASE350_PROFILE_AVATAR_RETRY = () => ensure(true);
window.SVR_PHASE350_PROFILE_AVATAR_RESET = () => viewer?.resetView?.();
