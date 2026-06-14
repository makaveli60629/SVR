import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-201-HUB-CONTENT-RESTORE-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const GREEN = 0x8dffb4;
const RED = 0xff5b8c;

function glow(color, opacity = 0.52){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function panelMat(color = 0x090b16, emissive = 0x050713, intensity = 0.12){
  return new THREE.MeshStandardMaterial({ color, roughness:0.72, metalness:0.05, emissive, emissiveIntensity:intensity });
}
function makeTexture({ title, kicker = "", lines = [], footer = "", color = "#ffd98a", danger = false, width = 1300, height = 720 }){
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,width,height);
  g.addColorStop(0,"#030712");
  g.addColorStop(1,"#10051b");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,width,height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 16;
  ctx.strokeRect(30,30,width-60,height-60);
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 4;
  ctx.strokeRect(64,64,width-128,height-128);
  ctx.fillStyle = "rgba(255,255,255,.05)";
  ctx.fillRect(84,84,width-168,102);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 76px system-ui,Arial";
  ctx.fillText(title,width/2,136);
  if (kicker){
    ctx.fillStyle = color;
    ctx.font = "800 42px system-ui,Arial";
    ctx.fillText(kicker,width/2,230);
  }
  ctx.textAlign = "left";
  ctx.font = "700 34px system-ui,Arial";
  ctx.fillStyle = "#eaf5ff";
  let y = 318;
  lines.slice(0,7).forEach((line)=>{
    ctx.fillText(`• ${line}`,112,y);
    y += 54;
  });
  if (footer){
    ctx.textAlign = "center";
    ctx.fillStyle = danger ? "#ff3b55" : color;
    ctx.font = "900 34px system-ui,Arial";
    ctx.fillText(footer,width/2,height-88);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function addBox(root, name, sx, sy, sz, x, y, z, material, rotY = 0){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  mesh.name = name;
  mesh.position.set(x,y,z);
  mesh.rotation.y = rotY;
  root.add(mesh);
  return mesh;
}
function addPanel(root, spec){
  const { name, x, y, z, rotY = 0, w = 4.4, h = 2.35, color = "#ffd98a" } = spec;
  addBox(root, `${name}_FRAME`, w + 0.30, h + 0.30, 0.14, x, y, z, panelMat(), rotY);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map:makeTexture(spec), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  pane.name = name;
  pane.position.set(x,y+0.04,z+0.022*Math.cos(rotY));
  pane.rotation.y = rotY;
  pane.renderOrder = 90;
  root.add(pane);
  const glowLine = addBox(root, `${name}_GLOW_BAR`, w, 0.045, 0.05, x, y - h/2 - 0.20, z + 0.035*Math.cos(rotY), glow(parseInt(color.replace("#","0x")),0.42), rotY);
  glowLine.renderOrder = 91;
  return pane;
}
function addHeader(root, name, text, x, y, z, rotY, color = GOLD){
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 180;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.78)";
  ctx.fillRect(0,0,900,180);
  ctx.strokeStyle = `#${color.toString(16).padStart(6,"0")}`;
  ctx.lineWidth = 10;
  ctx.strokeRect(12,12,876,156);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px system-ui,Arial";
  ctx.fillText(text,450,90);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.7,0.72), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.name = name;
  panel.position.set(x,y,z);
  panel.rotation.y = rotY;
  panel.renderOrder = 95;
  root.add(panel);
  return panel;
}
function addFloorArrow(root, name, x, z, rotZ, color){
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x,0.045,z);
  group.rotation.y = rotZ;
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.24,1.25), glow(color,0.30));
  shaft.rotation.x = -Math.PI/2;
  shaft.position.z = -0.24;
  group.add(shaft);
  const head = new THREE.Mesh(new THREE.CircleGeometry(0.38,3), glow(color,0.44));
  head.rotation.x = -Math.PI/2;
  head.rotation.z = Math.PI;
  head.position.z = -0.98;
  group.add(head);
  root.add(group);
}
function addRopeLine(root, name, x1, z1, x2, z2, color = GOLD){
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx,dz);
  const ang = Math.atan2(dx,dz);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,len,12), glow(color,0.48));
  rope.name = name;
  rope.rotation.x = Math.PI/2;
  rope.rotation.z = -ang;
  rope.position.set((x1+x2)/2,0.62,(z1+z2)/2);
  root.add(rope);
  [[x1,z1],[x2,z2]].forEach(([x,z],i)=>{
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.72,14), new THREE.MeshStandardMaterial({ color:0xd7c3a0, roughness:0.62, metalness:0.10, emissive:0x0a0502, emissiveIntensity:0.12 }));
    post.name = `${name}_POST_${i+1}`;
    post.position.set(x,0.36,z);
    root.add(post);
  });
}
function addKioskBase(root, name, x, z, color){
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.78,0.92,0.28,40), new THREE.MeshStandardMaterial({ color:0x11131f, roughness:0.70, metalness:0.06, emissive:0x040713, emissiveIntensity:0.14 }));
  pedestal.name = `${name}_PEDESTAL`;
  pedestal.position.set(x,0.14,z);
  root.add(pedestal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88,0.025,8,72), glow(color,0.50));
  ring.name = `${name}_BASE_RING`;
  ring.rotation.x = Math.PI/2;
  ring.position.set(x,0.32,z);
  root.add(ring);
}
export function installPhase201HubContentRestore({ scene, camera = null, renderer = null, log = console.log } = {}){
  if (!scene) return null;
  const existing = scene.getObjectByName("PHASE201_HUB_CONTENT_RESTORE_ROOT");
  if (existing) existing.parent?.remove(existing);
  const root = new THREE.Group();
  root.name = "PHASE201_HUB_CONTENT_RESTORE_ROOT";
  scene.add(root);

  addHeader(root,"PHASE201_MAIN_HEADER","SVR GRAND LOBBY",0,5.62,-16.08,0,GOLD);
  addHeader(root,"PHASE201_WELLNESS_HEADER","WELLNESS",-12,5.08,-16.05,0,PURPLE);
  addHeader(root,"PHASE201_PGA_HEADER","PGA TRAINING",-6,5.08,-16.05,0,CYAN);
  addHeader(root,"PHASE201_STORE_HEADER","SVR STORE",6,5.08,-16.05,0,GREEN);
  addHeader(root,"PHASE201_SCORPION_HEADER","SCORPION",12,5.08,-16.05,0,RED);

  addPanel(root,{ name:"PHASE201_WELLNESS_CONTENT_PANEL", title:"WELLNESS HUB", kicker:"Reiki / meditation module", lines:["Presentation carousel returns here","Video slide / About slide / Symbols slide","Teleport pad routes to meditation room","Approval marker stays visible until final signoff"], footer:"WAITING FOR APPROVAL", danger:true, x:-12, y:2.18, z:-16.06, rotY:0, w:3.30, h:2.05, color:"#a77cff" });
  addPanel(root,{ name:"PHASE201_PGA_CONTENT_PANEL", title:"PGA TRAINING", kicker:"Driving range / chip / putt", lines:["Golf training portal bay","Practice-range scene route","Grip and stance tutorial placeholder","Achievement board returns next"], footer:"PGA MODULE BAY READY", x:-6, y:2.18, z:-16.06, rotY:0, w:3.30, h:2.05, color:"#7ffcff" });
  addPanel(root,{ name:"PHASE201_PLAY_CONTENT_PANEL", title:"PLAY GAME", kicker:"Poker table selector", lines:["Sit / leave controls preserved","Open south seat preserved","Bot labels and game logic return next","Watch quick controls remain active"], footer:"TABLE MODULE READY", x:0, y:2.18, z:-16.06, rotY:0, w:3.30, h:2.05, color:"#ffd98a" });
  addPanel(root,{ name:"PHASE201_STORE_CONTENT_PANEL", title:"SVR STORE", kicker:"Storefront portal", lines:["Links to web store","Membership / chip packs placeholder","Avatar clothing bay placeholder","Store hub exterior returns next"], footer:"WEB STORE PORTAL READY", x:6, y:2.18, z:-16.06, rotY:0, w:3.30, h:2.05, color:"#8dffb4" });
  addPanel(root,{ name:"PHASE201_SCORPION_CONTENT_PANEL", title:"SCORPION", kicker:"VIP poker room", lines:["Private-room portal bay","Hologram table selector returns next","Higher-stakes visual theme placeholder","Separate room stays modular"], footer:"PRIVATE ROOM BAY READY", x:12, y:2.18, z:-16.06, rotY:0, w:3.30, h:2.05, color:"#ff5b8c" });

  addPanel(root,{ name:"PHASE201_LEFT_TIER1_AD_PANEL", title:"FEATURED AD", kicker:"Tier 1 jumbotron", lines:["Large sponsor creative goes here","Approved brands only","No legacy background buildings","Panel is wall-mounted"], footer:"AD SLOT LOCKED", x:-19.18, y:2.65, z:-2.0, rotY:Math.PI/2, w:4.55, h:2.15, color:"#7ffcff" });
  addPanel(root,{ name:"PHASE201_RIGHT_TIER1_AD_PANEL", title:"FEATURED AD", kicker:"Tier 1 jumbotron", lines:["Tournament sponsor slot","Monthly event graphic slot","Charity feature slot","Content returns after approval"], footer:"AD SLOT LOCKED", x:19.18, y:2.65, z:-2.0, rotY:-Math.PI/2, w:4.55, h:2.15, color:"#7ffcff" });
  addPanel(root,{ name:"PHASE201_DAILY_BONUS_PANEL", title:"DAILY BONUS", kicker:"5,000 chip station", lines:["One claim per day placeholder","Reward logic returns after poker lock","Readable from spawn"], footer:"KIOSK READY", x:-10.8, y:1.70, z:5.0, rotY:0.20, w:2.55, h:1.45, color:"#ffd98a" });
  addPanel(root,{ name:"PHASE201_SPONSOR_PANEL", title:"SPONSORS", kicker:"Partner showcase", lines:["Storefront ads return here","Tier 2 / Tier 3 slots next","Approval-safe placeholders"], footer:"SPONSOR WALL READY", x:10.8, y:1.70, z:5.0, rotY:-0.20, w:2.55, h:1.45, color:"#7ffcff" });

  addKioskBase(root,"PHASE201_WELLNESS_KIOSK_BASE",-12,-12.6,PURPLE);
  addKioskBase(root,"PHASE201_PGA_KIOSK_BASE",-6,-12.6,CYAN);
  addKioskBase(root,"PHASE201_PLAY_KIOSK_BASE",0,-4.2,GOLD);
  addKioskBase(root,"PHASE201_STORE_KIOSK_BASE",6,-12.6,GREEN);
  addKioskBase(root,"PHASE201_SCORPION_KIOSK_BASE",12,-12.6,RED);

  addFloorArrow(root,"PHASE201_ARROW_TO_PLAY",0,5.4,0,GOLD);
  addFloorArrow(root,"PHASE201_ARROW_TO_WELLNESS",-7.5,-6.8,-0.36,PURPLE);
  addFloorArrow(root,"PHASE201_ARROW_TO_PGA",-4.2,-5.8,-0.12,CYAN);
  addFloorArrow(root,"PHASE201_ARROW_TO_STORE",4.2,-5.8,0.12,GREEN);
  addFloorArrow(root,"PHASE201_ARROW_TO_SCORPION",7.5,-6.8,0.36,RED);

  addRopeLine(root,"PHASE201_CENTER_LEFT_ROPE",-2.8,6.3,-2.8,-3.0,GOLD);
  addRopeLine(root,"PHASE201_CENTER_RIGHT_ROPE",2.8,6.3,2.8,-3.0,GOLD);
  addRopeLine(root,"PHASE201_WELLNESS_ROPE",-13.7,-10.8,-10.3,-10.8,PURPLE);
  addRopeLine(root,"PHASE201_STORE_ROPE",4.3,-10.8,7.7,-10.8,GREEN);

  const ambientGlow = new THREE.Mesh(new THREE.TorusGeometry(7.2,0.03,8,160), glow(GOLD,0.20));
  ambientGlow.name = "PHASE201_CENTER_SOFT_GUIDE_RING";
  ambientGlow.rotation.x = Math.PI/2;
  ambientGlow.position.set(0,0.055,0.8);
  root.add(ambientGlow);

  const softLight = new THREE.PointLight(GOLD,0.32,16,2.0);
  softLight.name = "PHASE201_CONTENT_WARM_ACCENT_LIGHT";
  softLight.position.set(0,3.2,1.8);
  scene.add(softLight);
  const cyanLight = new THREE.PointLight(CYAN,0.25,14,2.0);
  cyanLight.name = "PHASE201_CONTENT_CYAN_ACCENT_LIGHT";
  cyanLight.position.set(0,4.2,-10.5);
  scene.add(cyanLight);

  window.SVR_PHASE201_HUB_CONTENT_RESTORE = {
    label: LABEL,
    locked: true,
    moduleContentRestored: true,
    adSlotsRestored: true,
    approvalSafe: true,
    orderedOnPhase200Structure: true,
    checkedAt: new Date().toISOString()
  };
  log(`[Phase201] hub content restore active: module panels, ad slots, ropes, arrows, approval-safe content`);
  return window.SVR_PHASE201_HUB_CONTENT_RESTORE;
}
