import * as THREE from "three";

const PHASE161_LOUNGE = "PHASE-161-LOUNGE-STOREFRONT-AT-PORTAL";
let lastScene = null;
let installed = false;
const fallbackPos = new THREE.Vector3(-15.93, 0, 5.28);

function makeTexture(){
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 760;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#020205");
  g.addColorStop(.44,"#1a0a20");
  g.addColorStop(1,"#040306");
  x.fillStyle = g;
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 20;
  x.strokeRect(30,30,c.width-60,c.height-60);
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 8;
  x.strokeRect(78,78,c.width-156,c.height-156);
  x.strokeStyle = "rgba(180,140,255,.86)";
  x.lineWidth = 4;
  x.strokeRect(116,116,c.width-232,c.height-232);

  x.save();
  x.translate(265,385);
  x.shadowColor = "#ffd77b";
  x.shadowBlur = 26;
  x.strokeStyle = "#ffd77b";
  x.lineCap = "round";
  x.lineJoin = "round";
  x.lineWidth = 13;
  x.beginPath();
  x.moveTo(-145,-120); x.lineTo(145,-120); x.lineTo(42,44); x.quadraticCurveTo(0,82,-42,44); x.closePath(); x.stroke();
  x.strokeStyle = "#71f7ff"; x.lineWidth = 8;
  x.beginPath(); x.moveTo(0,82); x.lineTo(0,195); x.stroke();
  x.beginPath(); x.moveTo(-86,195); x.quadraticCurveTo(0,226,86,195); x.stroke();
  x.strokeStyle = "#ff4fd8"; x.lineWidth = 8;
  x.beginPath(); x.moveTo(38,-122); x.bezierCurveTo(105,-192,86,-258,12,-232); x.bezierCurveTo(-58,-198,-24,-145,38,-122); x.stroke();
  x.restore();

  x.textAlign = "left";
  x.textBaseline = "middle";
  x.shadowColor = "#71f7ff";
  x.shadowBlur = 18;
  x.fillStyle = "#fff7e3";
  x.font = "900 108px Arial";
  x.fillText("THE LOUNGE", 475, 284);
  x.shadowColor = "#ffd77b";
  x.fillStyle = "#ffd77b";
  x.font = "900 48px Arial";
  x.fillText("SVR PRIVATE SOCIAL ROOM", 478, 370);
  x.shadowBlur = 0;
  x.fillStyle = "rgba(255,255,255,.88)";
  x.font = "700 32px Arial";
  x.fillText("Replay talk space • VIP hangout • Storefront portal", 480, 450);
  x.fillStyle = "#71f7ff";
  x.font = "800 30px Arial";
  x.fillText("HOLD FIST / GRIP / A  →  AIM MARKER  →  RELEASE", 480, 522);
  x.fillStyle = "rgba(255,215,123,.95)";
  x.font = "900 34px Arial";
  x.fillText("LOCATED AT LOUNGE PORTAL", 480, 608);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}

function hideOld(scene){
  [
    "LOUNGE_STOREFRONT_FORCE_VISIBLE_PHASE131",
    "LOUNGE_STOREFRONT_HUB_PHASE130",
    "LOUNGE_STOREFRONT_USER_POSITION_PHASE129",
    "FORCED_VISIBLE_EXECUTIVE_LOUNGE_PHASE128",
    "EXECUTIVE_LOUNGE_STOREFRONT_PHASE127",
    "LOUNGE_PORTAL_HOLOGRAM_PHASE126"
  ].forEach((name)=>{ const old = scene.getObjectByName(name); if(old) old.visible = false; });
}

function findPortalPosition(scene){
  let best = null;
  scene.traverse((obj)=>{
    const key = String(obj?.userData?.portalKey || obj?.name || "").toLowerCase();
    if(/smokerlounge|smoker_lounge|lounge/.test(key)){
      const p = new THREE.Vector3();
      obj.getWorldPosition(p);
      if(!best || p.distanceTo(fallbackPos) < best.distanceTo(fallbackPos)) best = p;
    }
  });
  return best || fallbackPos.clone();
}

function makeColumn(x,z,color=0xd3a13b){
  const root = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,4.5,18), new THREE.MeshBasicMaterial({ color, toneMapped:false }));
  col.position.set(x,2.35,z);
  root.add(col);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.16,18,10), new THREE.MeshBasicMaterial({ color:0x71f7ff, toneMapped:false }));
  cap.position.set(x,4.72,z);
  root.add(cap);
  return root;
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hideOld(scene);
  const portalPos = findPortalPosition(scene);

  const root = new THREE.Group();
  root.name = "LOUNGE_STOREFRONT_AT_PORTAL_PHASE161";
  root.position.copy(portalPos);
  root.lookAt(new THREE.Vector3(0,2.3,0));
  root.frustumCulled = false;

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(10.4,5.6,.22),
    new THREE.MeshBasicMaterial({ color:0x030307, toneMapped:false, depthWrite:false })
  );
  back.name = "PHASE161_LOUNGE_BACK_FRAME";
  back.position.set(0,3.25,.12);
  root.add(back);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(9.85,5.08),
    new THREE.MeshBasicMaterial({ map:makeTexture(), side:THREE.DoubleSide, toneMapped:false, depthWrite:false, depthTest:false })
  );
  panel.name = "PHASE161_LOUNGE_STOREFRONT_PANEL_AT_PORTAL";
  panel.position.set(0,3.25,-.055);
  panel.renderOrder = 230000;
  root.add(panel);

  const carpet = new THREE.Mesh(new THREE.BoxGeometry(6.6,.055,3.2), new THREE.MeshBasicMaterial({ color:0x280518, toneMapped:false }));
  carpet.name = "PHASE161_LOUNGE_ENTRY_CARPET_AT_PORTAL";
  carpet.position.set(0,.035,1.5);
  root.add(carpet);

  const portalRing = new THREE.Mesh(
    new THREE.RingGeometry(1.06,1.40,84),
    new THREE.MeshBasicMaterial({ color:0xffd77b, transparent:true, opacity:.70, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })
  );
  portalRing.name = "PHASE161_LOUNGE_PORTAL_MARKER_AT_STOREFRONT";
  portalRing.rotation.x = -Math.PI/2;
  portalRing.position.set(0,.12,1.26);
  portalRing.renderOrder = 229999;
  root.add(portalRing);

  root.add(makeColumn(-5.05,.08,0xd3a13b));
  root.add(makeColumn(5.05,.08,0xd3a13b));
  const glow = new THREE.PointLight(0xffd77b,2.0,10,2); glow.position.set(0,4.1,1.0); root.add(glow);
  const cyan = new THREE.PointLight(0x71f7ff,1.25,9,2); cyan.position.set(-3.1,3.3,1.0); root.add(cyan);

  scene.add(root);
  scene.userData.phase161LoungeStorefront = root;
  console.log(`[${PHASE161_LOUNGE}] installed at lounge portal`, portalPos);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrLoungeVisiblePhase161){
  THREE.WebGLRenderer.prototype.__svrLoungeVisiblePhase161 = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this,scene,camera);
  };
}
setInterval(()=>install(lastScene),800);
console.log(`[${PHASE161_LOUNGE}] loaded`);
