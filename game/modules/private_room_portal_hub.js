import * as THREE from "three";

// PHASE-100-PRIVATE-ROOM-PORTAL-HUB-LOCK
// Adds one VR-ready portal bank in front of the store/development hub.
// Players can use these portals in desktop, Quest controller, or hand-tracking builds.
// VR access method: move/teleport onto a glowing portal pad and hold position briefly.

const PHASE = "PHASE-100-PRIVATE-ROOM-PORTAL-HUB-LOCK";
const scenes = new Set();
const portalMeshes = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tmp = new THREE.Vector3();
let activeScene = null;
let built = false;
let hoverPortal = null;
let dwellStart = 0;
let lastRouteAt = 0;

const PORTALS = [
  { key:"scorpion", label:"SCORPION", sub:"Poker Room", route:"./scorpion.html?v=phase100-private-portals", color:0xff3d8f },
  { key:"reiki", label:"REIKI", sub:"Meditation Room", route:"./reiki.html?v=phase100-private-portals", color:0xff405c },
  { key:"pga", label:"PGA DRIVE", sub:"Driving Range", route:"./pga-drive.html?v=phase100-private-portals", color:0xa7ff80 },
  { key:"chip", label:"CHIP/PUTT", sub:"Short Game", route:"./chip-putt.html?v=phase100-private-portals", color:0x69e8ff },
  { key:"store", label:"VR STORE", sub:"Store Room", route:"./store-room.html?v=phase100-private-portals", color:0xffd36b },
  { key:"lounge", label:"LOUNGE", sub:"Private Social", route:"./smoker-lounge.html?v=phase100-private-portals", color:0xb48cff }
];

function canvasTexture(w, h, painter){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  painter(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
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

function portalTexture(label, sub, colorHex){
  const c = `#${colorHex.toString(16).padStart(6,"0")}`;
  return canvasTexture(900, 520, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#08030f");
    g.addColorStop(.55,"#11051f");
    g.addColorStop(1,"#020104");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = c;
    ctx.lineWidth = 10;
    roundRect(ctx, 24, 24, w - 48, h - 48, 32);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.08)";
    roundRect(ctx, 50, 58, w - 100, h - 116, 26);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 78px system-ui, Arial";
    ctx.fillText(label, w/2, 205);
    ctx.fillStyle = "#e9defa";
    ctx.font = "700 40px system-ui, Arial";
    ctx.fillText(sub, w/2, 292);
    ctx.fillStyle = c;
    ctx.font = "800 30px system-ui, Arial";
    ctx.fillText("STEP ON PAD TO ENTER", w/2, 390);
  });
}

function makeHubSign(){
  return canvasTexture(1400, 460, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#07030f");
    g.addColorStop(1,"#1c0828");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#69e8ff";
    ctx.lineWidth = 10;
    roundRect(ctx, 24, 24, w - 48, h - 48, 34);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 72px system-ui, Arial";
    ctx.fillText("PRIVATE ROOM PORTALS", w/2, 145);
    ctx.fillStyle = "#d9cdec";
    ctx.font = "700 38px system-ui, Arial";
    ctx.fillText("Development access bank • each portal opens a separate private scene", w/2, 240);
    ctx.fillStyle = "#a7ff80";
    ctx.font = "800 32px system-ui, Arial";
    ctx.fillText("VR: teleport onto a pad and hold briefly", w/2, 332);
  });
}

function makePortal(scene, rec, x, z){
  const group = new THREE.Group();
  group.name = `PRIVATE_ROOM_PORTAL_${rec.key.toUpperCase()}`;
  group.position.set(x, 0, z);
  group.lookAt(0, 1.4, 0);
  group.userData.route = rec.route;
  group.userData.portal = rec;

  const color = rec.color;
  const mat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.82, side:THREE.DoubleSide, depthWrite:false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.92,.035,12,72), mat);
  ring.position.y = 1.55;
  group.add(ring);

  const pad = new THREE.Mesh(
    new THREE.RingGeometry(.44,.82,64),
    new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.52, side:THREE.DoubleSide, depthWrite:false })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = .018;
  pad.userData.route = rec.route;
  pad.userData.portal = rec;
  group.add(pad);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(.40,48),
    new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = .012;
  group.add(disc);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 1.05),
    new THREE.MeshBasicMaterial({ map:portalTexture(rec.label, rec.sub, color), transparent:true, side:THREE.DoubleSide, depthWrite:false })
  );
  panel.position.y = 1.55;
  panel.position.z = -.04;
  panel.userData.route = rec.route;
  panel.userData.portal = rec;
  group.add(panel);

  const light = new THREE.PointLight(color, 1.05, 4.2, 2.0);
  light.position.set(0, 1.35, .25);
  group.add(light);
  group.userData.ring = ring;
  group.userData.pad = pad;
  group.userData.light = light;

  scene.add(group);
  portalMeshes.push(group, pad, panel, ring);
  return group;
}

function buildPortalHub(scene){
  if (!scene || built) return;
  built = true;
  activeScene = scene;
  const root = new THREE.Group();
  root.name = "PHASE100_PRIVATE_ROOM_PORTAL_BANK_FRONT_OF_STORE_HUB";
  scene.add(root);

  // Fixed development access bank near the front/store walkway, facing the center table.
  const z = 8.8;
  const xs = [-5.1, -3.05, -1.02, 1.02, 3.05, 5.1];
  PORTALS.forEach((rec, i)=> root.add(makePortal(scene, rec, xs[i], z)));

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(6.6, 2.15),
    new THREE.MeshBasicMaterial({ map:makeHubSign(), transparent:true, side:THREE.DoubleSide, depthWrite:false })
  );
  sign.position.set(0, 3.15, z + .25);
  sign.lookAt(0, 2.0, 0);
  scene.add(sign);

  window.SVR_PRIVATE_PORTAL_HUB = { phase:PHASE, ready:true, routes:PORTALS.map(p=>p.route), location:"front/store walkway" };
}

function routeTo(rec){
  if (!rec?.route || performance.now() - lastRouteAt < 1600) return;
  lastRouteAt = performance.now();
  try { window.SVR_DATABASE_CLIENT?.postGameEvent?.("private_room_portal_enter", { key:rec.key, route:rec.route, phase:PHASE }); } catch(_) {}
  location.href = rec.route;
}

function updateDwell(scene){
  if (!scene || !built) return;
  const cam = scene.userData?._camera;
  if (!cam) return;
  cam.getWorldPosition(tmp);
  let nearest = null;
  let best = 999;
  for (const obj of portalMeshes){
    const rec = obj.userData?.portal;
    if (!rec || !obj.isGroup) continue;
    const d = Math.hypot(tmp.x - obj.position.x, tmp.z - obj.position.z);
    if (d < best){ best = d; nearest = obj; }
    const on = d < .95;
    if (obj.userData?.ring) obj.userData.ring.material.opacity = on ? 1.0 : .82;
    if (obj.userData?.pad) obj.userData.pad.material.opacity = on ? .92 : .52;
    if (obj.userData?.light) obj.userData.light.intensity = on ? 2.4 : 1.05;
  }
  if (nearest && best < .82){
    if (hoverPortal !== nearest){ hoverPortal = nearest; dwellStart = performance.now(); }
    if (performance.now() - dwellStart > 1350) routeTo(nearest.userData.portal);
  } else {
    hoverPortal = null;
    dwellStart = 0;
  }
}

function pointerOpen(e){
  if (!activeScene || !built) return;
  const cam = activeScene.userData?._camera;
  if (!cam) return;
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, cam);
  const hit = raycaster.intersectObjects(portalMeshes, true)[0];
  const rec = hit?.object?.userData?.portal || hit?.object?.parent?.userData?.portal;
  if (rec) routeTo(rec);
}

function scan(){
  for (const scene of scenes){
    if (!built && scene.children?.length > 8) buildPortalHub(scene);
    updateDwell(scene);
  }
  requestAnimationFrame(scan);
}

const originalAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function phase100PortalSceneAdd(...objects){
  scenes.add(this);
  return originalAdd.apply(this, objects);
};
window.addEventListener("pointerdown", pointerOpen, { passive:true });
requestAnimationFrame(scan);
console.log(`[SVR] ${PHASE} loaded`);
