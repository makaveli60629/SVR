import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function createCore({ containerId = "app" } = {}){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);

  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.09, 1700);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false
  });

  renderer.setClearColor(0x050508, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.50));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  if (renderer.xr.setFramebufferScaleFactor) renderer.xr.setFramebufferScaleFactor(0.50);
  try { renderer.xr.setFoveation?.(1.0); } catch {}
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = false;
  renderer.sortObjects = false;

  document.getElementById(containerId).appendChild(renderer.domElement);
  const vrButton = VRButton.createButton(renderer, {
    requiredFeatures: ["local-floor"],
    optionalFeatures: ["bounded-floor", "hand-tracking"]
  });
  vrButton.classList.add("svr-vr-button");
  document.body.appendChild(vrButton);

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.SVR_XR_RENDERER_LOCK = {
    phase: "PHASE-132-FLOOR-PERFORMANCE-RUNTIME-REPAIR-LOCK",
    nearPlane: 0.09,
    farPlane: 1700,
    pixelRatioMax: 0.50,
    framebufferScale: 0.50,
    foveation: 1.0,
    antialias: false,
    shadows: false,
    sortObjects: false
  };
  window.SVR_CORE_SCENE = scene;
  window.SVR_CORE_CAMERA = camera;
  window.SVR_CORE_RENDERER = renderer;

  return { scene, camera, renderer };
}
