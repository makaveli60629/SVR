import * as THREE from "three";

const PHASE = "PHASE-140-TEXTURE-FLOOR-RESTORE-NO-SKY-LOCK";

function makeTextureCanvas(){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const base = ctx.createRadialGradient(512, 512, 40, 512, 512, 700);
  base.addColorStop(0.00, "#3a426f");
  base.addColorStop(0.28, "#20294c");
  base.addColorStop(0.58, "#10172e");
  base.addColorStop(1.00, "#050812");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1024);

  // User-style textured floor: stone / carpet grain without large image overhead.
  let seed = 16807;
  const rand = ()=>{
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  for (let i = 0; i < 9000; i++){
    const x = rand() * 1024;
    const y = rand() * 1024;
    const r = 0.6 + rand() * 2.4;
    const a = 0.025 + rand() * 0.060;
    const warm = rand() > 0.52;
    ctx.fillStyle = warm ? `rgba(246,226,127,${a})` : `rgba(127,245,199,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i <= 1024; i += 128){
    ctx.strokeStyle = "rgba(0,245,212,.20)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
  }
  for (let i = 64; i <= 1024; i += 128){
    ctx.strokeStyle = "rgba(180,140,255,.14)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
  }

  ctx.strokeStyle = "rgba(246,226,127,.52)";
  ctx.lineWidth = 11;
  ctx.beginPath(); ctx.arc(512, 512, 378, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(0,245,212,.48)";
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(512, 512, 236, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(255,85,114,.32)";
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(512, 512, 146, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = "rgba(246,226,127,.78)";
  ctx.font = "900 62px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.fillText("SVR", 512, 502);
  ctx.fillStyle = "rgba(127,245,199,.74)";
  ctx.font = "800 29px system-ui, Arial";
  ctx.fillText("TEXTURE FLOOR • TELEPORT SAFE", 512, 548);

  return canvas;
}

function installTextureFloor(){
  const scene = window.SVR_CORE_SCENE || null;
  const root = window.SVR_WORLD_ROOT || scene;
  if (!scene || !root) return false;
  if (root.getObjectByName?.("SVR_PHASE140_TEXTURE_FLOOR_OVERLAY")) return true;

  const tex = new THREE.CanvasTexture(makeTextureCanvas());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.35, 1.35);
  tex.anisotropy = 2;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50.6, 50.6, 1, 1),
    new THREE.MeshBasicMaterial({
      map: tex,
      color: 0xffffff,
      side: THREE.DoubleSide,
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
  floor.name = "SVR_PHASE140_TEXTURE_FLOOR_OVERLAY";
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.014;
  floor.renderOrder = 88;
  floor.userData.svrNoWorldShift = false;
  root.add(floor);

  const safeRing = new THREE.Mesh(
    new THREE.RingGeometry(6.10, 7.45, 96),
    new THREE.MeshBasicMaterial({ color: 0xf6e27f, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false })
  );
  safeRing.name = "SVR_PHASE140_TABLE_SAFE_RING_OVERLAY";
  safeRing.rotation.x = -Math.PI / 2;
  safeRing.position.y = 0.032;
  safeRing.renderOrder = 89;
  root.add(safeRing);

  window.SVR_PHASE140_TEXTURE_FLOOR = {
    phase: PHASE,
    installed: true,
    skyRemoved: true,
    source: "procedural user-style textured floor overlay",
    reason: "restore texture floor while keeping no-sky teleport stability"
  };
  return true;
}

function waitInstall(attempt = 0){
  if (installTextureFloor()) return;
  if (attempt < 80) setTimeout(()=>waitInstall(attempt + 1), 100);
}

waitInstall();
