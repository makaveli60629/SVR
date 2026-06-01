import * as THREE from "three";

function makeTexture(title, subtitle, color = "#69e8ff"){
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#050713");
  grad.addColorStop(1, "#150625");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 56px Arial";
  ctx.fillText(String(title || "SVR").toUpperCase(), canvas.width / 2, 148);
  ctx.fillStyle = color;
  ctx.font = "800 28px Arial";
  ctx.fillText(String(subtitle || "PORTAL").toUpperCase(), canvas.width / 2, 235);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
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
    new THREE.MeshBasicMaterial({ map: texture || makeTexture(title, subtitle, color), transparent: true, side: THREE.DoubleSide })
  );
  panel.position.set(x, y, z);
  panel.lookAt(0, y, 0);
  root.add(panel);
  return panel;
}

function addStorefront(root, title, subtitle, x, z, color, portalKey){
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = Math.atan2(-x, -z);
  group.userData.portalKey = portalKey;
  root.add(group);
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 2.15, 0.20),
    new THREE.MeshStandardMaterial({ color: 0x080d18, roughness: 0.76, metalness: 0.05, emissive: 0x101625, emissiveIntensity: 0.18 })
  );
  body.position.y = 1.12;
  group.add(body);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.38, 0.82),
    new THREE.MeshBasicMaterial({ map: makeTexture(title, subtitle, color), transparent: true, side: THREE.DoubleSide })
  );
  sign.position.set(0, 2.55, 0.13);
  group.add(sign);
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.78, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color).getHex(), transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false })
  );
  marker.rotation.x = -Math.PI * 0.5;
  marker.position.set(0, 0.035, 0.72);
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
  const glow = new THREE.PointLight(color, 1.95, 145, 1.35);
  group.add(glow);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(scale * 1.18, 48, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false })
  );
  group.add(halo);
  return { group, sphere, halo };
}

function addReikiVideoPanel(root){
  const group = new THREE.Group();
  const center = new THREE.Vector3(-5.6, 1.55, -5.58);
  group.position.copy(center);
  group.rotation.y = Math.atan2(5.6, 5.8);
  root.add(group);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.06, 1.34, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x120818, roughness: 0.45, metalness: 0.1, emissive: 0x30104a, emissiveIntensity: 0.34 })
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
  const zoneCenter = new THREE.Vector3(-5.6, 1.6, -5.8);
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
    new THREE.PlaneGeometry(1.86, 1.05),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false })
  );
  screen.position.z = 0.055;
  group.add(screen);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.30),
    new THREE.MeshBasicMaterial({ map: makeTexture("Reiki Hologram", "Portal audio zone", "#7fffd4"), transparent: true, side: THREE.DoubleSide })
  );
  label.position.set(0, 0.84, 0.06);
  group.add(label);

  const glow = new THREE.Mesh(
    new THREE.RingGeometry(0.80, 1.12, 64),
    new THREE.MeshBasicMaterial({ color: 0x7fffd4, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  glow.rotation.x = -Math.PI * 0.5;
  glow.position.set(0, -1.50, 0.62);
  group.add(glow);

  return {
    group,
    video,
    zoneCenter,
    getState(){
      return {
        videoOn: !video.paused,
        primed,
        near: currentVolume > 0.004,
        volume: currentVolume,
        maxVolume
      };
    },
    primeAudio,
    updateAudio(camera, dt = 0.016){
      if (!camera) return;
      const camPos = new THREE.Vector3();
      camera.getWorldPosition(camPos);
      const dx = camPos.x - zoneCenter.x;
      const dz = camPos.z - zoneCenter.z;
      const dist = Math.hypot(dx, dz);
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
  root.name = "SVR_Phase96D_Reiki_Hologram_AudioZone";
  scene.add(root);

  const portals = [
    { key: "reiki", label: "Reiki", target: "reiki", position: new THREE.Vector3(-5.6, 0, -5.8) },
    { key: "pga", label: "PGA", target: "pga", position: new THREE.Vector3(0, 0, -6.8) },
    { key: "smoker", label: "Smoker Lounge", target: "sponsor", position: new THREE.Vector3(5.6, 0, -5.8) },
    { key: "store", label: "SVR Store", route: "../site/store.html", position: new THREE.Vector3(-6.8, 0, 1.4) },
    { key: "scorpion", label: "Scorpion Room", target: "scorpion", position: new THREE.Vector3(6.8, 0, 1.4) }
  ];

  addStorefront(root, "Reiki", "Hologram Portal", -5.6, -5.8, "#7fffd4", "reiki");
  addStorefront(root, "PGA", "Golf Training", 0, -6.8, "#69e8ff", "pga");
  addStorefront(root, "Smoker", "Lounge", 5.6, -5.8, "#ff8bd7", "smoker");
  addStorefront(root, "SVR Store", "Portal", -6.8, 1.4, "#ffd36b", "store");
  addStorefront(root, "Scorpion", "Poker Room", 6.8, 1.4, "#b48cff", "scorpion");
  const reikiVideo = addReikiVideoPanel(root);

  addPanel(root, "Sponsor Board", "Future partner surface", 0, 5.8, -10.4, "#a7ff80", 5.2, 1.7);
  addPanel(root, "Espresso With Cream", "Tier 1 sponsor", 9.8, 5.4, -2.6, "#ffb477", 4.1, 1.55);
  addPanel(root, "SVR Store", "Official brand", -9.8, 5.4, -2.6, "#ffd36b", 4.1, 1.55, makeSvrLogoAdTexture());
  addPanel(root, "Play With Purpose", "Community impact", 0, 5.8, 10.4, "#69e8ff", 5.2, 1.7);

  const moon = addOrb(root, 0xeaf2ff, -2.0, 23.5, -33.0, 3.45, "moon");
  const mars = addOrb(root, 0xff7f4f, 14.0, 21.4, -39.0, 2.10, "mars");

  return {
    portals,
    reikiVideo,
    primeReikiAudio: reikiVideo.primeAudio,
    getReikiAudioState: reikiVideo.getState,
    update(t = 0, dt = 0.016){
      const cam = scene.userData?._camera;
      reikiVideo.updateAudio(cam, dt);
      moon.group.position.x = -2.0 + Math.sin(t * 0.036) * 4.8;
      moon.group.position.y = 23.5 + Math.sin(t * 0.021) * 0.8;
      moon.group.position.z = -33.0 + Math.cos(t * 0.036) * 3.2;
      moon.sphere.rotation.y += dt * 0.055;
      moon.sphere.rotation.x += dt * 0.006;
      moon.halo.rotation.y += dt * 0.025;
      mars.group.position.x = 14.0 + Math.sin(t * 0.031) * 5.8;
      mars.group.position.y = 21.4 + Math.sin(t * 0.019) * 0.6;
      mars.group.position.z = -39.0 + Math.cos(t * 0.031) * 4.4;
      mars.sphere.rotation.y += dt * 0.082;
      mars.sphere.rotation.x += dt * 0.008;
      mars.halo.rotation.y += dt * 0.03;
    }
  };
}
