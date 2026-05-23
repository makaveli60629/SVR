import * as THREE from "three";

const PHASE = "PHASE-145-GRAPHICS-CONTRAST-NO-MUSIC-TELEPORT-ALIGNMENT-LOCK";
const SIZE = 1024;
const CENTER = SIZE / 2;

function makeTextureCanvas(){
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  const base = ctx.createLinearGradient(0,0,SIZE,SIZE);
  base.addColorStop(0.00, "#0a1028");
  base.addColorStop(0.35, "#111a3f");
  base.addColorStop(0.70, "#060a19");
  base.addColorStop(1.00, "#02030a");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Crisp lobby tile pattern: high-contrast but not noisy/grainy.
  ctx.lineCap = "square";
  for (let i = 0; i <= SIZE; i += 128){
    ctx.strokeStyle = "rgba(0,245,212,.50)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }
  for (let i = 64; i <= SIZE; i += 128){
    ctx.strokeStyle = "rgba(180,140,255,.30)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }

  // Subtle stone/carpet texture without random grain blur.
  for (let y = 0; y < SIZE; y += 32){
    ctx.fillStyle = y % 64 === 0 ? "rgba(255,255,255,.022)" : "rgba(0,0,0,.035)";
    ctx.fillRect(0, y, SIZE, 16);
  }

  ctx.strokeStyle = "rgba(246,226,127,.90)";
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 380, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(0,255,204,.82)";
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 236, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,85,114,.60)";
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 146, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = "#f6e27f";
  ctx.font = "900 72px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.fillText("SVR", CENTER, CENTER - 12);
  ctx.fillStyle = "#7ff5c7";
  ctx.font = "900 27px system-ui, Arial";
  ctx.fillText("SHARP LOBBY FLOOR", CENTER, CENTER + 34);

  return canvas;
}

function installTextureFloor(){
  const scene = window.SVR_CORE_SCENE || null;
  const root = window.SVR_WORLD_ROOT || scene;
  if (!scene || !root) return false;
  if (root.getObjectByName?.("SVR_PHASE145_SHARP_TEXTURE_FLOOR_OVERLAY")) return true;

  ["SVR_PHASE141_TEXTURE_FLOOR_OVERLAY", "SVR_PHASE140_TEXTURE_FLOOR_OVERLAY"].forEach((name)=>{
    const old = root.getObjectByName?.(name);
    if (old?.parent) old.parent.remove(old);
  });

  const tex = new THREE.CanvasTexture(makeTextureCanvas());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.anisotropy = 4;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50.6, 50.6, 1, 1),
    new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, side: THREE.FrontSide, transparent: false, depthWrite: true, depthTest: true, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -12, polygonOffsetUnits: -12 })
  );
  floor.name = "SVR_PHASE145_SHARP_TEXTURE_FLOOR_OVERLAY";
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.014;
  floor.renderOrder = 88;
  root.add(floor);

  const safeRing = new THREE.Mesh(
    new THREE.RingGeometry(6.10, 7.45, 96),
    new THREE.MeshBasicMaterial({ color: 0xf6e27f, transparent: true, opacity: .34, side: THREE.FrontSide, depthWrite: false, fog: false, toneMapped: false })
  );
  safeRing.name = "SVR_PHASE145_TABLE_SAFE_RING_OVERLAY";
  safeRing.rotation.x = -Math.PI / 2;
  safeRing.position.y = 0.032;
  safeRing.renderOrder = 89;
  root.add(safeRing);

  window.SVR_PHASE145_TEXTURE_FLOOR = { phase: PHASE, installed: true, size: SIZE, style: "sharp high-contrast no-grain texture floor", reason: "user reported grainy/blurry geometry" };
  return true;
}

function waitInstall(attempt = 0){
  if (installTextureFloor()) return;
  if (attempt < 80) setTimeout(()=>waitInstall(attempt + 1), 100);
}

waitInstall();
