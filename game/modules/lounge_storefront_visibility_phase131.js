import * as THREE from "three";

const PHASE131_LOUNGE = "PHASE-131-FORCE-VISIBLE-LOUNGE-STOREFRONT";
const LOUNGE_POS = new THREE.Vector3(-15.93, 0, 5.28);
let lastScene = null;
let installed = false;

function makeTexture(){
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 760;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#030307");
  g.addColorStop(.48,"#19091f");
  g.addColorStop(1,"#040306");
  x.fillStyle = g;
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 18;
  x.strokeRect(30,30,c.width-60,c.height-60);
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 7;
  x.strokeRect(75,75,c.width-150,c.height-150);
  x.strokeStyle = "rgba(180,140,255,.82)";
  x.lineWidth = 4;
  x.strokeRect(112,112,c.width-224,c.height-224);

  x.save();
  x.translate(260,382);
  x.shadowColor = "#ffd77b";
  x.shadowBlur = 24;
  x.strokeStyle = "#ffd77b";
  x.lineCap = "round";
  x.lineJoin = "round";
  x.lineWidth = 12;
  x.beginPath();
  x.moveTo(-140,-120); x.lineTo(140,-120); x.lineTo(36,42); x.quadraticCurveTo(0,78,-36,42); x.closePath(); x.stroke();
  x.strokeStyle = "#71f7ff"; x.lineWidth = 8;
  x.beginPath(); x.moveTo(0,78); x.lineTo(0,190); x.stroke();
  x.beginPath(); x.moveTo(-82,190); x.quadraticCurveTo(0,220,82,190); x.stroke();
  x.strokeStyle = "#ff4fd8"; x.lineWidth = 8;
  x.beginPath(); x.moveTo(35,-122); x.bezierCurveTo(100,-190,82,-255,10,-230); x.bezierCurveTo(-58,-198,-22,-145,35,-122); x.stroke();
  x.restore();

  x.textAlign = "left";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 18;
  x.fillStyle = "#fff7e3";
  x.font = "900 104px Arial";
  x.fillText("SVR LOUNGE", 470, 300);
  x.shadowColor = "#ffd77b";
  x.fillStyle = "#ffd77b";
  x.font = "900 48px Arial";
  x.fillText("PRIVATE SOCIAL ROOM", 478, 382);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,.88)";
  x.font = "700 32px Arial";
  x.fillText("Replay talk space • VIP hangout • Quick-select portal", 480, 455);
  x.fillStyle = "#71f7ff";
  x.font = "800 30px Arial";
  x.fillText("FIST TELEPORT LOGO ON MARKER  →  RELEASE TO ENTER", 480, 525);
  x.fillStyle = "rgba(255,215,123,.92)";
  x.font = "900 34px Arial";
  x.fillText("LOUNGE STOREFRONT HUB", 480, 610);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function hideOld(scene){
  [
    "LOUNGE_STOREFRONT_HUB_PHASE130",
    "LOUNGE_STOREFRONT_USER_POSITION_PHASE129",
    "FORCED_VISIBLE_EXECUTIVE_LOUNGE_PHASE128",
    "EXECUTIVE_LOUNGE_STOREFRONT_PHASE127",
    "LOUNGE_PORTAL_HOLOGRAM_PHASE126"
  ].forEach((name)=>{
    const old = scene.getObjectByName(name);
    if(old) old.visible = false;
  });
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hideOld(scene);

  const root = new THREE.Group();
  root.name = "LOUNGE_STOREFRONT_FORCE_VISIBLE_PHASE131";
  root.position.copy(LOUNGE_POS);
  root.lookAt(new THREE.Vector3(0, 2.4, 0));
  root.frustumCulled = false;

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(11.8, 5.9, .24),
    new THREE.MeshBasicMaterial({ color: 0x030307, toneMapped: false, depthWrite: false })
  );
  back.position.set(0, 3.35, .16);
  back.frustumCulled = false;
  root.add(back);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(11.25, 5.45),
    new THREE.MeshBasicMaterial({ map: makeTexture(), side: THREE.DoubleSide, toneMapped: false, depthWrite: false, depthTest: false })
  );
  panel.name = "PHASE131_VISIBLE_LOUNGE_STOREFRONT_PANEL";
  panel.position.set(0, 3.35, -.06);
  panel.renderOrder = 220000;
  panel.frustumCulled = false;
  root.add(panel);

  const carpet = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, .055, 3.4),
    new THREE.MeshBasicMaterial({ color: 0x2a0617, toneMapped: false })
  );
  carpet.name = "PHASE131_LOUNGE_ENTRY_CARPET";
  carpet.position.set(0, .035, 1.65);
  root.add(carpet);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.08, 1.38, 84),
    new THREE.MeshBasicMaterial({ color: 0xffd77b, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.name = "PHASE131_LOUNGE_VISIBLE_PORTAL_MARKER";
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(0, .12, 1.42);
  halo.renderOrder = 219999;
  root.add(halo);

  const glow = new THREE.PointLight(0xffd77b, 2.6, 14, 2);
  glow.position.set(0, 4.2, 1.2);
  root.add(glow);
  const cyan = new THREE.PointLight(0x71f7ff, 1.6, 11, 2);
  cyan.position.set(-3.3, 3.4, 1.0);
  root.add(cyan);

  scene.add(root);
  scene.userData.phase131LoungeStorefront = root;
  console.log(`[${PHASE131_LOUNGE}] installed`, root.position);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrLoungeVisiblePhase131){
  THREE.WebGLRenderer.prototype.__svrLoungeVisiblePhase131 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}
setInterval(()=>install(lastScene),800);
console.log(`[${PHASE131_LOUNGE}] loaded`);
