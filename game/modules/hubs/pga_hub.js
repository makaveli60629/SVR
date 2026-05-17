import * as THREE from "three";

const PGA_HUB_BUILD = "PGA-WIDE-READABLE-2026-05-17";

function canvasTexture(draw, w = 1800, h = 1000){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
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

function wrap(ctx, text, x, y, max, lh){
  const words = String(text).split(/\s+/);
  let line = "";
  let yy = y;
  for (const word of words){
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > max && line){ ctx.fillText(line, x, yy); line = word; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

function profileTexture(){
  return canvasTexture((ctx, w, h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#120609"); g.addColorStop(.58,"#230910"); g.addColorStop(1,"#050507");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#ff4054"; ctx.lineWidth = 18; rr(ctx,28,28,w-56,h-56,40); ctx.stroke();

    ctx.fillStyle = "rgba(255,64,84,.20)"; rr(ctx,62,56,w-124,116,26); ctx.fill();
    ctx.fillStyle = "#ff8b96"; ctx.font = "900 46px Arial"; ctx.fillText("PGA GOLF HUB • LESSONS • TRAINING", 96, 130);

    ctx.fillStyle = "#fff"; ctx.font = "900 92px Arial"; ctx.fillText("JUAN E. ESPEJO", 96, 270);
    ctx.fillStyle = "#ffd1d7"; ctx.font = "800 44px Arial"; ctx.fillText("PGA Pro • Maryville Golf Academy Founder", 96, 342);

    ctx.fillStyle = "rgba(255,255,255,.085)"; rr(ctx,76,405,w-152,230,28); ctx.fill();
    ctx.strokeStyle = "rgba(255,128,144,.52)"; ctx.lineWidth = 5; rr(ctx,76,405,w-152,230,28); ctx.stroke();
    ctx.fillStyle = "#ff8b96"; ctx.font = "900 42px Arial"; ctx.fillText("ABOUT", 112, 475);
    ctx.fillStyle = "#fff"; ctx.font = "700 36px Arial";
    wrap(ctx,"Professional golf training storefront for lessons, academy promotion, sponsor media, and private PGA range access.",112,535,w-224,48);

    ctx.fillStyle = "rgba(255,255,255,.085)"; rr(ctx,76,685,w-152,230,28); ctx.fill();
    ctx.strokeStyle = "rgba(255,128,144,.52)"; ctx.lineWidth = 5; rr(ctx,76,685,w-152,230,28); ctx.stroke();
    ctx.fillStyle = "#ff8b96"; ctx.font = "900 42px Arial"; ctx.fillText("TRAINING FOCUS", 112, 755);
    ctx.fillStyle = "#fff"; ctx.font = "800 36px Arial";
    ["Private instruction","Group lessons","Beginner fundamentals","Player development"].forEach((v,i)=>ctx.fillText("• " + v,126,820+i*48));
  }, 1800, 1000);
}

function headerTexture(){
  return canvasTexture((ctx,w,h)=>{
    ctx.fillStyle = "#100609"; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "rgba(255,208,214,.9)"; ctx.lineWidth = 10; rr(ctx,18,18,w-36,h-36,24); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff"; ctx.font = "900 96px Arial"; ctx.fillText("JUAN ESPEJO PGA HUB",w/2,92);
    ctx.fillStyle = "#ffb0ba"; ctx.font = "800 36px Arial"; ctx.fillText("GOLF LESSONS • TRAINING • ACADEMY • SPONSOR SHOWCASE",w/2,178);
  }, 1900, 230);
}

function reserveTexture(){
  return canvasTexture((ctx,w,h)=>{
    ctx.fillStyle = "#240307"; rr(ctx,0,0,w,h,26); ctx.fill();
    ctx.strokeStyle = "#ff4a59"; ctx.lineWidth = 10; rr(ctx,10,10,w-20,h-20,24); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff8b96"; ctx.font = "900 44px Arial"; ctx.fillText("RESERVED",w/2,82);
    ctx.fillStyle = "#fff"; ctx.font = "900 58px Arial"; ctx.fillText("JUAN ESPEJO",w/2,160);
  }, 1100, 240);
}

function portraitTexture(){
  const tex = new THREE.TextureLoader().load("./assets/ui/juan-espejo.jpg");
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

export function addPgaHub(scene, { radius = 26, log = console.log } = {}){
  try {
    const angle = Math.PI * .75;
    const inward = new THREE.Vector3(-Math.cos(angle),0,-Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle),0,Math.cos(angle));
    const group = new THREE.Group();
    group.name = PGA_HUB_BUILD;
    group.position.set(Math.cos(angle)*(radius-.08),0,Math.sin(angle)*(radius-.08));
    group.position.addScaledVector(tangent,-.06);
    group.lookAt(group.position.clone().add(inward));

    const accent = new THREE.MeshStandardMaterial({color:0xff4456,roughness:.18,metalness:.38,emissive:0x6b0c15,emissiveIntensity:.96});
    const wallMat = new THREE.MeshStandardMaterial({color:0x070508,roughness:.66,metalness:.08,emissive:0x14060a,emissiveIntensity:.22,side:THREE.DoubleSide});

    const wall = new THREE.Mesh(new THREE.BoxGeometry(16.2,7.0,.12),wallMat); wall.position.set(0,3.28,-.12); group.add(wall);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(14.8,.08,2.45),new THREE.MeshStandardMaterial({color:0x16090d,roughness:.82,metalness:.06,emissive:0x260b10,emissiveIntensity:.14})); floor.position.set(0,.04,.92); group.add(floor);
    const turf = new THREE.Mesh(new THREE.BoxGeometry(9.5,.04,1.65),new THREE.MeshStandardMaterial({color:0x15572c,roughness:.97})); turf.position.set(.08,.085,.92); group.add(turf);

    const left = new THREE.Mesh(new THREE.BoxGeometry(.18,6.9,.18),accent); left.position.set(-7.8,3.34,1.22); group.add(left);
    const right = left.clone(); right.position.x = 7.8; group.add(right);
    const top = new THREE.Mesh(new THREE.BoxGeometry(15.6,.18,.18),accent); top.position.set(0,6.72,1.22); group.add(top);

    const header = new THREE.Mesh(new THREE.PlaneGeometry(12.2,1.22),new THREE.MeshBasicMaterial({map:headerTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false})); header.position.set(0,5.94,1.34); group.add(header);
    const info = new THREE.Mesh(new THREE.PlaneGeometry(9.7,5.25),new THREE.MeshBasicMaterial({map:profileTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false})); info.position.set(-2.35,3.22,.80); group.add(info);

    const pBack = new THREE.Mesh(new THREE.PlaneGeometry(3.2,3.9),new THREE.MeshBasicMaterial({color:0x0f0709,side:THREE.DoubleSide})); pBack.position.set(5.72,3.26,.88); group.add(pBack);
    const portrait = new THREE.Mesh(new THREE.PlaneGeometry(2.9,3.58),new THREE.MeshBasicMaterial({map:portraitTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false})); portrait.position.set(5.72,3.26,.97); group.add(portrait);
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(5.6,.94),new THREE.MeshBasicMaterial({map:reserveTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false})); plaque.position.set(5.72,1.12,.98); group.add(plaque);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(.09,24,24),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.72})); ball.position.set(-1.8,.17,1.28); group.add(ball);
    const fillA = new THREE.PointLight(0xff4456,5.0,18,2); fillA.position.set(-1,5,1.8); group.add(fillA);
    const fillB = new THREE.PointLight(0xffb0ba,3.6,14,2); fillB.position.set(5.8,5.15,1.95); group.add(fillB);

    scene.add(group);
    const box = new THREE.Box3().setFromObject(group); group.position.y -= box.min.y;
    scene.userData._pgaHub = { group, fillA, fillB, build:PGA_HUB_BUILD };
    return scene.userData._pgaHub;
  } catch (err){ log("[pga_hub] failed", err?.message || err); return null; }
}

export function tickPgaHub(scene, t = 0){
  const hub = scene?.userData?._pgaHub;
  if (!hub) return;
  if (hub.fillA) hub.fillA.intensity = 4.9 + Math.sin(t*1.2)*.22;
  if (hub.fillB) hub.fillB.intensity = 3.5 + Math.sin(t+0.6)*.18;
}
