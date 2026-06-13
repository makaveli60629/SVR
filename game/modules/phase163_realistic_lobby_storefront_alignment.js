import * as THREE from "three";

function texture(width, height, draw){
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

function rounded(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeSignTexture(title, subtitle, accent, trim){
  return texture(1800, 560, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#02080b");
    bg.addColorStop(.54, "#071014");
    bg.addColorStop(1, "#010203");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w/2, h/2, 30, w/2, h/2, w*.48);
    glow.addColorStop(0, accent.replace("#", "rgba(") === accent ? "rgba(88,255,244,.20)" : "rgba(88,255,244,.20)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 22;
    rounded(ctx, 26, 26, w - 52, h - 52, 42);
    ctx.stroke();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 9;
    rounded(ctx, 76, 76, w - 152, h - 152, 28);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 132px system-ui, Arial";
    ctx.fillText(title, w/2, 220, w - 180);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e8fff8";
    ctx.font = "900 58px system-ui, Arial";
    ctx.fillText(subtitle, w/2, 376, w - 180);
  });
}

function makeWindowPoster(title, lines, accent, trim){
  return texture(1000, 1300, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#03090d");
    bg.addColorStop(.58, "#071215");
    bg.addColorStop(1, "#040407");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,.045)";
    rounded(ctx, 86, 110, w - 172, h - 220, 46);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 16;
    rounded(ctx, 30, 30, w - 60, h - 60, 44);
    ctx.stroke();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 6;
    rounded(ctx, 70, 70, w - 140, h - 140, 32);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 76px system-ui, Arial";
    ctx.fillText(title, w/2, 150, w - 120);
    ctx.fillStyle = "#dffcf7";
    ctx.font = "800 40px system-ui, Arial";
    let y = 335;
    lines.forEach((line)=>{ ctx.fillText(line, w/2, y, w - 130); y += 82; });
    ctx.fillStyle = "rgba(255,255,255,.10)";
    rounded(ctx, 120, h - 240, w - 240, 118, 28);
    ctx.fill();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 7;
    rounded(ctx, 120, h - 240, w - 240, 118, 28);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 34px system-ui, Arial";
    ctx.fillText("OPEN / INFO / NEXT", w/2, h - 180, w - 160);
  });
}

function makeButtonTexture(label, accent, trim){
  return texture(1100, 280, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "rgba(2,10,12,.96)");
    bg.addColorStop(.55, "rgba(5,22,20,.94)");
    bg.addColorStop(1, "rgba(12,9,5,.94)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 16;
    rounded(ctx, 18, 18, w - 36, h - 36, 36);
    ctx.stroke();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 6;
    rounded(ctx, 52, 52, w - 104, h - 104, 24);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = trim;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 72px system-ui, Arial";
    ctx.fillText(label, w/2, h/2, w - 100);
  });
}

function floorTexture(label, accent, trim){
  return texture(1024, 1024, (ctx, w, h)=>{
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w/2, h/2, 40, w/2, h/2, 460);
    g.addColorStop(0, "rgba(255,255,255,.50)");
    g.addColorStop(.34, "rgba(88,255,244,.24)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = trim;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 280, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 216, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 72px system-ui, Arial";
    ctx.fillText(label, w/2, h/2 + 132, w - 130);
  });
}

const HUBS = [
  { key:"wellness", title:"WELLNESS HUB", subtitle:"LUXURY PLACEHOLDER", accent:"#7dffcc", trim:"#ffd56e", x:0, z:-24, w:11.2, lines:["calm lobby anchor", "no sponsor active", "registry locked"] },
  { key:"pga", title:"PGA HUB", subtitle:"GOLF TRAINING", accent:"#7dffb2", trim:"#58fff4", x:17, z:-17, w:10.2, lines:["training screens", "practice portal", "academy placeholder"] },
  { key:"vibez", title:"VIBEZ THEATER", subtitle:"ENTERTAINMENT", accent:"#58fff4", trim:"#b558ff", x:24, z:0, w:10.8, lines:["theater entry", "watch parties", "not sponsor registry"] },
  { key:"store", title:"SVR STORE", subtitle:"MERCH • VIP • CHIPS", accent:"#58fff4", trim:"#ffd56e", x:17, z:17, w:10.2, lines:["catalog wall", "member offers", "checkout disabled"] },
  { key:"scorpion", title:"SCORPION ROOM", subtitle:"PRIVATE TABLE", accent:"#ff5e75", trim:"#ffd56e", x:0, z:24, w:10.6, lines:["private-room entry", "premium table", "locked route"] },
  { key:"legends", title:"LEGENDS HALL", subtitle:"HALL OF FAME", accent:"#65b7ff", trim:"#ffd56e", x:-17, z:17, w:10.2, lines:["trophy wall", "winner records", "legacy display"] },
  { key:"charity", title:"CHARITY HUB", subtitle:"COMMUNITY GOALS", accent:"#ff7fa8", trim:"#58fff4", x:-24, z:0, w:10.2, lines:["animal shelter", "goal board", "donation status"] },
  { key:"sponsor", title:"SPONSOR HUB", subtitle:"AD TIERS • PARTNERS", accent:"#ffffff", trim:"#b558ff", x:-17, z:-17, w:10.2, lines:["tier packages", "banner slots", "approval workflow"] }
];

function hex(v){ return new THREE.Color(v).getHex(); }
function mat(color, emissive, intensity, metal=.24, rough=.45){ return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity:intensity, metalness:metal, roughness:rough }); }

function hidePreviousHubLayers(scene){
  scene.traverse((obj)=>{
    const name = String(obj?.name || "");
    if (/PHASE15[7-9].*(REIKI|VIBEZ|SPONSOR SLOT)|PHASE16[1-2].*(HUB|WELLNESS|STOREFRONT|HUD)|PHASE158 CLEAN REIKI|PHASE159 VIBEZ|PHASE162 LUXURY HUB/i.test(name)){
      obj.visible = false;
      obj.userData.phase163HiddenLegacyStorefront = true;
    }
  });
}

function buildStorefront(scene, cfg, interactives){
  const group = new THREE.Group();
  group.name = `PHASE163 REALISTIC ALIGNED STOREFRONT ${cfg.key.toUpperCase()}`;
  group.position.set(cfg.x, 0, cfg.z);
  group.lookAt(0, 1.65, 0);
  const accent = hex(cfg.accent), trim = hex(cfg.trim);
  const black = mat(0x030707, 0x061112, .22, .18, .72);
  const accentMat = mat(accent, accent, .70, .58, .20);
  const trimMat = mat(trim, trim, .52, .66, .24);
  const stone = mat(0x141817, 0x050706, .08, .10, .82);
  const glass = new THREE.MeshPhysicalMaterial({ color: accent, transparent:true, opacity:.16, metalness:.10, roughness:.06, transmission:.24, ior:1.45, clearcoat:1, clearcoatRoughness:.07, side:THREE.DoubleSide, depthWrite:false });

  const w = cfg.w;
  const h = 5.65;
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, .22), black);
  back.position.set(0, h/2, -.55); group.add(back);
  const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, .18, 2.15), stone);
  sidewalk.position.set(0, .09, 1.0); group.add(sidewalk);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(w + .75, .34, 1.35), black);
  canopy.position.set(0, h + .14, .10); group.add(canopy);

  [[0,h+.36,.36,w+.95,.10,.18],[0,.28,.02,w+.45,.12,.18],[-w/2-.12,h/2,.02,.16,h-.25,.22],[w/2+.12,h/2,.02,.16,h-.25,.22]].forEach((v)=>{
    const m = new THREE.Mesh(new THREE.BoxGeometry(v[3], v[4], v[5]), accentMat);
    m.position.set(v[0], v[1], v[2]); group.add(m);
  });
  [-.50, .50].forEach((side)=>{
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(.13, h - 1.0, .25), trimMat);
    pillar.position.set(side * w * .30, h/2 - .18, .04); group.add(pillar);
  });

  const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(w*.27, 3.05), glass);
  leftGlass.position.set(-w*.34, 2.55, .08); group.add(leftGlass);
  const rightGlass = new THREE.Mesh(new THREE.PlaneGeometry(w*.27, 3.05), glass);
  rightGlass.position.set(w*.34, 2.55, .08); group.add(rightGlass);
  const doorL = new THREE.Mesh(new THREE.PlaneGeometry(.88, 2.90), glass);
  doorL.position.set(-.47, 1.85, .11); group.add(doorL);
  const doorR = new THREE.Mesh(new THREE.PlaneGeometry(.88, 2.90), glass);
  doorR.position.set(.47, 1.85, .11); group.add(doorR);
  const doorBar = new THREE.Mesh(new THREE.BoxGeometry(.055, 2.95, .06), trimMat);
  doorBar.position.set(0, 1.86, .16); group.add(doorBar);

  const topSign = new THREE.Mesh(new THREE.PlaneGeometry(w*.72, .96), new THREE.MeshBasicMaterial({ map: makeSignTexture(cfg.title, cfg.subtitle, cfg.accent, cfg.trim), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  topSign.position.set(0, 5.13, .14); group.add(topSign);
  const leftPoster = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 2.70), new THREE.MeshBasicMaterial({ map: makeWindowPoster("ABOUT", cfg.lines, cfg.accent, cfg.trim), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  leftPoster.position.set(-w*.34, 2.52, .18); group.add(leftPoster);
  const rightPoster = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 2.70), new THREE.MeshBasicMaterial({ map: makeWindowPoster("ACTION", ["open hub", "view info", "next panel"], cfg.accent, cfg.trim), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  rightPoster.position.set(w*.34, 2.52, .18); group.add(rightPoster);

  const hud = new THREE.Group();
  hud.name = `PHASE163 ALIGNED HUD ${cfg.key.toUpperCase()}`;
  hud.position.set(0, .76, .34);
  ["OPEN", "INFO", "NEXT"].forEach((label, i)=>{
    const root = new THREE.Group();
    root.name = `PHASE163 TACTILE HUD BUTTON ${cfg.key.toUpperCase()} ${label}`;
    root.position.set((i - 1) * 1.58, 0, .10);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.30, .34), new THREE.MeshPhysicalMaterial({ color:0x050708, metalness:.78, roughness:.12, transparent:true, opacity:.78, transmission:.16, ior:1.45, clearcoat:1, side:THREE.DoubleSide, depthWrite:false }));
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.20, .28), new THREE.MeshBasicMaterial({ map: makeButtonTexture(label, cfg.accent, cfg.trim), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    labelMesh.position.z = .018;
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.32,.36)), new THREE.LineBasicMaterial({ color: accent, transparent:true, opacity:.90, blending:THREE.AdditiveBlending }));
    edge.position.z = .028;
    root.add(plate, labelMesh, edge);
    root.userData.phase163Button = true;
    root.userData.baseZ = root.position.z;
    root.userData.edge = edge;
    root.userData.accent = accent;
    root.userData.trim = trim;
    root.userData.label = `${cfg.title} ${label}`;
    hud.add(root);
    interactives.push(root);
  });
  group.add(hud);

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.15), new THREE.MeshStandardMaterial({ color:0x061817, emissive:accent, emissiveIntensity:.10, roughness:.72, metalness:.06, side:THREE.DoubleSide }));
  carpet.rotation.x = -Math.PI/2; carpet.position.set(0, .035, 2.75); group.add(carpet);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(.95, 64), new THREE.MeshBasicMaterial({ map: floorTexture(cfg.title.split(" ")[0], cfg.accent, cfg.trim), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  floor.rotation.x = -Math.PI/2; floor.position.set(0, .055, 1.34); group.add(floor);
  for (let i = 0; i < 10; i++){
    const light = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), new THREE.MeshBasicMaterial({ color:i%2 ? trim : accent, transparent:true, opacity:.88 }));
    light.position.set(-w*.38 + i*w*.085, h+.52, .44); group.add(light);
  }
  scene.add(group);
  return group;
}

function addCompactPlaza(scene){
  const group = new THREE.Group();
  group.name = "PHASE163 COMPACT ALIGNED LOBBY PLAZA";
  const ringMat = new THREE.MeshBasicMaterial({ color:0x58fff4, transparent:true, opacity:.11, side:THREE.DoubleSide, depthWrite:false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(10.5, 24.8, 128), ringMat);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = .022;
  group.add(ring);
  const center = new THREE.Mesh(new THREE.CircleGeometry(9.4, 96), new THREE.MeshBasicMaterial({ color:0x041113, transparent:true, opacity:.38, side:THREE.DoubleSide, depthWrite:false }));
  center.rotation.x = -Math.PI/2;
  center.position.y = .018;
  group.add(center);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.15), new THREE.MeshBasicMaterial({ map: makeSignTexture("LOBBY DIRECTORY", "COMPACT HUB RING", "#58fff4", "#ffd56e"), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  board.position.set(0, 3.1, 9.4);
  board.lookAt(0, 2.2, 0);
  group.add(board);
  scene.add(group);
  return group;
}

function bindHud(args, interactives){
  const dom = args.renderer?.domElement;
  const camera = args.camera;
  if (!dom || !camera || !interactives.length) return;
  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  dom.addEventListener("pointerdown", (ev)=>{
    const rect = dom.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(interactives, true)[0];
    if (!hit) return;
    let root = hit.object;
    while (root && !root.userData?.phase163Button) root = root.parent;
    if (!root) return;
    root.position.z = root.userData.baseZ - .055;
    root.userData.edge?.material?.color?.set(root.userData.trim);
    args.setStatus?.(`HUD pressed: ${root.userData.label}`, { force:true });
    setTimeout(()=>{
      root.position.z = root.userData.baseZ;
      root.userData.edge?.material?.color?.set(root.userData.accent);
    }, 170);
  }, { passive:true });
}

export function applyPhase163RealisticLobbyStorefrontAlignment(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase163RealisticLobbyStorefronts) return result;
  hidePreviousHubLayers(scene);
  const interactives = [];
  const plaza = addCompactPlaza(scene);
  const groups = HUBS.map((cfg)=>buildStorefront(scene, cfg, interactives));
  bindHud(args, interactives);
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt = .016)=>{
    oldTick?.(dt);
    const t = performance.now() * .001;
    groups.forEach((g, gi)=>{
      g.children.forEach((obj)=>{
        if (obj.isMesh && obj.geometry?.type === "SphereGeometry" && obj.material?.opacity !== undefined){
          obj.material.opacity = .52 + Math.sin(t * 2.1 + gi + obj.position.x) * .25;
        }
      });
    });
  };
  scene.userData._phase163RealisticLobbyStorefronts = { groups, plaza, interactives };
  window.SVR_PHASE163_REALISTIC_STOREFRONTS = true;
  args.log?.("Phase 163 realistic compact storefront ring active");
  args.setStatus?.("Phase 163: realistic aligned compact lobby storefronts active", { force:true });
  return { ...result, phase163Storefronts: groups };
}
