import * as THREE from "three";

function makeTexture(painter, width = 1024, height = 512){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function createMotherCardTexture({ title = "PORTAL", subtitle = "private scene", status = "READY", color = "#7b2cff" } = {}){
  return makeTexture((ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#07050b");
    g.addColorStop(0.55, "#101018");
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.lineWidth = 8;
    roundRect(ctx, 16, 16, w - 32, h - 32, 26);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 56px Arial";
    ctx.fillText(title, w / 2, 96);
    ctx.fillStyle = "rgba(255,255,255,0.86)";
    ctx.font = "600 28px Arial";
    ctx.fillText(subtitle, w / 2, 158);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(ctx, 118, 198, w - 236, 54, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 26px Arial";
    ctx.fillText(status, w / 2, 226);
  }, 760, 300);
}

export function addMotherCarousel(group, cards = [], {
  y = 1.92,
  z = 1.24,
  cardWidth = 2.18,
  cardHeight = 0.86,
  spread = 2.36
} = {}){
  const count = Math.max(1, cards.length);
  const centerOffset = (count - 1) * spread * 0.5;
  const meshes = [];
  cards.forEach((card, index)=>{
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(cardWidth, cardHeight),
      new THREE.MeshBasicMaterial({
        map: createMotherCardTexture(card),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    mesh.position.set(index * spread - centerOffset, y, z);
    mesh.userData.route = card.route || "";
    mesh.userData.moduleCard = true;
    group.add(mesh);
    meshes.push(mesh);
  });
  return meshes;
}
