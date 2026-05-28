import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const app = document.getElementById("app");
const status = document.getElementById("status");
const logEl = document.getElementById("log");
const errEl = document.getElementById("err");

function log(msg){
  console.log("[SVR]", msg);
  if(logEl) logEl.textContent += "[SVR] " + msg + "\n";
}

function fail(e){
  console.error(e);
  if(errEl){
    errEl.style.display = "block";
    errEl.textContent = String(e && e.stack ? e.stack : e);
  }
  if(status) status.textContent = "Boot error";
}

try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05010c);

  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 100);
  camera.position.set(0, 1.6, 2.25);

  const rig = new THREE.Group();
  rig.name = "SVR_PlayerRig";
  rig.add(camera);
  scene.add(rig);

  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.xr.enabled = true;
  app.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  window.SVR = window.SVR || {};
  window.SVR.scene = scene;
  window.SVR.camera = camera;
  window.SVR.rig = rig;
  window.scene = scene;
  window.camera = camera;
  window.cameraRig = rig;

  const hemi = new THREE.HemisphereLight(0xa98cff, 0x10081c, 1.1);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(2, 6, 4);
  scene.add(dirLight);

  function mat(color, emissive=0x000000, intensity=0){
    return new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity:intensity,
      roughness:0.82,
      metalness:0.05
    });
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14,14),
    mat(0x0b0716)
  );
  floor.rotation.x = -Math.PI / 2;
  floor.name = "SVR_OriginalLobby_Floor";
  scene.add(floor);

  function wall(name, x,y,z, ry, w,h,color){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat(color, 0x06020c, .25));
    m.name = name;
    m.position.set(x,y,z);
    m.rotation.y = ry;
    scene.add(m);
    return m;
  }

  wall("SVR_OriginalLobby_BackWall",0,2,-5.05,0,14,4,0x120920);
  wall("SVR_OriginalLobby_LeftWall",-7,2,0,Math.PI/2,10,4,0x10081c);
  wall("SVR_OriginalLobby_RightWall",7,2,0,-Math.PI/2,10,4,0x10081c);

  function panel(name,x,z,ry,title,lines,color=0x18102d){
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x,1.75,z);
    group.rotation.y = ry;
    scene.add(group);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.55,2.8), mat(color,0x080314,.35));
    group.add(back);

    const border = new THREE.Mesh(new THREE.RingGeometry(1.55,1.6,64), new THREE.MeshBasicMaterial({color:0x7dfaff}));
    border.position.set(0,-1.1,.03);
    group.add(border);

    return group;
  }

  panel("SVR_PrivateRooms_Panel",-3.8,-3.65,THREE.MathUtils.degToRad(35),"PRIVATE VR ROOMS",[]);
  panel("SVR_StoreHub_Panel",0,-4.35,0,"STORE HUB",[]);
  panel("SVR_SiteModules_Panel",3.8,-3.65,THREE.MathUtils.degToRad(-35),"SITE MODULES",[]);

  const moon = new THREE.Mesh(new THREE.SphereGeometry(.42,32,16), mat(0xd7d4c2,0x4d4b3d,.35));
  moon.name = "SVR_Moon";
  moon.position.set(-4.8,4.5,-6);
  scene.add(moon);

  const mars = new THREE.Mesh(new THREE.SphereGeometry(.36,32,16), mat(0xb75635,0x5c2115,.35));
  mars.name = "SVR_Mars";
  mars.position.set(4.8,4.25,-6.2);
  scene.add(mars);

  const standRing = new THREE.Mesh(
    new THREE.TorusGeometry(.82,.025,16,80),
    new THREE.MeshBasicMaterial({color:0x7dfaff})
  );
  standRing.name = "SVR_StandHere_Ring";
  standRing.rotation.x = Math.PI / 2;
  standRing.position.set(0,.03,-1.25);
  scene.add(standRing);

  const loaderCanvas = document.createElement("canvas");
  loaderCanvas.width = 1024;
  loaderCanvas.height = 512;
  const ctx = loaderCanvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0,0,1024,512);
  ctx.fillStyle = "#ffffff";
  ctx.font = "42px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SVR ORIGINAL LOBBY / STORE FRONT",512,70);
  ctx.fillStyle = "#9ffcff";
  ctx.font = "26px Arial";
  ctx.fillText("PRIVATE VR ROOMS        STORE HUB        SITE MODULES",512,135);
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px Arial";
  ctx.fillText("Scorpion Poker • PGA Hub • Smoker Lounge • Reiki Room • VR Store",512,200);
  ctx.fillText("Avatar Watch Skin • Premium Chip Set • Card Back Pack • Lobby Theme",512,260);
  ctx.fillText("Profile • Inventory • Dashboard • Membership • Sponsor Hub",512,320);
  ctx.fillText("Grip = fist move. Trigger release = teleport leap. Direction = camera forward.",512,410);

  const textTex = new THREE.CanvasTexture(loaderCanvas);
  const textPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6,3.8),
    new THREE.MeshBasicMaterial({map:textTex, transparent:true})
  );
  textPlane.position.set(0,2.1,-4.82);
  scene.add(textPlane);

  const keys = {};
  addEventListener("keydown", e => keys[e.code] = true);
  addEventListener("keyup", e => keys[e.code] = false);

  const locomotion = {
    lastTeleport:0,
    wasTrigger:false
  };

  function getPads(){
    return navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  }

  function cameraForward(){
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    if(dir.lengthSq() < 0.001) dir.set(0,0,-1);
    dir.normalize();
    return dir;
  }

  function moveForward(amount){
    rig.position.add(cameraForward().multiplyScalar(amount));
  }

  function updateInput(){
    let grip = false;
    let trigger = false;

    for(const p of getPads()){
      if(p.buttons?.[1]?.pressed) grip = true;
      if(p.buttons?.[0]?.pressed) trigger = true;
    }

    if(keys.KeyF) grip = true;
    if(keys.Space || keys.KeyT) trigger = true;

    if(grip) moveForward(0.055);

    const now = performance.now();
    const released = locomotion.wasTrigger && !trigger;

    if(released && now - locomotion.lastTeleport > 650){
      locomotion.lastTeleport = now;
      moveForward(4.5);
      log("Trigger-release teleport leap fired.");
    }

    locomotion.wasTrigger = trigger;
  }

  document.querySelectorAll("[data-route]").forEach(btn=>{
    btn.addEventListener("click",()=>{ location.href = btn.dataset.route; });
  });

  document.querySelectorAll("[data-scene]").forEach(btn=>{
    btn.addEventListener("click",()=>{ log("Scene selected: " + btn.dataset.scene); });
  });

  document.getElementById("toggleLog")?.addEventListener("click",()=>{
    logEl.style.display = logEl.style.display === "block" ? "none" : "block";
  });

  addEventListener("resize",()=>{
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  renderer.setAnimationLoop(()=>{
    updateInput();
    moon.rotation.y += 0.002;
    mars.rotation.y += 0.003;
    renderer.render(scene,camera);
  });

  status.textContent = "Lobby online";
  log("Phase 253 full boot runtime loaded.");
} catch(e) {
  fail(e);
}
