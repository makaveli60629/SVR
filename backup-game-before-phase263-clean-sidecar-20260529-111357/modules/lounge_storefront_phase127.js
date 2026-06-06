import * as THREE from "three";

const PHASE127 = "PHASE-127-EXECUTIVE-LOUNGE-STOREFRONT-LOCK";
let lastScene = null;
let installed = false;

const FALLBACK = new THREE.Vector3(-20.74, 0, 5.00);

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeMarbleTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#07070c");
  g.addColorStop(0.5, "#111019");
  g.addColorStop(1, "#030306");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 58; i++){
    x.strokeStyle = i % 3 === 0 ? "rgba(255,215,123,0.12)" : "rgba(110,220,255,0.055)";
    x.lineWidth = 1 + (i % 4);
    x.beginPath();
    const y = (i * 97) % c.height;
    x.moveTo(-100, y);
    x.bezierCurveTo(220, y - 120, 460, y + 140, 720, y + 12);
    x.bezierCurveTo(880, y - 80, 1030, y + 70, 1150, y - 40);
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = 4;
  return tex;
}

function makeHeaderTexture(){
  const c = document.createElement("canvas");
  c.width = 1800;
  c.height = 520;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);
  const bg = x.createLinearGradient(0, 0, c.width, c.height);
  bg.addColorStop(0, "rgba(4,4,9,0.98)");
  bg.addColorStop(0.5, "rgba(18,12,22,0.98)");
  bg.addColorStop(1, "rgba(4,4,9,0.98)");
  x.fillStyle = bg;
  roundRect(x, 26, 30, c.width - 52, c.height - 60, 34);
  x.fill();
  x.lineWidth = 14;
  x.strokeStyle = "#ffd77b";
  roundRect(x, 26, 30, c.width - 52, c.height - 60, 34);
  x.stroke();
  x.lineWidth = 5;
  x.strokeStyle = "rgba(113,247,255,0.74)";
  roundRect(x, 64, 68, c.width - 128, c.height - 136, 24);
  x.stroke();

  x.save();
  x.translate(300, 260);
  x.shadowColor = "#ffd77b";
  x.shadowBlur = 22;
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 10;
  x.beginPath();
  x.moveTo(-135, -92); x.lineTo(135, -92); x.lineTo(36, 48); x.quadraticCurveTo(0, 82, -36, 48); x.closePath(); x.stroke();
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 7;
  x.beginPath(); x.moveTo(0, 58); x.lineTo(0, 150); x.stroke();
  x.beginPath(); x.moveTo(-72, 150); x.quadraticCurveTo(0, 180, 72, 150); x.stroke();
  x.strokeStyle = "#ff4fd8";
  x.lineWidth = 8;
  x.beginPath(); x.moveTo(28, -93); x.bezierCurveTo(88, -145, 68, -205, 8, -184); x.bezierCurveTo(-54, -158, -18, -112, 28, -93); x.stroke();
  x.restore();

  x.textAlign = "left";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 12;
  x.fillStyle = "#fff7e3";
  x.font = "900 118px Arial";
  x.fillText("SVR EXECUTIVE LOUNGE", 520, 220);
  x.shadowColor = "#ffd77b";
  x.fillStyle = "#ffd77b";
  x.font = "800 42px Arial";
  x.fillText("PRIVATE SOCIAL PORTAL • COCKTAIL LOUNGE • VIP HANGOUT", 526, 314);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(226,255,255,0.84)";
  x.font = "700 30px Arial";
  x.fillText("Fist teleport logo on marker → release to enter", 528, 370);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeSidePanelTexture(title, subtitle){
  const c = document.createElement("canvas");
  c.width = 800;
  c.height = 1000;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0, "#05060b"); bg.addColorStop(.55, "#140b16"); bg.addColorStop(1, "#020305");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  x.lineWidth = 12; x.strokeStyle = "#ffd77b"; roundRect(x, 36, 36, c.width-72, c.height-72, 34); x.stroke();
  x.lineWidth = 4; x.strokeStyle = "rgba(113,247,255,.75)"; roundRect(x, 68, 68, c.width-136, c.height-136, 24); x.stroke();
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = "#71f7ff"; x.shadowBlur = 16;
  x.fillStyle = "#fff7e3"; x.font = "900 58px Arial"; x.fillText(title, c.width/2, 230);
  x.shadowColor = "#ffd77b"; x.fillStyle = "#ffd77b"; x.font = "800 32px Arial"; x.fillText(subtitle, c.width/2, 302);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,.84)"; x.font = "600 28px Arial";
  const lines = ["Premium social lounge", "clean VIP storefront", "private room routing", "SVR neon theme"];
  lines.forEach((line, i)=>x.fillText(line, c.width/2, 440 + i*62));
  x.fillStyle = "rgba(255,215,123,.92)"; x.font = "900 36px Arial"; x.fillText("QUICK SELECT READY", c.width/2, 790);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeDoorTexture(){
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1300;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#050509"); bg.addColorStop(.45,"#151019"); bg.addColorStop(1,"#020203");
  x.fillStyle = bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#ffd77b"; x.lineWidth = 18; roundRect(x, 45, 45, c.width-90, c.height-90, 34); x.stroke();
  x.strokeStyle = "rgba(113,247,255,.80)"; x.lineWidth = 6; roundRect(x, 88, 88, c.width-176, c.height-176, 24); x.stroke();
  const shine = x.createLinearGradient(0,0,c.width,0);
  shine.addColorStop(0,"rgba(255,255,255,0.00)"); shine.addColorStop(.48,"rgba(113,247,255,0.18)"); shine.addColorStop(1,"rgba(255,255,255,0.00)");
  x.fillStyle = shine; x.fillRect(0,0,c.width,c.height);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = "#ffd77b"; x.shadowBlur = 24;
  x.fillStyle = "#ffd77b"; x.font = "900 70px Arial"; x.fillText("ENTER", c.width/2, 560);
  x.fillStyle = "#fff7e3"; x.font = "900 76px Arial"; x.fillText("LOUNGE", c.width/2, 650);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,.78)"; x.font = "700 32px Arial"; x.fillText("PRIVATE ROOM", c.width/2, 724);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function findLoungePortal(scene){
  let portal = null;
  scene.traverse((obj)=>{
    if (portal) return;
    const key = obj?.userData?.portalKey;
    if (key === "smokerLounge" || key === "lounge" || obj?.name === "PORTAL_smokerLounge" || obj?.name === "PORTAL_lounge") portal = obj;
  });
  return portal;
}

function add(root, obj, x, y, z){
  obj.position.set(x, y, z);
  obj.frustumCulled = false;
  root.add(obj);
  return obj;
}

function install(scene){
  if (!scene || installed) return false;
  const portal = findLoungePortal(scene);
  const root = new THREE.Group();
  root.name = "EXECUTIVE_LOUNGE_STOREFRONT_PHASE127";
  root.frustumCulled = false;

  if (portal){
    root.position.set(0, 0, 0.55);
    root.rotation.set(0, 0, 0);
    portal.add(root);
  } else {
    root.position.copy(FALLBACK);
    root.lookAt(new THREE.Vector3(0, 2.4, 0));
    scene.add(root);
  }

  const marble = new THREE.MeshBasicMaterial({ map: makeMarbleTexture(), color: 0xffffff, toneMapped: false });
  const gold = new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x71f7ff, toneMapped: false });
  const black = new THREE.MeshBasicMaterial({ color: 0x040407, toneMapped: false });

  add(root, new THREE.Mesh(new THREE.BoxGeometry(12.8, 6.4, 0.22), marble), 0, 3.15, 0.16);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.1, 0.16, 0.32), gold), 0, 6.45, 0.02);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.1, 0.12, 0.28), cyan), 0, 0.08, 0.02);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.45, 0.32), gold), -6.45, 3.25, 0.02);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.45, 0.32), gold), 6.45, 3.25, 0.02);

  add(root, new THREE.Mesh(new THREE.PlaneGeometry(10.8, 3.12), new THREE.MeshBasicMaterial({ map: makeHeaderTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false })), 0, 5.05, -0.02);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.5), new THREE.MeshBasicMaterial({ map: makeSidePanelTexture("VIP", "EXECUTIVE ACCESS"), transparent: true, side: THREE.DoubleSide, toneMapped: false })), -4.35, 2.45, -0.04);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.5), new THREE.MeshBasicMaterial({ map: makeSidePanelTexture("SOCIAL", "PRIVATE HANGOUT"), transparent: true, side: THREE.DoubleSide, toneMapped: false })), 4.35, 2.45, -0.04);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(2.75, 3.95), new THREE.MeshBasicMaterial({ map: makeDoorTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false })), 0, 2.32, -0.08);

  const floor = add(root, new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.08, 2.35), black), 0, 0.04, 1.15);
  floor.name = "EXECUTIVE_LOUNGE_BLACK_ENTRY_FLOOR";
  add(root, new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.04, 0.08), gold), 0, 0.11, 1.15);
  add(root, new THREE.PointLight(0xffd77b, 1.65, 10, 2.0), 0, 4.7, 1.25);
  add(root, new THREE.PointLight(0x71f7ff, 1.25, 9, 2.0), -3.2, 3.5, 1.05);
  add(root, new THREE.PointLight(0xff4fd8, 1.0, 8, 2.0), 3.2, 3.5, 1.05);

  installed = true;
  scene.userData.phase127LoungeStorefront = root;
  console.log(`[${PHASE127}] installed`, portal ? "attached to lounge portal" : "fallback position");
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrLoungeStorefrontPhase127){
  THREE.WebGLRenderer.prototype.__svrLoungeStorefrontPhase127 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ install(lastScene); }, 1000);
console.log(`[${PHASE127}] loaded`);
