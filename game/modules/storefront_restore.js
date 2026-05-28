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
  return tex;
}

function makeSignTexture(title, subtitle, accent = "#8ee6ff"){
  return canvasTexture(1024, 512, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#070b16");
    bg.addColorStop(0.55, "#170827");
    bg.addColorStop(1, "#04151d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(70, 118, w - 140, 210);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7fbff";
    ctx.font = "900 72px system-ui, Arial";
    ctx.fillText(title.toUpperCase(), w / 2, 210);
    ctx.fillStyle = accent;
    ctx.font = "800 34px system-ui, Arial";
    ctx.fillText(subtitle.toUpperCase(), w / 2, 306);
    ctx.fillStyle = "rgba(255,255,255,0.74)";
    ctx.font = "700 24px system-ui, Arial";
    ctx.fillText("PRIVATE SCENE PORTAL", w / 2, 414);
  });
}

function makeVideoPlaceholderTexture(){
  return canvasTexture(1024, 576, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#07110f");
    bg.addColorStop(1, "#1d0621");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#81ffd7";
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eafff7";
    ctx.font = "900 56px system-ui, Arial";
    ctx.fillText("REIKI INTRO VIDEO", w / 2, h / 2 - 52);
    ctx.fillStyle = "#ff5b5b";
    ctx.font = "900 34px system-ui, Arial";
    ctx.fillText("AWAITING APPROVAL", w / 2, h / 2 + 14);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "700 24px system-ui, Arial";
    ctx.fillText("Drop video at game/assets/video/reiki-intro.mp4", w / 2, h / 2 + 72);
  });
}

function attachOptionalVideo(panel, src){
  try{
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.addEventListener("canplay", ()=>{
      const tex = new THREE.VideoTexture(video);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      panel.material.map = tex;
      panel.material.needsUpdate = true;
      video.play().catch(()=>{});
    }, { once: true });
    window.addEventListener("pointerdown", ()=>video.play().catch(()=>{}), { once: true });
    window.addEventListener("svr:ready", ()=>video.play().catch(()=>{}), { once: true });
  }catch(_err){
    // Leave the canvas placeholder if video creation fails.
  }
}

function buildStorefront({ scene, radius, angle, title, subtitle, accent, width = 4.2, targetKey, video = false }){
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (radius - 4.2), 0.02, Math.sin(angle) * (radius - 4.2));
  const root = new THREE.Group();
  root.name = `SVR storefront ${title}`;
  root.position.copy(center);
  root.lookAt(center.clone().add(inward));
  scene.add(root);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.28, 0.18, 0.54),
    new THREE.MeshStandardMaterial({ color: 0x101722, roughness: 0.7, metalness: 0.12, emissive: 0x050812, emissiveIntensity: 0.18 })
  );
  base.position.set(0, 0.09, 0.02);
  root.add(base);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.42, 2.65, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.5, metalness: 0.24, emissive: new THREE.Color(accent), emissiveIntensity: 0.10 })
  );
  frame.position.set(0, 1.55, 0.0);
  root.add(frame);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 1.15),
    new THREE.MeshBasicMaterial({ map: makeSignTexture(title, subtitle, accent), transparent: true, side: THREE.DoubleSide })
  );
  sign.position.set(0, 2.42, 0.12);
  root.add(sign);

  const portal = new THREE.Mesh(
    new THREE.RingGeometry(0.70, 0.94, 64),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false })
  );
  portal.rotation.x = -Math.PI * 0.5;
  portal.position.set(0, 0.035, 1.20);
  root.add(portal);

  const glow = new THREE.PointLight(new THREE.Color(accent), 1.15, 8, 2.0);
  glow.position.set(0, 1.10, 0.78);
  root.add(glow);

  let videoPanel = null;
  if (video){
    videoPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.05, 1.72),
      new THREE.MeshBasicMaterial({ map: makeVideoPlaceholderTexture(), side: THREE.DoubleSide })
    );
    videoPanel.position.set(0, 1.36, 0.16);
    root.add(videoPanel);
    attachOptionalVideo(videoPanel, "./assets/video/reiki-intro.mp4");
  }

  const target = center.clone().addScaledVector(inward, 3.6).setY(0);
  const look = center.clone().setY(1.45);
  return { root, key: targetKey, target, look, videoPanel };
}

export function addRestoredStorefronts(scene, { radius = 15 } = {}){
  const configs = [
    { key: "reiki", title: "Reiki Hub", subtitle: "Approval portal + intro video", angle: 0.02, accent: "#81ffd7", video: true, width: 4.8 },
    { key: "pga", title: "PGA Golf", subtitle: "Drive + Chip/Putt routes", angle: -0.82, accent: "#94ff77", width: 4.4 },
    { key: "store", title: "VR Store", subtitle: "svrpoker.com/site/store.html", angle: -1.52, accent: "#8edcff", width: 4.5 },
    { key: "lounge", title: "Smoker Lounge", subtitle: "Private social room", angle: 0.86, accent: "#ffb86b", width: 4.4 },
    { key: "scorpion", title: "Scorpion Poker", subtitle: "Private poker room", angle: 1.62, accent: "#ff70c9", width: 4.6 },
    { key: "sponsor", title: "Sponsor Wall", subtitle: "Future partner storefront", angle: Math.PI, accent: "#c68cff", width: 4.4 }
  ];
  const targets = {};
  const roots = [];
  configs.forEach((cfg)=>{
    const rec = buildStorefront({ scene, radius, ...cfg, targetKey: cfg.key });
    roots.push(rec.root);
    targets[cfg.key] = { pos: rec.target, look: rec.look };
    if (cfg.key === "store") targets.storeRoom = { pos: rec.target, look: rec.look };
    if (cfg.key === "lounge") targets.smoker = { pos: rec.target, look: rec.look };
    if (cfg.key === "reiki") targets.reikiRoom = { pos: rec.target.clone().add(new THREE.Vector3(0, 0, -1.2)), look: rec.look };
  });
  return { roots, targets };
}
