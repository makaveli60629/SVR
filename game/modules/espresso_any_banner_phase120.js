import * as THREE from "three";

const PHASE120 = "PHASE-120-ESPRESSO-ON-ANY-VISIBLE-BANNER";
let lastScene = null;
let applied = false;

function makeTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#190506");
  g.addColorStop(0.55, "#080102");
  g.addColorStop(1, "#2a1506");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 18;
  x.strokeRect(20, 20, 984, 472);
  x.strokeStyle = "rgba(255,215,123,.70)";
  x.lineWidth = 4;
  x.strokeRect(42, 42, 940, 428);
  x.fillStyle = "#e41414";
  x.fillRect(58, 56, 172, 48);
  x.fillStyle = "#fff";
  x.font = "900 30px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("1ST TIER", 144, 80);

  const wood = x.createLinearGradient(54, 120, 400, 440);
  wood.addColorStop(0, "#c88a3d");
  wood.addColorStop(0.55, "#e8bf73");
  wood.addColorStop(1, "#8e5524");
  x.fillStyle = wood;
  x.fillRect(54, 124, 370, 310);
  x.strokeStyle = "#f1b958";
  x.lineWidth = 6;
  x.strokeRect(54, 124, 370, 310);
  x.fillStyle = "#fff8e8";
  x.beginPath();
  x.ellipse(240, 358, 145, 46, 0, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.ellipse(240, 245, 135, 72, 0, 0, Math.PI * 2);
  x.fill();
  const crema = x.createRadialGradient(235, 226, 12, 235, 226, 118);
  crema.addColorStop(0, "#ffe4a4");
  crema.addColorStop(0.45, "#d98b35");
  crema.addColorStop(1, "#6d2b08");
  x.fillStyle = crema;
  x.beginPath();
  x.ellipse(240, 226, 115, 56, 0, 0, Math.PI * 2);
  x.fill();

  x.textAlign = "left";
  x.fillStyle = "#fff7e3";
  x.font = "900 84px Arial";
  x.fillText("ESPRESSO", 465, 190);
  x.fillStyle = "#ffd77b";
  x.font = "900 72px Arial";
  x.fillText("WITH CREAM", 465, 274);
  x.fillStyle = "#fff";
  x.font = "900 30px Arial";
  x.fillText("SVR LOBBY WALL AD", 470, 330);
  x.fillStyle = "rgba(255,255,255,.78)";
  x.font = "700 23px Arial";
  x.fillText("REAL PHOTO AD TEXTURE • TOP SPONSOR BANNER", 470, 370);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function findSign(group){
  let best = null;
  group.traverse((o)=>{
    if (best || !o?.isMesh) return;
    if (!/PlaneGeometry/.test(String(o.geometry?.type || ""))) return;
    const box = new THREE.Box3().setFromObject(o);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.x > 1.0 && size.y > 0.35) best = o;
  });
  return best;
}

function apply(scene){
  if (!scene || applied) return false;
  const tex = makeTexture();
  let count = 0;
  scene.traverse((obj)=>{
    const name = String(obj?.name || "");
    if (!(obj?.userData?.portalKey || /^PORTAL_/.test(name))) return;
    const sign = findSign(obj);
    if (!sign) return;
    sign.material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false });
    sign.renderOrder = 99999;
    sign.frustumCulled = false;
    if (!obj.getObjectByName("PHASE120_ESPRESSO_LARGE_PANEL")){
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 1.8),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
      );
      panel.name = "PHASE120_ESPRESSO_LARGE_PANEL";
      panel.position.set(0, 2.7, -0.13);
      panel.renderOrder = 100000;
      panel.frustumCulled = false;
      obj.add(panel);
    }
    count++;
  });

  if (!scene.getObjectByName("PHASE120_ESPRESSO_FLOATING_FALLBACK")){
    const fb = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 2.8),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false, depthTest: false, depthWrite: false })
    );
    fb.name = "PHASE120_ESPRESSO_FLOATING_FALLBACK";
    fb.position.set(-5.4, 3.8, -6.2);
    fb.lookAt(new THREE.Vector3(0, 2, 0));
    fb.renderOrder = 100001;
    fb.frustumCulled = false;
    scene.add(fb);
  }

  applied = true;
  scene.userData.phase120EspressoBannerCount = count;
  console.log(`[${PHASE120}] applied`, count);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrEspressoAnyBanner120){
  THREE.WebGLRenderer.prototype.__svrEspressoAnyBanner120 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    apply(lastScene);
    return originalRender.call(this, scene, camera);
  };
}
setInterval(()=>apply(lastScene), 800);
console.log(`[${PHASE120}] loaded`);
