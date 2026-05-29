import * as THREE from "three";

const PHASE110 = "PHASE-110-FORCED-PGA-PREMIUM-STOREFRONT";
let lastScene = null;
let installed = false;

function makeTexture(draw, w = 1200, h = 700){
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
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

function base(ctx, w, h, accent){
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#02100a");
  g.addColorStop(0.55, "#07170f");
  g.addColorStop(1, "#020504");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  rr(ctx, 18, 18, w - 36, h - 36, 28);
  ctx.stroke();
}

function headerTex(){
  return makeTexture((ctx,w,h)=>{
    base(ctx,w,h,"#d8b65b");
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle="#ffffff"; ctx.font="800 88px Arial"; ctx.fillText("JUAN ESPEJO PGA HUB", w/2, 105);
    ctx.fillStyle="#d8b65b"; ctx.font="700 34px Arial"; ctx.fillText("GOLF LESSONS • TRAINING • ACADEMY • SPONSOR SHOWCASE", w/2, 180);
    ctx.fillStyle="#78ff9f"; ctx.font="700 26px Arial"; ctx.fillText("PREMIUM TRAINING STOREFRONT", w/2, 226);
  }, 1600, 280);
}

function mainTex(){
  return makeTexture((ctx,w,h)=>{
    base(ctx,w,h,"#78ff9f");
    ctx.textAlign="left";
    ctx.fillStyle="#d8b65b"; ctx.font="800 44px Arial"; ctx.fillText("PRIVATE GOLF TRAINING", 70, 90);
    ctx.fillStyle="#ffffff"; ctx.font="800 78px Arial"; ctx.fillText("JUAN E. ESPEJO", 70, 178);
    ctx.fillStyle="#c8ffd8"; ctx.font="700 34px Arial"; ctx.fillText("Lessons • Academy • VR practice routes", 74, 232);
    ctx.fillStyle="rgba(255,255,255,0.09)"; rr(ctx,68,292,w-136,188,28); ctx.fill();
    ctx.fillStyle="#f5fff7"; ctx.font="500 31px Arial";
    ctx.fillText("A clean professional hub for lesson discovery, sponsor media,", 104, 358);
    ctx.fillText("training content, and direct access to PGA practice scenes.", 104, 406);
    const cards = [["LESSONS","Private / group coaching"],["ACADEMY","Player development"],["VR PRACTICE","Drive + short game routes"]];
    cards.forEach((c,i)=>{
      const bx = 68 + i * 340;
      rr(ctx,bx,540,300,145,24); ctx.fillStyle="rgba(120,255,159,0.12)"; ctx.fill();
      ctx.strokeStyle="rgba(216,182,91,0.75)"; ctx.lineWidth=4; rr(ctx,bx,540,300,145,24); ctx.stroke();
      ctx.fillStyle="#d8b65b"; ctx.font="800 30px Arial"; ctx.fillText(c[0], bx+24, 598);
      ctx.fillStyle="#ffffff"; ctx.font="500 25px Arial"; ctx.fillText(c[1], bx+24, 642);
    });
  }, 1100, 760);
}

function cardTex(title, sub, accent){
  return makeTexture((ctx,w,h)=>{
    base(ctx,w,h,accent);
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle="#ffffff"; ctx.font="800 58px Arial"; ctx.fillText(title, w/2, 98);
    ctx.fillStyle=accent; ctx.font="700 30px Arial"; ctx.fillText(sub, w/2, 156);
    ctx.fillStyle="rgba(255,255,255,0.72)"; ctx.font="600 22px Arial"; ctx.fillText("CLICK / TAP TO ENTER", w/2, 210);
  }, 820, 280);
}

function add(parent, obj, x, y, z){ obj.position.set(x,y,z); parent.add(obj); return obj; }

function material(color, emissive = 0x000000, intensity = 0){
  return new THREE.MeshStandardMaterial({ color, roughness:0.72, metalness:0.06, emissive, emissiveIntensity:intensity });
}

function hideOldPga(scene){
  if (scene?.userData?._pgaHub?.group) scene.userData._pgaHub.group.visible = false;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toLowerCase();
    if (n.includes("pga") && !n.includes("phase110")) obj.visible = false;
  });
}

function createStorefront(scene){
  if (scene.getObjectByName("PGA_PHASE110_PREMIUM_STOREFRONT")) return true;

  const radius = 25.92;
  const anchorAngle = Math.PI * 0.75;
  const inward = new THREE.Vector3(-Math.cos(anchorAngle), 0, -Math.sin(anchorAngle));
  const tangent = new THREE.Vector3(-Math.sin(anchorAngle), 0, Math.cos(anchorAngle));

  const root = new THREE.Group();
  root.name = "PGA_PHASE110_PREMIUM_STOREFRONT";
  root.position.set(Math.cos(anchorAngle) * radius, 0, Math.sin(anchorAngle) * radius);
  root.position.addScaledVector(tangent, -0.06);
  root.lookAt(root.position.clone().add(inward));

  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.4,6.8,0.14), material(0x030806,0x07160d,.22)), 0,3.28,-0.15);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.2,.14,.18), material(0xd8b65b,0x2a1d06,.24)), 0,6.68,1.15);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.14,6.75,.18), material(0xd8b65b,0x2a1d06,.24)), -6.55,3.34,1.15);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(.14,6.75,.18), material(0xd8b65b,0x2a1d06,.24)), 6.55,3.34,1.15);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(12.4,.07,2.45), material(0x07110b,0x041008,.12)), 0,.04,.92);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(8.2,.035,1.50), material(0x0c5d31,0x062515,.14)), 0,.10,.92);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(5.7,.018,.08), material(0x78ff9f,0x0b3a20,.38)), 0,.13,.92);

  add(root, new THREE.Mesh(new THREE.PlaneGeometry(9.8,1.25), new THREE.MeshBasicMaterial({ map:headerTex(), transparent:true, side:THREE.DoubleSide, toneMapped:false })), 0,5.88,1.24);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(7.2,4.95), new THREE.MeshBasicMaterial({ map:mainTex(), transparent:true, side:THREE.DoubleSide, toneMapped:false })), -2.05,3.03,.20);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(2.7,3.6), new THREE.MeshBasicMaterial({ map:cardTex("RESERVED","JUAN ESPEJO","#d8b65b"), transparent:true, side:THREE.DoubleSide, toneMapped:false })), 4.25,3.25,.21);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(3.05,1.08), new THREE.MeshBasicMaterial({ map:cardTex("PGA DRIVE","PRIVATE RANGE","#78ff9f"), transparent:true, side:THREE.DoubleSide, toneMapped:false })), -3.85,.90,1.24);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(3.05,1.08), new THREE.MeshBasicMaterial({ map:cardTex("CHIP + PUTT","SHORT GAME","#d8b65b"), transparent:true, side:THREE.DoubleSide, toneMapped:false })), 3.85,.90,1.24);

  add(root, new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.05,18), material(0xffffff)), 2.72,.14,.92);
  add(root, new THREE.Mesh(new THREE.SphereGeometry(.085,16,10), material(0xffffff)), -1.95,.17,1.18);
  add(root, new THREE.PointLight(0x78ff9f,1.25,11,2.2), -1,4.8,1.25);
  add(root, new THREE.PointLight(0xd8b65b,.85,9,2.1), 4.3,4.8,1.20);

  scene.add(root);
  return true;
}

function install(scene){
  if (!scene) return false;
  hideOldPga(scene);
  createStorefront(scene);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__pgaPhase110Forced){
  THREE.WebGLRenderer.prototype.__pgaPhase110Forced = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    if (lastScene && !lastScene.userData.phase110PgaDone){
      install(lastScene);
      lastScene.userData.phase110PgaDone = true;
      console.log(PHASE110, "installed");
    }
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ if (lastScene) install(lastScene); }, 2000);
console.log(PHASE110, "loaded");
