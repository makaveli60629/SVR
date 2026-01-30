// /spine.js — ROOT — PERMANENT
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function diag(msg){
  const el = document.getElementById("diag");
  if (el) el.textContent += `\n${msg}`;
  console.log(msg);
}

export async function startSpine(){
  diag("[boot] JS LOADED ✅ (module tag ran)");

  // --- Scene ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);

  // --- Camera ---
  const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.01, 800);
  camera.position.set(0, 1.7, 16);

  // --- Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.xr.enabled = true;

  renderer.domElement.id = "scarlett-canvas";
  document.body.appendChild(renderer.domElement);

  diag("[spine] renderer created ✅");

  // --- Resize ---
  addEventListener("resize", ()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // --- Public controls ---
  window.SCARLETT = {
    enterVR: async ()=>{
      try{
        if(!navigator.xr){ diag("[xr] navigator.xr not available"); return; }
        const ok = await navigator.xr.isSessionSupported("immersive-vr");
        if(!ok){ diag("[xr] immersive-vr not supported"); return; }
        const session = await navigator.xr.requestSession("immersive-vr", { optionalFeatures:["local-floor","bounded-floor","hand-tracking"] });
        renderer.xr.setSession(session);
        diag("[xr] session started ✅");
      }catch(e){
        diag("[xr][error] " + (e?.message||e));
      }
    },
    resetSpawn: ()=>{
      camera.position.set(0, 1.7, 16);
      camera.lookAt(0, 1.35, 0);
      diag("[ui] spawn reset ✅");
    },
    hardReload: ()=>{
      location.reload();
    },
    copyReport: async ()=>{
      try{
        const txt = document.getElementById("diag")?.textContent || "";
        await navigator.clipboard.writeText(txt);
        diag("[ui] report copied ✅");
      }catch(e){
        diag("[ui][copy fail] " + (e?.message||e));
      }
    },
    hideHUD: ()=>{
      const hud = document.getElementById("hud");
      if(hud) hud.style.display = "none";
    },
    showHUD: ()=>{
      const hud = document.getElementById("hud");
      if(hud) hud.style.display = "flex";
    }
  };

  // --- Load world ---
  let world = null;
  try{
    world = await import("./js/scarlett1/world.js");
    diag("[spine] world module loaded ✅ (/js/scarlett1/world.js)");
  }catch(e){
    diag("[spine][error] world import failed ❌ " + (e?.message||e));
    throw e;
  }

  // --- Run init ---
  let updates = [];
  try{
    const ctx = {
      THREE, scene, camera, renderer,
      log: diag
    };

    const res = await (world.init?.(ctx));
    diag("[spine] world init ✅");
    updates = (res?.updates || []);
    diag(`[spine] updates=${updates.length} ✅`);
  }catch(e){
    diag("[world][error] init failed ❌ " + (e?.message||e));
  }

  // --- Loop ---
  renderer.setAnimationLoop((t)=>{
    const dt = Math.min(0.05, (renderer.info.render.frame ? 0.016 : 0.016));
    for(const fn of updates) fn(dt);
    renderer.render(scene, camera);
  });

  diag("[spine] animation loop ✅");
  diag("[boot] spine started ✅");
}
