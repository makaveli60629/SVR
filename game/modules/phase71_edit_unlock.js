import * as THREE from "three";

const BUILD = "PHASE-76-PRIVATE-SCENE-ROOM-ROUTING-LOCK";
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
  group.position.set(120, 0, -120);
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
  group.position.set(13.95, 1.72, -13.62);
  scene.add(group);

  const panel = makePanel({
    title: 'SVR WEBSITE STORE',
    subtitle: 'LIVE SITE PORTAL • STORE.HTML',
    accent: '#72ffd2',
    lines: ['opens https://svrpoker.com/site/store.html', 'private store scene remains separate', 'moved tight to store wall', 'lobby path kept clear'],
    width: 3.15,
    height: 1.62
  });
  group.add(panel);
  addGlowFrame(group, 3.3, 1.76, 0x72ffd2);
  const portal = new THREE.Group();
  portal.position.set(0, -1.03, 0.05);
  group.add(portal);
  addPortalRing(portal, 0x72ffd2);
  facePoint(group, new THREE.Vector3(8.2, 1.45, -8.2));
  return {
    group,
    target: new THREE.Vector3(12.70, 0, -12.45),
    look: new THREE.Vector3(13.95, 1.55, -13.62)
  };
}


function createPrivateReikiScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_REIKI_APPROVAL_ROOM_PHASE74';
  group.position.set(-120, 0, -120);
  scene.add(group);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(11, 0.08, 8.5), new THREE.MeshStandardMaterial({ color: 0x17070a, roughness: 0.9, metalness: 0.02, emissive: 0x33030a, emissiveIntensity: 0.18 }));
  floor.position.y = -0.04; group.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(11, 3.4, 0.14), new THREE.MeshStandardMaterial({ color: 0x09060a, roughness: 0.72, metalness: 0.08, emissive: 0x26040a, emissiveIntensity: 0.18 }));
  back.position.set(0,1.7,-4.2); group.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.4, 8.5), back.material); left.position.set(-5.5,1.7,0); group.add(left);
  const right = left.clone(); right.position.x = 5.5; group.add(right);
  const sign = makePanel({ title:'REIKI ROOM', subtitle:'WAITING FOR APPROVAL', accent:'#ff334d', lines:['red approval placeholder active', 'no founder photo/name/website live', 'SVR logo only while approval is pending', 'lobby storefront stays unchanged'], width:4.4, height:2.0 });
  sign.position.set(0,2.1,-4.08); group.add(sign);
  const pad = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.45, 96), new THREE.MeshBasicMaterial({ color:0xff334d, transparent:true, opacity:0.72, side:THREE.DoubleSide }));
  pad.rotation.x = -Math.PI/2; pad.position.set(0,0.015,0.3); group.add(pad);
  addPortalRing(group, 0xff334d).position.set(0, 0.06, 0.3);
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+2.8), look:new THREE.Vector3(group.position.x,1.5,group.position.z-1.7) };
}

function createPgaDriveScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_PGA_DRIVE_RANGE_PHASE74';
  group.position.set(120,0,120);
  scene.add(group);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16,0.08,20), new THREE.MeshStandardMaterial({ color:0x12351b, roughness:0.96, metalness:0.0, emissive:0x061207, emissiveIntensity:0.10 }));
  floor.position.y = -0.04; group.add(floor);
  const mat = new THREE.MeshStandardMaterial({ color:0x07120c, roughness:0.76, metalness:0.04, emissive:0x0d2812, emissiveIntensity:0.12 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(16,4,0.14), mat); back.position.set(0,2,-10); group.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.14,4,20), mat); left.position.set(-8,2,0); group.add(left);
  const right = left.clone(); right.position.x = 8; group.add(right);
  const sign = makePanel({ title:'PGA DRIVE RANGE', subtitle:'PRIVATE TRAINING SCENE', accent:'#7dff8a', lines:['driving bay separated from lobby', 'future controller club physics', 'target rings and shot board', 'teleport return available'], width:4.8, height:2.0 });
  sign.position.set(0,2.45,-9.85); group.add(sign);
  const tee = new THREE.Mesh(new THREE.BoxGeometry(2.6,0.06,1.6), new THREE.MeshStandardMaterial({ color:0x1e913c, roughness:0.86 })); tee.position.set(0,0.02,5.8); group.add(tee);
  for(let i=0;i<4;i++){ const ring = new THREE.Mesh(new THREE.RingGeometry(0.8+i*0.45,0.85+i*0.45,64), new THREE.MeshBasicMaterial({ color:[0xffffff,0x7dff8a,0xffd45c,0xff5c5c][i], side:THREE.DoubleSide, transparent:true, opacity:0.74 })); ring.rotation.x=-Math.PI/2; ring.position.set(0,0.02,-5.6-i*0.7); group.add(ring); }
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+6.8), look:new THREE.Vector3(group.position.x,1.4,group.position.z-4.8) };
}

function createPgaChipPuttScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_PGA_CHIP_PUTT_PHASE74';
  group.position.set(140,0,120);
  scene.add(group);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12,0.08,10), new THREE.MeshStandardMaterial({ color:0x18572c, roughness:0.96, metalness:0.0, emissive:0x07190c, emissiveIntensity:0.10 })); floor.position.y=-0.04; group.add(floor);
  const sign = makePanel({ title:'CHIP + PUTT', subtitle:'PRIVATE SHORT GAME ROOM', accent:'#a4ff7a', lines:['separate room from main lobby', 'putting green scaffold', 'future ball scoring and drills', 'watch route locked'], width:4.4, height:1.9 });
  sign.position.set(0,2.2,-4.8); group.add(sign);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.06,32), new THREE.MeshBasicMaterial({ color:0x000000 })); cup.position.set(2.8,0.03,-1.8); group.add(cup);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.035,1.3,0.035), new THREE.MeshBasicMaterial({ color:0xffffff })); flag.position.set(2.8,0.68,-1.8); group.add(flag);
  const flagFace = new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.35), new THREE.MeshBasicMaterial({ color:0xff334d, side:THREE.DoubleSide })); flagFace.position.set(3.08,1.18,-1.8); group.add(flagFace);
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+3.9), look:new THREE.Vector3(group.position.x,1.35,group.position.z-1.4) };
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
  const privateReiki = createPrivateReikiScene(scene);
  const pgaDrive = createPgaDriveScene(scene);
  const pgaChipPutt = createPgaChipPuttScene(scene);

  sceneTargets.store = { pos: storePortal.target.clone(), look: storePortal.look.clone() };
  sceneTargets.storePortal = sceneTargets.store;
  sceneTargets.storeScene = { pos: storeScene.target.clone(), look: storeScene.look.clone() };
  sceneTargets.storeRoom = sceneTargets.storeScene;
  sceneTargets.vrStore = sceneTargets.storeScene;
  sceneTargets.reikiRoom = { pos: privateReiki.target.clone(), look: privateReiki.look.clone() };
  sceneTargets.reikiPrivate = sceneTargets.reikiRoom;
  sceneTargets.reikiEscape = sceneTargets.reikiRoom;
  sceneTargets.pgaDrive = { pos: pgaDrive.target.clone(), look: pgaDrive.look.clone() };
  sceneTargets.pgaDriving = sceneTargets.pgaDrive;
  sceneTargets.drive = sceneTargets.pgaDrive;
  sceneTargets.pgaChipPutt = { pos: pgaChipPutt.target.clone(), look: pgaChipPutt.look.clone() };
  sceneTargets.pgaShortGame = sceneTargets.pgaChipPutt;
  sceneTargets.chipPutt = sceneTargets.pgaChipPutt;

  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt)=>{
    if (oldTick) oldTick(dt);
    const t = performance.now() * 0.001;
    scene.traverse((obj)=>{
      if (obj.userData?.phase71Spin) obj.rotation.z = t * 0.65;
    });
  };

  log?.(`[${BUILD}] base portal/store layer applied. Store URL: ${STORE_URL}`);
  return { build: BUILD, storeScene, storePortal, storeUrl: STORE_URL };
}

export { BUILD as PHASE71_BUILD, STORE_URL as PHASE71_STORE_URL };
