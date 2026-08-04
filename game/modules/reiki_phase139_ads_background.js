import * as THREE from "three";
import { applyPhase138CarpetRopeRefine } from "./reiki_phase138_carpet_rope_refine.js";
import { ESPRESSO_AD_DATA_URL, TRUEITIVE_PHOTO_DATA_URL, BUDDHA_BACKGROUND_URL } from "./reiki_phase139_uploaded_assets.js";

function loadTexture(url, { fallback = null } = {}){
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = "anonymous";
  return new Promise((resolve)=>{
    loader.load(url, (texture)=>{
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      resolve(texture);
    }, undefined, ()=>resolve(fallback));
  });
}

function canvasTexture(w, h, draw){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function fallbackBuddhaTexture(){
  return canvasTexture(1200, 760, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#06100c");
    g.addColorStop(.55, "#1a0f12");
    g.addColorStop(1, "#020506");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(190,170,135,.32)";
    ctx.beginPath();
    ctx.ellipse(w / 2, 350, 190, 235, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(220,190,145,.48)";
    ctx.beginPath();
    ctx.arc(w / 2, 225, 88, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#eafff5";
    ctx.font = "900 72px system-ui,Arial";
    ctx.fillText("REIKI MEDITATION", w / 2, 610);
    ctx.fillStyle = "#ffccd4";
    ctx.font = "900 34px system-ui,Arial";
    ctx.fillText("AWAITING APPROVAL", w / 2, 680);
  });
}

function makeTrueitiveAdTexture(photoTexture){
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 1400;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#061716");
  g.addColorStop(.58, "#110719");
  g.addColorStop(1, "#020405");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#7dfff0";
  ctx.lineWidth = 18;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f7ffff";
  ctx.font = "900 70px system-ui,Arial";
  ctx.fillText("TRUEITIVE", 450, 112);
  ctx.fillStyle = "#dffff8";
  ctx.font = "800 42px system-ui,Arial";
  ctx.fillText("Reiki • Meditation", 450, 190);
  ctx.fillText("Wellness Preview", 450, 250);
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(110, 310, 680, 640);
  ctx.strokeStyle = "rgba(125,255,240,.70)";
  ctx.lineWidth = 8;
  ctx.strokeRect(110, 310, 680, 640);
  ctx.fillStyle = "#ffccd4";
  ctx.font = "900 34px system-ui,Arial";
  ctx.fillText("AWAITING APPROVAL", 450, 1050);
  ctx.fillStyle = "#ffe8bf";
  ctx.font = "900 46px system-ui,Arial";
  ctx.fillText("TRUEITIVE.COM", 450, 1160);
  ctx.fillStyle = "#dffff8";
  ctx.font = "700 31px system-ui,Arial";
  ctx.fillText("Founder presentation photo", 450, 1230);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.photoRect = { x: 110, y: 310, w: 680, h: 640 };
  return tex;
}

function addTexturePanel(parent, texture, position, size, name, { frameColor = 0xffd37b, emissive = 0x3a2106 } = {}){
  const group = new THREE.Group();
  group.name = name;
  group.position.copy(position);
  parent.add(group);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(size.x + .24, size.y + .24, .08),
    new THREE.MeshStandardMaterial({ color: frameColor, metalness: .35, roughness: .28, emissive, emissiveIntensity: .25 })
  );
  frame.position.z = -.045;
  group.add(frame);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x, size.y),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(panel);
  return { group, panel };
}

function addLobbyWallAd(scene, texture, x, z, w, h, name){
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, 4.1, z);
  scene.add(group);
  group.lookAt(0, 3.2, 0);
  addTexturePanel(group, texture, new THREE.Vector3(0, 0, 0), new THREE.Vector2(w, h), `${name} PANEL`);
  return group;
}

export async function applyPhase139UploadedAdsBackground(args = {}){
  const result = applyPhase138CarpetRopeRefine(args);
  const scene = args.scene;
  if (!scene || scene.userData._phase139UploadedAds) return result;

  const reikiGroup = result?.group || scene.userData?._phase136Reiki?.group || scene.userData?._phase135ReikiWallAligned?.group;
  const espressoTex = await loadTexture(ESPRESSO_AD_DATA_URL);
  const trueitivePhotoTex = await loadTexture(TRUEITIVE_PHOTO_DATA_URL);
  const buddhaFallback = fallbackBuddhaTexture();
  const buddhaTex = await loadTexture(BUDDHA_BACKGROUND_URL, { fallback: buddhaFallback });

  if (reikiGroup){
    // Buddha-style Reiki background behind the one-screen hologram.
    const buddha = addTexturePanel(
      reikiGroup,
      buddhaTex || buddhaFallback,
      new THREE.Vector3(0, 2.92, .09),
      new THREE.Vector2(5.15, 3.25),
      "PHASE139 REIKI BUDDHA BACKGROUND",
      { frameColor: 0x7dfff0, emissive: 0x0c3b37 }
    );
    buddha.group.position.z = -0.055;
    buddha.panel.material.opacity = .38;

    // Put the uploaded Trueitive founder photo in the right wall photo slot.
    const photo = addTexturePanel(
      reikiGroup,
      trueitivePhotoTex,
      new THREE.Vector3(3.82, 2.98, .235),
      new THREE.Vector2(1.58, 2.06),
      "PHASE139 TRUEITIVE FOUNDER PHOTO RIGHT WALL",
      { frameColor: 0x7dfff0, emissive: 0x0c3b37 }
    );
    photo.panel.material.opacity = 1;
  }

  // Espresso with Cream lobby wall ads.
  addLobbyWallAd(scene, espressoTex, -12.0, 31.45, 3.1, 4.85, "PHASE139 ESPRESSO WITH CREAM WALL AD LEFT");
  addLobbyWallAd(scene, espressoTex, 12.0, 31.45, 3.1, 4.85, "PHASE139 ESPRESSO WITH CREAM WALL AD RIGHT");

  // Trueitive wellness photo ad near Reiki side wall.
  const trueitiveAd = addLobbyWallAd(scene, trueitivePhotoTex, 30.95, 8.0, 2.65, 3.38, "PHASE139 TRUEITIVE PHOTO WALL AD");
  trueitiveAd.lookAt(0, 2.6, 0);

  scene.userData._phase139UploadedAds = true;
  args.setStatus?.("Phase 139 uploaded ads and Reiki background active", { force: true });
  args.log?.("Phase 139 uploaded Espresso ad, Trueitive founder photo, and Reiki Buddha background active");
  return result;
}
