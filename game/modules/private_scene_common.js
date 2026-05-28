import * as THREE from "three";
import { createCore } from "./core_scene.js";
import { createDesktopControls } from "./desktop_controls.js";
import { createHands } from "./hands.js";
import { createTeleportRig } from "./teleport.js";

export function bootPrivateScene({ title, subtitle, accent = 0x7ff5c7, buildLabel = "PHASE-85-PRIVATE-SCENE-ROUTING-LOCK", build }){
  const { scene, camera, renderer } = createCore({ containerId: "app" });
  scene.background = new THREE.Color(0x02030a);
  camera.position.set(0,1.62,5.2); camera.lookAt(0,1.1,0);

  const hemi = new THREE.HemisphereLight(0xaaaaff, 0x101018, 1.0); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4,8,5); scene.add(key);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(18,96), new THREE.MeshStandardMaterial({ color:0x101018, roughness:.72, metalness:.04 }));
  floor.rotation.x = -Math.PI/2; scene.add(floor);

  const stars = new THREE.Group(); scene.add(stars);
  const starMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.75 });
  const starGeo = new THREE.SphereGeometry(.025,6,4);
  for(let i=0;i<120;i++){
    const s = new THREE.Mesh(starGeo, starMat);
    const a = Math.random()*Math.PI*2, r = 10+Math.random()*18;
    s.position.set(Math.cos(a)*r, 4+Math.random()*10, Math.sin(a)*r-6);
    stars.add(s);
  }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.9,32,16), new THREE.MeshBasicMaterial({ color:0xf0f5ff }));
  moon.position.set(-7,9,-12); scene.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.52,32,16), new THREE.MeshBasicMaterial({ color:0xff7652 }));
  mars.position.set(7,8.5,-14); scene.add(mars);

  const canvas = document.createElement("canvas"); canvas.width=1024; canvas.height=384;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  ctx.fillStyle="rgba(3,7,14,.92)"; ctx.fillRect(0,0,1024,384);
  ctx.strokeStyle="rgba(127,245,199,.78)"; ctx.lineWidth=10; ctx.strokeRect(18,18,988,348);
  ctx.fillStyle="#fff"; ctx.font="bold 76px system-ui,Arial"; ctx.textAlign="center"; ctx.fillText(title,512,138);
  ctx.fillStyle="rgba(127,245,199,.9)"; ctx.font="38px system-ui,Arial"; ctx.fillText(subtitle,512,220);
  ctx.fillStyle="rgba(255,255,255,.72)"; ctx.font="28px system-ui,Arial"; ctx.fillText(`BUILD: ${buildLabel}`,512,300);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.4,2.02), new THREE.MeshBasicMaterial({ map:tex, transparent:true, toneMapped:false }));
  sign.position.set(0,2.2,-5.6); scene.add(sign);

  const backMat = new THREE.MeshBasicMaterial({ color:accent, transparent:true, opacity:.22, side:THREE.DoubleSide });
  const backGate = new THREE.Mesh(new THREE.RingGeometry(.72,1.05,72), backMat);
  backGate.rotation.x = -Math.PI/2; backGate.position.set(0,.035,3.25); backGate.userData.backToLobby = true; scene.add(backGate);

  build?.({ scene, camera, renderer, accent, backGate });

  const desktop = createDesktopControls({ camera, domElement: renderer.domElement });
  const hands = createHands({ scene, renderer, log: console.log });
  const tp = createTeleportRig({ scene, renderer, camera, roomClamp: 16, log: console.log });
  const status = document.getElementById("status");
  document.getElementById("backLobby")?.addEventListener("click", ()=>{ location.href="./index.html?v=phase85-return"; });
  window.addEventListener("keydown", e=>{ if(e.code==="Escape" || e.code==="KeyB") location.href="./index.html?v=phase85-return"; });
  renderer.domElement.addEventListener("click", ()=>{
    const p = camera.position;
    if (Math.hypot(p.x - backGate.position.x, p.z - backGate.position.z) < 2.2) location.href="./index.html?v=phase85-return";
  }, {passive:true});
  renderer.xr.addEventListener("sessionstart", async()=>{ await tp.onSessionStart(); });
  let prev=performance.now();
  renderer.setAnimationLoop(()=>{
    const now=performance.now(); const dt=Math.min((now-prev)/1000,.033); prev=now;
    if(!renderer.xr.isPresenting) desktop.update(dt);
    scene.userData._camera = renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera;
    hands.update(dt);
    tp.update({ dt, leftHand:hands.getLeftHand(), rightHand:hands.getRightHand(), leftController:hands.getLeftController(), rightController:hands.getRightController(), statusCb:t=>{ if(status) status.textContent=t; } });
    moon.rotation.y += dt*.05; mars.rotation.y += dt*.08; stars.rotation.y += dt*.003;
    renderer.render(scene,camera);
  });
}
