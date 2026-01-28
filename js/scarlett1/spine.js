/**
 * SCARLETT1 • SPINE (PERMANENT, ANDROID + LIGHTS V3)
 */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { VRButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js";
import { Diagnostics } from "./diagnostics.js";
import { mountUI } from "./ui.js";
import { buildWorld } from "./world.js";
import { mountAndroidControls } from "./androidControls.js";

export const Spine = (() => {
  let started = false;

  function hideBoot(){
    const boot = document.getElementById("boot");
    if (boot) boot.style.display = "none";
  }

  function mountRendererToBody(renderer){
    document.querySelectorAll("canvas").forEach(c => { try { c.remove(); } catch {} });
    const canvas = renderer.domElement;
    canvas.style.position = "fixed";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    document.body.appendChild(canvas);
  }

  function start(){
    if (started) return;
    started = true;

    if (!document.getElementById("scarlett-ui")){
      const ui = document.createElement("div");
      ui.id = "scarlett-ui";
      document.body.appendChild(ui);
    }

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.xr.enabled = true;
    renderer.setClearColor(0x02030a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    mountRendererToBody(renderer);

    const scene = new THREE.Scene();

    // Put camera on a yaw pivot so right-stick can rotate
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 500);
    const yawObj = new THREE.Object3D();
    yawObj.position.set(0, 1.65, 14);
    yawObj.add(camera);
    scene.add(yawObj);

    Diagnostics.mount();
    Diagnostics.log("[boot] spine start (V3)");
    Diagnostics.log("[boot] renderer mounted to body ✅");

    // Bright, consistent lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1f44, 1.25));
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(10, 18, 8);
    scene.add(key);
    const pitGlow = new THREE.PointLight(0x2a7cff, 1.6, 40);
    pitGlow.position.set(0, 2.2, 0);
    scene.add(pitGlow);

    buildWorld(scene);
    Diagnostics.log("[boot] world built ✅");

    // VR button (hidden, triggered by our UI)
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
        yawObj.rotation.y = 0;
        yawObj.position.set(0, 1.65, 14);
        Diagnostics.log("[reset] camera reset");
      },
    });

    // Inputs: keyboard + android joysticks
    const keys = Object.create(null);
    window.addEventListener("keydown", (e)=> keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", (e)=> keys[e.key.toLowerCase()] = false);

    let joyMoveX = 0, joyMoveY = 0;
    let joyLookX = 0, joyLookY = 0;
    mountAndroidControls({
      onMove: (x,y)=>{ joyMoveX = x; joyMoveY = y; },
      onLook: (x,y)=>{ joyLookX = x; joyLookY = y; },
      Diagnostics
    });

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
      // Look (right joystick) -> yaw
      const lookSpeed = 0.045;
      if (Math.abs(joyLookX) > 0.001) {
        yawObj.rotation.y += joyLookX * lookSpeed;
      }

      // Movement: keyboard + left joystick
      yawObj.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      right.crossVectors(fwd, up).normalize();

      const speed = 0.10;
      const mx = (keys["d"] ? 1 : 0) - (keys["a"] ? 1 : 0) + joyMoveX;
      const my = (keys["w"] ? 1 : 0) - (keys["s"] ? 1 : 0) + joyMoveY;

      if (my) yawObj.position.addScaledVector(fwd, speed * my);
      if (mx) yawObj.position.addScaledVector(right, -speed * mx);

      // Lock hawk-view height
      yawObj.position.y = 1.65;

      renderer.render(scene, camera);
    });

    Diagnostics.log("[boot] animation loop ✅");
    hideBoot();
  }

  return { start };
})();
