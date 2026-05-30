import * as THREE from "three";
import { createCore } from "./core_scene.js";
import { createDesktopControls } from "./desktop_controls.js";
import { createHands } from "./hands.js";
import { createTeleportRig } from "./teleport.js";
import { createTexturedMoonMars, tickTexturedMoonMars } from "./moon_mars_textured.js";

const PHASE166_PRIVATE_SKY = "PHASE-166-PRIVATE-ROOM-HIGH-MOON-MARS";

export function bootPrivateScene({ title, subtitle, accent = 0x7ff5c7, buildLabel = PHASE166_PRIVATE_SKY, build }){
  const { scene, camera, renderer } = createCore({ containerId: "app" });
  scene.background = new THREE.Color(0x02030a);
  camera.position.set(0,1.62,5.2);
  camera.lookAt(0,1.1,0);
  if(camera.far < 1200){ camera.far = 1200; camera.updateProjectionMatrix?.(); }

  scene.add(new THREE.HemisphereLight(0xaaaaff,0x101018,1.0));
  const key = new THREE.DirectionalLight(0xffffff,1.05);
  key.position.set(4,8,5);
  scene.add(key);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(18,96),new THREE.MeshStandardMaterial({color:0x101018,roughness:.72,metalness:.04}));
  floor.rotation.x = -Math.PI/2;
  scene.add(floor);

  const stars = new THREE.Group();
  scene.add(stars);
  const starGeo = new THREE.SphereGeometry(.025,6,4);
  const starMat = new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.72});
  for(let i=0;i<170;i++){
    const s = new THREE.Mesh(starGeo,starMat);
    const a = Math.random()*Math.PI*2;
    const r = 10+Math.random()*25;
    s.position.set(Math.cos(a)*r,8+Math.random()*24,Math.sin(a)*r-18);
    stars.add(s);
  }

  const planets = createTexturedMoonMars(scene, {
    name: `SVR_PHASE166_HIGH_SKY_${String(title || "ROOM").replace(/\W+/g,"_")}`,
    moonRadius: 2.8,
    marsRadius: 1.7,
    moonPosition: new THREE.Vector3(-16, 72, -78),
    marsPosition: new THREE.Vector3(18, 86, -92),
    moonLight: 2.8,
    marsLight: 1.9,
    orbit: 1.6,
    fixedNorthSky: true
  });

  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 384;
  const x = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const hex = "#" + accent.toString(16).padStart(6,"0");
  x.fillStyle = "rgba(3,7,14,.92)";
  x.fillRect(0,0,1024,384);
  x.strokeStyle = hex;
  x.lineWidth = 10;
  x.strokeRect(18,18,988,348);
  x.textAlign = "center";
  x.fillStyle = "#fff";
  x.font = "bold 76px system-ui,Arial";
  x.fillText(title,512,138);
  x.fillStyle = hex;
  x.font = "38px system-ui,Arial";
  x.fillText(subtitle,512,220);
  x.fillStyle = "rgba(255,255,255,.72)";
  x.font = "28px system-ui,Arial";
  x.fillText(`BUILD: ${buildLabel}`,512,300);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.4,2.02),new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false}));
  sign.position.set(0,2.2,-5.6);
  scene.add(sign);

  const backGate = new THREE.Mesh(new THREE.RingGeometry(.72,1.05,72),new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.26,side:THREE.DoubleSide}));
  backGate.rotation.x = -Math.PI/2;
  backGate.position.set(0,.035,3.25);
  scene.add(backGate);

  build?.({scene,camera,renderer,accent,backGate,planets});

  const desktop = createDesktopControls({camera,domElement:renderer.domElement});
  const hands = createHands({scene,renderer,log:console.log});
  const tp = createTeleportRig({scene,renderer,camera,roomClamp:16,log:console.log});
  const status = document.getElementById("status");
  document.getElementById("backLobby")?.addEventListener("click",()=>{ location.href = "./index.html?v=phase166-return"; });
  window.addEventListener("keydown",e=>{ if(e.code === "Escape" || e.code === "KeyB") location.href = "./index.html?v=phase166-return"; });
  renderer.xr.addEventListener("sessionstart",async()=>{ await tp.onSessionStart(); });

  let prev = performance.now();
  renderer.setAnimationLoop(()=>{
    const now = performance.now();
    const dt = Math.min((now-prev)/1000,.033);
    prev = now;
    if(!renderer.xr.isPresenting) desktop.update(dt);
    scene.userData._time = (scene.userData._time || 0) + dt;
    scene.userData._camera = renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera;
    if(camera.far < 1200){ camera.far = 1200; camera.updateProjectionMatrix?.(); }
    hands.update(dt);
    tp.update({dt,leftHand:hands.getLeftHand(),rightHand:hands.getRightHand(),leftController:hands.getLeftController(),rightController:hands.getRightController(),statusCb:t=>{ if(status) status.textContent = t; }});
    tickTexturedMoonMars(scene,dt);
    stars.rotation.y += dt*.003;
    renderer.render(scene,camera);
  });
}
