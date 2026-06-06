import * as THREE from "three";

const PHASE109 = "PHASE-109-PGA-STOREFRONT-PRO-REDESIGN";
let lastScene = null;

function canvasTex(draw, w = 1024, h = 512){
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRect(x, a, b, w, h, r){
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}

function drawPanelBg(x, w, h, accent){
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#03110b");
  g.addColorStop(0.55, "#07180f");
  g.addColorStop(1, "#030504");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = accent;
  x.lineWidth = 10;
  roundRect(x, 18, 18, w - 36, h - 36, 28);
  x.stroke();
}

function headerTexture(){
  return canvasTex((x, w, h)=>{
    drawPanelBg(x, w, h, "#d8b65b");
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#ffffff";
    x.font = "800 86px Arial";
    x.fillText("JUAN ESPEJO PGA HUB", w / 2, 108);
    x.fillStyle = "#d8b65b";
    x.font = "700 34px Arial";
    x.fillText("GOLF LESSONS • TRAINING • ACADEMY • SPONSOR SHOWCASE", w / 2, 184);
  }, 1600, 260);
}

function mainTexture(){
  return canvasTex((x, w, h)=>{
    drawPanelBg(x, w, h, "#78ff9f");
    x.textAlign = "left";
    x.fillStyle = "#d8b65b";
    x.font = "800 44px Arial";
    x.fillText("PREMIUM GOLF TRAINING HUB", 70, 90);
    x.fillStyle = "#ffffff";
    x.font = "800 78px Arial";
    x.fillText("JUAN E. ESPEJO", 70, 178);
    x.fillStyle = "#c8ffd8";
    x.font = "700 34px Arial";
    x.fillText("Private lessons • Academy showcase • VR practice", 74, 232);

    x.fillStyle = "rgba(255,255,255,0.09)";
    roundRect(x, 68, 292, w - 136, 188, 28);
    x.fill();
    x.fillStyle = "#f5fff7";
    x.font = "500 31px Arial";
    x.fillText("Professional storefront for training content, sponsor media, lesson discovery,", 104, 358);
    x.fillText("and direct routes to PGA Drive and Chip + Putt practice scenes.", 104, 406);

    const cards = [
      ["LESSONS", "Private / group coaching"],
      ["ACADEMY", "Player development"],
      ["VR PRACTICE", "Drive + short game routes"]
    ];
    cards.forEach((card, i)=>{
      const bx = 68 + i * 340;
      roundRect(x, bx, 540, 300, 145, 24);
      x.fillStyle = "rgba(120,255,159,0.12)";
      x.fill();
      x.strokeStyle = "rgba(216,182,91,0.75)";
      x.lineWidth = 4;
      roundRect(x, bx, 540, 300, 145, 24);
      x.stroke();
      x.fillStyle = "#d8b65b";
      x.font = "800 30px Arial";
      x.fillText(card[0], bx + 24, 598);
      x.fillStyle = "#ffffff";
      x.font = "500 25px Arial";
      x.fillText(card[1], bx + 24, 642);
    });
  }, 1100, 760);
}

function smallTexture(title, sub, accent){
  return canvasTex((x, w, h)=>{
    drawPanelBg(x, w, h, accent);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#ffffff";
    x.font = "800 58px Arial";
    x.fillText(title, w / 2, 98);
    x.fillStyle = accent;
    x.font = "700 30px Arial";
    x.fillText(sub, w / 2, 156);
    x.fillStyle = "rgba(255,255,255,0.72)";
    x.font = "600 22px Arial";
    x.fillText("CLICK / TAP TO ENTER", w / 2, 210);
  }, 820, 280);
}

function add(parent, mesh, x, y, z){
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function install(scene){
  const hub = scene?.userData?._pgaHub?.group;
  if (!hub || hub.userData.phase109Redesigned) return false;
  hub.userData.phase109Redesigned = true;

  // Hide old cluttered storefront pieces; keep the original parent transform/location.
  hub.children.forEach((o)=>{ o.visible = false; });

  const root = new THREE.Group();
  root.name = "PGA_PRO_STOREFRONT_PHASE109";
  hub.add(root);

  const dark = new THREE.MeshStandardMaterial({ color: 0x030806, roughness: 0.72, metalness: 0.05, emissive: 0x07160d, emissiveIntensity: 0.20 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b65b, roughness: 0.38, metalness: 0.18, emissive: 0x2a1d06, emissiveIntensity: 0.24 });
  const green = new THREE.MeshStandardMaterial({ color: 0x0c5d31, roughness: 0.90, metalness: 0.0, emissive: 0x062515, emissiveIntensity: 0.14 });
  const line = new THREE.MeshStandardMaterial({ color: 0x78ff9f, roughness: 0.40, metalness: 0.10, emissive: 0x0b3a20, emissiveIntensity: 0.38 });

  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.4, 6.8, 0.12), dark), 0, 3.28, -0.13);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.12, 0.16), gold), 0, 6.68, 1.15);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.14, 6.75, 0.16), gold), -6.55, 3.34, 1.15);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(0.14, 6.75, 0.16), gold), 6.55, 3.34, 1.15);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.07, 2.45), dark), 0, 0.04, 0.92);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.035, 1.50), green), 0, 0.10, 0.92);
  add(root, new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.018, 0.08), line), 0, 0.13, 0.92);

  add(root, new THREE.Mesh(new THREE.PlaneGeometry(9.8, 1.25), new THREE.MeshBasicMaterial({ map: headerTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false })), 0, 5.88, 1.22);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.95), new THREE.MeshBasicMaterial({ map: mainTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false })), -2.05, 3.03, 0.18);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.6), new THREE.MeshBasicMaterial({ map: smallTexture("RESERVED", "JUAN ESPEJO", "#d8b65b"), transparent: true, side: THREE.DoubleSide, toneMapped: false })), 4.25, 3.25, 0.19);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.08), new THREE.MeshBasicMaterial({ map: smallTexture("PGA DRIVE", "PRIVATE RANGE", "#78ff9f"), transparent: true, side: THREE.DoubleSide, toneMapped: false })), -3.85, 0.90, 1.22);
  add(root, new THREE.Mesh(new THREE.PlaneGeometry(3.05, 1.08), new THREE.MeshBasicMaterial({ map: smallTexture("CHIP + PUTT", "SHORT GAME", "#d8b65b"), transparent: true, side: THREE.DoubleSide, toneMapped: false })), 3.85, 0.90, 1.22);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 18), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  add(root, cup, 2.72, 0.14, 0.92);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
  add(root, ball, -1.95, 0.17, 1.18);
  const lightA = new THREE.PointLight(0x78ff9f, 1.35, 11, 2.2);
  add(root, lightA, -1.0, 4.8, 1.25);
  const lightB = new THREE.PointLight(0xd8b65b, 0.85, 9, 2.1);
  add(root, lightB, 4.3, 4.8, 1.20);

  console.log(`[${PHASE109}] installed`);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrPgaPhase109Render){
  THREE.WebGLRenderer.prototype.__svrPgaPhase109Render = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene;
    if (lastScene) install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>{ if (lastScene) install(lastScene); }, 1000);
