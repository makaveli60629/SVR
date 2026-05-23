import * as THREE from "three";

const PHASE = "PHASE-141-QUEST-FPS-EMERGENCY-STABILITY-LOCK";
const SIZE = 512;
const CENTER = SIZE / 2;

function makeTextureCanvas(){
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  const base = ctx.createRadialGradient(CENTER, CENTER, 20, CENTER, CENTER, 350);
  base.addColorStop(0.00, "#3a426f");
  base.addColorStop(0.28, "#20294c");
  base.addColorStop(0.58, "#10172e");
  base.addColorStop(1.00, "#050812");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  let seed = 16807;
  const rand = ()=>{
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  for (let i = 0; i < 1800; i++){
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    const r = 0.45 + rand() * 1.4;
    const a = 0.025 + rand() * 0.052;
    const warm = rand() > 0.52;
    ctx.fillStyle = warm ? `rgba(246,226,127,${a})` : `rgba(127,245,199,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i <= SIZE; i += 64){
    ctx.strokeStyle = "rgba(0,245,212,.20)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }
  for (let i = 32; i <= SIZE; i += 64){
    ctx.strokeStyle = "rgba(180,140,255,.13)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }

  ctx.strokeStyle = "rgba(246,226,127,.52)";
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 189, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(0,245,212,.48)";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 118, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,85,114,.32)";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(CENTER, CENTER, 73, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = "rgba(246,226,127,.78)";
  ctx.font = "900 35px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.fillText("SVR", CENTER, CENTER - 5);
  ctx.fillStyle = "rgba(127,245,199,.74)";
  ctx.font = "800 16px system-ui, Arial";
  ctx.fillText("QUEST SAFE TEXTURE FLOOR", CENTER, CENTER + 22);

  return canvas;
}

function installTextureFloor(){
  const scene = window.SVR_CORE_SCENE || null;
  const root = window.SVR_WORLD_ROOT || scene;
  if (!scene || !root) return false;
  if (root.getObjectByName?.("SVR_PHASE141_TEXTURE_FLOOR_OVERLAY")) return true;

  const old = root.getObjectByName?.("SVR_PHASE140_TEXTURE_FLOOR_OVERLAY");
  if (old?.parent) old.parent.remove(old);

  const tex = new THREE.CanvasTexture(makeTextureCanvas());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.15, 1.15);
  tex.anisotropy = 1;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50.6, 50.6, 1, 1),
    new THREE.MeshBasicMaterial({
      map: tex,
      color: 0xffffff,
      side: THREE.FrontSide,
      transparent: false,
      depthWrite: true,
      depthTest: true,
      fog: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -12,
      polygonOffsetUnits: -12
    })
  );
  floor.name = "SVR_PHASE141_TEXTURE_FLOOR_OVERLAY";
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.014;
  floor.renderOrder = 88;
  root.add(floor);

  const safeRing = new THREE.Mesh(
    new THREE.RingGeometry(6.10, 7.45, 64),
    new THREE.MeshBasicMaterial({ color: 0xf6e27f, transparent: true, opacity: .18, side: THREE.FrontSide, depthWrite: false, fog: false, toneMapped: false })
  );
  safeRing.name = "SVR_PHASE141_TABLE_SAFE_RING_OVERLAY";
  safeRing.rotation.x = -Math.PI / 2;
  safeRing.position.y = 0.032;
  safeRing.renderOrder = 89;
  root.add(safeRing);

  window.SVR_PHASE141_TEXTURE_FLOOR = {
    phase: PHASE,
    installed: true,
    size: SIZE,
    skyRemoved: true,
    source: "512 procedural Quest-safe textured floor overlay",
    reason: "restore texture floor while lowering VRAM and frame cost"
  };
  return true;
}

function waitInstall(attempt = 0){
  if (installTextureFloor()) return;
  if (attempt < 80) setTimeout(()=>waitInstall(attempt + 1), 100);
}

waitInstall();
