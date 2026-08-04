import * as THREE from "three";

const COMPACT_POSITIONS = {
  wellness: [0, -18.2],
  pga: [12.9, -12.9],
  vibez: [18.2, 0],
  store: [12.9, 12.9],
  scorpion: [0, 18.2],
  legends: [-12.9, 12.9],
  charity: [-18.2, 0],
  sponsor: [-12.9, -12.9]
};

function mat(color, emissive = color, intensity = 0.15, metalness = 0.35, roughness = 0.42){
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, metalness, roughness });
}

function canvasTexture(w, h, draw){
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function signTexture(title, subtitle){
  return canvasTexture(1600, 460, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#03060a"); bg.addColorStop(.58, "#081423"); bg.addColorStop(1, "#020205");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#65b7ff"; ctx.lineWidth = 18; ctx.strokeRect(28, 28, w - 56, h - 56);
    ctx.strokeStyle = "#ffd56e"; ctx.lineWidth = 7; ctx.strokeRect(76, 76, w - 152, h - 152);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "#65b7ff"; ctx.shadowBlur = 22;
    ctx.fillStyle = "#fff"; ctx.font = "900 112px system-ui, Arial"; ctx.fillText(title, w/2, 168, w - 130);
    ctx.shadowBlur = 0; ctx.fillStyle = "#dfeeff"; ctx.font = "900 52px system-ui, Arial"; ctx.fillText(subtitle, w/2, 300, w - 140);
  });
}

function plaqueTexture(title, subtitle){
  return canvasTexture(900, 360, (ctx, w, h)=>{
    ctx.fillStyle = "#03070a"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#ffd56e"; ctx.lineWidth = 12; ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.strokeStyle = "#65b7ff"; ctx.lineWidth = 5; ctx.strokeRect(58, 58, w - 116, h - 116);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff"; ctx.font = "900 52px system-ui, Arial"; ctx.fillText(title, w/2, 132, w - 90);
    ctx.fillStyle = "#dfeeff"; ctx.font = "800 34px system-ui, Arial"; ctx.fillText(subtitle, w/2, 220, w - 90);
  });
}

function keyFromName(name){
  const n = String(name || "").toLowerCase();
  return Object.keys(COMPACT_POSITIONS).find(k => n.includes(k));
}

function compactStorefrontRing(scene){
  const state = scene.userData._phase163RealisticLobbyStorefronts;
  const groups = state?.groups || [];
  groups.forEach(group => {
    const key = keyFromName(group.name);
    const pos = key ? COMPACT_POSITIONS[key] : null;
    if (!pos) return;
    group.position.set(pos[0], 0, pos[1]);
    group.lookAt(0, 1.65, 0);
    group.scale.setScalar(0.92);
  });
  return groups;
}

function addCompactLobbyWalls(scene){
  if (scene.userData._phase164CompactWalls) return scene.userData._phase164CompactWalls;
  const group = new THREE.Group();
  group.name = "PHASE164 COMPACT LOBBY WALLS CLOSE TO HUB HUDS";
  const wallMat = mat(0x050b12, 0x06111d, .24, .12, .72);
  const trimMat = mat(0x58fff4, 0x58fff4, .72, .55, .20);
  const radius = 21.8;
  for (let i = 0; i < 8; i++){
    const a = i / 8 * Math.PI * 2;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(11.7, 6.25, .28), wallMat);
    wall.name = "PHASE164 CLOSE COMPACT LOBBY WALL PANEL";
    wall.position.set(Math.cos(a) * radius, 3.1, Math.sin(a) * radius);
    wall.lookAt(0, 3.1, 0);
    group.add(wall);
    const top = new THREE.Mesh(new THREE.BoxGeometry(11.9, .12, .30), trimMat);
    top.position.set(wall.position.x, 6.28, wall.position.z);
    top.rotation.copy(wall.rotation);
    group.add(top);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(11.9, .08, .30), trimMat);
    floor.position.set(wall.position.x, .38, wall.position.z);
    floor.rotation.copy(wall.rotation);
    group.add(floor);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(8.8, 20.7, 128), new THREE.MeshBasicMaterial({ color: 0x58fff4, transparent: true, opacity: .08, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI * .5;
  ring.position.y = .026;
  group.add(ring);
  scene.add(group);
  scene.userData._phase164CompactWalls = group;
  return group;
}

function buildArmorStatue(name, side){
  const group = new THREE.Group();
  group.name = `PHASE164 LEGENDS ARMOR STATUE ${name}`;
  const metal = mat(0x9aa4ad, 0x1b2630, .28, .80, .20);
  const dark = mat(0x10151a, 0x050708, .10, .38, .45);
  const gold = mat(0xffd56e, 0x8a5a07, .48, .72, .24);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.62, .76, .42, 40), dark);
  pedestal.position.y = .21; group.add(pedestal);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(.95, .34), new THREE.MeshBasicMaterial({ map: plaqueTexture(name, "SVR LEGEND"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  plaque.position.set(0, .42, .66); group.add(plaque);

  const boots = new THREE.Mesh(new THREE.BoxGeometry(.52, .24, .28), metal); boots.position.set(0, .58, 0); group.add(boots);
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(.105, .13, .76, 18), metal); legL.position.set(-.18, 1.02, 0); group.add(legL);
  const legR = legL.clone(); legR.position.x = .18; group.add(legR);
  const hips = new THREE.Mesh(new THREE.BoxGeometry(.62, .26, .30), metal); hips.position.set(0, 1.44, 0); group.add(hips);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.36, .48, .82, 28), metal); torso.position.set(0, 1.96, 0); torso.scale.x = 1.06; group.add(torso);
  const chestGlow = new THREE.Mesh(new THREE.TorusGeometry(.19, .018, 12, 48), new THREE.MeshBasicMaterial({ color: 0x65b7ff, transparent: true, opacity: .76, blending: THREE.AdditiveBlending }));
  chestGlow.position.set(0, 2.10, .38); group.add(chestGlow);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .18, 18), metal); neck.position.set(0, 2.47, 0); group.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 28, 18), metal); head.position.set(0, 2.68, 0); group.add(head);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.32, .055, .035), new THREE.MeshBasicMaterial({ color: 0x65b7ff, transparent: true, opacity: .88, blending: THREE.AdditiveBlending }));
  visor.position.set(0, 2.70, .22); group.add(visor);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(.20, 22, 14), metal); shoulderL.position.set(-.52, 2.22, 0); group.add(shoulderL);
  const shoulderR = shoulderL.clone(); shoulderR.position.x = .52; group.add(shoulderR);
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(.075, .095, .86, 16), metal); armL.position.set(-.68, 1.78, 0); armL.rotation.z = .20 * side; group.add(armL);
  const armR = armL.clone(); armR.position.x = .68; armR.rotation.z = -.20 * side; group.add(armR);
  const spear = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 2.15, 12), gold); spear.position.set(side * .92, 1.92, .12); spear.rotation.z = side * .36; group.add(spear);
  const spearTip = new THREE.Mesh(new THREE.ConeGeometry(.09, .24, 16), gold); spearTip.position.set(side * 1.28, 2.92, .12); spearTip.rotation.z = side * .36; group.add(spearTip);
  return group;
}

function findLegendsGroup(scene){
  const state = scene.userData._phase163RealisticLobbyStorefronts;
  const byState = state?.groups?.find(g => /LEGENDS/i.test(g.name));
  if (byState) return byState;
  let found = null;
  scene.traverse(o => { if (!found && /PHASE163 REALISTIC ALIGNED STOREFRONT LEGENDS/i.test(String(o.name || ""))) found = o; });
  return found;
}

function addLegendsStatueDisplay(scene){
  if (scene.userData._phase164LegendsStatues) return scene.userData._phase164LegendsStatues;
  const legends = findLegendsGroup(scene);
  if (!legends) return null;
  const frame = new THREE.Group();
  frame.name = "PHASE164 LEGENDS STOREFRONT STATUE DISPLAY";
  frame.position.set(0, 0, .85);
  const left = buildArmorStatue("ALPHA", -1);
  left.position.set(-3.62, .02, .15);
  left.rotation.y = .18;
  frame.add(left);
  const right = buildArmorStatue("OMEGA", 1);
  right.position.set(3.62, .02, .15);
  right.rotation.y = -.18;
  frame.add(right);
  const heroSign = new THREE.Mesh(new THREE.PlaneGeometry(4.8, .82), new THREE.MeshBasicMaterial({ map: signTexture("LEGENDS HALL", "ARMORED HALL OF FAME"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  heroSign.position.set(0, 4.15, .22);
  frame.add(heroSign);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(8.3, 3.6), new THREE.MeshBasicMaterial({ color: 0x65b7ff, transparent: true, opacity: .055, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(0, 2.2, .05);
  frame.add(glow);
  legends.add(frame);
  scene.userData._phase164LegendsStatues = frame;
  return frame;
}

export function applyPhase164LegendsStatuesCompactWalls(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase164LegendsCompactLock) return result;
  const groups = compactStorefrontRing(scene);
  const walls = addCompactLobbyWalls(scene);
  const statues = addLegendsStatueDisplay(scene);
  scene.userData._phase164LegendsCompactLock = { groups, walls, statues };
  window.SVR_PHASE164_LEGENDS_STATUES = !!statues;
  window.SVR_PHASE164_COMPACT_LOBBY_WALLS = true;
  args.log?.("Phase 164 Legends statues and compact lobby walls active");
  args.setStatus?.("Phase 164: Legends statues added and lobby closed tighter to HUD walls", { force: true });
  return { ...result, phase164LegendsStatues: statues, phase164CompactWalls: walls };
}
