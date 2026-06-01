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

export function installLobbyVisibilityLock({ scene }){
  const root = new THREE.Group();
  root.name = "SVR_BootSafe_Visibility_Lock";
  scene.add(root);

  addStorefront(root, "Reiki", "Private Room", -5.6, -5.8, "#7fffd4");
  addStorefront(root, "PGA", "Golf Training", 0, -6.8, "#69e8ff");
  addStorefront(root, "Smoker", "Lounge", 5.6, -5.8, "#ff8bd7");
  addStorefront(root, "SVR Store", "Portal", -6.8, 1.4, "#ffd36b");
  addStorefront(root, "Scorpion", "Poker Room", 6.8, 1.4, "#b48cff");

  addPanel(root, "Sponsor Board", "Future partner surface", 0, 5.8, -10.4, "#a7ff80", 5.2, 1.7);
  addPanel(root, "Espresso With Cream", "Tier 1 sponsor", 9.8, 5.4, -2.6, "#ffb477", 4.1, 1.55);
  addPanel(root, "SVR Store", "Gear and avatar items", -9.8, 5.4, -2.6, "#ffd36b", 4.1, 1.55);
  addPanel(root, "Play With Purpose", "Community impact", 0, 5.8, 10.4, "#69e8ff", 5.2, 1.7);

  const moon = addOrb(root, 0xeaf2ff, 0, 14.2, -18, 1.65);
  const mars = addOrb(root, 0xff7f4f, -12, 12.6, 13.4, 0.95);

  return {
    update(t = 0, dt = 0.016){
      moon.group.position.x = Math.sin(t * 0.05) * 1.1;
      moon.sphere.rotation.y += dt * 0.035;
      mars.group.position.x = -12 + Math.sin(t * 0.043) * 1.0;
      mars.sphere.rotation.y += dt * 0.052;
    }
  };
}
