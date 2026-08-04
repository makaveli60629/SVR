import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-202-STOREFRONT-SHELLS-HOLOGRAM-FRAMES-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const GREEN = 0x8dffb4;
const RED = 0xff5b8c;

function glow(color, opacity = 0.50){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function material(color, emissive = 0x050713, intensity = 0.12){
  return new THREE.MeshStandardMaterial({ color, roughness:0.68, metalness:0.06, emissive, emissiveIntensity:intensity });
}
function glass(color, opacity = 0.16){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}
function addBox(root, name, sx, sy, sz, x, y, z, mat, rotY = 0){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), mat);
  mesh.name = name;
  mesh.position.set(x,y,z);
  mesh.rotation.y = rotY;
  root.add(mesh);
  return mesh;
}
function makeText(title, sub, color = "#ffd98a", small = ""){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 420;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#030713");
  g.addColorStop(1,"#12051d");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.strokeRect(24,24,c.width-48,c.height-48);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 64px system-ui,Arial";
  ctx.fillText(title,c.width/2,132);
  ctx.fillStyle = color;
  ctx.font = "800 34px system-ui,Arial";
  ctx.fillText(sub,c.width/2,228);
  if (small){
    ctx.fillStyle = "#e7f5ff";
    ctx.font = "700 27px system-ui,Arial";
    ctx.fillText(small,c.width/2,314);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function addSign(root, name, title, sub, small, x, y, z, rotY, color){
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.15,1.25), new THREE.MeshBasicMaterial({ map:makeText(title,sub,color,small), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  sign.name = name;
  sign.position.set(x,y,z);
  sign.rotation.y = rotY;
  sign.renderOrder = 105;
  root.add(sign);
  return sign;
}
function addShell(root, spec){
  const { name, x, z, color, title, sub, small, accent = color, width = 4.55 } = spec;
  const baseMat = material(0x11131f,0x050713,0.14);
  const darkMat = material(0x080b14,0x03050d,0.12);
  addBox(root, `${name}_BACKING`, width, 3.05, 0.34, x, 1.54, z, darkMat);
  addBox(root, `${name}_LEFT_PIER`, 0.28, 3.25, 0.56, x - width/2, 1.64, z + 0.24, baseMat);
  addBox(root, `${name}_RIGHT_PIER`, 0.28, 3.25, 0.56, x + width/2, 1.64, z + 0.24, baseMat);
  addBox(root, `${name}_TOP_BEAM`, width + 0.42, 0.26, 0.62, x, 3.30, z + 0.24, baseMat);
  addBox(root, `${name}_LOWER_COUNTER`, width - 0.58, 0.34, 0.74, x, 0.62, z + 0.50, baseMat);
  addBox(root, `${name}_GLASS_FRONT`, width - 0.62, 1.72, 0.035, x, 1.72, z + 0.68, glass(color,0.14));
  addBox(root, `${name}_TOP_NEON`, width + 0.12, 0.045, 0.05, x, 3.52, z + 0.61, glow(color,0.58));
  addBox(root, `${name}_BASE_NEON`, width - 0.35, 0.045, 0.05, x, 0.38, z + 0.72, glow(accent,0.44));
  addSign(root, `${name}_SIGN`, title, sub, small, x, 2.28, z + 0.72, 0, `#${color.toString(16).padStart(6,"0")}`);
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.64,0.80,72), glow(color,0.44));
  pad.name = `${name}_ENTRY_PAD_RING`;
  pad.rotation.x = -Math.PI/2;
  pad.position.set(x,0.052,z + 1.55);
  root.add(pad);
}
function addCarouselFrame(root){
  const group = new THREE.Group();
  group.name = "PHASE202_WELLNESS_HOLOGRAM_CAROUSEL_FRAME";
  group.position.set(-12,0,-10.88);
  root.add(group);
  addBox(group,"PHASE202_CAROUSEL_BACK_GLASS",2.70,1.72,0.04,0,1.78,0,glass(PURPLE,0.20));
  addBox(group,"PHASE202_CAROUSEL_FRAME_TOP",2.96,0.08,0.08,0,2.68,0.03,glow(PURPLE,0.58));
  addBox(group,"PHASE202_CAROUSEL_FRAME_BOTTOM",2.96,0.08,0.08,0,0.88,0.03,glow(PURPLE,0.48));
  addBox(group,"PHASE202_CAROUSEL_FRAME_LEFT",0.08,1.76,0.08,-1.48,1.78,0.03,glow(PURPLE,0.52));
  addBox(group,"PHASE202_CAROUSEL_FRAME_RIGHT",0.08,1.76,0.08,1.48,1.78,0.03,glow(PURPLE,0.52));
  addSign(group,"PHASE202_CAROUSEL_VIDEO_SLIDE","VIDEO SLIDE","Founder presentation","Next / Back controls below",0,1.78,0.07,0,"#a77cff");
  const next = addBox(group,"PHASE202_CAROUSEL_NEXT_BUTTON",0.42,0.20,0.08,1.08,0.58,0.08,glow(GOLD,0.64));
  next.userData.action = "carouselNext";
  const back = addBox(group,"PHASE202_CAROUSEL_BACK_BUTTON",0.42,0.20,0.08,-1.08,0.58,0.08,glow(CYAN,0.50));
  back.userData.action = "carouselBack";
  const portal = addBox(group,"PHASE202_MEDITATION_ROOM_PORTAL_BUTTON",1.25,0.22,0.08,0,0.34,0.08,glow(PURPLE,0.50));
  portal.userData.scene = "reikiRoom";
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(1.85,2.05,0.14,64), material(0x130f1d,0x12051f,0.18));
  platform.name = "PHASE202_CAROUSEL_PLATFORM";
  platform.position.set(0,0.16,0.10);
  group.add(platform);
}
function addPgaPracticeFrame(root){
  const group = new THREE.Group();
  group.name = "PHASE202_PGA_PRACTICE_PREVIEW_FRAME";
  group.position.set(-6,0,-10.88);
  root.add(group);
  addBox(group,"PHASE202_PGA_TARGET_PANEL",2.55,1.35,0.04,0,1.65,0,glass(CYAN,0.18));
  for(let i=0;i<3;i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36+i*0.24,0.012,8,72), glow(CYAN,0.42 - i*0.08));
    ring.name = `PHASE202_PGA_TARGET_RING_${i+1}`;
    ring.position.set(0,1.65,0.05);
    group.add(ring);
  }
  addSign(group,"PHASE202_PGA_PREVIEW_SIGN","PRACTICE PREVIEW","Range / Chip / Putt","Portal logic next",0,2.55,0.06,0,"#7ffcff");
}
function addStoreDisplay(root){
  const group = new THREE.Group();
  group.name = "PHASE202_STORE_DISPLAY_RACKS";
  group.position.set(6,0,-10.72);
  root.add(group);
  [-0.85,0,0.85].forEach((x,i)=>{
    addBox(group,`PHASE202_STORE_PRODUCT_PLINTH_${i+1}`,0.56,0.72,0.38,x,0.85,0.18,material(0x151923,0x06120c,0.14));
    const item = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.38,0.08), glow(i===0?GREEN:i===1?GOLD:CYAN,0.46));
    item.name = `PHASE202_STORE_PRODUCT_GLOW_${i+1}`;
    item.position.set(x,1.42,0.28);
    group.add(item);
  });
  addSign(group,"PHASE202_STORE_DISPLAY_SIGN","STORE SHELL","memberships / clothing","web portal preserved",0,2.55,0.05,0,"#8dffb4");
}
function addScorpionDoor(root){
  const group = new THREE.Group();
  group.name = "PHASE202_SCORPION_PRIVATE_DOOR_FRAME";
  group.position.set(12,0,-10.84);
  root.add(group);
  addBox(group,"PHASE202_SCORPION_DOOR",1.34,2.10,0.08,0,1.42,0.03,material(0x180813,0x24020a,0.20));
  addBox(group,"PHASE202_SCORPION_DOOR_TOP_GLOW",1.62,0.06,0.06,0,2.52,0.08,glow(RED,0.58));
  addBox(group,"PHASE202_SCORPION_DOOR_LEFT_GLOW",0.06,2.14,0.06,-0.84,1.43,0.08,glow(RED,0.46));
  addBox(group,"PHASE202_SCORPION_DOOR_RIGHT_GLOW",0.06,2.14,0.06,0.84,1.43,0.08,glow(RED,0.46));
  addSign(group,"PHASE202_SCORPION_DOOR_SIGN","VIP DOOR","Scorpion room","private poker route",0,2.90,0.08,0,"#ff5b8c");
}
function addAdFramePolish(root){
  [[-19.05,0,Math.PI/2,"LEFT"],[19.05,0,-Math.PI/2,"RIGHT"]].forEach(([x,z,rot,side])=>{
    const group = new THREE.Group();
    group.name = `PHASE202_${side}_JUMBOTRON_SHELL`;
    group.position.set(x,0,z);
    group.rotation.y = rot;
    root.add(group);
    addBox(group,`PHASE202_${side}_JUMBOTRON_FRAME`,4.95,2.55,0.20,0,2.62,0,material(0x11131f,0x06101a,0.16));
    addBox(group,`PHASE202_${side}_JUMBOTRON_GLASS`,4.48,2.12,0.04,0,2.62,0.13,glass(CYAN,0.12));
    addBox(group,`PHASE202_${side}_JUMBOTRON_TOP_NEON`,4.85,0.06,0.05,0,3.94,0.18,glow(CYAN,0.56));
    addBox(group,`PHASE202_${side}_JUMBOTRON_BOTTOM_NEON`,4.85,0.06,0.05,0,1.30,0.18,glow(GOLD,0.36));
  });
}
export function installPhase202StorefrontShells({ scene, log = console.log } = {}){
  if (!scene) return null;
  const existing = scene.getObjectByName("PHASE202_STOREFRONT_SHELLS_ROOT");
  if (existing) existing.parent?.remove(existing);
  const root = new THREE.Group();
  root.name = "PHASE202_STOREFRONT_SHELLS_ROOT";
  scene.add(root);

  addShell(root,{ name:"PHASE202_WELLNESS_STOREFRONT_SHELL", x:-12, z:-12.92, color:PURPLE, title:"WELLNESS", sub:"Carousel bay", small:"Waiting for approval" });
  addShell(root,{ name:"PHASE202_PGA_STOREFRONT_SHELL", x:-6, z:-12.92, color:CYAN, title:"PGA", sub:"Practice bay", small:"Range / chip / putt" });
  addShell(root,{ name:"PHASE202_PLAY_STOREFRONT_SHELL", x:0, z:-12.92, color:GOLD, title:"PLAY GAME", sub:"Table select", small:"Poker module" });
  addShell(root,{ name:"PHASE202_STORE_STOREFRONT_SHELL", x:6, z:-12.92, color:GREEN, title:"SVR STORE", sub:"Web portal", small:"Storefront shell" });
  addShell(root,{ name:"PHASE202_SCORPION_STOREFRONT_SHELL", x:12, z:-12.92, color:RED, title:"SCORPION", sub:"Private room", small:"VIP route" });
  addCarouselFrame(root);
  addPgaPracticeFrame(root);
  addStoreDisplay(root);
  addScorpionDoor(root);
  addAdFramePolish(root);

  const light = new THREE.PointLight(PURPLE,0.22,11,2.0);
  light.name = "PHASE202_WELLNESS_CAROUSEL_ACCENT_LIGHT";
  light.position.set(-12,2.7,-10.4);
  scene.add(light);
  const storeLight = new THREE.PointLight(GREEN,0.20,11,2.0);
  storeLight.name = "PHASE202_STORE_ACCENT_LIGHT";
  storeLight.position.set(6,2.6,-10.4);
  scene.add(storeLight);

  window.SVR_PHASE202_STOREFRONT_SHELLS = {
    label: LABEL,
    locked: true,
    storefrontShells: true,
    hologramCarouselFrame: true,
    jumbotronFrames: true,
    approvalSafe: true,
    checkedAt: new Date().toISOString()
  };
  log(`[Phase202] storefront shells and hologram/carousel frames active`);
  return window.SVR_PHASE202_STOREFRONT_SHELLS;
}
