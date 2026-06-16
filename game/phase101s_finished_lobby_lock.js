import * as THREE from "three";

const LABEL = "PHASE-101S-FINISHED-LOBBY-LOCK";
const ROOT = "PHASE101S_FINISHED_LOBBY_ROOT";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const PURPLE = 0xb55cff;
const RED = 0x7b0b20;
const BLUE = 0x3b7cff;
const GREEN = 0x66ff99;

window.SVR_PHASE101S_FINISHED_LOBBY = {
  build: LABEL,
  active: true,
  lateLoadSafe: true,
  bootTouched: false,
  siteTouched: false,
  checkedAt: new Date().toISOString()
};

function matStd(color, opacity = 1, metalness = 0.08, roughness = 0.55){
  return new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity, metalness, roughness, side: THREE.DoubleSide });
}
function matBasic(color, opacity = 0.75){
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: false });
}
function matGlow(color, opacity = 0.42){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
}
function addBox(root, name, sx, sy, sz, x, y, z, mat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  root.add(mesh);
  return mesh;
}
function addCyl(root, name, r, h, x, y, z, mat, seg = 48){
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  root.add(mesh);
  return mesh;
}
function makeTextTexture(title, subtitle = "", color = "#ffffff", accent = "#7ffcff"){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,1024,512);
  ctx.fillStyle = "rgba(0,0,0,.68)";
  ctx.fillRect(0,0,1024,512);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.strokeRect(24,24,976,464);
  ctx.strokeStyle = "#ffd98a";
  ctx.lineWidth = 4;
  ctx.strokeRect(54,54,916,404);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = "900 72px system-ui,Arial";
  ctx.fillText(title, 512, subtitle ? 198 : 256);
  if(subtitle){
    ctx.fillStyle = accent;
    ctx.font = "800 34px system-ui,Arial";
    ctx.fillText(subtitle, 512, 315);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  return tex;
}
function addSign(root, name, title, subtitle, x, y, z, ry, w = 4.4, h = 2.0, accent = "#7ffcff"){
  const tex = makeTextTexture(title, subtitle, "#ffffff", accent);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.y = ry;
  mesh.renderOrder = 30;
  root.add(mesh);
  return mesh;
}
function addFloorLabel(root, name, title, x, z, w = 3.4, h = 1.2, accent = "#7ffcff"){
  const tex = makeTextTexture(title, "", "#ffffff", accent);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  mesh.name = name;
  mesh.position.set(x, 0.055, z);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 28;
  root.add(mesh);
  return mesh;
}
function addPortal(root, name, x, z, color, label, subtitle){
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, 0, z);
  root.add(group);
  addCyl(group, `${name}_BASE`, 0.92, 0.08, 0, 0.05, 0, matStd(0x090b16, 0.96, 0.12, 0.55), 72);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.025, 12, 96), matGlow(color, 0.72));
  ring.name = `${name}_TARGET_RING`;
  ring.position.y = 0.13;
  ring.rotation.x = -Math.PI / 2;
  group.add(ring);
  const beam = addCyl(group, `${name}_SOFT_BEAM`, 0.58, 2.2, 0, 1.16, 0, matGlow(color, 0.18), 64);
  beam.material.depthWrite = false;
  addFloorLabel(group, `${name}_FLOOR_LABEL`, label, 0, -1.02, 2.5, 0.82, color === GOLD ? "#ffd98a" : color === GREEN ? "#66ff99" : "#7ffcff");
  addSign(group, `${name}_SIGN`, label, subtitle, 0, 2.35, -0.7, 0, 2.7, 1.18, color === GOLD ? "#ffd98a" : color === GREEN ? "#66ff99" : "#7ffcff");
  return group;
}
function addPlanet(root, name, radius, x, y, z, color, glowColor, speed){
  const group = new THREE.Group();
  group.name = `${name}_GROUP`;
  group.position.set(x, y, z);
  root.add(group);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 28), new THREE.MeshStandardMaterial({ color, emissive: glowColor, emissiveIntensity: 0.22, roughness: 0.78, metalness: 0.02 }));
  mesh.name = name;
  group.add(mesh);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.14, 48, 28), matGlow(glowColor, 0.16));
  aura.name = `${name}_ATMOSPHERE_GLOW`;
  group.add(aura);
  group.userData.tick = (dt) => { mesh.rotation.y += dt * speed; aura.rotation.y -= dt * speed * 0.42; };
  return group;
}
function removeOldDuplicates(scene){
  const kill = [];
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if(/^PHASE257_|^PHASE258_|^PHASE259_/i.test(n)) kill.push(obj);
    if(/DUPLICATE|FAKE_MOON|OLD_MOON|GEOMETRY_MOON|GEOMETRY_MARS/i.test(n)) kill.push(obj);
    if(/PARTIAL_RUNTIME|DEBUG_HELPER|FLOOR_MARKER/i.test(n)) kill.push(obj);
  });
  kill.forEach((obj) => { if(obj.parent) obj.parent.remove(obj); });
  return kill.length;
}
function ensureLights(scene){
  let hemi = scene.getObjectByName("PHASE101S_SOFT_HEMISPHERE_LIGHT");
  if(!hemi){
    hemi = new THREE.HemisphereLight(0xdce8ff, 0x050611, 0.62);
    hemi.name = "PHASE101S_SOFT_HEMISPHERE_LIGHT";
    scene.add(hemi);
  }
  let key = scene.getObjectByName("PHASE101S_FRONT_SOFT_KEY_LIGHT");
  if(!key){
    key = new THREE.DirectionalLight(0xffffff, 0.84);
    key.name = "PHASE101S_FRONT_SOFT_KEY_LIGHT";
    key.position.set(-4, 8, 6);
    scene.add(key);
  }
}
function buildFinishedLobby(scene){
  const old = scene.getObjectByName(ROOT);
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = ROOT;
  scene.add(root);

  ensureLights(scene);
  const removed = removeOldDuplicates(scene);

  // Clean central walking path and red carpet.
  addBox(root, "PHASE101S_CENTER_RED_CARPET_OPEN_PATH", 4.8, 0.025, 20.5, 0, 0.035, 0.65, matBasic(RED, 0.72));
  addBox(root, "PHASE101S_CENTER_GOLD_PATH_LEFT_TRIM", 0.07, 0.035, 20.5, -2.48, 0.058, 0.65, matGlow(GOLD, 0.45));
  addBox(root, "PHASE101S_CENTER_GOLD_PATH_RIGHT_TRIM", 0.07, 0.035, 20.5, 2.48, 0.058, 0.65, matGlow(GOLD, 0.45));
  addBox(root, "PHASE101S_SPAWN_CLEAR_PAD", 6.5, 0.028, 3.2, 0, 0.064, 8.15, matGlow(CYAN, 0.12));
  addFloorLabel(root, "PHASE101S_SPAWN_FLOOR_LABEL", "START / OPEN PATH", 0, 8.45, 4.4, 1.2, "#7ffcff");

  // Four finished walls / readable anchor signs.
  addSign(root, "PHASE101S_NORTH_MAIN_TITLE_SIGN", "SVR POKER", "Finished lobby • Quest/WebXR ready", 0, 3.25, -12.85, 0, 6.2, 2.3, "#7ffcff");
  addSign(root, "PHASE101S_EAST_PGA_HUB_SIGN", "PGA HUB", "Golf training portal", 13.55, 2.78, -2.4, -Math.PI/2, 3.5, 1.55, "#7ffcff");
  addSign(root, "PHASE101S_WEST_WELLNESS_HUB_SIGN", "WELLNESS HUB", "Reiki / meditation portal", -13.55, 2.78, -2.4, Math.PI/2, 3.8, 1.55, "#b55cff");
  addSign(root, "PHASE101S_SOUTH_STORE_LEGEND_SIGN", "STORE + LEGENDS", "Rewards • sponsors • hall of fame", 0, 2.85, 12.72, Math.PI, 5.2, 1.85, "#ffd98a");

  // Compact portals, keeping central path open.
  addPortal(root, "PHASE101S_PORTAL_PGA", 9.25, -3.9, CYAN, "PGA", "Driving range");
  addPortal(root, "PHASE101S_PORTAL_WELLNESS", -9.25, -3.9, PURPLE, "WELLNESS", "Meditation room");
  addPortal(root, "PHASE101S_PORTAL_STORE", 7.9, 6.15, GOLD, "STORE", "Preview shop");
  addPortal(root, "PHASE101S_PORTAL_SCORPION", -7.9, 6.15, GREEN, "SCORPION", "Private room");

  // Low guard rails that do not block walking.
  [-1, 1].forEach((side) => {
    addBox(root, `PHASE101S_LOW_ROPE_RAIL_${side}_A`, 0.055, 0.055, 5.8, side * 3.15, 0.64, 1.65, matGlow(GOLD, 0.48));
    addBox(root, `PHASE101S_LOW_ROPE_RAIL_${side}_B`, 0.055, 0.055, 4.1, side * 3.15, 0.64, 7.25, matGlow(GOLD, 0.38));
    for(let i=0;i<5;i++) addCyl(root, `PHASE101S_LOW_POST_${side}_${i}`, 0.055, 0.82, side * 3.15, 0.42, -0.95 + i * 2.55, matStd(GOLD, 0.88, 0.28, 0.34), 24);
  });

  // Table focus glow but no heavy geometry replacement.
  const tableHalo = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.82, 96), matGlow(CYAN, 0.20));
  tableHalo.name = "PHASE101S_TABLE_FOCUS_HALO";
  tableHalo.position.set(0, 0.07, 0.55);
  tableHalo.rotation.x = -Math.PI / 2;
  root.add(tableHalo);
  addFloorLabel(root, "PHASE101S_TABLE_FLOOR_LABEL", "PLAY TABLE", 0, 3.55, 3.2, 1.0, "#ffd98a");

  // Final sky lock: one moon and one Mars, high north sky.
  const moon = addPlanet(root, "PHASE101S_REAL_MOON_HIGH_NORTH", 1.34, -4.8, 9.3, -18.6, 0xd8d6ce, 0x879dff, 0.035);
  const mars = addPlanet(root, "PHASE101S_MARS_HIGH_NORTH", 0.58, 5.8, 8.7, -20.4, 0xbf4b2e, 0xff6d48, 0.052);
  const orbit = new THREE.Mesh(new THREE.RingGeometry(6.1, 6.13, 128), matGlow(PURPLE, 0.14));
  orbit.name = "PHASE101S_SUBTLE_PLANET_ORBIT_GUIDE";
  orbit.position.set(0.4, 8.75, -19.2);
  orbit.rotation.x = Math.PI / 2.35;
  root.add(orbit);

  // Sparse star accents, performance safe.
  const starGeo = new THREE.BufferGeometry();
  const pts = [];
  for(let i=0;i<80;i++){
    const x = (Math.random() - 0.5) * 38;
    const y = 7.4 + Math.random() * 6.8;
    const z = -10 - Math.random() * 18;
    pts.push(new THREE.Vector3(x, y, z));
  }
  starGeo.setFromPoints(pts);
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbfefff, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.72, depthWrite: false }));
  stars.name = "PHASE101S_PERFORMANCE_SAFE_STAR_ACCENTS";
  root.add(stars);

  const previousTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt) => {
    previousTick?.(dt);
    root.traverse((obj) => { if(obj.userData?.tick) obj.userData.tick(dt); });
    tableHalo.rotation.z += dt * 0.06;
    orbit.rotation.z += dt * 0.018;
  };

  window.SVR_PHASE101S_FINISHED_LOBBY = {
    build: LABEL,
    active: true,
    finishedLobby: true,
    centralPathOpen: true,
    readableHubSigns: true,
    portalsPlaced: ["PGA", "WELLNESS", "STORE", "SCORPION"],
    moonMarsLocked: true,
    duplicateCleanupCount: removed,
    bootTouched: false,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  try { document.title = `SVR Poker • ${LABEL}`; } catch {}
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  window.SVR_RELEASE_BOOT?.("phase101s-finished-lobby-loaded");
  return true;
}
function install(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  try { return buildFinishedLobby(scene); }
  catch(error){
    window.SVR_PHASE101S_FINISHED_LOBBY.error = String(error?.message || error);
    return false;
  }
}
let tries = 0;
const timer = setInterval(() => {
  tries += 1;
  if(install() || tries > 90) clearInterval(timer);
}, 220);
setTimeout(install, 1800);
setTimeout(install, 4200);
setTimeout(install, 8200);
