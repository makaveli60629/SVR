import * as THREE from "three";

function canvasTexture(width, height, painter){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height, canvas);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
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

function makeBannerTexture({ title, subtitle, tag, accent = "#70fff2", index = 1 }){
  return canvasTexture(1024, 1536, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#050014");
    bg.addColorStop(0.45, "#071128");
    bg.addColorStop(1, "#17001e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    for (let x = -w; x < w * 2; x += 92){
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h * 0.42, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const glow = ctx.createRadialGradient(w * 0.5, h * 0.36, 40, w * 0.5, h * 0.36, 620);
    glow.addColorStop(0, `${accent}88`);
    glow.addColorStop(0.42, `${accent}22`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 30;
    ctx.lineWidth = 18;
    roundRect(ctx, 52, 52, w - 104, h - 104, 42);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255,255,255,.055)";
    roundRect(ctx, 96, 106, w - 192, 154, 34);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.20)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 78px Arial, system-ui, sans-serif";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 24;
    ctx.fillText("SVR POKER", w / 2, 182);
    ctx.shadowBlur = 0;

    ctx.fillStyle = accent;
    ctx.font = "900 38px Arial, system-ui, sans-serif";
    ctx.fillText(`AD BUILDING ${String(index).padStart(2, "0")}`, w / 2, 306);

    ctx.fillStyle = "rgba(0,0,0,.36)";
    roundRect(ctx, 120, 388, w - 240, 490, 44);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.20)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 74px Arial, system-ui, sans-serif";
    const words = String(title || "SPONSOR").split(" ");
    let y = 500;
    words.forEach((word)=>{
      ctx.fillText(word, w / 2, y);
      y += 88;
    });

    ctx.fillStyle = "#dffcff";
    ctx.font = "700 42px Arial, system-ui, sans-serif";
    const subWords = String(subtitle || "FACING THE TABLE").match(/.{1,28}(\s|$)/g) || [subtitle || "FACING THE TABLE"];
    y = 910;
    subWords.slice(0, 3).forEach((line)=>{
      ctx.fillText(line.trim(), w / 2, y);
      y += 58;
    });

    ctx.fillStyle = "rgba(255,211,106,.14)";
    roundRect(ctx, 132, 1138, w - 264, 160, 80);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,211,106,.72)";
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.fillStyle = "#ffd36a";
    ctx.font = "900 46px Arial, system-ui, sans-serif";
    ctx.fillText(tag || "PREMIUM PLACEMENT", w / 2, 1220);

    ctx.fillStyle = "rgba(112,255,242,.75)";
    ctx.font = "800 30px Arial, system-ui, sans-serif";
    ctx.fillText("TABLE-FACING SPONSOR SURFACE", w / 2, 1392);
  });
}

function addTrimBars(group, width, height, accentColor){
  const mat = new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending, depthWrite: false });
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.34, 0.08, 0.08), mat);
  top.position.set(0, height / 2 + 0.08, 0.09);
  const bottom = top.clone();
  bottom.position.y = -height / 2 - 0.08;
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.08, height + 0.28, 0.08), mat);
  left.position.set(-width / 2 - 0.10, 0, 0.09);
  const right = left.clone();
  right.position.x = width / 2 + 0.10;
  group.add(top, bottom, left, right);
}

export function addPhase123AdBannerBuildings({ scene, radius, wallHeight, logoTexture = null, log = console.log }){
  const root = new THREE.Group();
  root.name = "PHASE123_Eight_Table_Facing_Ad_Banner_Buildings";
  root.userData.phase = "UPDATE-3.0-PHASE-123-AD-BANNER-BUILDINGS-8-FACING-TABLE-LOCK";

  const placements = [
    { angle: -Math.PI * 0.82, title: "SCARLETT", subtitle: "Owner brand showcase", tag: "MAIN AD", accent: "#75fff2" },
    { angle: -Math.PI * 0.58, title: "SVR STORE", subtitle: "Gear, table skins, avatar wear", tag: "STORE", accent: "#b88cff" },
    { angle: -Math.PI * 0.34, title: "REIKI HUB", subtitle: "Trueitive presentation path", tag: "WELLNESS", accent: "#5fffd8" },
    { angle: -Math.PI * 0.12, title: "PGA GOLF", subtitle: "Golf training and range portal", tag: "SPORT", accent: "#6fb8ff" },
    { angle: Math.PI * 0.12, title: "TOURNAMENT", subtitle: "Weekend and monthly events", tag: "EVENT", accent: "#ffd36a" },
    { angle: Math.PI * 0.34, title: "CHARITY", subtitle: "Community impact placement", tag: "IMPACT", accent: "#ff8fd8" },
    { angle: Math.PI * 0.58, title: "SCORPION", subtitle: "Private poker room preview", tag: "ROOM", accent: "#ff5b8c" },
    { angle: Math.PI * 0.82, title: "SPONSOR", subtitle: "Premium billboard inventory", tag: "AVAILABLE", accent: "#8fffe1" }
  ];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x040814,
    roughness: 0.72,
    metalness: 0.34,
    emissive: 0x06091f,
    emissiveIntensity: 0.20
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0a1828,
    roughness: 0.18,
    metalness: 0.32,
    transparent: true,
    opacity: 0.50,
    emissive: 0x041526,
    emissiveIntensity: 0.16
  });

  const bannerWidth = 5.05;
  const bannerHeight = Math.min(8.9, Math.max(7.4, wallHeight - 0.85));
  const buildingDepth = 0.20;
  // Phase 126: embed the 8 banner faces into the inner lobby wall, facing the table.
  const placementRadius = Math.max(11.0, radius - 0.82);
  const bannerRecords = [];

  placements.forEach((cfg, idx)=>{
    const accentColor = new THREE.Color(cfg.accent || "#70fff2");
    const group = new THREE.Group();
    group.name = `Phase123_TableFacingAdBuilding_${idx + 1}`;
    const x = Math.cos(cfg.angle) * placementRadius;
    const z = Math.sin(cfg.angle) * placementRadius;
    group.position.set(x, bannerHeight * 0.5 + 0.72, z);
    group.lookAt(0, bannerHeight * 0.55, 0);

    const tower = new THREE.Mesh(new THREE.BoxGeometry(bannerWidth + 0.32, bannerHeight + 0.40, buildingDepth), bodyMat.clone());
    tower.material.emissive = accentColor.clone().multiplyScalar(0.12);
    tower.position.z = -0.045;
    group.add(tower);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(bannerWidth + 0.14, bannerHeight + 0.18), glassMat.clone());
    glass.position.z = 0.118; glass.material.depthWrite = false; glass.material.depthTest = false;
    group.add(glass);

    const tex = makeBannerTexture({ ...cfg, index: idx + 1 });
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(bannerWidth, bannerHeight),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, depthTest: false })
    );
    banner.position.z = 0.135;
    banner.renderOrder = 36;
    group.add(banner);

    addTrimBars(group, bannerWidth, bannerHeight, accentColor);

    if (logoTexture){
      const logo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.74, 0.74),
        new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
      );
      logo.position.set(0, bannerHeight * 0.28, 0.155);
      logo.renderOrder = 38;
      group.add(logo);
    }

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.92, 0.18, 6),
      new THREE.MeshStandardMaterial({ color: 0x080612, metalness: 0.44, roughness: 0.44, emissive: accentColor, emissiveIntensity: 0.08 })
    );
    base.rotation.y = Math.PI / 6;
    base.position.set(0, -bannerHeight * 0.5 - 0.25, -0.02);
    group.add(base);

    const uplight = new THREE.PointLight(accentColor, 0.65, 7.5, 2.2);
    uplight.position.set(0, -bannerHeight * 0.5 + 0.32, 0.30);
    group.add(uplight);

    root.add(group);
    bannerRecords.push({ group, banner, light: uplight, phase: idx * 0.53, baseIntensity: 0.50 + (idx % 3) * 0.08 });
  });

  root.userData.bannerRecords = bannerRecords;
  root.userData.tick = (time)=>{
    bannerRecords.forEach((rec, idx)=>{
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.95 + rec.phase);
      rec.banner.material.opacity = 0.98;
      rec.light.intensity = rec.baseIntensity + pulse * 0.10;
      // No position jitter; prevents VR shimmer/blinking.
    });
  };
  scene.add(root);
  if (typeof log === "function") log("Phase 126: 8 wall-embedded table-facing ad banner panels active.");
  return root;
}
