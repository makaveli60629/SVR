import * as THREE from "three";

const PGA_DRIVE_URL = "./range.html?v=phase84-pga-drive-from-hub";
const PGA_CHIP_PUTT_URL = "./chip-putt.html?v=phase84-pga-chip-putt-from-hub";

function makeCanvasTexture(painter, width = 1024, height = 1024){
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

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight){
  const words = String(text || "").split(/\s+/);
  let line = "";
  let yy = y;
  for (const word of words){
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line){
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

function titleTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#080406");
    g.addColorStop(1, "#340a12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,225,230,.95)";
    ctx.lineWidth = 12;
    roundRect(ctx, 26, 22, w - 52, h - 44, 28);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff7f9";
    ctx.font = "900 96px Arial";
    ctx.fillText("JUAN ESPEJO PGA HUB", w / 2, 112);
    ctx.fillStyle = "#ffc4cc";
    ctx.font = "800 36px Arial";
    ctx.fillText("GOLF LESSONS • TRAINING • ACADEMY • PRIVATE RANGE PORTALS", w / 2, 188);
  }, 1800, 240);
}

function profileTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#100608");
    grad.addColorStop(.62, "#1b080d");
    grad.addColorStop(1, "#050506");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#ff4054";
    ctx.lineWidth = 14;
    roundRect(ctx, 28, 28, w - 56, h - 56, 34);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,64,84,.16)";
    roundRect(ctx, 62, 54, w - 124, 104, 24);
    ctx.fill();
    ctx.fillStyle = "#ff8995";
    ctx.font = "900 38px Arial";
    ctx.fillText("PGA HUB • PROFESSIONAL GOLF TRAINING", 88, 120);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 72px Arial";
    ctx.fillText("JUAN E. ESPEJO", 88, 226);
    ctx.fillStyle = "#ffd2d8";
    ctx.font = "700 33px Arial";
    ctx.fillText("PGA Pro • Maryville Golf Academy Founder", 88, 284);

    ctx.fillStyle = "#ff8995";
    ctx.font = "900 36px Arial";
    ctx.fillText("DETAILS", 88, 358);
    ctx.fillStyle = "#fff2f4";
    ctx.font = "600 30px Arial";
    let y = drawWrappedText(ctx,
      "Reserved SVR storefront for golf instruction, private lessons, academy promotion, sponsor media, and future VR golf training modules.",
      88, 405, w - 176, 38);

    y += 56;
    ctx.fillStyle = "#ff8995";
    ctx.font = "900 33px Arial";
    ctx.fillText("TRAINING FOCUS", 88, y);
    y += 44;
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 29px Arial";
    [
      "• Driving Range portal",
      "• Chip + Putt portal",
      "• Lessons and fundamentals",
      "• Player development",
      "• Sponsor-ready PGA showcase"
    ].forEach(line => { ctx.fillText(line, 100, y); y += 38; });

    ctx.fillStyle = "rgba(255,255,255,.08)";
    roundRect(ctx, 70, h - 136, w - 140, 82, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,128,144,.58)";
    ctx.lineWidth = 4;
    roundRect(ctx, 70, h - 136, w - 140, 82, 20);
    ctx.stroke();
    ctx.fillStyle = "#ff8995";
    ctx.font = "900 27px Arial";
    ctx.fillText("STEP ON A TELEPORT PAD BELOW", 100, h - 84);
  }, 1500, 940);
}

function reserveTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    ctx.fillStyle = "#240307";
    roundRect(ctx, 0, 0, w, h, 24);
    ctx.fill();
    ctx.strokeStyle = "#ff4a59";
    ctx.lineWidth = 10;
    roundRect(ctx, 10, 10, w - 20, h - 20, 22);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff8995";
    ctx.font = "900 48px Arial";
    ctx.fillText("RESERVED FOR", w / 2, 72);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 64px Arial";
    ctx.fillText("JUAN ESPEJO", w / 2, 145);
  }, 900, 205);
}

function actionTexture(title, subtitle, key, accent){
  return makeCanvasTexture((ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#04120a");
    g.addColorStop(.72, "#090510");
    g.addColorStop(1, "#020305");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    roundRect(ctx, 22, 22, w - 44, h - 44, 28);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 60px Arial";
    ctx.fillText(title, w / 2, 92);
    ctx.fillStyle = accent;
    ctx.font = "900 32px Arial";
    ctx.fillText(subtitle, w / 2, 146);
    ctx.fillStyle = "rgba(255,255,255,.86)";
    ctx.font = "700 25px Arial";
    ctx.fillText(key, w / 2, 192);
  }, 900, 230);
}

function portraitTexture(){
  const tex = new THREE.TextureLoader().load("./assets/ui/juan-espejo.jpg");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function addTeleportPad(group, { x, z, title, subtitle, key, route, url, color, accent }){
  const root = new THREE.Group();
  root.name = `SVR_PGA_TELEPORT_${route}`;
  root.position.set(x, 0.018, z);
  root.userData.svrTeleportRoute = route;
  root.userData.svrTeleportUrl = url;
  group.add(root);

  const pad = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.86, 80),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false })
  );
  pad.rotation.x = -Math.PI / 2;
  root.add(pad);

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  core.rotation.x = -Math.PI / 2;
  root.add(core);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.48, 0.64),
    new THREE.MeshBasicMaterial({ map: actionTexture(title, subtitle, key, accent), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  sign.position.set(0, 0.92, -0.44);
  root.add(sign);

  const glow = new THREE.PointLight(color, 1.25, 4.5, 2.0);
  glow.position.set(0, 0.48, 0);
  root.add(glow);

  return root;
}

export function addPgaHub(scene, { radius = 26, wallHeight = 6.6, log = console.log } = {}){
  try {
    const anchorAngle = Math.PI * 0.75;
    const inward = new THREE.Vector3(-Math.cos(anchorAngle), 0, -Math.sin(anchorAngle));
    const tangent = new THREE.Vector3(-Math.sin(anchorAngle), 0, Math.cos(anchorAngle));
    const wallInset = radius - 0.08;

    const group = new THREE.Group();
    group.name = "SVR_PGA_HUB_READABLE_TELEPORT_LOCK_PHASE84";
    group.position.set(Math.cos(anchorAngle) * wallInset, 0, Math.sin(anchorAngle) * wallInset);
    group.position.addScaledVector(tangent, -0.06);
    group.lookAt(group.position.clone().add(inward));

    const accentMat = new THREE.MeshStandardMaterial({ color: 0xff4456, roughness: 0.18, metalness: 0.38, emissive: 0x6b0c15, emissiveIntensity: 0.92 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x070508, roughness: 0.66, metalness: 0.08, emissive: 0x14060a, emissiveIntensity: 0.20, side: THREE.DoubleSide });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x14090c, roughness: 0.36, metalness: 0.20, emissive: 0x3c1018, emissiveIntensity: 0.30 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12.4, 5.85, 0.12), wallMat);
    backWall.position.set(0, 2.96, -0.12);
    group.add(backWall);

    const floorDeck = new THREE.Mesh(
      new THREE.BoxGeometry(12.2, 0.08, 2.72),
      new THREE.MeshStandardMaterial({ color: 0x16090d, roughness: 0.82, metalness: 0.06, emissive: 0x260b10, emissiveIntensity: 0.14 })
    );
    floorDeck.position.set(0, 0.04, 1.03);
    group.add(floorDeck);

    const turf = new THREE.Mesh(
      new THREE.BoxGeometry(8.8, 0.04, 1.68),
      new THREE.MeshStandardMaterial({ color: 0x15572c, roughness: 0.97, metalness: 0.0, emissive: 0x0a2212, emissiveIntensity: 0.18 })
    );
    turf.position.set(0, 0.09, 1.05);
    group.add(turf);

    const lane = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.024, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x2d9446, roughness: 0.92, metalness: 0.0 })
    );
    lane.position.set(0, 0.105, 0.90);
    group.add(lane);

    const leftColumn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.82, 0.18), accentMat);
    leftColumn.position.set(-6.10, 2.92, 1.20);
    group.add(leftColumn);
    const rightColumn = leftColumn.clone();
    rightColumn.position.x = 6.10;
    group.add(rightColumn);
    const header = new THREE.Mesh(new THREE.BoxGeometry(12.38, 0.18, 0.18), accentMat);
    header.position.set(0, 5.72, 1.20);
    group.add(header);

    const titlePanel = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 1.24),
      new THREE.MeshBasicMaterial({ map: titleTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    titlePanel.position.set(0, 5.23, 1.22);
    group.add(titlePanel);

    const infoBack = new THREE.Mesh(new THREE.BoxGeometry(6.62, 3.88, 0.10), frameMat);
    infoBack.position.set(-2.04, 2.82, 0.12);
    group.add(infoBack);
    const infoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(6.40, 3.68),
      new THREE.MeshBasicMaterial({ map: profileTexture(), side: THREE.DoubleSide, transparent: true, depthWrite: false })
    );
    infoPanel.position.set(-2.04, 2.82, 0.20);
    group.add(infoPanel);

    const portraitFrame = new THREE.Mesh(new THREE.BoxGeometry(2.42, 3.16, 0.12), frameMat);
    portraitFrame.position.set(3.42, 2.92, 0.13);
    group.add(portraitFrame);
    const portrait = new THREE.Mesh(
      new THREE.PlaneGeometry(2.18, 2.90),
      new THREE.MeshBasicMaterial({ map: portraitTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    portrait.position.set(3.42, 2.96, 0.23);
    group.add(portrait);

    const reservePlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(2.82, 0.68),
      new THREE.MeshBasicMaterial({ map: reserveTexture(), side: THREE.DoubleSide, transparent: true, depthWrite: false })
    );
    reservePlaque.position.set(3.42, 1.05, 0.24);
    group.add(reservePlaque);

    const drivePad = addTeleportPad(group, {
      x: -2.22,
      z: 1.92,
      title: "DRIVE RANGE",
      subtitle: "TELEPORT TO PGA GAME PLAY",
      key: "PRIVATE DRIVING RANGE",
      route: "pgaDrive",
      url: PGA_DRIVE_URL,
      color: 0x7dff8a,
      accent: "#7dff8a"
    });
    const chipPad = addTeleportPad(group, {
      x: 2.22,
      z: 1.92,
      title: "CHIP + PUTT",
      subtitle: "TELEPORT TO SHORT GAME",
      key: "PRIVATE CHIP + PUTT ROOM",
      route: "pgaChipPutt",
      url: PGA_CHIP_PUTT_URL,
      color: 0x86e3ff,
      accent: "#86e3ff"
    });

    const fillA = new THREE.PointLight(0xff4456, 3.4, 15, 2.0);
    fillA.position.set(-1.0, 4.55, 1.30);
    group.add(fillA);
    const fillB = new THREE.PointLight(0xffb0ba, 2.2, 12, 2.0);
    fillB.position.set(3.7, 4.5, 1.25);
    group.add(fillB);
    const fillC = new THREE.PointLight(0x73ff97, 1.1, 8, 2.0);
    fillC.position.set(0.0, 0.54, 1.10);
    group.add(fillC);

    const clubStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1.30, 12),
      new THREE.MeshStandardMaterial({ color: 0xcfd5df, roughness: 0.32, metalness: 0.62 })
    );
    clubStem.rotation.z = -0.42;
    clubStem.position.set(-4.88, 1.00, 0.88);
    group.add(clubStem);
    const clubHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.08, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.42, metalness: 0.28 })
    );
    clubHead.rotation.z = -0.42;
    clubHead.position.set(-5.55, 0.22, 1.02);
    group.add(clubHead);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.0 }));
    ball.position.set(-1.25, 0.17, 1.15);
    group.add(ball);

    scene.add(group);
    const box = new THREE.Box3().setFromObject(group);
    group.position.y -= box.min.y;

    scene.userData._pgaHub = { group, drivePad, chipPad, titlePanel, fillA, fillB, fillC, inward, anchorAngle };
    scene.userData.SVR_PGA_HUB_ROUTES = { pgaDrive: PGA_DRIVE_URL, pgaChipPutt: PGA_CHIP_PUTT_URL };
    return scene.userData._pgaHub;
  } catch (err) {
    log("[pga_hub] failed to build", err?.message || err);
    return null;
  }
}

export function tickPgaHub(scene, t = 0){
  const hub = scene?.userData?._pgaHub;
  if (!hub) return;
  for (const padRoot of [hub.drivePad, hub.chipPad]){
    if (!padRoot) continue;
    padRoot.children.forEach((child)=>{
      if (child.isMesh && child.geometry?.type === "RingGeometry" && child.material?.opacity !== undefined){
        child.material.opacity = 0.72 + Math.sin(t * 1.9) * 0.10;
      }
      if (child.isPointLight) child.intensity = 1.05 + Math.sin(t * 1.5) * 0.20;
    });
  }
  if (hub.fillA) hub.fillA.intensity = 3.4 + Math.sin(t * 1.2) * 0.20;
  if (hub.fillB) hub.fillB.intensity = 2.2 + Math.sin(t * 1.0 + 0.6) * 0.12;
  if (hub.fillC) hub.fillC.intensity = 1.1 + Math.sin(t * 1.3 + 1.1) * 0.10;
}

export { PGA_DRIVE_URL, PGA_CHIP_PUTT_URL };
