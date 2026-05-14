import * as THREE from "three";

const BUILD = "PHASE-73-DEPLOY-UNSTUCK-DIRECT-GAME";
const STORE_URL = "https://svrpoker.com/site/store.html";

function canvasTexture(w, h, paint){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  paint(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeSignTexture({ title, subtitle, lines = [], accent = '#7fffd4' }){
  return canvasTexture(1024, 512, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#040713');
    g.addColorStop(0.55, '#160a2a');
    g.addColorStop(1, '#030407');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    roundRect(ctx, 24, 24, w - 48, h - 48, 34);
    ctx.stroke();
    ctx.fillStyle = 'rgba(127,255,212,0.08)';
    for (let i = 0; i < 22; i++){
      ctx.fillRect(70 + i * 42, 76 + ((i * 43) % 310), 2, 130);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px system-ui, Arial';
    ctx.fillText(title, w / 2, 104);
    ctx.fillStyle = accent;
    ctx.font = 'bold 34px system-ui, Arial';
    ctx.fillText(subtitle, w / 2, 158);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#eafff4';
    ctx.font = '28px system-ui, Arial';
    let y = 228;
    for (const line of lines){
      ctx.fillText(`• ${line}`, 108, y);
      y += 45;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    ctx.font = '20px system-ui, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(BUILD, w / 2, h - 60);
  });
}

function makePanel({ title, subtitle, lines, accent, width = 3.2, height = 1.65 }){
  const tex = makeSignTexture({ title, subtitle, lines, accent });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false })
  );
  mesh.userData.phase71 = true;
  return mesh;
}

function facePoint(obj, point){
  obj.lookAt(point.x, point.y, point.z);
}

function addGlowFrame(parent, w, h, color = 0x72ffd2){
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, 0.025), mat);
  const bottom = top.clone();
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.025, h, 0.025), mat);
  const right = left.clone();
  top.position.y = h / 2; bottom.position.y = -h / 2; left.position.x = -w / 2; right.position.x = w / 2;
  parent.add(top, bottom, left, right);
}

function addPortalRing(parent, color = 0x72ffd2){
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.025, 12, 96),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86, blending: THREE.AdditiveBlending })
  );
  ring.rotation.x = Math.PI / 2;
  ring.userData.phase71Spin = true;
  parent.add(ring);
  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.56, 64),
    new THREE.MeshBasicMaterial({ color: 0x11291f, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  core.rotation.x = Math.PI / 2;
  parent.add(core);
  return ring;
}

function createStoreScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_STORE_SCENE_PHASE71';
  group.position.set(31, 0, 10);
  scene.add(group);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.78, metalness: 0.12, emissive: 0x020408, emissiveIntensity: 0.04 })
  );
  floor.position.y = -0.04;
  group.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x080b15, roughness: 0.72, metalness: 0.05, emissive: 0x120020, emissiveIntensity: 0.08 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, 0.14), wallMat);
  back.position.set(0, 1.6, -4);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 8), wallMat);
  left.position.set(-5, 1.6, 0);
  const right = left.clone();
  right.position.x = 5;
  group.add(back, left, right);

  const sign = makePanel({
    title: 'SVR VR STORE',
    subtitle: 'PRIVATE STORE SCENE',
    accent: '#72ffd2',
    lines: ['avatar items', 'gloves and watches', 'table skins later', 'web store portal ready']
  });
  sign.position.set(0, 2.0, -3.91);
  group.add(sign);

  const web = makePanel({
    title: 'OPEN WEB STORE',
    subtitle: 'SVRPOKER.COM/SITE/STORE.HTML',
    accent: '#ff73d6',
    lines: ['desktop: use Open Store button', 'VR: use watch/store route', 'store data remains website-side']
  });
  web.position.set(0, 1.34, -1.7);
  web.scale.setScalar(0.88);
  group.add(web);

  const portalBase = new THREE.Group();
  portalBase.position.set(0, 1.0, 1.1);
  group.add(portalBase);
  addPortalRing(portalBase, 0x72ffd2);

  const rackMat = new THREE.MeshStandardMaterial({ color: 0x221237, roughness: 0.55, metalness: 0.16, emissive: 0x200030, emissiveIntensity: 0.08 });
  for (let i = 0; i < 4; i++){
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.55), rackMat);
    box.position.set(-3.4 + i * 2.25, 0.55, -2.2);
    group.add(box);
    const chip = new THREE.Mesh(new THREE.SphereGeometry(0.20, 24, 12), new THREE.MeshStandardMaterial({ color: [0x7fffd2,0xff73d6,0xa884ff,0xffffff][i], roughness: 0.4, metalness: 0.25 }));
    chip.position.set(box.position.x, 1.06, -2.2);
    group.add(chip);
  }

  return {
    group,
    target: new THREE.Vector3(group.position.x, 0, group.position.z + 2.9),
    look: new THREE.Vector3(group.position.x, 1.45, group.position.z - 1.1)
  };
}

function createLobbyStorePortal(scene){
  const group = new THREE.Group();
  group.name = 'SVR_LOBBY_STORE_PORTAL_PHASE71';
  group.position.set(5.8, 1.55, -5.4);
  scene.add(group);

  const panel = makePanel({
    title: 'SVR STORE PORTAL',
    subtitle: 'LOBBY PORTAL ADDED — ORIGINAL LOBBY KEPT',
    accent: '#72ffd2',
    lines: ['teleport to private store scene', 'open website store', 'no site files edited', 'game unlocked for direct edits'],
    width: 3.15,
    height: 1.62
  });
  group.add(panel);
  addGlowFrame(group, 3.3, 1.76, 0x72ffd2);
  const portal = new THREE.Group();
  portal.position.set(0, -1.03, 0.05);
  group.add(portal);
  addPortalRing(portal, 0x72ffd2);
  facePoint(group, new THREE.Vector3(0, 1.45, 4.8));
  return {
    group,
    target: new THREE.Vector3(5.35, 0, -3.05),
    look: new THREE.Vector3(5.8, 1.55, -5.4)
  };
}

export function applyPhase71EditUnlock({ scene, sceneTargets = {}, log = console.log } = {}){
  if (!scene || scene.userData.phase71Applied) return null;
  scene.userData.phase71Applied = true;
  scene.userData.SVR_BUILD = BUILD;
  scene.userData.SVR_STORE_URL = STORE_URL;
  if (typeof window !== 'undefined'){
    window.SVR_BUILD = BUILD;
    window.SVR_STORE_URL = STORE_URL;
    window.openSVRStore = ()=> window.open(STORE_URL, '_blank', 'noopener,noreferrer');
  }

  const storeScene = createStoreScene(scene);
  const storePortal = createLobbyStorePortal(scene);

  sceneTargets.store = { pos: storePortal.target.clone(), look: storePortal.look.clone() };
  sceneTargets.storePortal = sceneTargets.store;
  sceneTargets.storeScene = { pos: storeScene.target.clone(), look: storeScene.look.clone() };
  sceneTargets.storeRoom = sceneTargets.storeScene;
  sceneTargets.vrStore = sceneTargets.storeScene;
  sceneTargets.pgaDrive = sceneTargets.pgaWall || sceneTargets.pga || null;
  sceneTargets.pgaChipPutt = sceneTargets.pgaWall || sceneTargets.pga || null;
  sceneTargets.reikiPrivate = sceneTargets.reikiRoom || sceneTargets.reiki || null;

  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt)=>{
    if (oldTick) oldTick(dt);
    const t = performance.now() * 0.001;
    scene.traverse((obj)=>{
      if (obj.userData?.phase71Spin) obj.rotation.z = t * 0.65;
    });
  };

  log?.(`[${BUILD}] applied. Store URL: ${STORE_URL}`);
  return { build: BUILD, storeScene, storePortal, storeUrl: STORE_URL };
}

export { BUILD as PHASE71_BUILD, STORE_URL as PHASE71_STORE_URL };
