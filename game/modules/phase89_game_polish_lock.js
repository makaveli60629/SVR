import * as THREE from "three";
import { CONFIG } from "./config.js";

// Phase 89 runtime polish lock.
// Goals: building ads fit readable surfaces, Moon/Mars stay high and clear of skyline,
// Reiki hub approval look is restored with red carpet/ropes, watch hologram is visible,
// and Quest/browser performance is kept stable without exposing backend details.

const PHASE = "PHASE-89-GAME-POLISH-ADS-SKY-REIKI-WATCH-LOCK";
const scenes = new Set();
const patched = { sceneAdd: false };

function makeCanvasTexture(width, height, painter){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w * .5, h * .5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function makeReikiTexture(title, lines = [], opts = {}){
  return makeCanvasTexture(opts.w || 1400, opts.h || 520, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#210309");
    g.addColorStop(.52,"#07080f");
    g.addColorStop(1,"#310611");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = opts.stroke || "rgba(255,60,92,.94)";
    ctx.lineWidth = 12;
    roundRect(ctx, 24, 24, w - 48, h - 48, 34);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff6f8";
    ctx.font = opts.titleFont || "900 82px system-ui, Arial";
    ctx.fillText(title, w/2, opts.titleY || 135);
    ctx.fillStyle = opts.lineColor || "#ffd5dc";
    ctx.font = opts.font || "700 42px system-ui, Arial";
    let y = opts.startY || 245;
    for (const line of lines){
      ctx.fillText(line, w/2, y);
      y += opts.gap || 70;
    }
  });
}

function meshName(obj){ return String(obj?.name || "").toLowerCase(); }

function optimizeScene(scene){
  if (!scene || scene.userData.phase89Optimized) return;
  scene.userData.phase89Optimized = true;
  scene.traverse((obj)=>{
    if (!obj.isMesh) return;
    obj.castShadow = false;
    obj.receiveShadow = false;
    obj.frustumCulled = false;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat)=>{
      if (!mat) return;
      if (mat.map){
        mat.map.anisotropy = Math.min(mat.map.anisotropy || 4, 4);
        mat.map.wrapS = mat.map.wrapT = THREE.ClampToEdgeWrapping;
      }
      if ("roughness" in mat) mat.roughness = Math.max(mat.roughness || 0, .55);
      mat.needsUpdate = true;
    });
  });
}

function fitBuildingAds(scene){
  if (!scene) return;
  scene.traverse((obj)=>{
    if (!obj.isMesh || obj.userData.phase89AdFit) return;
    const geom = obj.geometry;
    const params = geom?.parameters || {};
    const w = Number(params.width || 0);
    const h = Number(params.height || 0);
    if (!w || !h) return;
    const hasMap = Boolean(obj.material?.map);
    const isTallBuildingAd = hasMap && obj.position.y > 7.5 && h >= 8.0 && w >= 3.0 && h / w > 1.45;
    const isHeaderAd = hasMap && obj.position.y > 2.0 && w >= 2.5 && h <= 2.0 && /espresso|sponsor|billboard|ad|store/i.test(meshName(obj) + " " + String(obj.material?.map?.source?.data?.dataset?.name || ""));
    if (!isTallBuildingAd && !isHeaderAd) return;

    if (obj.material?.map){
      obj.material.map.wrapS = obj.material.map.wrapT = THREE.ClampToEdgeWrapping;
      obj.material.map.repeat.set(1,1);
      obj.material.map.offset.set(0,0);
      obj.material.map.anisotropy = 4;
      obj.material.map.needsUpdate = true;
    }

    if (isTallBuildingAd){
      const aspect = w / h;
      const targetAspect = 0.62;
      if (aspect < 0.56) obj.scale.x = Math.min(1.34, Math.max(obj.scale.x, targetAspect / Math.max(aspect, .01)));
      if (aspect > 0.78) obj.scale.x = Math.min(obj.scale.x, 0.96);
      obj.scale.y = Math.min(obj.scale.y, 0.94);
      obj.renderOrder = Math.max(obj.renderOrder || 0, 36);
    }

    if (obj.material){
      obj.material.side = THREE.DoubleSide;
      obj.material.depthWrite = true;
      obj.material.depthTest = true;
      obj.material.needsUpdate = true;
    }
    obj.userData.phase89AdFit = true;
  });
}

function findSkyBody(scene, radiusTarget, colorHint){
  let best = null;
  let bestScore = Infinity;
  scene.traverse((obj)=>{
    if (!obj.isMesh || !obj.geometry?.parameters?.radius) return;
    const r = obj.geometry.parameters.radius;
    const score = Math.abs(r - radiusTarget) + (obj.position.y < 25 ? 10 : 0);
    if (colorHint && obj.material?.color){
      const c = obj.material.color;
      if (colorHint === "mars" && c.r < c.b) return;
      if (colorHint === "moon" && c.r < .45) return;
    }
    if (score < bestScore){ best = obj; bestScore = score; }
  });
  return best;
}

function lockMoonMars(scene, t){
  if (!scene) return;
  if (!scene.userData.phase89Moon) scene.userData.phase89Moon = findSkyBody(scene, 5.6, "moon");
  if (!scene.userData.phase89Mars) scene.userData.phase89Mars = findSkyBody(scene, 3.1, "mars");
  const moon = scene.userData.phase89Moon;
  const mars = scene.userData.phase89Mars;
  const wallHeight = CONFIG.WALL_HEIGHT * 0.56;
  const R = CONFIG.ROOM_RADIUS;
  if (moon){
    moon.visible = true;
    moon.frustumCulled = false;
    moon.position.set(-156 + Math.sin(t * .010) * 4.0, wallHeight + 190 + Math.sin(t * .045) * 1.2, -(R + 560) + Math.cos(t * .010) * 4.0);
    moon.rotation.y += 0.0016;
  }
  if (mars){
    mars.visible = true;
    mars.frustumCulled = false;
    mars.position.set(228 + Math.sin(t * .009 + 1.2) * 5.0, wallHeight + 212 + Math.sin(t * .038 + .8) * 1.1, -(R + 690) + Math.cos(t * .009) * 4.0);
    mars.rotation.y += 0.0012;
  }

  // Keep halos and lights near the corrected bodies when they are easy to identify by color/scale.
  scene.traverse((obj)=>{
    if (!obj.isSprite && !obj.isPointLight) return;
    const matColor = obj.material?.color?.getHex?.() || obj.color?.getHex?.() || 0;
    if (moon && (matColor === 0xf4f7ff || matColor === 0xeaf2ff)) obj.position.copy(moon.position);
    if (mars && (matColor === 0xff9b6b || matColor === 0xff9a72)) obj.position.copy(mars.position);
  });
}

function addRope(root, a, b, y, mat){
  const dir = new THREE.Vector3().subVectors(b,a);
  const len = dir.length();
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,12), mat);
  rope.position.copy(a).lerp(b,.5).add(new THREE.Vector3(0,y,0));
  rope.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
  root.add(rope);
}

function addReikiApprovalOverlay(scene){
  if (!scene || scene.userData.phase89ReikiOverlay) return;
  scene.userData.phase89ReikiOverlay = true;
  const R = CONFIG.ROOM_RADIUS;
  const wallHeight = CONFIG.WALL_HEIGHT * 0.56;
  const center = new THREE.Vector3(R - 4.05, .012, 0);
  const inward = new THREE.Vector3(-1,0,0);
  const root = new THREE.Group();
  root.name = "PHASE89_REIKI_APPROVAL_HUB_OVERLAY";
  root.position.copy(center).add(new THREE.Vector3(-.04,0,.02));
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const redMat = new THREE.MeshStandardMaterial({ color: 0xb50c28, roughness:.38, metalness:.12, emissive:0x680512, emissiveIntensity:.65 });
  const goldMat = new THREE.MeshStandardMaterial({ color:0xffd36b, roughness:.32, metalness:.45, emissive:0x5a3505, emissiveIntensity:.32 });
  const darkMat = new THREE.MeshStandardMaterial({ color:0x08080f, roughness:.88, metalness:.06, emissive:0x17030a, emissiveIntensity:.13 });
  const glassMat = new THREE.MeshStandardMaterial({ color:0xff7f95, transparent:true, opacity:.12, roughness:.08, metalness:.14, emissive:0x4c0714, emissiveIntensity:.25, side:THREE.DoubleSide });

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(9.4,4.6), new THREE.MeshStandardMaterial({ color:0x8e0719, roughness:.92, metalness:.02, emissive:0x35010a, emissiveIntensity:.28, side:THREE.DoubleSide }));
  carpet.rotation.x = -Math.PI*.5;
  carpet.position.set(0,.012,1.0);
  root.add(carpet);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(10.8,3.5), glassMat);
  glass.position.set(0,2.45,.72);
  root.add(glass);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.4,.90), new THREE.MeshBasicMaterial({ map: makeReikiTexture("VR REIKI TIME by S.R", ["AWAITING APPROVAL"], { w:1600, h:300, titleFont:"900 76px system-ui, Arial", font:"800 48px system-ui, Arial", titleY:105, startY:210 }), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  sign.position.set(0, wallHeight * .54, .82);
  sign.renderOrder = 44;
  root.add(sign);

  const panelDefs = [
    [-3.35, "APPROVAL LOCK", ["Sponsor art pending", "No outside branding", "SVR placeholder mode"]],
    [0, "REIKI HUB", ["Meditation portal", "Red carpet entry", "Private room route"]],
    [3.35, "TEXTURES READY", ["Glass storefront", "Red rope queue", "Premium calm zone"]]
  ];
  panelDefs.forEach(([x,title,lines])=>{
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.75,2.15), new THREE.MeshBasicMaterial({ map: makeReikiTexture(title, lines, { w:1000, h:820, titleFont:"900 52px system-ui, Arial", font:"700 34px system-ui, Arial", titleY:100, startY:235, gap:95 }), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    panel.position.set(x,2.10,.84);
    panel.renderOrder = 43;
    root.add(panel);
  });

  const pts = [new THREE.Vector3(-4.7,0,.10), new THREE.Vector3(4.7,0,.10), new THREE.Vector3(4.7,0,2.70), new THREE.Vector3(-4.7,0,2.70)];
  pts.forEach((p)=>{
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.82,16), goldMat);
    post.position.copy(p).add(new THREE.Vector3(0,.41,0));
    root.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.105,16,12), redMat);
    cap.position.copy(p).add(new THREE.Vector3(0,.86,0));
    root.add(cap);
  });
  for (let i=0;i<pts.length;i++){
    const a = pts[i];
    const b = pts[(i+1)%pts.length];
    addRope(root,a,b,.70,redMat);
    addRope(root,a,b,.53,redMat);
  }

  [-4.85,4.85].forEach((x)=>{
    const trim = new THREE.Mesh(new THREE.BoxGeometry(.10,3.55,.10), redMat);
    trim.position.set(x,2.35,.86);
    root.add(trim);
  });

  const glow = new THREE.PointLight(0xff426a, 1.8, 10, 2.0);
  glow.position.set(0,2.6,1.6);
  root.add(glow);
}

function patchWatchHolograms(scene, t){
  if (!scene) return;
  scene.traverse((obj)=>{
    if (!obj.isGroup || obj.userData.phase89WatchHologram) return;
    let watchPlane = null;
    for (const child of obj.children || []){
      const p = child?.geometry?.parameters;
      if (child.isMesh && p?.width > .18 && p.width < .24 && p?.height > .09 && p.height < .13){ watchPlane = child; break; }
    }
    if (!watchPlane) return;
    obj.userData.phase89WatchHologram = true;
    const tex = makeCanvasTexture(640, 320, (ctx,w,h)=>{
      ctx.clearRect(0,0,w,h);
      const g = ctx.createLinearGradient(0,0,w,h);
      g.addColorStop(0,"rgba(82,230,255,.05)");
      g.addColorStop(.5,"rgba(180,120,255,.42)");
      g.addColorStop(1,"rgba(30,60,255,.06)");
      ctx.fillStyle = g;
      roundRect(ctx,24,24,w-48,h-48,30);
      ctx.fill();
      ctx.strokeStyle = "rgba(105,232,255,.86)";
      ctx.lineWidth = 6;
      roundRect(ctx,24,24,w-48,h-48,30);
      ctx.stroke();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ecfbff";
      ctx.font = "900 52px system-ui, Arial";
      ctx.fillText("SVR HOLOGRAM", w/2, 112);
      ctx.fillStyle = "#d9c7ff";
      ctx.font = "700 32px system-ui, Arial";
      ctx.fillText("TP • ROOMS • STORE • GAME", w/2, 192);
    });
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(.30,.15), new THREE.MeshBasicMaterial({ map:tex, transparent:true, opacity:.55, side:THREE.DoubleSide, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, toneMapped:false }));
    holo.position.set(0,.105,.055);
    holo.rotation.x = -0.16;
    holo.renderOrder = 90;
    obj.add(holo);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(.13,.12,32,1,true), new THREE.MeshBasicMaterial({ color:0x69e8ff, transparent:true, opacity:.10, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
    beam.position.set(0,.046,.028);
    beam.rotation.x = Math.PI;
    beam.renderOrder = 89;
    obj.add(beam);
    obj.userData.phase89Holo = holo;
    obj.userData.phase89Beam = beam;
  });
  scene.traverse((obj)=>{
    if (!obj.userData?.phase89Holo) return;
    const pulse = .42 + Math.sin(t*2.6)*.10;
    obj.userData.phase89Holo.material.opacity = pulse;
    obj.userData.phase89Beam.material.opacity = .08 + Math.sin(t*2.2)*.025;
  });
}

function patchScene(scene){
  const t = performance.now() * .001;
  optimizeScene(scene);
  fitBuildingAds(scene);
  lockMoonMars(scene, t);
  addReikiApprovalOverlay(scene);
  patchWatchHolograms(scene, t);
  window.SVR_PHASE89_GAME_POLISH = {
    phase: PHASE,
    ads: "fit-and-clamped",
    sky: "moon-mars-high-and-clear",
    reiki: "approval-look-red-rope-textures",
    watch: "hologram-overlay-enabled",
    performance: "shadows-off-texture-clamped"
  };
}

function tick(){
  for (const scene of scenes) patchScene(scene);
  requestAnimationFrame(tick);
}

if (!patched.sceneAdd){
  patched.sceneAdd = true;
  const originalAdd = THREE.Scene.prototype.add;
  THREE.Scene.prototype.add = function phase89SceneAdd(...objects){
    scenes.add(this);
    const result = originalAdd.apply(this, objects);
    return result;
  };
}

requestAnimationFrame(tick);
console.log(`[SVR] ${PHASE} loaded`);
