import * as THREE from "three";

const LABEL = "PHASE-167-FBX-TABLE-FELT-PASSLINE-LOGO-LOCK";
const GROUP = "PHASE167_FBX_TABLE_FELT_PASSLINE_LOGO_LOCK";
const SAFE_FBX_NAMES = [
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED"
];
const LOGO_URLS = [
  "/logo.png",
  "/logo.webp",
  "./assets/ui/logo.png",
  "./ui/logo.png"
];

let logoImagePromise = null;
let lastInstall = null;

function sceneRoot(scene){
  return scene?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
}
function findFbx(root){
  for(const name of SAFE_FBX_NAMES){
    const obj = root?.getObjectByName?.(name);
    if(obj) return obj;
  }
  return null;
}
function loadImage(url){
  return new Promise(resolve=>{
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
async function loadLogo(){
  if(logoImagePromise) return logoImagePromise;
  logoImagePromise = (async()=>{
    for(const url of LOGO_URLS){
      const img = await loadImage(url);
      if(img) return { img, url };
    }
    return null;
  })();
  return logoImagePromise;
}
function drawFeltTexture(logoRec){
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const x = c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);

  const cx = c.width/2;
  const cy = c.height/2;
  const rx = c.width*0.455;
  const ry = c.height*0.405;

  x.save();
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
  x.clip();

  const g = x.createRadialGradient(cx, cy, 40, cx, cy, rx);
  g.addColorStop(0, "#0c4a2a");
  g.addColorStop(0.48, "#08371f");
  g.addColorStop(1, "#03180f");
  x.fillStyle = g;
  x.fillRect(0,0,c.width,c.height);

  x.globalAlpha = 0.10;
  for(let i=0;i<9000;i++){
    const px = Math.random()*c.width;
    const py = Math.random()*c.height;
    x.fillStyle = Math.random() > 0.5 ? "#bfffd2" : "#00190d";
    x.fillRect(px, py, Math.random()*2.4+0.4, 1);
  }
  x.globalAlpha = 1;

  x.strokeStyle = "rgba(255,255,255,0.48)";
  x.lineWidth = 8;
  x.setLineDash([34,18]);
  x.beginPath();
  x.ellipse(cx, cy, rx*0.76, ry*0.69, 0, 0, Math.PI*2);
  x.stroke();
  x.setLineDash([]);

  x.strokeStyle = "rgba(255,216,122,0.92)";
  x.lineWidth = 13;
  x.beginPath();
  x.ellipse(cx, cy, rx*0.86, ry*0.78, 0, 0, Math.PI*2);
  x.stroke();

  x.strokeStyle = "rgba(255,255,255,0.80)";
  x.lineWidth = 5;
  x.beginPath();
  x.ellipse(cx, cy, rx*0.70, ry*0.62, 0, 0, Math.PI*2);
  x.stroke();

  x.fillStyle = "rgba(255,216,122,0.95)";
  x.font = "900 42px system-ui, Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("PASS LINE", cx, cy - ry*0.66);
  x.fillText("PASS LINE", cx, cy + ry*0.66);

  if(logoRec?.img){
    const size = Math.min(c.width, c.height)*0.26;
    x.globalAlpha = 0.92;
    x.drawImage(logoRec.img, cx-size/2, cy-size/2, size, size);
    x.globalAlpha = 1;
  }else{
    x.fillStyle = "rgba(127,252,255,0.90)";
    x.font = "900 96px system-ui, Arial";
    x.fillText("SVR", cx, cy - 18);
    x.fillStyle = "rgba(255,216,122,0.90)";
    x.font = "800 44px system-ui, Arial";
    x.fillText("POKER", cx, cy + 64);
  }

  x.restore();

  x.strokeStyle = "rgba(255,216,122,0.55)";
  x.lineWidth = 18;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
  x.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
function removeOld(root){
  const old = root?.getObjectByName?.(GROUP);
  if(old) old.parent?.remove(old);
}
async function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const root = sceneRoot(scene);
  const fbx = findFbx(root);
  if(!root || !fbx) return false;

  fbx.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fbx);
  if(!Number.isFinite(box.max.y)) return false;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const logoRec = await loadLogo();
  removeOld(root);

  const tex = drawFeltTexture(logoRec);
  const feltW = Math.max(1.2, Math.min(size.x*0.86, 4.65));
  const feltD = Math.max(0.75, Math.min(size.z*0.78, 2.55));
  const group = new THREE.Group();
  group.name = GROUP;
  group.position.set(center.x, box.max.y + 0.024, center.z);

  const felt = new THREE.Mesh(
    new THREE.PlaneGeometry(feltW, feltD),
    new THREE.MeshBasicMaterial({ map: tex, transparent:true, side:THREE.DoubleSide, depthWrite:false, alphaTest:0.03 })
  );
  felt.name = "PHASE167_VISIBLE_GREEN_FELT_PASSLINE_SITE_LOGO_SURFACE";
  felt.rotation.x = -Math.PI/2;
  felt.renderOrder = 1670;
  group.add(felt);
  root.add(group);

  lastInstall = {
    build: LABEL,
    active: true,
    fbxTable: fbx.name,
    feltVisible: true,
    passLineVisible: true,
    siteLogoVisible: !!logoRec?.img,
    logoUrl: logoRec?.url || "canvas-text-fallback",
    fakeTableCreated: false,
    surfaceOnly: true,
    size: { x:+feltW.toFixed(3), z:+feltD.toFixed(3) },
    position: { x:+group.position.x.toFixed(3), y:+group.position.y.toFixed(3), z:+group.position.z.toFixed(3) },
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE167_FBX_TABLE_FELT_PASSLINE_LOGO_LOCK = lastInstall;
  window.SVR_RUN_PHASE167_TABLE_AUDIT = () => window.SVR_PHASE167_FBX_TABLE_FELT_PASSLINE_LOGO_LOCK;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  return true;
}

[300,900,1800,3500,6500,10000].forEach(ms=>setTimeout(()=>install(),ms));
setInterval(()=>install(),6000);
install();
