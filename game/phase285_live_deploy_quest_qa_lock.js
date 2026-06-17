import * as THREE from "three";

const LABEL = "PHASE-287-PLAYER-PILL-AVATAR-LOCK";

function q(id){ return document.querySelector(id); }
function exists(obj){ return !!obj; }
function sceneObject(name){ return window.__SVR_SCENE__?.getObjectByName?.(name) || null; }
function countRearDoorObstructions(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return null;
  const centers = [-12,-6,0,6,12];
  let count = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toUpperCase();
    if (!n.includes("COLUMN") || !obj.position || obj.position.z > -10.8 || obj.visible === false) return;
    const x = Number(obj.position.x || 0);
    if (centers.some((c)=>Math.abs(x-c)<1.05)) count += 1;
  });
  return count;
}
function textTexture(title, sub, color){
  const c = document.createElement("canvas");
  c.width = 512; c.height = 192;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.70)"; ctx.fillRect(0,0,512,192);
  ctx.strokeStyle = color; ctx.lineWidth = 10; ctx.strokeRect(10,10,492,172);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff"; ctx.font = "900 54px system-ui,Arial"; ctx.fillText(title,256,72);
  ctx.fillStyle = color; ctx.font = "800 30px system-ui,Arial"; ctx.fillText(sub,256,132);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function pill(name, title, sub, color, x, z){
  const group = new THREE.Group(); group.name = name; group.position.set(x,0,z);
  const mat = new THREE.MeshStandardMaterial({ color, roughness:.58, metalness:.08, emissive:color, emissiveIntensity:.12 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.92,28), mat);
  body.name = `${name}_BODY`; body.position.y = .92; body.rotation.z = Math.PI*.5; group.add(body);
  const a = new THREE.Mesh(new THREE.SphereGeometry(.205,28,16), mat); a.name = `${name}_CAP_A`; a.position.set(-.46,.92,0); group.add(a);
  const b = new THREE.Mesh(new THREE.SphereGeometry(.205,28,16), mat); b.name = `${name}_CAP_B`; b.position.set(.46,.92,0); group.add(b);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.36,.50,64), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.48, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  ring.name = `${name}_RING`; ring.rotation.x = -Math.PI/2; ring.position.y = .035; group.add(ring);
  const hex = `#${color.toString(16).padStart(6,"0")}`;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.35,.50), new THREE.MeshBasicMaterial({ map:textTexture(title, sub, hex), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  label.name = `${name}_LABEL`; label.position.y = 1.72; label.userData.phase287Billboard = true; group.add(label);
  return group;
}
function installPills(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return false;
  let root = scene.getObjectByName("PHASE287_PLAYER_PILL_AVATAR_ROOT");
  if (!root){
    root = new THREE.Group(); root.name = "PHASE287_PLAYER_PILL_AVATAR_ROOT"; scene.add(root);
    root.add(pill("PHASE287_ADMIN_PILL_AVATAR", "ADMIN", "online test", 0xffd98a, 0, 6.35));
    root.add(pill("PHASE287_PLAYER_PILL_AVATAR", "PLAYER", "local", 0x7ffcff, 0, 3.35));
    root.add(pill("PHASE287_ANDROID_PILL_AVATAR", "ANDROID", "slot", 0x8dffb4, -2.6, 1.65));
    root.add(pill("PHASE287_QUEST_PILL_AVATAR", "QUEST", "slot", 0xa77cff, 2.6, 1.65));
    root.add(pill("PHASE287_REMOTE_A_PILL_AVATAR", "REMOTE A", "waiting", 0xff5b8c, -2.6, -.55));
    root.add(pill("PHASE287_REMOTE_B_PILL_AVATAR", "REMOTE B", "waiting", 0x5b8cff, 2.6, -.55));
  }
  const camera = window.__SVR_CAMERA__ || scene.userData?._camera;
  root.traverse((obj)=>{ if (obj.userData?.phase287Billboard && camera) obj.lookAt(camera.position); });
  return true;
}
function snapshot(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const pillarLock = window.SVR_PHASE284_PILLAR_OBSTRUCTION_SCAN_LOCK || window.SVR_PHASE283_PILLAR_MATRIX_APPLY_LOCK || window.SVR_PHASE281_PILLAR_FINAL_WALL_FLUSH_LOCK;
  const canvas = q("canvas");
  const moon = sceneObject("PHASE200_SINGLE_VISIBLE_MOON_LOCKED");
  const mars = sceneObject("PHASE200_SINGLE_VISIBLE_MARS_LOCKED");
  installPills();
  const result = {
    build: LABEL,
    active: true,
    siteTouched: false,
    checkedAt: new Date().toISOString(),
    url: String(location.href),
    title: String(document.title || ""),
    bodyBuild: String(document.body?.getAttribute("data-build") || ""),
    checks: {
      canvasPresent: exists(canvas),
      scenePresent: exists(scene),
      rendererPresent: exists(renderer),
      pillarLockPresent: exists(pillarLock),
      moonPresent: exists(moon),
      marsPresent: exists(mars),
      rearDoorObstructionCount: countRearDoorObstructions(),
      adminPillPresent: !!sceneObject("PHASE287_ADMIN_PILL_AVATAR"),
      playerPillsPresent: !!sceneObject("PHASE287_PLAYER_PILL_AVATAR")
    },
    multiplayer: {
      pillAvatarsReady: true,
      realCrossDeviceTransport: false,
      nextRequired: "Add WebSocket/WebRTC signaling backend for live Android-to-Quest movement."
    },
    expectedManualQuestChecks: [
      "admin pill visible",
      "player pill slots visible",
      "rear pillars clear storefront signs",
      "teleport ray aims forward",
      "forward stick follows headset direction"
    ]
  };
  window.SVR_PHASE287_PLAYER_PILL_AVATAR_LOCK = result;
  window.SVR_PHASE285_LIVE_DEPLOY_AND_QUEST_QA_LOCK = result;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.body?.setAttribute("data-qa-build", LABEL); } catch {}
  return result;
}
function install(){
  const snap = snapshot();
  const status = document.getElementById("status");
  if (status) status.textContent = `Pill avatars armed. ${LABEL}`;
  console.info("[SVR QA]", snap);
  return snap;
}
install();
[500,1200,2400,4800,8000,12000,18000,24000].forEach((delay)=>setTimeout(install, delay));
