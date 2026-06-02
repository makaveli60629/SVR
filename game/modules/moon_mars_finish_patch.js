import * as THREE from "three";

const PATCH_NAME = "SVR_Phase98SH_Moon_Mars_Texture_Sky_Lock";

const MOON_TEXTURE_CANDIDATES = [
  "./assets/textures/moon.jpg",
  "./assets/textures/moon.png",
  "./assets/textures/Moon.jpg",
  "./assets/textures/Moon.png",
  "./assets/moon.jpg",
  "./assets/moon.png",
  "./moon.jpg",
  "./moon.png",
  "../assets/textures/moon.jpg",
  "../assets/textures/moon.png"
];

const MARS_TEXTURE_CANDIDATES = [
  "./assets/textures/mars.jpg",
  "./assets/textures/mars.png",
  "./assets/textures/Mars.jpg",
  "./assets/textures/Mars.png",
  "./assets/mars.jpg",
  "./assets/mars.png",
  "./mars.jpg",
  "./mars.png",
  "../assets/textures/mars.jpg",
  "../assets/textures/mars.png"
];

function canvasTexture(width, height, painter) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height, canvas);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

function makeBetterMoonTexture() {
  return canvasTexture(2048, 1024, (ctx, w, h) => {
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, "#d5d8df");
    base.addColorStop(0.45, "#9a9fa9");
    base.addColorStop(1, "#4f5663");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.42;
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 7 + Math.random() * 54;
      const crater = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.08, x, y, r);
      crater.addColorStop(0, "rgba(245,248,255,.34)");
      crater.addColorStop(0.36, "rgba(82,88,102,.32)");
      crater.addColorStop(0.72, "rgba(30,35,45,.20)");
      crater.addColorStop(1, "rgba(255,255,255,.08)");
      ctx.fillStyle = crater;
      ctx.beginPath();
      ctx.ellipse(x, y, r * (0.75 + Math.random() * 0.35), r * (0.45 + Math.random() * 0.28), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = "#e7ebf2";
    ctx.lineWidth = 2;
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 9 + Math.random() * 70;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.55 + Math.random() * 0.35), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    const shade = ctx.createLinearGradient(0, 0, w, 0);
    shade.addColorStop(0, "rgba(255,255,255,.16)");
    shade.addColorStop(0.45, "rgba(255,255,255,0)");
    shade.addColorStop(1, "rgba(0,0,0,.34)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  });
}

function makeBetterMarsTexture() {
  return canvasTexture(2048, 1024, (ctx, w, h) => {
    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, "#c16d43");
    base.addColorStop(0.44, "#7f3524");
    base.addColorStop(1, "#2a100d");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "#37130e";
    ctx.lineWidth = 7;
    for (let i = 0; i < 58; i++) {
      const y = 40 + i * 17 + Math.sin(i * 1.7) * 24;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 70) ctx.lineTo(x, y + Math.sin(x * 0.010 + i) * 18);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.30;
    for (let i = 0; i < 170; i++) {
      ctx.fillStyle = i % 2 ? "#df8a55" : "#4b190f";
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 90, 5 + Math.random() * 25, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    const shade = ctx.createLinearGradient(0, 0, w, 0);
    shade.addColorStop(0, "rgba(255,210,170,.12)");
    shade.addColorStop(0.5, "rgba(255,255,255,0)");
    shade.addColorStop(1, "rgba(0,0,0,.38)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  });
}

function loadTextureCandidates(candidates, fallback, label) {
  const loader = new THREE.TextureLoader();
  let index = 0;
  return new Promise((resolve) => {
    const tryNext = () => {
      if (index >= candidates.length) {
        const tex = fallback();
        tex.userData = { source: "fallback", label };
        resolve(tex);
        return;
      }
      const url = candidates[index++];
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 16;
          texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.userData = { source: url, label };
          resolve(texture);
        },
        undefined,
        () => tryNext()
      );
    };
    tryNext();
  });
}

function addPlanet(root, { name, texture, radius, position, tint, glowColor }) {
  const group = new THREE.Group();
  group.name = name;
  group.position.copy(position);
  root.add(group);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 64),
    new THREE.MeshStandardMaterial({
      map: texture,
      color: tint,
      roughness: 0.92,
      metalness: 0.0,
      emissive: glowColor,
      emissiveIntensity: 0.055
    })
  );
  sphere.name = `${name}_Sphere`;
  group.add(sphere);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 64, 32),
    new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.045,
      side: THREE.BackSide,
      depthWrite: false
    })
  );
  halo.name = `${name}_Subtle_Halo`;
  group.add(halo);

  return { group, sphere, halo, radius };
}

function hideOlderProceduralPlanets(scene) {
  const skipNames = new Set(["SVR_Hero_Moon", "SVR_Hero_Mars"]);
  scene.traverse((object) => {
    if (!object.isMesh || skipNames.has(object.name)) return;
    const p = new THREE.Vector3();
    object.getWorldPosition(p);
    const looksLikeSkyPlanet = object.geometry?.type === "SphereGeometry" && p.y > 45 && (Math.abs(p.z) > 80 || Math.abs(p.x) > 20);
    if (!looksLikeSkyPlanet) return;
    const s = new THREE.Vector3();
    object.getWorldScale(s);
    if (Math.max(s.x, s.y, s.z) > 2.5) object.visible = false;
  });
}

export async function installMoonMarsFinishPatch({ scene }) {
  if (!scene || scene.getObjectByName(PATCH_NAME)) return false;
  const root = new THREE.Group();
  root.name = PATCH_NAME;
  scene.add(root);

  hideOlderProceduralPlanets(scene);

  const [moonTexture, marsTexture] = await Promise.all([
    loadTextureCandidates(MOON_TEXTURE_CANDIDATES, makeBetterMoonTexture, "moon"),
    loadTextureCandidates(MARS_TEXTURE_CANDIDATES, makeBetterMarsTexture, "mars")
  ]);

  const moon = addPlanet(root, {
    name: "SVR_Hero_Moon",
    texture: moonTexture,
    radius: 18.5,
    position: new THREE.Vector3(-32, 178, -250),
    tint: 0xffffff,
    glowColor: 0x8fa8ff
  });

  const mars = addPlanet(root, {
    name: "SVR_Hero_Mars",
    texture: marsTexture,
    radius: 6.8,
    position: new THREE.Vector3(-4, 166, -246),
    tint: 0xffc0a0,
    glowColor: 0xd36b45
  });

  window.SVR_MOON_MARS_PATCH = {
    phase: "98S-H",
    status: "installed",
    moonTexture: moonTexture.userData?.source || "unknown",
    marsTexture: marsTexture.userData?.source || "unknown",
    moon: "high-large-hero",
    mars: "orbiting-near-moon",
    olderProceduralPlanetsHidden: true
  };

  return {
    update(dt, t) {
      moon.group.position.set(-32 + Math.sin(t * 0.018) * 3.0, 178 + Math.sin(t * 0.011) * 1.5, -250 + Math.cos(t * 0.018) * 2.2);
      moon.sphere.rotation.y += dt * 0.018;
      moon.sphere.rotation.x += dt * 0.002;
      const orbit = t * 0.15;
      mars.group.position.set(
        moon.group.position.x + Math.cos(orbit) * 31.5,
        moon.group.position.y - 11.0 + Math.sin(orbit * 0.7) * 4.5,
        moon.group.position.z + Math.sin(orbit) * 14.0
      );
      mars.sphere.rotation.y += dt * 0.038;
    }
  };
}

export function autoInstallMoonMarsFinishPatch() {
  let controller = null;
  let attempts = 0;
  const timer = window.setInterval(async () => {
    attempts += 1;
    const scene = window.SVR_SCENE;
    if (scene && !controller) {
      const result = await installMoonMarsFinishPatch({ scene });
      if (result) {
        controller = result;
        window.clearInterval(timer);
      }
    }
    if (attempts > 80) window.clearInterval(timer);
  }, 250);

  const clock = new THREE.Clock();
  function tick() {
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    controller?.update?.(dt, t);
    requestAnimationFrame(tick);
  }
  tick();
}

autoInstallMoonMarsFinishPatch();
