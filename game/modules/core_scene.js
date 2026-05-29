import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE108 = "PHASE-108-QUEST-FRAMERATE-BLACK-FRAME-LOCK";

function isQuestLike(){
  const ua = navigator.userAgent || "";
  return /Quest|OculusBrowser|MetaQuest|VR/i.test(ua);
}

export function createCore({ containerId = "app" } = {}){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);

  const questMode = isQuestLike();
  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.08, questMode ? 900 : 1400);

  const renderer = new THREE.WebGLRenderer({
    antialias: !questMode,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false
  });

  renderer.setClearColor(0x050508, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, questMode ? 0.68 : 0.9));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setFramebufferScaleFactor?.(questMode ? 0.68 : 0.88);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = false;
  renderer.info.autoReset = false;

  renderer.domElement.style.background = "#050508";
  renderer.domElement.style.transform = "translateZ(0)";
  document.getElementById(containerId).appendChild(renderer.domElement);

  const vrButton = VRButton.createButton(renderer, {
    requiredFeatures: ["local-floor"],
    optionalFeatures: ["bounded-floor", "hand-tracking"]
  });
  vrButton.classList.add("svr-vr-button");
  document.body.appendChild(vrButton);

  renderer.xr.addEventListener("sessionstart", ()=>{
    try{
      renderer.info.reset();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.68));
      camera.near = 0.08;
      camera.far = 900;
      camera.updateProjectionMatrix();
      console.log(`[${PHASE108}] Quest/VR performance mode active`);
    }catch(err){
      console.warn(`[${PHASE108}] VR performance setup failed`, err);
    }
  });

  renderer.xr.addEventListener("sessionend", ()=>{
    try{
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, questMode ? 0.68 : 0.9));
      camera.near = 0.08;
      camera.far = questMode ? 900 : 1400;
      camera.updateProjectionMatrix();
    }catch(_err){}
  });

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, questMode ? 0.68 : 0.9));
  });

  return { scene, camera, renderer };
}
