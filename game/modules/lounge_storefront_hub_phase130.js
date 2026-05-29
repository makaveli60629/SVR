import * as THREE from "three";

const PHASE130 = "PHASE-130-LOUNGE-STOREFRONT-HUB-LOCK";
const LOUNGE_POS = new THREE.Vector3(-15.93, 0, 5.28);
let lastScene = null;
let installed = false;

function rr(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function makePanelTexture(){
  const c = document.createElement("canvas");
  c.width = 1600;
  c.height = 1000;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,c.width,c.height);
  bg.addColorStop(0,"#020309");
  bg.addColorStop(.45,"#11071a");
  bg.addColorStop(1,"#030205");
  x.fillStyle = bg;
  x.fillRect(0,0,c.width,c.height);

  x.strokeStyle = "#ffd77b";
  x.lineWidth = 18;
  rr(x,34,34,c.width-68,c.height-68,46);
  x.stroke();
  x.strokeStyle = "rgba(113,247,255,.88)";
  x.lineWidth = 7;
  rr(x,78,78,c.width-156,c.height-156,32);
  x.stroke();
  x.strokeStyle = "rgba(180,140,255,.75)";
  x.lineWidth = 4;
  rr(x,112,112,c.width-224,c.height-224,24);
  x.stroke();

  x.save();
  x.globalAlpha = .20;
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 1.5;
  for(let i=150;i<c.width-150;i+=80){ x.beginPath(); x.moveTo(i,160); x.lineTo(i,c.height-180); x.stroke(); }
  for(let i=170;i<c.height-170;i+=52){ x.beginPath(); x.moveTo(150,i); x.lineTo(c.width-150,i); x.stroke(); }
  x.restore();

  // Cocktail emblem.
  x.save();
  x.translate(c.width/2, 405);
  x.shadowBlur = 24;
  x.shadowColor = "#ffd77b";
  x.strokeStyle = "#ffd77b";
  x.lineCap = "round";
  x.lineJoin = "round";
  x.lineWidth = 14;
  x.beginPath();
  x.moveTo(-205,-145);
  x.lineTo(205,-145);
  x.lineTo(48,80);
  x.quadraticCurveTo(0,122,-48,80);
  x.closePath();
  x.stroke();
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 10;
  x.beginPath(); x.moveTo(0,110); x.lineTo(0,255); x.stroke();
  x.beginPath(); x.moveTo(-115,255); x.quadraticCurveTo(0,292,115,255); x.stroke();
  x.strokeStyle = "#ff4fd8";
  x.lineWidth = 11;
  x.beginPath();
  x.moveTo(42,-146);
  x.bezierCurveTo(126,-230,102,-330,12,-292);
  x.bezierCurveTo(-78,-252,-28,-176,42,-146);
  x.stroke();
  x.restore();

  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 18;
  x.fillStyle = "#fff7e3";
  x.font = "900 104px Arial";
  x.fillText("SVR LOUNGE", c.width/2, 155);
  x.shadowColor = "#ffd77b";
  x.fillStyle = "#ffd77b";
  x.font = "900 44px Arial";
  x.fillText("PRIVATE SOCIAL ROOM", c.width/2, 232);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,.88)";
  x.font = "700 34px Arial";
  x.fillText("Cocktail lounge • Replay talk space • VIP hangout", c.width/2, 735);
  x.fillStyle = "rgba(113,247,255,.95)";
  x.font = "800 32px Arial";
  x.fillText("FIST TELEPORT LOGO ON MARKER  •  RELEASE TO ENTER", c.width/2, 812);
  x.fillStyle = "rgba(255,215,123,.18)";
  rr(x,315,855,970,74,22);
  x.fill();
  x.strokeStyle = "rgba(255,215,123,.8)";
  x.lineWidth = 4;
  rr(x,315,855,970,74,22);
  x.stroke();
  x.fillStyle = "#fff7e3";
  x.font = "900 30px Arial";
  x.fillText("MAGNETIC QUICK SELECT READY", c.width/2, 893);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeSmallPanel(title, subtitle){
  const c = document.createElement("canvas");
  c.width = 800;
  c.height = 900;
  const x = c.getContext("2d");
  x.fillStyle = "#050409";
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 12;
  rr(x,32,32,c.width-64,c.height-64,34);
  x.stroke();
  x.strokeStyle = "rgba(113,247,255,.8)";
  x.lineWidth = 5;
  rr(x,70,70,c.width-140,c.height-140,24);
  x.stroke();
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 15;
  x.fillStyle = "#fff7e3";
  x.font = "900 62px Arial";
  x.fillText(title, c.width/2, 215);
  x.shadowColor = "#ffd77b";
  x.fillStyle = "#ffd77b";
  x.font = "800 33px Arial";
  x.fillText(subtitle, c.width/2, 292);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,.82)";
  x.font = "600 27px Arial";
  ["Private social room", "Poker replay discussion", "Future lounge events", "SVR partner-ready hub"].forEach((line,i)=>x.fillText(line,c.width/2,430+i*58));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function findLoungePortal(scene){
  let portal = null;
  scene.traverse((o)=>{
    if(portal) return;
    const key = o?.userData?.portalKey;
    if(key === "smokerLounge" || key === "lounge" || o?.name === "PORTAL_smokerLounge" || o?.name === "PORTAL_lounge") portal = o;
  });
  return portal;
}

function hideOld(scene){
  [
    "FORCED_VISIBLE_EXECUTIVE_LOUNGE_PHASE128",
    "LOUNGE_STOREFRONT_USER_POSITION_PHASE129",
    "EXECUTIVE_LOUNGE_STOREFRONT_PHASE127",
    "LOUNGE_PORTAL_HOLOGRAM_PHASE126"
  ].forEach((name)=>{
    const o = scene.getObjectByName(name);
    if(o) o.visible = false;
  });
}

function add(root, obj, x, y, z){
  obj.position.set(x,y,z);
  obj.frustumCulled = false;
  root.add(obj);
  return obj;
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hideOld(scene);

  const root = new THREE.Group();
  root.name = "LOUNGE_STOREFRONT_HUB_PHASE130";
  root.position.copy(LOUNGE_POS);
  root.lookAt(new THREE.Vector3(0, 2.35, 0));
  root.frustumCulled = false;

  const black = new THREE.MeshBasicMaterial({ color: 0x030307, toneMapped: false });
  const gold = new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x71f7ff, toneMapped: false });
  const purple = new THREE.MeshBasicMaterial({ color: 0xb48cff, toneMapped: false });

  add(root, new THREE.Mesh(new THREE.BoxGeometry(12.8, 6.6, .24), black), 0, 3.45, .14);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.2, .16, .34), gold), 0, 6.82, .02);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.2, .10, .30), cyan), 0, .12, .02);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.18, 6.72, .34), gold), -6.58, 3.46, .02);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.18, 6.72, .34), gold), 6.58, 3.46, .02);

  const main = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 5.15), new THREE.MeshBasicMaterial({ map: makePanelTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
  main.name = "LOUNGE_HUB_MAIN_PANEL_PHASE130";
  main.renderOrder = 180000;
  add(root, main, 0, 3.55, -.06);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 3.2), new THREE.MeshBasicMaterial({ map: makeSmallPanel("SOCIAL", "VIP HANGOUT"), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
  left.renderOrder = 180001;
  add(root, left, -5.05, 3.1, -.05);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 3.2), new THREE.MeshBasicMaterial({ map: makeSmallPanel("REPLAYS", "TALK ROOM"), transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
  right.renderOrder = 180001;
  add(root, right, 5.05, 3.1, -.05);

  const carpet = add(root, new THREE.Mesh(new THREE.BoxGeometry(7.8, .055, 3.6), new THREE.MeshBasicMaterial({ color: 0x2a0717, toneMapped: false })), 0, .035, 1.85);
  carpet.name = "LOUNGE_HUB_ENTRY_CARPET_PHASE130";
  add(root, new THREE.Mesh(new THREE.BoxGeometry(7.9, .035, .10), gold), 0, .085, .38);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.10, .04, 3.2), purple), -3.9, .10, 1.85);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.10, .04, 3.2), purple), 3.9, .10, 1.85);

  const halo = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.34, 80), new THREE.MeshBasicMaterial({ color: 0xffd77b, transparent: true, opacity: .42, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.name = "LOUNGE_HUB_PORTAL_MARKER_PHASE130";
  halo.rotation.x = -Math.PI / 2;
  halo.renderOrder = 179999;
  add(root, halo, 0, .105, 1.58);

  add(root, new THREE.PointLight(0xffd77b, 2.0, 10, 2), 0, 4.6, 1.0);
  add(root, new THREE.PointLight(0x71f7ff, 1.35, 9, 2), -3.8, 3.2, .9);
  add(root, new THREE.PointLight(0xff4fd8, 1.15, 9, 2), 3.8, 3.2, .9);

  scene.add(root);
  const portal = findLoungePortal(scene);
  if(portal){
    portal.position.copy(LOUNGE_POS);
    portal.userData.phase130LoungeStorefrontAligned = true;
  }
  scene.userData.phase130LoungeStorefrontHub = root;
  console.log(`[${PHASE130}] installed at lounge portal`, LOUNGE_POS);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrLoungeStorefrontHubPhase130){
  THREE.WebGLRenderer.prototype.__svrLoungeStorefrontHubPhase130 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>install(lastScene), 1000);
console.log(`[${PHASE130}] loaded`);
