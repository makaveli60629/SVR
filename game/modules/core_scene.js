import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function createCore({ containerId = "app" } = {}){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);

  const ua = navigator.userAgent || "";
  const isQuest = /Quest|OculusBrowser|Meta Quest/i.test(ua);
  const isMobile = isQuest || /Android|Mobile|iPhone|iPad/i.test(ua);

  const camera = new THREE.PerspectiveCamera(isQuest ? 68 : 70, window.innerWidth / window.innerHeight, 0.2, 1600);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });

  renderer.setClearColor(0x050508, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.72));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  // SVR_1_4G_PERFORMANCE_LOCK: Quest blink/blank-frame reduction.
  renderer.xr.setFramebufferScaleFactor?.(0.72);
  renderer.xr.setFramebufferScaleFactor?.(isQuest ? 0.72 : 0.9);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = isQuest ? 0.90 : 1.0;
  shadowOff(renderer);

  document.getElementById(containerId).appendChild(renderer.domElement);
  const vrButton = VRButton.createButton(renderer, {
    requiredFeatures: ["local-floor"],
    optionalFeatures: ["bounded-floor", "hand-tracking"]
  });
  vrButton.classList.add("svr-vr-button");
  document.body.appendChild(vrButton);

  window.SVR_RENDERER = renderer;
  window.SVR_MAIN_CAMERA = camera;
  window.SVR_RENDER_PROFILE = {
    isQuest,
    isMobile,
    pixelRatio: renderer.getPixelRatio(),
    framebufferScale: isQuest ? 0.72 : 0.9,
    antialias: !isMobile,
    build: "LOBBY-ORG-1-2-COMFORT-RENDERER"
  };

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

function shadowOff(renderer){
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.BasicShadowMap;
}

