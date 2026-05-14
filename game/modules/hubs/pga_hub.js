import * as THREE from "three";

const PHASE90_BUILD = "PHASE-90-PGA-HUB-PRO-STORE-PORTAL-LOCK";
const PGA_DRIVE_URL = "./range.html?v=phase90-pga-drive-from-hub";
const PGA_CHIP_PUTT_URL = "./chip-putt.html?v=phase90-pga-chip-putt-from-hub";

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

function wrappedText(ctx, text, x, y, maxWidth, lineHeight){
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

function headerTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0c0507");
    g.addColorStop(.6, "#23070c");
    g.addColorStop(1, "#070306");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#ff435a";
    ctx.lineWidth = 12;
    roundRect(ctx, 26, 24, w - 52, h - 48, 30);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 98px system-ui, Arial";
    ctx.fillText("JUAN ESPEJO PGA HUB", w / 2, 118);
    ctx.fillStyle = "#ffd6dc";
    ctx.font = "900 37px system-ui, Arial";
    ctx.fillText("PRO GOLF LESSONS - TRAINING - ACADEMY - PRIVATE RANGE ACCESS", w / 2, 190);
  }, 1900, 255);
}

function profileTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#100507");
    g.addColorStop(.62,"#1a070b");
    g.addColorStop(1,"#050506");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#ff435a";
    ctx.lineWidth = 16;
    roundRect(ctx, 30, 30, w - 60, h - 60, 36);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,67,90,.18)";
    roundRect(ctx, 70, 58, w - 140, 112, 28);
    ctx.fill();
    ctx.fillStyle = "#ff96a2";
    ctx.font = "900 43px system-ui, Arial";
    ctx.fillText("PROFESSIONAL GOLF TRAINING STOREFRONT", 96, 128);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 82px system-ui, Arial";
    ctx.fillText("JUAN E. ESPEJO", 96, 252);
    ctx.fillStyle = "#ffd5db";
    ctx.font = "800 38px system-ui, Arial";
    ctx.fillText("PGA Pro - Maryville Golf Academy Founder", 96, 318);

    ctx.fillStyle = "#ff96a2";
    ctx.font = "900 39px system-ui, Arial";
    ctx.fillText("HUB PURPOSE", 96, 400);
    ctx.fillStyle = "#fff4f6";
    ctx.font = "700 32px system-ui, Arial";
    let y = wrappedText(ctx,
      "A premium SVR storefront built for golf instruction, academy promotion, private training portals, sponsor media, and future VR golf lessons. The lobby stays clean while all gameplay opens in separate private PGA scenes.",
      96, 450, w - 192, 41);

    y += 60;
    ctx.fillStyle = "#ff96a2";
    ctx.font = "900 36px system-ui, Arial";
    ctx.fillText("WHAT PLAYERS CAN ENTER", 96, y);
    y += 48;
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 31px system-ui, Arial";
    [
      "- Driving Range: tee shots, club bag, always tee-up ball",
      "- Chip + Putt: short-game practice and putting green",
      "- Future Lessons: lesson booking, sponsor video, player stats",
      "- Professional profile display with clean sponsor-ready branding"
    ].forEach(line => { ctx.fillText(line, 108, y); y += 43; });

    ctx.fillStyle = "rgba(255,255,255,.085)";
    roundRect(ctx, 74, h - 152, w - 148, 92, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,150,162,.62)";
    ctx.lineWidth = 4;
    roundRect(ctx, 74, h - 152, w - 148, 92, 24);
    ctx.stroke();
    ctx.fillStyle = "#7dff8a";
    ctx.font = "900 29px system-ui, Arial";
    ctx.fillText("ONE PGA PORTAL BELOW - CHOOSE DRIVE OR CHIP + PUTT", 102, h - 96);
  }, 1650, 1120);
}

function portraitTexture(){
  const tex = new THREE.TextureLoader().load("./assets/ui/juan-espejo.jpg");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function portraitCaptionTexture(){
  return makeCanvasTexture((ctx,w,h)=>{
    ctx.fillStyle = "#220408";
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#ff435a";
    ctx.lineWidth = 8;
    roundRect(ctx, 10,10,w-20,h-20,20);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 52px system-ui, Arial";
    ctx.fillText("RESERVED FOR", w/2, 76);
    ctx.fillStyle = "#ffbec6";
    ctx.font = "900 56px system-ui, Arial";
    ctx.fillText("JUAN ESPEJO", w/2, 143);
  }, 900, 190);
}

function portalTexture(){
  return makeCanvasTexture((ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#04120a");
    g.addColorStop(.55,"#061016");
    g.addColorStop(1,"#070314");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#7dff8a";
    ctx.lineWidth = 12;
    roundRect(ctx, 24, 24, w - 48, h - 48, 36);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 68px system-ui, Arial";
    ctx.fillText("PGA PRIVATE SCENE PORTAL", w/2, 105);
    ctx.fillStyle = "#7dff8a";
    ctx.font = "900 40px system-ui, Arial";
    ctx.fillText("ONE TELEPORT - TWO DESTINATIONS", w/2, 170);
    ctx.fillStyle = "rgba(255,255,255,.86)";
    ctx.font = "800 30px system-ui, Arial";
    ctx.fillText("Choose an option below:", w/2, 235);
    ctx.fillStyle = "#86e3ff";
    ctx.font = "900 34px system-ui, Arial";
    ctx.fillText("DRIVING RANGE", w*.30, 312);
    ctx.fillStyle = "#b48cff";
    ctx.fillText("CHIP + PUTT", w*.70, 312);
  }, 1300, 390);
}

function optionTexture(title, subtitle, accent){
  return makeCanvasTexture((ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#020406");
    g.addColorStop(1,"#0a0716");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    roundRect(ctx, 22,22,w-44,h-44,28);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 58px system-ui, Arial";
    ctx.fillText(title, w/2, 98);
    ctx.fillStyle = accent;
    ctx.font = "800 31px system-ui, Arial";
    ctx.fillText(subtitle, w/2, 157);
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "700 24px system-ui, Arial";
    ctx.fillText("Portal option", w/2, 208);
  }, 830, 260);
}

function makeCentralPortal(group){
  const root = new THREE.Group();
  root.name = "SVR_PHASE90_SINGLE_PGA_PORTAL_WITH_OPTIONS";
  root.position.set(0, 0.022, 1.96);
  root.userData.svrTeleportRoute = "pgaPortalSelector";
  root.userData.svrTeleportOptions = {
    pgaDrive: PGA_DRIVE_URL,
    pgaChipPutt: PGA_CHIP_PUTT_URL
  };
  group.add(root);

  const outer = new THREE.Mesh(
    new THREE.RingGeometry(1.02, 1.28, 96),
    new THREE.MeshBasicMaterial({ color: 0x7dff8a, transparent: true, opacity: .78, side: THREE.DoubleSide, depthWrite: false })
  );
  outer.rotation.x = -Math.PI / 2;
  root.add(outer);

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.96, 96),
    new THREE.MeshBasicMaterial({ color: 0x7dff8a, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false })
  );
  core.rotation.x = -Math.PI / 2;
  root.add(core);

  const portalSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.72, 1.42),
    new THREE.MeshBasicMaterial({ map: portalTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  portalSign.position.set(0, 1.28, -0.40);
  root.add(portalSign);

  const drive = new THREE.Mesh(
    new THREE.PlaneGeometry(2.18, .72),
    new THREE.MeshBasicMaterial({ map: optionTexture("DRIVE", "Open driving range", "#86e3ff"), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  drive.name = "SVR_PHASE90_OPTION_DRIVING_RANGE";
  drive.position.set(-1.36, .55, .64);
  drive.userData.svrTeleportRoute = "pgaDrive";
  drive.userData.svrTeleportUrl = PGA_DRIVE_URL;
  root.add(drive);

  const putt = new THREE.Mesh(
    new THREE.PlaneGeometry(2.18, .72),
    new THREE.MeshBasicMaterial({ map: optionTexture("CHIP + PUTT", "Open putting area", "#b48cff"), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  putt.name = "SVR_PHASE90_OPTION_CHIP_PUTT";
  putt.position.set(1.36, .55, .64);
  putt.userData.svrTeleportRoute = "pgaChipPutt";
  putt.userData.svrTeleportUrl = PGA_CHIP_PUTT_URL;
  root.add(putt);

  const glow = new THREE.PointLight(0x7dff8a, 1.45, 6, 2.0);
  glow.position.set(0, .50, 0);
  root.add(glow);

  return { root, outer, core, portalSign, drive, putt, glow };
}

function openRoute(url){
  if (!url || typeof window === "undefined") return;
  window.location.href = url;
}

export function addPgaHub(scene, { radius = 26, wallHeight = 6.6, log = console.log } = {}){
  try {
    const anchorAngle = Math.PI * 0.75;
    const inward = new THREE.Vector3(-Math.cos(anchorAngle), 0, -Math.sin(anchorAngle));
    const tangent = new THREE.Vector3(-Math.sin(anchorAngle), 0, Math.cos(anchorAngle));
    const wallInset = radius - 0.08;

    const group = new THREE.Group();
    group.name = "SVR_PHASE90_PROFESSIONAL_PGA_LOBBY_HUB";
    group.position.set(Math.cos(anchorAngle) * wallInset, 0, Math.sin(anchorAngle) * wallInset);
    group.position.addScaledVector(tangent, -0.06);
    group.lookAt(group.position.clone().add(inward));

    const accentMat = new THREE.MeshStandardMaterial({ color: 0xff435a, roughness: .18, metalness: .38, emissive: 0x6b0c15, emissiveIntensity: 1.0 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x060507, roughness: .70, metalness: .08, emissive: 0x13060a, emissiveIntensity: .24, side: THREE.DoubleSide });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x13080b, roughness: .34, metalness: .22, emissive: 0x3c1018, emissiveIntensity: .38 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(13.4, 6.62, 0.14), wallMat);
    backWall.position.set(0, 3.34, -0.18);
    group.add(backWall);

    const floorDeck = new THREE.Mesh(new THREE.BoxGeometry(13.1, .09, 3.05), new THREE.MeshStandardMaterial({ color: 0x13070a, roughness: .84, metalness: .08, emissive: 0x260b10, emissiveIntensity: .16 }));
    floorDeck.position.set(0, .045, 1.02);
    group.add(floorDeck);

    const turf = new THREE.Mesh(new THREE.BoxGeometry(10.8, .045, 1.66), new THREE.MeshStandardMaterial({ color: 0x156331, roughness: .96, metalness: 0, emissive: 0x082612, emissiveIntensity: .20 }));
    turf.position.set(0, .105, .95);
    group.add(turf);

    const leftColumn = new THREE.Mesh(new THREE.BoxGeometry(.20, 6.54, .20), accentMat);
    leftColumn.position.set(-6.46, 3.24, 1.18);
    group.add(leftColumn);
    const rightColumn = leftColumn.clone();
    rightColumn.position.x = 6.46;
    group.add(rightColumn);
    const headerRail = new THREE.Mesh(new THREE.BoxGeometry(13.10, .20, .20), accentMat);
    headerRail.position.set(0, 6.52, 1.18);
    group.add(headerRail);

    const header = new THREE.Mesh(new THREE.PlaneGeometry(10.9, 1.40), new THREE.MeshBasicMaterial({ map: headerTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    header.position.set(0, 5.86, 1.23);
    group.add(header);

    const infoFrame = new THREE.Mesh(new THREE.BoxGeometry(7.20, 4.56, .12), frameMat);
    infoFrame.position.set(-2.18, 3.08, .13);
    group.add(infoFrame);
    const infoPanel = new THREE.Mesh(new THREE.PlaneGeometry(6.92, 4.30), new THREE.MeshBasicMaterial({ map: profileTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    infoPanel.position.set(-2.18, 3.10, .24);
    group.add(infoPanel);

    const portraitFrame = new THREE.Mesh(new THREE.BoxGeometry(2.75, 3.52, .12), frameMat);
    portraitFrame.position.set(3.75, 3.20, .14);
    group.add(portraitFrame);
    const portrait = new THREE.Mesh(new THREE.PlaneGeometry(2.46, 3.18), new THREE.MeshBasicMaterial({ map: portraitTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    portrait.position.set(3.75, 3.28, .25);
    group.add(portrait);

    const caption = new THREE.Mesh(new THREE.PlaneGeometry(3.05, .64), new THREE.MeshBasicMaterial({ map: portraitCaptionTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    caption.position.set(3.75, 1.20, .25);
    group.add(caption);

    const portal = makeCentralPortal(group);

    const fillA = new THREE.PointLight(0xff435a, 3.7, 15, 2.0);
    fillA.position.set(-1.4, 4.8, 1.35);
    group.add(fillA);
    const fillB = new THREE.PointLight(0x86e3ff, 2.1, 12, 2.0);
    fillB.position.set(3.7, 4.45, 1.25);
    group.add(fillB);
    const fillC = new THREE.PointLight(0x7dff8a, 1.2, 8, 2.0);
    fillC.position.set(0, .54, 1.08);
    group.add(fillC);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 24, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .72, metalness: 0 }));
    ball.position.set(-.55, .20, .94);
    group.add(ball);
    const clubStem = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.15,12), new THREE.MeshStandardMaterial({ color: 0xd5dde8, roughness:.32, metalness:.62 }));
    clubStem.rotation.z = -.44;
    clubStem.position.set(-5.2, .95, .86);
    group.add(clubStem);
    const clubHead = new THREE.Mesh(new THREE.BoxGeometry(.20,.08,.36), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness:.42, metalness:.28 }));
    clubHead.rotation.z = -.44;
    clubHead.position.set(-5.84, .22, 1.02);
    group.add(clubHead);

    scene.add(group);
    const box = new THREE.Box3().setFromObject(group);
    group.position.y -= box.min.y;

    const openDrive = ()=>openRoute(PGA_DRIVE_URL);
    const openChipPutt = ()=>openRoute(PGA_CHIP_PUTT_URL);
    if (typeof window !== "undefined"){
      window.SVR_PGA_HUB_OPEN_DRIVE = openDrive;
      window.SVR_PGA_HUB_OPEN_CHIP_PUTT = openChipPutt;
      window.addEventListener("keydown", (e)=>{
        if (e.repeat) return;
        if (e.code === "Digit7") openDrive();
        if (e.code === "Digit8") openChipPutt();
      });
    }

    scene.userData._pgaHub = { group, portal, fillA, fillB, fillC, inward, anchorAngle, phase: PHASE90_BUILD };
    scene.userData.SVR_PGA_HUB_ROUTES = { pgaDrive: PGA_DRIVE_URL, pgaChipPutt: PGA_CHIP_PUTT_URL, singlePortal: true };
    log?.(`[${PHASE90_BUILD}] Professional PGA lobby hub rebuilt with one portal and two options.`);
    return scene.userData._pgaHub;
  } catch (err) {
    log("[pga_hub] failed to build", err?.message || err);
    return null;
  }
}

export function tickPgaHub(scene, t = 0){
  const hub = scene?.userData?._pgaHub;
  if (!hub) return;
  const portal = hub.portal;
  if (portal?.outer?.material) portal.outer.material.opacity = .68 + Math.sin(t * 2.1) * .12;
  if (portal?.core?.material) portal.core.material.opacity = .14 + Math.sin(t * 1.7) * .05;
  if (portal?.glow) portal.glow.intensity = 1.20 + Math.sin(t * 1.8) * .24;
  if (portal?.drive) portal.drive.position.y = .55 + Math.sin(t * 1.2) * .015;
  if (portal?.putt) portal.putt.position.y = .55 + Math.sin(t * 1.2 + .8) * .015;
  if (hub.fillA) hub.fillA.intensity = 3.7 + Math.sin(t * 1.2) * .22;
  if (hub.fillB) hub.fillB.intensity = 2.1 + Math.sin(t * 1.0 + .6) * .16;
  if (hub.fillC) hub.fillC.intensity = 1.2 + Math.sin(t * 1.3 + 1.1) * .12;
}

export { PGA_DRIVE_URL, PGA_CHIP_PUTT_URL, PHASE90_BUILD };
