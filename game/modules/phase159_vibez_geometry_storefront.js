import * as THREE from "three";

function canvasTexture(width, height, draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function signTexture(title, subtitle, accent = "#58fff4"){
  return canvasTexture(1600, 420, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#010507");
    g.addColorStop(.55, "#061316");
    g.addColorStop(1, "#010203");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 18;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.strokeStyle = "rgba(255,255,255,.32)";
    ctx.lineWidth = 5;
    ctx.strokeRect(58, 58, w - 116, h - 116);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 116px system-ui, Arial";
    ctx.fillText(title, w / 2, 158, w - 140);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#bffcff";
    ctx.font = "900 54px system-ui, Arial";
    ctx.fillText(subtitle, w / 2, 288, w - 150);
  });
}

function posterTexture(title, lines, accent = "#b558ff"){
  return canvasTexture(900, 1300, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#050812");
    g.addColorStop(.55, "#12051f");
    g.addColorStop(1, "#020306");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    ctx.strokeRect(24, 24, w - 48, h - 48);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 76px system-ui, Arial";
    ctx.fillText(title, w / 2, 135, w - 100);
    ctx.fillStyle = "#dffcff";
    ctx.font = "800 42px system-ui, Arial";
    let y = 305;
    lines.forEach((line)=>{ ctx.fillText(line, w / 2, y, w - 120); y += 82; });
    ctx.fillStyle = "rgba(88,255,244,.12)";
    ctx.fillRect(110, h - 230, w - 220, 120);
    ctx.strokeStyle = "rgba(88,255,244,.66)";
    ctx.lineWidth = 8;
    ctx.strokeRect(110, h - 230, w - 220, 120);
    ctx.fillStyle = "#58fff4";
    ctx.font = "900 42px system-ui, Arial";
    ctx.fillText("VIBEZ ORIGINAL", w / 2, h - 170, w - 180);
  });
}

function floorTexture(){
  return canvasTexture(1024, 1024, (ctx, w, h)=>{
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w/2, h/2, 60, w/2, h/2, 420);
    g.addColorStop(0, "rgba(181,88,255,.82)");
    g.addColorStop(.48, "rgba(88,255,244,.26)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(88,255,244,.95)";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 250, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 86px system-ui, Arial";
    ctx.fillText("VIBEZ", w/2, h/2 + 118, w - 120);
    ctx.fillStyle = "#bffcff";
    ctx.font = "800 42px system-ui, Arial";
    ctx.fillText("THEATER", w/2, h/2 + 188, w - 120);
  });
}

function makeNeonBox(w, h, d, mat){
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

function hideOldVibes(scene){
  const hidden = [];
  scene.traverse((obj)=>{
    const name = String(obj?.name || "").toLowerCase();
    if (name.includes("vibes theater") || name.includes("vibez theater") || name.includes("blue vibes theater") || name.includes("clothes screen")){
      if (!name.includes("phase159")){
        obj.visible = false;
        hidden.push(obj);
      }
    }
  });
  return hidden;
}

function findPlacement(scene, sceneTargets = {}){
  const old = scene.userData?._phase140VibesTheater?.group;
  if (old){
    return { position: old.position.clone(), rotationY: old.rotation.y };
  }
  const reiki = sceneTargets.reiki || sceneTargets.reikiRoom;
  let position = new THREE.Vector3(0, 0, 38.5);
  if (reiki?.look){
    position = reiki.look.clone().multiplyScalar(-1);
    position.y = 0;
    if (position.length() < 8) position.set(0, 0, 38.5);
    position.setLength(Math.min(39.4, Math.max(34, position.length())));
  }
  const face = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), position);
  face.y = 0;
  face.normalize();
  return { position, rotationY: Math.atan2(face.x, face.z) };
}

function addGeometryStorefront(scene, sceneTargets){
  if (scene.userData._phase159VibezGeometryStorefront) return scene.userData._phase159VibezGeometryStorefront;
  hideOldVibes(scene);
  const { position, rotationY } = findPlacement(scene, sceneTargets);
  const group = new THREE.Group();
  group.name = "PHASE159 VIBEZ GEOMETRY STOREFRONT BLACK CYAN LOCK";
  group.position.copy(position);
  group.rotation.y = rotationY;

  const black = new THREE.MeshStandardMaterial({ color: 0x03080a, roughness: .74, metalness: .12, emissive: 0x031114, emissiveIntensity: .32 });
  const cyan = new THREE.MeshStandardMaterial({ color: 0x74fff0, roughness: .16, metalness: .62, emissive: 0x18b9a8, emissiveIntensity: .95 });
  const purple = new THREE.MeshStandardMaterial({ color: 0xb558ff, roughness: .22, metalness: .42, emissive: 0x5b1bc8, emissiveIntensity: .78 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8afff2, transparent: true, opacity: .13, roughness: .04, metalness: .16, emissive: 0x105852, emissiveIntensity: .18, side: THREE.DoubleSide, depthWrite: false });

  const wall = makeNeonBox(13.6, 6.3, .20, black); wall.position.set(0, 3.1, -.25); group.add(wall);
  const roof = makeNeonBox(13.9, .16, 2.1, black); roof.position.set(0, 6.28, .25); group.add(roof);
  [[0,6.04,.10,14.0,.14,.28],[-6.88,3.08,.10,.16,5.92,.30],[6.88,3.08,.10,.16,5.92,.30],[0,.24,.10,13.6,.12,.28]].forEach((v)=>{ const mesh = makeNeonBox(v[3], v[4], v[5], cyan); mesh.position.set(v[0], v[1], v[2]); group.add(mesh); });
  [[-3.48,3.08,.00,.12,4.90,.25],[3.48,3.08,.00,.12,4.90,.25],[0,3.08,.00,.12,4.90,.25]].forEach((v)=>{ const mesh = makeNeonBox(v[3], v[4], v[5], purple); mesh.position.set(v[0], v[1], v[2]); group.add(mesh); });

  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 5.0), glass);
  glassPane.name = "PHASE159 VIBEZ BLACK GLASS FRONT";
  glassPane.position.set(0, 3.08, .03);
  group.add(glassPane);

  const topSign = new THREE.Mesh(new THREE.PlaneGeometry(8.7, .95), new THREE.MeshBasicMaterial({ map: signTexture("VIBEZ THEATER", "GEOMETRY STOREFRONT", "#58fff4"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  topSign.name = "PHASE159 VIBEZ TOP SIGN GEOMETRY";
  topSign.position.set(0, 5.28, .18);
  group.add(topSign);

  const midSign = new THREE.Mesh(new THREE.PlaneGeometry(7.65, .76), new THREE.MeshBasicMaterial({ map: signTexture("VIBEZ PRESENTATION", "MOVIE • MUSIC • EVENTS", "#b558ff"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  midSign.name = "PHASE159 VIBEZ PRESENTATION SIGN";
  midSign.position.set(0, 4.36, .19);
  group.add(midSign);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 2.70), new THREE.MeshBasicMaterial({ map: posterTexture("NOW SHOWING", ["SVR VIBEZ", "Private theater", "Trailers", "Watch parties"], "#58fff4"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  screen.name = "PHASE159 VIBEZ CENTER SCREEN";
  screen.position.set(0, 2.45, .22);
  group.add(screen);
  const posterL = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 3.05), new THREE.MeshBasicMaterial({ map: posterTexture("LOUNGE", ["VIP seats", "Music nights", "Comedy", "Premieres"], "#b558ff"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  posterL.position.set(-4.65, 2.35, .21);
  group.add(posterL);
  const posterR = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 3.05), new THREE.MeshBasicMaterial({ map: posterTexture("EVENTS", ["Creator nights", "Film drops", "Social rooms", "No sponsors"], "#ffd56e"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  posterR.position.set(4.65, 2.35, .21);
  group.add(posterR);

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 8.8), new THREE.MeshStandardMaterial({ color: 0x220066, roughness: .78, metalness: .04, emissive: 0x10003d, emissiveIntensity: .32, side: THREE.DoubleSide }));
  carpet.rotation.x = -Math.PI * .5;
  carpet.position.set(0, .035, 4.25);
  group.add(carpet);
  [-1, 1].forEach((side)=>{ const trim = makeNeonBox(.055, .05, 8.75, cyan); trim.position.set(side * 1.80, .07, 4.25); group.add(trim); });

  const portal = new THREE.Mesh(new THREE.CircleGeometry(1.05, 72), new THREE.MeshBasicMaterial({ map: floorTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  portal.name = "PHASE159 VIBEZ FLOOR PORTAL GEOMETRY";
  portal.rotation.x = -Math.PI * .5;
  portal.position.set(0, .055, 1.20);
  group.add(portal);

  for (let i = 0; i < 18; i++){
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.055, 14, 10), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xb558ff : 0x58fff4, transparent: true, opacity: .92 }));
    bulb.name = "PHASE159 VIBEZ MARQUEE BULB";
    bulb.position.set(-6.05 + i * .71, 5.95, .32);
    group.add(bulb);
  }

  scene.add(group);
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt = .016)=>{
    oldTick?.(dt);
    const t = performance.now() * .001;
    group.traverse((obj)=>{
      if (obj.name === "PHASE159 VIBEZ MARQUEE BULB" && obj.material?.opacity !== undefined){
        obj.material.opacity = .48 + Math.sin(t * 4.0 + obj.position.x) * .28;
      }
    });
    portal.rotation.z += dt * .20;
  };
  scene.userData._phase159VibezGeometryStorefront = { group };
  return scene.userData._phase159VibezGeometryStorefront;
}

export function applyPhase159VibezGeometryStorefront(args = {}, result = {}){
  const scene = args.scene;
  if (!scene) return result;
  const vibez = addGeometryStorefront(scene, args.sceneTargets || {});
  window.SVR_PHASE159_VIBEZ_GEOMETRY = true;
  args.log?.("Phase 159 VIBEZ geometry storefront active");
  args.setStatus?.("Phase 159: VIBEZ geometry storefront active", { force: true });
  return { ...result, phase159Vibez: vibez };
}
