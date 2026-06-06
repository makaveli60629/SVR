import * as THREE from "three";

const PHASE130 = "PHASE-130-LOUNGE-HUB-STOREFRONT-REIKI-STYLE";
let lastScene = null;
let installed = false;

// User-approved lounge placement area from Hub Position Table.
const HUB_POS = new THREE.Vector3(-15.93, 0, 5.28);

function rr(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makePanelTexture({title, subtitle, body = [], footer = "", accent = "#ffd77b"}){
  const c = document.createElement("canvas");
  c.width = 1100;
  c.height = 1500;
  const x = c.getContext("2d");

  const bg = x.createLinearGradient(0, 0, c.width, c.height);
  bg.addColorStop(0, "#030407");
  bg.addColorStop(0.48, "#120b15");
  bg.addColorStop(1, "#020203");
  x.fillStyle = bg;
  x.fillRect(0, 0, c.width, c.height);

  x.lineWidth = 16;
  x.strokeStyle = accent;
  rr(x, 48, 48, c.width - 96, c.height - 96, 40);
  x.stroke();
  x.lineWidth = 5;
  x.strokeStyle = "rgba(113,247,255,0.80)";
  rr(x, 92, 92, c.width - 184, c.height - 184, 28);
  x.stroke();

  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 16;
  x.fillStyle = "#fff7e3";
  x.font = "900 72px Arial";
  x.fillText(title, c.width / 2, 205);
  x.shadowColor = accent;
  x.fillStyle = accent;
  x.font = "800 36px Arial";
  x.fillText(subtitle, c.width / 2, 285);

  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,0.86)";
  x.font = "600 35px Arial";
  body.forEach((line, i)=>x.fillText(line, c.width / 2, 445 + i * 74));

  x.fillStyle = "rgba(255,215,123,0.12)";
  rr(x, 138, 1090, c.width - 276, 168, 28);
  x.fill();
  x.strokeStyle = "rgba(255,215,123,0.72)";
  x.lineWidth = 5;
  rr(x, 138, 1090, c.width - 276, 168, 28);
  x.stroke();
  x.fillStyle = "#fff7e3";
  x.font = "900 44px Arial";
  x.fillText(footer, c.width / 2, 1174);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeHeaderTexture(){
  const c = document.createElement("canvas");
  c.width = 1900;
  c.height = 720;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0, 0, c.width, c.height);
  bg.addColorStop(0, "#020204");
  bg.addColorStop(0.5, "#171019");
  bg.addColorStop(1, "#020204");
  x.fillStyle = bg;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 22;
  rr(x, 38, 38, c.width - 76, c.height - 76, 46);
  x.stroke();
  x.strokeStyle = "rgba(113,247,255,0.84)";
  x.lineWidth = 7;
  rr(x, 92, 92, c.width - 184, c.height - 184, 30);
  x.stroke();

  // Cocktail emblem.
  x.save();
  x.translate(320, 350);
  x.shadowColor = "#ffd77b";
  x.shadowBlur = 30;
  x.lineCap = "round";
  x.lineJoin = "round";
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 16;
  x.beginPath();
  x.moveTo(-190, -150);
  x.lineTo(190, -150);
  x.lineTo(46, 54);
  x.quadraticCurveTo(0, 92, -46, 54);
  x.closePath();
  x.stroke();
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 10;
  x.beginPath();
  x.moveTo(0, 84);
  x.lineTo(0, 230);
  x.stroke();
  x.beginPath();
  x.moveTo(-96, 230);
  x.quadraticCurveTo(0, 270, 96, 230);
  x.stroke();
  x.strokeStyle = "#ff4fd8";
  x.lineWidth = 11;
  x.beginPath();
  x.moveTo(42, -150);
  x.bezierCurveTo(135, -225, 98, -315, 10, -278);
  x.bezierCurveTo(-76, -242, -28, -172, 42, -150);
  x.stroke();
  x.restore();

  x.textAlign = "left";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 14;
  x.fillStyle = "#fff7e3";
  x.font = "900 124px Arial";
  x.fillText("SVR EXECUTIVE", 585, 265);
  x.fillStyle = "#ffd77b";
  x.font = "900 130px Arial";
  x.fillText("LOUNGE HUB", 585, 405);
  x.shadowColor = "#ffd77b";
  x.fillStyle = "#71f7ff";
  x.font = "800 43px Arial";
  x.fillText("PRIVATE SOCIAL ROOM • VIP HANGOUT • RELAXED PORTAL ENTRY", 592, 512);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,0.84)";
  x.font = "700 32px Arial";
  x.fillText("Built like the Reiki storefront: premium wall hub + guided portal marker", 595, 574);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeDoorTexture(){
  return makePanelTexture({
    title: "ENTER LOUNGE",
    subtitle: "PRIVATE SOCIAL ROOM",
    body: ["Fist teleport logo", "onto portal marker", "release to enter"],
    footer: "MAGNETIC QUICK SELECT",
    accent: "#ffd77b"
  });
}

function hideOld(scene){
  [
    "FORCED_VISIBLE_EXECUTIVE_LOUNGE_PHASE128",
    "LOUNGE_STOREFRONT_USER_POSITION_PHASE129",
    "EXECUTIVE_LOUNGE_STOREFRONT_PHASE127"
  ].forEach((name)=>{
    const o = scene.getObjectByName(name);
    if (o) o.visible = false;
  });
}

function add(root, obj, x, y, z){
  obj.position.set(x, y, z);
  obj.frustumCulled = false;
  root.add(obj);
  return obj;
}

function install(scene){
  if (!scene || installed) return false;
  installed = true;
  hideOld(scene);

  const root = new THREE.Group();
  root.name = "LOUNGE_HUB_STOREFRONT_REIKI_STYLE_PHASE130";
  root.position.copy(HUB_POS);
  root.lookAt(new THREE.Vector3(0, 2.3, 0));
  root.frustumCulled = false;

  const black = new THREE.MeshBasicMaterial({ color: 0x040407, toneMapped: false });
  const gold = new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x71f7ff, toneMapped: false });
  const magenta = new THREE.MeshBasicMaterial({ color: 0xff4fd8, toneMapped: false });

  // Storefront wall/facade similar to Reiki hub layout: broad wall, center entry, side info panels.
  add(root, new THREE.Mesh(new THREE.BoxGeometry(16.8, 8.2, 0.30), black), 0, 4.05, 0.14);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(17.2, 0.20, 0.42), gold), 0, 8.28, 0.00);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(17.2, 0.12, 0.34), cyan), 0, 0.10, 0.00);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.20, 8.15, 0.40), gold), -8.50, 4.10, 0.00);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.20, 8.15, 0.40), gold), 8.50, 4.10, 0.00);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(15.8, 0.10, 0.16), magenta), 0, 7.73, -0.08);

  const header = new THREE.Mesh(
    new THREE.PlaneGeometry(14.2, 5.38),
    new THREE.MeshBasicMaterial({ map: makeHeaderTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
  );
  header.name = "LOUNGE_PHASE130_HEADER_PANEL";
  header.renderOrder = 180000;
  add(root, header, 0, 5.80, -0.10);

  const left = new THREE.Mesh(
    new THREE.PlaneGeometry(3.25, 4.42),
    new THREE.MeshBasicMaterial({ map: makePanelTexture({ title: "VIP", subtitle: "LOUNGE ACCESS", body: ["quiet social area", "premium meetup", "private scene route"], footer: "RELAX + CONNECT", accent: "#ffd77b" }), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
  );
  left.name = "LOUNGE_PHASE130_LEFT_INFO_PANEL";
  left.renderOrder = 180001;
  add(root, left, -5.75, 2.85, -0.14);

  const right = new THREE.Mesh(
    new THREE.PlaneGeometry(3.25, 4.42),
    new THREE.MeshBasicMaterial({ map: makePanelTexture({ title: "SOCIAL", subtitle: "PRIVATE ROOM", body: ["lounge seating", "avatar hangout", "future media wall"], footer: "ENTER PORTAL", accent: "#71f7ff" }), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
  );
  right.name = "LOUNGE_PHASE130_RIGHT_INFO_PANEL";
  right.renderOrder = 180002;
  add(root, right, 5.75, 2.85, -0.14);

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(3.55, 4.82),
    new THREE.MeshBasicMaterial({ map: makeDoorTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
  );
  door.name = "LOUNGE_PHASE130_CENTER_ENTRY_PANEL";
  door.renderOrder = 180003;
  add(root, door, 0, 2.82, -0.18);

  // Entry platform, ropes, and glow strip like a storefront hub.
  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.08, 2.95), black), 0, 0.04, 1.44);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.05, 0.10), gold), 0, 0.12, 1.44);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.10, 0.10), gold), -4.9, 0.60, 1.95);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.10, 0.10), gold), 4.9, 0.60, 1.95);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.08, 0.08), magenta), 0, 1.04, 1.95);

  add(root, new THREE.PointLight(0xffd77b, 2.2, 12, 2), 0, 5.2, 1.4);
  add(root, new THREE.PointLight(0x71f7ff, 1.7, 10, 2), -5.2, 3.8, 1.2);
  add(root, new THREE.PointLight(0xff4fd8, 1.5, 10, 2), 5.2, 3.8, 1.2);

  scene.add(root);
  scene.userData.phase130LoungeHubStorefront = root;
  console.log(`[${PHASE130}] installed at Lounge portal hub position`, HUB_POS);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrLoungeHubStorefrontPhase130){
  THREE.WebGLRenderer.prototype.__svrLoungeHubStorefrontPhase130 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>install(lastScene), 1000);
console.log(`[${PHASE130}] loaded`);
