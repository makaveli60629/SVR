import * as THREE from "three";

function makeTexture(title, subtitle, color = "#69e8ff"){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#050713");
  grad.addColorStop(0.52, "#150625");
  grad.addColorStop(1, "#040812");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
  ctx.fillStyle = "rgba(255,255,255,.055)";
  ctx.fillRect(58, 64, canvas.width - 116, canvas.height - 128);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 72px Arial";
  ctx.fillText(String(title || "SVR").toUpperCase(), canvas.width / 2, 205);
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.font = "800 36px Arial";
  ctx.fillText(String(subtitle || "PORTAL").toUpperCase(), canvas.width / 2, 326);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function makeSvrLogoAdTexture(){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  function drawBase(){
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#03040c");
    grad.addColorStop(0.55, "#140824");
    grad.addColorStop(1, "#040914");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#69e8ff";
    ctx.lineWidth = 14;
    ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 58px Arial";
    ctx.fillText("SVR POKER", 512, 304);
    ctx.fillStyle = "#ffd36b";
    ctx.font = "800 31px Arial";
    ctx.fillText("OFFICIAL BRAND • STORE • SOCIAL VR", 512, 370);
    ctx.fillStyle = "#b48cff";
    ctx.font = "800 26px Arial";
    ctx.fillText("SVRPOKER.COM", 512, 422);
  }
  drawBase();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  const img = new Image();
  img.onload = ()=>{
    drawBase();
    const size = 170;
    ctx.save();
    ctx.shadowColor = "#69e8ff";
    ctx.shadowBlur = 32;
    ctx.drawImage(img, 512 - size / 2, 74, size, size);
    ctx.restore();
    texture.needsUpdate = true;
  };
  img.onerror = ()=>{ texture.needsUpdate = true; };
  img.src = "../logo.webp";
  return texture;
}

function makePlanetTexture(kind = "moon"){
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createRadialGradient(w * 0.36, h * 0.32, 50, w / 2, h / 2, w * 0.5);
  if (kind === "mars"){
    grad.addColorStop(0, "#ffd8ac");
    grad.addColorStop(0.42, "#d87540");
    grad.addColorStop(0.78, "#87301f");
    grad.addColorStop(1, "#3f140d");
  } else {
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.45, "#e4e8f2");
    grad.addColorStop(0.78, "#a7adbc");
    grad.addColorStop(1, "#5f6470");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = kind === "mars" ? 0.16 : 0.12;
  ctx.fillStyle = kind === "mars" ? "#35130d" : "#424757";
  const marks = kind === "mars" ? 180 : 240;
  for (let i = 0; i < marks; i++){
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 10 + Math.random() * (kind === "mars" ? 54 : 74);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.42 + Math.random() * 0.48), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function addPanel(root, title, subtitle, x, y, z, color, width = 3.1, height = 1.55, texture = null){
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture || makeTexture(title, subtitle, color), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  panel.position.set(x, y, z);
  panel.lookAt(0, y, 0);
  root.add(panel);
  return panel;
}

function addStorefront(root, title, subtitle, x, z, color, portalKey, options = {}){
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = Math.atan2(-x, -z);
  group.userData.portalKey = portalKey;
  root.add(group);
  const colorObj = new THREE.Color(color);
  const colorHex = colorObj.getHex();
  const width = options.width || 3.2;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, 3.05, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x080d18, roughness: 0.74, metalness: 0.06, emissive: 0x101625, emissiveIntensity: 0.20 })
  );
  body.position.y = 1.50;
  group.add(body);
  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.42, 2.12, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x03060d, roughness: 0.85, metalness: 0.02, emissive: colorHex, emissiveIntensity: 0.055 })
  );
  inset.position.set(0, 1.34, 0.17);
  group.add(inset);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.82, 1.58),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
  );
  glass.position.set(0, 1.28, 0.205);
  group.add(glass);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.20, 0.82),
    new THREE.MeshBasicMaterial({ map: makeTexture(title, subtitle, color), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  sign.position.set(0, 2.78, 0.225);
  group.add(sign);
  const trimMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.32, metalness: 0.26, emissive: colorHex, emissiveIntensity: 0.50 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + 0.22, 0.08, 0.18), trimMat);
  top.position.set(0, 3.06, 0.21);
  group.add(top);
  const bottom = top.clone();
  bottom.position.y = 0.06;
  group.add(bottom);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.0, 0.18), trimMat);
  left.position.set(-(width / 2 + 0.08), 1.54, 0.21);
  group.add(left);
  const right = left.clone();
  right.position.x = (width / 2 + 0.08);
  group.add(right);
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.92, 64),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false })
  );
  marker.rotation.x = -Math.PI * 0.5;
  marker.position.set(0, 0.035, 0.86);
  group.add(marker);
  return group;
}

function addOrb(root, color, x, y, z, scale, kind = "moon"){
  const group = new THREE.Group();
  group.position.set(x, y, z);
  root.add(group);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(scale, 64, 42),
    new THREE.MeshBasicMaterial({ map: makePlanetTexture(kind), color: 0xffffff })
  );
  group.add(sphere);
  const glow = new THREE.PointLight(color, 2.25, 220, 1.35);
  group.add(glow);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(scale * 1.22, 48, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.BackSide, depthWrite: false })
  );
  group.add(halo);
  return { group, sphere, halo };
}

function addReikiVideoPanel(root){
  const group = new THREE.Group();
  const center = new THREE.Vector3(-5.6, 1.64, -8.98);
  group.position.copy(center);
  group.rotation.y = Math.atan2(5.6, 9.15);
  root.add(group);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.22, 1.46, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x120818, roughness: 0.45, metalness: 0.1, emissive: 0x30104a, emissiveIntensity: 0.38 })
  );
  group.add(frame);
  const video = document.createElement("video");
  video.src = "../site/assets/video/reiki_hologram.mp4";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = "metadata";
  video.volume = 0.0;
  video.play().catch(()=>{});
  let primed = false;
  let currentVolume = 0;
  const maxVolume = 0.055;
  const zoneCenter = new THREE.Vector3(-5.6, 1.6, -9.15);
  const primeAudio = ()=>{
    primed = true;
    video.muted = false;
    video.play().catch(()=>{});
  };
  window.addEventListener("pointerdown", primeAudio, { once: true, passive: true });
  window.addEventListener("keydown", primeAudio, { once: true });
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.00, 1.14),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false })
  );
  screen.position.z = 0.055;
  group.add(screen);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.14, 0.30),
    new THREE.MeshBasicMaterial({ map: makeTexture("Reiki Hologram", "Low audio portal", "#7fffd4"), transparent: true, side: THREE.DoubleSide })
  );
  label.position.set(0, 0.90, 0.06);
  group.add(label);
  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.92, 1.26, 64),
    new THREE.MeshBasicMaterial({ color: 0x7fffd4, transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false })
  );
  glow.rotation.x = -Math.PI * 0.5;
  glow.position.set(0, -1.60, 0.76);
  group.add(glow);
  return {
    group,
    video,
    zoneCenter,
    getState(){
      return { videoOn: !video.paused, primed, near: currentVolume > 0.004, volume: currentVolume, maxVolume };
    },
    primeAudio,
    updateAudio(camera, dt = 0.016){
      if (!camera) return;
      const camPos = new THREE.Vector3();
      camera.getWorldPosition(camPos);
      const dist = Math.hypot(camPos.x - zoneCenter.x, camPos.z - zoneCenter.z);
      const nearRadius = 3.25;
      const fadeRadius = 5.25;
      let target = 0;
      if (dist < fadeRadius){
        const k = THREE.MathUtils.clamp((fadeRadius - dist) / (fadeRadius - nearRadius), 0, 1);
        target = maxVolume * k;
      }
      currentVolume = THREE.MathUtils.lerp(currentVolume, target, Math.min(1, dt * 2.8));
      video.volume = primed ? currentVolume : 0;
      video.muted = !primed || currentVolume < 0.002;
      if (video.paused) video.play().catch(()=>{});
    }
  };
}

export function installLobbyVisibilityLock({ scene }){
  const root = new THREE.Group();
  root.name = "SVR_Phase98D_HighSky_ReikiAligned";
  scene.add(root);

  const portals = [
    { key: "reiki", label: "Reiki", target: "reiki", position: new THREE.Vector3(-5.6, 0, -9.15) },
    { key: "pga", label: "PGA", target: "pga", position: new THREE.Vector3(0, 0, -9.25) },
    { key: "smoker", label: "Smoker Lounge", target: "sponsor", position: new THREE.Vector3(5.6, 0, -9.15) },
    { key: "store", label: "SVR Store", route: "../site/store.html", position: new THREE.Vector3(-9.25, 0, 0.8) },
    { key: "scorpion", label: "Scorpion Room", route: "./scorpion.html?v=phase98-playable", position: new THREE.Vector3(9.25, 0, 0.8) }
  ];

  addStorefront(root, "Reiki", "Hologram Portal", -5.6, -9.15, "#7fffd4", "reiki", { width: 3.35 });
  addStorefront(root, "PGA", "Golf Training", 0, -9.25, "#69e8ff", "pga", { width: 3.35 });
  addStorefront(root, "Smoker", "Lounge", 5.6, -9.15, "#ff8bd7", "smoker", { width: 3.35 });
  addStorefront(root, "SVR Store", "Web Portal", -9.25, 0.8, "#ffd36b", "store", { width: 3.55 });
  addStorefront(root, "Scorpion", "Play Poker", 9.25, 0.8, "#b48cff", "scorpion", { width: 3.55 });
  addStorefront(root, "Sponsor", "Ad Wall", 0, 9.25, "#a7ff80", "sponsor", { width: 3.55 });
  const reikiVideo = addReikiVideoPanel(root);

  addPanel(root, "Sponsor Board", "Future partner surface", 0, 6.45, -11.35, "#a7ff80", 6.5, 1.9);
  addPanel(root, "Espresso With Cream", "Tier 1 sponsor", 8.9, 6.20, -5.35, "#ffb477", 4.6, 1.55);
  addPanel(root, "SVR Store", "Official brand", -8.9, 6.20, -5.35, "#ffd36b", 4.6, 1.55, makeSvrLogoAdTexture());
  addPanel(root, "Scorpion Room", "Playable poker now open", 8.9, 5.40, 5.35, "#b48cff", 4.6, 1.55);
  addPanel(root, "Play With Purpose", "Community impact", 0, 6.45, 11.35, "#69e8ff", 6.5, 1.9);

  const moon = addOrb(root, 0xeaf2ff, -4.0, 42.0, -64.0, 5.10, "moon");
  const mars = addOrb(root, 0xff7f4f, 18.0, 38.0, -74.0, 3.10, "mars");

  return {
    portals,
    reikiVideo,
    primeReikiAudio: reikiVideo.primeAudio,
    getReikiAudioState: reikiVideo.getState,
    update(t = 0, dt = 0.016){
      const cam = scene.userData?._camera;
      reikiVideo.updateAudio(cam, dt);
      moon.group.position.x = -4.0 + Math.sin(t * 0.026) * 7.0;
      moon.group.position.y = 42.0 + Math.sin(t * 0.017) * 1.2;
      moon.group.position.z = -64.0 + Math.cos(t * 0.026) * 4.4;
      moon.sphere.rotation.y += dt * 0.055;
      moon.sphere.rotation.x += dt * 0.006;
      moon.halo.rotation.y += dt * 0.025;
      mars.group.position.x = 18.0 + Math.sin(t * 0.023) * 7.8;
      mars.group.position.y = 38.0 + Math.sin(t * 0.014) * 0.95;
      mars.group.position.z = -74.0 + Math.cos(t * 0.023) * 5.8;
      mars.sphere.rotation.y += dt * 0.082;
      mars.sphere.rotation.x += dt * 0.008;
      mars.halo.rotation.y += dt * 0.03;
    }
  };
}
