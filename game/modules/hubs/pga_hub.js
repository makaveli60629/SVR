import * as THREE from "three";

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

function buildProfileTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#0d0608");
    grad.addColorStop(0.6, "#1a090d");
    grad.addColorStop(1, "#050507");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#ff3f52";
    ctx.lineWidth = 16;
    roundRect(ctx, 28, 28, w - 56, h - 56, 44);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 63, 82, 0.16)";
    roundRect(ctx, 60, 60, w - 120, 132, 28);
    ctx.fill();
    ctx.fillStyle = "#ff7784";
    ctx.font = "700 42px Arial";
    ctx.fillText("SOUTH-WEST WALL • PGA HUB", 92, 126);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 92px Arial";
    ctx.fillText("JUAN E. ESPEJO", 92, 254);
    ctx.fillStyle = "#ffc2c9";
    ctx.font = "600 40px Arial";
    ctx.fillText("PGA Pro • Maryville Golf Academy Founder", 92, 324);

    ctx.fillStyle = "#ff7784";
    ctx.font = "700 48px Arial";
    ctx.fillText("ABOUT", 92, 420);
    ctx.fillStyle = "#f7f0f2";
    ctx.font = "500 38px Arial";
    let y = drawWrappedText(ctx,
      "Dedicated VR golf storefront reserved for training, lessons, academy promotion, and future branded PGA media. Built as a professional modular client hub so it can be refined without disturbing the main lobby baseline.",
      92, 474, w - 184, 46);

    y += 76;
    ctx.fillStyle = "#ff7784";
    ctx.font = "700 42px Arial";
    ctx.fillText("FOCUS", 92, y);
    y += 54;
    ctx.fillStyle = "#f7f0f2";
    ctx.font = "500 36px Arial";
    [
      "• Private instruction",
      "• Group lessons",
      "• Beginner fundamentals",
      "• Player development",
      "• Sponsor-ready showcase"
    ].forEach((line)=>{ ctx.fillText(line, 98, y); y += 50; });

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, 74, h - 232, w - 148, 142, 26);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 128, 144, 0.52)";
    ctx.lineWidth = 4;
    roundRect(ctx, 74, h - 232, w - 148, 142, 26);
    ctx.stroke();
    ctx.fillStyle = "#ff7784";
    ctx.font = "700 34px Arial";
    ctx.fillText("RESERVED SPOTLIGHT", 108, h - 172);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 42px Arial";
    ctx.fillText("VR GOLF / PGA HUB", 108, h - 118);
  }, 1100, 1500);
}

function buildBadgeTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    const cx = w / 2;
    const cy = h / 2;
    const outer = Math.min(w, h) * 0.46;
    const glow = ctx.createRadialGradient(cx, cy, outer * 0.14, cx, cy, outer * 1.15);
    glow.addColorStop(0, "rgba(255, 90, 110, 0.42)");
    glow.addColorStop(1, "rgba(255, 90, 110, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.fillStyle = "#7a0915";
    ctx.fill();
    ctx.lineWidth = 28;
    ctx.strokeStyle = "#ff4456";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, outer * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = "#250306";
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255, 206, 212, 0.9)";
    ctx.stroke();

    ctx.fillStyle = "#ffe9ec";
    ctx.textAlign = "center";
    ctx.font = "700 54px Arial";
    ctx.fillText("FEATURE", cx, cy - 146);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 210px Arial";
    ctx.fillText("PGA", cx, cy + 54);
    ctx.fillStyle = "#ffccd2";
    ctx.font = "700 44px Arial";
    ctx.fillText("SPOTLIGHT", cx, cy + 162);
  }, 900, 900);
}

function buildReserveTexture(){
  return makeCanvasTexture((ctx, w, h)=>{
    ctx.fillStyle = "#240307";
    roundRect(ctx, 0, 0, w, h, 26);
    ctx.fill();
    ctx.strokeStyle = "#ff4a59";
    ctx.lineWidth = 10;
    roundRect(ctx, 10, 10, w - 20, h - 20, 24);
    ctx.stroke();
    ctx.fillStyle = "#ff7784";
    ctx.textAlign = "center";
    ctx.font = "700 64px Arial";
    ctx.fillText("RESERVED FOR", w / 2, 96);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 74px Arial";
    ctx.fillText("JUAN ESPEJO", w / 2, 184);
  }, 900, 240);
}

function buildPortraitTexture(){
  const loader = new THREE.TextureLoader();
  const tex = loader.load('./assets/ui/juan-espejo.jpg');
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}


export function addPgaHub(scene, { radius = 26, wallHeight = 6.6, log = console.log } = {}){
  try {
    const anchorAngle = Math.PI * 0.75; // south-west wall
    const inward = new THREE.Vector3(-Math.cos(anchorAngle), 0, -Math.sin(anchorAngle));
    const tangent = new THREE.Vector3(-Math.sin(anchorAngle), 0, Math.cos(anchorAngle));
    const wallInset = radius - 0.08;

    const group = new THREE.Group();
    group.position.set(Math.cos(anchorAngle) * wallInset, 0, Math.sin(anchorAngle) * wallInset);
    group.position.addScaledVector(tangent, -0.06);
    group.lookAt(group.position.clone().add(inward));

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x12090c, roughness: 0.34, metalness: 0.22, emissive: 0x371017, emissiveIntensity: 0.24 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xff4456, roughness: 0.18, metalness: 0.38, emissive: 0x6b0c15, emissiveIntensity: 0.96 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x070508, roughness: 0.66, metalness: 0.08, emissive: 0x14060a, emissiveIntensity: 0.22, side: THREE.DoubleSide });
    const softGlass = new THREE.MeshStandardMaterial({ color: 0xffd8df, transparent: true, opacity: 0.05, roughness: 0.08, metalness: 0.18, emissive: 0x2a0b12, emissiveIntensity: 0.18, side: THREE.DoubleSide });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12.8, 6.7, 0.12), wallMat);
    backWall.position.set(0, 3.22, -0.10);
    group.add(backWall);

    const floorDeck = new THREE.Mesh(
      new THREE.BoxGeometry(12.2, 0.08, 2.32),
      new THREE.MeshStandardMaterial({ color: 0x16090d, roughness: 0.82, metalness: 0.06, emissive: 0x260b10, emissiveIntensity: 0.14 })
    );
    floorDeck.position.set(0, 0.04, 0.88);
    group.add(floorDeck);

    const turf = new THREE.Mesh(
      new THREE.BoxGeometry(8.0, 0.04, 1.62),
      new THREE.MeshStandardMaterial({ color: 0x15572c, roughness: 0.97, metalness: 0.0, emissive: 0x0a2212, emissiveIntensity: 0.14 })
    );
    turf.position.set(0.14, 0.085, 0.86);
    group.add(turf);

    const lane = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.024, 0.52),
      new THREE.MeshStandardMaterial({ color: 0x2d9446, roughness: 0.92, metalness: 0.0 })
    );
    lane.position.set(0.18, 0.102, 0.86);
    group.add(lane);

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.42, metalness: 0.16 })
    );
    cup.position.set(2.56, 0.10, 0.86);
    group.add(cup);

    const leftFrontColumn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 6.65, 0.18), accentMat);
    leftFrontColumn.position.set(-6.20, 3.24, 1.18);
    group.add(leftFrontColumn);
    const rightFrontColumn = leftFrontColumn.clone();
    rightFrontColumn.position.x = 6.20;
    group.add(rightFrontColumn);
    const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(12.58, 0.18, 0.18), accentMat);
    frontHeader.position.set(0, 6.58, 1.18);
    group.add(frontHeader);

    const logoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 1.10),
      new THREE.MeshBasicMaterial({
        map: makeCanvasTexture((ctx, w, h)=>{
          const g = ctx.createLinearGradient(0,0,w,h);
          g.addColorStop(0, '#090506');
          g.addColorStop(1, '#300910');
          ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
          ctx.strokeStyle = 'rgba(255,208,214,0.86)'; ctx.lineWidth = 10; roundRect(ctx, 18, 18, w-36, h-36, 24); ctx.stroke();
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff7f8'; ctx.font = '700 88px Arial'; ctx.fillText('JUAN ESPEJO PGA HUB', w/2, 98);
          ctx.fillStyle = 'rgba(255,176,186,0.98)'; ctx.font = '700 34px Arial'; ctx.fillText('GOLF LESSONS • TRAINING • ACADEMY • SPONSOR SHOWCASE', w/2, 184);
        }, 1700, 240),
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    logoPanel.position.set(0, 5.78, 1.22);
    group.add(logoPanel);

    const infoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 5.2),
      new THREE.MeshBasicMaterial({ map: buildProfileTexture(), side: THREE.DoubleSide, transparent: true })
    );
    infoPanel.position.set(-1.70, 3.10, 0.18);
    group.add(infoPanel);

    const portraitBack = new THREE.Mesh(
      new THREE.PlaneGeometry(2.26, 3.06),
      new THREE.MeshBasicMaterial({ color: 0x0f0709, side: THREE.DoubleSide })
    );
    portraitBack.position.set(3.92, 3.04, 0.16);
    group.add(portraitBack);

    const portrait = new THREE.Mesh(
      new THREE.PlaneGeometry(2.04, 2.84),
      new THREE.MeshBasicMaterial({ map: buildPortraitTexture(), transparent: true, side: THREE.DoubleSide })
    );
    portrait.position.set(3.92, 3.04, 0.19);
    group.add(portrait);

    const badge = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 64),
      new THREE.MeshBasicMaterial({ map: buildBadgeTexture(), transparent: true, side: THREE.DoubleSide })
    );
    badge.position.set(4.98, 5.04, 0.20);
    group.add(badge);

    const badgeFrame = new THREE.Mesh(
      new THREE.RingGeometry(0.66, 0.80, 64),
      new THREE.MeshStandardMaterial({ color: 0xff4456, roughness: 0.18, metalness: 0.42, emissive: 0x5b0911, emissiveIntensity: 1.02, side: THREE.DoubleSide })
    );
    badgeFrame.position.copy(badge.position);
    group.add(badgeFrame);

    const reservePlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(4.16, 0.88),
      new THREE.MeshBasicMaterial({ map: buildReserveTexture(), side: THREE.DoubleSide, transparent: true })
    );
    reservePlaque.position.set(4.08, 1.10, 0.20);
    group.add(reservePlaque);

    const frontGlassL = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.82), softGlass);
    frontGlassL.position.set(-2.62, 3.18, 1.14);
    group.add(frontGlassL);
    const frontGlassR = frontGlassL.clone();
    frontGlassR.position.x = 2.62;
    group.add(frontGlassR);

    const fillA = new THREE.PointLight(0xff4456, 4.2, 16, 2.0);
    fillA.position.set(-0.4, 4.8, 1.34);
    group.add(fillA);
    const fillB = new THREE.PointLight(0xffb0ba, 2.7, 13, 2.0);
    fillB.position.set(4.1, 5.1, 1.20);
    group.add(fillB);
    const fillC = new THREE.PointLight(0x73ff97, 1.0, 8, 2.0);
    fillC.position.set(1.0, 0.54, 1.06);
    group.add(fillC);

    const railMat = new THREE.MeshStandardMaterial({ color: 0xefe7de, roughness: 0.30, metalness: 0.68, emissive: 0x24191a, emissiveIntensity: 0.08 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x90232d, roughness: 0.84, metalness: 0.06, emissive: 0x4d1116, emissiveIntensity: 0.18 });
    const railXs = [-2.8, 2.8];
    const railZs = [1.92, 0.14];
    railXs.forEach((x)=>{ railZs.forEach((z)=>{ const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 12), railMat); post.position.set(x, 0.39, z); group.add(post); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), railMat); cap.position.set(x, 0.80, z); group.add(cap); }); });
    railXs.forEach((x)=>{ const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.78, 10), ropeMat); rope.rotation.x = Math.PI * 0.5; rope.position.set(x, 0.74, 1.03); group.add(rope); });
    [[-2.8,2.8,1.92],[-2.8,2.8,0.14]].forEach(([x1,x2,z])=>{ const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, Math.abs(x2-x1), 10), ropeMat); rope.rotation.z = Math.PI * 0.5; rope.position.set((x1+x2)*0.5, 0.74, z); group.add(rope); });

    const clubStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1.54, 12),
      new THREE.MeshStandardMaterial({ color: 0xcfd5df, roughness: 0.32, metalness: 0.62 })
    );
    clubStem.rotation.z = -0.42;
    clubStem.position.set(-3.7, 1.15, 0.92);
    group.add(clubStem);
    const clubHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.08, 0.36),
      new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.42, metalness: 0.28 })
    );
    clubHead.rotation.z = -0.42;
    clubHead.position.set(-4.52, 0.20, 1.12);
    group.add(clubHead);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0.0 }));
    ball.position.set(-1.54, 0.17, 1.26);
    group.add(ball);

    scene.add(group);

    const box = new THREE.Box3().setFromObject(group);
    group.position.y -= box.min.y;

    scene.userData._pgaHub = { group, badgeFrame, logoPanel, fillA, fillB, fillC, inward, anchorAngle };
    return scene.userData._pgaHub;
  } catch (err) {
    log('[pga_hub] failed to build', err?.message || err);
    return null;
  }
}

export function tickPgaHub(scene, t = 0){
  const hub = scene?.userData?._pgaHub;
  if (!hub) return;
  if (hub.badgeFrame?.material) hub.badgeFrame.material.emissiveIntensity = 0.88 + Math.sin(t * 1.6) * 0.16;
  if (hub.fillA) hub.fillA.intensity = 4.2 + Math.sin(t * 1.2) * 0.24;
  if (hub.fillB) hub.fillB.intensity = 2.6 + Math.sin(t * 1.0 + 0.6) * 0.14;
  if (hub.fillC) hub.fillC.intensity = 1.0 + Math.sin(t * 1.3 + 1.1) * 0.10;
}
