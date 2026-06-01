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

function addPanel(root, title, subtitle, x, y, z, color, width = 3.1, height = 1.55){
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: makeTexture(title, subtitle, color), transparent: true, side: THREE.DoubleSide })
  );
  panel.position.set(x, y, z);
  panel.lookAt(0, y, 0);
  root.add(panel);
  return panel;
}

function addStorefront(root, title, subtitle, x, z, color){
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = Math.atan2(-x, -z);
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
  return group;
}

function addOrb(root, color, x, y, z, scale){
  const group = new THREE.Group();
  group.position.set(x, y, z);
  root.add(group);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(scale, 40, 24),
    new THREE.MeshBasicMaterial({ color })
  );
  group.add(sphere);
  const glow = new THREE.PointLight(color, 1.4, 80, 1.5);
  group.add(glow);
  return { group, sphere };
}

function addReikiVideoPanel(root){
  const group = new THREE.Group();
  group.position.set(-5.6, 1.7, -5.45);
  group.rotation.y = Math.atan2(5.6, 5.45);
  root.add(group);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 1.62, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x120818, roughness: 0.45, metalness: 0.1, emissive: 0x30104a, emissiveIntensity: 0.28 })
  );
  group.add(frame);
  const video = document.createElement("video");
  video.src = "../site/assets/video/reiki_hologram.mp4";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = "metadata";
  video.volume = 0.02;
  video.play().catch(()=>{});
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.32, 1.32),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false })
  );
  screen.position.z = 0.055;
  group.add(screen);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.34),
    new THREE.MeshBasicMaterial({ map: makeTexture("Reiki Video", "Muted lobby preview", "#7fffd4"), transparent: true, side: THREE.DoubleSide })
  );
  label.position.set(0, 0.98, 0.06);
  group.add(label);
  return { group, video };
}

export function installLobbyVisibilityLock({ scene }){
  const root = new THREE.Group();
  root.name = "SVR_BootSafe_Visibility_Lock";
  scene.add(root);

  addStorefront(root, "Reiki", "Private Room", -5.6, -5.8, "#7fffd4");
  addStorefront(root, "PGA", "Golf Training", 0, -6.8, "#69e8ff");
  addStorefront(root, "Smoker", "Lounge", 5.6, -5.8, "#ff8bd7");
  addStorefront(root, "SVR Store", "Portal", -6.8, 1.4, "#ffd36b");
  addStorefront(root, "Scorpion", "Poker Room", 6.8, 1.4, "#b48cff");
  addReikiVideoPanel(root);

  addPanel(root, "Sponsor Board", "Future partner surface", 0, 5.8, -10.4, "#a7ff80", 5.2, 1.7);
  addPanel(root, "Espresso With Cream", "Tier 1 sponsor", 9.8, 5.4, -2.6, "#ffb477", 4.1, 1.55);
  addPanel(root, "SVR Store", "Gear and avatar items", -9.8, 5.4, -2.6, "#ffd36b", 4.1, 1.55);
  addPanel(root, "Play With Purpose", "Community impact", 0, 5.8, 10.4, "#69e8ff", 5.2, 1.7);

  const moon = addOrb(root, 0xeaf2ff, 0, 16.4, -22, 2.15);
  const mars = addOrb(root, 0xff7f4f, -12, 14.8, 16.5, 1.32);

  return {
    update(t = 0, dt = 0.016){
      moon.group.position.x = Math.sin(t * 0.05) * 1.8;
      moon.group.position.z = -22 + Math.cos(t * 0.05) * 1.2;
      moon.sphere.rotation.y += dt * 0.045;
      mars.group.position.x = -12 + Math.sin(t * 0.043) * 1.5;
      mars.group.position.z = 16.5 + Math.cos(t * 0.043) * 1.0;
      mars.sphere.rotation.y += dt * 0.06;
    }
  };
}
