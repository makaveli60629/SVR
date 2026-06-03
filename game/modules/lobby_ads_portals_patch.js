import * as THREE from "three";

const PATCH_NAME = "SVR_Phase98SK_Duplicate_Portal_Cleanup_Wall_Fit";

const HUBS = [
  { key:"reiki", title:"REIKI HUB", sub:"hologram showroom", x:20.35, z:-5.15, color:"#7fffd4", wallW:4.9, yaw:THREE.MathUtils.degToRad(90) },
  { key:"pga", title:"PGA TRAINING", sub:"drive • chip • putt", x:0, z:-9.25, color:"#69e8ff", wallW:4.9, yaw:0 },
  { key:"store", title:"SVR STORE", sub:"gear • cards • merch", x:-8.65, z:-8.05, color:"#ffd36b", wallW:4.9, yaw:THREE.MathUtils.degToRad(-28) },
  { key:"smoker", title:"SMOKER LOUNGE", sub:"private social room", x:5.6, z:-9.15, color:"#ff8bd7", wallW:4.9, yaw:THREE.MathUtils.degToRad(18) },
  { key:"scorpion", title:"SCORPION ROOM", sub:"playable poker", x:12.78, z:15.75, color:"#b48cff", wallW:4.9, yaw:THREE.MathUtils.degToRad(51.78) }
];

function makeCanvasTexture(w, h, painter) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  painter(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function drawFrame(ctx, w, h, color) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "rgba(4,9,20,.97)");
  g.addColorStop(1, "rgba(22,6,28,.97)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 44, w - 88, h - 88);
}

function signTexture(title, sub, color = "#7fffd4") {
  return makeCanvasTexture(1024, 512, (ctx, w, h) => {
    drawFrame(ctx, w, h, color);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 74px Arial";
    ctx.fillText(title, w / 2, 190);
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.font = "800 34px Arial";
    ctx.fillText(sub, w / 2, 308);
  });
}

function adTexture(title, sub, accent = "#ffd36b") {
  return makeCanvasTexture(1600, 720, (ctx, w, h) => {
    drawFrame(ctx, w, h, accent);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 110px Arial";
    ctx.fillText(title, w / 2, 276);
    ctx.shadowBlur = 10;
    ctx.fillStyle = accent;
    ctx.font = "900 54px Arial";
    ctx.fillText(sub, w / 2, 438);
  });
}

function boardTexture() {
  return makeCanvasTexture(1100, 900, (ctx, w, h) => {
    drawFrame(ctx, w, h, "#69e8ff");
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#69e8ff";
    ctx.shadowBlur = 16;
    ctx.font = "900 74px Arial";
    ctx.fillText("LOBBY LEADERBOARD", w/2, 130);
    const rows = ["TOP CASH TABLES", "DAILY TOURNAMENTS", "SCORPION ROOM LIVE", "SPONSOR BONUS WINS", "COMMUNITY GIVEBACK"];
    rows.forEach((row, i) => {
      const y = 260 + i * 112;
      ctx.fillStyle = i % 2 ? "rgba(180,140,255,.92)" : "rgba(105,232,255,.92)";
      ctx.fillRect(120, y - 42, w - 240, 76);
      ctx.fillStyle = "#06101a";
      ctx.font = "900 36px Arial";
      ctx.fillText(row, w/2, y);
    });
  });
}

function worldPositionOf(object) {
  const p = new THREE.Vector3();
  object.getWorldPosition(p);
  return p;
}

function suppressOldPortalClutter(scene) {
  const protectedPrefixes = ["SVR_Phase98", "SVR_Hero_Moon", "SVR_Hero_Mars"];
  scene.traverse((object) => {
    if (!object.isMesh || !object.visible) return;
    const name = String(object.name || "");
    if (protectedPrefixes.some(prefix => name.startsWith(prefix))) return;
    const p = worldPositionOf(object);
    for (const hub of HUBS) {
      const d = Math.hypot(p.x - hub.x, p.z - hub.z);
      const nearFloorPortal = d < 1.85 && p.y < 1.2;
      const nearOldSign = d < 2.45 && p.y > 1.1 && p.y < 3.8;
      const isLikelyOldPortal = /portal|ring|glow|label|logo/i.test(name) || object.geometry?.type === "RingGeometry" || object.geometry?.type === "CircleGeometry";
      if ((nearFloorPortal || nearOldSign) && isLikelyOldPortal) {
        object.visible = false;
      }
    }
  });
}

function addWallStorefront(root, hub) {
  const g = new THREE.Group();
  g.name = `SVR_Phase98SK_${hub.key}_Storefront_WallFit`;
  g.position.set(hub.x, 0, hub.z);
  g.rotation.y = hub.yaw ?? 0;
  root.add(g);

  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(hub.wallW, 3.75, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x060a11, roughness: 0.72, metalness: 0.20, emissive: 0x071020, emissiveIntensity: 0.28 })
  );
  shell.position.set(0, 1.88, -0.18);
  shell.name = `SVR_Phase98SK_${hub.key}_Attached_Backwall`;
  g.add(shell);

  const sideL = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 3.45, 1.22),
    new THREE.MeshStandardMaterial({ color: 0x090f18, roughness: 0.68, metalness: 0.16, emissive: 0x071020, emissiveIntensity: 0.18 })
  );
  sideL.position.set(-(hub.wallW * 0.5) + 0.09, 1.72, 0.38);
  sideL.name = `SVR_Phase98SK_${hub.key}_Left_ReturnWall`;
  g.add(sideL);
  const sideR = sideL.clone();
  sideR.position.x = (hub.wallW * 0.5) - 0.09;
  sideR.name = `SVR_Phase98SK_${hub.key}_Right_ReturnWall`;
  g.add(sideR);

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(hub.wallW + 0.28, 0.18, 1.42),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(hub.color), roughness: 0.18, metalness: 0.50, emissive: new THREE.Color(hub.color), emissiveIntensity: 0.45 })
  );
  canopy.position.set(0, 3.74, 0.30);
  canopy.name = `SVR_Phase98SK_${hub.key}_CanopyTrim`;
  g.add(canopy);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.15, 1.30),
    new THREE.MeshBasicMaterial({ map: signTexture(hub.title, hub.sub, hub.color), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  sign.position.set(0, 2.82, 0.02);
  sign.name = `SVR_Phase98SK_${hub.key}_CleanSign`;
  g.add(sign);

  const portal = new THREE.Mesh(
    new THREE.RingGeometry(0.64, 0.94, 80),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(hub.color), transparent: true, opacity: 0.76, side: THREE.DoubleSide, depthWrite: false })
  );
  portal.rotation.x = -Math.PI / 2;
  portal.position.set(0, 0.052, 0.58);
  portal.name = `SVR_Phase98SK_${hub.key}_PortalRing_InStorefront`;
  g.add(portal);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.96, 80),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(hub.color), transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.045, 0.58);
  glow.name = `SVR_Phase98SK_${hub.key}_PortalGlow_InStorefront`;
  g.add(glow);

  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(hub.wallW + 0.12, 0.10, 1.42),
    new THREE.MeshStandardMaterial({ color: 0x090b12, roughness: 0.82, metalness: 0.08, emissive: 0x080912, emissiveIntensity: 0.10 })
  );
  foot.position.set(0, 0.05, 0.30);
  foot.name = `SVR_Phase98SK_${hub.key}_BaseFoot`;
  g.add(foot);

  return g;
}

function addLobbyAd(root, title, sub, pos, rotY, w = 7.0, h = 3.1, accent = "#ffd36b") {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: adTexture(title, sub, accent), side: THREE.DoubleSide, transparent: true })
  );
  mesh.position.copy(pos);
  mesh.rotation.y = rotY;
  mesh.name = `SVR_Phase98SK_Ad_${title.replace(/\s+/g, "_")}`;
  root.add(mesh);
  return mesh;
}

function addBoards(root) {
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 3.45),
    new THREE.MeshBasicMaterial({ map: boardTexture(), side: THREE.DoubleSide })
  );
  board.position.set(0, 4.0, 10.6);
  board.rotation.y = Math.PI;
  board.name = "SVR_Phase98SK_Lobby_Leaderboard_Board";
  root.add(board);

  addLobbyAd(root, "SVR POKER", "WELCOME TO STRATA VR POKER", new THREE.Vector3(0, 7.2, -12.6), 0, 9.4, 3.3, "#b48cff");
  addLobbyAd(root, "ALL IN", "SVRPOKER.COM • PLAY WITH PURPOSE", new THREE.Vector3(-9.5, 7.4, -7.5), Math.PI * 0.25, 6.8, 3.0, "#69e8ff");
  addLobbyAd(root, "ESPRESSO", "WITH CREAM • FEATURED AD", new THREE.Vector3(10.8, 7.0, -8.2), -Math.PI * 0.22, 6.6, 3.0, "#ffb477");
}

export function installLobbyAdsPortalsPatch({ scene }) {
  if (!scene || scene.getObjectByName(PATCH_NAME)) return false;
  suppressOldPortalClutter(scene);
  const old = scene.getObjectByName("SVR_Phase98SJ_Lobby_Ads_Portals_Alignment_Lock");
  if (old) old.visible = false;

  const root = new THREE.Group();
  root.name = PATCH_NAME;
  scene.add(root);

  HUBS.forEach((hub) => addWallStorefront(root, hub));
  addBoards(root);

  window.SVR_LOBBY_ADS_PORTALS_PATCH = {
    phase: "98S-K",
    installed: true,
    oldOverlayHidden: Boolean(old),
    duplicateSuppression: true,
    hubs: HUBS.map(h => h.key),
    ads: ["SVR Poker welcome", "All In", "Espresso With Cream"],
    leaderboard: true,
    scorpionLockPreserved: "12.78, 1.60, 15.75, yaw 51.78"
  };

  return true;
}

export function autoInstallLobbyAdsPortalsPatch() {
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const scene = window.SVR_SCENE;
    if (scene && installLobbyAdsPortalsPatch({ scene })) window.clearInterval(timer);
    if (attempts > 80) window.clearInterval(timer);
  }, 250);
}

autoInstallLobbyAdsPortalsPatch();
