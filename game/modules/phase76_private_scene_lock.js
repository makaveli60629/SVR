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

function rr(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makePanelTexture({ title, subtitle = '', lines = [], accent = '#72ffd2', warning = false }){
  return canvasTexture(1200, 720, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, warning ? '#280006' : '#03111a');
    g.addColorStop(0.52, warning ? '#12030a' : '#07051a');
    g.addColorStop(1, '#020306');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    rr(ctx, 28, 28, w - 56, h - 56, 36);
    ctx.stroke();
    ctx.fillStyle = warning ? 'rgba(255,50,75,0.12)' : 'rgba(120,255,210,0.08)';
    for (let i = 0; i < 36; i++) ctx.fillRect(55 + i * 32, 55 + ((i * 67) % 520), 2, 150);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 76px system-ui, Arial';
    ctx.fillText(title, w / 2, 122);
    ctx.fillStyle = accent;
    ctx.font = 'bold 42px system-ui, Arial';
    ctx.fillText(subtitle, w / 2, 188);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f4ffff';
    ctx.font = '34px system-ui, Arial';
    let y = 286;
    for (const line of lines){
      ctx.fillText('• ' + line, 96, y);
      y += 58;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.font = '24px ui-monospace, monospace';
    ctx.fillText(BUILD, w / 2, h - 58);
  });
}

function makePanel(opts, width = 5.2, height = 3.12){
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: makePanelTexture(opts), transparent: true, side: THREE.DoubleSide, toneMapped: false })
  );
}

function addWalls(group, { w = 14, d = 12, h = 4.0, color = 0x080b12, emissive = 0x05070d } = {}){
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.05, emissive, emissiveIntensity: 0.16 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.10, d), new THREE.MeshStandardMaterial({ color: color + 0x080808, roughness: 0.92, metalness: 0.02, emissive, emissiveIntensity: 0.10 }));
  floor.position.set(0, -0.05, 0); group.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), mat); back.position.set(0, h/2, -d/2); group.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, d), mat); left.position.set(-w/2, h/2, 0); group.add(left);
  const right = left.clone(); right.position.x = w/2; group.add(right);
  const frontRail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0x72ffd2, transparent: true, opacity: 0.35 }));
  frontRail.position.set(0, 0.08, d/2); group.add(frontRail);
  return { floor, back, left, right };
}

function addPortalPad(group, color = 0x72ffd2, z = 3.8){
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.35, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI/2;
  ring.position.set(0, 0.018, z);
  group.add(ring);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.86, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  core.rotation.x = -Math.PI/2;
  core.position.set(0, 0.021, z);
  group.add(core);
  return ring;
}

function addPrivateRoomLabel(group, text, color = 0x72ffd2){
  const tex = canvasTexture(900, 180, (ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.strokeRect(8,8,w-16,h-16);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = 'bold 52px system-ui, Arial'; ctx.fillText(text, w/2, h/2);
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.96), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  mesh.position.set(0, 3.65, -5.85);
  group.add(mesh);
  const glow = new THREE.PointLight(color, 1.8, 18, 2.2); glow.position.set(0, 3.2, 0); group.add(glow);
}

function createFreshReikiScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_REIKI_FRESH_ROOM_PHASE76';
  group.position.set(-150, 0, -130);
  scene.add(group);
  addWalls(group, { w: 14, d: 12, h: 4.2, color: 0x160407, emissive: 0x320408 });
  addPrivateRoomLabel(group, 'REIKI PRIVATE ROOM', 0xff334d);
  const panel = makePanel({ title:'REIKI ROOM', subtitle:'WAITING FOR APPROVAL', accent:'#ff334d', warning:true, lines:['fresh private room outside the lobby', 'no third-party names, photos, logos, or website', 'SVR logo/placeholder only', 'return with Lobby button or watch'] });
  panel.position.set(0, 2.3, -5.88); group.add(panel);
  const meditation = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.95, 128), new THREE.MeshBasicMaterial({ color:0xff334d, transparent:true, opacity:0.72, side:THREE.DoubleSide }));
  meditation.rotation.x = -Math.PI/2; meditation.position.set(0,0.025,-0.6); group.add(meditation);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.35,32,16), new THREE.MeshBasicMaterial({ color:0xff334d, transparent:true, opacity:0.85 })); orb.position.set(0,1.35,-0.6); group.add(orb);
  addPortalPad(group, 0xff334d, 3.9);
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+4.1), look:new THREE.Vector3(group.position.x,1.5,group.position.z-1.3) };
}

function createPgaDriveScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_PGA_DRIVE_FRESH_SCENE_PHASE76';
  group.position.set(150, 0, -130);
  scene.add(group);
  addWalls(group, { w: 18, d: 26, h: 4.4, color: 0x082211, emissive: 0x06220a });
  addPrivateRoomLabel(group, 'PGA DRIVE PRIVATE RANGE', 0x7dff8a);
  const panel = makePanel({ title:'PGA DRIVE RANGE', subtitle:'PRIVATE TRAINING SCENE', accent:'#7dff8a', lines:['fresh driving range outside the lobby', 'tee bay, range lane, and target rings', 'future controller club swing physics', 'no golf range object remains in walkway'] });
  panel.position.set(0, 2.55, -12.88); group.add(panel);
  const tee = new THREE.Mesh(new THREE.BoxGeometry(3.2,0.06,1.8), new THREE.MeshStandardMaterial({ color:0x28a044, roughness:0.9 })); tee.position.set(0,0.035,8.4); group.add(tee);
  for (let i=0;i<5;i++){
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7+i*0.48, 0.75+i*0.48, 80), new THREE.MeshBasicMaterial({ color:[0xffffff,0x7dff8a,0xffe066,0xff9f43,0xff4d4d][i], transparent:true, opacity:0.75, side:THREE.DoubleSide }));
    ring.rotation.x = -Math.PI/2; ring.position.set(0,0.025,1.7-i*2.4); group.add(ring);
  }
  addPortalPad(group, 0x7dff8a, 11.2);
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+10.2), look:new THREE.Vector3(group.position.x,1.45,group.position.z-6.5) };
}

function createPgaChipPuttScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_PGA_CHIP_PUTT_FRESH_SCENE_PHASE76';
  group.position.set(175, 0, -100);
  scene.add(group);
  addWalls(group, { w: 14, d: 14, h: 4.0, color: 0x0c2e15, emissive: 0x061d0c });
  addPrivateRoomLabel(group, 'PGA CHIP + PUTT', 0xa4ff7a);
  const panel = makePanel({ title:'CHIP + PUTT', subtitle:'PRIVATE SHORT-GAME ROOM', accent:'#a4ff7a', lines:['fresh short-game room outside the lobby', 'putting cup and flag scaffold', 'future chip/putt scoring drills', 'separate from drive range'] });
  panel.position.set(0,2.4,-6.88); group.add(panel);
  const green = new THREE.Mesh(new THREE.BoxGeometry(8.5,0.035,5.6), new THREE.MeshStandardMaterial({ color:0x238b38, roughness:0.96 })); green.position.set(0,0.02,-0.5); group.add(green);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.18,0.06,32), new THREE.MeshBasicMaterial({ color:0x000000 })); cup.position.set(2.8,0.07,-2.0); group.add(cup);
  const flagPole = new THREE.Mesh(new THREE.BoxGeometry(0.035,1.4,0.035), new THREE.MeshBasicMaterial({ color:0xffffff })); flagPole.position.set(2.8,0.75,-2.0); group.add(flagPole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.38), new THREE.MeshBasicMaterial({ color:0xff334d, side:THREE.DoubleSide })); flag.position.set(3.12,1.25,-2.0); group.add(flag);
  addPortalPad(group, 0xa4ff7a, 5.2);
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+5.4), look:new THREE.Vector3(group.position.x,1.4,group.position.z-1.8) };
}

function createSmokerLoungeScene(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_SMOKER_LOUNGE_FRESH_SCENE_PHASE76';
  group.position.set(-150, 0, 120);
  scene.add(group);
  addWalls(group, { w: 16, d: 13, h: 4.2, color: 0x110816, emissive: 0x19081f });
  addPrivateRoomLabel(group, 'SMOKER LOUNGE PRIVATE ROOM', 0xff73d6);
  const panel = makePanel({ title:'SMOKER LOUNGE', subtitle:'PRIVATE SOCIAL ROOM', accent:'#ff73d6', lines:['fresh hangout room outside the lobby', 'social replay/jumbotron wall scaffold', 'storefront portal remains in lobby only', 'future moderation and access rules'] });
  panel.position.set(0,2.45,-6.38); group.add(panel);
  const couchMat = new THREE.MeshStandardMaterial({ color:0x2b1538, roughness:0.72, metalness:0.08, emissive:0x1c0a22, emissiveIntensity:0.12 });
  [-4.2,0,4.2].forEach((x)=>{ const couch = new THREE.Mesh(new THREE.BoxGeometry(2.8,0.55,0.9), couchMat); couch.position.set(x,0.35,1.0); group.add(couch); });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(1.0,1.0,0.16,48), new THREE.MeshStandardMaterial({ color:0x090a12, roughness:0.6, metalness:0.2, emissive:0x13051d, emissiveIntensity:0.2 })); table.position.set(0,0.18,0.05); group.add(table);
  addPortalPad(group, 0xff73d6, 5.1);
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+5.2), look:new THREE.Vector3(group.position.x,1.45,group.position.z-1.2) };
}

function createScorpionPokerRoom(scene){
  const group = new THREE.Group();
  group.name = 'SVR_PRIVATE_SCORPION_POKER_ROOM_PHASE76';
  group.position.set(150, 0, 120);
  scene.add(group);
  addWalls(group, { w: 15, d: 13, h: 4.2, color: 0x140711, emissive: 0x23061a });
  addPrivateRoomLabel(group, 'SCORPION PRIVATE POKER ROOM', 0xff7fd0);
  const panel = makePanel({ title:'SCORPION ROOM', subtitle:'PRIVATE ENCLOSED POKER ROOM', accent:'#ff7fd0', lines:['fresh private room outside the lobby', 'table, player seat, bots, and card-deal scaffold', 'lobby has portal only', 'future real table matchmaking'] });
  panel.position.set(0,2.45,-6.38); group.add(panel);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,0.18,64), new THREE.MeshStandardMaterial({ color:0x12302a, roughness:0.88, metalness:0.05, emissive:0x051815, emissiveIntensity:0.2 })); felt.scale.z = 0.62; felt.position.set(0,0.55,0); group.add(felt);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(2.65,0.12,16,96), new THREE.MeshStandardMaterial({ color:0x250d19, roughness:0.72, metalness:0.12, emissive:0x12040d, emissiveIntensity:0.2 })); rail.rotation.x = Math.PI/2; rail.scale.y = 0.62; rail.position.set(0,0.66,0); group.add(rail);
  for (let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2;
    const bot = new THREE.Mesh(new THREE.CapsuleGeometry(0.18,0.55,6,12), new THREE.MeshStandardMaterial({ color:i===3?0x72ffd2:0xff7fd0, roughness:0.78 }));
    bot.position.set(Math.cos(a)*3.55,0.82,Math.sin(a)*2.25);
    bot.lookAt(0,0.75,0);
    group.add(bot);
  }
  for (let i=0;i<5;i++){
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.42,0.018,0.62), new THREE.MeshBasicMaterial({ color:0xffffff }));
    card.position.set(-0.95+i*0.48,0.72,0.0);
    group.add(card);
  }
  addPortalPad(group, 0xff7fd0, 5.2);
  return { group, target:new THREE.Vector3(group.position.x,0,group.position.z+5.4), look:new THREE.Vector3(group.position.x,1.35,group.position.z) };
}

export function applyPhase76PrivateSceneLock({ scene, sceneTargets = {}, log = console.log } = {}){
  if (!scene || scene.userData.phase76PrivateScenesApplied) return null;
  scene.userData.phase76PrivateScenesApplied = true;
  scene.userData.SVR_BUILD = BUILD;
  scene.userData.SVR_PRIVATE_SCENE_LOCK = true;
  if (typeof window !== 'undefined'){
    window.SVR_BUILD = BUILD;
    window.SVR_PRIVATE_SCENE_LOCK = true;
    window.SVR_STORE_URL = STORE_URL;
  }

  const reiki = createFreshReikiScene(scene);
  const drive = createPgaDriveScene(scene);
  const chip = createPgaChipPuttScene(scene);
  const smoker = createSmokerLoungeScene(scene);
  const scorpion = createScorpionPokerRoom(scene);

  // Private destination overrides. Lobby hub keys remain storefronts; room keys jump to isolated private rooms.
  sceneTargets.reikiRoom = { pos: reiki.target.clone(), look: reiki.look.clone() };
  sceneTargets.reikiPrivate = sceneTargets.reikiRoom;
  sceneTargets.reikiEscape = sceneTargets.reikiRoom;
  sceneTargets.reikiMeditation = sceneTargets.reikiRoom;

  sceneTargets.pgaDrive = { pos: drive.target.clone(), look: drive.look.clone() };
  sceneTargets.pgaDriving = sceneTargets.pgaDrive;
  sceneTargets.drive = sceneTargets.pgaDrive;

  sceneTargets.pgaChipPutt = { pos: chip.target.clone(), look: chip.look.clone() };
  sceneTargets.pgaShortGame = sceneTargets.pgaChipPutt;
  sceneTargets.chipPutt = sceneTargets.pgaChipPutt;

  sceneTargets.smoker = { pos: smoker.target.clone(), look: smoker.look.clone() };
  sceneTargets.smokerLounge = sceneTargets.smoker;
  sceneTargets.lounge = sceneTargets.smoker;
  sceneTargets.loungeRoom = sceneTargets.smoker;

  sceneTargets.scorpion = { pos: scorpion.target.clone(), look: scorpion.look.clone() };
  sceneTargets.scorpionRoom = sceneTargets.scorpion;
  sceneTargets.scorpionPrivate = sceneTargets.scorpion;
  sceneTargets.scorpionPoker = sceneTargets.scorpion;

  log?.(`[${BUILD}] private scene routing locked: Reiki, PGA Drive, PGA Chip/Putt, Smoker Lounge, Scorpion Room.`);
  return { build: BUILD, reiki, drive, chip, smoker, scorpion };
}

export { BUILD as PHASE76_BUILD, STORE_URL as PHASE76_STORE_URL };
