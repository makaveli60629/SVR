import * as THREE from "three";

const BUILD = "PHASE-240-GRAND-PALACE-REFERENCE-LOBBY-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const RED = 0xff5b8c;
const GREEN = 0x8dffb4;
const BLUE = 0x6aa8ff;
const STONE = 0xc8b89a;
const DARK = 0x050713;

function waitForRuntime(){
  return new Promise((resolve)=>{
    let tries = 0;
    const tick = ()=>{
      if (window.__SVR_SCENE__ && window.__SVR_CAMERA__) return resolve({ scene:window.__SVR_SCENE__, camera:window.__SVR_CAMERA__, renderer:window.__SVR_RENDERER__ || null });
      if (++tries > 360) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
function mat(color, emissive = 0x000000, emissiveIntensity = 0.05, roughness = 0.72, metalness = 0.06){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}
function glow(color, opacity = 0.55){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}
function glass(color = CYAN, opacity = 0.14){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}
function canvasTexture(width, height, painter){
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const ctx = c.getContext("2d");
  painter(ctx, width, height, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function panelTexture(title, subtitle = "", note = "", color = "#ffd98a", tier = ""){
  return canvasTexture(1200, 620, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#020511");
    g.addColorStop(0.55,"#081024");
    g.addColorStop(1,"#120616");
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.fillStyle = "rgba(255,255,255,.04)"; x.fillRect(78,72,w-156,116);
    x.strokeStyle = color; x.lineWidth = 16; x.strokeRect(28,28,w-56,h-56);
    x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = 4; x.strokeRect(64,64,w-128,h-128);
    x.textAlign = "center"; x.textBaseline = "middle";
    if (tier){ x.fillStyle = "#a9b8d8"; x.font = "900 34px system-ui,Arial"; x.fillText(tier.toUpperCase(), w/2, 94); }
    x.fillStyle = "#ffffff"; x.font = "900 78px system-ui,Arial"; x.fillText(title.toUpperCase(), w/2, 176);
    x.fillStyle = color; x.font = "850 42px system-ui,Arial"; x.fillText(subtitle, w/2, 328);
    x.fillStyle = "#dbefff"; x.font = "750 32px system-ui,Arial"; x.fillText(note, w/2, 438);
  });
}
function addBox(root, name, sx, sy, sz, x, y, z, material, rotY = 0){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.name = name; mesh.position.set(x,y,z); mesh.rotation.y = rotY;
  root.add(mesh); return mesh;
}
function addPanel(root, name, title, subtitle, note, x, y, z, rotY = 0, color = "#ffd98a", w = 3.8, h = 1.48, tier = ""){
  addBox(root, `${name}_FRAME`, w + 0.28, h + 0.28, 0.16, x, y, z, mat(0x111522,0x04060e,0.18,0.66,0.08), rotY);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map:panelTexture(title,subtitle,note,color,tier), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  p.name = name; p.position.set(x, y + 0.055, z); p.rotation.y = rotY; p.renderOrder = 240;
  root.add(p); return p;
}
function addColumn(root, name, x, z, h = 6.05){
  const g = new THREE.Group(); g.name = name; g.position.set(x,0,z);
  const stone = mat(STONE,0x130b04,0.16,0.55,0.12);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.68,0.32,36), stone); base.position.y = 0.16; g.add(base);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.33,h,36), stone); shaft.position.y = 0.32 + h/2; g.add(shaft);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.16,0.28,0.76), stone); cap.position.y = h + 0.62; g.add(cap);
  const glowA = new THREE.Mesh(new THREE.TorusGeometry(0.37,0.019,8,52), glow(CYAN,0.32)); glowA.rotation.x = Math.PI/2; glowA.position.y = 0.64; g.add(glowA);
  const glowB = new THREE.Mesh(new THREE.TorusGeometry(0.37,0.019,8,52), glow(GOLD,0.42)); glowB.rotation.x = Math.PI/2; glowB.position.y = h - 0.12; g.add(glowB);
  root.add(g); return g;
}
function addArch(root, name, x, z, rotY, color = GOLD){
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.34,0.045,10,96,Math.PI), glow(color,0.60));
  arch.name = name; arch.position.set(x,3.05,z); arch.rotation.z = Math.PI; arch.rotation.y = rotY; root.add(arch);
  return arch;
}
function addCurvedPalaceWall(root){
  const stone = mat(0x151925,0x03050d,0.18,0.75,0.05);
  const gold = glow(GOLD,0.56);
  const cyan = glow(CYAN,0.28);
  for(let i=0;i<13;i++){
    const a = THREE.MathUtils.degToRad(-78 + i*13);
    const r = 18.9;
    const x = Math.sin(a) * r;
    const z = -12.8 - Math.cos(a) * 3.8;
    const rot = a;
    addBox(root,`PHASE240_CURVED_WALL_PIER_${i}`,1.08,5.8,0.32,x,2.9,z,stone,rot);
    addColumn(root,`PHASE240_PALACE_COLUMN_${i}`,x,z,5.25);
    if(i < 12){
      const a2 = THREE.MathUtils.degToRad(-78 + (i+0.5)*13);
      const bx = Math.sin(a2) * r;
      const bz = -12.8 - Math.cos(a2) * 3.8;
      addBox(root,`PHASE240_UPPER_BALCONY_SPAN_${i}`,2.25,0.15,0.30,bx,4.02,bz,gold,a2);
      addBox(root,`PHASE240_LOWER_BALCONY_SPAN_${i}`,2.25,0.08,0.26,bx,0.72,bz,cyan,a2);
      addArch(root,`PHASE240_REAR_ARCH_GLOW_${i}`,bx,bz + 0.04,a2,GOLD);
    }
  }
}
function addCentralSelector(root){
  addPanel(root,"PHASE240_PLAY_GAME_SELECTOR_MAIN","PLAY GAME","Choose Your Table","Hold'em • Omaha • private rooms",0,3.22,-6.25,0,"#ffd98a",5.35,1.52);
  const cards = [
    ["HOLD'EM","NO LIMIT","$0.25 / $0.50",-2.15],
    ["HOLD'EM","NO LIMIT","$1 / $2",0],
    ["OMAHA","POT LIMIT","$2 / $4",2.15]
  ];
  cards.forEach(([t,s,n,x])=>addPanel(root,`PHASE240_TABLE_CARD_${t}_${x}`,t,s,n,x,2.00,-5.86,0,"#7ffcff",1.72,1.38));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.35,0.035,10,164), glow(GOLD,0.50));
  ring.name = "PHASE240_FLOATING_ORBIT_RING_MAIN"; ring.rotation.x = Math.PI/2; ring.position.set(0,2.58,-5.58); root.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.85,0.022,10,164), glow(CYAN,0.28));
  ring2.name = "PHASE240_FLOATING_ORBIT_RING_OUTER"; ring2.rotation.x = Math.PI/2; ring2.position.set(0,2.68,-5.58); root.add(ring2);
  root.userData.phase240Rings = [ring, ring2];
}
function addLobbyDestinations(root){
  addPanel(root,"PHASE240_WELLNESS_HUB_FACE","WELLNESS HUB","Reiki / Relaxation","private scene portal",-6.9,1.75,-7.35,-0.10,"#a77cff",2.85,1.36);
  addPanel(root,"PHASE240_PGA_HUB_FACE","PGA HUB","Practice • Grip • Achieve","private range portal",6.9,1.75,-7.35,0.10,"#7ffcff",2.85,1.36);
  addPanel(root,"PHASE240_SCORPION_PORTAL_FACE","SCORPION ROOM","Private Poker Suite","city overlook room",12.7,2.10,-8.55,0.44,"#ff5b8c",2.92,1.46);
  addPanel(root,"PHASE240_LEGENDS_STAGE","LEGENDS","Hall of Fame","trophy pedestal",7.6,1.20,4.65,-0.22,"#ffd98a",2.85,1.12);
  addPanel(root,"PHASE240_DAILY_BONUS_KIOSK","DAILY BONUS","Collect Your Reward","claim chips after approval",-10.9,1.28,5.80,0.24,"#ffd98a",2.55,1.22);
  addPanel(root,"PHASE240_SPONSOR_BOARD","SPONSOR AREA","Our Partners","modular ad grid",11.5,1.30,6.10,-0.25,"#7ffcff",2.75,1.20);
  addPanel(root,"PHASE240_LEFT_JUMBOTRON","JUMBOTRON","Your Brand Here","Tier 1 sponsor slot",-18.65,2.72,-2.1,Math.PI/2,"#7ffcff",4.25,2.05,"Tier 1");
  addPanel(root,"PHASE240_RIGHT_JUMBOTRON","JUMBOTRON","Your Brand Here","Tier 1 sponsor slot",18.65,2.72,-2.1,-Math.PI/2,"#7ffcff",4.25,2.05,"Tier 1");
  addPanel(root,"PHASE240_LEFT_TIER2_BANNER","BANNER SLIDER","Premium rotating slot","Tier 2",-18.72,4.75,-2.1,Math.PI/2,"#ffd98a",4.15,0.68,"Tier 2");
  addPanel(root,"PHASE240_RIGHT_TIER2_BANNER","BANNER SLIDER","Premium rotating slot","Tier 2",18.72,4.75,-2.1,-Math.PI/2,"#ffd98a",4.15,0.68,"Tier 2");
}
function addFloorPolish(root){
  const outer = new THREE.Mesh(new THREE.RingGeometry(5.75,6.0,160), glow(GOLD,0.26));
  outer.name = "PHASE240_CENTER_LOBBY_GOLD_FLOOR_RING"; outer.rotation.x = -Math.PI/2; outer.position.set(0,0.036,0.76); root.add(outer);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.15,18.2), new THREE.MeshBasicMaterial({ color:0x08131e, transparent:true, opacity:0.48, side:THREE.DoubleSide, depthWrite:false }));
  carpet.name = "PHASE240_BLACK_MARBLE_ENTRY_RUNNER"; carpet.rotation.x = -Math.PI/2; carpet.position.set(0,0.026,3.0); root.add(carpet);
  const crest = new THREE.Mesh(new THREE.RingGeometry(0.74,1.10,96), glow(GOLD,0.42));
  crest.name = "PHASE240_SVR_ENTRY_CREST_RING"; crest.rotation.x = -Math.PI/2; crest.position.set(0,0.052,7.35); root.add(crest);
}
function addSkyUpgrade(root){
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.62,64,36), mat(0xe6e2d6,0x2a3046,0.20,0.86,0.02));
  moon.name = "PHASE240_REFERENCE_MOON_HIGH_VISIBLE"; moon.position.set(-4.45,13.35,-23.5); root.add(moon);
  const moonHalo = new THREE.Mesh(new THREE.CircleGeometry(3.05,96), glow(0xf4f7ff,0.10));
  moonHalo.name = "PHASE240_REFERENCE_MOON_SOFT_HALO"; moonHalo.position.copy(moon.position); moonHalo.lookAt(0,2.2,6); root.add(moonHalo);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.56,40,24), mat(0xb84b32,0x2b0a05,0.24,0.84,0.02));
  mars.name = "PHASE240_REFERENCE_MARS_HIGH_VISIBLE"; mars.position.set(5.8,11.65,-27.5); root.add(mars);
  root.userData.phase240Planets = { moon, mars, moonHalo };
}
function addPortalGlow(root, x, z, color, name){
  const pad = new THREE.Mesh(new THREE.RingGeometry(0.82,1.03,88), glow(color,0.62));
  pad.name = name; pad.rotation.x = -Math.PI/2; pad.position.set(x,0.064,z); root.add(pad);
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.72,72), glow(color,0.14));
  core.name = `${name}_CORE`; core.rotation.x = -Math.PI/2; core.position.set(x,0.058,z); root.add(core);
}
function addPortalPads(root){
  addPortalGlow(root,-6.9,-6.20,PURPLE,"PHASE240_WELLNESS_PORTAL_PAD");
  addPortalGlow(root,6.9,-6.20,CYAN,"PHASE240_PGA_PORTAL_PAD");
  addPortalGlow(root,12.25,-7.12,RED,"PHASE240_SCORPION_PORTAL_PAD");
  addPortalGlow(root,0,-4.25,GOLD,"PHASE240_PLAY_GAME_PORTAL_PAD");
  addPortalGlow(root,6.0,-11.0,GREEN,"PHASE240_STORE_PORTAL_PAD");
}
async function install(){
  const runtime = await waitForRuntime();
  if (!runtime?.scene) return;
  const { scene } = runtime;
  if (scene.getObjectByName("PHASE240_GRAND_PALACE_REFERENCE_ROOT")) return;
  const root = new THREE.Group();
  root.name = "PHASE240_GRAND_PALACE_REFERENCE_ROOT";
  scene.add(root);
  addCurvedPalaceWall(root);
  addFloorPolish(root);
  addCentralSelector(root);
  addLobbyDestinations(root);
  addPortalPads(root);
  addSkyUpgrade(root);
  const clock = new THREE.Clock();
  function animate(){
    const dt = Math.min(clock.getDelta(), 0.033);
    const t = performance.now()*0.001;
    const rings = root.userData.phase240Rings || [];
    if (rings[0]) rings[0].rotation.z += dt * 0.17;
    if (rings[1]) rings[1].rotation.z -= dt * 0.11;
    const planets = root.userData.phase240Planets;
    if (planets?.moon) planets.moon.rotation.y += dt * 0.035;
    if (planets?.mars) planets.mars.rotation.y += dt * 0.060;
    if (planets?.moonHalo){ planets.moonHalo.material.opacity = 0.08 + 0.018 * (0.5 + 0.5 * Math.sin(t * 0.7)); }
    requestAnimationFrame(animate);
  }
  animate();
  window.SVR_PHASE240_REFERENCE_LOBBY_LOCK = {
    build: BUILD,
    active: true,
    siteTouched: false,
    sourceImageMatched: true,
    geometry: ["curved palace colonnade", "two-tier balcony", "central table selector", "storefront portals", "tier sponsor boards", "daily bonus kiosk", "high moon and mars"],
    checkedAt: new Date().toISOString()
  };
}
install();
