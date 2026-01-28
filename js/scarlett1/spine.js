/**
 * SCARLETT1 • SPINE (PERMANENT, NULL-SAFE)
 * Never crashes on missing DOM. Always boots world + HUD.
 */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { VRButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js";
import { Diagnostics } from "./diagnostics.js";
import { mountUI } from "./ui.js";
import { buildWorld } from "./world.js";

export const Spine = (() => {
  let started = false;

  function ensureRoot(id){
    let el = document.getElementById(id);
    if (!el){
      el = document.createElement("div");
      el.id = id;
      document.body.appendChild(el);
      console.log(`[Spine] created missing #${id}`);
    }
    return el;
  }

  function start(){
    if (started) return;
    started = true;

    const appRoot = ensureRoot("scarlett-app");
    ensureRoot("scarlett-ui");

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.xr.enabled = true;
    renderer.setClearColor(0x02030a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    appRoot.innerHTML = "";
    appRoot.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 500);
    camera.position.set(0, 1.65, 14);
    camera.lookAt(0, 1.2, 0);

    Diagnostics.mount();
    Diagnostics.log("[boot] spine start");

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1f44, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(10, 18, 8);
    scene.add(key);

    buildWorld(scene);
    Diagnostics.log("[boot] world built ✅");

    let vrBtn = null;
    function ensureVRBtn(){
      if (vrBtn) return vrBtn;
      vrBtn = VRButton.createButton(renderer);
      vrBtn.style.position = "fixed";
      vrBtn.style.left = "-9999px";
      document.body.appendChild(vrBtn);
      return vrBtn;
    }

    mountUI({
      onEnterVR: () => ensureVRBtn().click(),
      onReload: () => location.reload(),
      onReset: () => {
        camera.position.set(0, 1.65, 14);
        camera.lookAt(0, 1.2, 0);
        Diagnostics.log("[reset] camera reset");
      },
    });

    const keys = Object.create(null);
    window.addEventListener("keydown", (e)=> keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", (e)=> keys[e.key.toLowerCase()] = false);

    function onResize(){
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener("resize", onResize, { passive:true });

    const fwd = new THREE.Vector3();
    const up = new THREE.Vector3(0,1,0);
    const right = new THREE.Vector3();

    renderer.setAnimationLoop(() => {
      camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      right.crossVectors(fwd, up).normalize();

      const speed = 0.12;
      if (keys["w"]) camera.position.addScaledVector(fwd, speed);
      if (keys["s"]) camera.position.addScaledVector(fwd, -speed);
      if (keys["a"]) camera.position.addScaledVector(right, speed);
      if (keys["d"]) camera.position.addScaledVector(right, -speed);

      camera.position.y = 1.65; // hawk view level

      renderer.render(scene, camera);
    });

    Diagnostics.log("[boot] animation loop ✅");
  }

  return { start };
})();
