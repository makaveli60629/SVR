import * as THREE from "three";

const PATCH_NAME = "SVR_Phase98SJ_Lobby_Ads_Portals_Alignment_Lock";

const HUBS = [
  { key:"reiki", title:"REIKI HUB", sub:"hologram showroom", x:20.35, z:-5.15, color:"#7fffd4" },
  { key:"pga", title:"PGA TRAINING", sub:"drive • chip • putt", x:0, z:-9.25, color:"#69e8ff" },
  { key:"store", title:"SVR STORE", sub:"gear • cards • merch", x:-8.65, z:-8.05, color:"#ffd36b" },
  { key:"smoker", title:"SMOKER LOUNGE", sub:"private social room", x:5.6, z:-9.15, color:"#ff8bd7" },
  { key:"scorpion", title:"SCORPION ROOM", sub:"playable poker", x:12.78, z:15.75, color:"#b48cff", yaw:THREE.MathUtils.degToRad(51.78) }
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
  g.addColorStop(0, "rgba(4,9,20,.96)");
  g.addColorStop(1, "rgba(22,6,28,.96)");
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

function addWallStorefront(root, hub) {
  const g = new THREE.Group();
  g.name = `SVR_${hub.key}_Portal_Storefront_Attached`;
  g.position.set(hub.x, 0, hub.z);
  if (hub.yaw !== undefined) g.rotation.y = hub.yaw;
  else g.lookAt(0, 0, 0);
  root.add(g);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 3.3, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x070b12, roughness: 0.68, metalness: 0.18, emissive: 0x071020, emissiveIntensity: 0.26 })
  );
  frame.position.set(0, 1.68, -0.04);
  g.add(frame);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.85, 1.42),
    new THREE.MeshBasicMaterial({ map: signTexture(hub.title, hub.sub, hub.color), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  sign.position.set(0, 2.78, 0.09);
  g.add(sign);

  const portal = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.04, 80),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(hub.color), transparent: true, opacity: 0.70, side: THREE.DoubleSide, depthWrite: false })
  );
  portal.rotation.x = -Math.PI / 2;
  portal.position.set(0, 0.05, 1.05);
  g.add(portal);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(1.02, 80),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(hub.color), transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.04, 1.05);
  g.add(glow);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(4.45, 0.10, 0.16),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(hub.color), roughness: 0.22, metalness: 0.55, emissive: new THREE.Color(hub.color), emissiveIntensity: 0.55 })
  );
  trim.position.set(0, 3.38, 0.04);
  g.add(trim);

  return g;
}

function addLobbyAd(root, title, sub, pos, rotY, w = 7.0, h = 3.1, accent = "#ffd36b") {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: adTexture(title, sub, accent), side: THREE.DoubleSide, transparent: true })
  );
  mesh.position.copy(pos);
  mesh.rotation.y = rotY;
  mesh.name = `SVR_Ad_${title.replace(/\s+/g, "_")}`;
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
  board.name = "SVR_Lobby_Leaderboard_Board";
  root.add(board);

  addLobbyAd(root, "SVR POKER", "WELCOME TO STRATA VR POKER", new THREE.Vector3(0, 7.2, -12.6), 0, 9.4, 3.3, "#b48cff");
  addLobbyAd(root, "ALL IN", "SVRPOKER.COM • PLAY WITH PURPOSE", new THREE.Vector3(-9.5, 7.4, -7.5), Math.PI * 0.25, 6.8, 3.0, "#69e8ff");
  addLobbyAd(root, "ESPRESSO", "WITH CREAM • FEATURED AD", new THREE.Vector3(10.8, 7.0, -8.2), -Math.PI * 0.22, 6.6, 3.0, "#ffb477");
}

export function installLobbyAdsPortalsPatch({ scene }) {
  if (!scene || scene.getObjectByName(PATCH_NAME)) return false;
  const root = new THREE.Group();
  root.name = PATCH_NAME;
  scene.add(root);

  HUBS.forEach((hub) => addWallStorefront(root, hub));
  addBoards(root);

  window.SVR_LOBBY_ADS_PORTALS_PATCH = {
    phase: "98S-J",
    installed: true,
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
