import * as THREE from "three";

const LABEL = "PHASE-287-PLAYER-PILL-AVATAR-LOCK";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const PURPLE = 0xa77cff;
const GREEN = 0x8dffb4;
const RED = 0xff5b8c;

function makeTextTexture(title, sub, color = "#7ffcff"){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,512,192);
  ctx.fillStyle = "rgba(0,0,0,.66)";
  ctx.fillRect(0,0,512,192);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.strokeRect(10,10,492,172);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.font = "900 54px system-ui,Arial";
  ctx.fillText(title,256,70);
  ctx.fillStyle = color;
  ctx.font = "800 30px system-ui,Arial";
  ctx.fillText(sub,256,132);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makePill(name, title, sub, color, x, z){
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x,0,z);
  const mat = new THREE.MeshStandardMaterial({ color, roughness:.58, metalness:.08, emissive:color, emissiveIntensity:.12 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.92,28), mat);
  body.name = `${name}_BODY`;
  body.position.y = .92;
  body.rotation.z = Math.PI * .5;
  group.add(body);
  const headA = new THREE.Mesh(new THREE.SphereGeometry(.205,28,16), mat);
  headA.name = `${name}_CAP_LEFT`;
  headA.position.set(-.46,.92,0);
  group.add(headA);
  const headB = new THREE.Mesh(new THREE.SphereGeometry(.205,28,16), mat);
  headB.name = `${name}_CAP_RIGHT`;
  headB.position.set(.46,.92,0);
  group.add(headB);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.36,.50,64), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.48, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
  ring.name = `${name}_FLOOR_RING`;
  ring.rotation.x = -Math.PI/2;
  ring.position.y = .035;
  group.add(ring);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.35,.50), new THREE.MeshBasicMaterial({ map:makeTextTexture(title, sub, `#${color.toString(16).padStart(6,"0")}`), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  label.name = `${name}_LABEL`;
  label.position.y = 1.72;
  label.userData.phase287Billboard = true;
  group.add(label);
  return group;
}
function install(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__ || scene?.userData?._camera;
  if (!scene) return false;
  let root = scene.getObjectByName("PHASE287_PLAYER_PILL_AVATAR_ROOT");
  if (!root){
    root = new THREE.Group();
    root.name = "PHASE287_PLAYER_PILL_AVATAR_ROOT";
    scene.add(root);
    root.add(makePill("PHASE287_ADMIN_PILL_AVATAR", "ADMIN", "online test", GOLD, 0, 6.35));
    root.add(makePill("PHASE287_LOCAL_PLAYER_PILL_AVATAR", "PLAYER", "local", CYAN, 0, 3.35));
    root.add(makePill("PHASE287_ANDROID_TEST_PILL_AVATAR", "ANDROID", "slot", GREEN, -2.6, 1.65));
    root.add(makePill("PHASE287_QUEST_TEST_PILL_AVATAR", "QUEST", "slot", PURPLE, 2.6, 1.65));
    root.add(makePill("PHASE287_REMOTE_SLOT_A_PILL_AVATAR", "REMOTE A", "waiting", RED, -2.6, -.55));
    root.add(makePill("PHASE287_REMOTE_SLOT_B_PILL_AVATAR", "REMOTE B", "waiting", 0x5b8cff, 2.6, -.55));
  }
  root.traverse((obj)=>{
    if (obj.userData?.phase287Billboard && camera) obj.lookAt(camera.position);
  });
  window.SVR_PHASE287_PLAYER_PILL_AVATAR_LOCK = {
    build: LABEL,
    active: true,
    pillAvatarsVisible: true,
    adminPillVisible: !!scene.getObjectByName("PHASE287_ADMIN_PILL_AVATAR"),
    localPlayerPillVisible: !!scene.getObjectByName("PHASE287_LOCAL_PLAYER_PILL_AVATAR"),
    remoteSlotsReady: true,
    realMultiplayerTransport: false,
    transportNeeded: "WebSocket/WebRTC signaling backend still required for cross-device live movement.",
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
install();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (install() || tries > 120) clearInterval(timer); }, 150);
[500,1200,2400,4800,8000,12000].forEach((delay)=>setTimeout(install, delay));
